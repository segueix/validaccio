import {
  requestResult,
  withStoresTransaction,
  withTransaction,
} from "./database.ts";
import {
  type DatabaseMetadata,
  normalizeProjectRecord,
  type ProjectRecord,
} from "./types.ts";
import { type SourceRecord } from "../source-library.ts";
import { type SourceBlobRecord } from "../source-blobs.ts";
import { type PdfReference } from "../pdf-references.ts";
import { type CitableNote, normalizeCitableNote } from "../citable-notes.ts";
import { type Hypothesis } from "../hypotheses.ts";
import { type EvidenceRecord, normalizeEvidence } from "../evidence.ts";
import { type Affirmation, normalizeAffirmation } from "../affirmations.ts";
import { type AidEidLink, normalizeLink } from "../aid-eid-links.ts";
import { type MatrixCell, normalizeCell } from "../ach-matrix.ts";
import {
  type ManuscriptOriginalRecord,
  type ManuscriptRecord,
} from "../manuscripts.ts";
import {
  type BookNode,
  normalizeBookNode,
} from "../book-structure.ts";
import {
  type ChapterDraft,
  normalizeChapterDraft,
} from "../chapter-editor.ts";
import {
  type ChapterVersion,
  normalizeChapterVersion,
} from "../chapter-versions.ts";

export class IndexedDbRepository<T extends { id: string }> {
  private readonly storeName: "projects";

  constructor(storeName: "projects") {
    this.storeName = storeName;
  }

  get(id: string): Promise<T | null> {
    return withTransaction(this.storeName, "readonly", async (store) => {
      const result = await requestResult(store.get(id));
      return (result as T | undefined) ?? null;
    });
  }

  getAll(): Promise<T[]> {
    return withTransaction(this.storeName, "readonly", async (store) => {
      return (await requestResult(store.getAll())) as T[];
    });
  }

  put(record: T): Promise<T> {
    return withTransaction(this.storeName, "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction(this.storeName, "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }

  count(): Promise<number> {
    return withTransaction(this.storeName, "readonly", (store) =>
      requestResult(store.count()),
    );
  }
}

class ProjectRepository extends IndexedDbRepository<ProjectRecord> {
  constructor() {
    super("projects");
  }

  override async get(id: string): Promise<ProjectRecord | null> {
    const project = await super.get(id);
    return project ? normalizeProjectRecord(project) : null;
  }

  override async getAll(): Promise<ProjectRecord[]> {
    const projects = (await super.getAll()).map((project) =>
      normalizeProjectRecord(project),
    );
    return projects.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  save(project: ProjectRecord): Promise<ProjectRecord> {
    return this.put(normalizeProjectRecord(project));
  }
}

class MetadataRepository {
  get(key: string): Promise<DatabaseMetadata | null> {
    return withTransaction("metadata", "readonly", async (store) => {
      const result = await requestResult(store.get(key));
      return (result as DatabaseMetadata | undefined) ?? null;
    });
  }

  set(key: string, value: unknown): Promise<DatabaseMetadata> {
    const record: DatabaseMetadata = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    return withTransaction("metadata", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }
}

class SourceRepository {
  add(record: SourceRecord): Promise<SourceRecord> {
    return withTransaction("sources", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  // Desa (crea o actualitza) una fitxa de font; s'usa per editar-ne la citació.
  save(record: SourceRecord): Promise<SourceRecord> {
    return this.add(record);
  }

  getAllForProject(projectId: string): Promise<SourceRecord[]> {
    return withTransaction("sources", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as SourceRecord[];
      return records.sort((left, right) =>
        right.importedAt.localeCompare(left.importedAt),
      );
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("sources", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }

  countForProject(projectId: string): Promise<number> {
    return withTransaction("sources", "readonly", (store) =>
      requestResult(store.index("projectId").count(projectId)),
    );
  }
}

class SourceBlobRepository {
  put(record: SourceBlobRecord): Promise<SourceBlobRecord> {
    return withTransaction("blobs", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  get(sourceId: string): Promise<SourceBlobRecord | null> {
    return withTransaction("blobs", "readonly", async (store) => {
      const result = await requestResult(store.get(sourceId));
      return (result as SourceBlobRecord | undefined) ?? null;
    });
  }

  delete(sourceId: string): Promise<void> {
    return withTransaction("blobs", "readwrite", async (store) => {
      await requestResult(store.delete(sourceId));
    });
  }

  totalSizeForProject(projectId: string): Promise<number> {
    return withTransaction("blobs", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as SourceBlobRecord[];
      return records.reduce((sum, record) => sum + (record.size ?? 0), 0);
    });
  }
}

class HypothesisRepository {
  save(record: Hypothesis): Promise<Hypothesis> {
    return withTransaction("hypotheses", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  getAllForProject(projectId: string): Promise<Hypothesis[]> {
    return withTransaction("hypotheses", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as Hypothesis[];
      return records.sort((left, right) => left.code.localeCompare(right.code));
    });
  }

  get(id: string): Promise<Hypothesis | null> {
    return withTransaction("hypotheses", "readonly", async (store) => {
      const result = await requestResult(store.get(id));
      return (result as Hypothesis | undefined) ?? null;
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("hypotheses", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }
}

class PdfReferenceRepository {
  save(record: PdfReference): Promise<PdfReference> {
    return withTransaction("references", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  getAllForSource(sourceId: string): Promise<PdfReference[]> {
    return withTransaction("references", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("sourceId").getAll(sourceId),
      )) as PdfReference[];
      return records.sort((left, right) => left.page - right.page);
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("references", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }
}

class CitableNoteRepository {
  save(record: CitableNote): Promise<CitableNote> {
    return withTransaction("notes", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  getAllForProject(projectId: string): Promise<CitableNote[]> {
    return withTransaction("notes", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as Record<string, unknown>[];
      return records
        .map((record) => normalizeCitableNote(record))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    });
  }

  getAllForSource(sourceId: string): Promise<CitableNote[]> {
    return withTransaction("notes", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("sourceId").getAll(sourceId),
      )) as Record<string, unknown>[];
      return records
        .map((record) => normalizeCitableNote(record))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("notes", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }

  // En esborrar una font s'esborren els seus extractes per no deixar cites òrfenes.
  deleteForSource(sourceId: string): Promise<void> {
    return withTransaction("notes", "readwrite", async (store) => {
      const keys = (await requestResult(
        store.index("sourceId").getAllKeys(sourceId),
      )) as IDBValidKey[];
      await Promise.all(keys.map((key) => requestResult(store.delete(key))));
    });
  }
}

class EvidenceRepository {
  save(record: EvidenceRecord): Promise<EvidenceRecord> {
    return withTransaction("evidence", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  getAllForProject(projectId: string): Promise<EvidenceRecord[]> {
    return withTransaction("evidence", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as Record<string, unknown>[];
      return records
        .map((record) => normalizeEvidence(record))
        .sort((left, right) => left.code.localeCompare(right.code, "en", { numeric: true }));
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("evidence", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }
}

class AffirmationRepository {
  save(record: Affirmation): Promise<Affirmation> {
    return withTransaction("affirmations", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  getAllForProject(projectId: string): Promise<Affirmation[]> {
    return withTransaction("affirmations", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as Record<string, unknown>[];
      return records
        .map((record) => normalizeAffirmation(record))
        .sort((left, right) =>
          left.code.localeCompare(right.code, "en", { numeric: true }),
        );
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("affirmations", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }
}

class AidEidLinkRepository {
  save(record: AidEidLink): Promise<AidEidLink> {
    return withTransaction("links", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  getAllForProject(projectId: string): Promise<AidEidLink[]> {
    return withTransaction("links", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as Record<string, unknown>[];
      return records.map((record) => normalizeLink(record));
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("links", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }

  // En esborrar una afirmació o una evidència, els seus enllaços desapareixen
  // per no deixar vincles orfes que apuntin a res.
  private deleteByIndex(index: "affirmationId" | "evidenceId", value: string): Promise<void> {
    return withTransaction("links", "readwrite", async (store) => {
      const keys = (await requestResult(
        store.index(index).getAllKeys(value),
      )) as IDBValidKey[];
      await Promise.all(keys.map((key) => requestResult(store.delete(key))));
    });
  }

  deleteForAffirmation(affirmationId: string): Promise<void> {
    return this.deleteByIndex("affirmationId", affirmationId);
  }

  deleteForEvidence(evidenceId: string): Promise<void> {
    return this.deleteByIndex("evidenceId", evidenceId);
  }
}

class MatrixCellRepository {
  save(record: MatrixCell): Promise<MatrixCell> {
    return withTransaction("cells", "readwrite", async (store) => {
      await requestResult(store.put(record));
      return record;
    });
  }

  getAllForProject(projectId: string): Promise<MatrixCell[]> {
    return withTransaction("cells", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as Record<string, unknown>[];
      return records.map((record) => normalizeCell(record));
    });
  }

  delete(id: string): Promise<void> {
    return withTransaction("cells", "readwrite", async (store) => {
      await requestResult(store.delete(id));
    });
  }

  // En esborrar una evidència o una hipòtesi, les seves cel·les desapareixen.
  private deleteByIndex(index: "evidenceId" | "hypothesisId", value: string): Promise<void> {
    return withTransaction("cells", "readwrite", async (store) => {
      const keys = (await requestResult(
        store.index(index).getAllKeys(value),
      )) as IDBValidKey[];
      await Promise.all(keys.map((key) => requestResult(store.delete(key))));
    });
  }

  deleteForEvidence(evidenceId: string): Promise<void> {
    return this.deleteByIndex("evidenceId", evidenceId);
  }

  deleteForHypothesis(hypothesisId: string): Promise<void> {
    return this.deleteByIndex("hypothesisId", hypothesisId);
  }
}

class ManuscriptRepository {
  import(
    manuscript: ManuscriptRecord,
    original: ManuscriptOriginalRecord,
  ): Promise<ManuscriptRecord> {
    return withStoresTransaction(
      ["manuscripts", "manuscriptOriginals"],
      "readwrite",
      async (transaction) => {
        await requestResult(
          transaction.objectStore("manuscripts").add(manuscript),
        );
        // `add`, i no `put`: un original existent no es pot sobreescriure.
        await requestResult(
          transaction.objectStore("manuscriptOriginals").add(original),
        );
        return manuscript;
      },
    );
  }

  getAllForProject(projectId: string): Promise<ManuscriptRecord[]> {
    return withTransaction("manuscripts", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as ManuscriptRecord[];
      return records.sort((left, right) =>
        right.importedAt.localeCompare(left.importedAt),
      );
    });
  }

  getOriginal(manuscriptId: string): Promise<ManuscriptOriginalRecord | null> {
    return withTransaction("manuscriptOriginals", "readonly", async (store) => {
      const result = await requestResult(store.get(manuscriptId));
      return (result as ManuscriptOriginalRecord | undefined) ?? null;
    });
  }
}

class BookNodeRepository {
  save(record: BookNode): Promise<BookNode> {
    const normalized = normalizeBookNode(record);
    return withTransaction("bookNodes", "readwrite", async (store) => {
      await requestResult(store.put(normalized));
      return normalized;
    });
  }

  saveMany(records: readonly BookNode[]): Promise<BookNode[]> {
    const normalized = records.map(normalizeBookNode);
    return withTransaction("bookNodes", "readwrite", async (store) => {
      for (const record of normalized) {
        await requestResult(store.put(record));
      }
      return normalized;
    });
  }

  replaceForManuscript(
    manuscriptId: string,
    records: readonly BookNode[],
  ): Promise<BookNode[]> {
    const normalized = records.map(normalizeBookNode);
    return withTransaction("bookNodes", "readwrite", async (store) => {
      const keys = (await requestResult(
        store.index("manuscriptId").getAllKeys(manuscriptId),
      )) as IDBValidKey[];
      for (const key of keys) await requestResult(store.delete(key));
      for (const record of normalized) await requestResult(store.add(record));
      return normalized;
    });
  }

  getAllForProject(projectId: string): Promise<BookNode[]> {
    return withTransaction("bookNodes", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as BookNode[];
      return records.map(normalizeBookNode);
    });
  }
}

class ChapterDraftRepository {
  save(
    record: ChapterDraft,
    savedAt = new Date().toISOString(),
  ): Promise<ChapterDraft> {
    const normalized = normalizeChapterDraft(record);
    return withTransaction("chapterDrafts", "readwrite", async (store) => {
      const current = (await requestResult(
        store.get(normalized.id),
      )) as ChapterDraft | undefined;
      if (current && current.revision > normalized.revision) {
        return normalizeChapterDraft(current);
      }
      const saved = { ...normalized, savedAt };
      await requestResult(store.put(saved));
      return saved;
    });
  }

  get(chapterId: string): Promise<ChapterDraft | null> {
    return withTransaction("chapterDrafts", "readonly", async (store) => {
      const record = (await requestResult(
        store.get(chapterId),
      )) as ChapterDraft | undefined;
      return record ? normalizeChapterDraft(record) : null;
    });
  }

  getAllForProject(projectId: string): Promise<ChapterDraft[]> {
    return withTransaction("chapterDrafts", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("projectId").getAll(projectId),
      )) as ChapterDraft[];
      return records.map(normalizeChapterDraft);
    });
  }
}

class ChapterVersionRepository {
  add(record: ChapterVersion): Promise<ChapterVersion> {
    const normalized = normalizeChapterVersion(record);
    return withTransaction("chapterVersions", "readwrite", async (store) => {
      await requestResult(store.add(normalized));
      return normalized;
    });
  }

  getAllForChapter(chapterId: string): Promise<ChapterVersion[]> {
    return withTransaction("chapterVersions", "readonly", async (store) => {
      const records = (await requestResult(
        store.index("chapterId").getAll(chapterId),
      )) as ChapterVersion[];
      return records
        .map(normalizeChapterVersion)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    });
  }

  restore(
    draft: ChapterDraft,
    backup: ChapterVersion,
    savedAt = new Date().toISOString(),
  ): Promise<ChapterDraft> {
    const normalizedDraft = normalizeChapterDraft(draft);
    const normalizedBackup = normalizeChapterVersion(backup);
    if (
      normalizedDraft.projectId !== normalizedBackup.projectId ||
      normalizedDraft.manuscriptId !== normalizedBackup.manuscriptId ||
      normalizedDraft.chapterId !== normalizedBackup.chapterId ||
      normalizedBackup.origin !== "pre-restauracio"
    ) {
      throw new TypeError("La restauració i la còpia prèvia no coincideixen.");
    }
    return withStoresTransaction(
      ["chapterDrafts", "chapterVersions"],
      "readwrite",
      async (transaction) => {
        const versionStore = transaction.objectStore("chapterVersions");
        const draftStore = transaction.objectStore("chapterDrafts");
        await requestResult(versionStore.add(normalizedBackup));
        const saved = { ...normalizedDraft, savedAt };
        await requestResult(draftStore.put(saved));
        return saved;
      },
    );
  }
}

export const projectRepository = new ProjectRepository();
export const metadataRepository = new MetadataRepository();
export const sourceRepository = new SourceRepository();
export const sourceBlobRepository = new SourceBlobRepository();
export const hypothesisRepository = new HypothesisRepository();
export const pdfReferenceRepository = new PdfReferenceRepository();
export const citableNoteRepository = new CitableNoteRepository();
export const evidenceRepository = new EvidenceRepository();
export const affirmationRepository = new AffirmationRepository();
export const aidEidLinkRepository = new AidEidLinkRepository();
export const matrixCellRepository = new MatrixCellRepository();
export const manuscriptRepository = new ManuscriptRepository();
export const bookNodeRepository = new BookNodeRepository();
export const chapterDraftRepository = new ChapterDraftRepository();
export const chapterVersionRepository = new ChapterVersionRepository();
