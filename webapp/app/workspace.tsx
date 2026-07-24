"use client";

import { ChangeEvent, FormEvent, lazy, Suspense, useEffect, useRef, useState } from "react";
import ProjectManager from "./project-manager";

const PdfViewer = lazy(() => import("./pdf-viewer"));
import {
  createProjectPackage,
  MAX_PROJECT_PACKAGE_BYTES,
  parseProjectPackage,
  ProjectPackageError,
  serializeProjectPackage,
} from "../lib/project-package";
import {
  createProjectRecord,
  duplicateProjectRecord,
  affirmationRepository,
  aidEidLinkRepository,
  citableNoteRepository,
  ensureProjectsMigrated,
  matrixCellRepository,
  evidenceRepository,
  hypothesisRepository,
  manuscriptRepository,
  metadataRepository,
  pdfReferenceRepository,
  projectRepository,
  PROJECT_DATA_VERSION,
  recoverProjectsFromBackup,
  sourceBlobRepository,
  sourceRepository,
  type ProjectRecord,
} from "../lib/local-db";
import {
  createSourceRecord,
  formatSourceSize,
  SOURCE_ACCEPT_ATTR,
  sourceKindLabel,
  type SourceRecord,
  validateSourceFile,
} from "../lib/source-library";
import {
  createSourceBlobRecord,
  sourceBlobToObjectUrl,
} from "../lib/source-blobs";
import {
  MANUSCRIPT_ACCEPT_ATTR,
  ManuscriptImportError,
  type ManuscriptRecord,
  originalToObjectUrl,
  prepareManuscriptImport,
} from "../lib/manuscripts";
import { createPdfReference, type PdfReference } from "../lib/pdf-references";
import {
  type CitableNote,
  createCitableNote,
  filterNotes,
  formatNoteCitation,
  noteInputFromReference,
} from "../lib/citable-notes";
import {
  type Citation,
  CITATION_TYPES,
  type CitationType,
  emptyCitation,
  formatTags,
  normalizeCitation,
  parseTags,
} from "../lib/bibliography";
import {
  type ExtractedText,
  extractSourceText,
  isExtractableKind,
  TextExtractionError,
} from "../lib/text-extraction";
import {
  defaultHypotheses,
  type Hypothesis,
  HYPOTHESIS_REVIEW_STATES,
  normalizeHypothesis,
  requiresRedTeaming,
  reviewStateLabel,
  roleInfo,
} from "../lib/hypotheses";
import {
  createEvidence,
  type EvidenceQuality,
  type EvidenceRecord,
  EVIDENCE_QUALITIES,
  evidenceInputFromNote,
  nextEvidenceCode,
  qualityInfo,
} from "../lib/evidence";
import {
  type Affirmation,
  type AffirmationReviewState,
  type AffirmationType,
  AFFIRMATION_REVIEW_STATES,
  AFFIRMATION_TYPES,
  affirmationStateLabel,
  affirmationTypeInfo,
  type Assertiveness,
  assertivenessInfo,
  ASSERTIVENESS_LEVELS,
  createAffirmation,
  nextAffirmationCode,
  requiresDiagnosticEvidence,
} from "../lib/affirmations";
import {
  type AidEidLink,
  createLink,
  DERIVATION_TYPES,
  type DerivationType,
  derivationLabel,
  EVIDENCE_STANCES,
  type EvidenceStance,
  hasLink,
  linksForAffirmation,
  linksForEvidence,
  stanceInfo,
  summarizeStances,
} from "../lib/aid-eid-links";
import {
  buildMatrix,
  type ConsistencyValue,
  CONSISTENCY_VALUES,
  consistencyLabel,
  createCell,
  leastRefutedHypotheses,
  type MatrixCell,
  scoreHypotheses,
  toCsv,
} from "../lib/ach-matrix";
import {
  evaluateStorageHealth,
  formatBytes,
  formatPercent,
  formatRelativeAge,
  readStorageSnapshot,
  requestPersistentStorage,
  STORAGE_HEALTH_METADATA_KEY,
  type StorageHealthLevel,
  type StorageHealthReport,
  type StorageRiskAction,
} from "../lib/storage-health";
import {
  createPrivacyFirewall,
  type FirewallLogEntry,
  NETWORK_INVENTORY,
  type PrivacyFirewall,
  PRIVACY_OFFLINE_METADATA_KEY,
} from "../lib/privacy-firewall";

type ViewId =
  | "tauler"
  | "fonts"
  | "extractes"
  | "hipotesis"
  | "evidencies"
  | "afirmacions"
  | "matriu"
  | "sensibilitat"
  | "capitols"
  | "validacio"
  | "exporta"
  | "salut"
  | "privadesa";

type Project = ProjectRecord;

// Esborrany del formulari d'extracte (funció 107): id null quan és nou.
type NoteDraft = {
  id: string | null;
  sourceId: string;
  referenceId: string | null;
  page: number | null;
  quote: string;
  paraphrase: string;
  comment: string;
  tags: string;
};

// Esborrany del formulari d'evidència (funció 204): id null quan és nova.
type EvidenceDraft = {
  id: string | null;
  code: string;
  description: string;
  sourceId: string;
  page: number | null;
  noteId: string;
  family: string;
  quality: EvidenceQuality;
};

// Esborrany del formulari d'afirmació (funció 205): id null quan és nova.
type AffirmationDraft = {
  id: string | null;
  code: string;
  text: string;
  type: AffirmationType;
  chapter: string;
  reviewState: AffirmationReviewState;
  assertiveness: Assertiveness;
};

// Esborrany d'una cel·la de la matriu ACH (funció 209): creuament evidència × hipòtesi.
type CellDraft = {
  evidenceId: string;
  hypothesisId: string;
  value: ConsistencyValue;
  comment: string;
};

const initialTimestamp = new Date().toISOString();

const defaultProject: Project = {
  id: "origen-tarot",
  title: "L’origen del Tarot",
  subtitle: "Obra en preparació · espai local",
  createdAt: initialTimestamp,
  updatedAt: initialTimestamp,
  dataVersion: PROJECT_DATA_VERSION,
  archivedAt: null,
  phase: 1,
  chapters: 13,
  words: 58951,
  notes: 206,
};

const views: Array<{ id: ViewId; label: string; short: string }> = [
  { id: "tauler", label: "Tauler", short: "T" },
  { id: "fonts", label: "Fonts", short: "F" },
  { id: "extractes", label: "Extractes", short: "Ex" },
  { id: "hipotesis", label: "Hipòtesis", short: "H" },
  { id: "evidencies", label: "Evidències", short: "E" },
  { id: "afirmacions", label: "Afirmacions", short: "A" },
  { id: "matriu", label: "Matriu ACH", short: "M" },
  { id: "sensibilitat", label: "Sensibilitat", short: "S" },
  { id: "capitols", label: "Capítols", short: "C" },
  { id: "validacio", label: "Validació", short: "V" },
  { id: "exporta", label: "Exporta", short: "X" },
  { id: "salut", label: "Salut", short: "◎" },
  { id: "privadesa", label: "Privadesa", short: "P" },
];

const phases = [
  "Mètode",
  "Hipòtesis",
  "Evidències",
  "Matriu",
  "Sensibilitat",
  "Redacció",
  "Revisió",
];

const moduleCopy: Record<Exclude<ViewId, "tauler" | "salut" | "privadesa" | "fonts" | "extractes" | "hipotesis" | "evidencies" | "afirmacions" | "matriu">, { eyebrow: string; title: string; body: string; status: string }> = {
  sensibilitat: {
    eyebrow: "Fase 4",
    title: "Anàlisi de sensibilitat",
    body: "Comprova si la conclusió resisteix canvis de priors i l’exclusió de famílies dependents.",
    status: "Properament",
  },
  capitols: {
    eyebrow: "Taller d’obra",
    title: "Manuscrit i capítols",
    body: "Importa l’obra localment i conserva l’original mentre prepares una còpia de treball.",
    status: "Disponible",
  },
  validacio: {
    eyebrow: "Auditoria",
    title: "Validació d’afirmacions",
    body: "Verifica que cada frase factual tingui AID, EID, pàgina i tipus de traça abans de donar-la per bona.",
    status: "Regles disponibles",
  },
  exporta: {
    eyebrow: "Portabilitat",
    title: "Còpia i exportació",
    body: "Descarrega una còpia del projecte local i restaura-la en aquest o en un altre dispositiu.",
    status: "Disponible",
  },
};

function persistProject(project: Project) {
  return projectRepository.save(project);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ca-ES").format(value);
}

async function computeStorageReport(): Promise<StorageHealthReport> {
  const [snapshot, backupMeta] = await Promise.all([
    readStorageSnapshot(),
    metadataRepository.get(STORAGE_HEALTH_METADATA_KEY),
  ]);
  const lastBackupAt =
    typeof backupMeta?.value === "string" ? backupMeta.value : null;
  return evaluateStorageHealth({ snapshot, lastBackupAt });
}

export default function Workspace() {
  const [view, setView] = useState<ViewId>("tauler");
  const [project, setProject] = useState<Project>(defaultProject);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState("Dades només en aquest dispositiu");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [draftTitle, setDraftTitle] = useState(defaultProject.title);
  const [storageReport, setStorageReport] = useState<StorageHealthReport | null>(
    null,
  );
  const [storageState, setStorageState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [canRecover, setCanRecover] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState("");
  const [privacyOffline, setPrivacyOffline] = useState(false);
  const [firewallLog, setFirewallLog] = useState<FirewallLogEntry[]>([]);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [storedSize, setStoredSize] = useState(0);
  const [citationTarget, setCitationTarget] = useState<SourceRecord | null>(
    null,
  );
  const [citationDraft, setCitationDraft] = useState<Citation>(emptyCitation());
  const [textTarget, setTextTarget] = useState<SourceRecord | null>(null);
  const [textResult, setTextResult] = useState<ExtractedText | null>(null);
  const [textState, setTextState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [textError, setTextError] = useState("");
  const [pdfDoc, setPdfDoc] = useState<{
    sourceId: string;
    projectId: string;
    name: string;
    data: ArrayBuffer;
    initialPage: number;
  } | null>(null);
  const [pdfReferences, setPdfReferences] = useState<PdfReference[]>([]);
  const [notes, setNotes] = useState<CitableNote[]>([]);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [noteFilter, setNoteFilter] = useState<{ query: string; sourceId: string }>({
    query: "",
    sourceId: "",
  });
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [hypothesisDraft, setHypothesisDraft] = useState<Hypothesis | null>(
    null,
  );
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [evidenceDraft, setEvidenceDraft] = useState<EvidenceDraft | null>(null);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [affirmationDraft, setAffirmationDraft] =
    useState<AffirmationDraft | null>(null);
  const [links, setLinks] = useState<AidEidLink[]>([]);
  const [cells, setCells] = useState<MatrixCell[]>([]);
  const [cellDraft, setCellDraft] = useState<CellDraft | null>(null);
  const [manuscripts, setManuscripts] = useState<ManuscriptRecord[]>([]);
  const [manuscriptError, setManuscriptError] = useState("");
  const [manuscriptImporting, setManuscriptImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceInput = useRef<HTMLInputElement>(null);
  const manuscriptInput = useRef<HTMLInputElement>(null);
  const firewallRef = useRef<PrivacyFirewall | null>(null);

  async function loadSources(projectId: string) {
    try {
      const [list, size] = await Promise.all([
        sourceRepository.getAllForProject(projectId),
        sourceBlobRepository.totalSizeForProject(projectId),
      ]);
      setSources(list);
      setStoredSize(size);
    } catch {
      setSources([]);
      setStoredSize(0);
    }
  }

  async function loadNotes(projectId: string) {
    try {
      setNotes(await citableNoteRepository.getAllForProject(projectId));
    } catch {
      setNotes([]);
    }
  }

  async function importSources(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    const errors: string[] = [];
    const added: SourceRecord[] = [];
    for (const file of list) {
      const validation = validateSourceFile({
        name: file.name,
        type: file.type,
        size: file.size,
      });
      if (!validation.ok) {
        errors.push(validation.message);
        continue;
      }
      try {
        const data = await file.arrayBuffer();
        const record = await sourceRepository.add(
          createSourceRecord(
            {
              name: file.name,
              type: file.type,
              size: file.size,
              kind: validation.kind,
            },
            project.id,
          ),
        );
        try {
          await sourceBlobRepository.put(
            createSourceBlobRecord({
              sourceId: record.id,
              projectId: project.id,
              mime: file.type,
              data,
            }),
          );
        } catch (blobError) {
          await sourceRepository.delete(record.id).catch(() => undefined);
          throw blobError;
        }
        added.push(record);
      } catch {
        errors.push(`No s’ha pogut desar «${file.name}».`);
      }
    }

    if (added.length > 0) {
      setSources((current) => [...added, ...current]);
      setStoredSize(
        await sourceBlobRepository
          .totalSizeForProject(project.id)
          .catch(() => storedSize),
      );
    }
    setSourceErrors(errors);
    setNotice(
      added.length > 0
        ? `${added.length} font(s) importada(es)${errors.length ? ` · ${errors.length} amb errors` : ""}`
        : "Cap font importada",
    );
  }

  async function deleteSource(id: string) {
    const target = sources.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Vols eliminar «${target?.name ?? "la font"}» i el seu contingut d’aquest dispositiu?`,
    );
    if (!confirmed) return;
    await sourceRepository.delete(id);
    await sourceBlobRepository.delete(id).catch(() => undefined);
    await citableNoteRepository.deleteForSource(id).catch(() => undefined);
    setSources((current) => current.filter((item) => item.id !== id));
    setNotes((current) => current.filter((note) => note.sourceId !== id));
    setStoredSize(
      await sourceBlobRepository
        .totalSizeForProject(project.id)
        .catch(() => storedSize),
    );
  }

  async function downloadSource(target: SourceRecord) {
    try {
      const record = await sourceBlobRepository.get(target.id);
      if (!record) {
        setNotice("El contingut d’aquesta font no és al dispositiu");
        return;
      }
      const url = sourceBlobToObjectUrl(record);
      const link = document.createElement("a");
      link.href = url;
      link.download = target.name;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setNotice("No s’ha pogut obrir el contingut de la font");
    }
  }

  function openCitation(target: SourceRecord) {
    setCitationTarget(target);
    setCitationDraft(
      target.citation ?? { ...emptyCitation(), title: target.name },
    );
  }

  function updateCitationDraft(patch: Partial<Citation>) {
    setCitationDraft((current) => ({ ...current, ...patch }));
  }

  async function saveCitation(event: FormEvent) {
    event.preventDefault();
    if (!citationTarget) return;
    const takenKeys = sources
      .filter((item) => item.id !== citationTarget.id)
      .map((item) => item.citation?.citekey)
      .filter((key): key is string => Boolean(key));
    const citation = normalizeCitation(citationDraft, takenKeys);
    const updated = await sourceRepository.save({ ...citationTarget, citation });
    setSources((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setCitationTarget(null);
    setNotice(`Fitxa desada · ${citation.citekey}`);
  }

  async function openText(target: SourceRecord) {
    setTextTarget(target);
    setTextResult(null);
    setTextError("");
    setTextState("loading");
    try {
      const record = await sourceBlobRepository.get(target.id);
      if (!record) {
        setTextError("El contingut d’aquesta font no és al dispositiu.");
        setTextState("error");
        return;
      }
      const result = await extractSourceText({
        data: record.data,
        kind: target.kind,
      });
      setTextResult(result);
      setTextState("ready");
    } catch (error) {
      setTextError(
        error instanceof TextExtractionError
          ? error.message
          : "No s’ha pogut extreure el text.",
      );
      setTextState("error");
    }
  }

  async function openPdf(target: SourceRecord, initialPage = 1) {
    try {
      const record = await sourceBlobRepository.get(target.id);
      if (!record) {
        setNotice("El contingut d’aquesta font no és al dispositiu");
        return;
      }
      const references = await pdfReferenceRepository.getAllForSource(target.id);
      setPdfReferences(references);
      setPdfDoc({
        sourceId: target.id,
        projectId: target.projectId,
        name: target.name,
        data: record.data,
        initialPage,
      });
    } catch {
      setNotice("No s’ha pogut obrir el PDF");
    }
  }

  async function createReference(page: number, text: string) {
    if (!pdfDoc) return;
    try {
      const reference = createPdfReference({
        sourceId: pdfDoc.sourceId,
        projectId: pdfDoc.projectId,
        page,
        text,
      });
      await pdfReferenceRepository.save(reference);
      setPdfReferences((current) =>
        [...current, reference].sort((left, right) => left.page - right.page),
      );
    } catch {
      setNotice("No s’ha pogut desar la referència");
    }
  }

  async function deleteReference(id: string) {
    try {
      await pdfReferenceRepository.delete(id);
      setPdfReferences((current) =>
        current.filter((reference) => reference.id !== id),
      );
    } catch {
      setNotice("No s’ha pogut esborrar la referència");
    }
  }

  function closePdf() {
    setPdfDoc(null);
    setPdfReferences([]);
  }

  function emptyNoteDraft(sourceId: string): NoteDraft {
    return {
      id: null,
      sourceId,
      referenceId: null,
      page: null,
      quote: "",
      paraphrase: "",
      comment: "",
      tags: "",
    };
  }

  function startNewNote() {
    setNoteDraft(emptyNoteDraft(noteFilter.sourceId || sources[0]?.id || ""));
  }

  function editNote(note: CitableNote) {
    setNoteDraft({
      id: note.id,
      sourceId: note.sourceId,
      referenceId: note.referenceId,
      page: note.page,
      quote: note.quote,
      paraphrase: note.paraphrase,
      comment: note.comment,
      tags: formatTags(note.tags),
    });
  }

  function updateNoteDraft(patch: Partial<NoteDraft>) {
    setNoteDraft((current) => (current ? { ...current, ...patch } : current));
  }

  // Pont amb el visor PDF (funció 104): promou una referència ancorada a extracte,
  // amb la cita i la pàgina ja emplenades, i porta l'usuari a la vista «Extractes».
  function promoteReferenceToNote(reference: PdfReference) {
    const input = noteInputFromReference(reference);
    setNoteDraft({
      id: null,
      sourceId: input.sourceId,
      referenceId: input.referenceId ?? null,
      page: input.page ?? null,
      quote: input.quote ?? "",
      paraphrase: "",
      comment: "",
      tags: "",
    });
    closePdf();
    setView("extractes");
  }

  async function saveNote() {
    if (!noteDraft) return;
    const draft = noteDraft;
    try {
      const existing = draft.id
        ? notes.find((note) => note.id === draft.id)
        : null;
      const now = new Date().toISOString();
      const note = createCitableNote(
        {
          projectId: project.id,
          sourceId: draft.sourceId,
          referenceId: draft.referenceId,
          page: draft.page,
          quote: draft.quote,
          paraphrase: draft.paraphrase,
          comment: draft.comment,
          tags: draft.tags,
        },
        { id: draft.id ?? undefined, now: existing?.createdAt ?? now },
      );
      const saved = { ...note, updatedAt: now };
      await citableNoteRepository.save(saved);
      setNotes((current) =>
        [saved, ...current.filter((item) => item.id !== saved.id)].sort(
          (left, right) => right.updatedAt.localeCompare(left.updatedAt),
        ),
      );
      setNoteDraft(null);
    } catch (error) {
      setNotice(
        error instanceof TypeError
          ? error.message
          : "No s’ha pogut desar l’extracte",
      );
    }
  }

  async function deleteNote(id: string) {
    if (!window.confirm("Vols esborrar aquest extracte d’aquest dispositiu?")) {
      return;
    }
    await citableNoteRepository.delete(id).catch(() => undefined);
    setNotes((current) => current.filter((note) => note.id !== id));
  }

  async function openNoteSource(note: CitableNote) {
    const source = sources.find((item) => item.id === note.sourceId);
    if (!source) {
      setNotice("La font d’aquest extracte ja no és al dispositiu");
      return;
    }
    if (source.kind !== "pdf") {
      setNotice("Aquesta font no té visor de pàgina; obre-la des de «Fonts»");
      return;
    }
    await openPdf(source, note.page ?? 1);
  }

  async function loadHypotheses(projectId: string) {
    try {
      setHypotheses(await hypothesisRepository.getAllForProject(projectId));
    } catch {
      setHypotheses([]);
    }
  }

  async function loadEvidence(projectId: string) {
    try {
      setEvidence(await evidenceRepository.getAllForProject(projectId));
    } catch {
      setEvidence([]);
    }
  }

  async function loadAffirmations(projectId: string) {
    try {
      setAffirmations(await affirmationRepository.getAllForProject(projectId));
    } catch {
      setAffirmations([]);
    }
  }

  async function loadLinks(projectId: string) {
    try {
      setLinks(await aidEidLinkRepository.getAllForProject(projectId));
    } catch {
      setLinks([]);
    }
  }

  async function loadCells(projectId: string) {
    try {
      setCells(await matrixCellRepository.getAllForProject(projectId));
    } catch {
      setCells([]);
    }
  }

  async function loadManuscripts(projectId: string) {
    try {
      setManuscripts(await manuscriptRepository.getAllForProject(projectId));
    } catch {
      setManuscripts([]);
    }
  }

  async function importManuscript(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setManuscriptImporting(true);
    setManuscriptError("");
    try {
      const prepared = await prepareManuscriptImport({
        projectId: project.id,
        file: { name: file.name, type: file.type, size: file.size },
        data: await file.arrayBuffer(),
      });
      const imported = await manuscriptRepository.import(
        prepared.manuscript,
        prepared.original,
      );
      setManuscripts((current) => [imported, ...current]);
      setProject((current) => ({
        ...current,
        words: imported.wordCount,
        updatedAt: new Date().toISOString(),
      }));
      setSaved(false);
      setNotice("Manuscrit importat · original protegit i còpia de treball creada");
    } catch (error) {
      const message =
        error instanceof ManuscriptImportError || error instanceof Error
          ? error.message
          : "No s’ha pogut importar el manuscrit.";
      setManuscriptError(message);
      setNotice("Importació del manuscrit incompleta");
    } finally {
      setManuscriptImporting(false);
      event.target.value = "";
    }
  }

  async function downloadOriginal(manuscript: ManuscriptRecord) {
    try {
      const original = await manuscriptRepository.getOriginal(manuscript.id);
      if (!original) {
        setManuscriptError("No s’ha trobat l’original protegit.");
        return;
      }
      const url = originalToObjectUrl(original);
      const link = document.createElement("a");
      link.href = url;
      link.download = manuscript.name;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setManuscriptError("No s’ha pogut recuperar l’original.");
    }
  }

  async function seedHypotheses() {
    for (const hypothesis of defaultHypotheses(project.id)) {
      await hypothesisRepository.save(hypothesis);
    }
    await loadHypotheses(project.id);
    setNotice("Joc d’hipòtesis H1/H2/H3 creat");
  }

  function openHypothesis(target: Hypothesis) {
    setHypothesisDraft({ ...target });
  }

  function updateHypothesisDraft(patch: Partial<Hypothesis>) {
    setHypothesisDraft((current) =>
      current ? { ...current, ...patch } : current,
    );
  }

  async function saveHypothesis(event: FormEvent) {
    event.preventDefault();
    if (!hypothesisDraft) return;
    const saved = await hypothesisRepository.save(
      normalizeHypothesis(hypothesisDraft),
    );
    setHypotheses((current) =>
      current
        .map((item) => (item.id === saved.id ? saved : item))
        .sort((left, right) => left.code.localeCompare(right.code)),
    );
    setHypothesisDraft(null);
    setNotice(`${saved.code} desada`);
  }

  async function deleteHypothesis(id: string) {
    const target = hypotheses.find((item) => item.id === id);
    if (
      !window.confirm(
        `Vols eliminar ${target?.code ?? "la hipòtesi"} d’aquest projecte?`,
      )
    ) {
      return;
    }
    await hypothesisRepository.delete(id);
    await matrixCellRepository.deleteForHypothesis(id).catch(() => undefined);
    setHypotheses((current) => current.filter((item) => item.id !== id));
    setCells((current) => current.filter((cell) => cell.hypothesisId !== id));
  }

  function emptyEvidenceDraft(): EvidenceDraft {
    return {
      id: null,
      code: nextEvidenceCode(evidence.map((item) => item.code)),
      description: "",
      sourceId: "",
      page: null,
      noteId: "",
      family: "",
      quality: "incerta",
    };
  }

  function startNewEvidence() {
    setEvidenceDraft(emptyEvidenceDraft());
  }

  function editEvidence(record: EvidenceRecord) {
    setEvidenceDraft({
      id: record.id,
      code: record.code,
      description: record.description,
      sourceId: record.sourceId ?? "",
      page: record.page,
      noteId: record.noteId ?? "",
      family: record.family,
      quality: record.quality,
    });
  }

  function updateEvidenceDraft(patch: Partial<EvidenceDraft>) {
    setEvidenceDraft((current) => (current ? { ...current, ...patch } : current));
  }

  // Pont amb la funció 107: promou un extracte citable a evidència, amb la
  // paràfrasi com a descripció neutral de partida i la font/pàgina/extracte enllaçats.
  function promoteNoteToEvidence(note: CitableNote) {
    const input = evidenceInputFromNote(note);
    setEvidenceDraft({
      id: null,
      code: nextEvidenceCode(evidence.map((item) => item.code)),
      description: input.description ?? "",
      sourceId: input.sourceId ?? "",
      page: input.page ?? null,
      noteId: input.noteId ?? "",
      family: "",
      quality: "incerta",
    });
    setView("evidencies");
  }

  async function saveEvidence() {
    if (!evidenceDraft) return;
    const draft = evidenceDraft;
    try {
      const existing = draft.id
        ? evidence.find((item) => item.id === draft.id)
        : null;
      const now = new Date().toISOString();
      const record = createEvidence(
        {
          projectId: project.id,
          description: draft.description,
          sourceId: draft.sourceId || null,
          page: draft.page,
          noteId: draft.noteId || null,
          family: draft.family,
          quality: draft.quality,
        },
        { id: draft.id ?? undefined, code: draft.code, now: existing?.createdAt ?? now },
      );
      const saved = { ...record, updatedAt: now };
      await evidenceRepository.save(saved);
      setEvidence((current) =>
        [saved, ...current.filter((item) => item.id !== saved.id)].sort(
          (left, right) =>
            left.code.localeCompare(right.code, "en", { numeric: true }),
        ),
      );
      setEvidenceDraft(null);
    } catch (error) {
      setNotice(
        error instanceof TypeError
          ? error.message
          : "No s’ha pogut desar l’evidència",
      );
    }
  }

  async function deleteEvidence(id: string) {
    const target = evidence.find((item) => item.id === id);
    if (
      !window.confirm(
        `Vols eliminar ${target?.code ?? "l’evidència"} d’aquest projecte?`,
      )
    ) {
      return;
    }
    await evidenceRepository.delete(id).catch(() => undefined);
    await aidEidLinkRepository.deleteForEvidence(id).catch(() => undefined);
    await matrixCellRepository.deleteForEvidence(id).catch(() => undefined);
    setEvidence((current) => current.filter((item) => item.id !== id));
    setLinks((current) => current.filter((link) => link.evidenceId !== id));
    setCells((current) => current.filter((cell) => cell.evidenceId !== id));
  }

  function startNewAffirmation() {
    setAffirmationDraft({
      id: null,
      code: nextAffirmationCode(affirmations.map((item) => item.code)),
      text: "",
      type: "incondicional",
      chapter: "",
      reviewState: "esborrany",
      assertiveness: "moderada",
    });
  }

  function editAffirmation(record: Affirmation) {
    setAffirmationDraft({
      id: record.id,
      code: record.code,
      text: record.text,
      type: record.type,
      chapter: record.chapter,
      reviewState: record.reviewState,
      assertiveness: record.assertiveness,
    });
  }

  function updateAffirmationDraft(patch: Partial<AffirmationDraft>) {
    setAffirmationDraft((current) => (current ? { ...current, ...patch } : current));
  }

  async function saveAffirmation() {
    if (!affirmationDraft) return;
    const draft = affirmationDraft;
    try {
      const existing = draft.id
        ? affirmations.find((item) => item.id === draft.id)
        : null;
      const now = new Date().toISOString();
      const record = createAffirmation(
        {
          projectId: project.id,
          text: draft.text,
          type: draft.type,
          chapter: draft.chapter,
          reviewState: draft.reviewState,
          assertiveness: draft.assertiveness,
        },
        { id: draft.id ?? undefined, code: draft.code, now: existing?.createdAt ?? now },
      );
      const saved = { ...record, updatedAt: now };
      await affirmationRepository.save(saved);
      setAffirmations((current) =>
        [saved, ...current.filter((item) => item.id !== saved.id)].sort(
          (left, right) =>
            left.code.localeCompare(right.code, "en", { numeric: true }),
        ),
      );
      setAffirmationDraft(null);
    } catch (error) {
      setNotice(
        error instanceof TypeError
          ? error.message
          : "No s’ha pogut desar l’afirmació",
      );
    }
  }

  async function deleteAffirmation(id: string) {
    const target = affirmations.find((item) => item.id === id);
    if (
      !window.confirm(
        `Vols eliminar ${target?.code ?? "l’afirmació"} d’aquest projecte?`,
      )
    ) {
      return;
    }
    await affirmationRepository.delete(id).catch(() => undefined);
    await aidEidLinkRepository.deleteForAffirmation(id).catch(() => undefined);
    setAffirmations((current) => current.filter((item) => item.id !== id));
    setLinks((current) => current.filter((link) => link.affirmationId !== id));
  }

  async function linkEvidenceToAffirmation(
    affirmationId: string,
    evidenceId: string,
    stance: EvidenceStance,
    derivation: DerivationType,
  ) {
    if (!evidenceId || hasLink(links, affirmationId, evidenceId)) return;
    try {
      const link = createLink({
        projectId: project.id,
        affirmationId,
        evidenceId,
        stance,
        derivation,
      });
      await aidEidLinkRepository.save(link);
      setLinks((current) => [
        ...current.filter((item) => item.id !== link.id),
        link,
      ]);
    } catch {
      setNotice("No s’ha pogut vincular l’evidència");
    }
  }

  async function unlink(id: string) {
    await aidEidLinkRepository.delete(id).catch(() => undefined);
    setLinks((current) => current.filter((link) => link.id !== id));
  }

  function openCell(evidenceId: string, hypothesisId: string) {
    const existing = cells.find(
      (cell) => cell.evidenceId === evidenceId && cell.hypothesisId === hypothesisId,
    );
    setCellDraft({
      evidenceId,
      hypothesisId,
      value: existing?.value ?? "N",
      comment: existing?.comment ?? "",
    });
  }

  function updateCellDraft(patch: Partial<CellDraft>) {
    setCellDraft((current) => (current ? { ...current, ...patch } : current));
  }

  async function saveCell() {
    if (!cellDraft) return;
    const draft = cellDraft;
    try {
      const cell = createCell({
        projectId: project.id,
        evidenceId: draft.evidenceId,
        hypothesisId: draft.hypothesisId,
        value: draft.value,
        comment: draft.comment,
      });
      await matrixCellRepository.save(cell);
      setCells((current) => [
        ...current.filter((item) => item.id !== cell.id),
        cell,
      ]);
      setCellDraft(null);
    } catch (error) {
      setNotice(
        error instanceof TypeError
          ? error.message
          : "No s’ha pogut desar la cel·la",
      );
    }
  }

  function exportMatrixCsv() {
    const rows = buildMatrix(
      cells,
      evidence.map((item) => item.id),
      hypotheses.map((item) => item.id),
    );
    const csv = toCsv(
      rows,
      hypotheses.map((item) => ({ hypothesisId: item.id, code: item.code })),
      (id) => evidence.find((item) => item.id === id)?.code ?? id,
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `matriu-ach-${project.id}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function refreshStorageHealth() {
    try {
      setStorageReport(await computeStorageReport());
      setStorageState("ready");
    } catch {
      setStorageState("error");
    }
  }

  async function toggleOffline() {
    const firewall = firewallRef.current;
    if (!firewall) return;
    const next = !firewall.isOffline();
    firewall.setOffline(next);
    setPrivacyOffline(next);
    setNotice(next ? "Mode sense xarxa activat" : "Mode sense xarxa desactivat");
    await metadataRepository.set(PRIVACY_OFFLINE_METADATA_KEY, next);
  }

  useEffect(() => {
    async function prepareWorkspace() {
      try {
        const migration = await ensureProjectsMigrated();
        if (migration.failures.length > 0) {
          setCanRecover(true);
          setMigrationNotice(
            `No s’han pogut migrar ${migration.failures.length} projecte(s). S’ha desat una còpia prèvia recuperable.`,
          );
        }
      } catch {
        setCanRecover(true);
        setMigrationNotice(
          "La migració de dades ha fallat. S’ha conservat una còpia prèvia; pots recuperar-la.",
        );
      }

      let storedProjects = await projectRepository.getAll();
      if (storedProjects.length === 0) {
        storedProjects = [await persistProject(defaultProject)];
      }

      const activeMetadata = await metadataRepository.get("activeProjectId");
      const activeId =
        typeof activeMetadata?.value === "string" ? activeMetadata.value : null;
      const activeProject =
        storedProjects.find(
          (stored) => stored.id === activeId && !stored.archivedAt,
        ) ??
        storedProjects.find((stored) => !stored.archivedAt) ??
        storedProjects[0];

      setProjects(storedProjects);
      setProject(activeProject);
      setDraftTitle(activeProject.title);
      await metadataRepository.set("activeProjectId", activeProject.id);
      try {
        const [list, size, hyps] = await Promise.all([
          sourceRepository.getAllForProject(activeProject.id),
          sourceBlobRepository.totalSizeForProject(activeProject.id),
          hypothesisRepository.getAllForProject(activeProject.id),
        ]);
        setSources(list);
        setStoredSize(size);
        setHypotheses(hyps);
      } catch {
        setSources([]);
        setStoredSize(0);
        setHypotheses([]);
      }
      await loadNotes(activeProject.id);
      await loadEvidence(activeProject.id);
      await loadAffirmations(activeProject.id);
      await loadLinks(activeProject.id);
      await loadCells(activeProject.id);
      await loadManuscripts(activeProject.id);
    }

    prepareWorkspace()
      .catch(() => setNotice("No s’ha pogut obrir l’espai local"))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const next = { ...project, updatedAt: new Date().toISOString() };
      persistProject(next)
        .then((savedProject) => {
          setProjects((current) => [
            savedProject,
            ...current.filter((item) => item.id !== savedProject.id),
          ]);
          setSaved(true);
        })
        .catch(() => setNotice("Error en desar localment"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [project, ready]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    async function loadStorageHealth() {
      const report = await computeStorageReport();
      setStorageReport(report);
      setStorageState("ready");
    }
    loadStorageHealth().catch(() => setStorageState("error"));
  }, []);

  useEffect(() => {
    const baseFetch = window.fetch.bind(window);
    const firewall = createPrivacyFirewall({
      appOrigin: window.location.origin,
      baseFetch,
      onEvent: (entry) =>
        setFirewallLog((current) => [entry, ...current].slice(0, 50)),
    });
    firewallRef.current = firewall;
    window.fetch = firewall.fetch;

    metadataRepository
      .get(PRIVACY_OFFLINE_METADATA_KEY)
      .then((meta) => {
        if (meta?.value === true) {
          firewall.setOffline(true);
          setPrivacyOffline(true);
        }
      })
      .catch(() => undefined);

    return () => {
      window.fetch = baseFetch;
      firewallRef.current = null;
    };
  }, []);

  async function openProject(nextProject: Project) {
    setProject(nextProject);
    setDraftTitle(nextProject.title);
    setView("tauler");
    setShowProjects(false);
    setSaved(true);
    await metadataRepository.set("activeProjectId", nextProject.id);
    await loadSources(nextProject.id);
    await loadNotes(nextProject.id);
    await loadHypotheses(nextProject.id);
    await loadEvidence(nextProject.id);
    await loadAffirmations(nextProject.id);
    await loadLinks(nextProject.id);
    await loadCells(nextProject.id);
    await loadManuscripts(nextProject.id);
  }

  async function createProject(title: string) {
    const created = await projectRepository.save(createProjectRecord(title));
    setProjects((current) => [created, ...current]);
    setNotice("Projecte creat en aquest dispositiu");
    await openProject(created);
  }

  function startRename(target: Project) {
    setRenameTarget(target);
    setDraftTitle(target.title);
  }

  async function renameProject(event: FormEvent) {
    event.preventDefault();
    const clean = draftTitle.trim();
    if (!clean || !renameTarget) return;

    const renamed = await projectRepository.save({
      ...renameTarget,
      title: clean,
      updatedAt: new Date().toISOString(),
    });
    setProjects((current) =>
      current.map((item) => (item.id === renamed.id ? renamed : item)),
    );
    if (project.id === renamed.id) {
      setProject(renamed);
      setSaved(true);
    }
    setRenameTarget(null);
    setNotice("Projecte reanomenat localment");
  }

  async function duplicateProject(source: Project) {
    const duplicate = await projectRepository.save(
      duplicateProjectRecord(source),
    );
    setProjects((current) => [duplicate, ...current]);
    setNotice("Projecte duplicat en aquest dispositiu");
    await openProject(duplicate);
  }

  async function archiveProject(target: Project) {
    const activeProjects = projects.filter((item) => !item.archivedAt);
    if (activeProjects.length <= 1) {
      setNotice("Cal conservar almenys un projecte actiu");
      return;
    }

    const archived = await projectRepository.save({
      ...target,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const nextProjects = projects.map((item) =>
      item.id === archived.id ? archived : item,
    );
    setProjects(nextProjects);
    if (project.id === archived.id) {
      const nextActive = nextProjects.find((item) => !item.archivedAt);
      if (nextActive) await openProject(nextActive);
    }
    setShowProjects(true);
    setNotice("Projecte arxivat");
  }

  async function restoreProject(target: Project) {
    const restored = await projectRepository.save({
      ...target,
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    });
    setProjects((current) =>
      current.map((item) => (item.id === restored.id ? restored : item)),
    );
    setNotice("Projecte restaurat");
  }

  async function deleteProject(target: Project) {
    await projectRepository.delete(target.id);
    setProjects((current) =>
      current.filter((item) => item.id !== target.id),
    );
    setNotice("Projecte eliminat d’aquest dispositiu");
  }

  async function recoverProjects() {
    try {
      const restored = await recoverProjectsFromBackup();
      if (restored === 0) {
        setNotice("No hi ha cap còpia prèvia per recuperar");
      } else {
        const reloaded = await projectRepository.getAll();
        setProjects(reloaded);
        const active =
          reloaded.find(
            (item) => item.id === project.id && !item.archivedAt,
          ) ??
          reloaded.find((item) => !item.archivedAt) ??
          reloaded[0];
        if (active) {
          setProject(active);
          setDraftTitle(active.title);
          await metadataRepository.set("activeProjectId", active.id);
        }
        setNotice(`Còpia prèvia restaurada (${restored} projecte(s))`);
      }
    } catch {
      setNotice("No s’ha pogut restaurar la còpia prèvia");
    } finally {
      setCanRecover(false);
      setMigrationNotice("");
    }
  }

  function dismissRecovery() {
    setCanRecover(false);
    setMigrationNotice("");
  }

  async function protectStorage() {
    const granted = await requestPersistentStorage();
    if (granted === null) {
      setNotice("El navegador no ofereix protecció addicional");
    } else {
      setNotice(
        granted
          ? "Espai local protegit pel navegador"
          : "Còpia periòdica recomanada",
      );
    }
    await refreshStorageHealth();
  }

  async function exportProject() {
    try {
      const exportedAt = new Date().toISOString();
      const projectPackage = await createProjectPackage(project, exportedAt);
      const blob = new Blob([serializeProjectPackage(projectPackage)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${project.id || "projecte"}.validaccio.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
      await metadataRepository.set(STORAGE_HEALTH_METADATA_KEY, exportedAt);
      await refreshStorageHealth();
      setNotice("Còpia verificada exportada");
    } catch {
      setNotice("No s’ha pogut preparar la còpia local");
    }
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > MAX_PROJECT_PACKAGE_BYTES) {
        throw new ProjectPackageError(
          "invalid-data",
          "La còpia supera el límit de 5 MB.",
        );
      }

      const imported = await parseProjectPackage(await file.text());
      let projectToSave = imported.project;
      const alreadyExists = projects.some(
        (item) => item.id === imported.project.id,
      );

      if (alreadyExists) {
        const replace = window.confirm(
          `Ja existeix «${imported.project.title}». Vols substituir-ne les dades? Si cancel·les, s’importarà com una còpia independent.`,
        );
        if (!replace) {
          projectToSave = duplicateProjectRecord(imported.project);
        }
      }

      const savedProject = await projectRepository.save(projectToSave);
      setProjects((current) => [
        savedProject,
        ...current.filter((item) => item.id !== savedProject.id),
      ]);
      await openProject(savedProject);
      setNotice(
        imported.source === "legacy"
          ? "Còpia antiga restaurada i actualitzada"
          : "Integritat verificada · projecte restaurat",
      );
    } catch (error) {
      setNotice(
        error instanceof ProjectPackageError
          ? error.message
          : "El fitxer no és un projecte Validacció vàlid",
      );
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="workspace-shell">
      <aside className="sidebar" aria-label="Navegació principal">
        <button className="brand" onClick={() => setView("tauler")} aria-label="Torna al tauler">
          <span className="brand-mark">V</span>
          <span>
            <strong>VALIDACCIÓ</strong>
            <small>Recerca històrica</small>
          </span>
        </button>

        <nav className="main-nav">
          {views.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setView(item.id)}
            >
              <span className="nav-icon">{item.short}</span>
              <span>{item.label}</span>
              {item.id === "evidencies" && evidence.length > 0 && (
                <span className="nav-count">{evidence.length}</span>
              )}
              {item.id === "afirmacions" && affirmations.length > 0 && (
                <span className="nav-count">{affirmations.length}</span>
              )}
              {item.id === "fonts" && sources.length > 0 && (
                <span className="nav-count">{sources.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="local-card">
          <span className="pulse-dot" />
          <div>
            <strong>{saved ? "Desat localment" : "Desant…"}</strong>
            <small>{notice}</small>
          </div>
          <button onClick={protectStorage}>Protegeix</button>
        </div>
      </aside>

      <section className="content-shell">
        <header className="topbar">
          <div className="project-switcher">
            <span className="book-chip">LT</span>
            <button
              aria-label="Obre la biblioteca de projectes"
              onClick={() => setShowProjects(true)}
            >
              <strong>{project.title}</strong>
              <small>{projects.filter((item) => !item.archivedAt).length} projectes actius · canvia de projecte</small>
            </button>
          </div>
          <div className="top-actions">
            <button className="quiet-button" onClick={exportProject}>Còpia local</button>
            <button className="primary-button" onClick={() => setView("fonts")}>+ Afegeix una font</button>
          </div>
        </header>

        {canRecover && (
          <div className="recovery-banner" role="status">
            <div>
              <strong>Còpia prèvia de migració disponible</strong>
              <small>{migrationNotice}</small>
            </div>
            <div className="recovery-actions">
              <button className="quiet-button" onClick={dismissRecovery}>
                Descarta
              </button>
              <button className="primary-button" onClick={recoverProjects}>
                Recupera la còpia prèvia
              </button>
            </div>
          </div>
        )}

        {view === "tauler" ? (
          <Dashboard project={project} setView={setView} />
        ) : view === "salut" ? (
          <StorageHealth
            report={storageReport}
            state={storageState}
            onBackup={exportProject}
            onPersist={protectStorage}
            onManageProjects={() => setShowProjects(true)}
            onRefresh={refreshStorageHealth}
          />
        ) : view === "privadesa" ? (
          <PrivacyFirewallView
            offline={privacyOffline}
            log={firewallLog}
            onToggleOffline={toggleOffline}
            onClearLog={() => {
              firewallRef.current?.clearLog();
              setFirewallLog([]);
            }}
          />
        ) : view === "fonts" ? (
          <SourcesLibrary
            sources={sources}
            errors={sourceErrors}
            storedSize={storedSize}
            onPick={() => sourceInput.current?.click()}
            onImport={importSources}
            onDelete={deleteSource}
            onDownload={downloadSource}
            onEditCitation={openCitation}
            onExtractText={openText}
            onOpenPdf={openPdf}
            onDismissErrors={() => setSourceErrors([])}
          />
        ) : view === "extractes" ? (
          <ExtractsLibrary
            notes={notes}
            sources={sources}
            filter={noteFilter}
            draft={noteDraft}
            onFilter={setNoteFilter}
            onNew={startNewNote}
            onEdit={editNote}
            onDelete={deleteNote}
            onOpenSource={openNoteSource}
            onPromoteToEvidence={promoteNoteToEvidence}
            onDraftChange={updateNoteDraft}
            onSave={saveNote}
            onCancel={() => setNoteDraft(null)}
          />
        ) : view === "hipotesis" ? (
          <HypothesesEditor
            hypotheses={hypotheses}
            onSeed={seedHypotheses}
            onEdit={openHypothesis}
            onDelete={deleteHypothesis}
          />
        ) : view === "evidencies" ? (
          <EvidenceRegistry
            evidence={evidence}
            sources={sources}
            notes={notes}
            draft={evidenceDraft}
            affirmations={affirmations}
            links={links}
            onNew={startNewEvidence}
            onEdit={editEvidence}
            onDelete={deleteEvidence}
            onDraftChange={updateEvidenceDraft}
            onSave={saveEvidence}
            onCancel={() => setEvidenceDraft(null)}
            onOpenAffirmations={() => setView("afirmacions")}
          />
        ) : view === "afirmacions" ? (
          <AffirmationsRegistry
            affirmations={affirmations}
            draft={affirmationDraft}
            evidence={evidence}
            links={links}
            onNew={startNewAffirmation}
            onEdit={editAffirmation}
            onDelete={deleteAffirmation}
            onDraftChange={updateAffirmationDraft}
            onSave={saveAffirmation}
            onCancel={() => setAffirmationDraft(null)}
            onLink={linkEvidenceToAffirmation}
            onUnlink={unlink}
            onOpenEvidence={() => setView("evidencies")}
          />
        ) : view === "matriu" ? (
          <MatrixView
            evidence={evidence}
            hypotheses={hypotheses}
            cells={cells}
            draft={cellDraft}
            onOpenCell={openCell}
            onCellDraftChange={updateCellDraft}
            onSaveCell={saveCell}
            onCancelCell={() => setCellDraft(null)}
            onExportCsv={exportMatrixCsv}
            onOpenEvidence={() => setView("evidencies")}
            onOpenHypotheses={() => setView("hipotesis")}
          />
        ) : (
          <ModuleView
            view={view}
            manuscripts={manuscripts}
            manuscriptError={manuscriptError}
            manuscriptImporting={manuscriptImporting}
            onExport={exportProject}
            onImport={() => fileInput.current?.click()}
            onImportManuscript={() => manuscriptInput.current?.click()}
            onDownloadOriginal={downloadOriginal}
          />
        )}
      </section>

      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importProject} />
      <input
        ref={manuscriptInput}
        type="file"
        accept={MANUSCRIPT_ACCEPT_ATTR}
        hidden
        onChange={importManuscript}
      />
      <input
        ref={sourceInput}
        type="file"
        accept={SOURCE_ACCEPT_ATTR}
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) void importSources(event.target.files);
          event.target.value = "";
        }}
      />

      {showProjects && (
        <ProjectManager
          currentProjectId={project.id}
          onArchive={archiveProject}
          onClose={() => setShowProjects(false)}
          onCreate={createProject}
          onDelete={deleteProject}
          onDuplicate={duplicateProject}
          onOpen={openProject}
          onRename={startRename}
          onRestore={restoreProject}
          projects={projects}
        />
      )}

      {renameTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setRenameTarget(null)}>
          <form className="modal" onSubmit={renameProject} onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">Projecte local</span>
            <h2>Canvia el nom de l’obra</h2>
            <label htmlFor="project-name">Títol</label>
            <input
              id="project-name"
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
            <div className="modal-actions">
              <button type="button" className="quiet-button" onClick={() => setRenameTarget(null)}>Cancel·la</button>
              <button className="primary-button" type="submit">Desa localment</button>
            </div>
          </form>
        </div>
      )}

      {citationTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCitationTarget(null)}>
          <form className="modal citation-modal" onSubmit={saveCitation} onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">Fitxa bibliogràfica</span>
            <h2>{citationTarget.name}</h2>
            <div className="citation-grid">
              <label className="citation-field wide">
                <span>Citekey · identificador estable</span>
                <input
                  value={citationDraft.citekey}
                  onChange={(event) => updateCitationDraft({ citekey: event.target.value })}
                  placeholder="Es genera automàticament si el deixes buit"
                />
              </label>
              <label className="citation-field">
                <span>Autor</span>
                <input
                  value={citationDraft.author}
                  onChange={(event) => updateCitationDraft({ author: event.target.value })}
                  placeholder="Cognom, Nom"
                />
              </label>
              <label className="citation-field">
                <span>Tipus</span>
                <select
                  value={citationDraft.type}
                  onChange={(event) => updateCitationDraft({ type: event.target.value as CitationType })}
                >
                  {CITATION_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="citation-field wide">
                <span>Títol</span>
                <input
                  value={citationDraft.title}
                  onChange={(event) => updateCitationDraft({ title: event.target.value })}
                />
              </label>
              <label className="citation-field">
                <span>Data</span>
                <input
                  value={citationDraft.date}
                  onChange={(event) => updateCitationDraft({ date: event.target.value })}
                  placeholder="p. ex. 1930"
                />
              </label>
              <label className="citation-field">
                <span>Edició</span>
                <input
                  value={citationDraft.edition}
                  onChange={(event) => updateCitationDraft({ edition: event.target.value })}
                />
              </label>
              <label className="citation-field">
                <span>Arxiu o col·lecció</span>
                <input
                  value={citationDraft.archive}
                  onChange={(event) => updateCitationDraft({ archive: event.target.value })}
                />
              </label>
              <label className="citation-field">
                <span>Data de consulta</span>
                <input
                  value={citationDraft.accessedAt}
                  onChange={(event) => updateCitationDraft({ accessedAt: event.target.value })}
                />
              </label>
              <label className="citation-field wide">
                <span>URL</span>
                <input
                  value={citationDraft.url}
                  onChange={(event) => updateCitationDraft({ url: event.target.value })}
                />
              </label>
              <label className="citation-field wide">
                <span>Etiquetes · separades per comes</span>
                <input
                  value={formatTags(citationDraft.tags)}
                  onChange={(event) => updateCitationDraft({ tags: parseTags(event.target.value) })}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="quiet-button" onClick={() => setCitationTarget(null)}>Cancel·la</button>
              <button className="primary-button" type="submit">Desa la fitxa</button>
            </div>
          </form>
        </div>
      )}

      {textTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setTextTarget(null)}>
          <div className="modal citation-modal text-modal" onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">Text extret</span>
            <h2>{textTarget.name}</h2>
            {textState === "loading" ? (
              <p className="storage-note">Extraient el text del contingut desat…</p>
            ) : textState === "error" ? (
              <p className="storage-note">{textError}</p>
            ) : textResult ? (
              <>
                <p className="storage-note">
                  {textResult.paragraphCount} paràgrafs · {textResult.wordCount} paraules · origen «{textTarget.name}»
                </p>
                {textResult.paragraphs.length === 0 ? (
                  <p className="storage-note">El document no conté text extraïble.</p>
                ) : (
                  <ul className="text-paragraphs">
                    {textResult.paragraphs.map((paragraph) => (
                      <li key={paragraph.index}>
                        <span className="paragraph-loc">¶{paragraph.index}</span>
                        <p>{paragraph.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="primary-button" onClick={() => setTextTarget(null)}>Tanca</button>
            </div>
          </div>
        </div>
      )}

      {pdfDoc && (
        <Suspense fallback={null}>
          <PdfViewer
            data={pdfDoc.data}
            name={pdfDoc.name}
            initialPage={pdfDoc.initialPage}
            references={pdfReferences}
            onCreateReference={createReference}
            onDeleteReference={deleteReference}
            onPromoteReference={promoteReferenceToNote}
            onClose={closePdf}
          />
        </Suspense>
      )}

      {hypothesisDraft && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setHypothesisDraft(null)}>
          <form className="modal citation-modal hyp-modal" onSubmit={saveHypothesis} onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">{hypothesisDraft.code} · {roleInfo(hypothesisDraft.role).label}</span>
            <h2>Defineix la hipòtesi</h2>
            {requiresRedTeaming(hypothesisDraft.role) && (
              <p className="redteam-note">
                Regla 10 (Red Teaming): formula-la amb una font independent o
                extreta de la bibliografia contrària; no la debilitis.
              </p>
            )}
            <div className="citation-grid">
              <label className="citation-field">
                <span>Títol curt</span>
                <input
                  value={hypothesisDraft.title}
                  onChange={(event) => updateHypothesisDraft({ title: event.target.value })}
                />
              </label>
              <label className="citation-field">
                <span>Estat de revisió</span>
                <select
                  value={hypothesisDraft.reviewState}
                  onChange={(event) =>
                    updateHypothesisDraft({
                      reviewState: event.target.value as Hypothesis["reviewState"],
                    })
                  }
                >
                  {HYPOTHESIS_REVIEW_STATES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="citation-field wide">
                <span>Enunciat (clar i falsable)</span>
                <textarea
                  rows={3}
                  value={hypothesisDraft.statement}
                  onChange={(event) => updateHypothesisDraft({ statement: event.target.value })}
                />
              </label>
              <label className="citation-field wide">
                <span>Prediccions observables</span>
                <textarea
                  rows={3}
                  value={hypothesisDraft.predictions}
                  onChange={(event) => updateHypothesisDraft({ predictions: event.target.value })}
                  placeholder="Si és certa, esperaríem trobar… / NO esperaríem trobar…"
                />
              </label>
              <label className="citation-field wide">
                <span>Supòsits</span>
                <textarea
                  rows={2}
                  value={hypothesisDraft.assumptions}
                  onChange={(event) => updateHypothesisDraft({ assumptions: event.target.value })}
                />
              </label>
              <label className="citation-field wide">
                <span>Condicions d’abandonament</span>
                <textarea
                  rows={2}
                  value={hypothesisDraft.defeatConditions}
                  onChange={(event) => updateHypothesisDraft({ defeatConditions: event.target.value })}
                  placeholder="Abandonaria aquesta hipòtesi si es demostrés que…"
                />
              </label>
              <label className="citation-field wide">
                <span>Nucli no negociable</span>
                <textarea
                  rows={2}
                  value={hypothesisDraft.core}
                  onChange={(event) => updateHypothesisDraft({ core: event.target.value })}
                />
              </label>
              <label className="citation-field wide">
                <span>Font o autoria de la formulació</span>
                <input
                  value={hypothesisDraft.source}
                  onChange={(event) => updateHypothesisDraft({ source: event.target.value })}
                  placeholder="Qui l’ha formulada (Red Teaming per a H1/H2)"
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="quiet-button" onClick={() => setHypothesisDraft(null)}>Cancel·la</button>
              <button className="primary-button" type="submit">Desa la hipòtesi</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Dashboard({ project, setView }: { project: Project; setView: (view: ViewId) => void }) {
  return (
    <div className="page-content">
      <section className="hero-grid">
        <div>
          <span className="eyebrow">Espai de treball local-first</span>
          <h1>Una atribució sòlida,<br />evidència per evidència.</h1>
          <p>
            Ordena les fonts, confronta hipòtesis i reescriu l’obra sense perdre mai la traça que sosté cada afirmació.
          </p>
        </div>
        <div className="hero-side">
          <span className="stage-label">Següent pas recomanat</span>
          <strong>Defineix les hipòtesis competitives</strong>
          <p>Comença pel consens, formula una alternativa mínima i declara la nova teoria.</p>
          <button onClick={() => setView("hipotesis")}>Obre Hipòtesis →</button>
        </div>
      </section>

      <section className="phase-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Flux metodològic</span>
            <h2>Estat de la investigació</h2>
          </div>
          <span className="outline-badge">Fase {project.phase} de 7</span>
        </div>
        <div className="phase-track">
          {phases.map((phase, index) => (
            <button key={phase} className={index <= project.phase ? "phase active" : "phase"}>
              <span>{index === 0 ? "✓" : index}</span>
              <small>{phase}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="stat-panel manuscript-panel">
          <div className="panel-topline">
            <span className="eyebrow">Manuscrit actual</span>
            <span className="status-chip live">Local</span>
          </div>
          <h3>{project.title}</h3>
          <p>La interfície no conté el document: només mostra el projecte de treball guardat en aquest dispositiu.</p>
          <div className="metrics">
            <div><strong>{project.chapters}</strong><span>capítols</span></div>
            <div><strong>{formatNumber(project.words)}</strong><span>paraules</span></div>
            <div><strong>{project.notes}</strong><span>notes</span></div>
          </div>
          <button className="text-button" onClick={() => setView("capitols")}>Gestiona els capítols →</button>
        </article>

        <article className="stat-panel">
          <div className="panel-topline">
            <span className="eyebrow">Traçabilitat</span>
            <span className="status-chip">Estructura</span>
          </div>
          <div className="trace-score"><strong>0%</strong><span>encara sense dades importades</span></div>
          <div className="bar"><span style={{ width: "2%" }} /></div>
          <ul className="check-list">
            <li><span>○</span> Afirmacions amb AID</li>
            <li><span>○</span> Evidències amb pàgina</li>
            <li><span>○</span> Inferències justificades</li>
          </ul>
          <button className="text-button" onClick={() => setView("validacio")}>Obre la validació →</button>
        </article>
      </section>

      <section className="module-strip">
        <button onClick={() => setView("fonts")}><span>01</span><strong>Fonts</strong><small>Biblioteca i extractes</small></button>
        <button onClick={() => setView("evidencies")}><span>02</span><strong>Evidències</strong><small>Registre EID</small></button>
        <button onClick={() => setView("matriu")}><span>03</span><strong>Matriu ACH</strong><small>Consistència H×E</small></button>
        <button onClick={() => setView("capitols")}><span>04</span><strong>Obra</strong><small>Versions i dossiers</small></button>
      </section>
    </div>
  );
}

function ModuleView({
  view,
  manuscripts,
  manuscriptError,
  manuscriptImporting,
  onExport,
  onImport,
  onImportManuscript,
  onDownloadOriginal,
}: {
  view: Exclude<ViewId, "tauler" | "salut" | "privadesa" | "fonts" | "extractes" | "hipotesis" | "evidencies" | "afirmacions" | "matriu">;
  manuscripts: ManuscriptRecord[];
  manuscriptError: string;
  manuscriptImporting: boolean;
  onExport: () => void;
  onImport: () => void;
  onImportManuscript: () => void;
  onDownloadOriginal: (manuscript: ManuscriptRecord) => void;
}) {
  const copy = moduleCopy[view];
  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
        <span className={copy.status === "Disponible" ? "status-chip live" : "status-chip"}>{copy.status}</span>
      </section>

      {view === "exporta" ? (
        <section className="action-grid">
          <button className="action-card" onClick={onExport}>
            <span className="action-icon">↓</span>
            <strong>Exporta el projecte</strong>
            <small>Descarrega un paquet versionat amb manifest i integritat SHA-256.</small>
          </button>
          <button className="action-card" onClick={onImport}>
            <span className="action-icon">↑</span>
            <strong>Restaura una còpia</strong>
            <small>Valida la còpia abans de restaurar-la o substituir dades locals.</small>
          </button>
        </section>
      ) : view === "capitols" ? (
        <ManuscriptImporter
          manuscripts={manuscripts}
          error={manuscriptError}
          importing={manuscriptImporting}
          onImport={onImportManuscript}
          onDownloadOriginal={onDownloadOriginal}
        />
      ) : (
        <section className="empty-state">
          <div className="empty-orbit"><span>{views.find((item) => item.id === view)?.short}</span></div>
          <h2>La funció ja té lloc dins del flux</h2>
          <p>
            Aquesta primera interfície permet validar l’arquitectura. En la següent iteració hi connectarem les dades reals del repositori i l’edició local.
          </p>
          <button className="primary-button">Prepara la primera acció</button>
        </section>
      )}
    </div>
  );
}

function ManuscriptImporter({
  manuscripts,
  error,
  importing,
  onImport,
  onDownloadOriginal,
}: {
  manuscripts: ManuscriptRecord[];
  error: string;
  importing: boolean;
  onImport: () => void;
  onDownloadOriginal: (manuscript: ManuscriptRecord) => void;
}) {
  return (
    <section className="manuscript-importer">
      <div className="manuscript-callout">
        <div>
          <span className="eyebrow">Funció 301</span>
          <h2>Importa el manuscrit sense tocar l’original</h2>
          <p>
            Accepta DOCX, TXT i Markdown. El fitxer original queda protegit al
            navegador i Validacció crea una còpia de treball textual independent.
          </p>
        </div>
        <button className="primary-button" onClick={onImport} disabled={importing}>
          {importing ? "Important…" : "+ Importa un manuscrit"}
        </button>
      </div>

      {error && (
        <div className="import-error" role="alert">
          <strong>No s’ha completat la importació</strong>
          <span>{error}</span>
        </div>
      )}

      {manuscripts.length === 0 ? (
        <div className="manuscript-empty">
          <strong>Encara no hi ha cap manuscrit importat</strong>
          <span>El document no s’enviarà a internet ni s’afegirà al repositori.</span>
        </div>
      ) : (
        <div className="manuscript-list">
          {manuscripts.map((manuscript) => (
            <article key={manuscript.id} className="manuscript-item">
              <div className="manuscript-filemark">
                {manuscript.kind === "docx"
                  ? "DOCX"
                  : manuscript.kind === "markdown"
                    ? "MD"
                    : "TXT"}
              </div>
              <div className="manuscript-copy">
                <strong>{manuscript.name}</strong>
                <span>
                  {formatNumber(manuscript.wordCount)} paraules ·{" "}
                  {formatNumber(manuscript.paragraphCount)} paràgrafs ·{" "}
                  {formatSourceSize(manuscript.size)}
                </span>
                <small>
                  Original SHA-256: {manuscript.originalSha256.slice(0, 12)}… ·
                  còpia de treball preparada
                </small>
              </div>
              <div className="manuscript-actions">
                <span className="status-chip live">Local</span>
                <button
                  className="quiet-button"
                  onClick={() => onDownloadOriginal(manuscript)}
                >
                  Baixa l’original
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const storageLevelCopy: Record<
  StorageHealthLevel,
  { label: string; chip: string }
> = {
  ok: { label: "Estable", chip: "status-chip live" },
  info: { label: "A vigilar", chip: "status-chip" },
  warning: { label: "Atenció", chip: "status-chip warn" },
  critical: { label: "Risc alt", chip: "status-chip danger" },
};

const riskActionLabel: Record<StorageRiskAction, string> = {
  persist: "Protegeix l’espai",
  backup: "Exporta una còpia",
  "free-space": "Gestiona projectes",
};

function formatBackupDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Cap còpia encara";
  return new Intl.DateTimeFormat("ca-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StorageHealth({
  report,
  state,
  onBackup,
  onPersist,
  onManageProjects,
  onRefresh,
}: {
  report: StorageHealthReport | null;
  state: "loading" | "ready" | "error";
  onBackup: () => void;
  onPersist: () => void;
  onManageProjects: () => void;
  onRefresh: () => void;
}) {
  function runAction(action: StorageRiskAction) {
    if (action === "persist") onPersist();
    else if (action === "backup") onBackup();
    else onManageProjects();
  }

  const level = report?.level ?? "ok";
  const levelCopy = storageLevelCopy[level];

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fonaments local-first</span>
          <h1>Salut de l’emmagatzematge</h1>
          <p>
            Comprova quant espai fa servir aquest dispositiu, si el navegador
            protegeix les dades i quan vas fer l’última còpia. Res no surt del
            navegador.
          </p>
        </div>
        <span className={levelCopy.chip}>{levelCopy.label}</span>
      </section>

      {state === "loading" ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>◎</span>
          </div>
          <h2>Comprovant l’espai local…</h2>
          <p>Llegim l’ús, la quota i la protecció que ofereix el navegador.</p>
        </section>
      ) : state === "error" || !report ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>!</span>
          </div>
          <h2>No s’ha pogut llegir l’estat de l’espai</h2>
          <p>Torna-ho a provar; les dades locals no s’han tocat.</p>
          <button className="primary-button" onClick={onRefresh}>
            Torna-ho a provar
          </button>
        </section>
      ) : (
        <>
          <section className="dashboard-grid storage-grid">
            <article className="stat-panel">
              <div className="panel-topline">
                <span className="eyebrow">Ús de l’espai</span>
                <span className="status-chip">
                  {report.supported
                    ? formatPercent(report.usageRatio)
                    : "No disponible"}
                </span>
              </div>
              {report.supported ? (
                <>
                  <div className="trace-score">
                    <strong>{formatBytes(report.usage)}</strong>
                    <span>
                      de {formatBytes(report.quota)} · {formatBytes(report.available)}{" "}
                      lliures
                    </span>
                  </div>
                  <div className="bar">
                    <span
                      style={{
                        width: `${Math.min(100, Math.round((report.usageRatio ?? 0) * 100))}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="storage-note">
                  Aquest navegador no informa de l’ús ni de la quota. Fes còpies
                  periòdiques com a protecció.
                </p>
              )}
            </article>

            <article className="stat-panel">
              <div className="panel-topline">
                <span className="eyebrow">Persistència</span>
                <span
                  className={
                    report.persisted ? "status-chip live" : "status-chip"
                  }
                >
                  {report.persisted === true
                    ? "Concedida"
                    : report.persisted === false
                      ? "No concedida"
                      : "Desconeguda"}
                </span>
              </div>
              <p className="storage-note">
                {report.persisted === true
                  ? "El navegador conserva les dades i no les esborrarà per alliberar espai."
                  : "Sense persistència, el navegador pot esborrar les dades sota pressió de disc."}
              </p>
              {report.persisted !== true && (
                <button className="text-button" onClick={onPersist}>
                  Protegeix l’espai →
                </button>
              )}
            </article>

            <article className="stat-panel">
              <div className="panel-topline">
                <span className="eyebrow">Última còpia</span>
                <span className="status-chip">
                  {formatRelativeAge(report.backupAgeMs)}
                </span>
              </div>
              <div className="trace-score">
                <strong>
                  {report.lastBackupAt
                    ? formatBackupDate(report.lastBackupAt)
                    : "Cap còpia encara"}
                </strong>
                <span>
                  {report.lastBackupAt
                    ? "còpia portàtil verificada"
                    : "exporta una còpia per poder recuperar les dades"}
                </span>
              </div>
              <button className="text-button" onClick={onBackup}>
                Exporta una còpia ara →
              </button>
            </article>
          </section>

          <section className="stat-panel storage-risks">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Avisos de risc</span>
                <h2>
                  {report.risks.length === 0
                    ? "Cap risc detectat"
                    : `${report.risks.length} ${report.risks.length === 1 ? "avís" : "avisos"}`}
                </h2>
              </div>
              <button className="quiet-button" onClick={onRefresh}>
                Actualitza
              </button>
            </div>
            {report.risks.length === 0 ? (
              <p className="storage-note">
                L’espai és estable, està protegit i tens una còpia recent.
              </p>
            ) : (
              <ul className="risk-list">
                {report.risks.map((risk) => {
                  const action = risk.action;
                  return (
                    <li key={risk.id} className={`risk risk-${risk.level}`}>
                      <div>
                        <strong>{risk.title}</strong>
                        <small>{risk.detail}</small>
                      </div>
                      {action && (
                        <button
                          className="quiet-button"
                          onClick={() => runAction(action)}
                        >
                          {riskActionLabel[action]}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function PrivacyFirewallView({
  offline,
  log,
  onToggleOffline,
  onClearLog,
}: {
  offline: boolean;
  log: FirewallLogEntry[];
  onToggleOffline: () => void;
  onClearLog: () => void;
}) {
  const blocked = log.filter((entry) => !entry.allowed).length;

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fonaments local-first</span>
          <h1>Tallafoc de privacitat</h1>
          <p>
            Cap manuscrit, font ni anotació s’envia a serveis externs. La
            política de seguretat del navegador i el tallafoc bloquegen les
            connexions de la webapp que no hagis autoritzat.
          </p>
        </div>
        <span className={offline ? "status-chip live" : "status-chip"}>
          {offline ? "Sense xarxa" : "Vigilant"}
        </span>
      </section>

      <section className="dashboard-grid privacy-grid">
        <article className="stat-panel">
          <div className="panel-topline">
            <span className="eyebrow">Mode sense xarxa</span>
            <span className={offline ? "status-chip live" : "status-chip"}>
              {offline ? "Actiu" : "Inactiu"}
            </span>
          </div>
          <p className="storage-note">
            Amb el mode sense xarxa, el guard de l’aplicació rebutja també els
            hosts que s’haguessin autoritzat. La política del navegador continua
            limitant la resta de canals al mateix origen.
          </p>
          <button
            className="primary-button privacy-toggle"
            aria-pressed={offline}
            onClick={onToggleOffline}
          >
            {offline
              ? "Desactiva el mode sense xarxa"
              : "Activa el mode sense xarxa"}
          </button>
        </article>

        <article className="stat-panel">
          <div className="panel-topline">
            <span className="eyebrow">Consentiment previ</span>
            <span className="status-chip">Per defecte: cap</span>
          </div>
          <p className="storage-note">
            El flux principal funciona sense cap API i cap host extern està
            autoritzat. Una integració futura haurà de declarar la destinació,
            explicar quines dades envia i obtenir el teu consentiment.
          </p>
        </article>
      </section>

      <section className="stat-panel privacy-inventory">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Inventari de peticions de xarxa</span>
            <h2>Només el mateix origen</h2>
          </div>
          <span className="status-chip live">Sense dades de recerca</span>
        </div>
        <ul className="inventory-list">
          {NETWORK_INVENTORY.map((entry) => (
            <li key={entry.id} className="inventory-item">
              <div>
                <strong>{entry.label}</strong>
                <small>{entry.detail}</small>
              </div>
              <div className="inventory-tags">
                <span className="status-chip live">
                  {entry.destination === "local" ? "Local" : "Extern"}
                </span>
                <span className="status-chip">
                  {entry.carriesUserData ? "Amb dades" : "Sense dades"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="stat-panel privacy-log">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Registre de peticions externes</span>
            <h2>
              {log.length === 0
                ? "Cap intent registrat"
                : `${blocked} bloquejades de ${log.length}`}
            </h2>
          </div>
          {log.length > 0 && (
            <button className="quiet-button" onClick={onClearLog}>
              Neteja el registre
            </button>
          )}
        </div>
        {log.length === 0 ? (
          <p className="storage-note">
            El guard de fetch no ha detectat cap intent extern. La política CSP
            del navegador manté bloquejats els altres canals de la webapp.
          </p>
        ) : (
          <ul className="risk-list">
            {log.map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                className={`risk risk-${entry.allowed ? "info" : "critical"}`}
              >
                <div>
                  <strong>{entry.host ?? entry.url}</strong>
                  <small>{entry.reason}</small>
                </div>
                <span
                  className={entry.allowed ? "status-chip" : "status-chip danger"}
                >
                  {entry.allowed ? "Permesa" : "Bloquejada"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatSourceDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium" }).format(date);
}

function SourcesLibrary({
  sources,
  errors,
  storedSize,
  onPick,
  onImport,
  onDelete,
  onDownload,
  onEditCitation,
  onExtractText,
  onOpenPdf,
  onDismissErrors,
}: {
  sources: SourceRecord[];
  errors: string[];
  storedSize: number;
  onPick: () => void;
  onImport: (files: FileList | File[]) => void;
  onDelete: (id: string) => void;
  onDownload: (source: SourceRecord) => void;
  onEditCitation: (source: SourceRecord) => void;
  onExtractText: (source: SourceRecord) => void;
  onOpenPdf: (source: SourceRecord) => void;
  onDismissErrors: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Biblioteca local</span>
          <h1>Fonts documentals</h1>
          <p>
            Importa PDF, DOCX, TXT, Markdown i imatges. Es valida el tipus i la
            mida i es registren en aquest projecte; el contingut es desarà al
            dispositiu a la funció següent.
          </p>
        </div>
        <span className="status-chip live">
          {sources.length} {sources.length === 1 ? "font" : "fonts"}
        </span>
      </section>

      <section
        className={dragging ? "dropzone dragging" : "dropzone"}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) onImport(event.dataTransfer.files);
        }}
      >
        <span className="dropzone-icon">↑</span>
        <strong>Arrossega els fitxers aquí</strong>
        <p>o selecciona’ls des del dispositiu. Màxim 25 MB per fitxer.</p>
        <button className="primary-button" onClick={onPick}>
          Selecciona fitxers
        </button>
        <small>PDF · DOCX · TXT · Markdown · imatges</small>
      </section>

      {errors.length > 0 && (
        <section className="stat-panel source-errors">
          <div className="section-heading">
            <div>
              <span className="eyebrow">No s’han pogut importar</span>
              <h2>
                {errors.length} {errors.length === 1 ? "fitxer" : "fitxers"}
              </h2>
            </div>
            <button className="quiet-button" onClick={onDismissErrors}>
              Descarta
            </button>
          </div>
          <ul className="risk-list">
            {errors.map((message, index) => (
              <li key={index} className="risk risk-critical">
                <div>
                  <small>{message}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stat-panel source-list-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Fonts d’aquest projecte</span>
            <h2>
              {sources.length === 0
                ? "Cap font encara"
                : `${sources.length} ${sources.length === 1 ? "font registrada" : "fonts registrades"}`}
            </h2>
          </div>
          {storedSize > 0 && (
            <span className="status-chip live">
              {formatSourceSize(storedSize)} al dispositiu
            </span>
          )}
        </div>
        {sources.length === 0 ? (
          <p className="storage-note">
            Encara no has importat cap font. Comença arrossegant un document o una
            imatge.
          </p>
        ) : (
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.id} className="source-item">
                <span className="source-kind">{sourceKindLabel(source.kind)}</span>
                <div className="source-meta">
                  <strong>{source.name}</strong>
                  <small>
                    {formatSourceSize(source.size)} · {formatSourceDate(source.importedAt)}
                    {source.citation?.citekey ? ` · ${source.citation.citekey}` : ""}
                  </small>
                </div>
                <div className="source-actions">
                  {source.kind === "pdf" && (
                    <button
                      className="quiet-button"
                      onClick={() => onOpenPdf(source)}
                    >
                      Visor
                    </button>
                  )}
                  {isExtractableKind(source.kind) && (
                    <button
                      className="quiet-button"
                      onClick={() => onExtractText(source)}
                    >
                      Text
                    </button>
                  )}
                  <button
                    className="quiet-button"
                    onClick={() => onEditCitation(source)}
                  >
                    {source.citation ? "Fitxa" : "+ Fitxa"}
                  </button>
                  <button className="quiet-button" onClick={() => onDownload(source)}>
                    Baixa
                  </button>
                  <button
                    className="quiet-button danger-text"
                    onClick={() => onDelete(source.id)}
                  >
                    Elimina
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ExtractsLibrary({
  notes,
  sources,
  filter,
  draft,
  onFilter,
  onNew,
  onEdit,
  onDelete,
  onOpenSource,
  onPromoteToEvidence,
  onDraftChange,
  onSave,
  onCancel,
}: {
  notes: CitableNote[];
  sources: SourceRecord[];
  filter: { query: string; sourceId: string };
  draft: NoteDraft | null;
  onFilter: (filter: { query: string; sourceId: string }) => void;
  onNew: () => void;
  onEdit: (note: CitableNote) => void;
  onDelete: (id: string) => void;
  onOpenSource: (note: CitableNote) => void;
  onPromoteToEvidence: (note: CitableNote) => void;
  onDraftChange: (patch: Partial<NoteDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const visible = filterNotes(notes, {
    query: filter.query,
    sourceId: filter.sourceId || undefined,
  });
  const canSave = Boolean(
    draft &&
      draft.sourceId &&
      (draft.quote.trim() || draft.paraphrase.trim() || draft.comment.trim()),
  );
  const draftSource = draft ? sourceById.get(draft.sourceId) : undefined;

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Taller de fonts</span>
          <h1>Extractes citables</h1>
          <p>
            Separa sempre tres registres: la <strong>cita</strong> textual de la
            font, la teva <strong>paràfrasi</strong> i el teu <strong>comentari</strong>.
            Cada extracte queda ancorat a la font i la pàgina perquè tota
            afirmació del llibre es pugui resseguir fins a l’origen.
          </p>
        </div>
        <span className="status-chip live">
          {notes.length} {notes.length === 1 ? "extracte" : "extractes"}
        </span>
      </section>

      {sources.length === 0 ? (
        <section className="stat-panel">
          <p className="storage-note">
            Encara no hi ha fonts en aquest projecte. Importa un document a
            «Fonts» abans de crear extractes.
          </p>
        </section>
      ) : (
        <section className="stat-panel extract-toolbar">
          <input
            className="extract-search"
            value={filter.query}
            placeholder="Cerca dins els extractes…"
            onChange={(event) => onFilter({ ...filter, query: event.target.value })}
          />
          <select
            className="extract-select"
            value={filter.sourceId}
            onChange={(event) => onFilter({ ...filter, sourceId: event.target.value })}
          >
            <option value="">Totes les fonts</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
          <button className="primary-button" onClick={onNew}>
            + Nou extracte
          </button>
        </section>
      )}

      {draft && (
        <section className="stat-panel extract-editor">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {draft.id ? "Edita l’extracte" : "Nou extracte"}
              </span>
              <h2>{draftSource?.name ?? "Tria una font"}</h2>
            </div>
            {draft.referenceId && (
              <span className="status-chip live">Ancorat al PDF</span>
            )}
          </div>

          <div className="extract-fields">
            <label className="extract-field">
              <span>Font</span>
              <select
                value={draft.sourceId}
                onChange={(event) => onDraftChange({ sourceId: event.target.value })}
              >
                <option value="">— Tria una font —</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="extract-field extract-field-page">
              <span>Pàgina</span>
              <input
                type="number"
                min={1}
                value={draft.page ?? ""}
                onChange={(event) =>
                  onDraftChange({
                    page: event.target.value
                      ? Number.parseInt(event.target.value, 10)
                      : null,
                  })
                }
              />
            </label>
          </div>

          <label className="extract-field">
            <span>Cita textual</span>
            <textarea
              rows={3}
              value={draft.quote}
              placeholder="Les paraules exactes de la font, entre cometes."
              onChange={(event) => onDraftChange({ quote: event.target.value })}
            />
          </label>
          <label className="extract-field">
            <span>Paràfrasi</span>
            <textarea
              rows={3}
              value={draft.paraphrase}
              placeholder="El mateix contingut amb les teves paraules, sense valorar."
              onChange={(event) => onDraftChange({ paraphrase: event.target.value })}
            />
          </label>
          <label className="extract-field">
            <span>Comentari propi</span>
            <textarea
              rows={3}
              value={draft.comment}
              placeholder="La teva anàlisi, el pes com a evidència o els dubtes."
              onChange={(event) => onDraftChange({ comment: event.target.value })}
            />
          </label>
          <label className="extract-field">
            <span>Etiquetes</span>
            <input
              value={draft.tags}
              placeholder="separades per comes"
              onChange={(event) => onDraftChange({ tags: event.target.value })}
            />
          </label>

          <div className="modal-actions">
            <button className="quiet-button" onClick={onCancel}>
              Cancel·la
            </button>
            <button className="primary-button" disabled={!canSave} onClick={onSave}>
              Desa l’extracte
            </button>
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className="stat-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Extractes d’aquest projecte</span>
              <h2>
                {visible.length === 0
                  ? "Cap extracte"
                  : `${visible.length} ${visible.length === 1 ? "extracte" : "extractes"}`}
              </h2>
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="storage-note">
              Encara no hi ha extractes{filter.query || filter.sourceId ? " amb aquest filtre" : ""}.
              Crea’n un de nou o promou una referència des del visor PDF.
            </p>
          ) : (
            <ul className="extract-list">
              {visible.map((note) => {
                const source = sourceById.get(note.sourceId);
                const citation = formatNoteCitation(note, source?.citation?.citekey);
                return (
                  <li key={note.id} className="extract-item">
                    <div className="extract-head">
                      <span className="extract-cite">{citation}</span>
                      <span className="extract-source">
                        {source?.name ?? "Font eliminada"}
                      </span>
                    </div>
                    {note.quote && (
                      <div className="extract-register extract-quote">
                        <small>Cita</small>
                        <blockquote>{note.quote}</blockquote>
                      </div>
                    )}
                    {note.paraphrase && (
                      <div className="extract-register">
                        <small>Paràfrasi</small>
                        <p>{note.paraphrase}</p>
                      </div>
                    )}
                    {note.comment && (
                      <div className="extract-register">
                        <small>Comentari</small>
                        <p>{note.comment}</p>
                      </div>
                    )}
                    {note.tags.length > 0 && (
                      <div className="extract-tags">
                        {note.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="extract-actions">
                      {source?.kind === "pdf" && (
                        <button className="quiet-button" onClick={() => onOpenSource(note)}>
                          Obre la font
                        </button>
                      )}
                      <button className="quiet-button" onClick={() => onPromoteToEvidence(note)}>
                        → Evidència
                      </button>
                      <button className="quiet-button" onClick={() => onEdit(note)}>
                        Edita
                      </button>
                      <button
                        className="quiet-button danger-text"
                        onClick={() => onDelete(note.id)}
                      >
                        Esborra
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function HypothesesEditor({
  hypotheses,
  onSeed,
  onEdit,
  onDelete,
}: {
  hypotheses: Hypothesis[];
  onSeed: () => void;
  onEdit: (hypothesis: Hypothesis) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fase 1 · Validació ACH</span>
          <h1>Hipòtesis en competència</h1>
          <p>
            Ordre obligatori i immutable: <strong>H1 = Consens</strong>,{" "}
            <strong>H2 = Ombra</strong> i <strong>H3 = Nova teoria</strong>. El
            consens i l’ombra s’han de formular amb Red Teaming (font
            independent); jutja’ls totes amb el mateix estàndard.
          </p>
        </div>
        <span className="status-chip">
          {hypotheses.length} {hypotheses.length === 1 ? "hipòtesi" : "hipòtesis"}
        </span>
      </section>

      {hypotheses.length === 0 ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>H</span>
          </div>
          <h2>Encara no hi ha hipòtesis</h2>
          <p>
            Crea el joc inicial H1/H2/H3 i defineix cadascuna amb enunciat,
            prediccions, supòsits, condicions d’abandonament i nucli no
            negociable.
          </p>
          <button className="primary-button" onClick={onSeed}>
            Crea el joc H1 · H2 · H3
          </button>
        </section>
      ) : (
        <section className="hyp-list">
          {hypotheses.map((hypothesis) => {
            const info = roleInfo(hypothesis.role);
            return (
              <article key={hypothesis.id} className={`hyp-card hyp-${hypothesis.role}`}>
                <div className="hyp-card-head">
                  <span className="hyp-code">{hypothesis.code}</span>
                  <div className="hyp-title">
                    <strong>{hypothesis.title || info.label}</strong>
                    <small>{info.label}</small>
                  </div>
                  <span className="status-chip">
                    {reviewStateLabel(hypothesis.reviewState)}
                  </span>
                </div>
                <p className="hyp-statement">
                  {hypothesis.statement || "Sense enunciat encara."}
                </p>
                {requiresRedTeaming(hypothesis.role) && (
                  <p className="redteam-note">
                    Red Teaming:{" "}
                    {hypothesis.source
                      ? `formulada per ${hypothesis.source}`
                      : "cal indicar la font independent de la formulació."}
                  </p>
                )}
                <div className="hyp-actions">
                  <button className="quiet-button" onClick={() => onEdit(hypothesis)}>
                    Edita
                  </button>
                  <button
                    className="quiet-button danger-text"
                    onClick={() => onDelete(hypothesis.id)}
                  >
                    Elimina
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function EvidenceRegistry({
  evidence,
  sources,
  notes,
  draft,
  affirmations,
  links,
  onNew,
  onEdit,
  onDelete,
  onDraftChange,
  onSave,
  onCancel,
  onOpenAffirmations,
}: {
  evidence: EvidenceRecord[];
  sources: SourceRecord[];
  notes: CitableNote[];
  draft: EvidenceDraft | null;
  affirmations: Affirmation[];
  links: AidEidLink[];
  onNew: () => void;
  onEdit: (record: EvidenceRecord) => void;
  onDelete: (id: string) => void;
  onDraftChange: (patch: Partial<EvidenceDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
  onOpenAffirmations: () => void;
}) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const affirmationById = new Map(
    affirmations.map((item) => [item.id, item]),
  );
  const canSave = Boolean(draft && draft.description.trim());
  // Els extractes triables són els de la font seleccionada.
  const draftNotes = draft
    ? notes.filter((note) => note.sourceId === draft.sourceId)
    : [];

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fase 2 · Validació ACH</span>
          <h1>Registre d’evidències</h1>
          <p>
            Cada evidència es registra amb una <strong>descripció neutral</strong>
            —el fet, no la interpretació— i queda ancorada a la font, la pàgina i
            l’extracte citable. El seu codi <strong>EID</strong> (E1, E2…)
            encapçalarà les files de la matriu ACH.
          </p>
        </div>
        <span className="status-chip live">
          {evidence.length} {evidence.length === 1 ? "evidència" : "evidències"}
        </span>
      </section>

      <section className="stat-panel extract-toolbar">
        <button className="primary-button" onClick={onNew}>
          + Nova evidència
        </button>
      </section>

      {draft && (
        <section className="stat-panel extract-editor">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {draft.id ? "Edita l’evidència" : "Nova evidència"}
              </span>
              <h2>{draft.code}</h2>
            </div>
            {draft.noteId && (
              <span className="status-chip live">Des d’un extracte</span>
            )}
          </div>

          <label className="extract-field">
            <span>Descripció neutral (el fet, sense interpretar)</span>
            <textarea
              rows={3}
              value={draft.description}
              placeholder="Què diu la font, en termes neutrals i verificables."
              onChange={(event) => onDraftChange({ description: event.target.value })}
            />
          </label>

          <div className="extract-fields">
            <label className="extract-field">
              <span>Font</span>
              <select
                value={draft.sourceId}
                onChange={(event) =>
                  onDraftChange({ sourceId: event.target.value, noteId: "" })
                }
              >
                <option value="">— Sense font —</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="extract-field extract-field-page">
              <span>Pàgina</span>
              <input
                type="number"
                min={1}
                value={draft.page ?? ""}
                onChange={(event) =>
                  onDraftChange({
                    page: event.target.value
                      ? Number.parseInt(event.target.value, 10)
                      : null,
                  })
                }
              />
            </label>
          </div>

          <div className="extract-fields">
            <label className="extract-field">
              <span>Extracte citable</span>
              <select
                value={draft.noteId}
                disabled={!draft.sourceId}
                onChange={(event) => onDraftChange({ noteId: event.target.value })}
              >
                <option value="">
                  {draft.sourceId ? "— Cap extracte —" : "Tria una font primer"}
                </option>
                {draftNotes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {(note.quote || note.paraphrase || "extracte").slice(0, 50)}
                  </option>
                ))}
              </select>
            </label>
            <label className="extract-field">
              <span>Qualitat</span>
              <select
                value={draft.quality}
                onChange={(event) =>
                  onDraftChange({ quality: event.target.value as EvidenceQuality })
                }
              >
                {EVIDENCE_QUALITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="extract-field">
            <span>Família de dependència</span>
            <input
              value={draft.family}
              placeholder="Agrupa evidències que no són independents (p. ex. «albarans-visconti»)"
              onChange={(event) => onDraftChange({ family: event.target.value })}
            />
          </label>

          <div className="modal-actions">
            <button className="quiet-button" onClick={onCancel}>
              Cancel·la
            </button>
            <button className="primary-button" disabled={!canSave} onClick={onSave}>
              Desa l’evidència
            </button>
          </div>
        </section>
      )}

      {evidence.length === 0 ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>E</span>
          </div>
          <h2>Encara no hi ha evidències</h2>
          <p>
            Registra la primera evidència amb una descripció neutral, o promou-la
            des d’un extracte citable amb «→ Evidència».
          </p>
        </section>
      ) : (
        <section className="stat-panel">
          <ul className="evidence-list">
            {evidence.map((item) => {
              const source = item.sourceId
                ? sourceById.get(item.sourceId)
                : undefined;
              return (
                <li key={item.id} className="evidence-item">
                  <div className="evidence-head">
                    <span className="evidence-code">{item.code}</span>
                    <span className={`evidence-quality q-${item.quality}`}>
                      {qualityInfo(item.quality).label}
                    </span>
                    {item.family && (
                      <span className="evidence-family">{item.family}</span>
                    )}
                  </div>
                  <p className="evidence-desc">{item.description}</p>
                  {(() => {
                    const incoming = linksForEvidence(links, item.id);
                    if (incoming.length === 0) return null;
                    return (
                      <div className="aid-links">
                        <div className="aid-links-head">
                          <small>Afirmacions que hi depenen ({incoming.length})</small>
                        </div>
                        <ul className="aid-link-list">
                          {incoming.map((link) => {
                            const aff = affirmationById.get(link.affirmationId);
                            return (
                              <li key={link.id} className="aid-link-chip">
                                <span className={`aid-stance s-${link.stance}`}>
                                  {stanceInfo(link.stance).label}
                                </span>
                                <button
                                  className="aid-link-open"
                                  onClick={onOpenAffirmations}
                                  title="Ves a Afirmacions"
                                >
                                  {aff ? aff.code : "AID"}
                                </button>
                                <span className="aid-link-text">
                                  {aff ? aff.text.slice(0, 60) : "(afirmació eliminada)"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}
                  <div className="evidence-meta">
                    <small>
                      {source ? source.name : "Sense font"}
                      {item.page ? ` · p. ${item.page}` : ""}
                      {item.noteId ? " · extracte enllaçat" : ""}
                    </small>
                    <div className="extract-actions">
                      <button className="quiet-button" onClick={() => onEdit(item)}>
                        Edita
                      </button>
                      <button
                        className="quiet-button danger-text"
                        onClick={() => onDelete(item.id)}
                      >
                        Esborra
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function AffirmationsRegistry({
  affirmations,
  draft,
  evidence,
  links,
  onNew,
  onEdit,
  onDelete,
  onDraftChange,
  onSave,
  onCancel,
  onLink,
  onUnlink,
  onOpenEvidence,
}: {
  affirmations: Affirmation[];
  draft: AffirmationDraft | null;
  evidence: EvidenceRecord[];
  links: AidEidLink[];
  onNew: () => void;
  onEdit: (record: Affirmation) => void;
  onDelete: (id: string) => void;
  onDraftChange: (patch: Partial<AffirmationDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
  onLink: (
    affirmationId: string,
    evidenceId: string,
    stance: EvidenceStance,
    derivation: DerivationType,
  ) => void;
  onUnlink: (id: string) => void;
  onOpenEvidence: () => void;
}) {
  const canSave = Boolean(draft && draft.text.trim());
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fase 3 · Validació ACH</span>
          <h1>Registre d’afirmacions</h1>
          <p>
            Cada afirmació factual de l’obra rep un codi <strong>AID</strong> i es
            classifica per la <strong>bifurcació de la certesa</strong>:
            <strong> incondicional</strong> (fet mecànic verificable) o
            <strong> condicional</strong> (atribució a autor, tradició o context).
            El <strong>grau d’assertivitat</strong> —escala de cinc nivells— s’ha de
            marcar de manera homogènia i coherent amb l’evidència.
          </p>
        </div>
        <span className="status-chip live">
          {affirmations.length}{" "}
          {affirmations.length === 1 ? "afirmació" : "afirmacions"}
        </span>
      </section>

      <section className="stat-panel extract-toolbar">
        <button className="primary-button" onClick={onNew}>
          + Nova afirmació
        </button>
      </section>

      {draft && (
        <section className="stat-panel extract-editor">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {draft.id ? "Edita l’afirmació" : "Nova afirmació"}
              </span>
              <h2>{draft.code}</h2>
            </div>
          </div>

          {requiresDiagnosticEvidence(draft.type) && (
            <p className="redteam-note">
              Afirmació condicional (atributiva): exigeix evidència documental
              diagnòstica. Si no en té, reporta-la com a oberta o provisional i no
              en pugis l’assertivitat.
            </p>
          )}

          <label className="extract-field">
            <span>Text exacte de l’afirmació</span>
            <textarea
              rows={3}
              value={draft.text}
              placeholder="La frase tal com apareixerà a l’obra."
              onChange={(event) => onDraftChange({ text: event.target.value })}
            />
          </label>

          <div className="extract-fields">
            <label className="extract-field">
              <span>Tipus (bifurcació de la certesa)</span>
              <select
                value={draft.type}
                onChange={(event) =>
                  onDraftChange({ type: event.target.value as AffirmationType })
                }
              >
                {AFFIRMATION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="extract-field extract-field-page">
              <span>Capítol</span>
              <input
                value={draft.chapter}
                placeholder="p. ex. 1"
                onChange={(event) => onDraftChange({ chapter: event.target.value })}
              />
            </label>
          </div>

          <p className="field-hint">{affirmationTypeInfo(draft.type).hint}</p>

          <div className="extract-fields">
            <label className="extract-field">
              <span>Grau d’assertivitat</span>
              <select
                value={draft.assertiveness}
                onChange={(event) =>
                  onDraftChange({
                    assertiveness: event.target.value as Assertiveness,
                  })
                }
              >
                {ASSERTIVENESS_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="extract-field">
              <span>Estat</span>
              <select
                value={draft.reviewState}
                onChange={(event) =>
                  onDraftChange({
                    reviewState: event.target.value as AffirmationReviewState,
                  })
                }
              >
                {AFFIRMATION_REVIEW_STATES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button className="quiet-button" onClick={onCancel}>
              Cancel·la
            </button>
            <button className="primary-button" disabled={!canSave} onClick={onSave}>
              Desa l’afirmació
            </button>
          </div>
        </section>
      )}

      {affirmations.length === 0 ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>A</span>
          </div>
          <h2>Encara no hi ha afirmacions</h2>
          <p>
            Registra la primera afirmació factual amb el seu text exacte, tipus i
            grau d’assertivitat. Després l’enllaçaràs amb les evidències.
          </p>
        </section>
      ) : (
        <section className="stat-panel">
          <ul className="affirmation-list">
            {affirmations.map((item) => (
              <li key={item.id} className="affirmation-item">
                <div className="affirmation-head">
                  <span className="aff-code">{item.code}</span>
                  <span className={`aff-assertiveness a-${item.assertiveness}`}>
                    {assertivenessInfo(item.assertiveness).label}
                  </span>
                  <span className={`aff-type t-${item.type}`}>
                    {affirmationTypeInfo(item.type).label}
                  </span>
                  {item.chapter && (
                    <span className="aff-chapter">Cap. {item.chapter}</span>
                  )}
                </div>
                <p className="aff-text">{item.text}</p>
                <AffirmationLinkPanel
                  affirmationId={item.id}
                  links={linksForAffirmation(links, item.id)}
                  evidence={evidence}
                  evidenceById={evidenceById}
                  onLink={onLink}
                  onUnlink={onUnlink}
                  onOpenEvidence={onOpenEvidence}
                />
                <div className="evidence-meta">
                  <small>{affirmationStateLabel(item.reviewState)}</small>
                  <div className="extract-actions">
                    <button className="quiet-button" onClick={() => onEdit(item)}>
                      Edita
                    </button>
                    <button
                      className="quiet-button danger-text"
                      onClick={() => onDelete(item.id)}
                    >
                      Esborra
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AffirmationLinkPanel({
  affirmationId,
  links,
  evidence,
  evidenceById,
  onLink,
  onUnlink,
  onOpenEvidence,
}: {
  affirmationId: string;
  links: AidEidLink[];
  evidence: EvidenceRecord[];
  evidenceById: Map<string, EvidenceRecord>;
  onLink: (
    affirmationId: string,
    evidenceId: string,
    stance: EvidenceStance,
    derivation: DerivationType,
  ) => void;
  onUnlink: (id: string) => void;
  onOpenEvidence: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [evidenceId, setEvidenceId] = useState("");
  const [stance, setStance] = useState<EvidenceStance>("favorable");
  const [derivation, setDerivation] = useState<DerivationType>("cita-literal");
  const summary = summarizeStances(links);
  // Evidències encara no vinculades a aquesta afirmació.
  const linkedIds = new Set(links.map((link) => link.evidenceId));
  const available = evidence.filter((item) => !linkedIds.has(item.id));

  function add() {
    if (!evidenceId) return;
    onLink(affirmationId, evidenceId, stance, derivation);
    setEvidenceId("");
    setStance("favorable");
    setDerivation("cita-literal");
    setAdding(false);
  }

  return (
    <div className="aid-links">
      <div className="aid-links-head">
        <small>
          Evidències ({summary.total})
          {summary.total > 0 &&
            ` · ${summary.favorable} a favor · ${summary.contraria} en contra · ${summary.contextual} context`}
        </small>
        {evidence.length === 0 ? (
          <button className="text-button" onClick={onOpenEvidence}>
            Registra evidències →
          </button>
        ) : (
          <button className="text-button" onClick={() => setAdding((value) => !value)}>
            {adding ? "Tanca" : "+ Vincula evidència"}
          </button>
        )}
      </div>

      {adding && available.length > 0 && (
        <div className="aid-link-form">
          <select value={evidenceId} onChange={(event) => setEvidenceId(event.target.value)}>
            <option value="">— Tria una evidència —</option>
            {available.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} · {item.description.slice(0, 40)}
              </option>
            ))}
          </select>
          <select value={stance} onChange={(event) => setStance(event.target.value as EvidenceStance)}>
            {EVIDENCE_STANCES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={derivation} onChange={(event) => setDerivation(event.target.value as DerivationType)}>
            {DERIVATION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="quiet-button" disabled={!evidenceId} onClick={add}>
            Afegeix
          </button>
        </div>
      )}
      {adding && available.length === 0 && (
        <p className="field-hint">Totes les evidències registrades ja hi estan vinculades.</p>
      )}

      {links.length > 0 && (
        <ul className="aid-link-list">
          {links.map((link) => {
            const target = evidenceById.get(link.evidenceId);
            return (
              <li key={link.id} className="aid-link-chip">
                <span className={`aid-stance s-${link.stance}`}>
                  {stanceInfo(link.stance).label}
                </span>
                <button className="aid-link-open" onClick={onOpenEvidence} title="Ves a Evidències">
                  {target ? target.code : "EID"}
                </button>
                <span className="aid-link-text">
                  {target ? target.description.slice(0, 60) : "(evidència eliminada)"}
                  <em> · {derivationLabel(link.derivation)}</em>
                </span>
                <button className="aid-link-del danger-text" onClick={() => onUnlink(link.id)} title="Desvincula">
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MatrixView({
  evidence,
  hypotheses,
  cells,
  draft,
  onOpenCell,
  onCellDraftChange,
  onSaveCell,
  onCancelCell,
  onExportCsv,
  onOpenEvidence,
  onOpenHypotheses,
}: {
  evidence: EvidenceRecord[];
  hypotheses: Hypothesis[];
  cells: MatrixCell[];
  draft: CellDraft | null;
  onOpenCell: (evidenceId: string, hypothesisId: string) => void;
  onCellDraftChange: (patch: Partial<CellDraft>) => void;
  onSaveCell: () => void;
  onCancelCell: () => void;
  onExportCsv: () => void;
  onOpenEvidence: () => void;
  onOpenHypotheses: () => void;
}) {
  const [onlyDiagnostic, setOnlyDiagnostic] = useState(false);
  const hypothesisIds = hypotheses.map((item) => item.id);
  const rows = buildMatrix(
    cells,
    evidence.map((item) => item.id),
    hypothesisIds,
  );
  const scores = scoreHypotheses(cells, hypothesisIds);
  const leastRefuted = new Set(leastRefutedHypotheses(scores));
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const scoreById = new Map(scores.map((score) => [score.hypothesisId, score]));
  const visibleRows = onlyDiagnostic
    ? rows.filter((row) => row.diagnosticity === "diagnostica")
    : rows;
  const diagnosticCount = rows.filter((row) => row.diagnosticity === "diagnostica").length;

  const canSaveCell = Boolean(
    draft && (draft.value === "N" || draft.comment.trim()),
  );
  const draftEvidence = draft ? evidenceById.get(draft.evidenceId) : undefined;
  const draftHypothesis = draft
    ? hypotheses.find((item) => item.id === draft.hypothesisId)
    : undefined;

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fase 3 · Validació ACH</span>
          <h1>Matriu ACH</h1>
          <p>
            Cada evidència es creua amb cada hipòtesi i es marca <strong>C</strong>
            (consistent), <strong>I</strong> (inconsistent) o <strong>N</strong>
            (neutral), amb comentari obligatori per a C i I. L’evidència
            <strong> diagnòstica</strong> és la que discrimina entre hipòtesis; la
            hipòtesi més sòlida és la que acumula <strong>menys inconsistències</strong>,
            no la que té més suport.
          </p>
        </div>
        <span className="status-chip live">
          {diagnosticCount} diagnòstiques / {rows.length}
        </span>
      </section>

      {evidence.length === 0 || hypotheses.length === 0 ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>M</span>
          </div>
          <h2>Falta material per creuar</h2>
          <p>
            La matriu necessita, com a mínim, una hipòtesi i una evidència.
          </p>
          <div className="extract-actions">
            {hypotheses.length === 0 && (
              <button className="primary-button" onClick={onOpenHypotheses}>
                Ves a Hipòtesis
              </button>
            )}
            {evidence.length === 0 && (
              <button className="quiet-button" onClick={onOpenEvidence}>
                Ves a Evidències
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="stat-panel extract-toolbar">
            <label className="matrix-toggle">
              <input
                type="checkbox"
                checked={onlyDiagnostic}
                onChange={(event) => setOnlyDiagnostic(event.target.checked)}
              />
              Només diagnòstiques
            </label>
            <button className="quiet-button" onClick={onExportCsv}>
              Exporta CSV
            </button>
          </section>

          <section className="stat-panel matrix-panel">
            <div className="matrix-scroll">
              <table className="ach-matrix">
                <thead>
                  <tr>
                    <th className="matrix-corner">EID \ Hipòtesi</th>
                    {hypotheses.map((hypothesis) => (
                      <th key={hypothesis.id} title={hypothesis.title}>
                        {hypothesis.code}
                      </th>
                    ))}
                    <th>Diagnòstic</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const source = evidenceById.get(row.evidenceId);
                    return (
                      <tr key={row.evidenceId}>
                        <th scope="row" className="matrix-eid">
                          <span className="evidence-code">{source?.code ?? "EID"}</span>
                          <small>{source?.description.slice(0, 44)}</small>
                        </th>
                        {hypotheses.map((hypothesis) => {
                          const value = row.values[hypothesis.id];
                          return (
                            <td key={hypothesis.id}>
                              <button
                                className={`cell-btn cell-${value ?? "empty"}`}
                                onClick={() => onOpenCell(row.evidenceId, hypothesis.id)}
                                title={`${source?.code ?? "EID"} × ${hypothesis.code}`}
                              >
                                {value ?? "—"}
                              </button>
                            </td>
                          );
                        })}
                        <td>
                          <span className={`diag-badge d-${row.diagnosticity}`}>
                            {row.diagnosticity === "diagnostica"
                              ? "Diagnòstica"
                              : row.diagnosticity === "ornamental"
                                ? "Ornamental"
                                : "Incompleta"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" className="matrix-eid">
                      <span>Inconsistències (menys = més sòlida)</span>
                    </th>
                    {hypotheses.map((hypothesis) => {
                      const score = scoreById.get(hypothesis.id);
                      return (
                        <td key={hypothesis.id}>
                          <span
                            className={`score-badge${leastRefuted.has(hypothesis.id) ? " best" : ""}`}
                          >
                            {score?.inconsistencies ?? 0}
                          </span>
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      {draft && (
        <div className="modal-backdrop" role="presentation" onMouseDown={onCancelCell}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">
              {draftEvidence?.code ?? "EID"} × {draftHypothesis?.code ?? "H"}
            </span>
            <h2>Consistència</h2>
            <p className="field-hint">
              {draftHypothesis?.title || "Hipòtesi"} — {draftEvidence?.description.slice(0, 90)}
            </p>
            <div className="cell-values">
              {CONSISTENCY_VALUES.map((option) => (
                <button
                  key={option.value}
                  className={`cell-choice cell-${option.value}${draft.value === option.value ? " active" : ""}`}
                  onClick={() => onCellDraftChange({ value: option.value })}
                  title={option.hint}
                >
                  {option.value} · {option.label}
                </button>
              ))}
            </div>
            <label className="extract-field">
              <span>
                Comentari{draft.value === "N" ? " (opcional)" : " (obligatori)"}
              </span>
              <textarea
                rows={3}
                value={draft.comment}
                placeholder="Justifica per què és consistent o inconsistent."
                onChange={(event) => onCellDraftChange({ comment: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="quiet-button" onClick={onCancelCell}>
                Cancel·la
              </button>
              <button className="primary-button" disabled={!canSaveCell} onClick={onSaveCell}>
                Desa · {consistencyLabel(draft.value)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
