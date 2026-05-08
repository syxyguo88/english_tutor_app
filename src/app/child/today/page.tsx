/* eslint-disable @next/next/no-img-element */
import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import { ExerciseType } from "@/domain/enums";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import {
  getPracticeRepository,
  type TodayPractice,
  type TodayPracticeExercise,
} from "@/lib/practice/repository";
import { ensurePrototypeSession } from "@/lib/prototype-session";
import { submitPracticeAttemptAction } from "./actions";

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
          当前原型会生成填空、看图说句子、语法找错和造句练习，作答后会立即更新掌握分和复习时间。
        </p>
      </section>

      {practice.latestAttempt ? <AttemptFeedback practice={practice} /> : null}

      {practice.exercises.length > 0 ? (
        <div style={{ display: "grid", gap: 14 }}>
          {practice.exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
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

function ExerciseCard({ exercise }: { exercise: TodayPracticeExercise }) {
  const label = exerciseLabel(exercise.type);

  return (
    <section style={cardStyle} aria-label={`${label}练习`}>
      <p style={{ margin: "0 0 8px", color: "#64748b" }}>{label}</p>
      <ExercisePrompt exercise={exercise} />
      <form action={submitPracticeAttemptAction} style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="exerciseId" value={exercise.id} />
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#334155", fontWeight: 700 }}>{label}答案</span>
          <input
            name="answer"
            required
            autoComplete="off"
            aria-label={`${label}答案`}
            style={inputStyle}
          />
        </label>
        <button type="submit" style={buttonStyle}>
          提交{label}
        </button>
      </form>
    </section>
  );
}

function ExercisePrompt({ exercise }: { exercise: TodayPracticeExercise }) {
  switch (exercise.type) {
    case ExerciseType.FillBlank:
      return <h3 style={promptHeadingStyle}>{exercise.prompt.textWithBlank}</h3>;
    case ExerciseType.PictureSentence:
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, color: "#475569" }}>{exercise.prompt.instruction}</p>
          <img
            alt="看图说句子练习图片"
            src={exercise.prompt.imageUrl}
            style={{ maxWidth: 240, borderRadius: 8, border: "1px solid #dbe3ef" }}
          />
        </div>
      );
    case ExerciseType.GrammarCorrection:
      return (
        <div>
          <p style={{ margin: "0 0 8px", color: "#475569" }}>{exercise.prompt.instruction}</p>
          <h3 style={promptHeadingStyle}>{exercise.prompt.incorrectText}</h3>
        </div>
      );
    case ExerciseType.SentenceCreation:
      return (
        <div>
          <p style={{ margin: "0 0 8px", color: "#475569" }}>{exercise.prompt.instruction}</p>
          <h3 style={promptHeadingStyle}>{exercise.prompt.targetText}</h3>
        </div>
      );
  }
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

const inputStyle: React.CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  minHeight: 42,
  padding: "8px 10px",
};

const promptHeadingStyle: React.CSSProperties = {
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
