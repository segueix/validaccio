import assert from "node:assert/strict";
import test from "node:test";

import {
  codeForRole,
  createHypothesis,
  defaultHypotheses,
  isOperationallyDefeated,
  normalizeHypothesis,
  requiresRedTeaming,
  reviewStateLabel,
} from "../lib/hypotheses.ts";

test("crea una hipòtesi amb el codi derivat del rol i camps buits", () => {
  const hypothesis = createHypothesis(
    { role: "nova", projectId: "project-a", title: "  La meva teoria  " },
    { id: "hyp-1", now: "2026-07-22T10:00:00.000Z" },
  );
  assert.equal(hypothesis.code, "H3");
  assert.equal(hypothesis.role, "nova");
  assert.equal(hypothesis.title, "La meva teoria");
  assert.equal(hypothesis.reviewState, "esborrany");
  assert.deepEqual(hypothesis.modifications, []);
  assert.equal(hypothesis.createdAt, "2026-07-22T10:00:00.000Z");
});

test("assigna la nomenclatura obligatòria H1/H2/H3", () => {
  assert.equal(codeForRole("consens"), "H1");
  assert.equal(codeForRole("ombra"), "H2");
  assert.equal(codeForRole("nova"), "H3");
});

test("el joc inicial conté les tres hipòtesis ordenades", () => {
  const set = defaultHypotheses("project-a", "2026-07-22T10:00:00.000Z");
  assert.deepEqual(
    set.map((hypothesis) => hypothesis.code),
    ["H1", "H2", "H3"],
  );
  assert.deepEqual(
    set.map((hypothesis) => hypothesis.role),
    ["consens", "ombra", "nova"],
  );
});

test("exigeix Red Teaming per al consens i l'ombra, no per a la nova teoria", () => {
  assert.equal(requiresRedTeaming("consens"), true);
  assert.equal(requiresRedTeaming("ombra"), true);
  assert.equal(requiresRedTeaming("nova"), false);
});

test("rebutja hipòtesis sense projecte i normalitza rols invàlids", () => {
  assert.throws(
    () => createHypothesis({ role: "nova", projectId: "" }),
    /projecte/,
  );
  const normalized = normalizeHypothesis({
    projectId: "project-a",
    role: "inventat" as never,
    reviewState: "desconegut" as never,
    statement: "  enunciat  ",
  });
  assert.equal(normalized.role, "nova");
  assert.equal(normalized.reviewState, "esborrany");
  assert.equal(normalized.statement, "enunciat");
});

test("marca com a derrotada operativament a partir de tres modificacions", () => {
  const mod = { date: "", change: "", reason: "", evidence: "" };
  assert.equal(isOperationallyDefeated({ modifications: [mod, mod] }), false);
  assert.equal(isOperationallyDefeated({ modifications: [mod, mod, mod] }), true);
  assert.equal(reviewStateLabel("validada"), "Validada");
});
