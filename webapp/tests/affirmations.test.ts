import assert from "node:assert/strict";
import test from "node:test";

import {
  affirmationStateLabel,
  affirmationTypeInfo,
  assertivenessInfo,
  createAffirmation,
  nextAffirmationCode,
  normalizeAffirmation,
  requiresDiagnosticEvidence,
} from "../lib/affirmations.ts";

test("crea una afirmació amb text, tipus, capítol, estat i assertivitat", () => {
  const affirmation = createAffirmation(
    {
      projectId: "origen-tarot",
      text: "  El Cary-Yale es va pintar al taller de Bembo cap a 1441.  ",
      type: "condicional",
      chapter: "3",
      reviewState: "en-revisio",
      assertiveness: "alta",
    },
    { id: "aid-1", code: "A1", now: "2026-07-23T10:00:00.000Z" },
  );
  assert.equal(affirmation.code, "A1");
  assert.equal(
    affirmation.text,
    "El Cary-Yale es va pintar al taller de Bembo cap a 1441.",
  );
  assert.equal(affirmation.type, "condicional");
  assert.equal(affirmation.chapter, "3");
  assert.equal(affirmation.reviewState, "en-revisio");
  assert.equal(affirmation.assertiveness, "alta");
});

test("rebutja afirmacions sense projecte o sense text exacte", () => {
  assert.throws(() => createAffirmation({ projectId: "", text: "x" }), /projecte/);
  assert.throws(() => createAffirmation({ projectId: "p", text: "   " }), /text/);
});

test("aplica valors per defecte segurs (incondicional, moderada, esborrany)", () => {
  const affirmation = createAffirmation({ projectId: "p", text: "un fet" });
  assert.equal(affirmation.type, "incondicional");
  assert.equal(affirmation.assertiveness, "moderada");
  assert.equal(affirmation.reviewState, "esborrany");
  assert.equal(affirmation.chapter, "");
});

test("la bifurcació de la certesa: la condicional exigeix evidència diagnòstica", () => {
  assert.equal(requiresDiagnosticEvidence("condicional"), true);
  assert.equal(requiresDiagnosticEvidence("incondicional"), false);
  assert.equal(affirmationTypeInfo("condicional").label, "Condicional (atributiva)");
  assert.equal(assertivenessInfo("molt-alta").rank, 5);
  assert.equal(assertivenessInfo("molt-baixa").rank, 1);
  assert.equal(affirmationStateLabel("validada"), "Validada");
});

test("genera codis AID seqüencials i no reutilitza els esborrats", () => {
  assert.equal(nextAffirmationCode([]), "A1");
  assert.equal(nextAffirmationCode(["A1", "A2", "A3"]), "A4");
  assert.equal(nextAffirmationCode(["A1", "A3"]), "A4");
  assert.equal(nextAffirmationCode(["A7", "E2", "A2"]), "A8");
});

test("normalitza una afirmació d'un esquema previ conservant identitat i dates", () => {
  const affirmation = normalizeAffirmation({
    id: "aid-legacy",
    projectId: "p",
    code: "A9",
    text: "afirmació antiga",
    type: "no-valid",
    assertiveness: "impossible",
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-21T09:00:00.000Z",
  });
  assert.equal(affirmation.id, "aid-legacy");
  assert.equal(affirmation.code, "A9");
  // valors invàlids cauen als per defecte segurs
  assert.equal(affirmation.type, "incondicional");
  assert.equal(affirmation.assertiveness, "moderada");
  assert.equal(affirmation.createdAt, "2026-07-20T09:00:00.000Z");
  assert.equal(affirmation.updatedAt, "2026-07-21T09:00:00.000Z");
});
