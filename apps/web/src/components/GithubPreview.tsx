import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MermaidBlock } from "./MermaidBlock.js";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "align", "width", "height"],
    p: [...(defaultSchema.attributes?.p ?? []), "align"],
    div: [...(defaultSchema.attributes?.div ?? []), "align"],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "kbd"],
};

interface GithubPreviewProps {
  markdown: string;
  chrome?: boolean;
}

export function GithubPreview({ markdown, chrome = true }: GithubPreviewProps) {
  const body = (
    <div className="markdown-body" style={{ padding: chrome ? "32px 40px" : 0, maxWidth: 900, margin: "0 auto" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const value = String(children).replace(/\n$/, "");
            if (match?.[1] === "mermaid") return <MermaidBlock code={value} />;
            if (match) {
              return (
                <SyntaxHighlighter language={match[1]} style={oneDark} customStyle={{ borderRadius: 8, fontSize: 13 }}>
                  {value}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {markdown || "_Nothing to preview yet._"}
      </ReactMarkdown>
    </div>
  );

  if (!chrome) return body;

  return (
    <div style={{ background: "#0d1117", borderRadius: "var(--radius-md)", border: "1px solid #30363d", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid #30363d",
          background: "#161b22",
        }}
      >
        <span style={{ width: 11, height: 11, borderRadius: 999, background: "#ff5f56" }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: "#ffbd2e" }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: "#27c93f" }} />
        <span style={{ marginLeft: 12, fontSize: 12, color: "#8b949e", fontFamily: "var(--font-mono)" }}>README.md</span>
      </div>
      <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }} className="scrollbar-thin">
        {body}
      </div>
    </div>
  );
}
