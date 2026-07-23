// Funció 104 — Referències ancorades a un PDF.
// Lògica pura i comprovable: model de referència (font + pàgina + fragment) i
// cerca de coincidències sobre el text de les pàgines. El render del PDF viu al
// component; aquí només hi ha allò que es pot provar sense navegador.

export type PdfReference = {
  id: string;
  sourceId: string;
  projectId: string;
  page: number;
  text: string;
  note: string;
  createdAt: string;
};

function createReferenceId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `ref-${suffix}`;
}

export function createPdfReference(
  input: {
    sourceId: string;
    projectId: string;
    page: number;
    text: string;
    note?: string;
  },
  options: { id?: string; now?: string } = {},
): PdfReference {
  if (typeof input.sourceId !== "string" || input.sourceId.trim() === "") {
    throw new TypeError("La referència necessita una font associada");
  }
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("La referència necessita un projecte associat");
  }
  if (!Number.isInteger(input.page) || input.page < 1) {
    throw new TypeError("La referència necessita una pàgina vàlida");
  }
  return {
    id: options.id ?? createReferenceId(),
    sourceId: input.sourceId.trim(),
    projectId: input.projectId.trim(),
    page: input.page,
    text: (input.text ?? "").trim(),
    note: (input.note ?? "").trim(),
    createdAt: options.now ?? new Date().toISOString(),
  };
}

export type PageText = { page: number; text: string };

export type SearchMatch = { page: number; snippet: string };

// Cerca literal (sense distingir majúscules) sobre el text de cada pàgina i
// retorna coincidències amb context i el número de pàgina reproduïble.
export function findMatches(
  pages: readonly PageText[],
  query: string,
  options: { limit?: number; context?: number } = {},
): SearchMatch[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const limit = options.limit ?? 100;
  const context = options.context ?? 32;

  const matches: SearchMatch[] = [];
  for (const { page, text } of pages) {
    const haystack = text.toLowerCase();
    let from = 0;
    while (matches.length < limit) {
      const index = haystack.indexOf(needle, from);
      if (index < 0) break;
      const start = Math.max(0, index - context);
      const end = Math.min(text.length, index + needle.length + context);
      const snippet = `${start > 0 ? "…" : ""}${text
        .slice(start, end)
        .replace(/\s+/g, " ")
        .trim()}${end < text.length ? "…" : ""}`;
      matches.push({ page, snippet });
      from = index + needle.length;
    }
    if (matches.length >= limit) break;
  }
  return matches;
}
