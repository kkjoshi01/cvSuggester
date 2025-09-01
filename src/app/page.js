"use client";

import { useState } from "react";

export default function Home() {
  const [cvFile, setCvFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [topJobs, setTopJobs] = useState("");
  const [painPoints, setPainPoints] = useState("");

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

  // async function getSuggestions(cvFile) {
  //   const res = await fetch("/api/suggest", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ cvFile })
  //   });
  //   return res.json();
  // }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cvFile) return;

    const fd = new FormData();
    fd.append("cv", cvFile);
    fd.append("targetRole", targetRole);
    fd.append("topJobs", topJobs);
    fd.append("painPoints", painPoints);

    const res = await fetch("/api/suggest", { method: "POST", body: fd });
    if (!res.ok) {
      const text = await res.text();
      console.error("API error:", text);
      alert(`API error: ${res.status} : ${text}`);
      return;
    }
    const data = await res.json();

    let suggestions;
    try {
      suggestions = JSON.parse(data.suggestions);
      console.log("Suggestions:", suggestions);
    } catch (error) {
      console.error("Error parsing suggestions:", error);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            CV Change Suggester
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Upload your CV and answer a few prompts. I’ll suggest targeted edits.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 p-6 shadow-sm backdrop-blur"
        >
          {/* Import CV */}
          <div>
            <label
              htmlFor="cv"
              className="block text-sm font-medium text-gray-800 dark:text-gray-200"
            >
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
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    {formatBytes(cvFile.size)}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  PDF, DOC, or DOCX
                </div>
              )}
            </div>
          </div>

          {/* Questions (column layout) */}
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label
                htmlFor="targetRole"
                className="block text-sm font-medium text-gray-800 dark:text-gray-200"
              >
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
              <label
                htmlFor="topJobs"
                className="block text-sm font-medium text-gray-800 dark:text-gray-200"
              >
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
              <label
                htmlFor="painPoints"
                className="block text-sm font-medium text-gray-800 dark:text-gray-200"
              >
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please note, this is a prototype. Your data is not stored.
            </p>
            <button
              type="submit"
              disabled={!cvFile}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Get Suggestions
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
