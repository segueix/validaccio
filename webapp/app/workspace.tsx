"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import ProjectManager from "./project-manager";
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
  ensureProjectsMigrated,
  metadataRepository,
  projectRepository,
  PROJECT_DATA_VERSION,
  recoverProjectsFromBackup,
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

type ViewId =
  | "tauler"
  | "fonts"
  | "hipotesis"
  | "evidencies"
  | "matriu"
  | "sensibilitat"
  | "capitols"
  | "validacio"
  | "exporta"
  | "salut"
  | "privadesa";

type Project = ProjectRecord;

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
  { id: "hipotesis", label: "Hipòtesis", short: "H" },
  { id: "evidencies", label: "Evidències", short: "E" },
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

const moduleCopy: Record<Exclude<ViewId, "tauler" | "salut" | "privadesa" | "fonts">, { eyebrow: string; title: string; body: string; status: string }> = {
  hipotesis: {
    eyebrow: "Fase 1",
    title: "Hipòtesis competitives",
    body: "Formula H1, H2 i H3 amb prediccions, condicions d’abandonament i registre de modificacions.",
    status: "Estructura disponible",
  },
  evidencies: {
    eyebrow: "Fase 2",
    title: "Registre d’evidències",
    body: "Cataloga EID, fiabilitat, família de dependència i interpretació mínima sense perdre la font original.",
    status: "Estructura disponible",
  },
  matriu: {
    eyebrow: "Fase 3",
    title: "Matriu ACH",
    body: "Compara cada evidència amb totes les hipòtesis i separa allò diagnòstic d’allò ornamental.",
    status: "Properament",
  },
  sensibilitat: {
    eyebrow: "Fase 4",
    title: "Anàlisi de sensibilitat",
    body: "Comprova si la conclusió resisteix canvis de priors i l’exclusió de famílies dependents.",
    status: "Properament",
  },
  capitols: {
    eyebrow: "Taller d’obra",
    title: "Capítols i versions",
    body: "Prepara dossiers per a ChatGPT, importa les reescriptures i conserva la traça entre versions.",
    status: "Prototip visible",
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
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceInput = useRef<HTMLInputElement>(null);
  const firewallRef = useRef<PrivacyFirewall | null>(null);

  async function loadSources(projectId: string) {
    try {
      setSources(await sourceRepository.getAllForProject(projectId));
    } catch {
      setSources([]);
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
        added.push(record);
      } catch {
        errors.push(`No s’ha pogut desar «${file.name}».`);
      }
    }

    if (added.length > 0) {
      setSources((current) => [...added, ...current]);
    }
    setSourceErrors(errors);
    setNotice(
      added.length > 0
        ? `${added.length} font(s) importada(es)${errors.length ? ` · ${errors.length} amb errors` : ""}`
        : "Cap font importada",
    );
  }

  async function deleteSource(id: string) {
    await sourceRepository.delete(id);
    setSources((current) => current.filter((item) => item.id !== id));
  }

  async function refreshStorageHealth() {
    try {
      setStorageReport(await computeStorageReport());
      setStorageState("ready");
    } catch {
      setStorageState("error");
    }
  }

  async function toggleOffline() {
    const firewall = firewallRef.current;
    if (!firewall) return;
    const next = !firewall.isOffline();
    firewall.setOffline(next);
    setPrivacyOffline(next);
    setNotice(next ? "Mode sense xarxa activat" : "Mode sense xarxa desactivat");
    await metadataRepository.set(PRIVACY_OFFLINE_METADATA_KEY, next);
  }

  useEffect(() => {
    async function prepareWorkspace() {
      try {
        const migration = await ensureProjectsMigrated();
        if (migration.failures.length > 0) {
          setCanRecover(true);
          setMigrationNotice(
            `No s’han pogut migrar ${migration.failures.length} projecte(s). S’ha desat una còpia prèvia recuperable.`,
          );
        }
      } catch {
        setCanRecover(true);
        setMigrationNotice(
          "La migració de dades ha fallat. S’ha conservat una còpia prèvia; pots recuperar-la.",
        );
      }

      let storedProjects = await projectRepository.getAll();
      if (storedProjects.length === 0) {
        storedProjects = [await persistProject(defaultProject)];
      }

      const activeMetadata = await metadataRepository.get("activeProjectId");
      const activeId =
        typeof activeMetadata?.value === "string" ? activeMetadata.value : null;
      const activeProject =
        storedProjects.find(
          (stored) => stored.id === activeId && !stored.archivedAt,
        ) ??
        storedProjects.find((stored) => !stored.archivedAt) ??
        storedProjects[0];

      setProjects(storedProjects);
      setProject(activeProject);
      setDraftTitle(activeProject.title);
      await metadataRepository.set("activeProjectId", activeProject.id);
      try {
        setSources(await sourceRepository.getAllForProject(activeProject.id));
      } catch {
        setSources([]);
      }
    }

    prepareWorkspace()
      .catch(() => setNotice("No s’ha pogut obrir l’espai local"))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const next = { ...project, updatedAt: new Date().toISOString() };
      persistProject(next)
        .then((savedProject) => {
          setProjects((current) => [
            savedProject,
            ...current.filter((item) => item.id !== savedProject.id),
          ]);
          setSaved(true);
        })
        .catch(() => setNotice("Error en desar localment"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [project, ready]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    async function loadStorageHealth() {
      const report = await computeStorageReport();
      setStorageReport(report);
      setStorageState("ready");
    }
    loadStorageHealth().catch(() => setStorageState("error"));
  }, []);

  useEffect(() => {
    const baseFetch = window.fetch.bind(window);
    const firewall = createPrivacyFirewall({
      appOrigin: window.location.origin,
      baseFetch,
      onEvent: (entry) =>
        setFirewallLog((current) => [entry, ...current].slice(0, 50)),
    });
    firewallRef.current = firewall;
    window.fetch = firewall.fetch;

    metadataRepository
      .get(PRIVACY_OFFLINE_METADATA_KEY)
      .then((meta) => {
        if (meta?.value === true) {
          firewall.setOffline(true);
          setPrivacyOffline(true);
        }
      })
      .catch(() => undefined);

    return () => {
      window.fetch = baseFetch;
      firewallRef.current = null;
    };
  }, []);

  async function openProject(nextProject: Project) {
    setProject(nextProject);
    setDraftTitle(nextProject.title);
    setView("tauler");
    setShowProjects(false);
    setSaved(true);
    await metadataRepository.set("activeProjectId", nextProject.id);
    await loadSources(nextProject.id);
  }

  async function createProject(title: string) {
    const created = await projectRepository.save(createProjectRecord(title));
    setProjects((current) => [created, ...current]);
    setNotice("Projecte creat en aquest dispositiu");
    await openProject(created);
  }

  function startRename(target: Project) {
    setRenameTarget(target);
    setDraftTitle(target.title);
  }

  async function renameProject(event: FormEvent) {
    event.preventDefault();
    const clean = draftTitle.trim();
    if (!clean || !renameTarget) return;

    const renamed = await projectRepository.save({
      ...renameTarget,
      title: clean,
      updatedAt: new Date().toISOString(),
    });
    setProjects((current) =>
      current.map((item) => (item.id === renamed.id ? renamed : item)),
    );
    if (project.id === renamed.id) {
      setProject(renamed);
      setSaved(true);
    }
    setRenameTarget(null);
    setNotice("Projecte reanomenat localment");
  }

  async function duplicateProject(source: Project) {
    const duplicate = await projectRepository.save(
      duplicateProjectRecord(source),
    );
    setProjects((current) => [duplicate, ...current]);
    setNotice("Projecte duplicat en aquest dispositiu");
    await openProject(duplicate);
  }

  async function archiveProject(target: Project) {
    const activeProjects = projects.filter((item) => !item.archivedAt);
    if (activeProjects.length <= 1) {
      setNotice("Cal conservar almenys un projecte actiu");
      return;
    }

    const archived = await projectRepository.save({
      ...target,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const nextProjects = projects.map((item) =>
      item.id === archived.id ? archived : item,
    );
    setProjects(nextProjects);
    if (project.id === archived.id) {
      const nextActive = nextProjects.find((item) => !item.archivedAt);
      if (nextActive) await openProject(nextActive);
    }
    setShowProjects(true);
    setNotice("Projecte arxivat");
  }

  async function restoreProject(target: Project) {
    const restored = await projectRepository.save({
      ...target,
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    });
    setProjects((current) =>
      current.map((item) => (item.id === restored.id ? restored : item)),
    );
    setNotice("Projecte restaurat");
  }

  async function deleteProject(target: Project) {
    await projectRepository.delete(target.id);
    setProjects((current) =>
      current.filter((item) => item.id !== target.id),
    );
    setNotice("Projecte eliminat d’aquest dispositiu");
  }

  async function recoverProjects() {
    try {
      const restored = await recoverProjectsFromBackup();
      if (restored === 0) {
        setNotice("No hi ha cap còpia prèvia per recuperar");
      } else {
        const reloaded = await projectRepository.getAll();
        setProjects(reloaded);
        const active =
          reloaded.find(
            (item) => item.id === project.id && !item.archivedAt,
          ) ??
          reloaded.find((item) => !item.archivedAt) ??
          reloaded[0];
        if (active) {
          setProject(active);
          setDraftTitle(active.title);
          await metadataRepository.set("activeProjectId", active.id);
        }
        setNotice(`Còpia prèvia restaurada (${restored} projecte(s))`);
      }
    } catch {
      setNotice("No s’ha pogut restaurar la còpia prèvia");
    } finally {
      setCanRecover(false);
      setMigrationNotice("");
    }
  }

  function dismissRecovery() {
    setCanRecover(false);
    setMigrationNotice("");
  }

  async function protectStorage() {
    const granted = await requestPersistentStorage();
    if (granted === null) {
      setNotice("El navegador no ofereix protecció addicional");
    } else {
      setNotice(
        granted
          ? "Espai local protegit pel navegador"
          : "Còpia periòdica recomanada",
      );
    }
    await refreshStorageHealth();
  }

  async function exportProject() {
    try {
      const exportedAt = new Date().toISOString();
      const projectPackage = await createProjectPackage(project, exportedAt);
      const blob = new Blob([serializeProjectPackage(projectPackage)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${project.id || "projecte"}.validaccio.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
      await metadataRepository.set(STORAGE_HEALTH_METADATA_KEY, exportedAt);
      await refreshStorageHealth();
      setNotice("Còpia verificada exportada");
    } catch {
      setNotice("No s’ha pogut preparar la còpia local");
    }
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > MAX_PROJECT_PACKAGE_BYTES) {
        throw new ProjectPackageError(
          "invalid-data",
          "La còpia supera el límit de 5 MB.",
        );
      }

      const imported = await parseProjectPackage(await file.text());
      let projectToSave = imported.project;
      const alreadyExists = projects.some(
        (item) => item.id === imported.project.id,
      );

      if (alreadyExists) {
        const replace = window.confirm(
          `Ja existeix «${imported.project.title}». Vols substituir-ne les dades? Si cancel·les, s’importarà com una còpia independent.`,
        );
        if (!replace) {
          projectToSave = duplicateProjectRecord(imported.project);
        }
      }

      const savedProject = await projectRepository.save(projectToSave);
      setProjects((current) => [
        savedProject,
        ...current.filter((item) => item.id !== savedProject.id),
      ]);
      await openProject(savedProject);
      setNotice(
        imported.source === "legacy"
          ? "Còpia antiga restaurada i actualitzada"
          : "Integritat verificada · projecte restaurat",
      );
    } catch (error) {
      setNotice(
        error instanceof ProjectPackageError
          ? error.message
          : "El fitxer no és un projecte Validacció vàlid",
      );
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="workspace-shell">
      <aside className="sidebar" aria-label="Navegació principal">
        <button className="brand" onClick={() => setView("tauler")} aria-label="Torna al tauler">
          <span className="brand-mark">V</span>
          <span>
            <strong>VALIDACCIÓ</strong>
            <small>Recerca històrica</small>
          </span>
        </button>

        <nav className="main-nav">
          {views.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setView(item.id)}
            >
              <span className="nav-icon">{item.short}</span>
              <span>{item.label}</span>
              {item.id === "evidencies" && <span className="nav-count">0</span>}
              {item.id === "fonts" && sources.length > 0 && (
                <span className="nav-count">{sources.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="local-card">
          <span className="pulse-dot" />
          <div>
            <strong>{saved ? "Desat localment" : "Desant…"}</strong>
            <small>{notice}</small>
          </div>
          <button onClick={protectStorage}>Protegeix</button>
        </div>
      </aside>

      <section className="content-shell">
        <header className="topbar">
          <div className="project-switcher">
            <span className="book-chip">LT</span>
            <button
              aria-label="Obre la biblioteca de projectes"
              onClick={() => setShowProjects(true)}
            >
              <strong>{project.title}</strong>
              <small>{projects.filter((item) => !item.archivedAt).length} projectes actius · canvia de projecte</small>
            </button>
          </div>
          <div className="top-actions">
            <button className="quiet-button" onClick={exportProject}>Còpia local</button>
            <button className="primary-button" onClick={() => setView("fonts")}>+ Afegeix una font</button>
          </div>
        </header>

        {canRecover && (
          <div className="recovery-banner" role="status">
            <div>
              <strong>Còpia prèvia de migració disponible</strong>
              <small>{migrationNotice}</small>
            </div>
            <div className="recovery-actions">
              <button className="quiet-button" onClick={dismissRecovery}>
                Descarta
              </button>
              <button className="primary-button" onClick={recoverProjects}>
                Recupera la còpia prèvia
              </button>
            </div>
          </div>
        )}

        {view === "tauler" ? (
          <Dashboard project={project} setView={setView} />
        ) : view === "salut" ? (
          <StorageHealth
            report={storageReport}
            state={storageState}
            onBackup={exportProject}
            onPersist={protectStorage}
            onManageProjects={() => setShowProjects(true)}
            onRefresh={refreshStorageHealth}
          />
        ) : view === "privadesa" ? (
          <PrivacyFirewallView
            offline={privacyOffline}
            log={firewallLog}
            onToggleOffline={toggleOffline}
            onClearLog={() => {
              firewallRef.current?.clearLog();
              setFirewallLog([]);
            }}
          />
        ) : view === "fonts" ? (
          <SourcesLibrary
            sources={sources}
            errors={sourceErrors}
            onPick={() => sourceInput.current?.click()}
            onImport={importSources}
            onDelete={deleteSource}
            onDismissErrors={() => setSourceErrors([])}
          />
        ) : (
          <ModuleView
            view={view}
            project={project}
            onExport={exportProject}
            onImport={() => fileInput.current?.click()}
          />
        )}
      </section>

      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importProject} />
      <input
        ref={sourceInput}
        type="file"
        accept={SOURCE_ACCEPT_ATTR}
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) void importSources(event.target.files);
          event.target.value = "";
        }}
      />

      {showProjects && (
        <ProjectManager
          currentProjectId={project.id}
          onArchive={archiveProject}
          onClose={() => setShowProjects(false)}
          onCreate={createProject}
          onDelete={deleteProject}
          onDuplicate={duplicateProject}
          onOpen={openProject}
          onRename={startRename}
          onRestore={restoreProject}
          projects={projects}
        />
      )}

      {renameTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setRenameTarget(null)}>
          <form className="modal" onSubmit={renameProject} onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">Projecte local</span>
            <h2>Canvia el nom de l’obra</h2>
            <label htmlFor="project-name">Títol</label>
            <input
              id="project-name"
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
            <div className="modal-actions">
              <button type="button" className="quiet-button" onClick={() => setRenameTarget(null)}>Cancel·la</button>
              <button className="primary-button" type="submit">Desa localment</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Dashboard({ project, setView }: { project: Project; setView: (view: ViewId) => void }) {
  return (
    <div className="page-content">
      <section className="hero-grid">
        <div>
          <span className="eyebrow">Espai de treball local-first</span>
          <h1>Una atribució sòlida,<br />evidència per evidència.</h1>
          <p>
            Ordena les fonts, confronta hipòtesis i reescriu l’obra sense perdre mai la traça que sosté cada afirmació.
          </p>
        </div>
        <div className="hero-side">
          <span className="stage-label">Següent pas recomanat</span>
          <strong>Defineix les hipòtesis competitives</strong>
          <p>Comença pel consens, formula una alternativa mínima i declara la nova teoria.</p>
          <button onClick={() => setView("hipotesis")}>Obre Hipòtesis →</button>
        </div>
      </section>

      <section className="phase-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Flux metodològic</span>
            <h2>Estat de la investigació</h2>
          </div>
          <span className="outline-badge">Fase {project.phase} de 7</span>
        </div>
        <div className="phase-track">
          {phases.map((phase, index) => (
            <button key={phase} className={index <= project.phase ? "phase active" : "phase"}>
              <span>{index === 0 ? "✓" : index}</span>
              <small>{phase}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="stat-panel manuscript-panel">
          <div className="panel-topline">
            <span className="eyebrow">Manuscrit actual</span>
            <span className="status-chip live">Local</span>
          </div>
          <h3>{project.title}</h3>
          <p>La interfície no conté el document: només mostra el projecte de treball guardat en aquest dispositiu.</p>
          <div className="metrics">
            <div><strong>{project.chapters}</strong><span>capítols</span></div>
            <div><strong>{formatNumber(project.words)}</strong><span>paraules</span></div>
            <div><strong>{project.notes}</strong><span>notes</span></div>
          </div>
          <button className="text-button" onClick={() => setView("capitols")}>Gestiona els capítols →</button>
        </article>

        <article className="stat-panel">
          <div className="panel-topline">
            <span className="eyebrow">Traçabilitat</span>
            <span className="status-chip">Estructura</span>
          </div>
          <div className="trace-score"><strong>0%</strong><span>encara sense dades importades</span></div>
          <div className="bar"><span style={{ width: "2%" }} /></div>
          <ul className="check-list">
            <li><span>○</span> Afirmacions amb AID</li>
            <li><span>○</span> Evidències amb pàgina</li>
            <li><span>○</span> Inferències justificades</li>
          </ul>
          <button className="text-button" onClick={() => setView("validacio")}>Obre la validació →</button>
        </article>
      </section>

      <section className="module-strip">
        <button onClick={() => setView("fonts")}><span>01</span><strong>Fonts</strong><small>Biblioteca i extractes</small></button>
        <button onClick={() => setView("evidencies")}><span>02</span><strong>Evidències</strong><small>Registre EID</small></button>
        <button onClick={() => setView("matriu")}><span>03</span><strong>Matriu ACH</strong><small>Consistència H×E</small></button>
        <button onClick={() => setView("capitols")}><span>04</span><strong>Obra</strong><small>Versions i dossiers</small></button>
      </section>
    </div>
  );
}

function ModuleView({
  view,
  project,
  onExport,
  onImport,
}: {
  view: Exclude<ViewId, "tauler" | "salut" | "privadesa" | "fonts">;
  project: Project;
  onExport: () => void;
  onImport: () => void;
}) {
  const copy = moduleCopy[view];
  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
        <span className={copy.status === "Disponible" ? "status-chip live" : "status-chip"}>{copy.status}</span>
      </section>

      {view === "exporta" ? (
        <section className="action-grid">
          <button className="action-card" onClick={onExport}>
            <span className="action-icon">↓</span>
            <strong>Exporta el projecte</strong>
            <small>Descarrega un paquet versionat amb manifest i integritat SHA-256.</small>
          </button>
          <button className="action-card" onClick={onImport}>
            <span className="action-icon">↑</span>
            <strong>Restaura una còpia</strong>
            <small>Valida la còpia abans de restaurar-la o substituir dades locals.</small>
          </button>
        </section>
      ) : view === "capitols" ? (
        <section className="chapter-list">
          {Array.from({ length: project.chapters }, (_, index) => (
            <button key={index}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>Capítol {index + 1}</strong>
              <small>{index < 3 ? "Esborrany existent" : "Pendent d’importar"}</small>
              <em>{index < 3 ? "Revisar" : "Preparar"} →</em>
            </button>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <div className="empty-orbit"><span>{views.find((item) => item.id === view)?.short}</span></div>
          <h2>La funció ja té lloc dins del flux</h2>
          <p>
            Aquesta primera interfície permet validar l’arquitectura. En la següent iteració hi connectarem les dades reals del repositori i l’edició local.
          </p>
          <button className="primary-button">Prepara la primera acció</button>
        </section>
      )}
    </div>
  );
}

const storageLevelCopy: Record<
  StorageHealthLevel,
  { label: string; chip: string }
> = {
  ok: { label: "Estable", chip: "status-chip live" },
  info: { label: "A vigilar", chip: "status-chip" },
  warning: { label: "Atenció", chip: "status-chip warn" },
  critical: { label: "Risc alt", chip: "status-chip danger" },
};

const riskActionLabel: Record<StorageRiskAction, string> = {
  persist: "Protegeix l’espai",
  backup: "Exporta una còpia",
  "free-space": "Gestiona projectes",
};

function formatBackupDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Cap còpia encara";
  return new Intl.DateTimeFormat("ca-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StorageHealth({
  report,
  state,
  onBackup,
  onPersist,
  onManageProjects,
  onRefresh,
}: {
  report: StorageHealthReport | null;
  state: "loading" | "ready" | "error";
  onBackup: () => void;
  onPersist: () => void;
  onManageProjects: () => void;
  onRefresh: () => void;
}) {
  function runAction(action: StorageRiskAction) {
    if (action === "persist") onPersist();
    else if (action === "backup") onBackup();
    else onManageProjects();
  }

  const level = report?.level ?? "ok";
  const levelCopy = storageLevelCopy[level];

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fonaments local-first</span>
          <h1>Salut de l’emmagatzematge</h1>
          <p>
            Comprova quant espai fa servir aquest dispositiu, si el navegador
            protegeix les dades i quan vas fer l’última còpia. Res no surt del
            navegador.
          </p>
        </div>
        <span className={levelCopy.chip}>{levelCopy.label}</span>
      </section>

      {state === "loading" ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>◎</span>
          </div>
          <h2>Comprovant l’espai local…</h2>
          <p>Llegim l’ús, la quota i la protecció que ofereix el navegador.</p>
        </section>
      ) : state === "error" || !report ? (
        <section className="empty-state">
          <div className="empty-orbit">
            <span>!</span>
          </div>
          <h2>No s’ha pogut llegir l’estat de l’espai</h2>
          <p>Torna-ho a provar; les dades locals no s’han tocat.</p>
          <button className="primary-button" onClick={onRefresh}>
            Torna-ho a provar
          </button>
        </section>
      ) : (
        <>
          <section className="dashboard-grid storage-grid">
            <article className="stat-panel">
              <div className="panel-topline">
                <span className="eyebrow">Ús de l’espai</span>
                <span className="status-chip">
                  {report.supported
                    ? formatPercent(report.usageRatio)
                    : "No disponible"}
                </span>
              </div>
              {report.supported ? (
                <>
                  <div className="trace-score">
                    <strong>{formatBytes(report.usage)}</strong>
                    <span>
                      de {formatBytes(report.quota)} · {formatBytes(report.available)}{" "}
                      lliures
                    </span>
                  </div>
                  <div className="bar">
                    <span
                      style={{
                        width: `${Math.min(100, Math.round((report.usageRatio ?? 0) * 100))}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="storage-note">
                  Aquest navegador no informa de l’ús ni de la quota. Fes còpies
                  periòdiques com a protecció.
                </p>
              )}
            </article>

            <article className="stat-panel">
              <div className="panel-topline">
                <span className="eyebrow">Persistència</span>
                <span
                  className={
                    report.persisted ? "status-chip live" : "status-chip"
                  }
                >
                  {report.persisted === true
                    ? "Concedida"
                    : report.persisted === false
                      ? "No concedida"
                      : "Desconeguda"}
                </span>
              </div>
              <p className="storage-note">
                {report.persisted === true
                  ? "El navegador conserva les dades i no les esborrarà per alliberar espai."
                  : "Sense persistència, el navegador pot esborrar les dades sota pressió de disc."}
              </p>
              {report.persisted !== true && (
                <button className="text-button" onClick={onPersist}>
                  Protegeix l’espai →
                </button>
              )}
            </article>

            <article className="stat-panel">
              <div className="panel-topline">
                <span className="eyebrow">Última còpia</span>
                <span className="status-chip">
                  {formatRelativeAge(report.backupAgeMs)}
                </span>
              </div>
              <div className="trace-score">
                <strong>
                  {report.lastBackupAt
                    ? formatBackupDate(report.lastBackupAt)
                    : "Cap còpia encara"}
                </strong>
                <span>
                  {report.lastBackupAt
                    ? "còpia portàtil verificada"
                    : "exporta una còpia per poder recuperar les dades"}
                </span>
              </div>
              <button className="text-button" onClick={onBackup}>
                Exporta una còpia ara →
              </button>
            </article>
          </section>

          <section className="stat-panel storage-risks">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Avisos de risc</span>
                <h2>
                  {report.risks.length === 0
                    ? "Cap risc detectat"
                    : `${report.risks.length} ${report.risks.length === 1 ? "avís" : "avisos"}`}
                </h2>
              </div>
              <button className="quiet-button" onClick={onRefresh}>
                Actualitza
              </button>
            </div>
            {report.risks.length === 0 ? (
              <p className="storage-note">
                L’espai és estable, està protegit i tens una còpia recent.
              </p>
            ) : (
              <ul className="risk-list">
                {report.risks.map((risk) => {
                  const action = risk.action;
                  return (
                    <li key={risk.id} className={`risk risk-${risk.level}`}>
                      <div>
                        <strong>{risk.title}</strong>
                        <small>{risk.detail}</small>
                      </div>
                      {action && (
                        <button
                          className="quiet-button"
                          onClick={() => runAction(action)}
                        >
                          {riskActionLabel[action]}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function PrivacyFirewallView({
  offline,
  log,
  onToggleOffline,
  onClearLog,
}: {
  offline: boolean;
  log: FirewallLogEntry[];
  onToggleOffline: () => void;
  onClearLog: () => void;
}) {
  const blocked = log.filter((entry) => !entry.allowed).length;

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Fonaments local-first</span>
          <h1>Tallafoc de privacitat</h1>
          <p>
            Cap manuscrit, font ni anotació surt d’aquest dispositiu. El tallafoc
            bloqueja tota petició externa que no hagis autoritzat i deixa
            constància de qualsevol intent.
          </p>
        </div>
        <span className={offline ? "status-chip live" : "status-chip"}>
          {offline ? "Sense xarxa" : "Vigilant"}
        </span>
      </section>

      <section className="dashboard-grid privacy-grid">
        <article className="stat-panel">
          <div className="panel-topline">
            <span className="eyebrow">Mode sense xarxa</span>
            <span className={offline ? "status-chip live" : "status-chip"}>
              {offline ? "Actiu" : "Inactiu"}
            </span>
          </div>
          <p className="storage-note">
            Amb el mode sense xarxa, el tallafoc bloqueja qualsevol petició
            externa encara que hi hagi consentiment. Ideal per treballar amb
            fonts sensibles.
          </p>
          <button
            className="primary-button privacy-toggle"
            aria-pressed={offline}
            onClick={onToggleOffline}
          >
            {offline
              ? "Desactiva el mode sense xarxa"
              : "Activa el mode sense xarxa"}
          </button>
        </article>

        <article className="stat-panel">
          <div className="panel-topline">
            <span className="eyebrow">Consentiment previ</span>
            <span className="status-chip">Per defecte: cap</span>
          </div>
          <p className="storage-note">
            El flux principal funciona sense cap API. Cap host extern no està
            autoritzat: qualsevol connexió nova requeriria el teu consentiment
            explícit abans d’enviar res.
          </p>
        </article>
      </section>

      <section className="stat-panel privacy-inventory">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Inventari de peticions de xarxa</span>
            <h2>Només el mateix origen</h2>
          </div>
          <span className="status-chip live">Sense dades de recerca</span>
        </div>
        <ul className="inventory-list">
          {NETWORK_INVENTORY.map((entry) => (
            <li key={entry.id} className="inventory-item">
              <div>
                <strong>{entry.label}</strong>
                <small>{entry.detail}</small>
              </div>
              <div className="inventory-tags">
                <span className="status-chip live">
                  {entry.destination === "local" ? "Local" : "Extern"}
                </span>
                <span className="status-chip">
                  {entry.carriesUserData ? "Amb dades" : "Sense dades"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="stat-panel privacy-log">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Registre de peticions externes</span>
            <h2>
              {log.length === 0
                ? "Cap intent registrat"
                : `${blocked} bloquejades de ${log.length}`}
            </h2>
          </div>
          {log.length > 0 && (
            <button className="quiet-button" onClick={onClearLog}>
              Neteja el registre
            </button>
          )}
        </div>
        {log.length === 0 ? (
          <p className="storage-note">
            No s’ha detectat cap petició cap a l’exterior. Els fitxers no surten
            del dispositiu.
          </p>
        ) : (
          <ul className="risk-list">
            {log.map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                className={`risk risk-${entry.allowed ? "info" : "critical"}`}
              >
                <div>
                  <strong>{entry.host ?? entry.url}</strong>
                  <small>{entry.reason}</small>
                </div>
                <span
                  className={entry.allowed ? "status-chip" : "status-chip danger"}
                >
                  {entry.allowed ? "Permesa" : "Bloquejada"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatSourceDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium" }).format(date);
}

function SourcesLibrary({
  sources,
  errors,
  onPick,
  onImport,
  onDelete,
  onDismissErrors,
}: {
  sources: SourceRecord[];
  errors: string[];
  onPick: () => void;
  onImport: (files: FileList | File[]) => void;
  onDelete: (id: string) => void;
  onDismissErrors: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="page-content module-page">
      <section className="module-hero">
        <div>
          <span className="eyebrow">Biblioteca local</span>
          <h1>Fonts documentals</h1>
          <p>
            Importa PDF, DOCX, TXT, Markdown i imatges. Es valida el tipus i la
            mida i es registren en aquest projecte; el contingut es desarà al
            dispositiu a la funció següent.
          </p>
        </div>
        <span className="status-chip live">
          {sources.length} {sources.length === 1 ? "font" : "fonts"}
        </span>
      </section>

      <section
        className={dragging ? "dropzone dragging" : "dropzone"}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) onImport(event.dataTransfer.files);
        }}
      >
        <span className="dropzone-icon">↑</span>
        <strong>Arrossega els fitxers aquí</strong>
        <p>o selecciona’ls des del dispositiu. Màxim 25 MB per fitxer.</p>
        <button className="primary-button" onClick={onPick}>
          Selecciona fitxers
        </button>
        <small>PDF · DOCX · TXT · Markdown · imatges</small>
      </section>

      {errors.length > 0 && (
        <section className="stat-panel source-errors">
          <div className="section-heading">
            <div>
              <span className="eyebrow">No s’han pogut importar</span>
              <h2>
                {errors.length} {errors.length === 1 ? "fitxer" : "fitxers"}
              </h2>
            </div>
            <button className="quiet-button" onClick={onDismissErrors}>
              Descarta
            </button>
          </div>
          <ul className="risk-list">
            {errors.map((message, index) => (
              <li key={index} className="risk risk-critical">
                <div>
                  <small>{message}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stat-panel source-list-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Fonts d’aquest projecte</span>
            <h2>
              {sources.length === 0
                ? "Cap font encara"
                : `${sources.length} ${sources.length === 1 ? "font registrada" : "fonts registrades"}`}
            </h2>
          </div>
        </div>
        {sources.length === 0 ? (
          <p className="storage-note">
            Encara no has importat cap font. Comença arrossegant un document o una
            imatge.
          </p>
        ) : (
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.id} className="source-item">
                <span className="source-kind">{sourceKindLabel(source.kind)}</span>
                <div className="source-meta">
                  <strong>{source.name}</strong>
                  <small>
                    {formatSourceSize(source.size)} · {formatSourceDate(source.importedAt)}
                  </small>
                </div>
                <button
                  className="quiet-button danger-text"
                  onClick={() => onDelete(source.id)}
                >
                  Elimina
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
