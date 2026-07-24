// Funció 302 — Detecció conservadora, jerarquia i reordenació.
import assert from "node:assert/strict";
import test from "node:test";

import {
  bookTree,
  detectBookStructure,
  moveBookNode,
  normalizeBookNode,
  type BookNode,
} from "../lib/book-structure.ts";
import { type ManuscriptRecord } from "../lib/manuscripts.ts";

function manuscript(
  workingText: string,
  kind: ManuscriptRecord["kind"] = "markdown",
): ManuscriptRecord {
  return {
    id: "manuscript-1",
    projectId: "project-a",
    name: "llibre.md",
    kind,
    mime: "text/markdown",
    size: workingText.length,
    originalSha256: "a".repeat(64),
    importedAt: "2026-07-24T10:00:00.000Z",
    updatedAt: "2026-07-24T10:00:00.000Z",
    workingText,
    wordCount: 20,
    paragraphCount: 8,
  };
}

test("detecta Markdown i ignora l'H1 inicial quan és el títol de l'obra", () => {
  const nodes = detectBookStructure(
    manuscript(
      "# L’origen del Tarot\n\n## Capítol 1. Els precedents\n\n### 1.1 Iconografia\n\n## Capítol 2. L’atribució",
    ),
    "2026-07-24T11:00:00.000Z",
  );
  assert.deepEqual(
    nodes.map((node) => node.kind),
    ["chapter", "section", "chapter"],
  );
  assert.equal(nodes[1].parentId, nodes[0].id);
  assert.equal(nodes[2].parentId, null);
});

test("detecta parts, capítols i seccions explícites en text pla", () => {
  const nodes = detectBookStructure(
    manuscript(
      "PART I — ELS PRECEDENTS\n\nCapítol 1. Context\n\nSecció 1. Fonts\n\nCapítol 2. Resultats",
      "text",
    ),
  );
  assert.deepEqual(nodes.map((node) => node.kind), [
    "part",
    "chapter",
    "section",
    "chapter",
  ]);
  assert.equal(nodes[1].parentId, nodes[0].id);
  assert.equal(nodes[2].parentId, nodes[1].id);
});

test("si no hi ha encapçalaments crea un únic capítol sense inventar divisions", () => {
  const nodes = detectBookStructure(
    manuscript("Un text seguit sense cap estructura explícita.", "text"),
  );
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].kind, "chapter");
  assert.equal(nodes[0].title, "llibre");
});

function node(
  id: string,
  parentId: string | null,
  order: number,
  kind: BookNode["kind"] = "chapter",
): BookNode {
  return {
    id,
    projectId: "project-a",
    manuscriptId: "manuscript-1",
    parentId,
    kind,
    title: id,
    order,
    status: "pendent",
    objective: "",
    sourceParagraph: order + 1,
    createdAt: "2026-07-24T10:00:00.000Z",
    updatedAt: "2026-07-24T10:00:00.000Z",
  };
}

test("reordena només entre elements germans", () => {
  const nodes = [
    node("c1", null, 0),
    node("c2", null, 1),
    node("s1", "c1", 0, "section"),
  ];
  const moved = moveBookNode(
    nodes,
    "c2",
    -1,
    "2026-07-24T12:00:00.000Z",
  );
  assert.equal(moved.find((item) => item.id === "c2")?.order, 0);
  assert.equal(moved.find((item) => item.id === "c1")?.order, 1);
  assert.equal(moved.find((item) => item.id === "s1")?.order, 0);
});

test("construeix un arbre ordenat amb profunditat visible", () => {
  const rows = bookTree([
    node("s1", "c1", 0, "section"),
    node("c1", "p1", 0),
    node("p1", null, 0, "part"),
  ]);
  assert.deepEqual(
    rows.map((item) => [item.id, item.depth]),
    [
      ["p1", 0],
      ["c1", 1],
      ["s1", 2],
    ],
  );
});

test("normalitza títol, objectiu, ordre i estat", () => {
  const normalized = normalizeBookNode({
    ...node("c1", null, -4),
    title: "  Introducció  ",
    objective: "  Presentar les fonts  ",
    status: "desconegut" as BookNode["status"],
  });
  assert.equal(normalized.title, "Introducció");
  assert.equal(normalized.objective, "Presentar les fonts");
  assert.equal(normalized.order, 0);
  assert.equal(normalized.status, "pendent");
});
