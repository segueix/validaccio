import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  approveAuthorStyleProfile,
  extractAuthorStyleProfile,
} from "../lib/author-style-profile.ts";
import {
  openLocalDatabase,
  styleProfileRepository,
} from "../lib/local-db/index.ts";
import { type ManuscriptRecord } from "../lib/manuscripts.ts";

function createDatabaseV15(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 15);
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
  id: "manuscript-style",
  projectId: "project-style",
  name: "Primer llibre.txt",
  kind: "text",
  mime: "text/plain",
  size: 500,
  originalSha256: "b".repeat(64),
  importedAt: "2026-07-24T10:00:00.000Z",
  updatedAt: "2026-07-24T10:00:00.000Z",
  workingText:
    "La documentació confirma una primera relació entre els elements. Aquesta prova identifica una estructura repetida i demostra un ordre coherent. En canvi, una hipòtesi podria explicar una coincidència isolada, però no tot el conjunt. Per tant, l’anàlisi atribueix el sistema al context documentat. La conclusió estableix una lectura directa, revisable i traçable. Nosaltres podem comprovar cada pas abans d’aprovar el perfil definitiu.",
  wordCount: 65,
  paragraphCount: 1,
};

test("migra v15 → v16 i conserva el perfil revisable per projecte", async () => {
  await createDatabaseV15();
  const database = await openLocalDatabase();
  assert.equal(database.objectStoreNames.contains("styleProfiles"), true);

  const profile = extractAuthorStyleProfile(
    manuscript,
    "2026-07-24T11:00:00.000Z",
  );
  await styleProfileRepository.save(profile);
  const recovered = await styleProfileRepository.getForProject("project-style");

  assert.equal(recovered?.sourceManuscriptId, "manuscript-style");
  assert.equal(recovered?.status, "draft");
  assert.equal(recovered?.sourceSha256, "b".repeat(64));
});

test("actualitza el mateix perfil sense perdre l’origen ni l’aprovació", async () => {
  const profile = extractAuthorStyleProfile(
    manuscript,
    "2026-07-24T11:00:00.000Z",
  );
  const approved = approveAuthorStyleProfile(
    profile,
    "2026-07-24T12:00:00.000Z",
  );
  await styleProfileRepository.save(approved);
  const recovered = await styleProfileRepository.getForProject("project-style");

  assert.equal(recovered?.status, "approved");
  assert.equal(recovered?.approvedAt, "2026-07-24T12:00:00.000Z");
  assert.equal(recovered?.sourceName, "Primer llibre.txt");
  assert.equal(recovered?.revision, 2);
});
