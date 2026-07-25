"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExerciseType } from "@/domain/enums";
import type { PracticeExerciseDraft } from "@/domain/practice";
import type { ClientPracticeExercise } from "./client-practice-exercise";
import type { TodayPractice } from "@/lib/practice/repository";

type ExercisePromptInput = PracticeExerciseDraft & { id: string; createdOrder: number };

/** Serializable latest attempt for RSC → client (ISO date string). */
export type ClientLatestAttempt = Pick<
  NonNullable<TodayPractice["latestAttempt"]>,
  "exerciseId" | "isCorrect" | "masteryScore"
> & { nextReviewAt: string };

export type PracticeStepperProps = {
  exercises: ClientPracticeExercise[];
  latestAttempt: ClientLatestAttempt | null;
  /** Bound on the server — avoids UnrecognizedActionError when importing actions inside `"use client"`. */
  submitAttemptAction: (formData: FormData) => Promise<{ isCorrect: boolean }>;
};

export function PracticeStepper({
  exercises,
  latestAttempt,
  submitAttemptAction,
}: PracticeStepperProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = exercises.length;

  useEffect(() => {
    setIndex((previous) => {
      if (total === 0) {
        return 0;
      }
      return Math.min(previous, total - 1);
    });
  }, [total]);

  const current = useMemo(() => {
    if (total === 0) {
      return null;
    }
    return exercises[index] ?? exercises[0];
  }, [exercises, index, total]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const atIndex = index;
      setSubmitting(true);
      try {
        const result = await submitAttemptAction(formData);
        await router.refresh();
        if (!result.isCorrect) {
          return;
        }
        if (atIndex >= total - 1) {
          setSessionComplete(true);
        } else {
          setIndex(atIndex + 1);
        }
      } catch (err) {
        console.error(err);
        window.alert(err instanceof Error ? err.message : "提交失败");
      } finally {
        setSubmitting(false);
      }
    },
    [index, router, submitAttemptAction, total],
  );

  if (total === 0) {
    return null;
  }

  if (sessionComplete) {
    return (
      <section style={completeSectionStyle} aria-label="本轮练习完成">
        <h3 style={{ margin: "0 0 10px", fontSize: 22, color: "#1e293b" }}>本轮练习已完成</h3>
        <p style={{ margin: "0 0 16px", color: "#475569", lineHeight: 1.5 }}>
          你今天已经完成这一组题目。可以稍后再来，或再练一轮（从第一题开始浏览当日题目）。
        </p>
        <button
          type="button"
          onClick={() => {
            setSessionComplete(false);
            setIndex(0);
          }}
          style={secondaryButtonStyle}
        >
          再练一次
        </button>
      </section>
    );
  }

  if (!current) {
    return null;
  }

  const progressLabel = `第 ${index + 1} / ${total} 题`;
  const reviewLabel = formatReviewHint(current.mastery.nextReviewAt);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 16px",
          justifyContent: "space-between",
        }}
      >
        <p style={{ margin: 0, color: "#334155", fontWeight: 700 }} aria-live="polite">
          {progressLabel}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index <= 0}
            style={navButtonStyle}
          >
            上一题
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={index >= total - 1}
            style={navButtonStyle}
          >
            下一题
          </button>
        </div>
      </div>

      <section style={summaryStripStyle} aria-label="本题掌握概况">
        <span>连对：{current.mastery.consecutiveCorrect}</span>
        <span>掌握分：{current.mastery.masteryScore}</span>
        {reviewLabel ? <span>{reviewLabel}</span> : null}
      </section>

      {latestAttempt?.exerciseId === current.id ? (
        <AttemptFeedback attempt={latestAttempt} />
      ) : null}

      <ExerciseCard exercise={current} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

function AttemptFeedback({ attempt }: { attempt: ClientLatestAttempt }) {
  const reviewDate = new Date(attempt.nextReviewAt);
  const reviewDay =
    Number.isNaN(reviewDate.getTime()) ? attempt.nextReviewAt.slice(0, 10) : reviewDate.toISOString().slice(0, 10);

  return (
    <section style={cardStyle} aria-label="作答反馈">
      <h3 style={{ margin: "0 0 8px", fontSize: 22 }}>{attempt.isCorrect ? "答对了" : "再试一次"}</h3>
      <p style={{ margin: "0 0 6px", color: "#475569" }}>掌握分：{attempt.masteryScore}</p>
      <p style={{ margin: 0, color: "#475569" }}>下次复习：{reviewDay}</p>
    </section>
  );
}

function toExercisePromptInput(exercise: ClientPracticeExercise): ExercisePromptInput {
  const { mastery, ...draft } = exercise;
  void mastery;
  return draft as ExercisePromptInput;
}

function formatReviewHint(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `复习安排：${date.toISOString().slice(0, 10)}`;
}

function ExerciseCard({
  exercise,
  onSubmit,
  submitting,
}: {
  exercise: ClientPracticeExercise;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitting: boolean;
}) {
  const label = exerciseLabel(exercise.type);

  return (
    <section style={cardStyle} aria-label={`${label}练习`}>
      <p style={{ margin: "0 0 8px", color: "#64748b" }}>{label}</p>
      <ExercisePrompt exercise={toExercisePromptInput(exercise)} />
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="exerciseId" value={exercise.id} />
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#334155", fontWeight: 700 }}>{label}答案</span>
          <input
            name="answer"
            required
            autoComplete="off"
            aria-label={`${label}答案`}
            disabled={submitting}
            style={inputStyle}
          />
        </label>
        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? "提交中…" : `提交${label}`}
        </button>
      </form>
    </section>
  );
}

function ExercisePrompt({ exercise }: { exercise: ExercisePromptInput }) {
  switch (exercise.type) {
    case ExerciseType.FillBlank:
      return <h3 style={promptHeadingStyle}>{exercise.prompt.textWithBlank}</h3>;
    case ExerciseType.PictureSentence: {
      const prompt = exercise.prompt;
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, color: "#475569" }}>{prompt.instruction}</p>
          <img
            alt="看图说句子练习图片"
            src={prompt.imageUrl}
            style={{ maxWidth: 240, borderRadius: 8, border: "1px solid #dbe3ef" }}
          />
        </div>
      );
    }
    case ExerciseType.GrammarCorrection: {
      const prompt = exercise.prompt;
      return (
        <div>
          <p style={{ margin: "0 0 8px", color: "#475569" }}>{prompt.instruction}</p>
          <h3 style={promptHeadingStyle}>{prompt.incorrectText}</h3>
        </div>
      );
    }
    case ExerciseType.SentenceCreation: {
      const prompt = exercise.prompt;
      return (
        <div>
          <p style={{ margin: "0 0 8px", color: "#475569" }}>{prompt.instruction}</p>
          <h3 style={promptHeadingStyle}>{prompt.targetText}</h3>
        </div>
      );
    }
  }
}

const completeSectionStyle: CSSProperties = {
  background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)",
  border: "1px solid #bbf7d0",
  borderRadius: 8,
  padding: 20,
};

const secondaryButtonStyle: CSSProperties = {
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  color: "#334155",
  cursor: "pointer",
  fontWeight: 600,
  minHeight: 40,
  padding: "0 16px",
};

const summaryStripStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  color: "#475569",
  display: "flex",
  flexWrap: "wrap",
  fontSize: 14,
  gap: "8px 18px",
  padding: "10px 14px",
};

const navButtonStyle: CSSProperties = {
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  color: "#334155",
  cursor: "pointer",
  fontWeight: 600,
  minHeight: 40,
  padding: "0 14px",
};

const cardStyle: CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  background: "white",
  padding: 20,
};

const inputStyle: CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  minHeight: 42,
  padding: "8px 10px",
};

const promptHeadingStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 24,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  minHeight: 44,
  padding: "0 16px",
};

function exerciseLabel(type: ExerciseType): string {
  switch (type) {
    case ExerciseType.FillBlank:
      return "填空";
    case ExerciseType.PictureSentence:
      return "看图说句子";
    case ExerciseType.GrammarCorrection:
      return "语法找错";
    case ExerciseType.SentenceCreation:
      return "造句";
  }
}
