/* ===================================================================
   Anibd — Ukrainian-dubbed anime aggregator
   Sources: Jikan (MAL) for catalog, Kodik for player, Shikimori for
   links, plus external UA dub studios (Amanogawa, AniTube, etc.)
   =================================================================== */

// --------------- Config / storage ---------------

const STORAGE_KEY = "anibd_settings";
const defaults = {
  kodikToken: "",
  uaOnly: false,
  shikiUserAgent: "Anibd/1.0",
};

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaults };
  }
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

let settings = loadSettings();

// --------------- API helpers ---------------

const JIKAN = "https://api.jikan.moe/v4";

async function jikanGet(path) {
  const res = await fetch(`${JIKAN}${path}`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

// --------------- Known UA dub studio IDs for Kodik ---------------
const UA_TRANSLATION_IDS = [
  610,  // Amanogawa
  735,  // NewComers
  2398, // FanVoxUA
  2224, // AniTube.in.ua
  2095, // ДніпроФільм (DniproFilm)
  1948, // UkrDub
  2501, // AniUA
  2600, // UniverseUA
  2344, // Turemka
];

// Curated list of MAL IDs with known Ukrainian dubs from Amanogawa/AniTube/NewComers.
// Used to flag cards with a "UA dub" badge without Kodik API token.
const UA_KNOWN_MAL_IDS = new Set([
  52991, // Frieren
  51009, // Jujutsu Kaisen S2
  40748, // Jujutsu Kaisen
  16498, // Attack on Titan
  38000, // Demon Slayer
  127230, // Chainsaw Man
  21,    // One Piece
  20,    // Naruto
  31964, // My Hero Academia
  54492, // Kaiju No. 8
  44511, // Chainsaw Man
  5114,  // Fullmetal Alchemist: Brotherhood
  9253,  // Steins;Gate
  30276, // One Punch Man
  11061, // Hunter x Hunter (2011)
  28977, // Gintama
  34599, // Made in Abyss
  37779, // Yakusoku no Neverland
  41467, // Bleach: Sennen Kessen-hen
  52701, // Oshi no Ko
  48583, // Shingeki no Kyojin: The Final Season Part 2
  50265, // Spy x Family
  56647, // Bocchi the Rock?!
  55791, // Kusuriya
  60022, // One Piece Fan Letter
]);

// --------------- Source URL builders ---------------

// Kodik mirror — kodik.info is DNS-blocked in many UA ISPs.
// kodik.biz / kodik.cc serve the same find-player endpoint and are often
// still reachable. If user has a preferred mirror, it's saved in settings.
const KODIK_MIRRORS = ["kodik.biz", "kodik.cc", "kodik.info"];
function kodikHost() {
  return (settings.kodikHost && KODIK_MIRRORS.includes(settings.kodikHost))
    ? settings.kodikHost
    : KODIK_MIRRORS[0];
}
function kodikPlayerUrl(malId, uaOnly) {
  let url = `https://${kodikHost()}/find-player?shikimoriID=${malId}`;
  if (uaOnly) url += `&only_translations=${UA_TRANSLATION_IDS.join(",")}`;
  return url;
}

function sourceUrl(source, malId, title, extra = {}) {
  const q = encodeURIComponent(title || "");
  switch (source) {
    case "hls":       return { url: "",                                kind: "hls" };
    case "trailer":   return { url: extra.trailerEmbedUrl || "",       kind: "trailer" };
    case "kodik-ua":  return { url: kodikPlayerUrl(malId, true),       kind: "iframe" };
    case "kodik":     return { url: kodikPlayerUrl(malId, false),      kind: "iframe" };
    case "amanogawa": return { url: `https://amanogawa.space/?s=${q}`,                                                      kind: "link", host: "amanogawa.space" };
    case "anitube":   return { url: `https://anitube.in.ua/index.php?do=search&subaction=search&story=${q}`,                 kind: "link", host: "anitube.in.ua" };
    case "anihub":    return { url: `https://anihub.in.ua/search/${q}/`,                                                     kind: "link", host: "anihub.in.ua" };
    case "newcomers": return { url: `https://t.me/newcomers_ua`,                                                              kind: "link", host: "Telegram" };
    case "fanvoxua":  return { url: `https://t.me/fanvoxua`,                                                                  kind: "link", host: "Telegram" };
    case "uakino":    return { url: `https://uakino.me/search.html?do=search&subaction=search&story=${q}`,                    kind: "link", host: "uakino.me" };
    default:          return { url: kodikPlayerUrl(malId, false),      kind: "iframe" };
  }
}

const SOURCE_LABELS = {
  "hls":       "Онлайн — вбудований HLS-плеєр (AniLibria)",
  "trailer":   "Офіційний трейлер (YouTube)",
  "kodik-ua":  "Kodik · тільки український дубляж",
  "kodik":     "Kodik · усі озвучки (вкл. рос./англ./япон.)",
  "amanogawa": "Amanogawa — українська студія дубляжу",
  "anitube":   "AniTube — каталог з укр. дубляжем і субтитрами",
  "anihub":    "AniHub — український агрегатор",
  "newcomers": "NewComers — українська фандаб-студія",
  "fanvoxua":  "FanVoxUA — український фандаб",
  "uakino":    "Uakino — фільми/серіали/аніме українською",
};

// --------------- AniLibria (direct HLS) ---------------
// Public JSON API, no token required. We search by title and return the
// highest-quality HLS stream for episode 1 (user can browse other episodes
// by navigating inside the stream itself via AniLibria's public site).
const ANILIBRIA_API = "https://api.anilibria.tv/v3";
const anilibriaCache = new Map(); // malId -> { stream, poster, episodes, title }

async function anilibriaLookup(title) {
  if (!title) return null;
  const search = title.split("(")[0].trim();
  const q = encodeURIComponent(search);
  const res = await fetch(`${ANILIBRIA_API}/title/search?search=${q}&limit=1&filter=id,names,code,player,posters`);
  if (!res.ok) throw new Error(`AniLibria HTTP ${res.status}`);
  const data = await res.json();
  const item = data?.list?.[0];
  if (!item || !item.player || !item.player.host || !item.player.list) return null;
  const episodes = Object.values(item.player.list).sort((a, b) => (a.episode || 0) - (b.episode || 0));
  const ep = episodes[0];
  if (!ep || !ep.hls) return null;
  const path = ep.hls.fhd || ep.hls.hd || ep.hls.sd;
  if (!path) return null;
  return {
    stream: `https://${item.player.host}${path}`,
    title: (item.names && (item.names.ru || item.names.en)) || search,
    totalEpisodes: episodes.length,
    externalUrl: item.code ? `https://anilibria.tv/release/${item.code}.html` : null,
  };
}

// --------------- YouTube trailer ---------------
function youtubeEmbedFrom(trailer) {
  // Jikan returns { url, embed_url, youtube_id } on /anime/<id>/full.
  if (!trailer) return "";
  if (trailer.embed_url) return trailer.embed_url;
  if (trailer.youtube_id) return `https://www.youtube.com/embed/${trailer.youtube_id}?autoplay=0&rel=0`;
  return "";
}

// --------------- UA studios data ---------------

const UA_STUDIOS = [
  { name: "Amanogawa",   desc: "Одна з найбільших студій українського дубляжу аніме. Понад 280+ аніме.", links: { "Сайт": "https://amanogawa.space", "Telegram": "https://t.me/amanogawa_ua", "YouTube": "https://www.youtube.com/@Amanogawa_UA" } },
  { name: "AniTube",     desc: "Великий каталог аніме з українським дубляжем та субтитрами.",           links: { "Сайт": "https://anitube.in.ua", "Telegram": "https://t.me/anitube_in_ua" } },
  { name: "AniHub",      desc: "Агрегатор українських студій дубляжу з каталогом та плеєром.",           links: { "Сайт": "https://anihub.in.ua" } },
  { name: "NewComers",   desc: "Студія фандубу аніме українською мовою.",                                links: { "Telegram": "https://t.me/newcomers_ua", "YouTube": "https://www.youtube.com/@NewComersUA" } },
  { name: "FanVoxUA",    desc: "Український озвучувальний фандаб-проєкт.",                               links: { "Telegram": "https://t.me/fanvoxua" } },
  { name: "ДніпроФільм", desc: "Студія дубляжу з Дніпра — аніме, фільми, серіали.",                      links: { "Telegram": "https://t.me/dniprofilm" } },
  { name: "Uakino",      desc: "Портал з фільмами, серіалами та аніме українською.",                     links: { "Сайт": "https://uakino.me" } },
  { name: "UniverseUA",  desc: "Молода студія українського дубляжу аніме.",                              links: { "Telegram": "https://t.me/universeua" } },
  { name: "Turemka",     desc: "Студія українського аніме-дубляжу.",                                     links: { "Telegram": "https://t.me/turemka_ua" } },
];

// --------------- Rendering helpers ---------------

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const app = () => $("#app");

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v);
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) {
      for (const cc of c) if (cc) el.append(typeof cc === "string" ? document.createTextNode(cc) : cc);
    } else if (typeof c === "string") el.append(document.createTextNode(c));
    else el.append(c);
  }
  return el;
}

const PLAY_ICON_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

function animeCard(anime) {
  const score = anime.score ?? anime.mean ?? "";
  const year = anime.year || (anime.aired?.prop?.from?.year) || "";
  const type = anime.type || "";
  const title = anime.title || anime.title_english || anime.name || "";
  const poster =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url ||
    "";
  const malId = anime.mal_id;
  const hasUa = UA_KNOWN_MAL_IDS.has(malId);

  const badges = h("div", { class: "card__badges" });
  if (score) badges.append(h("span", { class: "card__badge" }, String(score)));
  if (hasUa) badges.append(h("span", { class: "card__badge card__badge--ua" }, "UA дубляж"));

  const play = h("div", { class: "card__play", "aria-hidden": "true" });
  play.innerHTML = PLAY_ICON_SVG;

  return h(
    "button",
    { class: "card", "data-mal-id": malId, onClick: () => openAnime(malId), title },
    h("div", { class: "card__poster", style: { backgroundImage: `url("${poster}")` } },
      badges,
      play,
    ),
    h("div", { class: "card__body" },
      h("p", { class: "card__title" }, title),
      h("div", { class: "card__meta" },
        year ? h("span", {}, String(year)) : null,
        type ? h("span", {}, type) : null
      )
    )
  );
}

function renderGrid(animes) {
  const grid = h("div", { class: "grid" });
  for (const a of animes) grid.append(animeCard(a));
  return grid;
}

function renderRow(animes) {
  const track = h("div", { class: "row__track" });
  for (const a of animes) track.append(animeCard(a));
  return h("div", { class: "row" }, track);
}

function renderSkeletonRow(count = 8) {
  const track = h("div", { class: "skeleton-row" });
  for (let i = 0; i < count; i++) track.append(h("div", { class: "skeleton" }));
  return track;
}

function renderLoading() {
  return h("div", { class: "state" }, h("div", { class: "spinner" }), h("p", {}, "Завантаження…"));
}
function renderEmpty(msg = "Нічого не знайдено") {
  return h("div", { class: "state" }, h("p", {}, msg));
}
function renderError(msg) {
  return h("div", { class: "state" }, h("p", { style: { color: "var(--danger)" } }, msg));
}

// --------------- Pages ---------------

// Monotonically increasing token so async page handlers can detect when the
// user navigated away mid-fetch and stop mutating the DOM of the new page.
let renderToken = 0;
function startPage() { return ++renderToken; }
function isCurrentPage(token) { return token === renderToken; }

// Cleanup handler fired before the next route takes over (e.g. stop hero rotator).
let pageCleanup = null;
function setCleanup(fn) {
  if (pageCleanup) try { pageCleanup(); } catch {}
  pageCleanup = fn;
}

async function pageHome() {
  const token = startPage();
  setCleanup(null);
  app().innerHTML = "";

  // Hero placeholder — will be populated with top-airing data
  const hero = h("section", { class: "cinema-hero" },
    h("div", { class: "cinema-hero__bg" }),
    h("div", { class: "cinema-hero__inner" },
      h("span", { class: "cinema-hero__eyebrow" }, "Аніме українською"),
      h("h1", { class: "cinema-hero__title" }, "Завантаження…"),
      h("p", { class: "cinema-hero__synopsis" }, " "),
    ),
    h("div", { class: "cinema-hero__dots" }),
  );
  app().append(hero);

  // Rows
  const sectionPopular = h("section", { class: "section wrap" },
    h("div", { class: "section-head" },
      h("h2", {}, "Популярне зараз"),
      h("a", { href: "#/top" }, "Показати все →"),
    ),
    renderSkeletonRow(),
  );
  const sectionSeason = h("section", { class: "section wrap" },
    h("div", { class: "section-head" },
      h("h2", {}, "Новий сезон"),
      h("a", { href: "#/season" }, "Показати все →"),
    ),
    renderSkeletonRow(),
  );
  const sectionUa = h("section", { class: "section wrap" },
    h("div", { class: "section-head" },
      h("h2", {}, "З українським дубляжем"),
      h("a", { href: "#/studios" }, "Українські студії →"),
    ),
    renderSkeletonRow(),
  );
  const sectionStudios = h("section", { class: "section wrap" },
    h("div", { class: "section-head" },
      h("h2", {}, "Українські студії дубляжу"),
      h("a", { href: "#/studios" }, "Показати всі →"),
    ),
  );
  const stGrid = h("div", { class: "studios" });
  for (const s of UA_STUDIOS.slice(0, 4)) stGrid.append(studioCard(s));
  sectionStudios.append(stGrid);

  app().append(sectionPopular, sectionSeason, sectionUa, sectionStudios);

  // Fire fetches in parallel
  const [airingRes, seasonRes] = await Promise.allSettled([
    jikanGet("/top/anime?filter=airing&limit=20&sfw=true"),
    jikanGet("/seasons/now?limit=20&sfw=true"),
  ]);
  if (!isCurrentPage(token)) return;

  const airing = airingRes.status === "fulfilled" ? (airingRes.value.data || []) : [];
  const season = seasonRes.status === "fulfilled" ? (seasonRes.value.data || []) : [];

  // Hero — rotate through top 5 anime with backdrops
  if (airing.length > 0) {
    const heroItems = airing.slice(0, 5);
    const bg = hero.querySelector(".cinema-hero__bg");
    const inner = hero.querySelector(".cinema-hero__inner");
    const dotsWrap = hero.querySelector(".cinema-hero__dots");
    let idx = 0;

    function paintHero(i) {
      const a = heroItems[i];
      const img =
        a.images?.webp?.large_image_url ||
        a.images?.jpg?.large_image_url ||
        a.images?.jpg?.image_url || "";
      bg.style.backgroundImage = `url("${img}")`;
      inner.innerHTML = "";
      inner.append(
        h("span", { class: "cinema-hero__eyebrow" }, `№ ${i + 1} у топі зараз`),
        h("h1", { class: "cinema-hero__title" }, a.title || a.title_english || ""),
        h("div", { class: "cinema-hero__meta" },
          a.score ? h("span", {}, h("b", {}, "★ " + a.score)) : null,
          a.year ? h("span", {}, String(a.year)) : null,
          a.type ? h("span", {}, a.type) : null,
          a.episodes ? h("span", {}, `${a.episodes} еп.`) : null,
        ),
        h("p", { class: "cinema-hero__synopsis" }, a.synopsis || ""),
        h("div", { class: "cinema-hero__actions" },
          h("button", {
            class: "btn btn--primary",
            onClick: () => openPlayer(a.mal_id, a.title || "", "hls", youtubeEmbedFrom(a.trailer)),
          }, "▶ Дивитися онлайн"),
          h("button", {
            class: "btn",
            onClick: () => openAnime(a.mal_id),
          }, "Детальніше"),
        ),
      );
      dotsWrap.innerHTML = "";
      heroItems.forEach((_, j) => {
        dotsWrap.append(h("button", {
          class: "cinema-hero__dot" + (j === i ? " is-active" : ""),
          "aria-label": `Слайд ${j + 1}`,
          onClick: () => { idx = j; paintHero(j); },
        }));
      });
    }
    paintHero(0);

    const timer = setInterval(() => {
      if (!isCurrentPage(token)) { clearInterval(timer); return; }
      idx = (idx + 1) % heroItems.length;
      paintHero(idx);
    }, 8000);
    setCleanup(() => clearInterval(timer));

    sectionPopular.replaceChild(renderRow(airing), sectionPopular.lastChild);
  } else {
    sectionPopular.replaceChild(renderError("Не вдалося завантажити топ."), sectionPopular.lastChild);
  }

  if (season.length > 0) {
    sectionSeason.replaceChild(renderRow(season), sectionSeason.lastChild);
  } else {
    sectionSeason.replaceChild(renderError("Не вдалося завантажити сезон."), sectionSeason.lastChild);
  }

  // UA row — subset of airing+season that are in UA_KNOWN_MAL_IDS;
  // if too few, pad with search for popular known-UA titles.
  const seen = new Set();
  const uaCandidates = [...airing, ...season].filter(a => {
    if (!UA_KNOWN_MAL_IDS.has(a.mal_id) || seen.has(a.mal_id)) return false;
    seen.add(a.mal_id);
    return true;
  });

  if (uaCandidates.length < 8) {
    // Pad by fetching well-known UA-dubbed titles from Jikan by id (parallel)
    const targets = [52991, 38000, 16498, 127230, 50265, 52701, 51009, 56647, 55791, 5114, 9253, 11061];
    const need = targets.filter(id => !seen.has(id)).slice(0, 12);
    const extras = await Promise.allSettled(need.map(id => jikanGet(`/anime/${id}`)));
    if (!isCurrentPage(token)) return;
    for (const r of extras) {
      if (r.status === "fulfilled" && r.value?.data) uaCandidates.push(r.value.data);
    }
  }

  if (uaCandidates.length > 0) {
    sectionUa.replaceChild(renderRow(uaCandidates), sectionUa.lastChild);
  } else {
    sectionUa.replaceChild(renderEmpty("Поки що не знайдено UA-дубляжу серед трендів."), sectionUa.lastChild);
  }
}

async function pageTop() {
  const token = startPage();
  setCleanup(null);
  app().innerHTML = "";
  const section = h("section", { class: "section wrap" },
    h("h1", {}, "Топ аніме (за рейтингом)"),
    renderLoading()
  );
  app().append(section);

  try {
    const data = await jikanGet("/top/anime?limit=24&sfw=true");
    if (!isCurrentPage(token)) return;
    section.replaceChild(renderGrid(data.data || []), section.lastChild);
  } catch (err) {
    if (!isCurrentPage(token)) return;
    section.replaceChild(renderError("Помилка: " + err.message), section.lastChild);
  }
}

async function pageSeason() {
  const token = startPage();
  setCleanup(null);
  app().innerHTML = "";
  const section = h("section", { class: "section wrap" },
    h("h1", {}, "Аніме цього сезону"),
    renderLoading()
  );
  app().append(section);

  try {
    const data = await jikanGet("/seasons/now?limit=24&sfw=true");
    if (!isCurrentPage(token)) return;
    section.replaceChild(renderGrid(data.data || []), section.lastChild);
  } catch (err) {
    if (!isCurrentPage(token)) return;
    section.replaceChild(renderError("Помилка: " + err.message), section.lastChild);
  }
}

function studioCard(s) {
  const links = h("div", { class: "links" });
  for (const [label, url] of Object.entries(s.links)) {
    links.append(h("a", { href: url, target: "_blank", rel: "noopener" }, label));
  }
  return h("div", { class: "studio" },
    h("h3", {}, s.name),
    h("p", {}, s.desc),
    links
  );
}

function pageStudios() {
  startPage();
  setCleanup(null);
  app().innerHTML = "";
  const section = h("section", { class: "section wrap" },
    h("h1", {}, "Українські студії дубляжу аніме")
  );
  const grid = h("div", { class: "studios" });
  for (const s of UA_STUDIOS) grid.append(studioCard(s));
  section.append(grid);
  app().append(section);
}

async function pageSearch(query) {
  const token = startPage();
  setCleanup(null);
  app().innerHTML = "";
  const section = h("section", { class: "section wrap" },
    h("h1", {}, `Результати: «${query}»`),
    renderLoading()
  );
  app().append(section);

  try {
    const data = await jikanGet(`/anime?q=${encodeURIComponent(query)}&limit=24&sfw=true&order_by=popularity&sort=asc`);
    if (!isCurrentPage(token)) return;
    const items = data.data || [];
    section.replaceChild(
      items.length ? renderGrid(items) : renderEmpty("Нічого не знайдено для «" + query + "»"),
      section.lastChild
    );
  } catch (err) {
    if (!isCurrentPage(token)) return;
    section.replaceChild(renderError("Помилка: " + err.message), section.lastChild);
  }
}

async function pageAnime(malId) {
  const token = startPage();
  setCleanup(null);
  app().innerHTML = "";
  const heroWrap = h("div", { class: "detail-hero" },
    h("div", { class: "detail-hero__bg" }),
    h("div", { class: "wrap" }, renderLoading()),
  );
  app().append(heroWrap);

  try {
    const data = await jikanGet(`/anime/${malId}/full`);
    if (!isCurrentPage(token)) return;
    const a = data.data;
    if (!a) {
      heroWrap.querySelector(".wrap").replaceChild(renderEmpty("Аніме не знайдено"), heroWrap.querySelector(".wrap").firstChild);
      return;
    }

    const title = a.title || "";
    const titleJp = a.title_japanese || "";
    const titleEn = a.title_english || "";
    const poster =
      a.images?.webp?.large_image_url ||
      a.images?.jpg?.large_image_url ||
      a.images?.jpg?.image_url || "";
    const genres = (a.genres || []).map(g => g.name).join(", ");
    const hasUa = UA_KNOWN_MAL_IDS.has(a.mal_id);

    heroWrap.querySelector(".detail-hero__bg").style.backgroundImage = `url("${poster}")`;
    const inner = heroWrap.querySelector(".wrap");
    inner.innerHTML = "";

    const detail = h("div", { class: "detail" },
      h("div", { class: "detail__poster", style: { backgroundImage: `url("${poster}")` } }),
      h("div", {},
        hasUa ? h("span", { class: "chip", style: { background: "var(--ua-green)", color: "#082b15", border: "0", fontWeight: "700", marginBottom: "8px" } }, "UA дубляж доступний") : null,
        h("h1", {}, title),
        h("p", { class: "subtitle" }, [titleEn, titleJp].filter(Boolean).join(" · ")),
        h("div", { class: "meta" },
          a.score ? h("span", { class: "chip chip--accent" }, `★ ${a.score}`) : null,
          a.year ? h("span", { class: "chip" }, String(a.year)) : null,
          a.type ? h("span", { class: "chip" }, a.type) : null,
          h("span", { class: "chip" }, `${a.episodes || "?"} еп.`),
          a.status ? h("span", { class: "chip" }, a.status) : null,
        ),
        genres ? h("p", { class: "muted" }, genres) : null,
        h("div", { class: "actions" },
          h("button", { class: "btn btn--primary", onClick: () => openPlayer(malId, title, "hls", youtubeEmbedFrom(a.trailer)) }, "▶ Дивитися онлайн"),
          h("button", { class: "btn btn--ua", onClick: () => openPlayer(malId, title, "kodik-ua", youtubeEmbedFrom(a.trailer)) }, "▶ Kodik · UA-дубляж"),
          a.trailer && (a.trailer.embed_url || a.trailer.youtube_id)
            ? h("button", { class: "btn", onClick: () => openPlayer(malId, title, "trailer", youtubeEmbedFrom(a.trailer)) }, "▶ Трейлер")
            : null,
          h("a", { class: "btn", href: `https://shikimori.one/animes/${malId}`, target: "_blank", rel: "noopener" }, "Shikimori"),
          h("a", { class: "btn", href: `https://myanimelist.net/anime/${malId}`, target: "_blank", rel: "noopener" }, "MyAnimeList"),
        ),
        h("p", { class: "synopsis" }, a.synopsis || "Опис відсутній."),
      )
    );
    inner.append(detail);
  } catch (err) {
    if (!isCurrentPage(token)) return;
    const inner = heroWrap.querySelector(".wrap");
    inner.innerHTML = "";
    inner.append(renderError("Помилка: " + err.message));
  }
}

// --------------- Player ---------------

const playerDialog = $("#player-dialog");
const playerMount = $("#player-mount");
const playerTitle = $("#player-title");
const playerSubtitle = $("#player-subtitle");
const playerOpenNew = $("#player-open-new");
const playerClose = $("#player-close");
const playerTabs = document.querySelectorAll(".player-tab");

let currentPlayer = {
  malId: null,
  title: "",
  source: "hls",
  trailerEmbedUrl: "",
  hls: null, // active hls.js instance (for cleanup)
  renderId: 0,
};
let activeHls = null; // last hls.js instance, destroyed on tab switch/close

function destroyHls() {
  if (activeHls) {
    try { activeHls.destroy(); } catch {}
    activeHls = null;
  }
}

function openPlayer(malId, title, source = "hls", trailerEmbedUrl = "") {
  destroyHls();
  currentPlayer = { malId, title: title || "", source, trailerEmbedUrl, renderId: 0 };
  playerTitle.textContent = title || `MAL #${malId}`;
  loadPlayerSource(source);
  playerDialog.showModal();
}

function renderPlayerPlaceholder(iconText, heading, message, ctaLabel, ctaUrl, variant = "info") {
  playerMount.innerHTML = "";
  const placeholder = h("div", { class: "player-placeholder" },
    h("div", { class: "player-placeholder__inner" },
      h("div", { class: "player-placeholder__icon" }, iconText),
      h("h3", {}, heading),
      h("p", {}, message),
      ctaUrl ? h("a", { class: "btn btn--primary", href: ctaUrl, target: "_blank", rel: "noopener" }, ctaLabel) : null,
    ),
  );
  placeholder.dataset.variant = variant;
  playerMount.append(placeholder);
}

function mountIframe(url, allow = "autoplay; fullscreen; encrypted-media; picture-in-picture") {
  playerMount.innerHTML = "";
  const el = document.createElement("iframe");
  el.src = url;
  el.setAttribute("allow", allow);
  el.setAttribute("allowfullscreen", "true");
  el.setAttribute("referrerpolicy", "origin");
  playerMount.append(el);
}

async function mountHls(stream, renderId, externalUrl) {
  playerMount.innerHTML = "";
  const video = document.createElement("video");
  video.controls = true;
  video.autoplay = false;
  video.preload = "metadata";
  video.playsInline = true;
  playerMount.append(video);

  const Hls = window.Hls;
  // Native HLS (Safari/iOS) — just set src.
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = stream;
    return;
  }
  if (!Hls || !Hls.isSupported()) {
    renderPlayerPlaceholder(
      "⚠",
      "HLS не підтримується",
      "Браузер не вміє відтворювати HLS. Спробуй Chrome/Firefox або відкрий джерело у новій вкладці.",
      externalUrl ? "Відкрити на AniLibria" : null,
      externalUrl || null,
      "warn"
    );
    return;
  }
  const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
  activeHls = hls;
  hls.loadSource(stream);
  hls.attachMedia(video);
  hls.on(Hls.Events.ERROR, (_evt, data) => {
    if (currentPlayer.renderId !== renderId) return;
    if (data && data.fatal) {
      console.warn("hls.js fatal error", data);
      renderPlayerPlaceholder(
        "⚠",
        "Потік недоступний",
        "Не вдалося завантажити HLS-потік. Спробуй вкладку «Трейлер» або іншу вкладку джерела.",
        externalUrl ? "Відкрити на AniLibria" : null,
        externalUrl || null,
        "warn"
      );
      destroyHls();
    }
  });
}

async function loadPlayerSource(source) {
  destroyHls();
  const renderId = ++currentPlayer.renderId;
  currentPlayer.source = source;

  // Sync tab UI
  playerTabs.forEach((t) => {
    const isActive = t.dataset.source === source;
    t.classList.toggle("is-active", isActive);
    t.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  playerSubtitle.textContent = SOURCE_LABELS[source] || "";

  const descriptor = sourceUrl(source, currentPlayer.malId, currentPlayer.title, {
    trailerEmbedUrl: currentPlayer.trailerEmbedUrl,
  });

  // Default "open in new tab" target is the descriptor URL when there's one.
  playerOpenNew.onclick = () => {
    if (descriptor.url) window.open(descriptor.url, "_blank");
  };

  if (descriptor.kind === "iframe") {
    mountIframe(descriptor.url);
    return;
  }

  if (descriptor.kind === "trailer") {
    if (!descriptor.url) {
      renderPlayerPlaceholder(
        "▶",
        "Трейлер недоступний",
        "MyAnimeList не надає трейлера для цього аніме. Спробуй іншу вкладку джерела.",
        null, null, "info"
      );
      return;
    }
    mountIframe(descriptor.url, "autoplay; fullscreen; encrypted-media");
    return;
  }

  if (descriptor.kind === "hls") {
    renderPlayerPlaceholder("…", "Шукаємо потік на AniLibria…",
      "Звіряємо назву з базою AniLibria — це займає декілька секунд.",
      null, null, "info");
    try {
      let res = anilibriaCache.get(currentPlayer.malId);
      if (!res) {
        res = await anilibriaLookup(currentPlayer.title);
        if (res) anilibriaCache.set(currentPlayer.malId, res);
      }
      if (currentPlayer.renderId !== renderId) return;
      if (!res || !res.stream) {
        renderPlayerPlaceholder(
          "✕",
          "Не знайдено на AniLibria",
          `Назву «${currentPlayer.title}» не знайдено у відкритій базі AniLibria. Спробуй вкладки «Трейлер» або «Kodik».`,
          null, null, "warn"
        );
        return;
      }
      playerOpenNew.onclick = () => {
        if (res.externalUrl) window.open(res.externalUrl, "_blank");
      };
      await mountHls(res.stream, renderId, res.externalUrl);
    } catch (err) {
      if (currentPlayer.renderId !== renderId) return;
      renderPlayerPlaceholder(
        "⚠",
        "AniLibria недоступна",
        `Помилка: ${err.message}. Спробуй оновити сторінку або скористайся іншою вкладкою.`,
        null, null, "warn"
      );
    }
    return;
  }

  // External link card (Amanogawa / AniTube / AniHub / Telegram-based studios / Uakino)
  const host = descriptor.host || "зовнішньому сайті";
  renderPlayerPlaceholder(
    "↗",
    SOURCE_LABELS[source] || source,
    `Це зовнішній сайт — ${host} блокує вбудовування в iframe. Відкрий сторінку пошуку «${currentPlayer.title || "цього аніме"}» у новій вкладці.`,
    "Відкрити у новій вкладці",
    descriptor.url,
    "info"
  );
}

playerTabs.forEach((t) => {
  t.addEventListener("click", () => loadPlayerSource(t.dataset.source));
});

function closePlayer() {
  destroyHls();
  playerMount.innerHTML = "";
  playerDialog.close();
}
playerClose.addEventListener("click", closePlayer);
playerDialog.addEventListener("click", (e) => {
  if (e.target === playerDialog) closePlayer();
});

// Shortcut: open anime → detail page
function openAnime(malId) {
  window.location.hash = `#/anime/${malId}`;
}

// --------------- Settings dialog ---------------

const settingsBtn = $("#settings-btn");
const settingsDialog = $("#settings-dialog");
const settingsForm = $("#settings-form");
const settingsClose = $("#settings-close");

settingsBtn.addEventListener("click", () => {
  $("#settings-kodik-token").value = settings.kodikToken || "";
  $("#settings-ua-only").checked = settings.uaOnly || false;
  $("#settings-shiki-ua").value = settings.shikiUserAgent || "";
  settingsDialog.showModal();
});

settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  settings.kodikToken = $("#settings-kodik-token").value.trim();
  settings.uaOnly = $("#settings-ua-only").checked;
  settings.shikiUserAgent = $("#settings-shiki-ua").value.trim() || "Anibd/1.0";
  saveSettings(settings);
  settingsDialog.close();
});

settingsClose.addEventListener("click", () => settingsDialog.close());
settingsDialog.addEventListener("click", (e) => {
  if (e.target === settingsDialog) settingsDialog.close();
});

// --------------- Router ---------------

function route() {
  const hash = window.location.hash || "#/";
  document.querySelectorAll("[data-route]").forEach((a) => {
    const isHome = a.dataset.route === "home";
    const active = isHome
      ? (hash === "#/" || hash === "#")
      : hash.startsWith(`#/${a.dataset.route}`);
    a.classList.toggle("is-active", active);
  });

  if (hash === "#/" || hash === "#") pageHome();
  else if (hash === "#/top") pageTop();
  else if (hash === "#/season") pageSeason();
  else if (hash === "#/studios") pageStudios();
  else if (hash.startsWith("#/search/")) pageSearch(decodeURIComponent(hash.slice(9)));
  else if (hash.startsWith("#/anime/")) {
    const id = parseInt(hash.slice(8), 10);
    if (!isNaN(id)) pageAnime(id);
    else pageHome();
  } else pageHome();
}

window.addEventListener("hashchange", route);

// Search
const searchForm = $("#search-form");
const searchInput = $("#search-input");
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q) window.location.hash = `#/search/${encodeURIComponent(q)}`;
});

// Boot
route();
