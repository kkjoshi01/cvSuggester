
import fs from "fs";
import formidable from "formidable";
import OpenAI  from "openai";

export const config = {
    api: {bodyParser: false},
}

function buildPrompt({targetRole, topJobs, painPoints}) {
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
    - Use exact UK formatting (e.g., “per cent” optional, “optimise/behaviour” spellings OK).
    - If information is insufficient, request the *minimum* extra detail needed as a single list under "clarifications_needed".
    `;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { fields, files } = await new Promise((resolve, reject) => {
            const form = formidable({multiples: false})
            form.parse(req, (err, fields, files) => {
                if (err) {
                    return reject(err);
                } else {
                    resolve({ fields, files });
                }
            });
        });

        const targetRole = fields.targetRole || "";
        const topJobs = fields.topJobs || "";
        const painPoints = fields.painPoints || "";
        const cv = files.cv || files.cvFile;

        if (!cv) {
            return res.status(400).json({ error: 'No CV file uploaded' });
        }

        const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
        const uploaded = await openai.files.create({
            file: fs.createReadStream(cv.path),
            purpose: 'user_data'
        });

        const prompt = buildPrompt({targetRole, topJobs, painPoints});

        const response = await openai.responses.create({
            model: 'gpt-4o-mini',
            response_format: {type: 'json_object'},
            input: [
                {
                    role: 'user',
                    content: [
                        { type: 'input_text', text: prompt },
                        { type: 'input_file', file: uploaded.id }
                    ],
                },
            ],
        });

        return res.status(200).json({
            suggestions: response.output_text,
            file_id: uploaded.id,
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: error.message });
    }
}