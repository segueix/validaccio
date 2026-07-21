import { requestResult, withTransaction } from "./database.ts";
import {
  type DatabaseMetadata,
  normalizeProjectRecord,
  type ProjectRecord,
} from "./types.ts";

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

export const projectRepository = new ProjectRepository();
export const metadataRepository = new MetadataRepository();
