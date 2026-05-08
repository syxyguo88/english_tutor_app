import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import { getPracticeRepository, type TodayPractice } from "@/lib/practice/repository";
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
  const session = await ensurePrototypeSession();
  const practiceRepository = getPracticeRepository();
  const confirmedContent = await getBookIngestionRepository().getConfirmedPracticeContent();

  await practiceRepository.ensurePracticeExercisesFromConfirmedContent(confirmedContent);

  const practice = await practiceRepository.getTodayPractice({
    childId: session.childUserId,
    now: new Date(),
    limit: 5,
  });

  return (
    <AppShell title="今日练习" subtitle="Today" navItems={childNav}>
      <PracticeContent practice={practice} />
    </AppShell>
  );
}

function PracticeContent({ practice }: { practice: TodayPractice }) {
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

