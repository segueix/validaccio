import {
  normalizeProjectRecord,
  PROJECT_DATA_VERSION,
  type ProjectRecord,
} from "./local-db/index.ts";

export const PROJECT_PACKAGE_FORMAT = "validaccio-project" as const;
export const PROJECT_PACKAGE_VERSION = 2 as const;
export const MAX_PROJECT_PACKAGE_BYTES = 5 * 1024 * 1024;

type PackageManifestCore = {
  application: "Validacció";
  applicationVersion: string;
  exportedAt: string;
  projectDataVersion: number;
  projectId: string;
  records: {
    projects: 1;
  };
};

export type ProjectPackage = {
  format: typeof PROJECT_PACKAGE_FORMAT;
  version: typeof PROJECT_PACKAGE_VERSION;
  manifest: PackageManifestCore & {
    integrity: {
      algorithm: "SHA-256";
      digest: string;
    };
  };
  data: {
    project: ProjectRecord;
  };
};

export type ImportedProjectPackage = {
  packageVersion: number;
  project: ProjectRecord;
  source: "legacy" | "verified";
};

export type ProjectPackageErrorCode =
  | "invalid-json"
  | "invalid-format"
  | "invalid-data"
  | "unsupported-version"
  | "integrity-mismatch";

export class ProjectPackageError extends Error {
  constructor(
    readonly code: ProjectPackageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProjectPackageError";
  }
}

export async function createProjectPackage(
  project: ProjectRecord,
  exportedAt = new Date().toISOString(),
): Promise<ProjectPackage> {
  const normalizedProject = normalizeProjectRecord(project);
  const manifest: PackageManifestCore = {
    application: "Validacció",
    applicationVersion: "0.1.0",
    exportedAt,
    projectDataVersion: PROJECT_DATA_VERSION,
    projectId: normalizedProject.id,
    records: { projects: 1 },
  };
  const data = { project: normalizedProject };
  const digest = await sha256Hex(
    stableSerialize({
      format: PROJECT_PACKAGE_FORMAT,
      version: PROJECT_PACKAGE_VERSION,
      manifest,
      data,
    }),
  );

  return {
    format: PROJECT_PACKAGE_FORMAT,
    version: PROJECT_PACKAGE_VERSION,
    manifest: {
      ...manifest,
      integrity: {
        algorithm: "SHA-256",
        digest,
      },
    },
    data,
  };
}

export function serializeProjectPackage(projectPackage: ProjectPackage) {
  return `${JSON.stringify(projectPackage, null, 2)}\n`;
}

export async function parseProjectPackage(
  input: string,
): Promise<ImportedProjectPackage> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new ProjectPackageError(
      "invalid-json",
      "El fitxer no conté un JSON vàlid.",
    );
  }

  if (!isRecord(parsed) || parsed.format !== PROJECT_PACKAGE_FORMAT) {
    throw new ProjectPackageError(
      "invalid-format",
      "El fitxer no és un projecte Validacció.",
    );
  }

  if (parsed.version === 1) {
    try {
      return {
        packageVersion: 1,
        project: normalizeProjectRecord(asRecord(parsed.project)),
        source: "legacy",
      };
    } catch {
      throw new ProjectPackageError(
        "invalid-data",
        "La còpia antiga no conté un projecte recuperable.",
      );
    }
  }

  if (parsed.version !== PROJECT_PACKAGE_VERSION) {
    throw new ProjectPackageError(
      "unsupported-version",
      typeof parsed.version === "number" &&
        parsed.version > PROJECT_PACKAGE_VERSION
        ? "La còpia prové d’una versió més nova de Validacció."
        : "La versió de la còpia no és compatible.",
    );
  }

  const manifest = asRecord(parsed.manifest);
  const integrity = asRecord(manifest.integrity);
  const data = asRecord(parsed.data);
  let project: ProjectRecord;

  try {
    project = normalizeProjectRecord(asRecord(data.project));
  } catch {
    throw new ProjectPackageError(
      "invalid-data",
      "La còpia no conté un projecte vàlid.",
    );
  }

  if (
    manifest.application !== "Validacció" ||
    manifest.projectId !== project.id ||
    manifest.projectDataVersion !== project.dataVersion ||
    asRecord(manifest.records).projects !== 1 ||
    integrity.algorithm !== "SHA-256" ||
    typeof integrity.digest !== "string"
  ) {
    throw new ProjectPackageError(
      "invalid-data",
      "El manifest de la còpia és incomplet o no coincideix amb el projecte.",
    );
  }

  const manifestCore: PackageManifestCore = {
    application: "Validacció",
    applicationVersion:
      typeof manifest.applicationVersion === "string"
        ? manifest.applicationVersion
        : "",
    exportedAt:
      typeof manifest.exportedAt === "string" ? manifest.exportedAt : "",
    projectDataVersion: project.dataVersion,
    projectId: project.id,
    records: { projects: 1 },
  };
  const expectedDigest = await sha256Hex(
    stableSerialize({
      format: PROJECT_PACKAGE_FORMAT,
      version: PROJECT_PACKAGE_VERSION,
      manifest: manifestCore,
      data: { project },
    }),
  );

  if (expectedDigest !== integrity.digest) {
    throw new ProjectPackageError(
      "integrity-mismatch",
      "La comprovació d’integritat ha fallat. La còpia pot estar malmesa o modificada.",
    );
  }

  return {
    packageVersion: PROJECT_PACKAGE_VERSION,
    project,
    source: "verified",
  };
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Nombre no serialitzable");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  throw new TypeError("Valor no serialitzable");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new TypeError("S’esperava un objecte");
  return value;
}
