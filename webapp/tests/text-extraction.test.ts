import assert from "node:assert/strict";
import test from "node:test";

import {
  extractParagraphsFromDocumentXml,
  extractPlainText,
  extractSourceText,
  isExtractableKind,
  TextExtractionError,
} from "../lib/text-extraction.ts";

function toBuffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer as ArrayBuffer;
}

test("extreu paràgrafs de text pla separats per línies en blanc", () => {
  const result = extractPlainText(
    toBuffer("Paràgraf u.\n\nParàgraf dos.\n\n\nParàgraf tres."),
    "text",
  );
  assert.equal(result.kind, "text");
  assert.equal(result.paragraphCount, 3);
  assert.deepEqual(
    result.paragraphs.map((paragraph) => paragraph.index),
    [1, 2, 3],
  );
  assert.equal(result.paragraphs[1].text, "Paràgraf dos.");
});

test("normalitza els salts CRLF del Markdown i compta paraules", () => {
  const result = extractPlainText(toBuffer("# Títol\r\n\r\nUn text amb tres."), "markdown");
  assert.equal(result.kind, "markdown");
  assert.equal(result.paragraphCount, 2);
  assert.equal(result.paragraphs[0].text, "# Títol");
  assert.equal(result.wordCount, 6); // "#", "Títol", "Un", "text", "amb", "tres."
});

test("concatena els runs d'un paràgraf DOCX i desescapa les entitats", () => {
  const paragraphs = extractParagraphsFromDocumentXml(
    "<w:p><w:r><w:t>Hola</w:t></w:r><w:r><w:t xml:space=\"preserve\"> món</w:t></w:r></w:p>" +
      "<w:p><w:r><w:t>A &amp; B &lt;C&gt;</w:t></w:r></w:p>",
  );
  assert.equal(paragraphs.length, 2);
  assert.equal(paragraphs[0].text, "Hola món");
  assert.equal(paragraphs[1].text, "A & B <C>");
});

test("converteix tabuladors i salts de línia i conserva l'índex reproduïble", () => {
  const paragraphs = extractParagraphsFromDocumentXml(
    "<w:p></w:p>" + // paràgraf buit: es descarta però l'índex avança
      "<w:p><w:r><w:t>a</w:t><w:tab/><w:t>b</w:t><w:br/><w:t>c</w:t></w:r></w:p>",
  );
  assert.equal(paragraphs.length, 1);
  assert.equal(paragraphs[0].index, 2);
  assert.equal(paragraphs[0].text, "a\tb\nc");
});

test("dispatch per tipus i errors comprensibles per als no admesos", async () => {
  assert.ok(isExtractableKind("docx"));
  assert.ok(!isExtractableKind("pdf"));

  const md = await extractSourceText({ data: toBuffer("A\n\nB"), kind: "markdown" });
  assert.equal(md.paragraphCount, 2);

  await assert.rejects(
    () => extractSourceText({ data: toBuffer(""), kind: "pdf" }),
    (error: unknown) =>
      error instanceof TextExtractionError && /104/.test(error.message),
  );
  await assert.rejects(
    () => extractSourceText({ data: toBuffer(""), kind: "image" }),
    (error: unknown) =>
      error instanceof TextExtractionError && /106/.test(error.message),
  );
});
