// Funció 009 — Proves d'integració del nucli local sobre IndexedDB.
// Usa `fake-indexeddb` per exercir de veritat la persistència, la migració
// d'esquema en obrir, el flux crític d'importació i el runner de migració amb
// còpia prèvia i recuperació. Tot s'executa localment amb `npm run test:unit`.

import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  createProjectRecord,
  ensureProjectsMigrated,
  listMigrationBackups,
  metadataRepository,
  MIGRATION_BACKUP_METADATA_KEY,
  openLocalDatabase,
  projectRepository,
  PROJECT_DATA_VERSION,
  recoverProjectsFromBackup,
  requestResult,
  withTransaction,
} from "../lib/local-db/index.ts";
import {
  createProjectPackage,
  parseProjectPackage,
  serializeProjectPackage,
} from "../lib/project-package.ts";

function createLegacyDatabaseV1(project: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("workspace");
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("workspace", "readwrite");
      transaction.objectStore("workspace").put(project, "project");
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function resetProjects(): Promise<void> {
  await withTransaction("projects", "readwrite", async (store) => {
    await requestResult(store.clear());
  });
  await metadataRepository.set(MIGRATION_BACKUP_METADATA_KEY, []);
}

// Aquesta prova ha d'anar primera: crea una base v1 abans que l'aplicació obri
// l'espai, de manera que `openLocalDatabase` en dispari la migració a v3.
test("migra una base local v1 en obrir-la", async () => {
  await createLegacyDatabaseV1({
    id: "origen-tarot",
    title: "  L’origen del Tarot  ",
    subtitle: "Obra en preparació",
    updatedAt: "2026-07-21T10:00:00.000Z",
    phase: 1,
    chapters: 13,
    words: 58951,
    notes: 206,
  });

  await openLocalDatabase();

  const projects = await projectRepository.getAll();
  const migrated = projects.find((project) => project.id === "origen-tarot");
  assert.ok(migrated, "el projecte antic s'ha de moure al magatzem de projectes");
  assert.equal(migrated.title, "L’origen del Tarot");
  assert.equal(migrated.dataVersion, PROJECT_DATA_VERSION);
  assert.equal(migrated.words, 58951);
});

test("desa, llegeix, ordena, compta i esborra projectes", async () => {
  await resetProjects();

  await projectRepository.save(
    createProjectRecord("Alfa", "project-a", "2026-07-20T10:00:00.000Z"),
  );
  await projectRepository.save(
    createProjectRecord("Beta", "project-b", "2026-07-22T10:00:00.000Z"),
  );

  const all = await projectRepository.getAll();
  assert.equal(all.length, 2);
  assert.equal(all[0].id, "project-b"); // ordre per updatedAt descendent
  assert.equal((await projectRepository.get("project-a"))?.title, "Alfa");
  assert.equal(await projectRepository.count(), 2);

  await projectRepository.delete("project-a");
  assert.equal(await projectRepository.count(), 1);
  assert.equal(await projectRepository.get("project-a"), null);
});

test("desa i recupera metadades tipades", async () => {
  await metadataRepository.set("activeProjectId", "project-b");
  assert.equal((await metadataRepository.get("activeProjectId"))?.value, "project-b");
  assert.equal(await metadataRepository.get("inexistent"), null);
});

test("flux crític: exporta, torna a importar i persisteix el projecte", async () => {
  await resetProjects();

  const project = createProjectRecord(
    "Flux",
    "project-flux",
    "2026-07-22T12:00:00.000Z",
  );
  const projectPackage = await createProjectPackage(project);
  const imported = await parseProjectPackage(
    serializeProjectPackage(projectPackage),
  );

  assert.equal(imported.source, "verified");
  await projectRepository.save(imported.project);

  const stored = await projectRepository.get("project-flux");
  assert.equal(stored?.title, "Flux");
  assert.equal(stored?.dataVersion, PROJECT_DATA_VERSION);
});

test("una transacció que falla no deixa dades a mitges", async () => {
  await resetProjects();
  const before = await projectRepository.count();

  await assert.rejects(
    withTransaction("projects", "readwrite", async (store) => {
      await requestResult(
        store.put(createProjectRecord("Provisional", "project-x")),
      );
      throw new Error("interrupció simulada");
    }),
  );

  assert.equal(await projectRepository.count(), before);
});

test("ensureProjectsMigrated desa una còpia prèvia i permet recuperar-la", async () => {
  await resetProjects();

  // Insereix un registre cru v1 (sense dataVersion) per forçar la migració.
  await withTransaction("projects", "readwrite", async (store) => {
    await requestResult(store.put({ id: "legacy-1", title: "  Antic  " }));
  });

  const result = await ensureProjectsMigrated("2026-07-22T13:00:00.000Z");
  assert.equal(result.changed, 1);
  assert.equal(result.failures.length, 0);

  const backups = await listMigrationBackups();
  assert.ok(backups.length >= 1);
  const latest = backups[backups.length - 1];
  assert.equal(latest.projects[0].id, "legacy-1");
  assert.equal(latest.fromVersion, 1);

  const migrated = await projectRepository.get("legacy-1");
  assert.equal(migrated?.dataVersion, PROJECT_DATA_VERSION);
  assert.equal(migrated?.title, "Antic");

  const restored = await recoverProjectsFromBackup();
  assert.equal(restored, 1);
});
