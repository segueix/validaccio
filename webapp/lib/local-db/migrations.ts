// Funció 007 — Migracions i recuperació.
// Pipeline de migració pur i comprovable per als registres de projecte. La
// lògica no toca IndexedDB, de manera que cada pas de migració es pot provar a
// Node. El runner amb còpia prèvia i recuperació viu a `migration-runner.ts`.

import {
  normalizeProjectRecord,
  PROJECT_DATA_VERSION,
  type ProjectRecord,
} from "./types.ts";

export const LATEST_DATA_VERSION = PROJECT_DATA_VERSION;

export type RawRecord = Record<string, unknown>;

export class MigrationError extends Error {
  readonly recordId: string | null;

  constructor(message: string, recordId: string | null = null) {
    super(message);
    this.name = "MigrationError";
    this.recordId = recordId;
  }
}

export type MigrationStep = {
  from: number;
  to: number;
  description: string;
  migrate: (raw: RawRecord) => RawRecord;
};

// Registre ordenat de passos. Ha de formar una cadena contigua fins a
// LATEST_DATA_VERSION. Cada pas és pur i queda cobert per una prova.
export const PROJECT_MIGRATIONS: readonly MigrationStep[] = [
  {
    from: 1,
    to: 2,
    description:
      "Normalitza els camps del projecte i fixa la versió de dades 2.",
    migrate: (raw) =>
      normalizeProjectRecord(
        raw as Parameters<typeof normalizeProjectRecord>[0],
      ) as unknown as RawRecord,
  },
];

export function recordDataVersion(raw: RawRecord): number {
  const value = raw.dataVersion;
  return typeof value === "number" && Number.isInteger(value) && value >= 1
    ? value
    : 1;
}

function rawId(raw: RawRecord): string | null {
  return typeof raw.id === "string" ? raw.id : null;
}

export type MigratedRecord = {
  record: ProjectRecord;
  from: number;
  migrated: boolean;
};

export function migrateProjectRecord(
  raw: RawRecord,
  target: number = LATEST_DATA_VERSION,
): MigratedRecord {
  const from = recordDataVersion(raw);
  if (from > target) {
    throw new MigrationError(
      `La versió de dades ${from} és més nova que la compatible (${target}).`,
      rawId(raw),
    );
  }

  let version = from;
  let working: RawRecord = raw;
  while (version < target) {
    const step = PROJECT_MIGRATIONS.find(
      (candidate) => candidate.from === version,
    );
    if (!step) {
      throw new MigrationError(
        `No hi ha cap migració definida des de la versió ${version}.`,
        rawId(raw),
      );
    }
    try {
      working = step.migrate(working);
    } catch (error) {
      throw new MigrationError(
        `La migració ${step.from}→${step.to} ha fallat: ${
          error instanceof Error ? error.message : "error desconegut"
        }`,
        rawId(raw),
      );
    }
    version = step.to;
  }

  try {
    const record = normalizeProjectRecord(
      working as Parameters<typeof normalizeProjectRecord>[0],
    );
    return { record, from, migrated: from < target };
  } catch (error) {
    throw new MigrationError(
      `El registre migrat no és vàlid: ${
        error instanceof Error ? error.message : "error desconegut"
      }`,
      rawId(raw),
    );
  }
}

export type DatasetMigration = {
  migrated: ProjectRecord[];
  failures: { id: string | null; error: string }[];
  changed: number;
};

export function migrateProjectDataset(
  records: readonly RawRecord[],
  target: number = LATEST_DATA_VERSION,
): DatasetMigration {
  const migrated: ProjectRecord[] = [];
  const failures: { id: string | null; error: string }[] = [];
  let changed = 0;

  for (const raw of records) {
    try {
      const result = migrateProjectRecord(raw, target);
      migrated.push(result.record);
      if (result.migrated) changed += 1;
    } catch (error) {
      failures.push({
        id: rawId(raw),
        error:
          error instanceof Error ? error.message : "Error de migració desconegut.",
      });
    }
  }

  return { migrated, failures, changed };
}

export type MigrationBackup = {
  id: string;
  createdAt: string;
  fromVersion: number;
  toVersion: number;
  projects: RawRecord[];
};

export function createMigrationBackup(
  records: readonly RawRecord[],
  options: { now?: string; toVersion?: number; id?: string } = {},
): MigrationBackup {
  const createdAt = options.now ?? new Date().toISOString();
  const toVersion = options.toVersion ?? LATEST_DATA_VERSION;
  const fromVersion = records.reduce(
    (min, raw) => Math.min(min, recordDataVersion(raw)),
    toVersion,
  );

  return {
    id: options.id ?? `backup-${createdAt}`,
    createdAt,
    fromVersion,
    toVersion,
    projects: records.map((raw) => ({ ...raw })),
  };
}
