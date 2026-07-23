// Funció 201 — Editor d'hipòtesis H1/H2/H3.
// Lògica pura per definir hipòtesis en competència amb l'ordre nomenclàtric
// immutable H1 = Consens, H2 = Ombra, H3 = Nova teoria. La persistència viu a
// `local-db`; aquí només hi ha la forma, la normalització i les regles.

export type HypothesisRole = "consens" | "ombra" | "nova";

export const HYPOTHESIS_ROLES: readonly {
  role: HypothesisRole;
  code: string;
  label: string;
  hint: string;
}[] = [
  {
    role: "consens",
    code: "H1",
    label: "Consens / Ortodòxia",
    hint: "La hipòtesi acceptada. Formula-la amb Red Teaming (font independent) i no la debilitis.",
  },
  {
    role: "ombra",
    code: "H2",
    label: "Hipòtesi ombra",
    hint: "L'alternativa plausible mínima que competeix amb el consens.",
  },
  {
    role: "nova",
    code: "H3",
    label: "Nova teoria",
    hint: "La teoria trencadora que es vol validar.",
  },
];

export type HypothesisReviewState =
  | "esborrany"
  | "en-revisio"
  | "validada"
  | "derrotada";

export const HYPOTHESIS_REVIEW_STATES: readonly {
  value: HypothesisReviewState;
  label: string;
}[] = [
  { value: "esborrany", label: "Esborrany" },
  { value: "en-revisio", label: "En revisió" },
  { value: "validada", label: "Validada" },
  { value: "derrotada", label: "Derrotada" },
];

// A partir de tres modificacions no previstes, una hipòtesi es marca com a
// «derrotada operativament» (docs/regles_derrota.md §4.4).
export const MAX_UNPLANNED_MODIFICATIONS = 3;

export type HypothesisModification = {
  date: string;
  change: string;
  reason: string;
  evidence: string;
};

export type Hypothesis = {
  id: string;
  projectId: string;
  code: string;
  role: HypothesisRole;
  title: string;
  statement: string;
  predictions: string;
  assumptions: string;
  defeatConditions: string;
  core: string;
  reviewState: HypothesisReviewState;
  source: string;
  modifications: HypothesisModification[];
  createdAt: string;
  updatedAt: string;
};

export function roleInfo(role: HypothesisRole) {
  return (
    HYPOTHESIS_ROLES.find((item) => item.role === role) ?? HYPOTHESIS_ROLES[0]
  );
}

export function codeForRole(role: HypothesisRole): string {
  return roleInfo(role).code;
}

export function reviewStateLabel(state: HypothesisReviewState): string {
  return (
    HYPOTHESIS_REVIEW_STATES.find((item) => item.value === state)?.label ??
    "Esborrany"
  );
}

// El consens i les hipòtesis rivals s'han de formular amb Red Teaming (Regla 10).
export function requiresRedTeaming(role: HypothesisRole): boolean {
  return role === "consens" || role === "ombra";
}

export function isOperationallyDefeated(hypothesis: {
  modifications: readonly unknown[];
}): boolean {
  return hypothesis.modifications.length >= MAX_UNPLANNED_MODIFICATIONS;
}

function isRole(value: unknown): value is HypothesisRole {
  return value === "consens" || value === "ombra" || value === "nova";
}

function isReviewState(value: unknown): value is HypothesisReviewState {
  return HYPOTHESIS_REVIEW_STATES.some((item) => item.value === value);
}

function createHypothesisId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `hyp-${suffix}`;
}

export function createHypothesis(
  input: { role: HypothesisRole; projectId: string; title?: string },
  options: { id?: string; now?: string } = {},
): Hypothesis {
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("La hipòtesi necessita un projecte associat");
  }
  if (!isRole(input.role)) {
    throw new TypeError("Rol d'hipòtesi no vàlid");
  }
  const now = options.now ?? new Date().toISOString();
  return {
    id: options.id ?? createHypothesisId(),
    projectId: input.projectId.trim(),
    code: codeForRole(input.role),
    role: input.role,
    title: (input.title ?? "").trim(),
    statement: "",
    predictions: "",
    assumptions: "",
    defeatConditions: "",
    core: "",
    reviewState: "esborrany",
    source: "",
    modifications: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeHypothesis(
  input: Partial<Hypothesis> & { projectId: string },
  options: { now?: string } = {},
): Hypothesis {
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("La hipòtesi necessita un projecte associat");
  }
  const role: HypothesisRole = isRole(input.role) ? input.role : "nova";
  const now = options.now ?? new Date().toISOString();
  const text = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  return {
    id: typeof input.id === "string" && input.id ? input.id : createHypothesisId(),
    projectId: input.projectId.trim(),
    code: typeof input.code === "string" && input.code ? input.code : codeForRole(role),
    role,
    title: text(input.title),
    statement: text(input.statement),
    predictions: text(input.predictions),
    assumptions: text(input.assumptions),
    defeatConditions: text(input.defeatConditions),
    core: text(input.core),
    reviewState: isReviewState(input.reviewState) ? input.reviewState : "esborrany",
    source: text(input.source),
    modifications: Array.isArray(input.modifications)
      ? input.modifications.filter(
          (item): item is HypothesisModification =>
            typeof item === "object" && item !== null,
        )
      : [],
    createdAt:
      typeof input.createdAt === "string" && input.createdAt
        ? input.createdAt
        : now,
    updatedAt: now,
  };
}

// Joc inicial ordenat H1 → H2 → H3 amb la nomenclatura obligatòria.
export function defaultHypotheses(projectId: string, now?: string): Hypothesis[] {
  return HYPOTHESIS_ROLES.map((entry) =>
    createHypothesis(
      { role: entry.role, projectId, title: entry.label },
      { id: `hyp-${entry.code.toLowerCase()}-${projectId}`, now },
    ),
  );
}
