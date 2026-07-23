// Funció 206 — Enllaç AID ↔ EID.
// Connecta cada afirmació (AID) amb les evidències (EID) que la sustenten,
// la contradiuen o la contextualitzen, i registra com se'n deriva l'afirmació
// (cita literal, paràfrasi o inferència). L'enllaç és navegable en tots dos
// sentits: des de l'afirmació es veuen les evidències, i des de l'evidència
// es veuen les afirmacions que hi depenen. La persistència viu a `local-db`.

export type EvidenceStance = "favorable" | "contraria" | "contextual";

export const EVIDENCE_STANCES: readonly {
  value: EvidenceStance;
  label: string;
  hint: string;
}[] = [
  {
    value: "favorable",
    label: "A favor",
    hint: "L'evidència sosté l'afirmació.",
  },
  {
    value: "contraria",
    label: "En contra",
    hint: "L'evidència posa en dubte o contradiu l'afirmació.",
  },
  {
    value: "contextual",
    label: "Context",
    hint: "L'evidència situa l'afirmació sense sostenir-la ni contradir-la.",
  },
];

// Distinció explícita exigida pel marc de validació: com es deriva l'afirmació
// de l'evidència. La inferència és el suport més feble i s'ha de marcar com a tal.
export type DerivationType = "cita-literal" | "parafrasi" | "inferencia";

export const DERIVATION_TYPES: readonly {
  value: DerivationType;
  label: string;
}[] = [
  { value: "cita-literal", label: "Cita literal" },
  { value: "parafrasi", label: "Paràfrasi" },
  { value: "inferencia", label: "Inferència" },
];

export type AidEidLink = {
  id: string;
  projectId: string;
  affirmationId: string;
  evidenceId: string;
  stance: EvidenceStance;
  derivation: DerivationType;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type AidEidLinkInput = {
  projectId: string;
  affirmationId: string;
  evidenceId: string;
  stance?: EvidenceStance;
  derivation?: DerivationType;
  note?: string;
};

// Id determinista a partir de la parella: garanteix un únic enllaç per (AID, EID),
// de manera que tornar a vincular-los n'actualitza l'estat en comptes de duplicar.
export function linkId(affirmationId: string, evidenceId: string): string {
  return `link-${affirmationId}::${evidenceId}`;
}

export function isStance(value: unknown): value is EvidenceStance {
  return EVIDENCE_STANCES.some((item) => item.value === value);
}

export function isDerivation(value: unknown): value is DerivationType {
  return DERIVATION_TYPES.some((item) => item.value === value);
}

export function stanceInfo(stance: EvidenceStance) {
  return EVIDENCE_STANCES.find((item) => item.value === stance) ?? EVIDENCE_STANCES[0];
}

export function derivationLabel(derivation: DerivationType): string {
  return (
    DERIVATION_TYPES.find((item) => item.value === derivation)?.label ??
    "Cita literal"
  );
}

export function createLink(
  input: AidEidLinkInput,
  options: { now?: string } = {},
): AidEidLink {
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("L'enllaç necessita un projecte associat");
  }
  if (typeof input.affirmationId !== "string" || input.affirmationId.trim() === "") {
    throw new TypeError("L'enllaç necessita una afirmació (AID)");
  }
  if (typeof input.evidenceId !== "string" || input.evidenceId.trim() === "") {
    throw new TypeError("L'enllaç necessita una evidència (EID)");
  }
  const affirmationId = input.affirmationId.trim();
  const evidenceId = input.evidenceId.trim();
  const now = options.now ?? new Date().toISOString();
  return {
    id: linkId(affirmationId, evidenceId),
    projectId: input.projectId.trim(),
    affirmationId,
    evidenceId,
    stance: isStance(input.stance) ? input.stance : "favorable",
    derivation: isDerivation(input.derivation) ? input.derivation : "cita-literal",
    note: (input.note ?? "").trim(),
    createdAt: now,
    updatedAt: now,
  };
}

// Carrega defensiva: completa camps que faltin sense perdre dades d'esquemes previs.
export function normalizeLink(
  raw: Record<string, unknown>,
  now = new Date().toISOString(),
): AidEidLink {
  const base = createLink(
    {
      projectId: String(raw.projectId ?? ""),
      affirmationId: String(raw.affirmationId ?? ""),
      evidenceId: String(raw.evidenceId ?? ""),
      stance: isStance(raw.stance) ? raw.stance : "favorable",
      derivation: isDerivation(raw.derivation) ? raw.derivation : "cita-literal",
      note: typeof raw.note === "string" ? raw.note : "",
    },
    { now: typeof raw.createdAt === "string" ? raw.createdAt : now },
  );
  return {
    ...base,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.createdAt,
  };
}

export function linksForAffirmation(
  links: readonly AidEidLink[],
  affirmationId: string,
): AidEidLink[] {
  return links.filter((link) => link.affirmationId === affirmationId);
}

export function linksForEvidence(
  links: readonly AidEidLink[],
  evidenceId: string,
): AidEidLink[] {
  return links.filter((link) => link.evidenceId === evidenceId);
}

export function hasLink(
  links: readonly AidEidLink[],
  affirmationId: string,
  evidenceId: string,
): boolean {
  return links.some(
    (link) =>
      link.affirmationId === affirmationId && link.evidenceId === evidenceId,
  );
}

export type StanceSummary = {
  favorable: number;
  contraria: number;
  contextual: number;
  total: number;
};

// Resum de postures d'un conjunt d'enllaços; alimenta la lectura ràpida de si una
// afirmació té suport, oposició o només context.
export function summarizeStances(links: readonly AidEidLink[]): StanceSummary {
  const summary: StanceSummary = {
    favorable: 0,
    contraria: 0,
    contextual: 0,
    total: links.length,
  };
  for (const link of links) {
    summary[link.stance] += 1;
  }
  return summary;
}
