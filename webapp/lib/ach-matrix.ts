// Funció 209 — Matriu ACH (Anàlisi d'Hipòtesis en Competència).
// Creua evidències (files EID) amb hipòtesis (columnes) i marca la consistència
// de cada evidència respecte cada hipòtesi: C (consistent), I (inconsistent) o
// N (neutral). El mètode de Heuer busca l'evidència DIAGNÒSTICA (la que discrimina
// entre hipòtesis) i selecciona la hipòtesi més difícil de refutar —la que acumula
// menys inconsistències. Aquí hi ha la lògica pura: cel·les, diagnosticitat,
// puntuació de refutació i exportació CSV. La persistència viu a `local-db`.

export type ConsistencyValue = "C" | "I" | "N";

export const CONSISTENCY_VALUES: readonly {
  value: ConsistencyValue;
  label: string;
  hint: string;
}[] = [
  { value: "C", label: "Consistent", hint: "L'evidència encaixa amb la hipòtesi." },
  { value: "I", label: "Inconsistent", hint: "L'evidència xoca amb la hipòtesi (pes diagnòstic)." },
  { value: "N", label: "Neutral", hint: "L'evidència no discrimina aquesta hipòtesi." },
];

export type MatrixCell = {
  id: string;
  projectId: string;
  evidenceId: string;
  hypothesisId: string;
  value: ConsistencyValue;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type MatrixCellInput = {
  projectId: string;
  evidenceId: string;
  hypothesisId: string;
  value: ConsistencyValue;
  comment?: string;
};

// Id determinista per parella (evidència, hipòtesi): una sola cel·la per creuament.
export function cellId(evidenceId: string, hypothesisId: string): string {
  return `cell-${evidenceId}::${hypothesisId}`;
}

export function isConsistencyValue(value: unknown): value is ConsistencyValue {
  return value === "C" || value === "I" || value === "N";
}

export function consistencyLabel(value: ConsistencyValue): string {
  return CONSISTENCY_VALUES.find((item) => item.value === value)?.label ?? "Neutral";
}

// La justificació és obligatòria quan es marca C o I: cap judici de consistència
// o inconsistència sense motiu escrit (doble codificació auditable del marc).
export function createCell(
  input: MatrixCellInput,
  options: { now?: string } = {},
): MatrixCell {
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("La cel·la necessita un projecte associat");
  }
  if (typeof input.evidenceId !== "string" || input.evidenceId.trim() === "") {
    throw new TypeError("La cel·la necessita una evidència (EID)");
  }
  if (typeof input.hypothesisId !== "string" || input.hypothesisId.trim() === "") {
    throw new TypeError("La cel·la necessita una hipòtesi");
  }
  if (!isConsistencyValue(input.value)) {
    throw new TypeError("Valor de consistència no vàlid (C/I/N)");
  }
  const comment = (input.comment ?? "").trim();
  if ((input.value === "C" || input.value === "I") && comment === "") {
    throw new TypeError("Marcar C o I exigeix un comentari que ho justifiqui");
  }
  const evidenceId = input.evidenceId.trim();
  const hypothesisId = input.hypothesisId.trim();
  const now = options.now ?? new Date().toISOString();
  return {
    id: cellId(evidenceId, hypothesisId),
    projectId: input.projectId.trim(),
    evidenceId,
    hypothesisId,
    value: input.value,
    comment,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeCell(
  raw: Record<string, unknown>,
  now = new Date().toISOString(),
): MatrixCell {
  const value: ConsistencyValue = isConsistencyValue(raw.value) ? raw.value : "N";
  const evidenceId = String(raw.evidenceId ?? "");
  const hypothesisId = String(raw.hypothesisId ?? "");
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : cellId(evidenceId, hypothesisId),
    projectId: String(raw.projectId ?? ""),
    evidenceId,
    hypothesisId,
    value,
    comment: typeof raw.comment === "string" ? raw.comment : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

export type Diagnosticity = "diagnostica" | "ornamental" | "incompleta";

// Diagnosticitat d'una evidència: si totes les hipòtesis estan valorades i els
// valors no són idèntics, discrimina (diagnòstica). Si són tots iguals, no
// discrimina (ornamental). Si en falta alguna, és incompleta.
export function diagnosticityFor(
  cells: readonly MatrixCell[],
  evidenceId: string,
  hypothesisIds: readonly string[],
): Diagnosticity {
  if (hypothesisIds.length === 0) return "incompleta";
  const byHypothesis = new Map<string, ConsistencyValue>();
  for (const cell of cells) {
    if (cell.evidenceId === evidenceId) {
      byHypothesis.set(cell.hypothesisId, cell.value);
    }
  }
  const values: ConsistencyValue[] = [];
  for (const id of hypothesisIds) {
    const value = byHypothesis.get(id);
    if (value === undefined) return "incompleta";
    values.push(value);
  }
  return new Set(values).size >= 2 ? "diagnostica" : "ornamental";
}

export type HypothesisScore = {
  hypothesisId: string;
  consistencies: number;
  inconsistencies: number;
  neutrals: number;
};

// Puntuació de refutació per hipòtesi: el mètode de Heuer prioritza la hipòtesi
// amb MENYS inconsistències (la més difícil de refutar), no la que té més suport.
export function scoreHypotheses(
  cells: readonly MatrixCell[],
  hypothesisIds: readonly string[],
): HypothesisScore[] {
  return hypothesisIds.map((hypothesisId) => {
    const score: HypothesisScore = {
      hypothesisId,
      consistencies: 0,
      inconsistencies: 0,
      neutrals: 0,
    };
    for (const cell of cells) {
      if (cell.hypothesisId !== hypothesisId) continue;
      if (cell.value === "C") score.consistencies += 1;
      else if (cell.value === "I") score.inconsistencies += 1;
      else score.neutrals += 1;
    }
    return score;
  });
}

// La(les) hipòtesi(s) amb menys inconsistències. Retorna els ids empatats al mínim.
export function leastRefutedHypotheses(scores: readonly HypothesisScore[]): string[] {
  const scored = scores.filter((score) =>
    score.consistencies + score.inconsistencies + score.neutrals > 0,
  );
  if (scored.length === 0) return [];
  const min = Math.min(...scored.map((score) => score.inconsistencies));
  return scored
    .filter((score) => score.inconsistencies === min)
    .map((score) => score.hypothesisId);
}

export type MatrixRow = {
  evidenceId: string;
  values: Record<string, ConsistencyValue | null>;
  diagnosticity: Diagnosticity;
};

export function buildMatrix(
  cells: readonly MatrixCell[],
  evidenceIds: readonly string[],
  hypothesisIds: readonly string[],
): MatrixRow[] {
  const lookup = new Map<string, ConsistencyValue>();
  for (const cell of cells) {
    lookup.set(cellId(cell.evidenceId, cell.hypothesisId), cell.value);
  }
  return evidenceIds.map((evidenceId) => {
    const values: Record<string, ConsistencyValue | null> = {};
    for (const hypothesisId of hypothesisIds) {
      values[hypothesisId] = lookup.get(cellId(evidenceId, hypothesisId)) ?? null;
    }
    return {
      evidenceId,
      values,
      diagnosticity: diagnosticityFor(cells, evidenceId, hypothesisIds),
    };
  });
}

function csvField(value: string): string {
  const needsQuote = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

// Exportació CSV compatible amb fulls de càlcul: files EID, columnes d'hipòtesi.
export function toCsv(
  rows: readonly MatrixRow[],
  columns: readonly { hypothesisId: string; code: string }[],
  evidenceCodeById: (id: string) => string,
): string {
  const header = [
    "EID",
    ...columns.map((column) => column.code),
    "Diagnosticitat",
  ];
  const lines = [header.map(csvField).join(",")];
  for (const row of rows) {
    const line = [
      evidenceCodeById(row.evidenceId),
      ...columns.map((column) => row.values[column.hypothesisId] ?? ""),
      row.diagnosticity,
    ];
    lines.push(line.map((value) => csvField(String(value))).join(","));
  }
  return lines.join("\n");
}
