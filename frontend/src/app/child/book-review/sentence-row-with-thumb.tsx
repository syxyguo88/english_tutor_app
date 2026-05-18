/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type SentenceThumbnailProps = {
  src: string;
  pageOrder: number;
};

export function SentenceThumbnail({ src, pageOrder }: SentenceThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = src.trim();
  if (!trimmed || failed) {
    return null;
  }
  const alt = `第 ${pageOrder} 页缩略图 · Page ${pageOrder} thumbnail`;
  return (
    <img
      src={trimmed}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        maxWidth: 120,
        width: "100%",
        height: "auto",
        borderRadius: 6,
        border: "1px solid #e2e8f0",
        flexShrink: 0,
      }}
    />
  );
}
