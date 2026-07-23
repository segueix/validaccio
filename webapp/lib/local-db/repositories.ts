import { requestResult, withTransaction } from "./database.ts";
import {
  type DatabaseMetadata,
  normalizeProjectRecord,
  type ProjectRecord,
} from "./types.ts";
import { type SourceRecord } from "../source-library.ts";
import { type SourceBlobRecord } from "../source-blobs.ts";
import { type PdfReference } from "../pdf-references.ts";
import { type CitableNote, normalizeCitableNote } from "../citable-notes.ts";

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

export const projectRepository = new ProjectRepository();
export const metadataRepository = new MetadataRepository();
export const sourceRepository = new SourceRepository();
export const sourceBlobRepository = new SourceBlobRepository();
export const pdfReferenceRepository = new PdfReferenceRepository();
export const citableNoteRepository = new CitableNoteRepository();
