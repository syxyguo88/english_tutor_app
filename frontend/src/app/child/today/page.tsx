import type { CSSProperties } from "react";
import { ExerciseType } from "@/domain/enums";
import { AppShell } from "@/components/app-shell";
import {
  getPracticeRepository,
  type ChildPracticeOverviewStats,
  type PracticeAttemptSummary,
  type TodayPractice,
} from "@/lib/practice/repository";
import {
  childTodayProfileLog,
  childTodayProfileNow,
  isChildTodayProfiling,
} from "@/lib/profile/child-today-profile";
import { syncConfirmedPracticeExercises } from "@/lib/practice/sync-confirmed-practice";
import { ensurePrototypeSession } from "@/lib/prototype-session";
import { childNav } from "../child-nav";
import { submitPracticeAttemptAction } from "./actions";
import { toClientExercise } from "./client-practice-exercise";
import { PracticeStepper } from "./practice-stepper";

export const dynamic = "force-dynamic";

export default async function ChildTodayPage() {
  const pageT0 = childTodayProfileNow();

  const [session] = await Promise.all([
    (async () => {
      const t0 = childTodayProfileNow();
      const s = await ensurePrototypeSession();
      childTodayProfileLog("ensurePrototypeSession", childTodayProfileNow() - t0);
      return s;
    })(),
    (async () => {
      const t0 = childTodayProfileNow();
      await syncConfirmedPracticeExercises();
      childTodayProfileLog("syncConfirmedPracticeExercises", childTodayProfileNow() - t0);
    })(),
  ]);

  const parallelSessionSyncMs = childTodayProfileNow() - pageT0;
  if (isChildTodayProfiling()) {
    childTodayProfileLog("parallel_session_sync_wall_ms", parallelSessionSyncMs);
  }

  const practiceRepository = getPracticeRepository();
  const now = new Date();

  const [practice, recentAttempts, overview] = await Promise.all([
    (async () => {
      const t0 = childTodayProfileNow();
      const p = await practiceRepository.getTodayPractice({
        childId: session.childUserId,
        now,
        limit: 5,
      });
      childTodayProfileLog("getTodayPractice", childTodayProfileNow() - t0);
      return p;
    })(),
    (async () => {
      const t0 = childTodayProfileNow();
      const a = await practiceRepository.getRecentAttempts({
        childId: session.childUserId,
        limit: 10,
      });
      childTodayProfileLog("getRecentAttempts", childTodayProfileNow() - t0);
      return a;
    })(),
    (async () => {
      const t0 = childTodayProfileNow();
      const o = await practiceRepository.getChildPracticeOverview({
        childId: session.childUserId,
        now,
      });
      childTodayProfileLog("getChildPracticeOverview", childTodayProfileNow() - t0);
      return o;
    })(),
  ]);

  childTodayProfileLog("page_handler_total_ms", childTodayProfileNow() - pageT0);

  return (
    <AppShell title="今日练习" subtitle="Today" navItems={childNav}>
      <PracticeContent
        practice={practice}
        recentAttempts={recentAttempts}
        overview={overview}
      />
    </AppShell>
  );
}

function PracticeContent({
  practice,
  recentAttempts,
  overview,
}: {
  practice: TodayPractice;
  recentAttempts: PracticeAttemptSummary[];
  overview: ChildPracticeOverviewStats;
}) {
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
      <PracticeOverviewStrip overview={overview} />

      <section style={cardStyle}>
        <p style={{ margin: "0 0 8px", color: "#64748b" }}>Ready?</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 26 }}>今天先从确认绘本里的练习开始</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          当前原型会生成填空、看图说句子、语法找错和造句练习；一次只做一题，可用上一题／下一题预览；**答对后**会自动进入下一题，答错可留在本题重试；掌握分与复习时间会随提交更新。
        </p>
      </section>

      <RecentAttempts attempts={recentAttempts} />

      {practice.exercises.length > 0 ? (
        <PracticeStepper
          exercises={practice.exercises.map(toClientExercise)}
          latestAttempt={
            practice.latestAttempt
              ? {
                  exerciseId: practice.latestAttempt.exerciseId,
                  isCorrect: practice.latestAttempt.isCorrect,
                  masteryScore: practice.latestAttempt.masteryScore,
                  nextReviewAt: practice.latestAttempt.nextReviewAt.toISOString(),
                }
              : null
          }
          submitAttemptAction={submitPracticeAttemptAction}
        />
      ) : (
        <section style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 22 }}>今天暂无待练习题目</h3>
          <p style={{ margin: 0, color: "#475569" }}>
            请先在家长端上传并确认绘本页面，或等到下一次复习时间。
          </p>
        </section>
      )}
    </div>
  );
}

const EXERCISE_TYPE_LABEL: Record<ExerciseType, string> = {
  [ExerciseType.FillBlank]: "填空",
  [ExerciseType.PictureSentence]: "看图",
  [ExerciseType.GrammarCorrection]: "语法",
  [ExerciseType.SentenceCreation]: "造句",
};

function truncateAnswerText(text: string, maxChars: number) {
  const normalized = text.trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}…`;
}

function RecentAttempts({ attempts }: { attempts: PracticeAttemptSummary[] }) {
  return (
    <section style={cardStyle} aria-label="最近作答">
      <h3 style={{ margin: "0 0 12px", fontSize: 22 }}>最近作答</h3>
      {attempts.length === 0 ? (
        <p style={{ margin: 0, color: "#475569" }}>还没有记录，完成一题后会显示在这里。</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", display: "grid", gap: 8 }}>
          {attempts.map((attempt) => (
            <li key={attempt.id} style={{ lineHeight: 1.45 }}>
              <span style={{ fontWeight: 600, color: attempt.isCorrect ? "#15803d" : "#b91c1c" }}>
                {attempt.isCorrect ? "对" : "错"}
              </span>
              <span style={{ marginLeft: 8 }}>
                [{EXERCISE_TYPE_LABEL[attempt.exerciseType]}] {truncateAnswerText(attempt.answerText, 40)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const cardStyle: CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  background: "white",
  padding: 20,
};

function PracticeOverviewStrip({ overview }: { overview: ChildPracticeOverviewStats }) {
  return (
    <section
      style={{
        ...cardStyle,
        background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
      }}
      aria-label="练习统计"
    >
      <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 14 }}>我的练习 · My stats</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>连续打卡</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#1e293b" }}>
            {overview.practiceStreakDays}
            <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>天</span>
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>Streak · local days</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>今日作答</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#1e293b" }}>
            {overview.attemptsToday}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>Today</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>累计作答</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#1e293b" }}>
            {overview.attemptsTotal}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>All time</p>
        </div>
      </div>
    </section>
  );
}

