// Funció 006 — Salut de l'emmagatzematge.
// Lògica pura i comprovable: avalua ús/quota, persistència i antiguitat de la
// darrera còpia sense tocar cap API del navegador, perquè les proves puguin
// executar-se a Node. Els adaptadors del navegador viuen al final del fitxer i
// només llegeixen `navigator` dins de la crida, mai en importar el mòdul.

export const STORAGE_HEALTH_METADATA_KEY = "lastBackupAt" as const;

export const STORAGE_USAGE_WARNING_RATIO = 0.8;
export const STORAGE_USAGE_CRITICAL_RATIO = 0.95;
export const BACKUP_STALE_WARNING_DAYS = 7;
export const BACKUP_STALE_CRITICAL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type StorageHealthLevel = "ok" | "info" | "warning" | "critical";

export type StorageRiskLevel = Exclude<StorageHealthLevel, "ok">;

export type StorageRiskAction = "persist" | "backup" | "free-space";

export type StorageRisk = {
  id: string;
  level: StorageRiskLevel;
  title: string;
  detail: string;
  action: StorageRiskAction | null;
};

export type StorageSnapshot = {
  supported: boolean;
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
};

export type StorageHealthReport = {
  supported: boolean;
  usage: number | null;
  quota: number | null;
  available: number | null;
  usageRatio: number | null;
  persisted: boolean | null;
  lastBackupAt: string | null;
  backupAgeMs: number | null;
  level: StorageHealthLevel;
  risks: StorageRisk[];
};

const LEVEL_ORDER: Record<StorageHealthLevel, number> = {
  ok: 0,
  info: 1,
  warning: 2,
  critical: 3,
};

export const UNSUPPORTED_SNAPSHOT: StorageSnapshot = {
  supported: false,
  usage: null,
  quota: null,
  persisted: null,
};

function finiteOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseTimestamp(value: string | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function worstLevel(risks: StorageRisk[]): StorageHealthLevel {
  return risks.reduce<StorageHealthLevel>(
    (worst, risk) =>
      LEVEL_ORDER[risk.level] > LEVEL_ORDER[worst] ? risk.level : worst,
    "ok",
  );
}

export function evaluateStorageHealth(input: {
  snapshot: StorageSnapshot;
  lastBackupAt: string | null;
  now?: number | Date;
}): StorageHealthReport {
  const { snapshot, lastBackupAt } = input;
  const now =
    input.now instanceof Date ? input.now.getTime() : input.now ?? Date.now();

  const usage = finiteOrNull(snapshot.usage);
  const quota = finiteOrNull(snapshot.quota);
  const usageRatio =
    usage !== null && quota !== null && quota > 0 ? usage / quota : null;
  const available =
    usage !== null && quota !== null ? Math.max(0, quota - usage) : null;

  const backupTime = parseTimestamp(lastBackupAt);
  const backupAgeMs = backupTime !== null ? Math.max(0, now - backupTime) : null;

  const risks: StorageRisk[] = [];

  if (!snapshot.supported) {
    risks.push({
      id: "unsupported",
      level: "info",
      title: "Ús de l'espai no disponible",
      detail:
        "Aquest navegador no informa de l'ús ni la quota. Fes còpies periòdiques com a protecció.",
      action: "backup",
    });
  }

  if (snapshot.persisted === false) {
    risks.push({
      id: "not-persisted",
      level: "warning",
      title: "Espai local sense protecció",
      detail:
        "El navegador pot esborrar les dades si necessita espai. Concedeix la persistència per reduir el risc.",
      action: "persist",
    });
  }

  if (usageRatio !== null && usageRatio >= STORAGE_USAGE_CRITICAL_RATIO) {
    risks.push({
      id: "usage-critical",
      level: "critical",
      title: "Gairebé no queda espai local",
      detail:
        "L'espai assignat és gairebé ple. Exporta una còpia i allibera projectes que ja no necessitis.",
      action: "free-space",
    });
  } else if (usageRatio !== null && usageRatio >= STORAGE_USAGE_WARNING_RATIO) {
    risks.push({
      id: "usage-warning",
      level: "warning",
      title: "L'espai local s'acosta al límit",
      detail:
        "Queda poc marge. Considera exportar una còpia i revisar els projectes emmagatzemats.",
      action: "free-space",
    });
  }

  if (backupAgeMs === null) {
    risks.push({
      id: "no-backup",
      level: "warning",
      title: "Encara no hi ha cap còpia",
      detail:
        "No consta cap còpia portàtil d'aquest dispositiu. Exporta'n una per poder recuperar les dades.",
      action: "backup",
    });
  } else if (backupAgeMs >= BACKUP_STALE_CRITICAL_DAYS * DAY_MS) {
    risks.push({
      id: "backup-stale",
      level: "warning",
      title: "La darrera còpia és antiga",
      detail: `Fa més de ${BACKUP_STALE_CRITICAL_DAYS} dies de la darrera còpia. Exporta'n una de nova per no perdre canvis.`,
      action: "backup",
    });
  } else if (backupAgeMs >= BACKUP_STALE_WARNING_DAYS * DAY_MS) {
    risks.push({
      id: "backup-aging",
      level: "info",
      title: "Convé refrescar la còpia",
      detail: `Fa més d'una setmana de la darrera còpia. Exporta'n una de nova quan puguis.`,
      action: "backup",
    });
  }

  return {
    supported: snapshot.supported,
    usage,
    quota,
    available,
    usageRatio,
    persisted: snapshot.persisted,
    lastBackupAt: backupTime !== null ? lastBackupAt : null,
    backupAgeMs,
    level: worstLevel(risks),
    risks,
  };
}

export function formatBytes(bytes: number | null): string {
  const value = finiteOrNull(bytes);
  if (value === null) return "—";
  if (value < 1) return "0 B";

  const units = ["B", "kB", "MB", "GB", "TB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(value) / Math.log(1024)),
  );
  const scaled = value / 1024 ** exponent;
  const formatted = new Intl.NumberFormat("ca-ES", {
    maximumFractionDigits: exponent === 0 ? 0 : 1,
  }).format(scaled);
  return `${formatted} ${units[exponent]}`;
}

export function formatPercent(ratio: number | null): string {
  const value = finiteOrNull(ratio);
  if (value === null) return "—";
  return new Intl.NumberFormat("ca-ES", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeAge(ageMs: number | null): string {
  const value = finiteOrNull(ageMs);
  if (value === null || value < 0) return "—";

  const minutes = Math.floor(value / 60000);
  if (minutes < 1) return "ara mateix";
  if (minutes < 60) return `fa ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `fa ${hours} h`;

  const days = Math.floor(hours / 24);
  return `fa ${days} ${days === 1 ? "dia" : "dies"}`;
}

// --- Adaptadors del navegador (no s'executen en importar el mòdul) ---

export async function readStorageSnapshot(): Promise<StorageSnapshot> {
  const storage = globalThis.navigator?.storage;
  if (!storage || typeof storage.estimate !== "function") {
    return UNSUPPORTED_SNAPSHOT;
  }

  let usage: number | null = null;
  let quota: number | null = null;
  try {
    const estimate = await storage.estimate();
    usage = finiteOrNull(estimate.usage ?? null);
    quota = finiteOrNull(estimate.quota ?? null);
  } catch {
    return UNSUPPORTED_SNAPSHOT;
  }

  let persisted: boolean | null = null;
  if (typeof storage.persisted === "function") {
    try {
      persisted = await storage.persisted();
    } catch {
      persisted = null;
    }
  }

  return { supported: true, usage, quota, persisted };
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  const storage = globalThis.navigator?.storage;
  if (!storage || typeof storage.persist !== "function") return null;
  try {
    return await storage.persist();
  } catch {
    return null;
  }
}
