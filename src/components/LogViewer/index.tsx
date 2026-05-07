import { useEffect, useRef } from "react";
import styles from "./styles.module.less";

type LogViewerProps = {
  content?: string;
  loading?: boolean;
  autoScroll?: boolean;
  height?: number | string;
};

export default function LogViewer({
  content = "",
  loading = false,
  autoScroll = true,
  height = 480,
}: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [content, autoScroll]);

  const lines = content.split("\n");

  return (
    <div className={styles.logViewer} style={{ height }}>
      <pre className={styles.logContent}>
        {lines.map((line, i) => (
          <div key={i} className={styles.logLine}>
            <span className={styles.lineNum}>{String(i + 1).padStart(4, " ")}</span>
            <span className={styles.lineText}>{line}</span>
          </div>
        ))}
        {loading && (
          <div className={styles.logLine}>
            <span className={styles.lineNum}>    </span>
            <span className={`${styles.lineText} ${styles.cursor}`}>█</span>
          </div>
        )}
        <div ref={bottomRef} />
      </pre>
    </div>
  );
}
