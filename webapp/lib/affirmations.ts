// Funció 205 — Registre d'afirmacions (AID).
// Cada afirmació factual de l'obra rep un codi AID únic i estable (A1, A2…) i es
// classifica segons la «bifurcació de la certesa» del marc de validació:
//   · incondicional (mecànica): fet verificable que no depèn de cap atribució;
//   · condicional (atributiva): atribució a autor, tradició o context, que queda
//     oberta si falta evidència documental diagnòstica.
// El grau d'assertivitat fa servir l'escala ordinal de cinc nivells (estàndard
// per defecte del marc). L'objectiu és marcar l'assertivitat de manera homogènia
// i coherent amb l'evidència, sense tensions internes. La persistència i l'enllaç
// amb les evidències (funció 206) viuen fora d'aquest mòdul.

export type AffirmationType = "incondicional" | "condicional";

export const AFFIRMATION_TYPES: readonly {
  value: AffirmationType;
  label: string;
  hint: string;
}[] = [
  {
    value: "incondicional",
    label: "Incondicional (mecànica)",
    hint: "Fet estructural verificable per comprovació tècnica directa. Cap atribució el pot rebaixar retroactivament.",
  },
  {
    value: "condicional",
    label: "Condicional (atributiva)",
    hint: "Atribució a autor, tradició o context. Queda oberta o provisional si falta evidència documental diagnòstica.",
  },
];

// Escala ordinal de cinc nivells: estàndard per defecte del marc de validació,
// per evitar la falsa precisió numèrica.
export type Assertiveness =
  | "molt-baixa"
  | "baixa"
  | "moderada"
  | "alta"
  | "molt-alta";

export const ASSERTIVENESS_LEVELS: readonly {
  value: Assertiveness;
  label: string;
  rank: number;
}[] = [
  { value: "molt-baixa", label: "Molt baixa", rank: 1 },
  { value: "baixa", label: "Baixa", rank: 2 },
  { value: "moderada", label: "Moderada", rank: 3 },
  { value: "alta", label: "Alta", rank: 4 },
  { value: "molt-alta", label: "Molt alta", rank: 5 },
];

export type AffirmationReviewState =
  | "esborrany"
  | "en-revisio"
  | "validada"
  | "retirada";

export const AFFIRMATION_REVIEW_STATES: readonly {
  value: AffirmationReviewState;
  label: string;
}[] = [
  { value: "esborrany", label: "Esborrany" },
  { value: "en-revisio", label: "En revisió" },
  { value: "validada", label: "Validada" },
  { value: "retirada", label: "Retirada" },
];

export type Affirmation = {
  id: string;
  projectId: string;
  code: string;
  text: string;
  type: AffirmationType;
  chapter: string;
  reviewState: AffirmationReviewState;
  assertiveness: Assertiveness;
  createdAt: string;
  updatedAt: string;
};

export type AffirmationInput = {
  projectId: string;
  text?: string;
  type?: AffirmationType;
  chapter?: string;
  reviewState?: AffirmationReviewState;
  assertiveness?: Assertiveness;
};

function createAffirmationId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `aid-${suffix}`;
}

export function affirmationTypeInfo(type: AffirmationType) {
  return (
    AFFIRMATION_TYPES.find((item) => item.value === type) ?? AFFIRMATION_TYPES[0]
  );
}

export function assertivenessInfo(value: Assertiveness) {
  return (
    ASSERTIVENESS_LEVELS.find((item) => item.value === value) ??
    ASSERTIVENESS_LEVELS[2]
  );
}

export function affirmationStateLabel(state: AffirmationReviewState): string {
  return (
    AFFIRMATION_REVIEW_STATES.find((item) => item.value === state)?.label ??
    "Esborrany"
  );
}

export function isAffirmationType(value: unknown): value is AffirmationType {
  return AFFIRMATION_TYPES.some((item) => item.value === value);
}

export function isAssertiveness(value: unknown): value is Assertiveness {
  return ASSERTIVENESS_LEVELS.some((item) => item.value === value);
}

export function isAffirmationState(
  value: unknown,
): value is AffirmationReviewState {
  return AFFIRMATION_REVIEW_STATES.some((item) => item.value === value);
}

// Una afirmació condicional (atributiva) exigeix evidència documental diagnòstica;
// és el recordatori per no sobre-assertar una atribució sense suport.
export function requiresDiagnosticEvidence(type: AffirmationType): boolean {
  return type === "condicional";
}

// Codi AID seqüencial i únic per projecte: A1, A2, A3… El següent és el màxim
// numèric existent més un, de manera que esborrar-ne un no reutilitza el número.
export function nextAffirmationCode(existingCodes: readonly string[]): string {
  let max = 0;
  for (const code of existingCodes) {
    const match = /^A(\d+)$/.exec((code ?? "").trim());
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  return `A${max + 1}`;
}

export function createAffirmation(
  input: AffirmationInput,
  options: { id?: string; code?: string; now?: string } = {},
): Affirmation {
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("L'afirmació necessita un projecte associat");
  }
  const text = (input.text ?? "").trim();
  if (text === "") {
    throw new TypeError("L'afirmació necessita el text exacte");
  }
  const now = options.now ?? new Date().toISOString();
  return {
    id: options.id ?? createAffirmationId(),
    projectId: input.projectId.trim(),
    code: (options.code ?? "A1").trim(),
    text,
    type: isAffirmationType(input.type) ? input.type : "incondicional",
    chapter: (input.chapter ?? "").trim(),
    reviewState: isAffirmationState(input.reviewState)
      ? input.reviewState
      : "esborrany",
    assertiveness: isAssertiveness(input.assertiveness)
      ? input.assertiveness
      : "moderada",
    createdAt: now,
    updatedAt: now,
  };
}

// Carrega defensiva: completa camps que faltin sense perdre dades d'esquemes previs.
export function normalizeAffirmation(
  raw: Record<string, unknown>,
  now = new Date().toISOString(),
): Affirmation {
  const base = createAffirmation(
    {
      projectId: String(raw.projectId ?? ""),
      text: typeof raw.text === "string" ? raw.text : "—",
      type: isAffirmationType(raw.type) ? raw.type : "incondicional",
      chapter: typeof raw.chapter === "string" ? raw.chapter : "",
      reviewState: isAffirmationState(raw.reviewState)
        ? raw.reviewState
        : "esborrany",
      assertiveness: isAssertiveness(raw.assertiveness)
        ? raw.assertiveness
        : "moderada",
    },
    {
      id: typeof raw.id === "string" && raw.id ? raw.id : undefined,
      code: typeof raw.code === "string" && raw.code ? raw.code : "A1",
      now: typeof raw.createdAt === "string" ? raw.createdAt : now,
    },
  );
  return {
    ...base,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.createdAt,
  };
}
