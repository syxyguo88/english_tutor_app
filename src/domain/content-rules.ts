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
