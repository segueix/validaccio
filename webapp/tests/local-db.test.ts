import assert from "node:assert/strict";
import test from "node:test";

import {
  createProjectRecord,
  duplicateProjectRecord,
  LOCAL_DATABASE_SCHEMA,
  normalizeProjectRecord,
  PROJECT_DATA_VERSION,
} from "../lib/local-db/index.ts";

test("l'esquema local té una versió explícita i magatzems separats", () => {
  assert.equal(LOCAL_DATABASE_SCHEMA.name, "validaccio-local");
  assert.equal(LOCAL_DATABASE_SCHEMA.version, 6);
  assert.equal(LOCAL_DATABASE_SCHEMA.dataVersion, PROJECT_DATA_VERSION);
  assert.equal(LOCAL_DATABASE_SCHEMA.stores.projects, "projects");
  assert.equal(LOCAL_DATABASE_SCHEMA.stores.metadata, "metadata");
});

test("normalitza un projecte de l'esquema antic sense perdre dades", () => {
  const project = normalizeProjectRecord(
    {
      id: "origen-tarot",
      title: " L’origen del Tarot ",
      subtitle: "Obra en preparació",
      updatedAt: "2026-07-21T10:00:00.000Z",
      phase: 1,
      chapters: 13,
      words: 58951,
      notes: 206,
    },
    "2026-07-21T11:00:00.000Z",
  );

  assert.equal(project.title, "L’origen del Tarot");
  assert.equal(project.createdAt, "2026-07-21T10:00:00.000Z");
  assert.equal(project.updatedAt, "2026-07-21T10:00:00.000Z");
  assert.equal(project.dataVersion, PROJECT_DATA_VERSION);
  assert.equal(project.words, 58951);
});

test("rebutja projectes sense identitat estable", () => {
  assert.throws(
    () => normalizeProjectRecord({ id: "", title: "Projecte" }),
    /identificador/,
  );
});


test("crea i duplica projectes amb identitat independent", () => {
  const source = createProjectRecord(
    "L’origen del Tarot",
    "project-original",
    "2026-07-21T12:00:00.000Z",
  );
  const copy = duplicateProjectRecord(
    source,
    "project-copy",
    "2026-07-21T13:00:00.000Z",
  );

  assert.equal(source.archivedAt, null);
  assert.equal(copy.id, "project-copy");
  assert.equal(copy.title, "L’origen del Tarot (còpia)");
  assert.equal(copy.createdAt, "2026-07-21T13:00:00.000Z");
  assert.notEqual(copy.id, source.id);
});
