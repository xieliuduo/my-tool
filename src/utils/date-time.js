const TIMESTAMP_SECONDS_THRESHOLD = 100_000_000_000;

export const TIMEZONES = {
  "Asia/Shanghai": "北京时间",
  UTC: "协调世界时",
  "Asia/Tokyo": "东京时间",
  "Asia/Singapore": "新加坡时间",
  "Europe/London": "伦敦时间",
  "America/New_York": "纽约时间",
  "America/Los_Angeles": "洛杉矶时间"
};

export function normalizeTimestamp(value) {
  const normalized = String(value).trim();

  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error("请输入有效的数字时间戳");
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue)) {
    throw new Error("时间戳超出可处理范围");
  }

  const unit = Math.abs(numericValue) < TIMESTAMP_SECONDS_THRESHOLD ? "seconds" : "milliseconds";
  const milliseconds = unit === "seconds" ? numericValue * 1000 : numericValue;
  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    throw new Error("无法解析该时间戳");
  }

  return {
    date,
    unit,
    seconds: Math.trunc(milliseconds / 1000),
    milliseconds: Math.trunc(milliseconds)
  };
}

function getDateParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  return formatter.formatToParts(date).reduce((parts, item) => {
    if (item.type !== "literal") {
      parts[item.type] = item.value;
    }
    return parts;
  }, {});
}

export function formatDateInTimeZone(date, timeZone) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("无效日期");
  }

  const parts = getDateParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function formatLocalDate(date) {
  return formatDateInTimeZone(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
}

export function getTimeZoneOffset(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset"
  });
  const zoneName = formatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!zoneName || zoneName === "GMT") {
    return "UTC+00:00";
  }

  return zoneName.replace("GMT", "UTC");
}

export function parseDateString(value) {
  const normalized = String(value).trim();
  if (!normalized) {
    throw new Error("请输入需要转换的时间");
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error("无法识别该时间格式，请尝试 RFC 2822 或 ISO 8601 格式");
  }

  return date;
}
