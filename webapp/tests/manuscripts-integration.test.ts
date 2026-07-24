// Funció 301 — Persistència atòmica del registre, l'original i la còpia de treball.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  manuscriptRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";
import { prepareManuscriptImport } from "../lib/manuscripts.ts";

function createDatabaseV11(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 11);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

async function prepared(id: string, text: string) {
  const data = new TextEncoder().encode(text).buffer;
  return prepareManuscriptImport({
    id,
    projectId: "project-a",
    file: { name: `${id}.md`, type: "text/markdown", size: data.byteLength },
    data,
    now: "2026-07-24T10:00:00.000Z",
  });
}

test("migra v11 → v12 i desa l'original i la còpia de treball", async () => {
  await createDatabaseV11();
  const database = await openLocalDatabase();
  assert.equal(database.objectStoreNames.contains("manuscripts"), true);
  assert.equal(database.objectStoreNames.contains("manuscriptOriginals"), true);

  const item = await prepared("manuscript-1", "# Títol\n\nText de treball.");
  await manuscriptRepository.import(item.manuscript, item.original);

  const manuscripts = await manuscriptRepository.getAllForProject("project-a");
  const original = await manuscriptRepository.getOriginal("manuscript-1");
  assert.equal(manuscripts[0].workingText, "# Títol\n\nText de treball.");
  assert.deepEqual(
    new Uint8Array(original?.data ?? new ArrayBuffer(0)),
    new Uint8Array(item.original.data),
  );
});

test("no permet sobreescriure un original importat", async () => {
  const replacement = await prepared("manuscript-1", "Contingut substitut.");
  await assert.rejects(() =>
    manuscriptRepository.import(replacement.manuscript, replacement.original),
  );

  const original = await manuscriptRepository.getOriginal("manuscript-1");
  assert.notEqual(
    new TextDecoder().decode(original?.data),
    "Contingut substitut.",
  );
});
