import assert from "node:assert/strict";
import test from "node:test";

import {
  createProjectPackage,
  parseProjectPackage,
  PROJECT_PACKAGE_VERSION,
  ProjectPackageError,
  serializeProjectPackage,
} from "../lib/project-package.ts";
import { createProjectRecord } from "../lib/local-db/index.ts";

const project = createProjectRecord(
  "L’origen del Tarot",
  "project-tarot",
  "2026-07-21T12:00:00.000Z",
);

test("crea i restaura una còpia amb manifest i SHA-256", async () => {
  const projectPackage = await createProjectPackage(
    project,
    "2026-07-21T14:00:00.000Z",
  );
  const imported = await parseProjectPackage(
    serializeProjectPackage(projectPackage),
  );

  assert.equal(projectPackage.version, PROJECT_PACKAGE_VERSION);
  assert.equal(projectPackage.manifest.projectId, project.id);
  assert.match(projectPackage.manifest.integrity.digest, /^[a-f0-9]{64}$/);
  assert.equal(imported.source, "verified");
  assert.deepEqual(imported.project, project);
});

test("detecta una còpia modificada després de l'exportació", async () => {
  const projectPackage = await createProjectPackage(project);
  projectPackage.data.project.title = "Títol manipulat";

  await assert.rejects(
    () => parseProjectPackage(serializeProjectPackage(projectPackage)),
    (error: unknown) =>
      error instanceof ProjectPackageError &&
      error.code === "integrity-mismatch",
  );
});

test("manté compatibilitat amb les còpies v1", async () => {
  const imported = await parseProjectPackage(
    JSON.stringify({
      format: "validaccio-project",
      version: 1,
      project,
    }),
  );

  assert.equal(imported.packageVersion, 1);
  assert.equal(imported.source, "legacy");
  assert.equal(imported.project.id, project.id);
});

test("rebutja còpies de versions futures", async () => {
  await assert.rejects(
    () =>
      parseProjectPackage(
        JSON.stringify({
          format: "validaccio-project",
          version: PROJECT_PACKAGE_VERSION + 1,
        }),
      ),
    (error: unknown) =>
      error instanceof ProjectPackageError &&
      error.code === "unsupported-version",
  );
});
