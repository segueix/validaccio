// Funció 103 — Fitxa bibliogràfica i citekey.
// Lògica pura per a les metadades de citació d'una font i la generació d'un
// identificador estable i únic (citekey). No toca IndexedDB: la fitxa es desa
// dins la fitxa de la font (funció 101) i les proves s'executen a Node.

export type CitationType =
  | "llibre"
  | "article"
  | "capitol"
  | "arxiu"
  | "manuscrit"
  | "web"
  | "altre";

export const CITATION_TYPES: readonly { value: CitationType; label: string }[] = [
  { value: "llibre", label: "Llibre" },
  { value: "article", label: "Article" },
  { value: "capitol", label: "Capítol de llibre" },
  { value: "arxiu", label: "Document d’arxiu" },
  { value: "manuscrit", label: "Manuscrit" },
  { value: "web", label: "Pàgina web" },
  { value: "altre", label: "Altre" },
];

export type Citation = {
  author: string;
  title: string;
  date: string;
  edition: string;
  archive: string;
  url: string;
  accessedAt: string;
  type: CitationType;
  tags: string[];
  citekey: string;
};

export function citationTypeLabel(type: CitationType): string {
  return CITATION_TYPES.find((item) => item.value === type)?.label ?? "Altre";
}

function isCitationType(value: unknown): value is CitationType {
  return CITATION_TYPES.some((item) => item.value === value);
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");
}

function firstAuthorSurname(author: string): string {
  const clean = author.trim();
  if (!clean) return "";
  if (clean.includes(",")) return clean.split(",")[0].trim();
  const parts = clean.split(/\s+/);
  return parts[parts.length - 1];
}

function extractYear(date: string): string {
  const match = date.match(/\d{4}/);
  return match ? match[0] : "";
}

export function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

export function formatTags(tags: readonly string[]): string {
  return tags.join(", ");
}

export function suggestCitekey(
  input: { author?: string; date?: string; title?: string },
  taken: readonly string[] = [],
): string {
  const authorPart = slug(firstAuthorSurname(input.author ?? ""));
  const titlePart = slug((input.title ?? "").trim().split(/\s+/)[0] ?? "");
  const base = authorPart || titlePart || "font";
  const year = extractYear(input.date ?? "") || "sd";
  const candidate = `${base}${year}`;

  if (!taken.includes(candidate)) return candidate;
  let suffix = "b";
  while (taken.includes(`${candidate}${suffix}`)) {
    suffix = String.fromCharCode(suffix.charCodeAt(0) + 1);
  }
  return `${candidate}${suffix}`;
}

export function normalizeCitation(
  input: Partial<Citation>,
  taken: readonly string[] = [],
): Citation {
  const author = (input.author ?? "").trim();
  const title = (input.title ?? "").trim();
  const date = (input.date ?? "").trim();
  const providedKey = (input.citekey ?? "").trim();

  return {
    author,
    title,
    date,
    edition: (input.edition ?? "").trim(),
    archive: (input.archive ?? "").trim(),
    url: (input.url ?? "").trim(),
    accessedAt: (input.accessedAt ?? "").trim(),
    type: isCitationType(input.type) ? input.type : "altre",
    tags: Array.isArray(input.tags)
      ? Array.from(
          new Set(input.tags.map((tag) => String(tag).trim()).filter(Boolean)),
        )
      : [],
    citekey: providedKey || suggestCitekey({ author, date, title }, taken),
  };
}

export function emptyCitation(): Citation {
  return {
    author: "",
    title: "",
    date: "",
    edition: "",
    archive: "",
    url: "",
    accessedAt: "",
    type: "altre",
    tags: [],
    citekey: "",
  };
}
