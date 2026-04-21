// Maps AniHub / MAL English strings to Ukrainian for display.
// Keep this file the single source of truth for UI labels.

const STATUS_UA: Record<string, string> = {
  // AniHub lowercase
  ongoing: "Транслюється",
  completed: "Завершено",
  announced: "Незабаром",
  dropped: "Покинуто",
  // MAL English (kept for backward compat)
  "Currently Airing": "Транслюється",
  "Finished Airing": "Завершено",
  "Not yet aired": "Незабаром",
  Upcoming: "Незабаром",
};

const TYPE_UA: Record<string, string> = {
  // AniHub lowercase
  tv: "ТБ",
  tv_special: "ТБ-спешл",
  movie: "Фільм",
  ova: "OVA",
  ona: "ONA",
  special: "Спешл",
  music: "Музика",
  // MAL English
  TV: "ТБ",
  Movie: "Фільм",
  OVA: "OVA",
  ONA: "ONA",
  Special: "Спешл",
  "TV Special": "ТБ-спешл",
  Music: "Музика",
  CM: "Реклама",
  PV: "Промо",
};

const GENRE_UA: Record<string, string> = {
  Action: "Бойовик",
  Adventure: "Пригоди",
  "Avant Garde": "Авангард",
  "Award Winning": "Нагороджене",
  "Boys Love": "Бойс-лав",
  Comedy: "Комедія",
  Drama: "Драма",
  Ecchi: "Еччі",
  Erotica: "Еротика",
  Fantasy: "Фентезі",
  "Girls Love": "Ґьорлз-лав",
  Gourmet: "Ґурме",
  Hentai: "Хентай",
  Horror: "Жахи",
  Mystery: "Містика",
  Romance: "Романтика",
  "Sci-Fi": "Наукова фантастика",
  "Slice of Life": "Повсякденність",
  Sports: "Спорт",
  Supernatural: "Надприродне",
  Suspense: "Трилер",
  Thriller: "Трилер",
  // Themes / demographics that sometimes arrive in the same list
  Mecha: "Меха",
  Music: "Музика",
  Psychological: "Психологічне",
  "School": "Школа",
  Seinen: "Сейнен",
  Shoujo: "Сьоджьо",
  Shounen: "Сьонен",
  Josei: "Джосей",
  Kids: "Дитяче",
  "Martial Arts": "Бойові мистецтва",
  Military: "Військове",
  Historical: "Історичне",
  Parody: "Пародія",
  Samurai: "Самураї",
  Space: "Космос",
  Vampire: "Вампіри",
  Demons: "Демони",
  Magic: "Магія",
  "Super Power": "Суперсили",
  Game: "Ігри",
  Harem: "Гарем",
  Isekai: "Ісекай",
  "Iyashikei": "Іясікей",
  "Love Polygon": "Любовний багатокутник",
  "Mythology": "Міфологія",
  "Reincarnation": "Реінкарнація",
  "Time Travel": "Подорожі в часі",
  Workplace: "Робота",
  Detective: "Детектив",
  Medical: "Медичне",
  CGDCT: "CGDCT",
  "Cute Girls Doing Cute Things": "Милі дівчата",
  Racing: "Гонки",
  "School Life": "Шкільне життя",
  Survival: "Виживання",
  "Team Sports": "Командні види спорту",
  "Strategy Game": "Стратегія",
  Mecha2: "Меха",
};

export function translateStatus(s: string | null | undefined): string {
  if (!s) return "";
  return STATUS_UA[s] ?? s;
}

export function translateType(t: string | null | undefined): string {
  if (!t) return "";
  return TYPE_UA[t] ?? t;
}

export function translateGenre(g: string): string {
  return GENRE_UA[g] ?? g;
}

export function translateGenres(list: string[]): string[] {
  return list.map(translateGenre);
}
