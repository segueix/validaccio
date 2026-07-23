// Funció 107 — Proves d'integració dels extractes citables sobre IndexedDB.
// Comprova l'actualització d'esquema v6 → v7 (nou magatzem `notes`) conservant
// les referències del PDF, i el cicle complet de desat, consulta i esborrat.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  citableNoteRepository,
  openLocalDatabase,
  pdfReferenceRepository,
} from "../lib/local-db/index.ts";
import { createPdfReference } from "../lib/pdf-references.ts";
import {
  createCitableNote,
  noteInputFromReference,
} from "../lib/citable-notes.ts";

// Crea una base a l'esquema v6 (amb el magatzem `references` de la funció 104)
// i hi desa una referència, abans que l'aplicació obri l'espai i migri a v7.
function createDatabaseV6(reference: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 6);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
      const sources = database.createObjectStore("sources", { keyPath: "id" });
      sources.createIndex("projectId", "projectId");
      const blobs = database.createObjectStore("blobs", { keyPath: "sourceId" });
      blobs.createIndex("projectId", "projectId");
      const references = database.createObjectStore("references", { keyPath: "id" });
      references.createIndex("sourceId", "sourceId");
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("references", "readwrite");
      transaction.objectStore("references").put(reference);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

test("actualitza l'esquema v6 → v7 conservant les referències del PDF", async () => {
  const reference = createPdfReference(
    { sourceId: "source-1", projectId: "origen-tarot", page: 12, text: "cita" },
    { id: "ref-1", now: "2026-07-22T10:00:00.000Z" },
  );
  await createDatabaseV6(reference as unknown as Record<string, unknown>);

  await openLocalDatabase();

  const references = await pdfReferenceRepository.getAllForSource("source-1");
  assert.equal(references.length, 1);
  assert.equal(references[0].page, 12);

  // El magatzem nou existeix i accepta un extracte creat des de la referència.
  const note = createCitableNote(
    { ...noteInputFromReference(references[0]), comment: "clau documental" },
    { id: "note-1", now: "2026-07-23T10:00:00.000Z" },
  );
  await citableNoteRepository.save(note);
  const stored = await citableNoteRepository.getAllForSource("source-1");
  assert.equal(stored.length, 1);
  assert.equal(stored[0].referenceId, "ref-1");
  assert.equal(stored[0].quote, "cita");
  assert.equal(stored[0].comment, "clau documental");
});

test("desa, consulta per projecte i per font, i esborra en cascada", async () => {
  await openLocalDatabase();

  await citableNoteRepository.save(
    createCitableNote(
      { projectId: "origen-tarot", sourceId: "source-2", quote: "a" },
      { id: "note-2", now: "2026-07-23T11:00:00.000Z" },
    ),
  );
  await citableNoteRepository.save(
    createCitableNote(
      { projectId: "origen-tarot", sourceId: "source-2", paraphrase: "b" },
      { id: "note-3", now: "2026-07-23T12:00:00.000Z" },
    ),
  );

  // Per projecte torna tots els extractes, ordenats del més recent al més antic.
  const byProject = await citableNoteRepository.getAllForProject("origen-tarot");
  assert.deepEqual(
    byProject.map((note) => note.id),
    ["note-3", "note-2", "note-1"],
  );

  const bySource = await citableNoteRepository.getAllForSource("source-2");
  assert.equal(bySource.length, 2);

  // En esborrar una font, els seus extractes desapareixen sense tocar els altres.
  await citableNoteRepository.deleteForSource("source-2");
  assert.equal(
    (await citableNoteRepository.getAllForSource("source-2")).length,
    0,
  );
  assert.equal(
    (await citableNoteRepository.getAllForProject("origen-tarot")).length,
    1,
  );
});
