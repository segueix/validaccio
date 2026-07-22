import assert from "node:assert/strict";
import test from "node:test";

import {
  createMigrationBackup,
  LATEST_DATA_VERSION,
  migrateProjectDataset,
  migrateProjectRecord,
  MigrationError,
  recordDataVersion,
} from "../lib/local-db/migrations.ts";

const legacyProject = {
  id: "origen-tarot",
  title: " L’origen del Tarot ",
  subtitle: "Obra en preparació",
  updatedAt: "2026-07-21T10:00:00.000Z",
  phase: 1,
  chapters: 13,
  words: 58951,
  notes: 206,
};

test("detecta la versió de dades i tracta els registres antics com a v1", () => {
  assert.equal(recordDataVersion(legacyProject), 1);
  assert.equal(recordDataVersion({ id: "x", dataVersion: 2 }), 2);
  assert.equal(recordDataVersion({ id: "x", dataVersion: 0 }), 1);
});

test("migra un projecte antic a la versió actual sense perdre dades", () => {
  const result = migrateProjectRecord(legacyProject);

  assert.equal(result.from, 1);
  assert.equal(result.migrated, true);
  assert.equal(result.record.dataVersion, LATEST_DATA_VERSION);
  assert.equal(result.record.title, "L’origen del Tarot");
  assert.equal(result.record.words, 58951);
});

test("no marca com a migrat un registre que ja és a la versió actual", () => {
  const current = migrateProjectRecord(legacyProject).record;
  const result = migrateProjectRecord(current as unknown as Record<string, unknown>);

  assert.equal(result.from, LATEST_DATA_VERSION);
  assert.equal(result.migrated, false);
  assert.deepEqual(result.record, current);
});

test("rebutja versions de dades més noves que la compatible", () => {
  assert.throws(
    () =>
      migrateProjectRecord({
        id: "futur",
        title: "Del futur",
        dataVersion: LATEST_DATA_VERSION + 1,
      }),
    (error: unknown) =>
      error instanceof MigrationError && /més nova/.test(error.message),
  );
});

test("converteix un registre irrecuperable en un MigrationError amb l'id", () => {
  assert.throws(
    () => migrateProjectRecord({ id: "sense-titol", title: "   " }),
    (error: unknown) =>
      error instanceof MigrationError && error.recordId === "sense-titol",
  );
});

test("migra un conjunt conservant els vàlids i separant els que fallen", () => {
  const outcome = migrateProjectDataset([
    legacyProject,
    migrateProjectRecord(legacyProject).record as unknown as Record<
      string,
      unknown
    >,
    { id: "trencat", title: "" },
  ]);

  assert.equal(outcome.migrated.length, 2);
  assert.equal(outcome.changed, 1); // només el registre v1 canvia de versió
  assert.equal(outcome.failures.length, 1);
  assert.equal(outcome.failures[0].id, "trencat");
});

test("la còpia prèvia desa els registres crus i la versió d'origen", () => {
  const backup = createMigrationBackup([legacyProject], {
    now: "2026-07-22T09:00:00.000Z",
    id: "backup-test",
  });

  assert.equal(backup.id, "backup-test");
  assert.equal(backup.createdAt, "2026-07-22T09:00:00.000Z");
  assert.equal(backup.fromVersion, 1);
  assert.equal(backup.toVersion, LATEST_DATA_VERSION);
  assert.deepEqual(backup.projects[0], legacyProject);
  // És una còpia independent: mutar-la no afecta l'original.
  backup.projects[0].title = "canviat";
  assert.equal(legacyProject.title, " L’origen del Tarot ");
});
