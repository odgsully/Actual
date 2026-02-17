'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Loader2,
  Check,
  RefreshCw,
  Calendar,
  GitCommitHorizontal,
  Flame,
} from 'lucide-react';

interface ContextDumpEntry {
  id: string;
  entry_date: string;
  goals: string;
  clarifying_answers: Array<{ question: string; answer: string }>;
  github_commit_sha: string | null;
  submitted_at: string;
}

export default function ContextDumpPage() {
  // ── Today's form state ──
  const [goals, setGoals] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questionsSource, setQuestionsSource] = useState<string>('');
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [todayEntry, setTodayEntry] = useState<ContextDumpEntry | null>(null);

  // ── History state ──
  const [history, setHistory] = useState<ContextDumpEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);

  // ── Stats ──
  const [streak, setStreak] = useState(0);

  // Load questions, stats, and history on mount
  useEffect(() => {
    fetchQuestions();
    fetchStats();
    fetchHistory(0);
  }, []);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch('/api/forms/context-dump/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
      setAnswers(new Array(data.questions?.length || 0).fill(''));
      setQuestionsSource(data.source || '');
    } catch {
      setQuestions(['What is the highest priority task right now?']);
      setAnswers(['']);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/forms/context-dump/stats');
      const data = await res.json();
      setStreak(data.currentStreak || 0);
      if (data.todayCompleted) {
        setSubmitted(true);
        // Fetch today's entry for edit
        const histRes = await fetch('/api/forms/context-dump?limit=1');
        const histData = await histRes.json();
        const today = new Date().toISOString().split('T')[0];
        const todayItem = histData.data?.find(
          (e: ContextDumpEntry) => e.entry_date === today
        );
        if (todayItem) {
          setTodayEntry(todayItem);
          setGoals(todayItem.goals);
          if (todayItem.clarifying_answers?.length > 0) {
            setQuestions(todayItem.clarifying_answers.map((qa: any) => qa.question));
            setAnswers(todayItem.clarifying_answers.map((qa: any) => qa.answer));
          }
        }
      }
    } catch {}
  };

  const fetchHistory = async (offset: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/forms/context-dump?limit=20&offset=${offset}`
      );
      const data = await res.json();
      if (offset === 0) {
        setHistory(data.data || []);
      } else {
        setHistory((prev) => [...prev, ...(data.data || [])]);
      }
      setTotalEntries(data.total || 0);
      setHistoryOffset(offset + (data.data?.length || 0));
    } catch {}
    setLoadingHistory(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!goals.trim()) return;
    setSubmitting(true);

    const clarifyingAnswers = questions
      .map((q, i) => ({ question: q, answer: answers[i]?.trim() || '' }))
      .filter((qa) => qa.answer.length > 0);

    try {
      const res = await fetch('/api/forms/context-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: goals.trim(), clarifyingAnswers }),
      });

      if (res.ok) {
        setSubmitted(true);
        fetchStats();
        fetchHistory(0);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [goals, questions, answers]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Context Dump
          </h1>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 text-orange-500">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-medium">{streak} day streak</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-8">
          Daily goals and monorepo context — saved to Supabase, committed to
          GitHub.
        </p>

        {/* ── Today's Form ── */}
        <div className="bg-card border border-border rounded-xl p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">
              {formatDate(new Date().toISOString().split('T')[0])}
            </h2>
            {submitted && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" />
                Submitted
              </span>
            )}
          </div>

          {/* Goals */}
          <label className="block text-sm font-medium text-foreground mb-2">
            What are your goals?
          </label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What do you want to accomplish today? What are you focused on this week?"
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y mb-6"
          />

          {/* Clarifying Questions */}
          {loadingQuestions ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading questions...
            </div>
          ) : (
            questions.map((question, i) => (
              <div key={i} className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {question}
                </label>
                <textarea
                  value={answers[i] || ''}
                  onChange={(e) => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder="Your answer..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                />
              </div>
            ))
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={fetchQuestions}
              disabled={loadingQuestions}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingQuestions ? 'animate-spin' : ''}`}
              />
              New questions
            </button>

            {questionsSource && (
              <span className="text-xs text-muted-foreground">
                Source: {questionsSource}
              </span>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !goals.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitted ? 'Update' : 'Submit'}
            </button>
          </div>
        </div>

        {/* ── History ── */}
        <div>
          <h2 className="text-lg font-medium text-foreground mb-4">History</h2>

          {loadingHistory && history.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No entries yet. Submit your first context dump above.
            </p>
          ) : (
            <div className="space-y-4">
              {history
                .filter((entry) => !isToday(entry.entry_date))
                .map((entry) => (
                  <details
                    key={entry.id}
                    className="group bg-card border border-border rounded-lg"
                  >
                    <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-accent transition-colors rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {formatDate(entry.entry_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.github_commit_sha && (
                          <span className="text-xs text-muted-foreground font-mono">
                            <GitCommitHorizontal className="w-3.5 h-3.5 inline mr-1" />
                            {entry.github_commit_sha.slice(0, 7)}
                          </span>
                        )}
                      </div>
                    </summary>

                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Goals
                      </h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap mb-4">
                        {entry.goals}
                      </p>

                      {entry.clarifying_answers?.length > 0 && (
                        <>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Clarifying Questions
                          </h4>
                          {entry.clarifying_answers.map((qa, i) => (
                            <div key={i} className="mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {qa.question}
                              </p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {qa.answer}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </details>
                ))}
            </div>
          )}

          {/* Load more */}
          {historyOffset < totalEntries && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchHistory(historyOffset)}
                disabled={loadingHistory}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
              >
                {loadingHistory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
