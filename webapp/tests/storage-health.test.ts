import assert from "node:assert/strict";
import test from "node:test";

import {
  BACKUP_STALE_CRITICAL_DAYS,
  evaluateStorageHealth,
  formatBytes,
  formatPercent,
  formatRelativeAge,
  type StorageSnapshot,
} from "../lib/storage-health.ts";

const NOW = Date.parse("2026-07-22T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function snapshot(overrides: Partial<StorageSnapshot> = {}): StorageSnapshot {
  return {
    supported: true,
    usage: 20 * 1024 * 1024,
    quota: 1024 * 1024 * 1024,
    persisted: true,
    ...overrides,
  };
}

test("un espai sa i amb còpia recent no genera cap avís", () => {
  const report = evaluateStorageHealth({
    snapshot: snapshot(),
    lastBackupAt: new Date(NOW - DAY_MS).toISOString(),
    now: NOW,
  });

  assert.equal(report.level, "ok");
  assert.deepEqual(report.risks, []);
  assert.equal(report.persisted, true);
  assert.ok(report.usageRatio !== null && report.usageRatio < 0.05);
  assert.equal(report.available, report.quota! - report.usage!);
});

test("marca com a crític quan la quota és gairebé plena", () => {
  const report = evaluateStorageHealth({
    snapshot: snapshot({ usage: 98, quota: 100 }),
    lastBackupAt: new Date(NOW).toISOString(),
    now: NOW,
  });

  assert.equal(report.level, "critical");
  assert.ok(report.risks.some((risk) => risk.id === "usage-critical"));
  const usageRisk = report.risks.find((risk) => risk.id === "usage-critical");
  assert.equal(usageRisk?.action, "free-space");
});

test("avisa quan la quota s'acosta al límit sense arribar al crític", () => {
  const report = evaluateStorageHealth({
    snapshot: snapshot({ usage: 85, quota: 100 }),
    lastBackupAt: new Date(NOW).toISOString(),
    now: NOW,
  });

  assert.equal(report.level, "warning");
  assert.ok(report.risks.some((risk) => risk.id === "usage-warning"));
  assert.ok(!report.risks.some((risk) => risk.id === "usage-critical"));
});

test("recomana protegir l'espai quan la persistència no s'ha concedit", () => {
  const report = evaluateStorageHealth({
    snapshot: snapshot({ persisted: false }),
    lastBackupAt: new Date(NOW).toISOString(),
    now: NOW,
  });

  const risk = report.risks.find((item) => item.id === "not-persisted");
  assert.equal(risk?.level, "warning");
  assert.equal(risk?.action, "persist");
});

test("adverteix quan no hi ha cap còpia registrada", () => {
  const report = evaluateStorageHealth({
    snapshot: snapshot(),
    lastBackupAt: null,
    now: NOW,
  });

  const risk = report.risks.find((item) => item.id === "no-backup");
  assert.equal(risk?.level, "warning");
  assert.equal(risk?.action, "backup");
  assert.equal(report.lastBackupAt, null);
  assert.equal(report.backupAgeMs, null);
});

test("distingeix una còpia antiga d'una que només convé refrescar", () => {
  const stale = evaluateStorageHealth({
    snapshot: snapshot(),
    lastBackupAt: new Date(NOW - (BACKUP_STALE_CRITICAL_DAYS + 1) * DAY_MS).toISOString(),
    now: NOW,
  });
  assert.ok(stale.risks.some((risk) => risk.id === "backup-stale"));
  assert.equal(stale.level, "warning");

  const aging = evaluateStorageHealth({
    snapshot: snapshot(),
    lastBackupAt: new Date(NOW - 9 * DAY_MS).toISOString(),
    now: NOW,
  });
  const agingRisk = aging.risks.find((risk) => risk.id === "backup-aging");
  assert.equal(agingRisk?.level, "info");
  assert.equal(aging.level, "info");
});

test("un navegador sense API d'estimació ho reporta sense inventar xifres", () => {
  const report = evaluateStorageHealth({
    snapshot: {
      supported: false,
      usage: null,
      quota: null,
      persisted: null,
    },
    lastBackupAt: new Date(NOW).toISOString(),
    now: NOW,
  });

  assert.equal(report.supported, false);
  assert.equal(report.usage, null);
  assert.equal(report.quota, null);
  assert.equal(report.usageRatio, null);
  assert.ok(report.risks.some((risk) => risk.id === "unsupported"));
});

test("formata bytes en unitats llegibles", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1024), "1 kB");
  assert.equal(formatBytes(1024 * 1024), "1 MB");
  assert.equal(formatBytes(1024 * 1024 * 1024), "1 GB");
  assert.equal(formatBytes(null), "—");
  assert.match(formatBytes(1536), /kB$/);
});

test("formata percentatges i antiguitats relatives", () => {
  assert.equal(formatPercent(null), "—");
  assert.match(formatPercent(0.8), /80\s*%/);

  assert.equal(formatRelativeAge(null), "—");
  assert.equal(formatRelativeAge(30_000), "ara mateix");
  assert.equal(formatRelativeAge(5 * 60_000), "fa 5 min");
  assert.equal(formatRelativeAge(3 * 60 * 60_000), "fa 3 h");
  assert.equal(formatRelativeAge(DAY_MS), "fa 1 dia");
  assert.equal(formatRelativeAge(2 * DAY_MS), "fa 2 dies");
});
