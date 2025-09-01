// app/api/suggest/route.js
import OpenAI from "openai";

export const runtime = "nodejs";          // Node for file uploading
export const dynamic = "force-dynamic";   // avoid caching responses

function toStr(v) {
  return typeof v === "string" ? v : (v ?? "").toString();
}

function buildPrompt({ targetRole, topJobs, painPoints }) {
  return `You are an expert UK-English CV editor and ATS optimizer for early-career software/ML roles.
OBJECTIVE
- Read the attached CV (PDF) and produce precise, quantifiable edits tailored to the target role.

CONTEXT
- Target role: ${targetRole || ""}
- Job requirements (paste or summarize key bullets):
${topJobs || ""}
- Candidate concerns (gaps, switches, ATS worries):
${painPoints || ""}

INSTRUCTIONS
- Optimise for clarity, impact, and ATS keyword coverage without exaggeration.
- Use strong verb + impact + metric (%, time saved, cost reduced, scale, latency, dataset size).
- Prefer British spelling and concise bullets (max ~2 lines each).
- Preserve truthfulness; if a metric is missing, suggest a plausible *range to verify*.
- If the PDF contains tables or imagery, infer relevant content for CV edits.
- Keep suggestions specific and directly actionable (quote the exact original line where possible).
- Adapt wording to early-career tone (no “visionary leader” fluff).

OUTPUT (valid JSON only)
{
  "summary_rewrite": "2-3 sentence professional summary tailored to ${targetRole || "the role"}.",
  "skills_to_frontload": ["exact keywords/tech from the job ad"],
  "section_order": ["Summary","Skills","Experience","Projects","Education","Certs"],
  "bullet_rewrites": [
    {
      "section": "Experience|Projects|Education",
      "original": "exact line from CV or empty if net-new",
      "improved": "rewritten bullet with quantification",
      "rationale": "why this is stronger",
      "evidence_to_add": "metric/log/source the candidate could verify"
    }
  ],
  "missing_keywords": ["keywords not present in CV but in job ad"],
  "ats_notes": "brief notes to improve parsing (dates, titles, locations, file naming).",
  "red_flags": ["gaps/overclaims/ambiguities to tidy"],
  "final_checks": ["keep to 1-2 pages", "consistent tense", "UK spelling", "PDF text-based not scanned"]
}

CONSTRAINTS
- Maximise signal per word. Avoid repetition.
- Use exact UK formatting (e.g., “optimise/behaviour” spellings OK).
- If information is insufficient, request the *minimum* extra detail needed as a single list under "clarifications_needed".`;
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("cv");
    const targetRole = toStr(form.get("targetRole"));
    const topJobs = toStr(form.get("topJobs"));
    const painPoints = toStr(form.get("painPoints"));

    if (!file) {
      return Response.json({ error: "No CV file uploaded" }, { status: 400 });
    }
    // Optional: basic type check
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (file.type && !allowed.includes(file.type)) {
      return Response.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Upload the PDF/Doc straight from the Blob we got from formData
    const uploaded = await openai.files.create({
      file,                 // <-- works with Web File/Blob in App Router
      purpose: "user_data",
    });

    const prompt = buildPrompt({ targetRole, topJobs, painPoints });

    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_file", file_id: uploaded.id },
          ],
        },
      ],
    });

    const suggestions =
      resp.output_text ?? (resp.output?.[0]?.content?.[0]?.text ?? "");

    return Response.json({ suggestions, file_id: uploaded.id });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
