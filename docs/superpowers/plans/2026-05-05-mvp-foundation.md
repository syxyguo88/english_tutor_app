# MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable foundation for the private English tutor Web App: project tooling, typed domain rules, database schema, role-aware shell UI, and verification harness.

**Architecture:** Use a Next.js App Router application with TypeScript. Keep foundation logic split into small domain modules, Prisma schema models, and route-level UI shells so later plans can add book ingestion, AI workflows, practice generation, and reports without rewriting the base.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL-compatible schema, Vitest, React Testing Library, Playwright.

---

## Scope Boundary

This plan implements the first foundation only. It intentionally does not build real OCR, AI calls, file upload, image processing, audio alignment, practice generation, grading, or production authentication. Those belong in the later plans:

- `Book Ingestion`
- `Practice And Mastery`
- `Parent And Child UX Polish`

The foundation must still encode the core business invariants from the spec:

- Parent and child roles are separate.
- Unconfirmed content cannot enter practice.
- Pages without accepted text-removed images cannot be used for picture questions.
- Audio segments must be confirmed before they can be used as exercise hints.
- Mastery stats are keyed by child, knowledge item, variant, and exercise type.

## File Structure

Create this structure:

```text
english_tutor_app/
  .env.example
  .gitignore
  eslint.config.mjs
  next.config.ts
  next-env.d.ts
  package.json
  playwright.config.ts
  postcss.config.mjs
  tailwind.config.ts
  prisma/
    schema.prisma
  src/
    app/
      globals.css
      layout.tsx
      page.tsx
      parent/
        dashboard/
          page.tsx
      child/
        today/
          page.tsx
    components/
      app-shell.tsx
      role-card.tsx
    domain/
      content-rules.test.ts
      content-rules.ts
      enums.ts
      mastery.test.ts
      mastery.ts
    lib/
      auth/
        roles.test.ts
        roles.ts
      db.ts
  tests/
    e2e/
      landing.spec.ts
  tsconfig.json
  vitest.config.ts
  vitest.setup.ts
```

Responsibility boundaries:

- `src/domain/*`: pure business rules and types; no React, Prisma, or network imports.
- `src/lib/auth/*`: role routing and temporary session helpers for the prototype.
- `prisma/schema.prisma`: persistent data model matching the spec.
- `src/app/*`: route shell and static placeholder screens for parent and child experiences.
- `tests/e2e/*`: browser-level smoke tests that prove the app routes render.

---

### Task 1: Project Tooling And Baseline App

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create package manifest**

Create `package.json` with this content:

```json
{
  "name": "english-tutor-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:validate": "prisma validate",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^6.8.2",
    "clsx": "^2.1.1",
    "lucide-react": "^0.511.0",
    "next": "^15.3.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@playwright/test": "^1.52.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.17",
    "@types/react": "^19.1.3",
    "@types/react-dom": "^19.1.3",
    "@vitejs/plugin-react": "^4.4.1",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.26.0",
    "eslint-config-next": "^15.3.2",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.3",
    "prisma": "^6.8.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vitest": "^3.1.3"
  }
}
```

- [ ] **Step 2: Create repository ignore rules**

Create `.gitignore` with this content:

```gitignore
node_modules/
.next/
out/
coverage/
test-results/
playwright-report/
.env
.env.local
.DS_Store
docs/superpowers/.DS_Store
docs/superpowers/specs/.DS_Store
*.tsbuildinfo
*.log
```

- [ ] **Step 3: Create environment example**

Create `.env.example` with this content:

```bash
DATABASE_URL="postgresql://english_tutor:english_tutor@localhost:5432/english_tutor_app?schema=public"
NEXT_PUBLIC_APP_NAME="Private English Tutor"
```

- [ ] **Step 4: Create TypeScript config**

Create `tsconfig.json` with this content:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create framework configs**

Create `next.config.ts` with this content:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default nextConfig;
```

Create `next-env.d.ts` with this content:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file is required for Next.js TypeScript projects.
```

Create `postcss.config.mjs` with this content:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

Create `tailwind.config.ts` with this content:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

Create `eslint.config.mjs` with this content:

```js
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

- [ ] **Step 6: Create test configs**

Create `vitest.config.ts` with this content:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

Create `vitest.setup.ts` with this content:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `playwright.config.ts` with this content:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
```

- [ ] **Step 7: Create baseline styles and root routes**

Create `src/app/globals.css` with this content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  --background: #f8fafc;
  --foreground: #172033;
  --muted: #64748b;
  --panel: #ffffff;
  --border: #dbe3ef;
  --accent: #2563eb;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

Create `src/app/layout.tsx` with this content:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private English Tutor",
  description: "A family English tutor prototype for picture book learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx` with this content:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <p style={{ color: "#64748b", marginBottom: 8 }}>Private English Tutor</p>
      <h1 style={{ fontSize: 36, lineHeight: 1.15, margin: "0 0 16px" }}>
        家庭自用英语绘本学习原型
      </h1>
      <p style={{ color: "#475569", maxWidth: 680 }}>
        第一阶段提供家长端和孩子端入口，后续计划会加入绘本上传、校对、练习生成和掌握度追踪。
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link href="/parent/dashboard" style={linkStyle}>
          家长端
        </Link>
        <Link href="/child/today" style={secondaryLinkStyle}>
          孩子端
        </Link>
      </div>
    </main>
  );
}

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  minHeight: 44,
  alignItems: "center",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  padding: "0 16px",
  fontWeight: 700,
};

const secondaryLinkStyle: React.CSSProperties = {
  ...linkStyle,
  background: "white",
  color: "#172033",
  border: "1px solid #dbe3ef",
};
```

- [ ] **Step 8: Install dependencies**

Run:

```bash
npm install
```

Expected: exits `0` and creates `package-lock.json`.

- [ ] **Step 9: Verify baseline typecheck**

Run:

```bash
npm run typecheck
```

Expected: exits `0`.

- [ ] **Step 10: Commit**

Run:

```bash
git add package.json package-lock.json .gitignore .env.example tsconfig.json next.config.ts next-env.d.ts postcss.config.mjs tailwind.config.ts eslint.config.mjs vitest.config.ts vitest.setup.ts playwright.config.ts src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "chore: scaffold Next.js foundation"
```

Expected: commit succeeds.

---

### Task 2: Domain Rules For Confirmation Gates

**Files:**
- Create: `src/domain/enums.ts`
- Create: `src/domain/content-rules.test.ts`
- Create: `src/domain/content-rules.ts`

- [ ] **Step 1: Write failing tests for content eligibility**

Create `src/domain/content-rules.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import {
  canUseAudioHintForPractice,
  canUsePageForPicturePractice,
  canUseSentenceForPractice,
} from "./content-rules";
import {
  AudioSegmentStatus,
  BookPageStatus,
  TextRemovedImageStatus,
} from "./enums";

describe("content practice gates", () => {
  it("blocks unconfirmed sentences from practice", () => {
    expect(canUseSentenceForPractice({ confirmedAt: null })).toBe(false);
    expect(canUseSentenceForPractice({ confirmedAt: new Date("2026-05-05") })).toBe(true);
  });

  it("requires confirmed page and accepted text-removed image for picture practice", () => {
    expect(
      canUsePageForPicturePractice({
        status: BookPageStatus.Draft,
        textRemovedImageStatus: TextRemovedImageStatus.Accepted,
      }),
    ).toBe(false);

    expect(
      canUsePageForPicturePractice({
        status: BookPageStatus.Confirmed,
        textRemovedImageStatus: TextRemovedImageStatus.Failed,
      }),
    ).toBe(false);

    expect(
      canUsePageForPicturePractice({
        status: BookPageStatus.Confirmed,
        textRemovedImageStatus: TextRemovedImageStatus.Accepted,
      }),
    ).toBe(true);
  });

  it("requires confirmed audio alignment before audio can be used as a hint", () => {
    expect(
      canUseAudioHintForPractice({
        status: AudioSegmentStatus.Draft,
        startsAtMs: 0,
        endsAtMs: 1200,
      }),
    ).toBe(false);

    expect(
      canUseAudioHintForPractice({
        status: AudioSegmentStatus.Confirmed,
        startsAtMs: 1500,
        endsAtMs: 1500,
      }),
    ).toBe(false);

    expect(
      canUseAudioHintForPractice({
        status: AudioSegmentStatus.Confirmed,
        startsAtMs: 1500,
        endsAtMs: 2800,
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/content-rules.test.ts
```

Expected: fails because `src/domain/content-rules.ts` and `src/domain/enums.ts` do not exist.

- [ ] **Step 3: Implement domain enums**

Create `src/domain/enums.ts` with this content:

```ts
export enum UserRole {
  Parent = "parent",
  Child = "child",
}

export enum BookStatus {
  Draft = "draft",
  Processing = "processing",
  ReadyForReview = "ready_for_review",
  Confirmed = "confirmed",
}

export enum BookPageStatus {
  Draft = "draft",
  Confirmed = "confirmed",
}

export enum TextRemovedImageStatus {
  NotStarted = "not_started",
  Processing = "processing",
  Accepted = "accepted",
  Failed = "failed",
  Excluded = "excluded",
}

export enum AudioSegmentStatus {
  Draft = "draft",
  Confirmed = "confirmed",
  Excluded = "excluded",
}

export enum ExerciseType {
  FillBlank = "fill_blank",
  PictureSentence = "picture_sentence",
  GrammarCorrection = "grammar_correction",
  SentenceCreation = "sentence_creation",
}

export enum KnowledgeItemType {
  Word = "word",
  Phrase = "phrase",
  Grammar = "grammar",
}

export enum AttemptInputMode {
  Keyboard = "keyboard",
  SpeechToText = "speech_to_text",
}
```

- [ ] **Step 4: Implement content gate rules**

Create `src/domain/content-rules.ts` with this content:

```ts
import {
  AudioSegmentStatus,
  BookPageStatus,
  TextRemovedImageStatus,
} from "./enums";

export type SentencePracticeGate = {
  confirmedAt: Date | null;
};

export type PagePicturePracticeGate = {
  status: BookPageStatus;
  textRemovedImageStatus: TextRemovedImageStatus;
};

export type AudioHintPracticeGate = {
  status: AudioSegmentStatus;
  startsAtMs: number;
  endsAtMs: number;
};

export function canUseSentenceForPractice(sentence: SentencePracticeGate): boolean {
  return sentence.confirmedAt instanceof Date;
}

export function canUsePageForPicturePractice(page: PagePicturePracticeGate): boolean {
  return (
    page.status === BookPageStatus.Confirmed &&
    page.textRemovedImageStatus === TextRemovedImageStatus.Accepted
  );
}

export function canUseAudioHintForPractice(segment: AudioHintPracticeGate): boolean {
  return (
    segment.status === AudioSegmentStatus.Confirmed &&
    Number.isInteger(segment.startsAtMs) &&
    Number.isInteger(segment.endsAtMs) &&
    segment.startsAtMs >= 0 &&
    segment.endsAtMs > segment.startsAtMs
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/content-rules.test.ts
```

Expected: `3 passed`.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/domain/enums.ts src/domain/content-rules.ts src/domain/content-rules.test.ts
git commit -m "feat: add content confirmation gate rules"
```

Expected: commit succeeds.

---

### Task 3: Mastery Calculation Foundation

**Files:**
- Create: `src/domain/mastery.test.ts`
- Create: `src/domain/mastery.ts`

- [ ] **Step 1: Write failing mastery tests**

Create `src/domain/mastery.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import { ExerciseType } from "./enums";
import {
  calculateNextMastery,
  createMasteryKey,
  scheduleNextReview,
} from "./mastery";

describe("mastery foundation", () => {
  it("keys mastery by child, item, variant, and exercise type", () => {
    expect(
      createMasteryKey({
        childId: "child_1",
        knowledgeItemId: "item_book",
        knowledgeVariantId: "variant_books",
        exerciseType: ExerciseType.FillBlank,
      }),
    ).toBe("child_1:item_book:variant_books:fill_blank");
  });

  it("raises mastery after a correct answer", () => {
    const next = calculateNextMastery({
      previousScore: 40,
      wasCorrect: true,
      consecutiveCorrect: 1,
    });

    expect(next).toEqual({
      score: 52,
      consecutiveCorrect: 2,
    });
  });

  it("lowers mastery and resets streak after a wrong answer", () => {
    const next = calculateNextMastery({
      previousScore: 70,
      wasCorrect: false,
      consecutiveCorrect: 3,
    });

    expect(next).toEqual({
      score: 52,
      consecutiveCorrect: 0,
    });
  });

  it("uses shorter review intervals for wrong answers", () => {
    const from = new Date("2026-05-05T00:00:00.000Z");
    expect(scheduleNextReview({ from, wasCorrect: false, consecutiveCorrect: 0 }).toISOString()).toBe(
      "2026-05-06T00:00:00.000Z",
    );
    expect(scheduleNextReview({ from, wasCorrect: true, consecutiveCorrect: 3 }).toISOString()).toBe(
      "2026-05-19T00:00:00.000Z",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/mastery.test.ts
```

Expected: fails because `src/domain/mastery.ts` does not exist.

- [ ] **Step 3: Implement mastery functions**

Create `src/domain/mastery.ts` with this content:

```ts
import { ExerciseType } from "./enums";

export type MasteryKeyInput = {
  childId: string;
  knowledgeItemId: string;
  knowledgeVariantId: string;
  exerciseType: ExerciseType;
};

export type MasteryInput = {
  previousScore: number;
  wasCorrect: boolean;
  consecutiveCorrect: number;
};

export type MasteryResult = {
  score: number;
  consecutiveCorrect: number;
};

export type ReviewScheduleInput = {
  from: Date;
  wasCorrect: boolean;
  consecutiveCorrect: number;
};

export function createMasteryKey(input: MasteryKeyInput): string {
  return [
    input.childId,
    input.knowledgeItemId,
    input.knowledgeVariantId,
    input.exerciseType,
  ].join(":");
}

export function calculateNextMastery(input: MasteryInput): MasteryResult {
  const boundedPrevious = clamp(input.previousScore, 0, 100);

  if (input.wasCorrect) {
    return {
      score: clamp(boundedPrevious + 8 + input.consecutiveCorrect * 4, 0, 100),
      consecutiveCorrect: input.consecutiveCorrect + 1,
    };
  }

  return {
    score: clamp(boundedPrevious - 18, 0, 100),
    consecutiveCorrect: 0,
  };
}

export function scheduleNextReview(input: ReviewScheduleInput): Date {
  const days = input.wasCorrect ? intervalForCorrectStreak(input.consecutiveCorrect) : 1;
  const next = new Date(input.from);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function intervalForCorrectStreak(consecutiveCorrect: number): number {
  if (consecutiveCorrect >= 5) return 30;
  if (consecutiveCorrect >= 3) return 14;
  if (consecutiveCorrect >= 2) return 7;
  return 3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/mastery.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/mastery.ts src/domain/mastery.test.ts
git commit -m "feat: add mastery scoring foundation"
```

Expected: commit succeeds.

---

### Task 4: Database Schema For MVP Foundation

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Create Prisma schema**

Create `prisma/schema.prisma` with this content:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  parent
  child
}

enum BookStatus {
  draft
  processing
  ready_for_review
  confirmed
}

enum BookPageStatus {
  draft
  confirmed
}

enum TextRemovedImageStatus {
  not_started
  processing
  accepted
  failed
  excluded
}

enum AudioSegmentStatus {
  draft
  confirmed
  excluded
}

enum KnowledgeItemType {
  word
  phrase
  grammar
}

enum ExerciseType {
  fill_blank
  picture_sentence
  grammar_correction
  sentence_creation
}

enum AttemptInputMode {
  keyboard
  speech_to_text
}

model Family {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  users     User[]
  books     Book[]
}

model User {
  id           String        @id @default(cuid())
  familyId     String
  role         UserRole
  displayName  String
  email        String?       @unique
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  family       Family        @relation(fields: [familyId], references: [id], onDelete: Cascade)
  childProfile ChildProfile?
  attempts     Attempt[]

  @@index([familyId, role])
}

model ChildProfile {
  id                 String   @id @default(cuid())
  childUserId        String   @unique
  grade              String
  interfaceLanguage  String   @default("zh-CN")
  learningPreference Json?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  childUser          User     @relation(fields: [childUserId], references: [id], onDelete: Cascade)
  interests          InterestTag[]
  masteryStats       MasteryStat[]
  reviewItems        ReviewQueueItem[]
}

model InterestTag {
  id             String       @id @default(cuid())
  childProfileId String
  label          String
  createdAt      DateTime     @default(now())
  childProfile   ChildProfile @relation(fields: [childProfileId], references: [id], onDelete: Cascade)

  @@unique([childProfileId, label])
}

model Book {
  id          String     @id @default(cuid())
  familyId    String
  title       String
  status      BookStatus @default(draft)
  readingDate DateTime?
  tags        String[]   @default([])
  confirmedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  family      Family     @relation(fields: [familyId], references: [id], onDelete: Cascade)
  pages       BookPage[]
  audioFiles  BookAudio[]
  exercises   Exercise[]

  @@index([familyId, status])
}

model BookPage {
  id                     String                 @id @default(cuid())
  bookId                 String
  pageOrder              Int
  status                 BookPageStatus          @default(draft)
  originalImageUrl        String
  textRemovedImageUrl     String?
  textRemovedImageStatus  TextRemovedImageStatus @default(not_started)
  ocrDraft                Json?
  ocrRegions              Json?
  confirmedAt             DateTime?
  createdAt               DateTime               @default(now())
  updatedAt               DateTime               @updatedAt
  book                    Book                   @relation(fields: [bookId], references: [id], onDelete: Cascade)
  sentences               Sentence[]

  @@unique([bookId, pageOrder])
  @@index([bookId, status])
}

model BookAudio {
  id              String    @id @default(cuid())
  bookId          String
  audioUrl         String
  format          String
  durationMs      Int?
  transcriptDraft Json?
  processingState String    @default("not_started")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  book            Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  segments        SentenceAudioSegment[]
}

model Sentence {
  id          String    @id @default(cuid())
  bookPageId  String
  text        String
  sourceType  String    @default("parent_confirmed")
  notes       String?
  confirmedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  bookPage    BookPage  @relation(fields: [bookPageId], references: [id], onDelete: Cascade)
  audioSegments SentenceAudioSegment[]
  knowledgeLinks SentenceKnowledgeLink[]
  exercises Exercise[]

  @@index([bookPageId, confirmedAt])
}

model SentenceAudioSegment {
  id             String             @id @default(cuid())
  sentenceId     String
  bookAudioId    String
  startsAtMs     Int
  endsAtMs       Int
  confidence     Float?
  status         AudioSegmentStatus @default(draft)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  sentence       Sentence           @relation(fields: [sentenceId], references: [id], onDelete: Cascade)
  bookAudio      BookAudio          @relation(fields: [bookAudioId], references: [id], onDelete: Cascade)

  @@index([sentenceId, status])
}

model KnowledgeItem {
  id          String            @id @default(cuid())
  type        KnowledgeItemType
  canonical   String
  tags        String[]          @default([])
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  variants    KnowledgeVariant[]
  sentenceLinks SentenceKnowledgeLink[]
  masteryStats MasteryStat[]

  @@unique([type, canonical])
}

model KnowledgeVariant {
  id              String        @id @default(cuid())
  knowledgeItemId String
  surfaceForm     String
  variantKind     String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  knowledgeItem   KnowledgeItem @relation(fields: [knowledgeItemId], references: [id], onDelete: Cascade)
  sentenceLinks   SentenceKnowledgeLink[]
  masteryStats    MasteryStat[]

  @@unique([knowledgeItemId, surfaceForm, variantKind])
}

model SentenceKnowledgeLink {
  id                 String           @id @default(cuid())
  sentenceId          String
  knowledgeItemId     String
  knowledgeVariantId  String?
  createdAt           DateTime         @default(now())
  sentence            Sentence         @relation(fields: [sentenceId], references: [id], onDelete: Cascade)
  knowledgeItem       KnowledgeItem    @relation(fields: [knowledgeItemId], references: [id], onDelete: Cascade)
  knowledgeVariant    KnowledgeVariant? @relation(fields: [knowledgeVariantId], references: [id], onDelete: SetNull)

  @@unique([sentenceId, knowledgeItemId, knowledgeVariantId])
}

model Exercise {
  id              String       @id @default(cuid())
  bookId          String?
  sentenceId      String?
  type            ExerciseType
  prompt          Json
  expectedAnswer  Json
  targetItems     Json
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  book            Book?        @relation(fields: [bookId], references: [id], onDelete: SetNull)
  sentence        Sentence?    @relation(fields: [sentenceId], references: [id], onDelete: SetNull)
  attempts        Attempt[]
  reviewItems     ReviewQueueItem[]

  @@index([type])
}

model Attempt {
  id             String           @id @default(cuid())
  exerciseId     String
  childUserId    String
  inputMode      AttemptInputMode
  answerText     String
  aiJudgment     Json?
  score          Float?
  errorTags      String[]         @default([])
  uncertainty    Float?
  parentOverride Json?
  createdAt      DateTime         @default(now())
  exercise       Exercise         @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  childUser      User             @relation(fields: [childUserId], references: [id], onDelete: Cascade)

  @@index([childUserId, createdAt])
}

model MasteryStat {
  id                  String           @id @default(cuid())
  childProfileId      String
  knowledgeItemId     String
  knowledgeVariantId  String
  exerciseType        ExerciseType
  attempts            Int              @default(0)
  errors              Int              @default(0)
  consecutiveCorrect  Int              @default(0)
  lastAttemptedAt     DateTime?
  lastErrorAt         DateTime?
  masteryScore        Int              @default(0)
  nextReviewAt        DateTime?
  updatedAt           DateTime         @updatedAt
  childProfile        ChildProfile     @relation(fields: [childProfileId], references: [id], onDelete: Cascade)
  knowledgeItem       KnowledgeItem    @relation(fields: [knowledgeItemId], references: [id], onDelete: Cascade)
  knowledgeVariant    KnowledgeVariant @relation(fields: [knowledgeVariantId], references: [id], onDelete: Cascade)

  @@unique([childProfileId, knowledgeItemId, knowledgeVariantId, exerciseType])
  @@index([childProfileId, nextReviewAt])
}

model ReviewQueueItem {
  id              String       @id @default(cuid())
  childProfileId  String
  exerciseId      String?
  dueAt           DateTime
  priority        Int          @default(0)
  sourceReason    String
  createdAt       DateTime     @default(now())
  childProfile    ChildProfile @relation(fields: [childProfileId], references: [id], onDelete: Cascade)
  exercise        Exercise?    @relation(fields: [exerciseId], references: [id], onDelete: SetNull)

  @@index([childProfileId, dueAt, priority])
}
```

- [ ] **Step 2: Create Prisma client wrapper**

Create `src/lib/db.ts` with this content:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Validate schema**

Run:

```bash
npm run prisma:validate
```

Expected: exits `0` with `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 4: Generate Prisma client**

Run:

```bash
npm run prisma:generate
```

Expected: exits `0` and generates Prisma Client.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exits `0`.

- [ ] **Step 6: Commit**

Run:

```bash
git add prisma/schema.prisma src/lib/db.ts
git commit -m "feat: add Prisma foundation schema"
```

Expected: commit succeeds.

---

### Task 5: Role Routing And App Shell

**Files:**
- Create: `src/lib/auth/roles.test.ts`
- Create: `src/lib/auth/roles.ts`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/role-card.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/parent/dashboard/page.tsx`
- Create: `src/app/child/today/page.tsx`

- [ ] **Step 1: Write failing role routing tests**

Create `src/lib/auth/roles.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import { UserRole } from "@/domain/enums";
import {
  assertCanAccessRoute,
  getDefaultRouteForRole,
  parseUserRole,
} from "./roles";

describe("role routing", () => {
  it("parses supported roles", () => {
    expect(parseUserRole("parent")).toBe(UserRole.Parent);
    expect(parseUserRole("child")).toBe(UserRole.Child);
    expect(parseUserRole("admin")).toBeNull();
  });

  it("returns default route for each role", () => {
    expect(getDefaultRouteForRole(UserRole.Parent)).toBe("/parent/dashboard");
    expect(getDefaultRouteForRole(UserRole.Child)).toBe("/child/today");
  });

  it("blocks parent-only routes for child users", () => {
    expect(assertCanAccessRoute(UserRole.Child, "/parent/dashboard")).toEqual({
      allowed: false,
      redirectTo: "/child/today",
    });
  });

  it("blocks child-only routes for parent users", () => {
    expect(assertCanAccessRoute(UserRole.Parent, "/child/today")).toEqual({
      allowed: false,
      redirectTo: "/parent/dashboard",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/lib/auth/roles.test.ts
```

Expected: fails because `src/lib/auth/roles.ts` does not exist.

- [ ] **Step 3: Implement role helpers**

Create `src/lib/auth/roles.ts` with this content:

```ts
import { UserRole } from "@/domain/enums";

export type RouteAccessResult =
  | { allowed: true; redirectTo?: never }
  | { allowed: false; redirectTo: string };

export function parseUserRole(value: string | null | undefined): UserRole | null {
  if (value === UserRole.Parent) return UserRole.Parent;
  if (value === UserRole.Child) return UserRole.Child;
  return null;
}

export function getDefaultRouteForRole(role: UserRole): "/parent/dashboard" | "/child/today" {
  return role === UserRole.Parent ? "/parent/dashboard" : "/child/today";
}

export function assertCanAccessRoute(role: UserRole, pathname: string): RouteAccessResult {
  if (pathname.startsWith("/parent") && role !== UserRole.Parent) {
    return { allowed: false, redirectTo: getDefaultRouteForRole(role) };
  }

  if (pathname.startsWith("/child") && role !== UserRole.Child) {
    return { allowed: false, redirectTo: getDefaultRouteForRole(role) };
  }

  return { allowed: true };
}
```

- [ ] **Step 4: Run role tests**

Run:

```bash
npm run test -- src/lib/auth/roles.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Create shell components**

Create `src/components/app-shell.tsx` with this content:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle: string;
  navItems: Array<{ href: string; label: string }>;
  children: ReactNode;
};

export function AppShell({ title, subtitle, navItems, children }: AppShellProps) {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          borderBottom: "1px solid #dbe3ef",
          background: "white",
          padding: "16px 20px",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 14 }}>{subtitle}</p>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>{title}</h1>
          <nav style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  border: "1px solid #dbe3ef",
                  borderRadius: 8,
                  background: "#ffffff",
                  color: "#172033",
                  padding: "8px 12px",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: 20 }}>{children}</section>
    </main>
  );
}
```

Create `src/components/role-card.tsx` with this content:

```tsx
import Link from "next/link";

type RoleCardProps = {
  href: string;
  title: string;
  description: string;
  action: string;
};

export function RoleCard({ href, title, description, action }: RoleCardProps) {
  return (
    <article
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 8,
        background: "white",
        padding: 18,
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>{title}</h2>
      <p style={{ margin: "0 0 16px", color: "#475569" }}>{description}</p>
      <Link
        href={href}
        style={{
          display: "inline-flex",
          minHeight: 40,
          alignItems: "center",
          borderRadius: 8,
          background: "#2563eb",
          color: "white",
          padding: "0 14px",
          fontWeight: 700,
        }}
      >
        {action}
      </Link>
    </article>
  );
}
```

- [ ] **Step 6: Replace landing page**

Replace `src/app/page.tsx` with this content:

```tsx
import { RoleCard } from "@/components/role-card";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <p style={{ color: "#64748b", marginBottom: 8 }}>Private English Tutor</p>
      <h1 style={{ fontSize: 36, lineHeight: 1.15, margin: "0 0 16px" }}>
        家庭自用英语绘本学习原型
      </h1>
      <p style={{ color: "#475569", maxWidth: 680 }}>
        第一阶段提供家长端和孩子端入口。后续计划会加入绘本上传、校对、练习生成和掌握度追踪。
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <RoleCard
          href="/parent/dashboard"
          title="家长端"
          description="上传绘本、校对内容、查看孩子的学习画像。"
          action="进入家长端"
        />
        <RoleCard
          href="/child/today"
          title="孩子端"
          description="完成今日练习、复习绘本句子、用键盘或语音作答。"
          action="进入孩子端"
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Create parent dashboard page**

Create `src/app/parent/dashboard/page.tsx` with this content:

```tsx
import { AppShell } from "@/components/app-shell";

const parentNav = [
  { href: "/parent/dashboard", label: "总览" },
  { href: "/parent/dashboard", label: "绘本" },
  { href: "/parent/dashboard", label: "待校对" },
  { href: "/parent/dashboard", label: "知识画像" },
];

export default function ParentDashboardPage() {
  return (
    <AppShell title="家长端" subtitle="上传、校对和查看学习进展" navItems={parentNav}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard label="待校对绘本" value="0" />
        <MetricCard label="待复核 AI 判断" value="0" />
        <MetricCard label="今日复习项" value="0" />
        <MetricCard label="低掌握度知识点" value="0" />
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <section
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 8,
        background: "white",
        padding: 18,
      }}
    >
      <p style={{ margin: "0 0 8px", color: "#64748b" }}>{label}</p>
      <strong style={{ fontSize: 32 }}>{value}</strong>
    </section>
  );
}
```

- [ ] **Step 8: Create child today page**

Create `src/app/child/today/page.tsx` with this content:

```tsx
import { AppShell } from "@/components/app-shell";

const childNav = [
  { href: "/child/today", label: "今天" },
  { href: "/child/today", label: "绘本复习" },
  { href: "/child/today", label: "我的星星" },
];

export default function ChildTodayPage() {
  return (
    <AppShell title="今日练习" subtitle="Today" navItems={childNav}>
      <section
        style={{
          border: "1px solid #dbe3ef",
          borderRadius: 8,
          background: "white",
          padding: 20,
          maxWidth: 720,
        }}
      >
        <p style={{ margin: "0 0 8px", color: "#64748b" }}>Ready?</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 26 }}>今天先从 5 道题开始</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          后续计划会在这里显示填空、看图说句子、找错和造句练习。
        </p>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 9: Run tests and typecheck**

Run:

```bash
npm run test -- src/lib/auth/roles.test.ts
npm run typecheck
```

Expected: both commands exit `0`.

- [ ] **Step 10: Commit**

Run:

```bash
git add src/lib/auth/roles.ts src/lib/auth/roles.test.ts src/components/app-shell.tsx src/components/role-card.tsx src/app/page.tsx src/app/parent/dashboard/page.tsx src/app/child/today/page.tsx
git commit -m "feat: add role-aware app shell"
```

Expected: commit succeeds.

---

### Task 6: Browser Smoke Tests

**Files:**
- Create: `tests/e2e/landing.spec.ts`

- [ ] **Step 1: Write failing browser tests**

Create `tests/e2e/landing.spec.ts` with this content:

```ts
import { expect, test } from "@playwright/test";

test("landing page links to parent and child spaces", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "家庭自用英语绘本学习原型" })).toBeVisible();
  await expect(page.getByRole("link", { name: "进入家长端" })).toHaveAttribute(
    "href",
    "/parent/dashboard",
  );
  await expect(page.getByRole("link", { name: "进入孩子端" })).toHaveAttribute(
    "href",
    "/child/today",
  );
});

test("parent dashboard renders foundation metrics", async ({ page }) => {
  await page.goto("/parent/dashboard");

  await expect(page.getByRole("heading", { name: "家长端" })).toBeVisible();
  await expect(page.getByText("待校对绘本")).toBeVisible();
  await expect(page.getByText("低掌握度知识点")).toBeVisible();
});

test("child today page renders bilingual practice shell", async ({ page }) => {
  await page.goto("/child/today");

  await expect(page.getByRole("heading", { name: "今日练习" })).toBeVisible();
  await expect(page.getByText("Ready?")).toBeVisible();
  await expect(page.getByText("今天先从 5 道题开始")).toBeVisible();
});
```

- [ ] **Step 2: Install Playwright browsers**

Run:

```bash
npx playwright install chromium webkit
```

Expected: exits `0`.

- [ ] **Step 3: Run smoke tests**

Run:

```bash
npm run test:e2e
```

Expected: `3 tests pass in each configured project`. If browser installation is missing, run:

```bash
npx playwright install
npm run test:e2e
```

Expected after installing browsers: all configured projects pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add tests/e2e/landing.spec.ts
git commit -m "test: add foundation browser smoke tests"
```

Expected: commit succeeds.

---

### Task 7: Final Foundation Verification

**Files:**
- Verify only; no file edits expected.

- [ ] **Step 1: Run unit tests**

Run:

```bash
npm run test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exits `0`.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: exits `0`.

- [ ] **Step 4: Validate Prisma schema**

Run:

```bash
npm run prisma:validate
```

Expected: exits `0` with valid schema output.

- [ ] **Step 5: Run browser smoke tests**

Run:

```bash
npm run test:e2e
```

Expected: all Playwright tests pass.

- [ ] **Step 6: Check git status**

Run:

```bash
git status --short
```

Expected: no tracked changes. `.DS_Store` files may appear as untracked if macOS recreated them; add `.gitignore` coverage or remove them before final handoff.

- [ ] **Step 7: Commit final ignore cleanup only if needed**

If `git status --short` shows untracked `.DS_Store` files, verify `.gitignore` already covers them:

```bash
git check-ignore -v docs/superpowers/.DS_Store docs/superpowers/specs/.DS_Store
```

Expected: both files are ignored by `.gitignore`.

If they are not ignored, append these exact lines to `.gitignore`:

```gitignore
docs/superpowers/.DS_Store
docs/superpowers/specs/.DS_Store
```

Then run:

```bash
git add .gitignore
git commit -m "chore: ignore macOS metadata files"
```

Expected: commit succeeds.

---

## Self-Review Checklist

- Spec coverage:
  - Parent and child role boundaries: covered by Task 5.
  - Content confirmation gates: covered by Task 2.
  - Text-removed image eligibility: covered by Task 2 and Task 4.
  - Audio alignment eligibility for hints: covered by Task 2 and Task 4.
  - Knowledge item, variant, exercise type mastery key: covered by Task 3 and Task 4.
  - Database entities from the spec: covered by Task 4.
  - Responsive Web App shell: covered by Task 1, Task 5, and Task 6.
- Items intentionally deferred:
  - Real authentication provider.
  - Real upload storage.
  - OCR, text removal, audio transcription, and audio alignment workers.
  - Practice generation and AI grading.
  - Parent reports and full child exercise UI.
- Placeholder scan:
  - The plan uses concrete file paths, commands, and code blocks for implementation steps.
  - Deferred items are explicitly out of this plan and assigned to later plans.
- Type consistency:
  - Domain enums match Prisma enum values semantically.
  - `ExerciseType.PictureSentence` is the domain name for the spec's “看图说句子”.
  - Audio hints are not represented as a separate exercise type in the foundation.
