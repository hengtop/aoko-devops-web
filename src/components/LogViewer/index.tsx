import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "antd";
import { DownOutlined } from "@ant-design/icons";
import type { LogLine } from "../../hooks/useLogStream";
import styles from "./styles.module.less";

// ── GitHub 暗色调色板 ──────────────────────────────────────
const LEVEL_COLORS: Record<LogLine["level"], string> = {
  info: "#e6edf3",
  warn: "#e3b341",
  error: "#ff7b72",
  debug: "#8b949e",
};
const SOURCE_COLOR = "#79c0ff";
const TIME_COLOR = "#484f58";

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return "";
  }
}

// ── Props ─────────────────────────────────────────────────
type LogViewerProps = {
  /** 结构化日志行（优先使用） */
  logs?: LogLine[];
  /** 纯文本内容（兼容旧用法，当 logs 为空时生效） */
  content?: string;
  loading?: boolean;
  autoScroll?: boolean;
  height?: number | string;
};

export default function LogViewer({
  logs,
  content = "",
  loading = false,
  autoScroll: autoScrollProp = true,
  height = 480,
}: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(autoScrollProp);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isProgrammaticScroll = useRef(false);

  // 用户手动上滚时暂停自动滚动
  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
    setShowScrollBtn(!isAtBottom);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (!autoScroll) return;
    const el = containerRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => { isProgrammaticScroll.current = false; });
  }, [logs, content, loading, autoScroll]);

  function scrollToBottom() {
    const el = containerRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    el.scrollTop = el.scrollHeight;
    setAutoScroll(true);
    setShowScrollBtn(false);
    requestAnimationFrame(() => { isProgrammaticScroll.current = false; });
  }

  // ── 渲染结构化日志 ─────────────────────────────────────────
  const renderStructured = (lines: LogLine[]) =>
    lines.map((line, i) => (
      <div key={line.id ?? i} className={styles.logLine}>
        <span className={styles.lineNum}>{String(i + 1).padStart(4, " ")}</span>
        <span className={styles.lineTime} style={{ color: TIME_COLOR }}>
          {formatTime(line.createdAt)}
        </span>
        {line.source && (
          <span className={styles.lineSource} style={{ color: SOURCE_COLOR }}>
            [{line.source}]
          </span>
        )}
        <span className={styles.lineText} style={{ color: LEVEL_COLORS[line.level] ?? LEVEL_COLORS.info }}>
          {line.message}
        </span>
      </div>
    ));

  // ── 渲染纯文本（兼容旧用法） ────────────────────────────────
  const renderPlain = (text: string) =>
    text.split("\n").map((line, i) => (
      <div key={i} className={styles.logLine}>
        <span className={styles.lineNum}>{String(i + 1).padStart(4, " ")}</span>
        <span className={styles.lineText}>{line}</span>
      </div>
    ));

  const hasStructured = logs && logs.length > 0;

  return (
    <div className={styles.logViewerWrapper} style={{ height }}>
      <div
        ref={containerRef}
        className={styles.logViewer}
        style={{ height: "100%" }}
        onScroll={handleScroll}
      >
        <pre className={styles.logContent}>
          {hasStructured ? renderStructured(logs) : renderPlain(content)}
          {loading && (
            <div className={styles.logLine}>
              <span className={styles.lineNum}>    </span>
              <span className={`${styles.lineText} ${styles.cursor}`}>█</span>
            </div>
          )}
          <div ref={bottomRef} />
        </pre>
      </div>

      {showScrollBtn && (
        <Button
          className={styles.scrollBtn}
          size="small"
          icon={<DownOutlined />}
          onClick={scrollToBottom}
        >
          回到底部
        </Button>
      )}
    </div>
  );
}

