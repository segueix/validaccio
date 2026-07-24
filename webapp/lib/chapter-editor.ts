// Funció 303 — Editor local de capítols amb autodesat coherent.

import { type BookNode } from "./book-structure.ts";
import { type ManuscriptRecord } from "./manuscripts.ts";

export type ChapterDraft = {
  id: string;
  projectId: string;
  manuscriptId: string;
  chapterId: string;
  content: string;
  revision: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  savedAt: string | null;
};

function countWords(content: string): number {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function manuscriptParagraphs(manuscript: ManuscriptRecord): string[] {
  const normalized = manuscript.workingText.replace(/\r\n?/g, "\n");
  return normalized
    .split(manuscript.kind === "markdown" ? /\n/ : /\n[ \t]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function headingText(paragraph: string): string {
  return paragraph
    .replace(/^#{1,3}\s+/, "")
    .replace(/\s+#+$/, "")
    .trim();
}

export function extractChapterContent(
  manuscript: ManuscriptRecord,
  chapter: BookNode,
  nodes: readonly BookNode[],
): string {
  if (chapter.kind !== "chapter") {
    throw new TypeError("Només es pot editar el text d’un capítol.");
  }
  const paragraphs = manuscriptParagraphs(manuscript);
  const sourceIndex = Math.max(0, (chapter.sourceParagraph ?? 1) - 1);
  const sourceIsHeading =
    headingText(paragraphs[sourceIndex] ?? "") === chapter.title.trim();
  const start = sourceIsHeading ? sourceIndex + 1 : sourceIndex;
  const nextBoundary = nodes
    .filter(
      (node) =>
        node.manuscriptId === chapter.manuscriptId &&
        (node.kind === "part" || node.kind === "chapter") &&
        node.sourceParagraph !== null &&
        node.sourceParagraph > (chapter.sourceParagraph ?? 0),
    )
    .sort(
      (left, right) =>
        (left.sourceParagraph ?? Number.MAX_SAFE_INTEGER) -
        (right.sourceParagraph ?? Number.MAX_SAFE_INTEGER),
    )[0]?.sourceParagraph;
  const end = nextBoundary ? nextBoundary - 1 : paragraphs.length;
  return paragraphs
    .slice(start, end)
    .join(manuscript.kind === "markdown" ? "\n\n" : "\n\n");
}

export function createChapterDraft(
  manuscript: ManuscriptRecord,
  chapter: BookNode,
  nodes: readonly BookNode[],
  now = new Date().toISOString(),
): ChapterDraft {
  const content = extractChapterContent(manuscript, chapter, nodes);
  return {
    id: chapter.id,
    projectId: chapter.projectId,
    manuscriptId: chapter.manuscriptId,
    chapterId: chapter.id,
    content,
    revision: 0,
    wordCount: countWords(content),
    createdAt: now,
    updatedAt: now,
    savedAt: null,
  };
}

export function updateChapterDraft(
  draft: ChapterDraft,
  content: string,
  now = new Date().toISOString(),
): ChapterDraft {
  return {
    ...draft,
    content,
    revision: draft.revision + 1,
    wordCount: countWords(content),
    updatedAt: now,
  };
}

export function normalizeChapterDraft(input: ChapterDraft): ChapterDraft {
  if (
    !input.id.trim() ||
    !input.projectId.trim() ||
    !input.manuscriptId.trim() ||
    !input.chapterId.trim()
  ) {
    throw new TypeError("L’esborrany necessita capítol, manuscrit i projecte.");
  }
  if (input.id !== input.chapterId) {
    throw new TypeError("La identitat de l’esborrany no correspon al capítol.");
  }
  return {
    ...input,
    content: String(input.content ?? ""),
    revision: Math.max(0, Math.trunc(input.revision)),
    wordCount: countWords(String(input.content ?? "")),
    savedAt: input.savedAt || null,
  };
}
