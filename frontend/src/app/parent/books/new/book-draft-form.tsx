"use client";

import { useState } from "react";
import { createBookDraftAction } from "./actions";

export function BookDraftForm() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <form action={createBookDraftAction} style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <label style={fieldStyle}>
        <span style={labelStyle}>绘本标题</span>
        <input name="title" required placeholder="例如：My First Picture Book" style={inputStyle} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>阅读日期</span>
        <input name="readingDate" type="date" style={inputStyle} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>标签</span>
        <input name="tags" placeholder="animals, school" style={inputStyle} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>页面图片</span>
        <input
          name="pages"
          type="file"
          accept="image/*"
          multiple
          required
          onChange={(event) =>
            setSelectedFiles(Array.from(event.currentTarget.files ?? []).map((file) => file.name))
          }
          style={inputStyle}
        />
      </label>

      {selectedFiles.length > 0 ? (
        <section
          aria-label="已选择页面"
          style={{ border: "1px solid #dbe3ef", borderRadius: 8, padding: 12 }}
        >
          <p style={{ margin: "0 0 8px", color: "#64748b" }}>已选择 {selectedFiles.length} 页</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {selectedFiles.map((fileName) => (
              <li key={fileName}>{fileName}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <button type="submit" style={buttonStyle}>
        创建草稿并模拟识别
      </button>
    </form>
  );
}

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  color: "#334155",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  minHeight: 42,
  padding: "8px 10px",
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
