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
