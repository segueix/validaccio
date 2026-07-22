// Funció 007 — Execució segura de migracions amb còpia prèvia i recuperació.
// Aplica la migració pura de `migrations.ts` sobre l'espai IndexedDB. Abans
// d'escriure res, desa una còpia prèvia dels registres crus a `metadata`, de
// manera que una migració fallida sempre es pugui revertir.

import { requestResult, withTransaction } from "./database.ts";
import { metadataRepository } from "./repositories.ts";
import {
  createMigrationBackup,
  LATEST_DATA_VERSION,
  type MigrationBackup,
  migrateProjectDataset,
  type RawRecord,
} from "./migrations.ts";

export const MIGRATION_BACKUP_METADATA_KEY = "migrationBackups";
const MAX_MIGRATION_BACKUPS = 3;

export type MigrationRunResult = {
  changed: number;
  failures: { id: string | null; error: string }[];
  backupId: string | null;
};

function readRawProjects(): Promise<RawRecord[]> {
  return withTransaction("projects", "readonly", async (store) => {
    return (await requestResult(store.getAll())) as RawRecord[];
  });
}

async function readBackups(): Promise<MigrationBackup[]> {
  const meta = await metadataRepository.get(MIGRATION_BACKUP_METADATA_KEY);
  return Array.isArray(meta?.value) ? (meta.value as MigrationBackup[]) : [];
}

async function appendBackup(backup: MigrationBackup): Promise<void> {
  const backups = await readBackups();
  await metadataRepository.set(
    MIGRATION_BACKUP_METADATA_KEY,
    [...backups, backup].slice(-MAX_MIGRATION_BACKUPS),
  );
}

async function writeProjects(records: RawRecord[]): Promise<void> {
  await withTransaction("projects", "readwrite", async (store) => {
    for (const record of records) {
      await requestResult(store.put(record));
    }
  });
}

export async function ensureProjectsMigrated(
  now = new Date().toISOString(),
): Promise<MigrationRunResult> {
  const raw = await readRawProjects();
  const outcome = migrateProjectDataset(raw, LATEST_DATA_VERSION);

  // No cal tocar res si cap registre no canvia de versió i no hi ha errors.
  if (outcome.changed === 0 && outcome.failures.length === 0) {
    return { changed: 0, failures: [], backupId: null };
  }

  // Còpia prèvia dels registres crus abans d'escriure la versió migrada.
  const backup = createMigrationBackup(raw, { now });
  await appendBackup(backup);

  // Si l'escriptura falla, la còpia prèvia ja és desada per poder recuperar.
  await writeProjects(outcome.migrated as unknown as RawRecord[]);

  return {
    changed: outcome.changed,
    failures: outcome.failures,
    backupId: backup.id,
  };
}

export function listMigrationBackups(): Promise<MigrationBackup[]> {
  return readBackups();
}

export async function recoverProjectsFromBackup(
  backupId?: string,
): Promise<number> {
  const backups = await readBackups();
  const backup = backupId
    ? backups.find((candidate) => candidate.id === backupId)
    : backups[backups.length - 1];
  if (!backup) return 0;

  await writeProjects(backup.projects);
  return backup.projects.length;
}
