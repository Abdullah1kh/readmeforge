import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { search } from "@codemirror/search";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const theme = EditorView.theme({
  "&": { fontSize: "13px", height: "100%", backgroundColor: "transparent !important" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.6" },
  ".cm-gutters": { backgroundColor: "transparent !important", border: "none" },
  "&.cm-focused": { outline: "none" },
});

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={oneDark}
      extensions={[markdown(), theme, search({ top: true })]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        history: true,
        searchKeymap: true,
      }}
    />
  );
}
