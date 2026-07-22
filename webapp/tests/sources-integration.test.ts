// Funció 101 — Proves d'integració del catàleg de fonts sobre IndexedDB.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  createProjectRecord,
  openLocalDatabase,
  projectRepository,
  requestResult,
  sourceRepository,
  withTransaction,
} from "../lib/local-db/index.ts";
import { createSourceRecord } from "../lib/source-library.ts";

function createDatabaseV3(project: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 3);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("projects", "readwrite");
      transaction.objectStore("projects").put(project);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function source(projectId: string, id: string, importedAt: string) {
  return createSourceRecord(
    { name: `${id}.pdf`, type: "application/pdf", size: 2048, kind: "pdf" },
    projectId,
    { id, now: importedAt },
  );
}

// Primer: la migració d'esquema v3 → v4 ha de crear el magatzem de fonts sense
// perdre els projectes existents.
test("actualitza l'esquema v3 → v4 conservant els projectes", async () => {
  const project = createProjectRecord(
    "L’origen del Tarot",
    "origen-tarot",
    "2026-07-21T10:00:00.000Z",
  );
  await createDatabaseV3(project as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const projects = await projectRepository.getAll();
  assert.ok(projects.some((item) => item.id === "origen-tarot"));

  // El nou magatzem de fonts existeix i funciona.
  await sourceRepository.add(source("origen-tarot", "source-x", "2026-07-22T10:00:00.000Z"));
  assert.equal(await sourceRepository.countForProject("origen-tarot"), 1);
});

test("desa i recupera les fonts filtrades per projecte", async () => {
  await withTransaction("sources", "readwrite", async (store) => {
    await requestResult(store.clear());
  });

  await sourceRepository.add(source("project-a", "s-a1", "2026-07-22T10:00:00.000Z"));
  await sourceRepository.add(source("project-a", "s-a2", "2026-07-22T12:00:00.000Z"));
  await sourceRepository.add(source("project-b", "s-b1", "2026-07-22T11:00:00.000Z"));

  const forA = await sourceRepository.getAllForProject("project-a");
  assert.equal(forA.length, 2);
  assert.equal(forA[0].id, "s-a2"); // ordenat per importedAt descendent
  assert.equal(await sourceRepository.countForProject("project-a"), 2);
  assert.equal(await sourceRepository.countForProject("project-b"), 1);
});

test("esborra una font sense afectar les altres", async () => {
  await sourceRepository.delete("s-a1");
  const forA = await sourceRepository.getAllForProject("project-a");
  assert.equal(forA.length, 1);
  assert.equal(forA[0].id, "s-a2");
  assert.equal(await sourceRepository.countForProject("project-b"), 1);
});
