export {
  LOCAL_DATABASE_SCHEMA,
  openLocalDatabase,
  requestResult,
  withStoresTransaction,
  withTransaction,
} from "./database.ts";
export {
  affirmationRepository,
  aidEidLinkRepository,
  bookNodeRepository,
  chapterDraftRepository,
  chapterVersionRepository,
  citableNoteRepository,
  evidenceRepository,
  hypothesisRepository,
  manuscriptRepository,
  matrixCellRepository,
  metadataRepository,
  pdfReferenceRepository,
  projectRepository,
  sourceBlobRepository,
  sourceRepository,
} from "./repositories.ts";
export {
  createProjectRecord,
  duplicateProjectRecord,
  normalizeProjectRecord,
  PROJECT_DATA_VERSION,
  type DatabaseMetadata,
  type ProjectRecord,
} from "./types.ts";
export {
  createMigrationBackup,
  LATEST_DATA_VERSION,
  migrateProjectDataset,
  migrateProjectRecord,
  MigrationError,
  PROJECT_MIGRATIONS,
  recordDataVersion,
  type DatasetMigration,
  type MigratedRecord,
  type MigrationBackup,
  type MigrationStep,
  type RawRecord,
} from "./migrations.ts";
export {
  ensureProjectsMigrated,
  listMigrationBackups,
  MIGRATION_BACKUP_METADATA_KEY,
  type MigrationRunResult,
  recoverProjectsFromBackup,
} from "./migration-runner.ts";
