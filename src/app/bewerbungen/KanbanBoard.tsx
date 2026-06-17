"use client";

import { useState } from "react";
import Link from "next/link";
import { Application, ApplicationStatus, APPLICATION_STATUS_LABELS } from "@/lib/types";
import { updateApplicationAction } from "./actions";

type ColumnDef = {
  status: ApplicationStatus;
  dotColor: string;
  headerClass: string;
};

const COLUMNS: ColumnDef[] = [
  { status: "submitted",  dotColor: "bg-brand-400",  headerClass: "bg-brand-50 text-brand-700" },
  { status: "in_review",  dotColor: "bg-amber-400",  headerClass: "bg-amber-50 text-amber-700" },
  { status: "interview",  dotColor: "bg-accent-500", headerClass: "bg-accent-50 text-accent-700" },
  { status: "offer",      dotColor: "bg-green-500",  headerClass: "bg-green-50 text-green-700" },
  { status: "rejected",   dotColor: "bg-red-400",    headerClass: "bg-red-50 text-red-600" },
  { status: "withdrawn",  dotColor: "bg-slate-300",  headerClass: "bg-slate-100 text-slate-500" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface Props {
  initialApplications: Application[];
}

export default function KanbanBoard({ initialApplications }: Props) {
  const [apps, setApps] = useState<Application[]>(initialApplications);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const appsIn = (status: ApplicationStatus) => apps.filter((a) => a.status === status);

  // ── Drag & Drop ────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const onColDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== status) setDragOverCol(status);
  };

  const onColDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    const id = draggingId;
    setDraggingId(null);
    setDragOverCol(null);
    if (!id) return;
    const app = apps.find((a) => a.id === id);
    if (!app || app.status === newStatus) return;
    // Optimistic
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    await updateApplicationAction(id, { status: newStatus });
  };

  // ── Notes ──────────────────────────────────────────────────
  const openNotes = (app: Application) => {
    setEditingId(app.id);
    setNotesValue(app.notes ?? "");
  };

  const saveNotes = async (appId: string) => {
    const value = notesValue.trim() || null;
    setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, notes: value } : a)));
    setEditingId(null);
    await updateApplicationAction(appId, { notes: value });
  };

  const total = apps.length;

  return (
    <div>
      {total === 0 ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-sm">
          <p className="text-3xl">📋</p>
          <p className="mt-3 font-semibold text-slate-700">Noch keine Bewerbungen getrackt.</p>
          <p className="mt-1 text-sm text-slate-500">
            {'Öffne eine Stellenanzeige und klicke auf „Bewerbung tracken", um sie hier zu speichern.'}
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Jobs durchsuchen →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${COLUMNS.length * 292}px` }}>
            {COLUMNS.map((col) => {
              const colApps = appsIn(col.status);
              const isOver = dragOverCol === col.status;

              return (
                <div
                  key={col.status}
                  className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/60"
                  onDragOver={(e) => onColDragOver(e, col.status)}
                  onDragLeave={() => dragOverCol === col.status && setDragOverCol(null)}
                  onDrop={(e) => onColDrop(e, col.status)}
                >
                  {/* Column header */}
                  <div className={`flex items-center justify-between rounded-t-2xl px-4 py-3 ${col.headerClass}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                      {APPLICATION_STATUS_LABELS[col.status]}
                    </div>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
                      {colApps.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div
                    className={`flex min-h-[120px] flex-1 flex-col gap-3 rounded-b-2xl p-3 transition-all ${
                      isOver ? "ring-2 ring-inset ring-brand-300 bg-brand-50/30" : ""
                    }`}
                  >
                    {colApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, app.id)}
                        onDragEnd={onDragEnd}
                        className={`cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all active:cursor-grabbing ${
                          draggingId === app.id
                            ? "scale-95 opacity-40"
                            : "hover:border-brand-200 hover:shadow-md"
                        }`}
                      >
                        {/* Title */}
                        {app.job ? (
                          <Link
                            href={`/jobs/${app.job.id}`}
                            className="block text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {app.job.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-slate-900">Unbekannter Job</p>
                        )}
                        <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                          {app.job?.company ?? "–"}
                          {app.job?.location ? ` · ${app.job.location}` : ""}
                        </p>

                        {/* Meta */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {typeof app.matchScore === "number" && (
                              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-bold text-brand-600">
                                {app.matchScore}%
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{formatDate(app.appliedAt)}</span>
                          </div>
                          {app.job && (
                            <a
                              href={app.job.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-brand-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="Original-Anzeige öffnen"
                            >
                              ↗
                            </a>
                          )}
                        </div>

                        {/* Notes */}
                        {editingId === app.id ? (
                          <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              rows={3}
                              autoFocus
                              placeholder="Deine Notiz…"
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-100"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveNotes(app.id)}
                                className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg px-3 py-1 text-xs text-slate-400 hover:bg-slate-100"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNotes(app);
                            }}
                            className="mt-3 w-full rounded-lg border border-dashed border-slate-200 px-2 py-2 text-left text-xs transition-colors hover:border-brand-300 hover:text-brand-500"
                          >
                            {app.notes ? (
                              <span className="text-slate-600 line-clamp-2">{app.notes}</span>
                            ) : (
                              <span className="text-slate-400">+ Notiz hinzufügen</span>
                            )}
                          </button>
                        )}
                      </div>
                    ))}

                    {colApps.length === 0 && (
                      <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-xs text-slate-300">
                        Hierher ziehen
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
