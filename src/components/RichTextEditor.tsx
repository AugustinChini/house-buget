import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./RichTextEditor.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link"],
  ["clean"],
];

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
};

const setEditorMinHeight = (
  container: HTMLDivElement | null,
  minHeight: number
) => {
  const editorElement = container?.querySelector(
    ".ql-editor"
  ) as HTMLElement | null;
  if (editorElement) {
    editorElement.style.minHeight = `${minHeight}px`;
  }
};

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
  readOnly = false,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const toolbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (toolbarRef.current) {
      toolbarRef.current.remove();
      toolbarRef.current = null;
    }

    if (!containerRef.current || quillRef.current) {
      setEditorMinHeight(containerRef.current, minHeight);
      return;
    }

    containerRef.current.innerHTML = "";

    const quill = new Quill(containerRef.current, {
      theme: "snow",
      placeholder,
      readOnly,
      modules: {
        toolbar: readOnly ? false : TOOLBAR_OPTIONS,
      },
    });

    const handleChange = () => {
      onChange(quill.root.innerHTML);
    };

    quill.on("text-change", handleChange);
    quill.clipboard.dangerouslyPasteHTML(value || "");
    setEditorMinHeight(containerRef.current, minHeight);
    const toolbarModule = quill.getModule("toolbar") as {
      container?: HTMLElement;
    };
    toolbarRef.current = toolbarModule?.container ?? null;

    quillRef.current = quill;

    return () => {
      quill.off("text-change", handleChange);
      quillRef.current = null;
      if (toolbarRef.current) {
        toolbarRef.current.remove();
        toolbarRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [minHeight, onChange, placeholder, readOnly]);

  useEffect(() => {
    setEditorMinHeight(containerRef.current, minHeight);
  }, [minHeight]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML;
    const nextHtml = value || "";

    if (currentHtml === nextHtml) return;

    const selection = quill.getSelection();
    quill.clipboard.dangerouslyPasteHTML(nextHtml);
    if (selection) {
      const length = quill.getLength();
      quill.setSelection(
        Math.min(selection.index, length - 1),
        selection.length
      );
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="quill-rich-text-editor"
      data-testid="rich-text-editor"
    />
  );
}
