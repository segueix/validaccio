// Funció 102 — Proves d'integració de l'emmagatzematge de continguts.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  openLocalDatabase,
  sourceBlobRepository,
  sourceRepository,
} from "../lib/local-db/index.ts";
import { createSourceBlobRecord } from "../lib/source-blobs.ts";
import { createSourceRecord } from "../lib/source-library.ts";

function createDatabaseV4(sourceRecord: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 4);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
      const sources = database.createObjectStore("sources", { keyPath: "id" });
      sources.createIndex("projectId", "projectId");
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("sources", "readwrite");
      transaction.objectStore("sources").put(sourceRecord);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function blob(sourceId: string, projectId: string, bytes: number) {
  return createSourceBlobRecord({
    sourceId,
    projectId,
    mime: "application/pdf",
    data: new Uint8Array(bytes).buffer,
  });
}

// Primer: la migració v4 → v5 crea el magatzem de continguts sense perdre les
// fitxes de font ja registrades.
test("actualitza l'esquema v4 → v5 conservant les fonts", async () => {
  const sourceRecord = createSourceRecord(
    { name: "manuscrit.pdf", type: "application/pdf", size: 1024, kind: "pdf" },
    "project-a",
    { id: "source-1", now: "2026-07-22T10:00:00.000Z" },
  );
  await createDatabaseV4(sourceRecord as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const sources = await sourceRepository.getAllForProject("project-a");
  assert.ok(sources.some((item) => item.id === "source-1"));

  // El nou magatzem de continguts funciona.
  await sourceBlobRepository.put(blob("source-1", "project-a", 4096));
  const stored = await sourceBlobRepository.get("source-1");
  assert.equal(stored?.size, 4096);
  assert.equal(stored?.data.byteLength, 4096);
});

test("desa, recupera i suma la mida dels continguts per projecte", async () => {
  await sourceBlobRepository.put(blob("source-2", "project-a", 2048));
  await sourceBlobRepository.put(blob("source-3", "project-b", 8192));

  assert.equal(
    await sourceBlobRepository.totalSizeForProject("project-a"),
    4096 + 2048, // source-1 (del test anterior) + source-2
  );
  assert.equal(await sourceBlobRepository.totalSizeForProject("project-b"), 8192);
});

test("esborra un contingut de manera controlada sense tocar els altres", async () => {
  await sourceBlobRepository.delete("source-2");
  assert.equal(await sourceBlobRepository.get("source-2"), null);
  assert.equal(await sourceBlobRepository.totalSizeForProject("project-a"), 4096);
  assert.equal(await sourceBlobRepository.totalSizeForProject("project-b"), 8192);
});
