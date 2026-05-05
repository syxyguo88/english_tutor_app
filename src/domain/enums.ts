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
