// Funció 301 — Importació del manuscrit.
// El fitxer original es valida i s'identifica amb SHA-256. El text extret és
// una còpia de treball independent: les funcions posteriors podran modificar-la
// sense alterar mai els bytes originals.

import {
  extractSourceText,
  type ExtractableKind,
  type ExtractedText,
} from "./text-extraction.ts";
import {
  MAX_SOURCE_BYTES,
  validateSourceFile,
  type SourceFileInput,
} from "./source-library.ts";

export const MANUSCRIPT_ACCEPT_ATTR =
  ".docx,.txt,.md,.markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/x-markdown";

export type ManuscriptKind = ExtractableKind;

export type ManuscriptRecord = {
  id: string;
  projectId: string;
  name: string;
  kind: ManuscriptKind;
  mime: string;
  size: number;
  originalSha256: string;
  importedAt: string;
  updatedAt: string;
  workingText: string;
  wordCount: number;
  paragraphCount: number;
};

export type ManuscriptOriginalRecord = {
  manuscriptId: string;
  projectId: string;
  mime: string;
  size: number;
  sha256: string;
  data: ArrayBuffer;
};

export class ManuscriptImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManuscriptImportError";
  }
}

function manuscriptId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `manuscript-${suffix}`;
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export async function sha256(data: ArrayBuffer): Promise<string> {
  return toHex(await globalThis.crypto.subtle.digest("SHA-256", data));
}

export function validateManuscriptFile(
  input: SourceFileInput,
  options: { maxBytes?: number } = {},
): { kind: ManuscriptKind } {
  const validation = validateSourceFile(input, {
    maxBytes: options.maxBytes ?? MAX_SOURCE_BYTES,
  });
  if (!validation.ok) throw new ManuscriptImportError(validation.message);
  if (
    validation.kind !== "docx" &&
    validation.kind !== "text" &&
    validation.kind !== "markdown"
  ) {
    throw new ManuscriptImportError(
      `«${input.name}» no és un manuscrit admès. Accepta DOCX, TXT o Markdown.`,
    );
  }
  return { kind: validation.kind };
}

export function createManuscriptRecords(input: {
  id?: string;
  projectId: string;
  name: string;
  kind: ManuscriptKind;
  mime: string;
  data: ArrayBuffer;
  hash: string;
  extracted: ExtractedText;
  now?: string;
}): {
  manuscript: ManuscriptRecord;
  original: ManuscriptOriginalRecord;
} {
  const projectId = input.projectId.trim();
  if (!projectId) {
    throw new ManuscriptImportError("El manuscrit necessita un projecte associat.");
  }
  const id = input.id ?? manuscriptId();
  const now = input.now ?? new Date().toISOString();
  const originalData = input.data.slice(0);

  return {
    manuscript: {
      id,
      projectId,
      name: input.name.trim() || "Manuscrit sense nom",
      kind: input.kind,
      mime: input.mime,
      size: originalData.byteLength,
      originalSha256: input.hash,
      importedAt: now,
      updatedAt: now,
      workingText: input.extracted.text,
      wordCount: input.extracted.wordCount,
      paragraphCount: input.extracted.paragraphCount,
    },
    original: {
      manuscriptId: id,
      projectId,
      mime: input.mime,
      size: originalData.byteLength,
      sha256: input.hash,
      data: originalData,
    },
  };
}

export async function prepareManuscriptImport(input: {
  projectId: string;
  file: SourceFileInput;
  data: ArrayBuffer;
  id?: string;
  now?: string;
}) {
  const { kind } = validateManuscriptFile(input.file);
  const [hash, extracted] = await Promise.all([
    sha256(input.data),
    extractSourceText({ data: input.data, kind }),
  ]);
  return createManuscriptRecords({
    id: input.id,
    projectId: input.projectId,
    name: input.file.name,
    kind,
    mime: input.file.type,
    data: input.data,
    hash,
    extracted,
    now: input.now,
  });
}

export function originalToObjectUrl(
  original: ManuscriptOriginalRecord,
): string {
  return URL.createObjectURL(
    new Blob([original.data], {
      type: original.mime || "application/octet-stream",
    }),
  );
}
