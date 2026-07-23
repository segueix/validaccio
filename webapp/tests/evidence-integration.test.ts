// Funció 204 — Proves d'integració del registre d'evidències sobre IndexedDB.
// Comprova l'actualització d'esquema v7 → v8 (nou magatzem `evidence`) conservant
// els magatzems previs, i el cicle de desat, consulta ordenada i esborrat.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  evidenceRepository,
  hypothesisRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";
import { createHypothesis } from "../lib/hypotheses.ts";
import { createEvidence } from "../lib/evidence.ts";

// Crea una base a l'esquema v7 (amb hypotheses/references/notes) i hi desa una
// hipòtesi, abans que l'aplicació obri l'espai i migri a v8.
function createDatabaseV7(hypothesis: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 7);
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
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("hypotheses", "readwrite");
      transaction.objectStore("hypotheses").put(hypothesis);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

test("actualitza l'esquema v7 → v8 conservant els magatzems previs", async () => {
  const hypothesis = createHypothesis(
    { role: "nova", projectId: "origen-tarot", title: "H3" },
    { id: "hyp-3", now: "2026-07-23T09:00:00.000Z" },
  );
  await createDatabaseV7(hypothesis as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const hypotheses = await hypothesisRepository.getAllForProject("origen-tarot");
  assert.equal(hypotheses.length, 1);

  // El magatzem nou existeix i accepta una evidència.
  await evidenceRepository.save(
    createEvidence(
      { projectId: "origen-tarot", description: "fet documentat", quality: "primaria" },
      { id: "eid-1", code: "E1", now: "2026-07-23T10:00:00.000Z" },
    ),
  );
  const stored = await evidenceRepository.getAllForProject("origen-tarot");
  assert.equal(stored.length, 1);
  assert.equal(stored[0].code, "E1");
  assert.equal(stored[0].quality, "primaria");
});

test("desa, ordena per codi de manera natural (E2 abans d'E10) i esborra", async () => {
  await openLocalDatabase();

  for (const code of ["E10", "E2", "E1"]) {
    await evidenceRepository.save(
      createEvidence(
        { projectId: "ordena-test", description: `fet ${code}` },
        { id: `eid-${code}`, code },
      ),
    );
  }

  const evidence = await evidenceRepository.getAllForProject("ordena-test");
  assert.deepEqual(
    evidence.map((item) => item.code),
    ["E1", "E2", "E10"],
  );

  await evidenceRepository.delete("eid-E2");
  assert.deepEqual(
    (await evidenceRepository.getAllForProject("ordena-test")).map((item) => item.code),
    ["E1", "E10"],
  );
});
