import assert from "node:assert/strict";
import test from "node:test";

import {
  createLink,
  hasLink,
  linkId,
  linksForAffirmation,
  linksForEvidence,
  normalizeLink,
  stanceInfo,
  summarizeStances,
} from "../lib/aid-eid-links.ts";

test("crea un enllaç AID–EID amb postura i derivació, i id determinista", () => {
  const link = createLink(
    {
      projectId: "origen-tarot",
      affirmationId: "aid-1",
      evidenceId: "eid-1",
      stance: "favorable",
      derivation: "cita-literal",
      note: "  clau  ",
    },
    { now: "2026-07-23T10:00:00.000Z" },
  );
  assert.equal(link.id, linkId("aid-1", "eid-1"));
  assert.equal(link.id, "link-aid-1::eid-1");
  assert.equal(link.stance, "favorable");
  assert.equal(link.derivation, "cita-literal");
  assert.equal(link.note, "clau");
});

test("l'id determinista fa que revincular la mateixa parella no dupliqui", () => {
  const a = createLink({ projectId: "p", affirmationId: "aid-9", evidenceId: "eid-9" });
  const b = createLink({
    projectId: "p",
    affirmationId: "aid-9",
    evidenceId: "eid-9",
    stance: "contraria",
  });
  assert.equal(a.id, b.id);
});

test("rebutja enllaços sense projecte, sense AID o sense EID", () => {
  assert.throws(
    () => createLink({ projectId: "", affirmationId: "a", evidenceId: "e" }),
    /projecte/,
  );
  assert.throws(
    () => createLink({ projectId: "p", affirmationId: "", evidenceId: "e" }),
    /afirmació|AID/,
  );
  assert.throws(
    () => createLink({ projectId: "p", affirmationId: "a", evidenceId: "" }),
    /evidència|EID/,
  );
});

test("consulta en tots dos sentits i detecta enllaços existents", () => {
  const links = [
    createLink({ projectId: "p", affirmationId: "aid-1", evidenceId: "eid-1" }),
    createLink({ projectId: "p", affirmationId: "aid-1", evidenceId: "eid-2", stance: "contraria" }),
    createLink({ projectId: "p", affirmationId: "aid-2", evidenceId: "eid-1", stance: "contextual" }),
  ];
  assert.deepEqual(
    linksForAffirmation(links, "aid-1").map((l) => l.evidenceId),
    ["eid-1", "eid-2"],
  );
  assert.deepEqual(
    linksForEvidence(links, "eid-1").map((l) => l.affirmationId),
    ["aid-1", "aid-2"],
  );
  assert.equal(hasLink(links, "aid-1", "eid-2"), true);
  assert.equal(hasLink(links, "aid-2", "eid-2"), false);
});

test("resumeix les postures d'un conjunt d'enllaços", () => {
  const links = [
    createLink({ projectId: "p", affirmationId: "aid-1", evidenceId: "eid-1", stance: "favorable" }),
    createLink({ projectId: "p", affirmationId: "aid-1", evidenceId: "eid-2", stance: "favorable" }),
    createLink({ projectId: "p", affirmationId: "aid-1", evidenceId: "eid-3", stance: "contraria" }),
  ];
  const summary = summarizeStances(links);
  assert.equal(summary.favorable, 2);
  assert.equal(summary.contraria, 1);
  assert.equal(summary.contextual, 0);
  assert.equal(summary.total, 3);
  assert.equal(stanceInfo("contraria").label, "En contra");
});

test("normalitza un enllaç d'un esquema previ amb valors segurs", () => {
  const link = normalizeLink({
    projectId: "p",
    affirmationId: "aid-5",
    evidenceId: "eid-5",
    stance: "no-valid",
    derivation: "cap",
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-21T09:00:00.000Z",
  });
  assert.equal(link.id, "link-aid-5::eid-5");
  assert.equal(link.stance, "favorable");
  assert.equal(link.derivation, "cita-literal");
  assert.equal(link.createdAt, "2026-07-20T09:00:00.000Z");
  assert.equal(link.updatedAt, "2026-07-21T09:00:00.000Z");
});
