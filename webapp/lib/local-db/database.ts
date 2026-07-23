import { normalizeProjectRecord, PROJECT_DATA_VERSION } from "./types.ts";

export const LOCAL_DATABASE_SCHEMA = {
  name: "validaccio-local",
  version: 9,
  dataVersion: PROJECT_DATA_VERSION,
  stores: {
    metadata: "metadata",
    projects: "projects",
    sources: "sources",
    blobs: "blobs",
    hypotheses: "hypotheses",
    references: "references",
    notes: "notes",
    evidence: "evidence",
    affirmations: "affirmations",
    legacyWorkspace: "workspace",
  },
} as const;

export type LocalStoreName =
  | typeof LOCAL_DATABASE_SCHEMA.stores.metadata
  | typeof LOCAL_DATABASE_SCHEMA.stores.projects
  | typeof LOCAL_DATABASE_SCHEMA.stores.sources
  | typeof LOCAL_DATABASE_SCHEMA.stores.blobs
  | typeof LOCAL_DATABASE_SCHEMA.stores.hypotheses
  | typeof LOCAL_DATABASE_SCHEMA.stores.references
  | typeof LOCAL_DATABASE_SCHEMA.stores.notes
  | typeof LOCAL_DATABASE_SCHEMA.stores.evidence
  | typeof LOCAL_DATABASE_SCHEMA.stores.affirmations;

let databasePromise: Promise<IDBDatabase> | null = null;

export function openLocalDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(
      LOCAL_DATABASE_SCHEMA.name,
      LOCAL_DATABASE_SCHEMA.version,
    );

    request.onupgradeneeded = (event) => {
      upgradeDatabase(request.result, request.transaction, event.oldVersion);
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("Una altra pestanya bloqueja l’actualització de l’espai local"));
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error("No s’ha pogut obrir l’espai local"));
    };
  });

  return databasePromise;
}

export async function withTransaction<T>(
  storeName: LocalStoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const database = await openLocalDatabase();
  const transaction = database.transaction(storeName, mode);
  const completion = transactionCompletion(transaction);

  try {
    const result = await operation(transaction.objectStore(storeName));
    await completion;
    return result;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // La transacció ja pot haver finalitzat abans que l'operació llanci l'error.
    }
    await completion.catch(() => undefined);
    throw error;
  }
}

export function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionCompletion(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("La transacció local s’ha cancel·lat"));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("La transacció local ha fallat"));
  });
}

function upgradeDatabase(
  database: IDBDatabase,
  transaction: IDBTransaction | null,
  oldVersion: number,
) {
  if (!transaction) throw new Error("La migració no té cap transacció activa");

  const metadata = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.metadata,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.metadata)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.metadata, {
        keyPath: "key",
      });

  const projects = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.projects,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.projects)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.projects, {
        keyPath: "id",
      });

  if (!projects.indexNames.contains("updatedAt")) {
    projects.createIndex("updatedAt", "updatedAt");
  }

  const sources = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.sources,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.sources)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.sources, {
        keyPath: "id",
      });

  if (!sources.indexNames.contains("projectId")) {
    sources.createIndex("projectId", "projectId");
  }

  const blobs = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.blobs,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.blobs)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.blobs, {
        keyPath: "sourceId",
      });

  if (!blobs.indexNames.contains("projectId")) {
    blobs.createIndex("projectId", "projectId");
  }

  const hypotheses = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.hypotheses,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.hypotheses)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.hypotheses, {
        keyPath: "id",
      });

  if (!hypotheses.indexNames.contains("projectId")) {
    hypotheses.createIndex("projectId", "projectId");
  }

  const references = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.references,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.references)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.references, {
        keyPath: "id",
      });

  if (!references.indexNames.contains("sourceId")) {
    references.createIndex("sourceId", "sourceId");
  }

  const notes = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.notes,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.notes)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.notes, {
        keyPath: "id",
      });

  if (!notes.indexNames.contains("projectId")) {
    notes.createIndex("projectId", "projectId");
  }
  if (!notes.indexNames.contains("sourceId")) {
    notes.createIndex("sourceId", "sourceId");
  }

  const evidence = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.evidence,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.evidence)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.evidence, {
        keyPath: "id",
      });

  if (!evidence.indexNames.contains("projectId")) {
    evidence.createIndex("projectId", "projectId");
  }

  const affirmations = database.objectStoreNames.contains(
    LOCAL_DATABASE_SCHEMA.stores.affirmations,
  )
    ? transaction.objectStore(LOCAL_DATABASE_SCHEMA.stores.affirmations)
    : database.createObjectStore(LOCAL_DATABASE_SCHEMA.stores.affirmations, {
        keyPath: "id",
      });

  if (!affirmations.indexNames.contains("projectId")) {
    affirmations.createIndex("projectId", "projectId");
  }

  metadata.put({
    key: "schema",
    value: {
      databaseVersion: LOCAL_DATABASE_SCHEMA.version,
      dataVersion: LOCAL_DATABASE_SCHEMA.dataVersion,
    },
    updatedAt: new Date().toISOString(),
  });

  if (
    oldVersion < 2 &&
    database.objectStoreNames.contains(
      LOCAL_DATABASE_SCHEMA.stores.legacyWorkspace,
    )
  ) {
    const legacyRequest = transaction
      .objectStore(LOCAL_DATABASE_SCHEMA.stores.legacyWorkspace)
      .get("project");
    legacyRequest.onsuccess = () => {
      if (!legacyRequest.result) return;
      try {
        projects.put(normalizeProjectRecord(legacyRequest.result));
      } catch {
        // Es conserva el magatzem antic perquè una dada invàlida es pugui recuperar manualment.
      }
    };
  }
  if (oldVersion < 3) {
    const cursorRequest = projects.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      try {
        cursor.update(normalizeProjectRecord(cursor.value));
      } catch {
        // Una entrada invàlida queda intacta per poder-la inspeccionar i recuperar.
      }
      cursor.continue();
    };
  }

}
