// Funció 105 — Extracció de text DOCX/TXT/MD.
// Lògica pura i comprovable. TXT i Markdown es descodifiquen com a UTF-8; el
// DOCX (un ZIP amb XML) s'infla amb l'API nativa `DecompressionStream`, sense
// cap dependència externa. Cada paràgraf conserva un índex reproduïble (posició
// dins el document) per poder-lo tornar a localitzar.

export type ExtractableKind = "text" | "markdown" | "docx";

export type ExtractedParagraph = {
  index: number;
  text: string;
};

export type ExtractedText = {
  kind: ExtractableKind;
  paragraphs: ExtractedParagraph[];
  text: string;
  wordCount: number;
  paragraphCount: number;
};

export class TextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextExtractionError";
  }
}

const utf8 = new TextDecoder("utf-8");

export function isExtractableKind(kind: string): kind is ExtractableKind {
  return kind === "text" || kind === "markdown" || kind === "docx";
}

function finalize(
  kind: ExtractableKind,
  paragraphs: ExtractedParagraph[],
): ExtractedText {
  const text = paragraphs.map((paragraph) => paragraph.text).join("\n\n");
  const trimmed = text.trim();
  return {
    kind,
    paragraphs,
    text,
    wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
    paragraphCount: paragraphs.length,
  };
}

function splitParagraphs(raw: string): string[] {
  return raw
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function extractPlainText(
  data: ArrayBuffer,
  kind: "text" | "markdown",
): ExtractedText {
  const paragraphs = splitParagraphs(utf8.decode(data)).map((text, position) => ({
    index: position + 1,
    text,
  }));
  return finalize(kind, paragraphs);
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&amp;/g, "&");
}

function paragraphRunText(paragraphXml: string): string {
  const token = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>/g;
  let text = "";
  let match: RegExpExecArray | null;
  while ((match = token.exec(paragraphXml)) !== null) {
    if (match[1] !== undefined) {
      text += unescapeXml(match[1]);
    } else if (match[0].startsWith("<w:tab")) {
      text += "\t";
    } else {
      text += "\n";
    }
  }
  return text;
}

// Extreu els paràgrafs d'un word/document.xml conservant-ne la posició.
export function extractParagraphsFromDocumentXml(
  xml: string,
): ExtractedParagraph[] {
  const paragraphs: ExtractedParagraph[] = [];
  const paragraphRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = paragraphRegex.exec(xml)) !== null) {
    index += 1;
    const text = paragraphRunText(match[1]);
    if (text.trim() !== "") {
      paragraphs.push({ index, text });
    }
  }
  return paragraphs;
}

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([compressed])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(
  data: ArrayBuffer,
  targetName: string,
): Promise<Uint8Array | null> {
  const bytes = new Uint8Array(data);
  const view = new DataView(data);

  const EOCD_SIGNATURE = 0x06054b50;
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) {
    throw new TextExtractionError(
      "El fitxer no és un DOCX vàlid (no s'ha trobat el directori del ZIP).",
    );
  }

  const entryCount = view.getUint16(eocd + 10, true);
  let pointer = view.getUint32(eocd + 16, true);
  const CENTRAL_SIGNATURE = 0x02014b50;

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (view.getUint32(pointer, true) !== CENTRAL_SIGNATURE) break;
    const method = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const localOffset = view.getUint32(pointer + 42, true);
    const name = utf8.decode(
      bytes.subarray(pointer + 46, pointer + 46 + nameLength),
    );

    if (name === targetName) {
      const LOCAL_SIGNATURE = 0x04034b50;
      if (view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) {
        throw new TextExtractionError("El DOCX té una capçalera local corrupta.");
      }
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return compressed.slice();
      if (method === 8) return inflateRaw(compressed);
      throw new TextExtractionError("El DOCX usa una compressió no admesa.");
    }
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

export async function extractDocxText(data: ArrayBuffer): Promise<ExtractedText> {
  const xmlBytes = await readZipEntry(data, "word/document.xml");
  if (!xmlBytes) {
    throw new TextExtractionError("El DOCX no conté word/document.xml.");
  }
  return finalize("docx", extractParagraphsFromDocumentXml(utf8.decode(xmlBytes)));
}

export async function extractSourceText(input: {
  data: ArrayBuffer;
  kind: string;
}): Promise<ExtractedText> {
  if (input.kind === "text") return extractPlainText(input.data, "text");
  if (input.kind === "markdown") return extractPlainText(input.data, "markdown");
  if (input.kind === "docx") return extractDocxText(input.data);

  throw new TextExtractionError(
    input.kind === "pdf"
      ? "L'extracció de text del PDF arribarà amb el visor (funció 104)."
      : input.kind === "image"
        ? "Les imatges necessiten OCR per extreure'n el text (funció 106)."
        : "Aquest tipus de font no admet extracció de text.",
  );
}
