// Funció 103 — La fitxa bibliogràfica es desa dins la fitxa de la font.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import { openLocalDatabase, sourceRepository } from "../lib/local-db/index.ts";
import { createSourceRecord } from "../lib/source-library.ts";
import { normalizeCitation } from "../lib/bibliography.ts";

test("desa i recupera una font amb la seva citació i citekey", async () => {
  await openLocalDatabase();

  const base = createSourceRecord(
    { name: "amades.pdf", type: "application/pdf", size: 1024, kind: "pdf" },
    "project-a",
    { id: "source-1", now: "2026-07-22T10:00:00.000Z" },
  );
  await sourceRepository.save({
    ...base,
    citation: normalizeCitation({
      author: "Amades",
      title: "El Tarot",
      date: "1930",
      type: "llibre",
      tags: ["tarot", "esoterisme"],
    }),
  });

  const [stored] = await sourceRepository.getAllForProject("project-a");
  assert.equal(stored.citation?.citekey, "Amades1930");
  assert.equal(stored.citation?.author, "Amades");
  assert.equal(stored.citation?.type, "llibre");
  assert.deepEqual(stored.citation?.tags, ["tarot", "esoterisme"]);
});
