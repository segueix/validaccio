"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

type ViewId =
  | "tauler"
  | "fonts"
  | "hipotesis"
  | "evidencies"
  | "matriu"
  | "sensibilitat"
  | "capitols"
  | "validacio"
  | "exporta";

type Project = {
  id: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  phase: number;
  chapters: number;
  words: number;
  notes: number;
};

const defaultProject: Project = {
  id: "origen-tarot",
  title: "L’origen del Tarot",
  subtitle: "Obra en preparació · espai local",
  updatedAt: new Date().toISOString(),
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

const moduleCopy: Record<Exclude<ViewId, "tauler">, { eyebrow: string; title: string; body: string; status: string }> = {
  fonts: {
    eyebrow: "Biblioteca local",
    title: "Fonts i fragments",
    body: "Importa documents, registra’n la procedència i conserva cada extracte amb pàgina i context.",
    status: "Prototip",
  },
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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("workspace")) db.createObjectStore("workspace");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadProject(): Promise<Project | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("workspace", "readonly").objectStore("workspace").get("project");
    request.onsuccess = () => resolve((request.result as Project | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function persistProject(project: Project) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction("workspace", "readwrite").objectStore("workspace").put(project, "project");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ca-ES").format(value);
}

export default function Workspace() {
  const [view, setView] = useState<ViewId>("tauler");
  const [project, setProject] = useState<Project>(defaultProject);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState("Dades només en aquest dispositiu");
  const [showRename, setShowRename] = useState(false);
  const [draftTitle, setDraftTitle] = useState(defaultProject.title);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProject()
      .then((stored) => {
        if (stored) {
          setProject(stored);
          setDraftTitle(stored.title);
        } else {
          return persistProject(defaultProject);
        }
      })
      .catch(() => setNotice("No s’ha pogut obrir l’espai local"))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const next = { ...project, updatedAt: new Date().toISOString() };
      persistProject(next)
        .then(() => setSaved(true))
        .catch(() => setNotice("Error en desar localment"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [project, ready]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  function renameProject(event: FormEvent) {
    event.preventDefault();
    const clean = draftTitle.trim();
    if (!clean) return;
    setSaved(false);
    setProject((current) => ({ ...current, title: clean }));
    setShowRename(false);
  }

  async function protectStorage() {
    if (!navigator.storage?.persist) {
      setNotice("El navegador no ofereix protecció addicional");
      return;
    }
    const granted = await navigator.storage.persist();
    setNotice(granted ? "Espai local protegit pel navegador" : "Còpia periòdica recomanada");
  }

  function exportProject() {
    const payload = JSON.stringify({ format: "validaccio-project", version: 1, project }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${project.id || "projecte"}.validaccio.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice("Còpia local exportada");
  }

  function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text()
      .then((text) => JSON.parse(text))
      .then((data) => {
        if (data?.format !== "validaccio-project" || !data.project?.title) throw new Error("format");
        setSaved(false);
        setProject(data.project as Project);
        setDraftTitle(data.project.title);
        setNotice("Projecte restaurat localment");
        setView("tauler");
      })
      .catch(() => setNotice("El fitxer no és un projecte Validacció vàlid"));
    event.target.value = "";
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
            <button onClick={() => setShowRename(true)}>
              <strong>{project.title}</strong>
              <small>{project.subtitle}</small>
            </button>
          </div>
          <div className="top-actions">
            <button className="quiet-button" onClick={exportProject}>Còpia local</button>
            <button className="primary-button" onClick={() => setView("fonts")}>+ Afegeix una font</button>
          </div>
        </header>

        {view === "tauler" ? (
          <Dashboard project={project} setView={setView} />
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

      {showRename && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowRename(false)}>
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
              <button type="button" className="quiet-button" onClick={() => setShowRename(false)}>Cancel·la</button>
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
  view: Exclude<ViewId, "tauler">;
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
            <small>Descarrega les dades actuals en format Validacció JSON.</small>
          </button>
          <button className="action-card" onClick={onImport}>
            <span className="action-icon">↑</span>
            <strong>Restaura una còpia</strong>
            <small>Importa un projecte desat anteriorment en aquest dispositiu.</small>
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
