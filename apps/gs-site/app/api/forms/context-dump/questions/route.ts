import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/forms/context-dump/questions
 *
 * Returns today's clarifying questions. Logic:
 * - Weekdays: 2-3 questions
 * - Weekends: 1 question
 *
 * If AI_QUESTION_PROVIDER env var is set, generates questions via AI.
 * Otherwise falls back to the seeded question bank in Supabase,
 * rotating through least-recently-used questions.
 */
export async function GET() {
  try {
    const dayOfWeek = new Date().getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const questionCount = isWeekend ? 1 : Math.random() < 0.5 ? 2 : 3;

    const aiProvider = process.env.AI_QUESTION_PROVIDER;

    if (aiProvider) {
      // AI-generated questions (provider TBD)
      const questions = await generateAIQuestions(questionCount);
      if (questions.length > 0) {
        return NextResponse.json({ questions, source: "ai" });
      }
      // Fall through to DB if AI fails
    }

    // Fallback: pull from question bank, least-recently-used first
    const { data, error } = await supabase
      .from("context_dump_questions")
      .select("id, question, category")
      .eq("is_active", true)
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(questionCount);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    const questions = (data || []).map((q) => q.question);

    // Mark these questions as used and increment use_count
    if (data && data.length > 0) {
      for (const q of data) {
        await supabase
          .from("context_dump_questions")
          .update({
            last_used_at: new Date().toISOString(),
            use_count: ((q as any).use_count ?? 0) + 1,
          })
          .eq("id", q.id);
      }
    }

    return NextResponse.json({ questions, source: "database" });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── AI question generation (pluggable) ──────────────────────────

async function generateAIQuestions(count: number): Promise<string[]> {
  const provider = process.env.AI_QUESTION_PROVIDER; // "openai" | "anthropic"
  const apiKey =
    provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY;

  if (!apiKey) return [];

  const systemPrompt = `You are a daily standup facilitator for a monorepo containing:
- gs-site: Personal dashboard (pickleballisapsyop.com)
- gs-crm: Real estate CRM with glassmorphism UI
- wabbit: Gesture-driven content ranking tool (Waves 0-6 done, 5 & 7 pending)
- wabbit-re: Property ranking platform (wabbit-rank.ai)
- growthadvisory: Marketing site

Generate ${count} short, specific clarifying questions about priorities, blockers, or decisions needed.
Each question should be actionable and take less than 2 sentences to answer.
Return ONLY the questions, one per line, no numbering or bullets.`;

  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content: systemPrompt }],
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      return text
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0)
        .slice(0, count);
    } else {
      // OpenAI
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Generate ${count} clarifying questions for today's context dump.`,
            },
          ],
          max_tokens: 300,
          temperature: 0.8,
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      return text
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0)
        .slice(0, count);
    }
  } catch (err) {
    console.warn("AI question generation failed:", err);
    return [];
  }
}
