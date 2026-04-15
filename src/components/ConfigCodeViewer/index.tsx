import { useMemo } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  atomOneDarkReasonable,
  atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useAppTheme } from "../../theme";
import { getConfigCodePresentation } from "./utils";
import styles from "./styles.module.less";

type CodeViewerVariant = "compact" | "full";

type ConfigCodeViewerProps = {
  content?: string;
  ext?: string;
  fileName?: string;
  variant?: CodeViewerVariant;
  showMeta?: boolean;
  showLineNumbers?: boolean;
};

export default function ConfigCodeViewer({
  content,
  ext,
  fileName,
  variant = "full",
  showMeta = true,
  showLineNumbers = variant === "full",
}: ConfigCodeViewerProps) {
  const { isDark } = useAppTheme();
  const presentation = useMemo(
    () => getConfigCodePresentation(ext, fileName, content),
    [content, ext, fileName],
  );
  const syntaxTheme = isDark ? atomOneDarkReasonable : atomOneLight;

  return (
    <div className={`${styles.viewer} ${variant === "compact" ? styles.viewerCompact : styles.viewerFull}`}>
      {showMeta ? (
        <div className={styles.viewerMeta}>
          <span className={styles.languageBadge}>{presentation.label}</span>
          <span className={styles.metaText}>{presentation.lineCount} 行</span>
          {presentation.formatted ? <span className={styles.metaText}>已格式化</span> : null}
        </div>
      ) : null}

      <div className={styles.codeShell}>
        <SyntaxHighlighter
          language={presentation.language}
          style={syntaxTheme}
          showLineNumbers={showLineNumbers}
          wrapLongLines
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: variant === "compact" ? "12px 14px" : "16px 18px",
            background: "transparent",
            fontSize: variant === "compact" ? "12px" : "13px",
            lineHeight: variant === "compact" ? 1.6 : 1.7,
          }}
          lineNumberStyle={{
            minWidth: "2.25em",
            paddingRight: "14px",
            color: "var(--code-line-number)",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                '"SFMono-Regular", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
            },
          }}
        >
          {presentation.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
