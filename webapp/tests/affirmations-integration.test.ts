// Funció 205 — Proves d'integració del registre d'afirmacions sobre IndexedDB.
// Comprova l'actualització d'esquema v8 → v9 (nou magatzem `affirmations`)
// conservant els magatzems previs, i el cicle de desat, consulta ordenada i esborrat.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  affirmationRepository,
  evidenceRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";
import { createEvidence } from "../lib/evidence.ts";
import { createAffirmation } from "../lib/affirmations.ts";

// Crea una base a l'esquema v8 (amb evidence) i hi desa una evidència, abans que
// l'aplicació obri l'espai i migri a v9.
function createDatabaseV8(evidence: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 8);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
      const sources = database.createObjectStore("sources", { keyPath: "id" });
      sources.createIndex("projectId", "projectId");
      const blobs = database.createObjectStore("blobs", { keyPath: "sourceId" });
      blobs.createIndex("projectId", "projectId");
      const hypotheses = database.createObjectStore("hypotheses", { keyPath: "id" });
      hypotheses.createIndex("projectId", "projectId");
      const references = database.createObjectStore("references", { keyPath: "id" });
      references.createIndex("sourceId", "sourceId");
      const notes = database.createObjectStore("notes", { keyPath: "id" });
      notes.createIndex("projectId", "projectId");
      notes.createIndex("sourceId", "sourceId");
      const evidenceStore = database.createObjectStore("evidence", { keyPath: "id" });
      evidenceStore.createIndex("projectId", "projectId");
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("evidence", "readwrite");
      transaction.objectStore("evidence").put(evidence);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

test("actualitza l'esquema v8 → v9 conservant els magatzems previs", async () => {
  const evidence = createEvidence(
    { projectId: "origen-tarot", description: "fet documentat" },
    { id: "eid-1", code: "E1", now: "2026-07-23T09:00:00.000Z" },
  );
  await createDatabaseV8(evidence as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const evidences = await evidenceRepository.getAllForProject("origen-tarot");
  assert.equal(evidences.length, 1);

  await affirmationRepository.save(
    createAffirmation(
      {
        projectId: "origen-tarot",
        text: "El Cary-Yale és el tarot més antic conservat.",
        type: "condicional",
        assertiveness: "alta",
      },
      { id: "aid-1", code: "A1", now: "2026-07-23T10:00:00.000Z" },
    ),
  );
  const stored = await affirmationRepository.getAllForProject("origen-tarot");
  assert.equal(stored.length, 1);
  assert.equal(stored[0].code, "A1");
  assert.equal(stored[0].type, "condicional");
  assert.equal(stored[0].assertiveness, "alta");
});

test("desa, ordena per codi de manera natural (A2 abans d'A10) i esborra", async () => {
  await openLocalDatabase();

  for (const code of ["A10", "A2", "A1"]) {
    await affirmationRepository.save(
      createAffirmation(
        { projectId: "ordena-aid", text: `afirmació ${code}` },
        { id: `aid-${code}`, code },
      ),
    );
  }

  const affirmations = await affirmationRepository.getAllForProject("ordena-aid");
  assert.deepEqual(
    affirmations.map((item) => item.code),
    ["A1", "A2", "A10"],
  );

  await affirmationRepository.delete("aid-A2");
  assert.deepEqual(
    (await affirmationRepository.getAllForProject("ordena-aid")).map((item) => item.code),
    ["A1", "A10"],
  );
});
