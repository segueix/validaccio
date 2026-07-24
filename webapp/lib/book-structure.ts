// Funció 302 — Estructura de llibre i capítols.
// La detecció és deliberadament conservadora: només usa encapçalaments
// explícits. No inventa capítols a partir del contingut argumental.

import { type ManuscriptRecord } from "./manuscripts.ts";

export type BookNodeKind = "part" | "chapter" | "section";
export type BookNodeStatus =
  | "pendent"
  | "en-redaccio"
  | "en-revisio"
  | "tancat";

export type BookNode = {
  id: string;
  projectId: string;
  manuscriptId: string;
  parentId: string | null;
  kind: BookNodeKind;
  title: string;
  order: number;
  status: BookNodeStatus;
  objective: string;
  sourceParagraph: number | null;
  createdAt: string;
  updatedAt: string;
};

export const BOOK_NODE_STATUSES: readonly {
  value: BookNodeStatus;
  label: string;
}[] = [
  { value: "pendent", label: "Pendent" },
  { value: "en-redaccio", label: "En redacció" },
  { value: "en-revisio", label: "En revisió" },
  { value: "tancat", label: "Tancat" },
];

type DetectedHeading = {
  kind: BookNodeKind;
  title: string;
  paragraph: number;
};

function cleanTitle(value: string): string {
  return value
    .replace(/^[-–—:.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function explicitHeading(
  paragraph: string,
  index: number,
  kind: ManuscriptRecord["kind"],
): DetectedHeading | null {
  const text = paragraph.trim();
  if (!text || text.includes("\n")) return null;

  if (kind === "markdown") {
    const markdown = /^(#{1,3})\s+(.+?)\s*#*$/.exec(text);
    if (markdown) {
      const level = markdown[1].length;
      return {
        kind: level === 1 ? "part" : level === 2 ? "chapter" : "section",
        title: cleanTitle(markdown[2]),
        paragraph: index,
      };
    }
  }

  const part =
    /^(?:part|partie|parte)\s+(?:[ivxlcdm]+|\d+|primera|segona|tercera|quarta|cinquena)\b(.*)$/i.exec(
      text,
    );
  if (part) {
    return {
      kind: "part",
      title: text,
      paragraph: index,
    };
  }

  const chapter =
    /^(?:capítol|capitol|chapter|chapitre)\s+(?:[ivxlcdm]+|\d+)\b(.*)$/i.exec(
      text,
    );
  if (chapter) {
    return {
      kind: "chapter",
      title: text,
      paragraph: index,
    };
  }

  const section =
    /^(?:secció|seccio|section)\s+(?:[ivxlcdm]+|\d+)\b(.*)$/i.exec(text) ??
    /^(\d+\.\d+(?:\.\d+)*)\s+(.+)$/.exec(text);
  if (section) {
    return {
      kind: "section",
      title: text,
      paragraph: index,
    };
  }

  return null;
}

function nodeId(
  manuscriptId: string,
  paragraph: number,
  kind: BookNodeKind,
): string {
  return `book-node-${manuscriptId}-${paragraph}-${kind}`;
}

export function detectBookStructure(
  manuscript: ManuscriptRecord,
  now = new Date().toISOString(),
): BookNode[] {
  const normalizedText = manuscript.workingText.replace(/\r\n?/g, "\n");
  const paragraphs = normalizedText
    .split(
      manuscript.kind === "markdown"
        ? /\n/
        : /\n[ \t]*\n+/,
    )
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const headings = paragraphs
    .map((paragraph, index) =>
      explicitHeading(paragraph, index + 1, manuscript.kind),
    )
    .filter((heading): heading is DetectedHeading => Boolean(heading));

  // Un únic H1 inicial acostuma a ser el títol de l'obra, no una part.
  if (
    manuscript.kind === "markdown" &&
    headings[0]?.kind === "part" &&
    headings[0].paragraph === 1 &&
    headings.some((heading) => heading.kind === "chapter") &&
    !/^(?:part|partie|parte)\b/i.test(headings[0].title)
  ) {
    headings.shift();
  }

  if (headings.length === 0) {
    return [
      {
        id: nodeId(manuscript.id, 1, "chapter"),
        projectId: manuscript.projectId,
        manuscriptId: manuscript.id,
        parentId: null,
        kind: "chapter",
        title: manuscript.name.replace(/\.(docx|txt|md|markdown)$/i, ""),
        order: 0,
        status: "pendent",
        objective: "",
        sourceParagraph: 1,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  const nodes: BookNode[] = [];
  let currentPartId: string | null = null;
  let currentChapterId: string | null = null;
  const nextOrder = new Map<string, number>();

  for (const heading of headings) {
    if (heading.kind === "part") {
      currentPartId = nodeId(manuscript.id, heading.paragraph, heading.kind);
      currentChapterId = null;
    }
    if (heading.kind === "chapter") {
      currentChapterId = nodeId(
        manuscript.id,
        heading.paragraph,
        heading.kind,
      );
    }

    const parentId =
      heading.kind === "part"
        ? null
        : heading.kind === "chapter"
          ? currentPartId
          : currentChapterId ?? currentPartId;
    const parentKey = parentId ?? "root";
    const order = nextOrder.get(parentKey) ?? 0;
    nextOrder.set(parentKey, order + 1);

    nodes.push({
      id: nodeId(manuscript.id, heading.paragraph, heading.kind),
      projectId: manuscript.projectId,
      manuscriptId: manuscript.id,
      parentId,
      kind: heading.kind,
      title: heading.title,
      order,
      status: "pendent",
      objective: "",
      sourceParagraph: heading.paragraph,
      createdAt: now,
      updatedAt: now,
    });
  }
  return nodes;
}

export function normalizeBookNode(input: BookNode): BookNode {
  if (!input.id.trim() || !input.projectId.trim() || !input.manuscriptId.trim()) {
    throw new TypeError("L’element necessita identitat, projecte i manuscrit.");
  }
  const title = input.title.trim();
  if (!title) throw new TypeError("L’element necessita un títol.");
  if (!["part", "chapter", "section"].includes(input.kind)) {
    throw new TypeError("El tipus d’element no és vàlid.");
  }
  const status = BOOK_NODE_STATUSES.some(
    (candidate) => candidate.value === input.status,
  )
    ? input.status
    : "pendent";
  return {
    ...input,
    title,
    objective: input.objective.trim(),
    order: Math.max(0, Math.trunc(input.order)),
    status,
  };
}

export function siblingsOf(
  nodes: readonly BookNode[],
  node: Pick<BookNode, "manuscriptId" | "parentId">,
): BookNode[] {
  return nodes
    .filter(
      (candidate) =>
        candidate.manuscriptId === node.manuscriptId &&
        candidate.parentId === node.parentId,
    )
    .sort((left, right) => left.order - right.order);
}

export function moveBookNode(
  nodes: readonly BookNode[],
  id: string,
  direction: -1 | 1,
  now = new Date().toISOString(),
): BookNode[] {
  const target = nodes.find((node) => node.id === id);
  if (!target) return [...nodes];
  const siblings = siblingsOf(nodes, target);
  const position = siblings.findIndex((node) => node.id === id);
  const destination = position + direction;
  if (position < 0 || destination < 0 || destination >= siblings.length) {
    return [...nodes];
  }
  const other = siblings[destination];
  return nodes.map((node) => {
    if (node.id === target.id) {
      return { ...node, order: other.order, updatedAt: now };
    }
    if (node.id === other.id) {
      return { ...node, order: target.order, updatedAt: now };
    }
    return node;
  });
}

export type BookTreeRow = BookNode & { depth: 0 | 1 | 2 };

export function bookTree(nodes: readonly BookNode[]): BookTreeRow[] {
  const ordered: BookTreeRow[] = [];
  const append = (parentId: string | null, depth: 0 | 1 | 2) => {
    const children = nodes
      .filter((node) => node.parentId === parentId)
      .sort((left, right) => left.order - right.order);
    for (const child of children) {
      ordered.push({ ...child, depth });
      if (depth < 2) append(child.id, (depth + 1) as 1 | 2);
    }
  };
  append(null, 0);
  return ordered;
}

export function bookNodeKindLabel(kind: BookNodeKind): string {
  return kind === "part" ? "Part" : kind === "chapter" ? "Capítol" : "Secció";
}
