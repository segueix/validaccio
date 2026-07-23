// Funció 209 — Proves d'integració de la matriu ACH sobre IndexedDB.
// Comprova l'actualització d'esquema v10 → v11 (nou magatzem `cells`), el desat i
// consulta de cel·les i l'esborrat en cascada per evidència i per hipòtesi.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  aidEidLinkRepository,
  matrixCellRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";
import { createLink } from "../lib/aid-eid-links.ts";
import { createCell } from "../lib/ach-matrix.ts";

// Crea una base a l'esquema v10 (amb links) i hi desa un enllaç, abans que
// l'aplicació obri l'espai i migri a v11.
function createDatabaseV10(link: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 10);
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
      const evidence = database.createObjectStore("evidence", { keyPath: "id" });
      evidence.createIndex("projectId", "projectId");
      const affirmations = database.createObjectStore("affirmations", { keyPath: "id" });
      affirmations.createIndex("projectId", "projectId");
      const links = database.createObjectStore("links", { keyPath: "id" });
      links.createIndex("projectId", "projectId");
      links.createIndex("affirmationId", "affirmationId");
      links.createIndex("evidenceId", "evidenceId");
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("links", "readwrite");
      transaction.objectStore("links").put(link);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

test("actualitza l'esquema v10 → v11 conservant els magatzems previs", async () => {
  const link = createLink(
    { projectId: "origen-tarot", affirmationId: "aid-1", evidenceId: "eid-1" },
    { now: "2026-07-23T09:00:00.000Z" },
  );
  await createDatabaseV10(link as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const links = await aidEidLinkRepository.getAllForProject("origen-tarot");
  assert.equal(links.length, 1);

  await matrixCellRepository.save(
    createCell(
      { projectId: "origen-tarot", evidenceId: "eid-1", hypothesisId: "hyp-1", value: "I", comment: "contradiu" },
      { now: "2026-07-23T10:00:00.000Z" },
    ),
  );
  const cells = await matrixCellRepository.getAllForProject("origen-tarot");
  assert.equal(cells.length, 1);
  assert.equal(cells[0].value, "I");
});

test("esborra les cel·les en cascada per evidència i per hipòtesi", async () => {
  await openLocalDatabase();

  const cell = (evidenceId: string, hypothesisId: string) =>
    createCell({ projectId: "cascade-ach", evidenceId, hypothesisId, value: "N" });

  await matrixCellRepository.save(cell("eid-A", "hyp-1"));
  await matrixCellRepository.save(cell("eid-A", "hyp-2"));
  await matrixCellRepository.save(cell("eid-B", "hyp-1"));

  assert.equal(
    (await matrixCellRepository.getAllForProject("cascade-ach")).length,
    3,
  );

  await matrixCellRepository.deleteForEvidence("eid-A");
  assert.equal(
    (await matrixCellRepository.getAllForProject("cascade-ach")).length,
    1,
  );

  await matrixCellRepository.deleteForHypothesis("hyp-1");
  assert.equal(
    (await matrixCellRepository.getAllForProject("cascade-ach")).length,
    0,
  );
});
