"use client";

import { FormEvent, useState } from "react";

import type { ProjectRecord } from "../lib/local-db";

type ProjectManagerProps = {
  currentProjectId: string;
  projects: ProjectRecord[];
  onArchive: (project: ProjectRecord) => void;
  onClose: () => void;
  onCreate: (title: string) => void;
  onDelete: (project: ProjectRecord) => void;
  onDuplicate: (project: ProjectRecord) => void;
  onOpen: (project: ProjectRecord) => void;
  onRename: (project: ProjectRecord) => void;
  onRestore: (project: ProjectRecord) => void;
};

export default function ProjectManager({
  currentProjectId,
  projects,
  onArchive,
  onClose,
  onCreate,
  onDelete,
  onDuplicate,
  onOpen,
  onRename,
  onRestore,
}: ProjectManagerProps) {
  const [title, setTitle] = useState("");
  const activeProjects = projects.filter((project) => !project.archivedAt);
  const archivedProjects = projects.filter((project) => project.archivedAt);

  function createProject(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onCreate(cleanTitle);
    setTitle("");
  }

  function confirmArchive(project: ProjectRecord) {
    if (
      window.confirm(
        `Vols arxivar «${project.title}»? El podràs restaurar més endavant.`,
      )
    ) {
      onArchive(project);
    }
  }

  function confirmDelete(project: ProjectRecord) {
    if (
      window.confirm(
        `Vols eliminar definitivament «${project.title}» d’aquest dispositiu? Aquesta acció no es pot desfer.`,
      )
    ) {
      onDelete(project);
    }
  }

  return (
    <div className="project-manager-backdrop" role="presentation">
      <section
        aria-labelledby="project-manager-title"
        aria-modal="true"
        className="project-manager"
        role="dialog"
      >
        <header className="project-manager-header">
          <div>
            <span className="eyebrow">Biblioteca local</span>
            <h2 id="project-manager-title">Els teus projectes</h2>
            <p>Només existeixen en aquest navegador fins que n’exportis una còpia.</p>
          </div>
          <button
            aria-label="Tanca la biblioteca de projectes"
            className="manager-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <form className="new-project-form" onSubmit={createProject}>
          <label htmlFor="new-project-title">Crea un projecte</label>
          <div>
            <input
              id="new-project-title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Títol de l’obra"
              value={title}
            />
            <button className="primary-button" disabled={!title.trim()} type="submit">
              Crea
            </button>
          </div>
        </form>

        <ProjectSection
          currentProjectId={currentProjectId}
          emptyCopy="Encara no hi ha cap projecte actiu."
          projects={activeProjects}
          title="Projectes actius"
        >
          {(project) => (
            <>
              <button className="text-button" onClick={() => onOpen(project)} type="button">
                Obre
              </button>
              <button className="text-button" onClick={() => onRename(project)} type="button">
                Reanomena
              </button>
              <button className="text-button" onClick={() => onDuplicate(project)} type="button">
                Duplica
              </button>
              <button
                className="text-button danger-text"
                disabled={activeProjects.length === 1}
                onClick={() => confirmArchive(project)}
                title={
                  activeProjects.length === 1
                    ? "Cal conservar almenys un projecte actiu"
                    : undefined
                }
                type="button"
              >
                Arxiva
              </button>
            </>
          )}
        </ProjectSection>

        {archivedProjects.length > 0 && (
          <ProjectSection
            currentProjectId={currentProjectId}
            emptyCopy=""
            projects={archivedProjects}
            title="Arxivats"
          >
            {(project) => (
              <>
                <button className="text-button" onClick={() => onRestore(project)} type="button">
                  Restaura
                </button>
                <button
                  className="text-button danger-text"
                  onClick={() => confirmDelete(project)}
                  type="button"
                >
                  Elimina
                </button>
              </>
            )}
          </ProjectSection>
        )}
      </section>
    </div>
  );
}

function ProjectSection({
  children,
  currentProjectId,
  emptyCopy,
  projects,
  title,
}: {
  children: (project: ProjectRecord) => React.ReactNode;
  currentProjectId: string;
  emptyCopy: string;
  projects: ProjectRecord[];
  title: string;
}) {
  return (
    <section className="project-section">
      <div className="project-section-title">
        <h3>{title}</h3>
        <span>{projects.length}</span>
      </div>
      {projects.length === 0 ? (
        <p className="project-empty">{emptyCopy}</p>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article
              className={
                project.id === currentProjectId
                  ? "project-card current"
                  : "project-card"
              }
              key={project.id}
            >
              <div className="project-card-copy">
                <span className="book-chip">{initials(project.title)}</span>
                <div>
                  <strong>{project.title}</strong>
                  <small>
                    {project.chapters} capítols · actualitzat{" "}
                    {new Intl.DateTimeFormat("ca-ES", {
                      day: "2-digit",
                      month: "short",
                    }).format(new Date(project.updatedAt))}
                  </small>
                </div>
              </div>
              {project.id === currentProjectId && !project.archivedAt && (
                <span className="status-chip live">Obert</span>
              )}
              <div className="project-card-actions">{children(project)}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("ca"))
    .join("");
}
