"use client";

/**
 * RichTextAdapter — TipTap for student/teacher notes.
 * Replaceable: Lexical / Slate via same onChange(html|json) contract.
 */
import { useEffect, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type RichTextAdapterProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  dir?: "rtl" | "ltr";
};

export function RichTextAdapter({
  value,
  onChange,
  placeholder = "Write notes…",
  editable = true,
  dir = "rtl",
}: RichTextAdapterProps): ReactNode {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || `<p>${placeholder}</p>`,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        dir,
        class: "ile-tiptap-editor",
        style:
          "min-height:120px;outline:none;font-size:13px;line-height:1.55;padding:0.35rem;",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current && !editor.isFocused) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      data-adapter="tiptap"
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        background: "#fff",
        padding: "0.35rem",
      }}
    >
      {editable && editor ? (
        <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
          <button type="button" style={tb()} onClick={() => editor.chain().focus().toggleBold().run()}>
            B
          </button>
          <button type="button" style={tb()} onClick={() => editor.chain().focus().toggleItalic().run()}>
            I
          </button>
          <button
            type="button"
            style={tb()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

function tb(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 6,
    padding: "0.15rem 0.45rem",
    fontSize: 11,
    cursor: "pointer",
  };
}

export const RICH_TEXT_ADAPTER_META = {
  id: "tiptap",
  replaceWith: ["lexical", "slate"],
  license: "MIT",
  monthlyCostUsd: 0,
};
