import {
  getMessageReadStatusLabel as resolveMessageReadStatusLabel,
  getMessageStatusLabel as resolveMessageStatusLabel,
  getMessageTargetTypeLabel as resolveMessageTargetTypeLabel,
} from "@constants";
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
  return resolveMessageReadStatusLabel(readStatus);
}

export function getMessageStatusLabel(status?: "draft" | "sent") {
  return resolveMessageStatusLabel(status);
}

export function getMessageTargetTypeLabel(targetType?: "personal" | "group" | "all") {
  return resolveMessageTargetTypeLabel(targetType);
}
