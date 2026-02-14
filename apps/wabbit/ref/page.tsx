/**
 * REFERENCE COMPONENT — Originally written for Next.js App Router.
 *
 * For the Vite + React SPA build, adapt as follows:
 * - Remove 'use client' directive (everything is client-side in Vite)
 * - Replace `params.id` with React Router's `useParams()` hook
 * - Replace `@/` path aliases with Vite-configured aliases
 * - Component structure, Supabase calls, and Zustand store usage remain identical
 */

'use client'; // Remove in Vite build — not needed in SPA

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRankingStore } from '@/lib/store';
import { RankingSlider } from '@/components/RankingSlider';
import { RecordCard } from '@/components/RecordCard';

// Vite adaptation: use `const { id } = useParams()` from react-router instead of `params`
export default function CollectionPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<any>(null);

  const {
    records,
    currentRecordIndex,
    pendingScore,
    rankings,
    setCollection: setStoreCollection,
    setPendingScore,
    submitRanking,
    nextRecord,
    previousRecord,
  } = useRankingStore();

  const currentRecord = records[currentRecordIndex];
  const existingScore = currentRecord ? rankings.get(currentRecord.id) : undefined;

  useEffect(() => {
    async function load() {
      const { data: col } = await supabase
        .from('collections')
        .select('*')
        .eq('id', params.id)
        .single();

      const { data: recs } = await supabase
        .from('records')
        .select('*')
        .eq('collection_id', params.id)
        .order('sort_order', { ascending: true });

      if (col && recs) {
        setCollection(col);
        setStoreCollection(col.id, recs);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleSubmit() {
    if (!currentRecord || pendingScore === null) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('rankings').upsert(
      {
        user_id: user.id,
        record_id: currentRecord.id,
        collection_id: params.id,
        score: pendingScore,
      },
      { onConflict: 'user_id,record_id' }
    );

    if (!error) {
      submitRanking(currentRecord.id, pendingScore);
      nextRecord();
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Loading…</div>;
  }

  if (!collection || records.length === 0) {
    return <div className="py-16 text-center text-slate-400">No records found.</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{collection.title}</h1>
        <p className="text-sm text-slate-500">
          Record {currentRecordIndex + 1} of {records.length}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Record details */}
        <RecordCard record={currentRecord} existingScore={existingScore} />

        {/* Right: Ranking interaction */}
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-slate-200 p-8">
          <RankingSlider
            value={pendingScore ?? existingScore ?? 5}
            onChange={setPendingScore}
          />

          <div className="flex w-full gap-3">
            <button
              onClick={previousRecord}
              disabled={currentRecordIndex === 0}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={handleSubmit}
              disabled={pendingScore === null && existingScore === undefined}
              className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-30"
            >
              Submit & Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
