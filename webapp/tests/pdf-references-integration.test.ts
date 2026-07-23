// Funció 104 — Proves d'integració de les referències del PDF sobre IndexedDB.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  openLocalDatabase,
  pdfReferenceRepository,
  sourceBlobRepository,
} from "../lib/local-db/index.ts";
import { createSourceBlobRecord } from "../lib/source-blobs.ts";
import { createPdfReference } from "../lib/pdf-references.ts";

function createDatabaseV5(blob: Record<string, unknown>): Promise<void> {
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
      const transaction = database.transaction("blobs", "readwrite");
      transaction.objectStore("blobs").put(blob);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

test("actualitza l'esquema v5 → v6 conservant els continguts", async () => {
  const blob = createSourceBlobRecord({
    sourceId: "source-1",
    projectId: "project-a",
    mime: "application/pdf",
    data: new Uint8Array(64).buffer,
  });
  await createDatabaseV5(blob as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const stored = await sourceBlobRepository.get("source-1");
  assert.equal(stored?.size, 64);

  await pdfReferenceRepository.save(
    createPdfReference(
      { sourceId: "source-1", projectId: "project-a", page: 5, text: "cita" },
      { id: "ref-1", now: "2026-07-22T10:00:00.000Z" },
    ),
  );
  const references = await pdfReferenceRepository.getAllForSource("source-1");
  assert.equal(references.length, 1);
  assert.equal(references[0].page, 5);
});

test("desa i ordena les referències per pàgina i les esborra", async () => {
  await pdfReferenceRepository.save(
    createPdfReference(
      { sourceId: "source-1", projectId: "project-a", page: 12, text: "b" },
      { id: "ref-2" },
    ),
  );
  await pdfReferenceRepository.save(
    createPdfReference(
      { sourceId: "source-1", projectId: "project-a", page: 3, text: "a" },
      { id: "ref-3" },
    ),
  );

  const references = await pdfReferenceRepository.getAllForSource("source-1");
  assert.deepEqual(
    references.map((reference) => reference.page),
    [3, 5, 12],
  );

  await pdfReferenceRepository.delete("ref-2");
  assert.equal(
    (await pdfReferenceRepository.getAllForSource("source-1")).length,
    2,
  );
});
