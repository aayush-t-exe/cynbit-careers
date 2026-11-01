"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { loadResume, onResumeChange } from "@/lib/stored-resume";

export type RoleCard = {
  slug: string;
  title: string;
  team: string;
  type: "internship" | "full-time";
  location: string;
  summary: string;
  experience: string | null;
};

type TypeFilter = "all" | "internship" | "full-time";

const typeLabels: Record<TypeFilter, string> = { all: "All", internship: "Internships", "full-time": "Full-time" };

// Every role is in the server HTML (it works and is crawlable without JS);
// the filters only narrow what is shown, and the URL keeps the filter shareable.
export function RoleBrowser({ roles, teams }: { roles: RoleCard[]; teams: string[] }) {
  const [type, setType] = useState<TypeFilter>("all");
  const [team, setTeam] = useState("all");
  const [query, setQuery] = useState("");
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [sortByFit, setSortByFit] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get("type");
    if (urlType === "internship" || urlType === "full-time") setType(urlType);
    if (params.get("team")) setTeam(params.get("team")!);
    if (params.get("q")) setQuery(params.get("q")!);

    const stored = loadResume();
    if (stored) {
      setScores(stored.scores);
      setSortByFit(true);
    }
    return onResumeChange((resume) => {
      setScores(resume?.scores ?? null);
      setSortByFit(Boolean(resume));
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (team !== "all") params.set("team", team);
    if (query) params.set("q", query);
    const search = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  }, [type, team, query]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = roles.filter(
      (role) =>
        (type === "all" || role.type === type) &&
        (team === "all" || role.team === team) &&
        (!needle || `${role.title} ${role.team} ${role.summary}`.toLowerCase().includes(needle)),
    );
    if (sortByFit && scores) return [...filtered].sort((a, b) => (scores[b.slug] ?? 0) - (scores[a.slug] ?? 0));
    return filtered;
  }, [roles, type, team, query, scores, sortByFit]);

  const grouped = sortByFit && scores
    ? [{ heading: "Sorted by fit with your résumé", items: visible }]
    : [
        { heading: "Internships", items: visible.filter((role) => role.type === "internship") },
        { heading: "Full-time roles", items: visible.filter((role) => role.type === "full-time") },
      ].filter((group) => group.items.length);

  const filtersActive = type !== "all" || team !== "all" || query;

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 bg-surface/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:px-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div role="group" aria-label="Role type" className="flex gap-1 rounded-full bg-surface-container p-1">
            {(Object.keys(typeLabels) as TypeFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => setType(value)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition lg:flex-none ${
                  type === value ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {typeLabels[value]}
              </button>
            ))}
          </div>
          <div className="flex flex-1 gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Search roles</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roles, e.g. React, marketing"
                className="field min-h-11 rounded-full pl-11"
              />
            </label>
            <label className="w-40 shrink-0 sm:w-56">
              <span className="sr-only">Team</span>
              <select value={team} onChange={(event) => setTeam(event.target.value)} className="field min-h-11 rounded-full">
                <option value="all">All teams</option>
                {teams.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-2 flex min-h-6 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant" aria-live="polite">
          <span>
            Showing <strong className="text-on-surface">{visible.length}</strong> of {roles.length} roles
          </span>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setType("all");
                setTeam("all");
                setQuery("");
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <X size={14} aria-hidden /> Clear filters
            </button>
          )}
          {scores && (
            <label className="ml-auto inline-flex cursor-pointer items-center gap-2 font-semibold">
              <input type="checkbox" checked={sortByFit} onChange={(event) => setSortByFit(event.target.checked)} className="size-4 accent-primary" />
              Sort by fit with my résumé
            </label>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="font-display text-xl font-bold">No roles match that.</p>
          <p className="mt-2 text-on-surface-variant">Try a broader word, or clear the filters to see all {roles.length}.</p>
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.heading} className="mt-6" aria-label={group.heading}>
            <h3 className="eyebrow mb-3 text-on-surface-variant">
              {group.heading} <span className="text-outline">({group.items.length})</span>
            </h3>
            <ul className="overflow-hidden rounded-[2rem] bg-white shadow-[var(--shadow-soft)]">
              {group.items.map((role, index) => (
                <li key={role.slug} className="border-b border-surface-container last:border-0" style={{ "--i": index } as CSSProperties}>
                  <Link
                    href={`/careers/${role.slug}`}
                    className="group flex items-center gap-4 px-5 py-5 transition hover:bg-surface-container-low sm:px-7"
                  >
                    {scores?.[role.slug] !== undefined && (
                      <span
                        className={`hidden w-16 shrink-0 text-center font-display text-lg font-extrabold sm:block ${
                          scores[role.slug] >= 60 ? "text-primary" : "text-outline"
                        }`}
                        title="Fit with your résumé"
                      >
                        {scores[role.slug]}%
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold leading-snug group-hover:text-primary sm:text-xl">{role.title}</p>
                      <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-on-surface-variant">
                        <span>{role.team}</span>
                        <span aria-hidden>·</span>
                        <span>{role.location}</span>
                        {role.experience && (
                          <>
                            <span aria-hidden>·</span>
                            <span>{role.experience}</span>
                          </>
                        )}
                        {scores?.[role.slug] !== undefined && (
                          <span className="font-bold text-primary sm:hidden">· {scores[role.slug]}% fit</span>
                        )}
                      </p>
                      <p className="mt-1.5 hidden text-sm text-outline md:block">{role.summary}</p>
                    </div>
                    <span className={`chip hidden sm:inline-flex ${role.type === "internship" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-primary-fixed/50 text-primary"}`}>
                      {role.type === "internship" ? "Internship" : "Full-time"}
                    </span>
                    <ArrowUpRight size={22} className="shrink-0 text-outline transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
