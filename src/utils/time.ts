import dayjs from "dayjs";

export const DEFAULT_DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

export function formatDateTime(
  value?: string | number | null,
  fallback = "暂无记录",
  format = DEFAULT_DATE_TIME_FORMAT,
) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsedValue = dayjs(value);

  if (!parsedValue.isValid()) {
    return String(value);
  }

  return parsedValue.format(format);
}

export function getCurrentTimestamp() {
  return dayjs().valueOf();
}
