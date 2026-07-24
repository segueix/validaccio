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
  bookNodeRepository,
  chapterDraftRepository,
  chapterVersionRepository,
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
import {
  BOOK_NODE_STATUSES,
  type BookNode,
  bookNodeKindLabel,
  bookTree,
  detectBookStructure,
  moveBookNode,
  siblingsOf,
} from "../lib/book-structure";
import {
  type ChapterDraft,
  createChapterDraft,
  updateChapterDraft,
} from "../lib/chapter-editor";
import {
  type ChapterVersion,
  compareChapterTexts,
  createChapterVersion,
  prepareChapterRestoration,
  summarizeTextDiff,
} from "../lib/chapter-versions";
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

type ChapterSaveState =
  | "idle"
  | "loading"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

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
  const [bookNodes, setBookNodes] = useState<BookNode[]>([]);
  const [activeManuscriptId, setActiveManuscriptId] = useState("");
  const [bookNodeDraft, setBookNodeDraft] = useState<BookNode | null>(null);
  const [activeChapterId, setActiveChapterId] = useState("");
  const [chapterDraft, setChapterDraft] = useState<ChapterDraft | null>(null);
  const [chapterSaveState, setChapterSaveState] =
    useState<ChapterSaveState>("idle");
  const [chapterRecoveryNotice, setChapterRecoveryNotice] = useState("");
  const [chapterVersions, setChapterVersions] = useState<ChapterVersion[]>([]);
  const [selectedChapterVersionId, setSelectedChapterVersionId] = useState("");
  const [chapterVersionInput, setChapterVersionInput] = useState({
    label: "",
    author: "",
    note: "",
  });
  const [chapterVersionNotice, setChapterVersionNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceInput = useRef<HTMLInputElement>(null);
  const manuscriptInput = useRef<HTMLInputElement>(null);
  const firewallRef = useRef<PrivacyFirewall | null>(null);
  const chapterDraftRef = useRef<ChapterDraft | null>(null);
  const chapterSaveTimerRef = useRef<number | null>(null);

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

  function updateCitationDraft(patch: