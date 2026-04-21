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
const SHIKI = "https://shikimori.one/api";

async function jikanGet(path) {
  const res = await fetch(`${JIKAN}${path}`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

async function shikiGet(path) {
  const res = await fetch(`${SHIKI}${path}`, {
    headers: { "User-Agent": settings.shikiUserAgent || "Anibd/1.0" },
  });
  if (!res.ok) throw new Error(`Shikimori ${res.status}`);
  return res.json();
}

// Kodik search (needs token)
async function kodikSearch(shikimoriId) {
  if (!settings.kodikToken) return null;
  try {
    const res = await fetch(
      `https://kodikapi.com/search?token=${encodeURIComponent(settings.kodikToken)}&shikimori_id=${shikimoriId}&with_episodes=true&translation_type=voice`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results || [];
  } catch {
    return null;
  }
}

// --------------- Known UA dub studio IDs for Kodik ---------------
// These are well-known Kodik translation IDs for Ukrainian studios.
// Not exhaustive — add more as discovered.
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

// --------------- Kodik player embed URL ---------------

function kodikPlayerUrl(malId, uaOnly) {
  // Kodik find-player endpoint works without API token as an iframe
  let url = `https://kodik.info/find-player?shikimoriID=${malId}`;
  if (uaOnly || settings.uaOnly) {
    url += `&only_translations=${UA_TRANSLATION_IDS.join(",")}`;
  }
  return url;
}

// --------------- UA studios data ---------------

const UA_STUDIOS = [
  {
    name: "Amanogawa",
    desc: "Одна з найбільших студій українського дубляжу аніме. Понад 280+ аніме.",
    links: {
      "Сайт": "https://amanogawa.space",
      "Telegram": "https://t.me/amanogawa_ua",
      "YouTube": "https://www.youtube.com/@Amanogawa_UA",
    },
  },
  {
    name: "AniTube",
    desc: "Великий каталог аніме з українським дубляжем та субтитрами.",
    links: {
      "Сайт": "https://anitube.in.ua",
      "Telegram": "https://t.me/anitube_in_ua",
    },
  },
  {
    name: "AniHub",
    desc: "Агрегатор українських студій дубляжу з каталогом та плеєром.",
    links: {
      "Сайт": "https://anihub.in.ua",
    },
  },
  {
    name: "NewComers",
    desc: "Студія фандубу аніме українською мовою.",
    links: {
      "Telegram": "https://t.me/newcomers_ua",
      "YouTube": "https://www.youtube.com/@NewComersUA",
    },
  },
  {
    name: "FanVoxUA",
    desc: "Український озвучувальний фандаб-проєкт.",
    links: {
      "Telegram": "https://t.me/fanvoxua",
    },
  },
  {
    name: "ДніпроФільм / DniproFilm",
    desc: "Студія дубляжу з Дніпра — аніме, фільми, серіали.",
    links: {
      "Telegram": "https://t.me/dniprofilm",
    },
  },
  {
    name: "Uakino",
    desc: "Портал з фільмами, серіалами та аніме українською.",
    links: {
      "Сайт": "https://uakino.me",
    },
  },
  {
    name: "UniverseUA",
    desc: "Молода студія українського дубляжу аніме.",
    links: {
      "Telegram": "https://t.me/universeua",
    },
  },
  {
    name: "Turemka",
    desc: "Студія українського аніме-дубляжу.",
    links: {
      "Telegram": "https://t.me/turemka_ua",
    },
  },
];

// --------------- Rendering helpers ---------------

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const app = () => $("#app");

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "style" && typeof v === "object")
      Object.assign(el.style, v);
    else el.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === "string") el.append(c);
    else if (c) el.append(c);
  }
  return el;
}

function animeCard(anime) {
  const score = anime.score ?? anime.mean ?? "";
  const year = anime.year || (anime.aired?.prop?.from?.year) || "";
  const type = anime.type || "";
  const title = anime.title || anime.title_english || anime.name || "";
  const poster = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "";
  const malId = anime.mal_id;

  const card = h(
    "button",
    { class: "card", "data-mal-id": malId, onClick: () => openAnime(malId) },
    h("div", { class: "card__poster", style: { backgroundImage: `url(${poster})` } },
      score ? h("span", { class: "card__badge" }, String(score)) : null
    ),
    h("div", { class: "card__body" },
      h("p", { class: "card__title" }, title),
      h("div", { class: "card__meta" },
        year ? h("span", {}, String(year)) : null,
        type ? h("span", {}, type) : null
      )
    )
  );
  return card;
}

function renderGrid(animes) {
  const grid = h("div", { class: "grid" });
  for (const a of animes) grid.append(animeCard(a));
  return grid;
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

async function pageHome() {
  app().innerHTML = "";
  // Hero
  const hero = h(
    "div",
    { class: "hero" },
    h("h1", {}, "Аніме українською"),
    h("p", {}, "Вбудований плеєр із підтримкою Kodik, каталог з Shikimori / MyAnimeList та посилання на українські студії дубляжу."),
    h("div", { class: "chips" },
      h("span", { class: "chip chip--accent" }, "Kodik плеєр"),
      h("span", { class: "chip chip--accent" }, "Shikimori"),
      h("span", { class: "chip" }, "Amanogawa"),
      h("span", { class: "chip" }, "AniTube"),
      h("span", { class: "chip" }, "AniHub"),
      h("span", { class: "chip" }, "NewComers"),
      h("span", { class: "chip" }, "FanVoxUA"),
      h("span", { class: "chip" }, "Uakino"),
    )
  );
  app().append(hero);

  // Popular section
  const section = h("div", { class: "section" });
  section.append(h("div", { class: "section-head" },
    h("h2", {}, "Популярне зараз"),
    h("a", { href: "#/top" }, "Показати все →")
  ));
  section.append(renderLoading());
  app().append(section);

  try {
    const data = await jikanGet("/top/anime?filter=airing&limit=24&sfw=true");
    section.replaceChild(renderGrid(data.data || []), section.lastChild);
  } catch (err) {
    section.replaceChild(renderError("Помилка завантаження: " + err.message), section.lastChild);
  }

  // UA studios preview
  const stSection = h("div", { class: "section" });
  stSection.append(h("div", { class: "section-head" },
    h("h2", {}, "Українські студії дубляжу"),
    h("a", { href: "#/studios" }, "Показати все →")
  ));
  const stGrid = h("div", { class: "studios" });
  for (const s of UA_STUDIOS.slice(0, 4)) stGrid.append(studioCard(s));
  stSection.append(stGrid);
  app().append(stSection);
}

async function pageTop() {
  app().innerHTML = "";
  const section = h("div", { class: "section" },
    h("h1", {}, "Топ аніме (за рейтингом)"),
    renderLoading()
  );
  app().append(section);

  try {
    const data = await jikanGet("/top/anime?limit=24&sfw=true");
    section.replaceChild(renderGrid(data.data || []), section.lastChild);
  } catch (err) {
    section.replaceChild(renderError("Помилка: " + err.message), section.lastChild);
  }
}

async function pageSeason() {
  app().innerHTML = "";
  const section = h("div", { class: "section" },
    h("h1", {}, "Аніме цього сезону"),
    renderLoading()
  );
  app().append(section);

  try {
    const data = await jikanGet("/seasons/now?limit=24&sfw=true");
    section.replaceChild(renderGrid(data.data || []), section.lastChild);
  } catch (err) {
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
  app().innerHTML = "";
  const section = h("div", { class: "section" },
    h("h1", {}, "Українські студії дубляжу аніме")
  );
  const grid = h("div", { class: "studios" });
  for (const s of UA_STUDIOS) grid.append(studioCard(s));
  section.append(grid);
  app().append(section);
}

async function pageSearch(query) {
  app().innerHTML = "";
  const section = h("div", { class: "section" },
    h("h1", {}, `Результати: «${query}»`),
    renderLoading()
  );
  app().append(section);

  try {
    const data = await jikanGet(`/anime?q=${encodeURIComponent(query)}&limit=24&sfw=true&order_by=popularity&sort=asc`);
    const items = data.data || [];
    section.replaceChild(
      items.length ? renderGrid(items) : renderEmpty("Нічого не знайдено для «" + query + "»"),
      section.lastChild
    );
  } catch (err) {
    section.replaceChild(renderError("Помилка: " + err.message), section.lastChild);
  }
}

async function pageAnime(malId) {
  app().innerHTML = "";
  const section = h("div", { class: "section" }, renderLoading());
  app().append(section);

  try {
    const data = await jikanGet(`/anime/${malId}/full`);
    const a = data.data;
    if (!a) { section.replaceChild(renderEmpty("Аніме не знайдено"), section.lastChild); return; }

    const title = a.title || "";
    const titleJp = a.title_japanese || "";
    const titleEn = a.title_english || "";
    const score = a.score || "";
    const year = a.year || "";
    const type = a.type || "";
    const episodes = a.episodes || "?";
    const status = a.status || "";
    const genres = (a.genres || []).map(g => g.name).join(", ");
    const synopsis = a.synopsis || "Опис відсутній.";
    const poster = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";

    const detail = h("div", { class: "detail" },
      h("div", { class: "detail__poster", style: { backgroundImage: `url(${poster})` } }),
      h("div", {},
        h("h1", {}, title),
        h("p", { class: "subtitle" }, [titleEn, titleJp].filter(Boolean).join(" · ")),
        h("div", { class: "meta" },
          score ? h("span", { class: "chip chip--accent" }, `★ ${score}`) : null,
          year ? h("span", { class: "chip" }, String(year)) : null,
          type ? h("span", { class: "chip" }, type) : null,
          h("span", { class: "chip" }, `${episodes} еп.`),
          status ? h("span", { class: "chip" }, status) : null,
        ),
        genres ? h("p", { class: "muted" }, genres) : null,
        h("div", { class: "actions" },
          h("button", { class: "btn btn--primary", onClick: () => openPlayer(malId, title) }, "Дивитися (Kodik)"),
          h("button", { class: "btn btn--primary", onClick: () => openPlayer(malId, title, true) }, "Дивитися (укр. дубляж)"),
          h("a", { class: "btn", href: `https://shikimori.one/animes/${malId}`, target: "_blank", rel: "noopener" }, "Shikimori"),
          h("a", { class: "btn", href: `https://amanogawa.space/search?q=${encodeURIComponent(title)}`, target: "_blank", rel: "noopener" }, "Amanogawa"),
          h("a", { class: "btn", href: `https://anihub.in.ua/search?q=${encodeURIComponent(title)}`, target: "_blank", rel: "noopener" }, "AniHub"),
          h("a", { class: "btn", href: `https://anitube.in.ua/search?q=${encodeURIComponent(title)}`, target: "_blank", rel: "noopener" }, "AniTube"),
          h("a", { class: "btn", href: `https://uakino.me/search?q=${encodeURIComponent(title)}`, target: "_blank", rel: "noopener" }, "Uakino"),
        ),
        h("p", { class: "synopsis" }, synopsis),
      )
    );

    section.replaceChild(detail, section.lastChild);
  } catch (err) {
    section.replaceChild(renderError("Помилка: " + err.message), section.lastChild);
  }
}

// --------------- Player ---------------

const playerDialog = $("#player-dialog");
const playerMount = $("#player-mount");
const playerTitle = $("#player-title");
const playerSubtitle = $("#player-subtitle");
const playerSource = $("#player-source");
const playerClose = $("#player-close");
const playerOpenNew = $("#player-open-new");

let currentPlayerMalId = null;
let currentPlayerTitle = "";

function openPlayer(malId, title, forceUa = false) {
  currentPlayerMalId = malId;
  currentPlayerTitle = title || "";
  playerTitle.textContent = title || `MAL #${malId}`;
  playerSubtitle.textContent = `MAL ID: ${malId}`;
  if (forceUa) {
    playerSource.value = "kodik-ua";
  } else {
    playerSource.value = settings.uaOnly ? "kodik-ua" : "kodik";
  }
  loadPlayerSource();
  playerDialog.showModal();
}

function loadPlayerSource() {
  const src = playerSource.value;
  playerMount.innerHTML = "";

  if (src === "kodik" || src === "kodik-ua") {
    const uaOnly = src === "kodik-ua";
    const url = kodikPlayerUrl(currentPlayerMalId, uaOnly);
    const iframe = h("iframe", {
      src: url,
      allow: "autoplay; fullscreen; encrypted-media",
      allowfullscreen: "true",
      referrerpolicy: "origin",
    });
    playerMount.append(iframe);
    playerOpenNew.onclick = () => window.open(url, "_blank");
  } else if (src === "amanogawa") {
    const url = `https://amanogawa.space/search?q=${encodeURIComponent(currentPlayerTitle)}`;
    playerMount.innerHTML = `<div class="player-placeholder">
      <div style="text-align:center">
        <p>Amanogawa — зовнішнє джерело</p>
        <a class="btn btn--primary" href="${url}" target="_blank" rel="noopener">Перейти на Amanogawa</a>
      </div>
    </div>`;
    playerOpenNew.onclick = () => window.open(url, "_blank");
  } else if (src === "anihub") {
    const url = `https://anihub.in.ua/search?q=${encodeURIComponent(currentPlayerTitle)}`;
    playerMount.innerHTML = `<div class="player-placeholder">
      <div style="text-align:center">
        <p>AniHub — зовнішнє джерело</p>
        <a class="btn btn--primary" href="${url}" target="_blank" rel="noopener">Перейти на AniHub</a>
      </div>
    </div>`;
    playerOpenNew.onclick = () => window.open(url, "_blank");
  }
}

playerSource.addEventListener("change", loadPlayerSource);
playerClose.addEventListener("click", () => { playerDialog.close(); playerMount.innerHTML = ""; });
playerDialog.addEventListener("click", (e) => {
  if (e.target === playerDialog) { playerDialog.close(); playerMount.innerHTML = ""; }
});

// Shortcut: open anime → player
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
  // Reset active nav
  document.querySelectorAll("[data-route]").forEach((a) => {
    a.classList.toggle("is-active", hash.startsWith(`#/${a.dataset.route === "home" ? "" : a.dataset.route}`));
  });

  if (hash === "#/" || hash === "#") {
    pageHome();
  } else if (hash === "#/top") {
    pageTop();
  } else if (hash === "#/season") {
    pageSeason();
  } else if (hash === "#/studios") {
    pageStudios();
  } else if (hash.startsWith("#/search/")) {
    const q = decodeURIComponent(hash.slice(9));
    pageSearch(q);
  } else if (hash.startsWith("#/anime/")) {
    const id = parseInt(hash.slice(8), 10);
    if (!isNaN(id)) pageAnime(id);
    else pageHome();
  } else {
    pageHome();
  }
}

window.addEventListener("hashchange", route);

// Search form
const searchForm = $("#search-form");
const searchInput = $("#search-input");
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q) window.location.hash = `#/search/${encodeURIComponent(q)}`;
});

// Boot
route();
