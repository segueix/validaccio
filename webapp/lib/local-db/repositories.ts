import { requestResult, withTransaction } from "./database.ts";
import {
  type DatabaseMetadata,
  normalizeProjectRecord,
  type ProjectRecord,
} from "./types.ts";
import { type SourceRecord } from "../source-library.ts";
import { type SourceBlobRecord } from "../source-blobs.ts";

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

export const projectRepository = new ProjectRepository();
export const metadataRepository = new MetadataRepository();
export const sourceRepository = new SourceRepository();
export const sourceBlobRepository = new SourceBlobRepository();
