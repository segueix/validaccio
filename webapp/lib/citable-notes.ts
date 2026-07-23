// Funció 107 — Notes i extractes citables.
// Un extracte manté separats tres registres que mai s'han de barrejar en la
// recerca històrica: la CITA textual (paraules de la font), la PARÀFRASI (les
// meves paraules) i el COMENTARI propi (anàlisi o judici). Cada extracte queda
// ancorat a una font (i, si ve del visor PDF, a una pàgina i una referència
// concretes) perquè tota afirmació del llibre es pugui resseguir fins a l'origen.
//
// Lògica pura i comprovable: model, validació, pont des d'una referència del PDF
// (funció 104), format de citació i filtre. El desat a IndexedDB i la interfície
// viuen fora d'aquest mòdul.

import { parseTags } from "./bibliography.ts";
import { type PdfReference } from "./pdf-references.ts";

export type CitableNote = {
  id: string;
  projectId: string;
  sourceId: string;
  // Enllaç opcional a la referència ancorada del visor PDF (funció 104), per
  // reobrir el context exacte. Null quan l'extracte no ve d'un PDF.
  referenceId: string | null;
  // Pàgina/localització dins la font. Null si no aplica (p. ex. text sense pàgines).
  page: number | null;
  quote: string;
  paraphrase: string;
  comment: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CitableNoteInput = {
  projectId: string;
  sourceId: string;
  referenceId?: string | null;
  page?: number | null;
  quote?: string;
  paraphrase?: string;
  comment?: string;
  tags?: readonly string[] | string;
};

function createNoteId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `note-${suffix}`;
}

// Una pàgina vàlida és un enter positiu; qualsevol altra cosa és «sense pàgina».
function normalizePage(page: unknown): number | null {
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1) {
    return null;
  }
  return page;
}

function normalizeTags(tags: CitableNoteInput["tags"]): string[] {
  if (Array.isArray(tags)) {
    return parseTags(tags.join(", "));
  }
  if (typeof tags === "string") {
    return parseTags(tags);
  }
  return [];
}

// Un extracte buit no té sentit: ha de tenir com a mínim un dels tres registres.
export function noteHasContent(
  registers: { quote?: string; paraphrase?: string; comment?: string },
): boolean {
  return Boolean(
    (registers.quote ?? "").trim() ||
      (registers.paraphrase ?? "").trim() ||
      (registers.comment ?? "").trim(),
  );
}

export function createCitableNote(
  input: CitableNoteInput,
  options: { id?: string; now?: string } = {},
): CitableNote {
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("L'extracte necessita un projecte associat");
  }
  if (typeof input.sourceId !== "string" || input.sourceId.trim() === "") {
    throw new TypeError("L'extracte necessita una font associada");
  }
  const quote = (input.quote ?? "").trim();
  const paraphrase = (input.paraphrase ?? "").trim();
  const comment = (input.comment ?? "").trim();
  if (!noteHasContent({ quote, paraphrase, comment })) {
    throw new TypeError(
      "L'extracte necessita una cita, una paràfrasi o un comentari",
    );
  }
  const now = options.now ?? new Date().toISOString();
  const referenceId =
    typeof input.referenceId === "string" && input.referenceId.trim() !== ""
      ? input.referenceId.trim()
      : null;
  return {
    id: options.id ?? createNoteId(),
    projectId: input.projectId.trim(),
    sourceId: input.sourceId.trim(),
    referenceId,
    page: normalizePage(input.page),
    quote,
    paraphrase,
    comment,
    tags: normalizeTags(input.tags),
    createdAt: now,
    updatedAt: now,
  };
}

// Carrega defensiva: completa camps que faltin sense perdre dades d'esquemes previs.
export function normalizeCitableNote(
  raw: Record<string, unknown>,
  now = new Date().toISOString(),
): CitableNote {
  const base = createCitableNote(
    {
      projectId: String(raw.projectId ?? ""),
      sourceId: String(raw.sourceId ?? ""),
      referenceId:
        typeof raw.referenceId === "string" ? raw.referenceId : null,
      page: typeof raw.page === "number" ? raw.page : null,
      quote: typeof raw.quote === "string" ? raw.quote : "",
      paraphrase: typeof raw.paraphrase === "string" ? raw.paraphrase : "",
      comment: typeof raw.comment === "string" ? raw.comment : "",
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    },
    {
      id: typeof raw.id === "string" && raw.id ? raw.id : undefined,
      now: typeof raw.createdAt === "string" ? raw.createdAt : now,
    },
  );
  return {
    ...base,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.createdAt,
  };
}

// Pont amb la funció 104: converteix una referència ancorada del PDF en l'esborrany
// d'un extracte, amb la cita i la pàgina ja emplenades i l'enllaç a la referència.
export function noteInputFromReference(
  reference: Pick<
    PdfReference,
    "sourceId" | "projectId" | "page" | "text" | "id"
  >,
): CitableNoteInput {
  return {
    projectId: reference.projectId,
    sourceId: reference.sourceId,
    referenceId: reference.id,
    page: reference.page,
    quote: reference.text,
  };
}

// Citació breu i reproduïble a partir del citekey de la font i la pàgina.
export function formatNoteCitation(
  note: Pick<CitableNote, "page">,
  citekey: string | undefined,
): string {
  const key = (citekey ?? "").trim();
  const anchor = key ? `@${key}` : "(font sense citekey)";
  return note.page ? `${anchor}, p. ${note.page}` : anchor;
}

export type NoteFilter = {
  query?: string;
  sourceId?: string;
  tag?: string;
};

// Filtre local per a la vista «Extractes»: text lliure sobre els tres registres,
// més filtres exactes per font i per etiqueta. Ordena per data de modificació.
export function filterNotes(
  notes: readonly CitableNote[],
  filter: NoteFilter = {},
): CitableNote[] {
  const needle = (filter.query ?? "").trim().toLowerCase();
  const tag = (filter.tag ?? "").trim().toLowerCase();
  const filtered = notes.filter((note) => {
    if (filter.sourceId && note.sourceId !== filter.sourceId) return false;
    if (tag && !note.tags.some((value) => value.toLowerCase() === tag)) {
      return false;
    }
    if (!needle) return true;
    return (
      note.quote.toLowerCase().includes(needle) ||
      note.paraphrase.toLowerCase().includes(needle) ||
      note.comment.toLowerCase().includes(needle)
    );
  });
  return filtered.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}
