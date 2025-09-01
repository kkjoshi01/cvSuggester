"use client";

import { useState } from "react";

export default function Home() {
  const [cvFile, setCvFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [topJobs, setTopJobs] = useState("");
  const [painPoints, setPainPoints] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [suggestions, setSuggestions] = useState(null); // parsed JSON from API

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setCvFile(file ?? null);
  }

  function formatBytes(bytes) {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cvFile) return;

    setErrorMsg("");
    setSuggestions(null);
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("cv", cvFile);
      fd.append("targetRole", targetRole);
      fd.append("topJobs", topJobs);
      fd.append("painPoints", painPoints);

      const res = await fetch("/api/suggest", { method: "POST", body: fd });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text}`);
      }

      const data = await res.json();

      let parsed;
      try {
        parsed = JSON.parse(data.suggestions);
      } catch (err) {
        throw new Error("Failed to parse suggestions JSON.");
      }

      setSuggestions(parsed);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-3xl px-6 py-10 relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/70 dark:bg-gray-950/70 backdrop-blur">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-gray-700" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Generating suggestions… this can take a moment.
              </p>
            </div>
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">CV Change Suggester</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Upload your CV and answer a few prompts. I’ll suggest targeted edits.
          </p>
        </header>

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-6 shadow-sm backdrop-blur"
        >
          {/* Import CV */}
          <div>
            <label htmlFor="cv" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              Import your CV
            </label>
            <div className="mt-2 flex items-center gap-3">
              <label
                htmlFor="cv"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Choose file
              </label>
              <input
                id="cv"
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="sr-only"
              />
              {cvFile ? (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{cvFile.name}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">{formatBytes(cvFile.size)}</span>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">PDF, DOC, or DOCX</div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label htmlFor="targetRole" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                What role are you targeting next?
              </label>
              <input
                id="targetRole"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Machine Learning Engineer (Computer Vision) — London"
                className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="topJobs" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Paste 2–3 job descriptions you want to match (or key requirements)
              </label>
              <textarea
                id="topJobs"
                value={topJobs}
                onChange={(e) => setTopJobs(e.target.value)}
                placeholder="Paste job ads or bullet the must-have skills/keywords…"
                rows={5}
                className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="painPoints" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Any concerns to address? (gaps, career switches, ATS worries)
              </label>
              <textarea
                id="painPoints"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="e.g., limited commercial ML, want to emphasise React + CV projects, etc."
                rows={4}
                className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Please note, this is a prototype. Your data is not stored.</p>
            <button
              type="submit"
              disabled={!cvFile || isLoading}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isLoading ? "Working…" : "Get Suggestions"}
            </button>
          </div>
        </form>

        {/* Results */}
        {suggestions && <Results suggestions={suggestions} />}
      </div>
    </main>
  );
}

/* ---------- Results component ---------- */

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2.5 py-1 text-xs">
      {children}
    </span>
  );
}

function Results({ suggestions }) {
  const {
    summary_rewrite,
    skills_to_frontload = [],
    section_order = [],
    bullet_rewrites = [],
    missing_keywords = [],
    ats_notes,
    red_flags = [],
    final_checks = [],
    clarifications_needed = [],
  } = suggestions || {};

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-2xl font-semibold">Suggestions</h2>

      {/* Summary */}
      {summary_rewrite && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tailored Summary</h3>
          <p className="text-sm leading-6">{summary_rewrite}</p>
        </div>
      )}

      {/* Skills + Section order */}
      {(skills_to_frontload.length > 0 || section_order.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {skills_to_frontload.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Skills to Front-load</h3>
              <div className="flex flex-wrap gap-2">
                {skills_to_frontload.map((s, i) => (
                  <Badge key={i}>{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {section_order.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recommended Section Order</h3>
              <div className="flex flex-wrap gap-2">
                {section_order.map((s, i) => (
                  <Badge key={i}>{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bullet rewrites */}
      {bullet_rewrites.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Bullet Rewrites</h3>
          <ul className="space-y-4">
            {bullet_rewrites.map((b, i) => (
              <li key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs text-gray-500 mb-1">{b.section}</div>
                {b.original && (
                  <p className="text-xs text-gray-500 line-through decoration-rose-400/60 mb-1">
                    {b.original}
                  </p>
                )}
                <p className="text-sm font-medium">{b.improved}</p>
                {b.rationale && (
                  <p className="mt-2 text-xs text-gray-500">
                    <span className="font-semibold">Why:</span> {b.rationale}
                  </p>
                )}
                {b.evidence_to_add && (
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-semibold">Evidence to add:</span> {b.evidence_to_add}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing keywords + ATS notes */}
      {(missing_keywords.length > 0 || ats_notes) && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">ATS & Keywords</h3>
          {missing_keywords.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">Missing keywords</div>
              <div className="flex flex-wrap gap-2">
                {missing_keywords.map((k, i) => (
                  <Badge key={i}>{k}</Badge>
                ))}
              </div>
            </div>
          )}
          {ats_notes && <p className="text-sm">{ats_notes}</p>}
        </div>
      )}

      {/* Red flags + Final checks + Clarifications */}
      {(red_flags.length || final_checks.length || clarifications_needed.length) > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {red_flags.length > 0 && (
            <CardList title="Red flags" items={red_flags} />
          )}
          {final_checks.length > 0 && (
            <CardList title="Final checks" items={final_checks} />
          )}
          {clarifications_needed.length > 0 && (
            <CardList title="Clarifications needed" items={clarifications_needed} />
          )}
        </div>
      )}
    </section>
  );
}

function CardList({ title, items }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.map((it, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gray-400 dark:bg-gray-600" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
