// Funció 302 — Migració i persistència de l'estructura del llibre.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  bookNodeRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";
import {
  detectBookStructure,
  moveBookNode,
} from "../lib/book-structure.ts";
import { type ManuscriptRecord } from "../lib/manuscripts.ts";

function createDatabaseV12(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 12);
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

const manuscript: ManuscriptRecord = {
  id: "manuscript-1",
  projectId: "project-a",
  name: "llibre.md",
  kind: "markdown",
  mime: "text/markdown",
  size: 80,
  originalSha256: "a".repeat(64),
  importedAt: "2026-07-24T10:00:00.000Z",
  updatedAt: "2026-07-24T10:00:00.000Z",
  workingText: "## Capítol 1\n\n## Capítol 2",
  wordCount: 6,
  paragraphCount: 2,
};

test("migra v12 → v13 i desa l'estructura detectada", async () => {
  await createDatabaseV12();
  const database = await openLocalDatabase();
  assert.equal(database.objectStoreNames.contains("bookNodes"), true);

  const detected = detectBookStructure(manuscript);
  await bookNodeRepository.replaceForManuscript(manuscript.id, detected);
  const stored = await bookNodeRepository.getAllForProject("project-a");
  assert.equal(stored.length, 2);
  assert.equal(stored[0].title, "Capítol 1");
});

test("persisteix l'edició i la reordenació", async () => {
  const stored = await bookNodeRepository.getAllForProject("project-a");
  const edited = {
    ...stored[0],
    objective: "Establir el context documental",
    status: "en-revisio" as const,
  };
  await bookNodeRepository.save(edited);
  const moved = moveBookNode(stored.map((node) =>
    node.id === edited.id ? edited : node
  ), stored[1].id, -1);
  await bookNodeRepository.saveMany(moved);

  const reloaded = await bookNodeRepository.getAllForProject("project-a");
  assert.equal(
    reloaded.find((node) => node.id === edited.id)?.objective,
    "Establir el context documental",
  );
  assert.equal(reloaded.find((node) => node.id === stored[1].id)?.order, 0);
});
