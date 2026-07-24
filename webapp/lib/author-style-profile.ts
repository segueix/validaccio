// Funció 305 — Perfil d'estil local, mesurable i revisable per l'autor.

import { type ManuscriptRecord } from "./manuscripts.ts";

export const STYLE_PROFILE_SECTION_KEYS = [
  "voice",
  "rhythm",
  "lexicon",
  "structure",
  "assertiveness",
  "attribution",
  "avoid",
] as const;

export type StyleProfileSectionKey =
  (typeof STYLE_PROFILE_SECTION_KEYS)[number];

export type StyleProfileSections = Record<StyleProfileSectionKey, string>;

export type StyleProfileStatus = "draft" | "approved";

export type StyleTerm = {
  term: string;
  count: number;
};

export type StyleProfileMetrics = {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  headingCount: number;
  averageSentenceWords: number;
  medianSentenceWords: number;
  averageParagraphWords: number;
  firstPersonSingular: number;
  firstPersonPlural: number;
  assertiveMarkers: number;
  hedgeMarkers: number;
  attributionMarkers: number;
  hypothesisMarkers: number;
};

export type AuthorStyleProfile = {
  id: string;
  projectId: string;
  sourceManuscriptId: string;
  sourceName: string;
  sourceSha256: string;
  status: StyleProfileStatus;
  revision: number;
  sections: StyleProfileSections;
  metrics: StyleProfileMetrics;
  topTerms: StyleTerm[];
  connectors: StyleTerm[];
  markerExamples: string[];
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
};

const STOP_WORDS = new Set([
  "a",
  "al",
  "als",
  "amb",
  "aquest",
  "aquesta",
  "aquestes",
  "aquests",
  "com",
  "d",
  "de",
  "del",
  "dels",
  "el",
  "els",
  "en",
  "entre",
  "es",
  "és",
  "ha",
  "hi",
  "i",
  "la",
  "les",
  "més",
  "no",
  "o",
  "per",
  "però",
  "que",
  "se",
  "sense",
  "sobre",
  "són",
  "també",
  "un",
  "una",
  "unes",
  "uns",
]);

const CONNECTORS = [
  "així",
  "ara bé",
  "d’aquesta manera",
  "en canvi",
  "en conseqüència",
  "en efecte",
  "per tant",
  "tanmateix",
] as const;

const ASSERTIVE_MARKERS = [
  "atribueix",
  "confirma",
  "conclou",
  "demostra",
  "documenta",
  "evidencia",
  "estableix",
  "identifica",
  "prova",
] as const;

const HEDGE_MARKERS = [
  "hipòtesi",
  "podria",
  "podrien",
  "potser",
  "possiblement",
  "probablement",
  "sembla",
  "semblaria",
  "suposadament",
  "tal vegada",
] as const;

const ATTRIBUTION_MARKERS = [
  "atribueix",
  "atribució",
  "autor",
  "autoria",
  "documenta",
  "identifica",
  "obra de",
  "taller de",
] as const;

const HYPOTHESIS_MARKERS = [
  ...HEDGE_MARKERS,
  "proposa",
  "suggereix",
] as const;

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function words(text: string): string[] {
  return text.toLocaleLowerCase("ca-ES").match(/[\p{L}\p{N}·'-]+/gu) ?? [];
}

function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function sentences(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/(?<=[.!?…])(?:\s+|\n+)|\n{2,}/u)
    .map((sentence) => sentence.replace(/^#{1,6}\s+/, "").trim())
    .filter((sentence) => words(sentence).length > 0);
}

function countPhrase(text: string, phrase: string): number {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(
    `(^|[^\\p{L}])${escaped}(?=$|[^\\p{L}])`,
    "gu",
  );
  return Array.from(text.matchAll(expression)).length;
}

function countMarkers(text: string, markers: readonly string[]): number {
  return markers.reduce(
    (total, marker) => total + countPhrase(text, marker),
    0,
  );
}

function rankedTerms(text: string, limit = 10): StyleTerm[] {
  const counts = new Map<string, number>();
  for (const token of words(text)) {
    if (token.length < 4 || STOP_WORDS.has(token) || /^\d+$/u.test(token)) {
      continue;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.term.localeCompare(right.term, "ca"),
    )
    .slice(0, limit);
}

function rankedMarkers(
  text: string,
  markers: readonly string[],
): StyleTerm[] {
  return markers
    .map((term) => ({ term, count: countPhrase(text, term) }))
    .filter((item) => item.count > 0)
    .sort(
      (left, right) =>
        right.count - left.count || left.term.localeCompare(right.term, "ca"),
    );
}

function markerExamples(text: string): string[] {
  const allMarkers = [
    ...ASSERTIVE_MARKERS,
    ...HEDGE_MARKERS,
    ...ATTRIBUTION_MARKERS,
  ];
  return sentences(text)
    .filter((sentence) => {
      const lower = sentence.toLocaleLowerCase("ca-ES");
      return allMarkers.some((marker) => countPhrase(lower, marker) > 0);
    })
    .map((sentence) =>
      sentence.length > 220 ? `${sentence.slice(0, 217)}…` : sentence,
    )
    .slice(0, 5);
}

function metricSections(
  metrics: StyleProfileMetrics,
  topTerms: StyleTerm[],
  connectors: StyleTerm[],
  hedges: StyleTerm[],
): StyleProfileSections {
  const voice =
    metrics.firstPersonSingular === 0 && metrics.firstPersonPlural === 0
      ? "Veu expositiva predominantment impersonal o en tercera persona."
      : metrics.firstPersonPlural >= metrics.firstPersonSingular
        ? "Veu expositiva amb preferència per la primera persona del plural."
        : "Veu expositiva amb presència de la primera persona del singular.";
  const assertiveness =
    metrics.assertiveMarkers > metrics.hedgeMarkers
      ? "Predomini de formulacions assertives. Les conclusions es presenten directament quan l’argument ja s’ha establert."
      : metrics.assertiveMarkers === metrics.hedgeMarkers
        ? "Equilibri entre formulacions assertives i cauteloses; cal revisar cas per cas quines reserves són necessàries."
        : "Presència elevada de fórmules cauteloses. Cal revisar si expressen una incertesa real o debiliten una atribució ja sustentada.";
  const attribution =
    metrics.attributionMarkers >= metrics.hypothesisMarkers
      ? "Tendència a formular atribucions directes. L’atribució s’ha de conservar quan convergeixen evidències suficients; el perfil d’estil no substitueix la verificació AID/EID."
      : "Tendència a formular possibilitats o hipòtesis. Cal convertir-les en atribució només quan la traçabilitat AID/EID i l’evidència diagnòstica ho permetin.";
  const avoidTerms = hedges.map((item) => `«${item.term}»`).join(", ");

  return {
    voice,
    rhythm: `Frases d’una mitjana de ${metrics.averageSentenceWords} paraules (mediana ${metrics.medianSentenceWords}) i paràgrafs de ${metrics.averageParagraphWords} paraules de mitjana. Alternar desenvolupament argumental i frases conclusives breus.`,
    lexicon: topTerms.length
      ? `Lèxic recurrent: ${topTerms.map((item) => item.term).join(", ")}.${connectors.length ? ` Connectors habituals: ${connectors.map((item) => item.term).join(", ")}.` : ""}`
      : "No hi ha prou lèxic significatiu per descriure aquest apartat.",
    structure: `Estructura detectada: ${metrics.headingCount} encapçalaments i ${metrics.paragraphCount} paràgrafs. Prioritzar una progressió visible de documentació, connexió d’evidències i conclusió.`,
    assertiveness,
    attribution,
    avoid: avoidTerms
      ? `Usos que cal revisar, perquè poden introduir cautela no necessària: ${avoidTerms}. No substituir una atribució sustentada per una fórmula vaga ni presentar com a cert allò que encara no té traça suficient.`
      : "Evitar hipòtesis ad hoc, cauteles vagues i atribucions sense traça. No rebaixar a possibilitat una atribució que ja estigui sustentada per evidències convergents.",
  };
}

export function normalizeAuthorStyleProfile(
  input: AuthorStyleProfile,
): AuthorStyleProfile {
  if (
    !input.id.trim() ||
    !input.projectId.trim() ||
    !input.sourceManuscriptId.trim() ||
    !input.sourceName.trim() ||
    !input.sourceSha256.trim()
  ) {
    throw new TypeError(
      "El perfil necessita projecte, llibre de referència i origen verificable.",
    );
  }
  const sections = Object.fromEntries(
    STYLE_PROFILE_SECTION_KEYS.map((key) => [
      key,
      String(input.sections?.[key] ?? "").trim(),
    ]),
  ) as StyleProfileSections;
  return {
    ...input,
    id: input.id.trim(),
    projectId: input.projectId.trim(),
    sourceManuscriptId: input.sourceManuscriptId.trim(),
    sourceName: input.sourceName.trim(),
    sourceSha256: input.sourceSha256.trim(),
    status: input.status === "approved" ? "approved" : "draft",
    revision: Math.max(1, Math.trunc(input.revision)),
    sections,
    topTerms: (input.topTerms ?? []).slice(0, 12),
    connectors: (input.connectors ?? []).slice(0, CONNECTORS.length),
    markerExamples: (input.markerExamples ?? []).slice(0, 5),
    approvedAt: input.status === "approved" ? input.approvedAt || null : null,
  };
}

export function extractAuthorStyleProfile(
  manuscript: ManuscriptRecord,
  now = new Date().toISOString(),
): AuthorStyleProfile {
  const text = manuscript.workingText.trim();
  const allWords = words(text);
  const allSentences = sentences(text);
  const allParagraphs = paragraphs(text);
  if (allWords.length < 40 || allSentences.length < 2) {
    throw new TypeError(
      "El llibre de referència necessita almenys 40 paraules i dues frases.",
    );
  }
  const sentenceLengths = allSentences
    .map((sentence) => words(sentence).length)
    .sort((left, right) => left - right);
  const paragraphLengths = allParagraphs.map(
    (paragraph) => words(paragraph).length,
  );
  const lower = text.toLocaleLowerCase("ca-ES");
  const topTerms = rankedTerms(text);
  const connectorTerms = rankedMarkers(lower, CONNECTORS);
  const hedgeTerms = rankedMarkers(lower, HEDGE_MARKERS);
  const metrics: StyleProfileMetrics = {
    wordCount: allWords.length,
    sentenceCount: allSentences.length,
    paragraphCount: allParagraphs.length,
    headingCount: text
      .split(/\r?\n/u)
      .filter((line) => /^#{1,6}\s+\S/u.test(line.trim())).length,
    averageSentenceWords: round(allWords.length / allSentences.length),
    medianSentenceWords:
      sentenceLengths[Math.floor(sentenceLengths.length / 2)] ?? 0,
    averageParagraphWords: round(
      paragraphLengths.reduce((sum, value) => sum + value, 0) /
        allParagraphs.length,
    ),
    firstPersonSingular: countMarkers(lower, ["jo", "meu", "meva", "considero"]),
    firstPersonPlural: countMarkers(lower, [
      "nosaltres",
      "nostre",
      "nostra",
      "veiem",
      "podem",
    ]),
    assertiveMarkers: countMarkers(lower, ASSERTIVE_MARKERS),
    hedgeMarkers: countMarkers(lower, HEDGE_MARKERS),
    attributionMarkers: countMarkers(lower, ATTRIBUTION_MARKERS),
    hypothesisMarkers: countMarkers(lower, HYPOTHESIS_MARKERS),
  };
  return normalizeAuthorStyleProfile({
    id: `author-style:${manuscript.projectId}`,
    projectId: manuscript.projectId,
    sourceManuscriptId: manuscript.id,
    sourceName: manuscript.name,
    sourceSha256: manuscript.originalSha256,
    status: "draft",
    revision: 1,
    sections: metricSections(metrics, topTerms, connectorTerms, hedgeTerms),
    metrics,
    topTerms,
    connectors: connectorTerms,
    markerExamples: markerExamples(text),
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
  });
}

export function reviseAuthorStyleProfile(
  profile: AuthorStyleProfile,
  sections: StyleProfileSections,
  now = new Date().toISOString(),
): AuthorStyleProfile {
  return normalizeAuthorStyleProfile({
    ...profile,
    sections,
    status: "draft",
    revision: profile.revision + 1,
    updatedAt: now,
    approvedAt: null,
  });
}

export function approveAuthorStyleProfile(
  profile: AuthorStyleProfile,
  now = new Date().toISOString(),
): AuthorStyleProfile {
  const normalized = normalizeAuthorStyleProfile(profile);
  const missing = STYLE_PROFILE_SECTION_KEYS.find(
    (key) => !normalized.sections[key],
  );
  if (missing) {
    throw new TypeError(
      "Revisa tots els apartats abans d’aprovar el perfil.",
    );
  }
  return normalizeAuthorStyleProfile({
    ...normalized,
    status: "approved",
    revision: normalized.revision + 1,
    updatedAt: now,
    approvedAt: now,
  });
}
