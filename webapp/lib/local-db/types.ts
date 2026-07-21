export const PROJECT_DATA_VERSION = 1 as const;

export type ProjectRecord = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
  dataVersion: number;
  phase: number;
  chapters: number;
  words: number;
  notes: number;
};

export type DatabaseMetadata = {
  key: string;
  value: unknown;
  updatedAt: string;
};

type LegacyProject = Partial<ProjectRecord> & {
  id?: unknown;
  title?: unknown;
};

export function normalizeProjectRecord(
  input: LegacyProject,
  fallbackDate = new Date().toISOString(),
): ProjectRecord {
  if (typeof input.id !== "string" || input.id.trim() === "") {
    throw new TypeError("El projecte necessita un identificador");
  }
  if (typeof input.title !== "string" || input.title.trim() === "") {
    throw new TypeError("El projecte necessita un títol");
  }

  const updatedAt = validDate(input.updatedAt) ?? fallbackDate;

  return {
    id: input.id.trim(),
    title: input.title.trim(),
    subtitle: typeof input.subtitle === "string" ? input.subtitle : "",
    createdAt: validDate(input.createdAt) ?? updatedAt,
    updatedAt,
    dataVersion: PROJECT_DATA_VERSION,
    phase: nonNegativeInteger(input.phase),
    chapters: nonNegativeInteger(input.chapters),
    words: nonNegativeInteger(input.words),
    notes: nonNegativeInteger(input.notes),
  };
}

function validDate(value: unknown): string | null {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return null;
  return value;
}

function nonNegativeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}
