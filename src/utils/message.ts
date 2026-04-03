import { formatDateTime } from "./time";

export function formatMessageDateTime(value?: string | number) {
  return formatDateTime(value);
}

export function buildMessageSummary(
  summary?: string,
  content?: string,
  maxLength = 72,
) {
  const text = (summary?.trim() || content?.replace(/\s+/g, " ").trim() || "").trim();

  if (!text) {
    return "暂无摘要";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function getAvatarText(name?: string) {
  const compactText = name?.replace(/\s+/g, "").trim();

  if (!compactText) {
    return "MSG";
  }

  return compactText.slice(0, 2).toUpperCase();
}

export function getReadStatusLabel(readStatus?: "unread" | "read") {
  return readStatus === "read" ? "已读" : "未读";
}

export function getMessageStatusLabel(status?: "draft" | "sent") {
  return status === "sent" ? "已发送" : "草稿";
}

export function getMessageTargetTypeLabel(targetType?: "personal" | "group" | "all") {
  if (targetType === "personal") {
    return "个人消息";
  }

  if (targetType === "group") {
    return "群发消息";
  }

  return "全员消息";
}
