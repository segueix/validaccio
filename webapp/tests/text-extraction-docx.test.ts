// Funció 105 — Extracció DOCX de punta a punta: construeix un ZIP real (amb
// DEFLATE via CompressionStream) i el descomprimeix amb el mateix camí que
// usarà l'aplicació.
import assert from "node:assert/strict";
import test from "node:test";

import {
  extractDocxText,
  extractSourceText,
  TextExtractionError,
} from "../lib/text-extraction.ts";

type ZipInput = { name: string; content: string; method: 0 | 8 };

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function buildZip(inputs: ZipInput[]): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const prepared = [];
  for (const input of inputs) {
    const uncompressed = encoder.encode(input.content);
    const compressed =
      input.method === 8 ? await deflateRaw(uncompressed) : uncompressed;
    prepared.push({
      nameBytes: encoder.encode(input.name),
      method: input.method,
      compressed,
      uncompSize: uncompressed.length,
    });
  }

  const parts: Uint8Array[] = [];
  const localOffsets: number[] = [];
  let offset = 0;

  for (const entry of prepared) {
    localOffsets.push(offset);
    const header = new Uint8Array(30 + entry.nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(8, entry.method, true);
    view.setUint32(18, entry.compressed.length, true);
    view.setUint32(22, entry.uncompSize, true);
    view.setUint16(26, entry.nameBytes.length, true);
    header.set(entry.nameBytes, 30);
    parts.push(header, entry.compressed);
    offset += header.length + entry.compressed.length;
  }

  const cdOffset = offset;
  prepared.forEach((entry, index) => {
    const header = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(10, entry.method, true);
    view.setUint32(20, entry.compressed.length, true);
    view.setUint32(24, entry.uncompSize, true);
    view.setUint16(28, entry.nameBytes.length, true);
    view.setUint32(42, localOffsets[index], true);
    header.set(entry.nameBytes, 46);
    parts.push(header);
    offset += header.length;
  });

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, prepared.length, true);
  eocdView.setUint16(10, prepared.length, true);
  eocdView.setUint32(12, offset - cdOffset, true);
  eocdView.setUint32(16, cdOffset, true);
  parts.push(eocd);

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out.buffer;
}

const DOCUMENT_XML =
  '<?xml version="1.0"?><w:document xmlns:w="x"><w:body>' +
  "<w:p><w:r><w:t>Primer paràgraf.</w:t></w:r></w:p>" +
  "<w:p><w:r><w:t>Segon</w:t></w:r><w:r><w:t> paràgraf.</w:t></w:r></w:p>" +
  "</w:body></w:document>";

test("extreu el text d'un DOCX amb el contingut comprimit (deflate)", async () => {
  const docx = await buildZip([
    { name: "[Content_Types].xml", content: "<Types/>", method: 0 },
    { name: "word/document.xml", content: DOCUMENT_XML, method: 8 },
  ]);

  const result = await extractDocxText(docx);
  assert.equal(result.kind, "docx");
  assert.equal(result.paragraphCount, 2);
  assert.equal(result.paragraphs[0].text, "Primer paràgraf.");
  assert.equal(result.paragraphs[1].text, "Segon paràgraf.");
});

test("també extreu un DOCX amb el contingut sense comprimir (stored)", async () => {
  const docx = await buildZip([
    { name: "word/document.xml", content: DOCUMENT_XML, method: 0 },
  ]);
  const result = await extractSourceText({ data: docx, kind: "docx" });
  assert.equal(result.paragraphCount, 2);
});

test("rebutja un DOCX sense word/document.xml amb un error clar", async () => {
  const zip = await buildZip([
    { name: "[Content_Types].xml", content: "<Types/>", method: 8 },
  ]);
  await assert.rejects(
    () => extractDocxText(zip),
    (error: unknown) =>
      error instanceof TextExtractionError && /document\.xml/.test(error.message),
  );
});
