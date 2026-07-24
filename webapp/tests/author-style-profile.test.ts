import assert from "node:assert/strict";
import test from "node:test";

import {
  approveAuthorStyleProfile,
  extractAuthorStyleProfile,
  reviseAuthorStyleProfile,
  STYLE_PROFILE_SECTION_KEYS,
} from "../lib/author-style-profile.ts";
import { type ManuscriptRecord } from "../lib/manuscripts.ts";

const now = "2026-07-24T12:00:00.000Z";

function manuscript(workingText: string): ManuscriptRecord {
  return {
    id: "manuscript-joc-oca",
    projectId: "project-a",
    name: "El joc de l’oca.md",
    kind: "markdown",
    mime: "text/markdown",
    size: workingText.length,
    originalSha256: "a".repeat(64),
    importedAt: now,
    updatedAt: now,
    workingText,
    wordCount: 100,
    paragraphCount: 4,
  };
}

const referenceText = `# El joc de l’oca

La documentació identifica un recorregut precís i confirma la relació entre les caselles. Aquest conjunt de proves demostra que l’estructura no és accidental.

En canvi, la hipòtesi tradicional podria semblar plausible si cada indici s’estudiés de manera aïllada. Tanmateix, veiem que les coincidències formen un sistema coherent.

Per tant, l’anàlisi atribueix l’obra al context documentat i estableix una conclusió directa. Nosaltres podem revisar cada afirmació, però no cal convertir una atribució sustentada en una possibilitat vaga.`;

test("extreu un perfil mesurable del llibre de referència", () => {
  const profile = extractAuthorStyleProfile(manuscript(referenceText), now);

  assert.equal(profile.sourceName, "El joc de l’oca.md");
  assert.equal(profile.status, "draft");
  assert.ok(profile.metrics.wordCount >= 70);
  assert.equal(profile.metrics.headingCount, 1);
  assert.ok(profile.metrics.assertiveMarkers > profile.metrics.hedgeMarkers);
  assert.ok(profile.topTerms.length > 0);
  assert.ok(profile.connectors.some((item) => item.term === "per tant"));
  for (const key of STYLE_PROFILE_SECTION_KEYS) {
    assert.ok(profile.sections[key].length > 0);
  }
});

test("distingeix atribució assertiva de fórmules hipotètiques", () => {
  const profile = extractAuthorStyleProfile(manuscript(referenceText), now);

  assert.ok(profile.metrics.attributionMarkers >= 3);
  assert.ok(profile.metrics.hypothesisMarkers >= 2);
  assert.match(profile.sections.assertiveness, /assertives/);
  assert.match(profile.sections.attribution, /AID\/EID/);
  assert.match(profile.sections.avoid, /«podria»|«hipòtesi»/);
});

test("conserva exemples breus que permeten revisar la lectura automàtica", () => {
  const profile = extractAuthorStyleProfile(manuscript(referenceText), now);

  assert.ok(profile.markerExamples.length > 0);
  assert.ok(profile.markerExamples.length <= 5);
  assert.ok(profile.markerExamples.every((example) => example.length <= 220));
});

test("una revisió humana reobre el perfil com a esborrany", () => {
  const extracted = extractAuthorStyleProfile(manuscript(referenceText), now);
  const approved = approveAuthorStyleProfile(
    extracted,
    "2026-07-24T12:01:00.000Z",
  );
  const revised = reviseAuthorStyleProfile(
    approved,
    {
      ...approved.sections,
      voice: "Veu pròpia revisada per l’autor.",
    },
    "2026-07-24T12:02:00.000Z",
  );

  assert.equal(approved.status, "approved");
  assert.equal(revised.status, "draft");
  assert.equal(revised.approvedAt, null);
  assert.equal(revised.sections.voice, "Veu pròpia revisada per l’autor.");
  assert.equal(revised.revision, 3);
});

test("no aprova un perfil amb apartats buits", () => {
  const profile = extractAuthorStyleProfile(manuscript(referenceText), now);
  assert.throws(
    () =>
      approveAuthorStyleProfile({
        ...profile,
        sections: { ...profile.sections, attribution: "" },
      }),
    /tots els apartats/,
  );
});

test("rebutja textos massa breus per inferir-ne l’estil", () => {
  assert.throws(
    () =>
      extractAuthorStyleProfile(
        manuscript("Això és només una frase massa curta."),
      ),
    /almenys 40 paraules/,
  );
});
