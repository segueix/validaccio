// Funció 101 — Importació local de fonts.
// Lògica pura i comprovable per validar i registrar fonts documentals. Aquesta
// funció només valida el tipus i la mida i crea la fitxa (metadades) de la font;
// l'emmagatzematge del contingut (blobs) correspon a la funció 102.

export const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // 25 MB

export type SourceKind = "pdf" | "docx" | "text" | "markdown" | "image";

export type AcceptedType = {
  kind: SourceKind;
  label: string;
  mimeTypes: readonly string[];
  extensions: readonly string[];
};

export const ACCEPTED_SOURCE_TYPES: readonly AcceptedType[] = [
  {
    kind: "pdf",
    label: "PDF",
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
  {
    kind: "docx",
    label: "Word (DOCX)",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: [".docx"],
  },
  {
    kind: "text",
    label: "Text",
    mimeTypes: ["text/plain"],
    extensions: [".txt"],
  },
  {
    kind: "markdown",
    label: "Markdown",
    mimeTypes: ["text/markdown", "text/x-markdown"],
    extensions: [".md", ".markdown"],
  },
  {
    kind: "image",
    label: "Imatge",
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/tiff"],
    extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".tif", ".tiff"],
  },
];

// Cadena per a l'atribut `accept` d'un <input type="file">.
export const SOURCE_ACCEPT_ATTR = ACCEPTED_SOURCE_TYPES.flatMap((type) => [
  ...type.mimeTypes,
  ...type.extensions,
]).join(",");

export type SourceRecord = {
  id: string;
  projectId: string;
  name: string;
  kind: SourceKind;
  mime: string;
  size: number;
  importedAt: string;
};

export type SourceFileInput = {
  name: string;
  type: string;
  size: number;
};

export type SourceValidationError = "empty-file" | "too-large" | "unsupported-type";

export type SourceValidation =
  | { ok: true; kind: SourceKind; label: string }
  | { ok: false; code: SourceValidationError; message: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function classifySource(input: {
  name: string;
  type: string;
}): AcceptedType | null {
  const mime = input.type.trim().toLowerCase();
  // El MIME té prioritat, però els navegadors sovint el deixen buit o genèric
  // (típic en Markdown), així que es recorre a l'extensió.
  if (mime && mime !== "application/octet-stream") {
    const byMime = ACCEPTED_SOURCE_TYPES.find((type) =>
      type.mimeTypes.includes(mime),
    );
    if (byMime) return byMime;
  }
  const extension = extensionOf(input.name);
  return (
    ACCEPTED_SOURCE_TYPES.find((type) => type.extensions.includes(extension)) ??
    null
  );
}

function formatMegabytes(bytes: number): string {
  const value = new Intl.NumberFormat("ca-ES", {
    maximumFractionDigits: 1,
  }).format(bytes / (1024 * 1024));
  return `${value} MB`;
}

export function validateSourceFile(
  input: SourceFileInput,
  options: { maxBytes?: number } = {},
): SourceValidation {
  const maxBytes = options.maxBytes ?? MAX_SOURCE_BYTES;

  if (!Number.isFinite(input.size) || input.size <= 0) {
    return {
      ok: false,
      code: "empty-file",
      message: `«${input.name}» és buit i no es pot importar.`,
    };
  }
  if (input.size > maxBytes) {
    return {
      ok: false,
      code: "too-large",
      message: `«${input.name}» supera el límit de ${formatMegabytes(maxBytes)} (${formatMegabytes(input.size)}).`,
    };
  }
  const accepted = classifySource(input);
  if (!accepted) {
    return {
      ok: false,
      code: "unsupported-type",
      message: `«${input.name}» no és un tipus admès. Accepta PDF, DOCX, TXT, Markdown i imatges.`,
    };
  }
  return { ok: true, kind: accepted.kind, label: accepted.label };
}

function createSourceId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `source-${suffix}`;
}

export function createSourceRecord(
  input: SourceFileInput & { kind: SourceKind },
  projectId: string,
  options: { id?: string; now?: string } = {},
): SourceRecord {
  if (typeof projectId !== "string" || projectId.trim() === "") {
    throw new TypeError("La font necessita un projecte associat");
  }
  return {
    id: options.id ?? createSourceId(),
    projectId: projectId.trim(),
    name: input.name.trim() || "Font sense nom",
    kind: input.kind,
    mime: input.type,
    size: input.size,
    importedAt: options.now ?? new Date().toISOString(),
  };
}

export function formatSourceSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 kB";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["kB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat("ca-ES", { maximumFractionDigits: 1 }).format(value)} ${units[unit]}`;
}

export function sourceKindLabel(kind: SourceKind): string {
  return (
    ACCEPTED_SOURCE_TYPES.find((type) => type.kind === kind)?.label ?? "Font"
  );
}
