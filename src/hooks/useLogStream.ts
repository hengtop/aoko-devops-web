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
  buildRound?: number;
  createdAt?: string;
}

export type StreamStatus = "idle" | "connecting" | "streaming" | "done" | "failed";

export interface UseLogStreamReturn {
  logs: LogLine[];
  status: StreamStatus;
  isStreaming: boolean;
  clear: () => void;
}

export function useLogStream(
  deploymentId: string,
  enabled: boolean,
  buildRound?: number,
): UseLogStreamReturn {
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

    // 构建 query 参数：lastId（断线续连） + buildRound（按轮次过滤）
    const params = new URLSearchParams();
    if (lastId) params.set("lastId", lastId);
    if (buildRound != null) params.set("buildRound", String(buildRound));
    const qs = params.toString();
    const url = `${REQUEST_PREFIX}/log/stream/${deploymentId}${qs ? `?${qs}` : ""}`;

    fetchEventSource(url, {
      signal: ctrl.signal,
      headers: {
        Authorization: token ? `bearer ${token}` : "",
      },
      onopen: async (res) => {
        if (res.ok) {
          setStatus("streaming");
          console.debug("[useLogStream] connected", url);
        } else {
          console.warn("[useLogStream] open failed", res.status);
          setStatus("failed");
          ctrl.abort();
        }
      },
      onmessage: (ev) => {
        if (!ev.data) return;

        try {
          // NestJS @Sse 对整个 MessageEvent 对象做了一次 JSON.stringify 放入 data: 字段
          // 同时 toLogEvent 里 data 已经是 JSON.stringify(logObj)，因此需要两次 parse：
          //   第一次：ev.data → { type: "log"|"done", data: "<JSON字符串>" }
          //   第二次：outer.data → { id, level, source, message, ... }
          // 另外 ev.event 永远为 ""，需从 outer.type 判断事件类型
          const outer = JSON.parse(ev.data) as { type: string; data: string };
          const eventType = (outer.type ?? "").toLowerCase();

          if (eventType === "done") {
            setStatus("done");
            ctrl.abort();
            return;
          }

          if (eventType !== "log") return;

          const line = JSON.parse(outer.data) as LogLine;
          if (!line?.message) return;
          if (line.id) lastIdRef.current = line.id;
          setLogs((prev) => [...prev, line]);
        } catch {
          // 解析失败降级为纯文本
          setLogs((prev) => [
            ...prev,
            { level: "info" as const, message: ev.data },
          ]);
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
  }, [enabled, deploymentId, buildRound]);

  return {
    logs,
    status,
    isStreaming: status === "connecting" || status === "streaming",
    clear,
  };
}
