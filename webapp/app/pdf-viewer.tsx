"use client";

// Funció 104 — Visor PDF amb pdf.js (local, sense xarxa). Llegeix, navega per
// pàgines, cerca text, permet seleccionar un fragment i crear una referència
// que reobre el context exacte (pàgina + fragment ressaltat).
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
// Build «legacy»: inclou els polyfills (p. ex. Map.prototype.getOrInsertComputed)
// que el build modern dona per fets i que la majoria de navegadors encara no
// tenen. Verificat en Chromium 141: el build modern peta, el legacy renderitza.
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { findMatches, type PdfReference, type SearchMatch } from "../lib/pdf-references";

function highlight(text: string, term: string) {
  const needle = term.trim();
  if (!needle) return text;
  const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark key={index}>{part}</mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

export default function PdfViewer({
  data,
  name,
  references,
  onCreateReference,
  onDeleteReference,
  onClose,
}: {
  data: ArrayBuffer;
  name: string;
  references: PdfReference[];
  onCreateReference: (page: number, text: string) => void;
  onDeleteReference: (id: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const pageTextCache = useRef<Map<number, string>>(new Map());
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pageText, setPageText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatch[] | null>(null);
  const [highlightTerm, setHighlightTerm] = useState("");
  const [searching, setSearching] = useState(false);

  async function readPageText(pageNumber: number): Promise<string> {
    const cached = pageTextCache.current.get(pageNumber);
    if (cached !== undefined) return cached;
    const doc = docRef.current;
    if (!doc) return "";
    const content = await (await doc.getPage(pageNumber)).getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pageTextCache.current.set(pageNumber, text);
    return text;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        const doc = await pdfjs.getDocument({
          data: new Uint8Array(data.slice(0)),
        }).promise;
        if (cancelled) {
          void doc.destroy();
          return;
        }
        docRef.current = doc;
        pageTextCache.current.clear();
        setNumPages(doc.numPages);
        setPage(1);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }
    void load();
    return () => {
      cancelled = true;
      void docRef.current?.destroy();
      docRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas) return;
      const pdfPage = await doc.getPage(page);
      if (cancelled) return;
      const viewport = pdfPage.getViewport({ scale: 1.3 });
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
      if (cancelled) return;
      setPageText(await readPageText(page));
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [page, numPages]);

  async function runSearch() {
    const doc = docRef.current;
    if (!doc || query.trim().length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const pages = [];
      for (let n = 1; n <= doc.numPages; n += 1) {
        pages.push({ page: n, text: await readPageText(n) });
      }
      setResults(findMatches(pages, query));
      setHighlightTerm(query.trim());
    } finally {
      setSearching(false);
    }
  }

  function createFromSelection() {
    const selection = globalThis.getSelection?.()?.toString().trim() ?? "";
    if (!selection) return;
    onCreateReference(page, selection);
    setHighlightTerm(selection.slice(0, 60));
  }

  const sortedReferences = useMemo(
    () => [...references].sort((left, right) => left.page - right.page),
    [references],
  );

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="pdf-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="pdf-toolbar">
          <strong>{name}</strong>
          <div className="pdf-nav">
            <button className="quiet-button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>
            <span>{numPages ? `${page} / ${numPages}` : "—"}</span>
            <button className="quiet-button" disabled={page >= numPages} onClick={() => setPage((current) => Math.min(numPages, current + 1))}>›</button>
            <button className="primary-button" onClick={onClose}>Tanca</button>
          </div>
        </header>

        <div className="pdf-body">
          <div className="pdf-canvas-wrap">
            {state === "loading" && <p className="storage-note">Carregant el PDF…</p>}
            {state === "error" && <p className="storage-note">No s’ha pogut obrir el PDF.</p>}
            <canvas ref={canvasRef} className="pdf-canvas" />
          </div>

          <aside className="pdf-side">
            <div className="pdf-search">
              <input
                value={query}
                placeholder="Cerca al document…"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") void runSearch(); }}
              />
              <button className="quiet-button" onClick={() => void runSearch()}>Cerca</button>
            </div>

            {results !== null && (
              <div className="pdf-results">
                <small>{searching ? "Cercant…" : `${results.length} coincidències`}</small>
                <ul>
                  {results.map((match, index) => (
                    <li key={`${match.page}-${index}`}>
                      <button onClick={() => { setPage(match.page); setHighlightTerm(query.trim()); }}>
                        <span>p. {match.page}</span> {match.snippet}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pdf-pagetext">
              <div className="pdf-section-head">
                <small>Text de la pàgina {page}</small>
                <button className="quiet-button" onClick={createFromSelection}>Crea referència del fragment</button>
              </div>
              <p className="pdf-text-body">
                {pageText ? highlight(pageText, highlightTerm) : "Sense text seleccionable en aquesta pàgina."}
              </p>
            </div>

            <div className="pdf-refs">
              <small>Referències ({sortedReferences.length})</small>
              {sortedReferences.length === 0 ? (
                <p className="storage-note">Selecciona un fragment i crea una referència per tornar-hi després.</p>
              ) : (
                <ul>
                  {sortedReferences.map((reference) => (
                    <li key={reference.id}>
                      <button onClick={() => { setPage(reference.page); setHighlightTerm(reference.text.slice(0, 60)); }}>
                        <span>p. {reference.page}</span> {reference.text || "(sense fragment)"}
                      </button>
                      <button className="pdf-ref-del danger-text" onClick={() => onDeleteReference(reference.id)}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
