import assert from "node:assert/strict";
import test from "node:test";

import {
  createEvidence,
  evidenceInputFromNote,
  nextEvidenceCode,
  normalizeEvidence,
  qualityInfo,
} from "../lib/evidence.ts";
import { createCitableNote } from "../lib/citable-notes.ts";

test("crea una evidència amb descripció neutral, ancoratge i qualitat", () => {
  const evidence = createEvidence(
    {
      projectId: "origen-tarot",
      description: "  L'albarà de 1450 registra un pagament per un joc pintat.  ",
      sourceId: "source-1",
      page: 12,
      noteId: "note-9",
      family: "albarans-visconti",
      quality: "primaria",
    },
    { id: "eid-1", code: "E1", now: "2026-07-23T10:00:00.000Z" },
  );
  assert.equal(evidence.code, "E1");
  assert.equal(
    evidence.description,
    "L'albarà de 1450 registra un pagament per un joc pintat.",
  );
  assert.equal(evidence.sourceId, "source-1");
  assert.equal(evidence.page, 12);
  assert.equal(evidence.noteId, "note-9");
  assert.equal(evidence.family, "albarans-visconti");
  assert.equal(evidence.quality, "primaria");
});

test("rebutja evidències sense projecte o sense descripció neutral", () => {
  assert.throws(
    () => createEvidence({ projectId: "", description: "x" }),
    /projecte/,
  );
  assert.throws(
    () => createEvidence({ projectId: "p", description: "   " }),
    /descripció/,
  );
});

test("normalitza pàgina i enllaços buits, i qualitat desconeguda a «incerta»", () => {
  const evidence = createEvidence({
    projectId: "p",
    description: "fet",
    sourceId: "  ",
    page: 0,
    noteId: "",
  });
  assert.equal(evidence.sourceId, null);
  assert.equal(evidence.page, null);
  assert.equal(evidence.noteId, null);
  assert.equal(evidence.quality, "incerta");
  assert.equal(qualityInfo(evidence.quality).label, "Incerta");
});

test("genera codis EID seqüencials i no reutilitza els esborrats", () => {
  assert.equal(nextEvidenceCode([]), "E1");
  assert.equal(nextEvidenceCode(["E1", "E2", "E3"]), "E4");
  // Si s'esborra E2, el següent continua sent E4 (màxim + 1), no reomple forats.
  assert.equal(nextEvidenceCode(["E1", "E3"]), "E4");
  assert.equal(nextEvidenceCode(["E7", "no-eid", "E2"]), "E8");
});

test("construeix una evidència a partir d'un extracte citable (pont 107→204)", () => {
  const note = createCitableNote(
    {
      projectId: "origen-tarot",
      sourceId: "source-7",
      page: 5,
      quote: "«deboixat, pintat e acabat»",
      paraphrase: "El joc es va pintar i acabar a mà.",
      comment: "Indica un objecte de luxe.",
    },
    { id: "note-2" },
  );
  const evidence = createEvidence(evidenceInputFromNote(note), {
    id: "eid-2",
    code: "E5",
  });
  // La paràfrasi (neutral) és la descripció; la cita no s'hi barreja.
  assert.equal(evidence.description, "El joc es va pintar i acabar a mà.");
  assert.equal(evidence.sourceId, "source-7");
  assert.equal(evidence.page, 5);
  assert.equal(evidence.noteId, "note-2");
  assert.equal(evidence.code, "E5");
});

test("normalitza una evidència d'un esquema previ conservant identitat i dates", () => {
  const evidence = normalizeEvidence({
    id: "eid-legacy",
    projectId: "p",
    code: "E9",
    description: "fet antic",
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-21T09:00:00.000Z",
  });
  assert.equal(evidence.id, "eid-legacy");
  assert.equal(evidence.code, "E9");
  assert.equal(evidence.quality, "incerta");
  assert.equal(evidence.createdAt, "2026-07-20T09:00:00.000Z");
  assert.equal(evidence.updatedAt, "2026-07-21T09:00:00.000Z");
});
