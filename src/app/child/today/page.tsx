import { ExerciseType } from "@/domain/enums";
import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import {
  getPracticeRepository,
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
import { submitPracticeAttemptAction } from "./actions";
import { toClientExercise } from "./client-practice-exercise";
import { PracticeStepper } from "./practice-stepper";

export const dynamic = "force-dynamic";

const childNav = [
  { id: "today", href: "/child/today", label: "今天" },
  { id: "book-review", href: "/child/today", label: "绘本复习" },
  { id: "stars", href: "/child/today", label: "我的星星" },
] satisfies ReadonlyArray<AppShellNavItem>;

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

  const [practice, recentAttempts] = await Promise.all([
    (async () => {
      const t0 = childTodayProfileNow();
      const p = await practiceRepository.getTodayPractice({
        childId: session.childUserId,
        now: new Date(),
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
  ]);

  childTodayProfileLog("page_handler_total_ms", childTodayProfileNow() - pageT0);

  return (
    <AppShell title="今日练习" subtitle="Today" navItems={childNav}>
      <PracticeContent practice={practice} recentAttempts={recentAttempts} />
    </AppShell>
  );
}

function PracticeContent({
  practice,
  recentAttempts,
}: {
  practice: TodayPractice;
  recentAttempts: PracticeAttemptSummary[];
}) {
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
      <section style={cardStyle}>
        <p style={{ margin: "0 0 8px", color: "#64748b" }}>Ready?</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 26 }}>今天先从确认绘本里的练习开始</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          当前原型会生成填空、看图说句子、语法找错和造句练习；一次只做一题，可用上一题／下一题切换，作答后会立即更新掌握分和复习时间。
        </p>
      </section>

      {practice.latestAttempt ? <AttemptFeedback practice={practice} /> : null}

      {recentAttempts.length > 0 ? <RecentAttempts attempts={recentAttempts} /> : null}

      {practice.exercises.length > 0 ? (
        <PracticeStepper
          exercises={practice.exercises.map(toClientExercise)}
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
    </section>
  );
}

function AttemptFeedback({ practice }: { practice: TodayPractice }) {
  const attempt = practice.latestAttempt;

  if (!attempt) {
    return null;
  }

  return (
    <section style={cardStyle} aria-label="作答反馈">
      <h3 style={{ margin: "0 0 8px", fontSize: 22 }}>{attempt.isCorrect ? "答对了" : "再试一次"}</h3>
      <p style={{ margin: "0 0 6px", color: "#475569" }}>掌握分：{attempt.masteryScore}</p>
      <p style={{ margin: 0, color: "#475569" }}>
        下次复习：{attempt.nextReviewAt.toISOString().slice(0, 10)}
      </p>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  background: "white",
  padding: 20,
};

