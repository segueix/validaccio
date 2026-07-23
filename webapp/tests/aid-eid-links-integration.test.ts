// Funció 206 — Proves d'integració de l'enllaç AID–EID sobre IndexedDB.
// Comprova l'actualització d'esquema v9 → v10 (nou magatzem `links`), la consulta
// en tots dos sentits i l'esborrat en cascada per afirmació i per evidència.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  affirmationRepository,
  aidEidLinkRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";
import { createAffirmation } from "../lib/affirmations.ts";
import {
  createLink,
  linksForAffirmation,
  linksForEvidence,
} from "../lib/aid-eid-links.ts";

// Crea una base a l'esquema v9 (amb affirmations) i hi desa una afirmació, abans
// que l'aplicació obri l'espai i migri a v10.
function createDatabaseV9(affirmation: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 9);
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
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("affirmations", "readwrite");
      transaction.objectStore("affirmations").put(affirmation);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

test("actualitza l'esquema v9 → v10 conservant els magatzems previs", async () => {
  const affirmation = createAffirmation(
    { projectId: "origen-tarot", text: "afirmació base" },
    { id: "aid-1", code: "A1", now: "2026-07-23T09:00:00.000Z" },
  );
  await createDatabaseV9(affirmation as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const affirmations = await affirmationRepository.getAllForProject("origen-tarot");
  assert.equal(affirmations.length, 1);

  await aidEidLinkRepository.save(
    createLink(
      { projectId: "origen-tarot", affirmationId: "aid-1", evidenceId: "eid-1", stance: "favorable" },
      { now: "2026-07-23T10:00:00.000Z" },
    ),
  );
  const links = await aidEidLinkRepository.getAllForProject("origen-tarot");
  assert.equal(links.length, 1);
  assert.equal(links[0].stance, "favorable");
});

test("consulta en tots dos sentits i esborra en cascada per afirmació i evidència", async () => {
  await openLocalDatabase();

  const link = (affirmationId: string, evidenceId: string) =>
    createLink({ projectId: "cascade", affirmationId, evidenceId });

  await aidEidLinkRepository.save(link("aid-A", "eid-1"));
  await aidEidLinkRepository.save(link("aid-A", "eid-2"));
  await aidEidLinkRepository.save(link("aid-B", "eid-1"));

  const all = await aidEidLinkRepository.getAllForProject("cascade");
  assert.equal(linksForAffirmation(all, "aid-A").length, 2);
  assert.equal(linksForEvidence(all, "eid-1").length, 2);

  // Esborrar l'evidència eid-1 elimina els seus dos enllaços (amb aid-A i aid-B).
  await aidEidLinkRepository.deleteForEvidence("eid-1");
  const afterEvidence = await aidEidLinkRepository.getAllForProject("cascade");
  assert.equal(afterEvidence.length, 1);
  assert.equal(afterEvidence[0].affirmationId, "aid-A");
  assert.equal(afterEvidence[0].evidenceId, "eid-2");

  // Esborrar l'afirmació aid-A elimina l'enllaç restant.
  await aidEidLinkRepository.deleteForAffirmation("aid-A");
  assert.equal(
    (await aidEidLinkRepository.getAllForProject("cascade")).length,
    0,
  );
});
