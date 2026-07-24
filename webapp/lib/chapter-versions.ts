// Funció 304 — Instantànies immutables, comparació i restauració reversible.

import {
  type ChapterDraft,
  normalizeChapterDraft,
  updateChapterDraft,
} from "./chapter-editor.ts";

export type ChapterVersionOrigin = "manual" | "pre-restauracio";

export type ChapterVersion = {
  id: string;
  projectId: string;
  manuscriptId: string;
  chapterId: string;
  content: string;
  wordCount: number;
  sourceRevision: number;
  label: string;
  note: string;
  author: string;
  origin: ChapterVersionOrigin;
  restoredFromVersionId: string | null;
  createdAt: string;
};

export type ChapterVersionInput = {
  label: string;
  note?: string;
  author: string;
  origin?: ChapterVersionOrigin;
  restoredFromVersionId?: string | null;
};

export type TextDiffLine = {
  kind: "same" | "added" | "removed";
  text: string;
  beforeLine: number | null;
  afterLine: number | null;
};

export type TextDiffSummary = {
  added: number;
  removed: number;
  unchanged: number;
};

function countWords(content: string): number {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

export function normalizeChapterVersion(
  input: ChapterVersion,
): ChapterVersion {
  if (
    !input.id.trim() ||
    !input.projectId.trim() ||
    !input.manuscriptId.trim() ||
    !input.chapterId.trim()
  ) {
    throw new TypeError(
      "La versió necessita identitat, capítol, manuscrit i projecte.",
    );
  }
  const label = input.label.trim();
  const author = input.author.trim();
  if (!label) throw new TypeError("La versió necessita un nom.");
  if (!author) throw new TypeError("La versió necessita autoria.");
  if (input.origin === "pre-restauracio" && !input.restoredFromVersionId) {
    throw new TypeError(
      "La còpia prèvia ha d’indicar quina versió es restaurarà.",
    );
  }
  const content = String(input.content ?? "");
  return {
    ...input,
    label,
    author,
    note: String(input.note ?? "").trim(),
    content,
    wordCount: countWords(content),
    sourceRevision: Math.max(0, Math.trunc(input.sourceRevision)),
    restoredFromVersionId: input.restoredFromVersionId || null,
  };
}

export function createChapterVersion(
  draft: ChapterDraft,
  input: ChapterVersionInput,
  now = new Date().toISOString(),
  id = crypto.randomUUID(),
): ChapterVersion {
  const normalizedDraft = normalizeChapterDraft(draft);
  return normalizeChapterVersion({
    id,
    projectId: normalizedDraft.projectId,
    manuscriptId: normalizedDraft.manuscriptId,
    chapterId: normalizedDraft.chapterId,
    content: normalizedDraft.content,
    wordCount: normalizedDraft.wordCount,
    sourceRevision: normalizedDraft.revision,
    label: input.label,
    note: input.note ?? "",
    author: input.author,
    origin: input.origin ?? "manual",
    restoredFromVersionId: input.restoredFromVersionId ?? null,
    createdAt: now,
  });
}

export function prepareChapterRestoration(
  current: ChapterDraft,
  target: ChapterVersion,
  author: string,
  now = new Date().toISOString(),
  backupId = crypto.randomUUID(),
): { restoredDraft: ChapterDraft; backupVersion: ChapterVersion } {
  const draft = normalizeChapterDraft(current);
  const version = normalizeChapterVersion(target);
  if (
    draft.projectId !== version.projectId ||
    draft.manuscriptId !== version.manuscriptId ||
    draft.chapterId !== version.chapterId
  ) {
    throw new TypeError("La versió no pertany al capítol obert.");
  }
  const backupVersion = createChapterVersion(
    draft,
    {
      label: `Abans de restaurar «${version.label}»`,
      note: "Còpia automàtica creada abans de substituir el text actual.",
      author,
      origin: "pre-restauracio",
      restoredFromVersionId: version.id,
    },
    now,
    backupId,
  );
  return {
    backupVersion,
    restoredDraft: updateChapterDraft(draft, version.content, now),
  };
}

function splitLines(content: string): string[] {
  return content.replace(/\r\n?/g, "\n").split("\n");
}

function fallbackDiff(before: string[], after: string[]): TextDiffLine[] {
  let prefix = 0;
  while (
    prefix < before.length &&
    prefix < after.length &&
    before[prefix] === after[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const result: TextDiffLine[] = [];
  for (let index = 0; index < prefix; index += 1) {
    result.push({
      kind: "same",
      text: before[index],
      beforeLine: index + 1,
      afterLine: index + 1,
    });
  }
  for (let index = prefix; index < before.length - suffix; index += 1) {
    result.push({
      kind: "removed",
      text: before[index],
      beforeLine: index + 1,
      afterLine: null,
    });
  }
  for (let index = prefix; index < after.length - suffix; index += 1) {
    result.push({
      kind: "added",
      text: after[index],
      beforeLine: null,
      afterLine: index + 1,
    });
  }
  for (let offset = suffix; offset > 0; offset -= 1) {
    const beforeIndex = before.length - offset;
    const afterIndex = after.length - offset;
    result.push({
      kind: "same",
      text: before[beforeIndex],
      beforeLine: beforeIndex + 1,
      afterLine: afterIndex + 1,
    });
  }
  return result;
}

export function compareChapterTexts(
  versionContent: string,
  currentContent: string,
): TextDiffLine[] {
  const before = splitLines(versionContent);
  const after = splitLines(currentContent);
  if (before.length * after.length > 250_000) {
    return fallbackDiff(before, after);
  }

  const lengths = Array.from({ length: before.length + 1 }, () =>
    new Uint32Array(after.length + 1),
  );
  for (let left = before.length - 1; left >= 0; left -= 1) {
    for (let right = after.length - 1; right >= 0; right -= 1) {
      lengths[left][right] =
        before[left] === after[right]
          ? lengths[left + 1][right + 1] + 1
          : Math.max(lengths[left + 1][right], lengths[left][right + 1]);
    }
  }

  const result: TextDiffLine[] = [];
  let left = 0;
  let right = 0;
  while (left < before.length && right < after.length) {
    if (before[left] === after[right]) {
      result.push({
        kind: "same",
        text: before[left],
        beforeLine: left + 1,
        afterLine: right + 1,
      });
      left += 1;
      right += 1;
    } else if (lengths[left + 1][right] >= lengths[left][right + 1]) {
      result.push({
        kind: "removed",
        text: before[left],
        beforeLine: left + 1,
        afterLine: null,
      });
      left += 1;
    } else {
      result.push({
        kind: "added",
        text: after[right],
        beforeLine: null,
        afterLine: right + 1,
      });
      right += 1;
    }
  }
  while (left < before.length) {
    result.push({
      kind: "removed",
      text: before[left],
      beforeLine: left + 1,
      afterLine: null,
    });
    left += 1;
  }
  while (right < after.length) {
    result.push({
      kind: "added",
      text: after[right],
      beforeLine: null,
      afterLine: right + 1,
    });
    right += 1;
  }
  return result;
}

export function summarizeTextDiff(
  lines: readonly TextDiffLine[],
): TextDiffSummary {
  return lines.reduce<TextDiffSummary>(
    (summary, line) => {
      if (line.kind === "added") summary.added += 1;
      else if (line.kind === "removed") summary.removed += 1;
      else summary.unchanged += 1;
      return summary;
    },
    { added: 0, removed: 0, unchanged: 0 },
  );
}
