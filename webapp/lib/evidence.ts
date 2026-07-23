// Funció 204 — Registre d'evidències (EID).
// Una evidència és una dada registrada amb una descripció NEUTRAL (el fet, no la
// interpretació), ancorada a una font, pàgina i extracte citable (funció 107),
// amb una família de dependència i una qualitat. Cada evidència té un codi EID
// únic i estable (E1, E2…) que després encapçala les files de la matriu ACH (209).
//
// Lògica pura i comprovable: model, validació, generació de codi, qualitat i pont
// des d'un extracte. La persistència viu a `local-db`.

import { type CitableNote } from "./citable-notes.ts";

export type EvidenceQuality =
  | "primaria"
  | "secundaria"
  | "terciaria"
  | "incerta";

export const EVIDENCE_QUALITIES: readonly {
  value: EvidenceQuality;
  label: string;
  hint: string;
}[] = [
  {
    value: "primaria",
    label: "Primària",
    hint: "Testimoni directe o document coetani del fet.",
  },
  {
    value: "secundaria",
    label: "Secundària",
    hint: "Obra que interpreta o cita fonts primàries.",
  },
  {
    value: "terciaria",
    label: "Terciària",
    hint: "Síntesi, manual o divulgació que recull secundàries.",
  },
  {
    value: "incerta",
    label: "Incerta",
    hint: "Procedència o naturalesa encara per determinar.",
  },
];

export type EvidenceRecord = {
  id: string;
  projectId: string;
  code: string;
  description: string;
  sourceId: string | null;
  page: number | null;
  noteId: string | null;
  family: string;
  quality: EvidenceQuality;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceInput = {
  projectId: string;
  description?: string;
  sourceId?: string | null;
  page?: number | null;
  noteId?: string | null;
  family?: string;
  quality?: EvidenceQuality;
};

function createEvidenceId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `eid-${suffix}`;
}

export function qualityInfo(quality: EvidenceQuality) {
  return (
    EVIDENCE_QUALITIES.find((item) => item.value === quality) ??
    EVIDENCE_QUALITIES[3]
  );
}

export function isQuality(value: unknown): value is EvidenceQuality {
  return EVIDENCE_QUALITIES.some((item) => item.value === value);
}

// Codi EID seqüencial i únic per projecte: E1, E2, E3… El següent és el màxim
// numèric existent més un, de manera que esborrar-ne un no reutilitza el número.
export function nextEvidenceCode(existingCodes: readonly string[]): string {
  let max = 0;
  for (const code of existingCodes) {
    const match = /^E(\d+)$/.exec((code ?? "").trim());
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  return `E${max + 1}`;
}

function normalizePage(page: unknown): number | null {
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1) {
    return null;
  }
  return page;
}

function optionalId(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function createEvidence(
  input: EvidenceInput,
  options: { id?: string; code?: string; now?: string } = {},
): EvidenceRecord {
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("L'evidència necessita un projecte associat");
  }
  const description = (input.description ?? "").trim();
  if (description === "") {
    throw new TypeError("L'evidència necessita una descripció neutral");
  }
  const now = options.now ?? new Date().toISOString();
  return {
    id: options.id ?? createEvidenceId(),
    projectId: input.projectId.trim(),
    code: (options.code ?? "E1").trim(),
    description,
    sourceId: optionalId(input.sourceId),
    page: normalizePage(input.page),
    noteId: optionalId(input.noteId),
    family: (input.family ?? "").trim(),
    quality: isQuality(input.quality) ? input.quality : "incerta",
    createdAt: now,
    updatedAt: now,
  };
}

// Carrega defensiva: completa camps que faltin sense perdre dades d'esquemes previs.
export function normalizeEvidence(
  raw: Record<string, unknown>,
  now = new Date().toISOString(),
): EvidenceRecord {
  const base = createEvidence(
    {
      projectId: String(raw.projectId ?? ""),
      description:
        typeof raw.description === "string" ? raw.description : "—",
      sourceId: typeof raw.sourceId === "string" ? raw.sourceId : null,
      page: typeof raw.page === "number" ? raw.page : null,
      noteId: typeof raw.noteId === "string" ? raw.noteId : null,
      family: typeof raw.family === "string" ? raw.family : "",
      quality: isQuality(raw.quality) ? raw.quality : "incerta",
    },
    {
      id: typeof raw.id === "string" && raw.id ? raw.id : undefined,
      code: typeof raw.code === "string" && raw.code ? raw.code : "E1",
      now: typeof raw.createdAt === "string" ? raw.createdAt : now,
    },
  );
  return {
    ...base,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.createdAt,
  };
}

// Pont amb la funció 107: converteix un extracte citable en l'esborrany d'una
// evidència. La paràfrasi (redactada sense valorar) és el punt de partida de la
// descripció neutral; la cita queda com a suport i l'extracte queda enllaçat.
export function evidenceInputFromNote(note: CitableNote): EvidenceInput {
  const description = note.paraphrase.trim() || note.quote.trim();
  return {
    projectId: note.projectId,
    description,
    sourceId: note.sourceId,
    page: note.page,
    noteId: note.id,
  };
}
