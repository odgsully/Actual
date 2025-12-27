'use client';

import { notFound } from 'next/navigation';
import { getCodebase } from '@/lib/codebase-learn/codebases';
import { LessonRunner } from '@/components/codebase-learn/LessonRunner';

interface PageProps {
  params: {
    codebase: string;
    section: string;
    lesson: string;
  };
}

export default function LessonPage({ params }: PageProps) {
  const { codebase: codebaseId, section: sectionId, lesson: lessonId } = params;

  const codebase = getCodebase(codebaseId);

  if (!codebase || !codebase.isImplemented) {
    notFound();
  }

  const section = codebase.sections.find((s) => s.id === sectionId);
  if (!section) {
    notFound();
  }

  const lessonIndex = section.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) {
    notFound();
  }

  const lesson = section.lessons[lessonIndex];
  const nextLesson = section.lessons[lessonIndex + 1];

  return (
    <LessonRunner
      lesson={lesson}
      codebaseId={codebaseId}
      sectionId={sectionId}
      nextLessonId={nextLesson?.id}
    />
  );
}
