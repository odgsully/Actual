import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ContextDumpSubmission {
  goals: string;
  clarifyingAnswers: Array<{ question: string; answer: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContextDumpSubmission = await request.json();

    if (!body.goals || body.goals.trim().length === 0) {
      return NextResponse.json(
        { error: "Goals field is required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const dbRecord = {
      entry_date: today,
      goals: body.goals.trim(),
      clarifying_answers: body.clarifyingAnswers ?? [],
      submitted_at: new Date().toISOString(),
    };

    // Upsert so you can update today's entry
    const { data, error } = await supabase
      .from("context_dump_submissions")
      .upsert([dbRecord], { onConflict: "entry_date" })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save context dump", details: error.message },
        { status: 500 }
      );
    }

    // Fire-and-forget: commit to GitHub
    commitToGitHub(data.id, today, body.goals, body.clarifyingAnswers).catch(
      (err) => console.warn("GitHub commit failed:", err)
    );

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        submittedAt: data.submitted_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing context dump:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("context_dump_submissions")
      .select("*", { count: "exact" })
      .order("entry_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch context dumps" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, total: count, limit, offset });
  } catch (error) {
    console.error("Error fetching context dumps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── GitHub commit helper ─────────────────────────────────────────

async function commitToGitHub(
  submissionId: string,
  date: string,
  goals: string,
  clarifyingAnswers: Array<{ question: string; answer: string }>
) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.CONTEXT_DUMP_BRANCH || "context-dumps";

  if (!token || !owner || !repo) {
    console.warn("GitHub env vars not configured — skipping commit");
    return;
  }

  const filePath = `contextdump-actions/${date}.md`;
  const markdown = buildMarkdown(date, goals, clarifyingAnswers);
  const content = Buffer.from(markdown).toString("base64");

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Check if file already exists (for update)
  let sha: string | undefined;
  try {
    const existing = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (existing.ok) {
      const existingData = await existing.json();
      sha = existingData.sha;
    }
  } catch {
    // File doesn't exist yet — that's fine
  }

  const commitBody: Record<string, unknown> = {
    message: `context-dump: ${date}`,
    content,
    branch,
  };
  if (sha) commitBody.sha = sha;

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(commitBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub API ${res.status}: ${errText}`);
  }

  const resData = await res.json();
  const commitSha = resData.commit?.sha;

  // Update the submission with the commit SHA
  if (commitSha) {
    await supabase
      .from("context_dump_submissions")
      .update({ github_commit_sha: commitSha })
      .eq("id", submissionId);
  }
}

function buildMarkdown(
  date: string,
  goals: string,
  clarifyingAnswers: Array<{ question: string; answer: string }>
) {
  const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let md = `# Context Dump — ${dayName}\n\n`;
  md += `## Goals\n\n${goals}\n\n`;

  if (clarifyingAnswers.length > 0) {
    md += `## Clarifying Questions\n\n`;
    for (const qa of clarifyingAnswers) {
      md += `### ${qa.question}\n\n${qa.answer}\n\n`;
    }
  }

  md += `---\n_Submitted via GS Site Context Dump_\n`;
  return md;
}
