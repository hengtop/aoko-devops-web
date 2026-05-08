/**
 * useLogStream — SSE 实时日志流 Hook
 *
 * 接入后端 GET /log/stream/:deploymentId
 * 使用 @microsoft/fetch-event-source 支持 Authorization Header
 *
 * 行为：
 * 1. enabled=true 时建立 SSE 连接，先回放历史日志
 * 2. event:log  → 追加结构化日志行
 * 3. event:done → 记录完成状态，关闭连接
 * 4. enabled=false 或组件卸载 → abort()
 * 5. 断线续连：记录最后一条日志 id，重连时带 lastId query param
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { REQUEST_PREFIX } from "@constants/request";
import { getAccessToken } from "@service/request";

export interface LogLine {
  id?: string;
  level: "info" | "warn" | "error" | "debug";
  source?: string;
  message: string;
  serverId?: string;
  operator?: string;
  createdAt?: string;
}

export type StreamStatus = "idle" | "connecting" | "streaming" | "done" | "failed";

export interface UseLogStreamReturn {
  logs: LogLine[];
  status: StreamStatus;
  isStreaming: boolean;
  clear: () => void;
}

export function useLogStream(deploymentId: string, enabled: boolean): UseLogStreamReturn {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const lastIdRef = useRef<string | undefined>(undefined);

  const clear = useCallback(() => {
    setLogs([]);
    lastIdRef.current = undefined;
  }, []);

  useEffect(() => {
    if (!enabled || !deploymentId) {
      return;
    }

    // 新建 AbortController
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("connecting");

    const token = getAccessToken();
    const lastId = lastIdRef.current;
    const url = lastId
      ? `${REQUEST_PREFIX}${`/log/stream/${deploymentId}`}?lastId=${encodeURIComponent(lastId)}`
      : `${REQUEST_PREFIX}/log/stream/${deploymentId}`;

    fetchEventSource(url, {
      signal: ctrl.signal,
      headers: {
        Authorization: token ? `bearer ${token}` : "",
      },
      onopen: async (res) => {
        if (res.ok) {
          setStatus("streaming");
        } else {
          setStatus("failed");
          ctrl.abort();
        }
      },
      onmessage: (ev) => {
        if (ev.event === "log") {
          try {
            const line: LogLine = JSON.parse(ev.data);
            if (line.id) lastIdRef.current = line.id;
            setLogs((prev) => [...prev, line]);
          } catch {
            // 解析失败时降级为纯文本
            setLogs((prev) => [
              ...prev,
              { level: "info", message: ev.data },
            ]);
          }
        } else if (ev.event === "done") {
          setStatus("done");
          ctrl.abort();
        }
      },
      onerror: (err) => {
        if (ctrl.signal.aborted) return; // 主动关闭，不视为错误
        console.error("[useLogStream] SSE error:", err);
        setStatus("failed");
        throw err; // 抛出阻止 fetch-event-source 自动重连
      },
      openWhenHidden: true, // 页面隐藏时保持连接
    });

    return () => {
      ctrl.abort();
    };
  }, [enabled, deploymentId]);

  return {
    logs,
    status,
    isStreaming: status === "connecting" || status === "streaming",
    clear,
  };
}
