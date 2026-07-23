import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMatrix,
  cellId,
  createCell,
  diagnosticityFor,
  leastRefutedHypotheses,
  normalizeCell,
  scoreHypotheses,
  toCsv,
} from "../lib/ach-matrix.ts";

test("crea una cel·la C/I/N amb id determinista per parella", () => {
  const cell = createCell(
    {
      projectId: "origen-tarot",
      evidenceId: "eid-1",
      hypothesisId: "hyp-1",
      value: "I",
      comment: "  contradiu la datació  ",
    },
    { now: "2026-07-23T10:00:00.000Z" },
  );
  assert.equal(cell.id, cellId("eid-1", "hyp-1"));
  assert.equal(cell.value, "I");
  assert.equal(cell.comment, "contradiu la datació");
});

test("marcar C o I exigeix comentari; N el permet buit", () => {
  assert.throws(
    () => createCell({ projectId: "p", evidenceId: "e", hypothesisId: "h", value: "C" }),
    /comentari/,
  );
  assert.throws(
    () => createCell({ projectId: "p", evidenceId: "e", hypothesisId: "h", value: "I", comment: "  " }),
    /comentari/,
  );
  const neutral = createCell({ projectId: "p", evidenceId: "e", hypothesisId: "h", value: "N" });
  assert.equal(neutral.value, "N");
  assert.equal(neutral.comment, "");
});

test("rebutja cel·les sense projecte, evidència, hipòtesi o valor vàlid", () => {
  assert.throws(() => createCell({ projectId: "", evidenceId: "e", hypothesisId: "h", value: "N" }), /projecte/);
  assert.throws(() => createCell({ projectId: "p", evidenceId: "", hypothesisId: "h", value: "N" }), /evidència|EID/);
  assert.throws(() => createCell({ projectId: "p", evidenceId: "e", hypothesisId: "", value: "N" }), /hipòtesi/);
  assert.throws(
    () => createCell({ projectId: "p", evidenceId: "e", hypothesisId: "h", value: "X" as "N" }),
    /C\/I\/N/,
  );
});

test("diagnosticitat: discrimina, ornamental o incompleta", () => {
  const hyps = ["h1", "h2", "h3"];
  const diagnostic = [
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h1", value: "C", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h2", value: "I", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h3", value: "N" }),
  ];
  assert.equal(diagnosticityFor(diagnostic, "e1", hyps), "diagnostica");

  const ornamental = [
    createCell({ projectId: "p", evidenceId: "e2", hypothesisId: "h1", value: "C", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e2", hypothesisId: "h2", value: "C", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e2", hypothesisId: "h3", value: "C", comment: "x" }),
  ];
  assert.equal(diagnosticityFor(ornamental, "e2", hyps), "ornamental");

  const incomplete = [
    createCell({ projectId: "p", evidenceId: "e3", hypothesisId: "h1", value: "C", comment: "x" }),
  ];
  assert.equal(diagnosticityFor(incomplete, "e3", hyps), "incompleta");
});

test("puntua les hipòtesis per inconsistències i identifica la menys refutada", () => {
  const cells = [
    // h1: 0 I ; h2: 2 I ; h3: 1 I
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h1", value: "C", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h2", value: "I", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h3", value: "N" }),
    createCell({ projectId: "p", evidenceId: "e2", hypothesisId: "h1", value: "C", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e2", hypothesisId: "h2", value: "I", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e2", hypothesisId: "h3", value: "I", comment: "x" }),
  ];
  const scores = scoreHypotheses(cells, ["h1", "h2", "h3"]);
  assert.deepEqual(
    scores.map((s) => [s.hypothesisId, s.inconsistencies]),
    [["h1", 0], ["h2", 2], ["h3", 1]],
  );
  assert.deepEqual(leastRefutedHypotheses(scores), ["h1"]);
});

test("construeix la matriu i l'exporta com a CSV compatible", () => {
  const cells = [
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h1", value: "C", comment: "x" }),
    createCell({ projectId: "p", evidenceId: "e1", hypothesisId: "h2", value: "I", comment: "x" }),
  ];
  const rows = buildMatrix(cells, ["e1"], ["h1", "h2"]);
  assert.equal(rows[0].values.h1, "C");
  assert.equal(rows[0].values.h2, "I");
  assert.equal(rows[0].diagnosticity, "diagnostica");

  const csv = toCsv(
    rows,
    [{ hypothesisId: "h1", code: "H1" }, { hypothesisId: "h2", code: "H2" }],
    (id) => (id === "e1" ? "E1" : id),
  );
  assert.equal(csv, "EID,H1,H2,Diagnosticitat\nE1,C,I,diagnostica");
});

test("normalitza una cel·la d'un esquema previ amb valors segurs", () => {
  const cell = normalizeCell({
    projectId: "p",
    evidenceId: "e9",
    hypothesisId: "h9",
    value: "Z",
    createdAt: "2026-07-20T09:00:00.000Z",
  });
  assert.equal(cell.id, cellId("e9", "h9"));
  assert.equal(cell.value, "N");
  assert.equal(cell.createdAt, "2026-07-20T09:00:00.000Z");
});
