// Funció 201 — Proves d'integració de l'editor d'hipòtesis sobre IndexedDB.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  hypothesisRepository,
  openLocalDatabase,
  sourceRepository,
} from "../lib/local-db/index.ts";
import { createSourceRecord } from "../lib/source-library.ts";
import { defaultHypotheses, normalizeHypothesis } from "../lib/hypotheses.ts";

function createDatabaseV5(source: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 5);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
      const sources = database.createObjectStore("sources", { keyPath: "id" });
      sources.createIndex("projectId", "projectId");
      const blobs = database.createObjectStore("blobs", { keyPath: "sourceId" });
      blobs.createIndex("projectId", "projectId");
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("sources", "readwrite");
      transaction.objectStore("sources").put(source);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

test("actualitza l'esquema v5 → v6 conservant les fonts", async () => {
  const source = createSourceRecord(
    { name: "a.pdf", type: "application/pdf", size: 512, kind: "pdf" },
    "project-a",
    { id: "source-1", now: "2026-07-22T10:00:00.000Z" },
  );
  await createDatabaseV5(source as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const sources = await sourceRepository.getAllForProject("project-a");
  assert.ok(sources.some((item) => item.id === "source-1"));

  // El nou magatzem d'hipòtesis existeix i desa el joc inicial ordenat.
  for (const hypothesis of defaultHypotheses("project-a", "2026-07-22T11:00:00.000Z")) {
    await hypothesisRepository.save(hypothesis);
  }
  const stored = await hypothesisRepository.getAllForProject("project-a");
  assert.deepEqual(
    stored.map((item) => item.code),
    ["H1", "H2", "H3"],
  );
});

test("edita una hipòtesi i la manté aïllada per projecte", async () => {
  const [h1] = await hypothesisRepository.getAllForProject("project-a");
  await hypothesisRepository.save(
    normalizeHypothesis(
      { ...h1, statement: "Consens: origen milanès dels Visconti.", reviewState: "en-revisio" },
      { now: "2026-07-22T12:00:00.000Z" },
    ),
  );

  const updated = await hypothesisRepository.get(h1.id);
  assert.equal(updated?.statement, "Consens: origen milanès dels Visconti.");
  assert.equal(updated?.reviewState, "en-revisio");

  // Un altre projecte no comparteix les hipòtesis.
  assert.equal((await hypothesisRepository.getAllForProject("project-b")).length, 0);

  await hypothesisRepository.delete(h1.id);
  assert.equal(
    (await hypothesisRepository.getAllForProject("project-a")).length,
    2,
  );
});
