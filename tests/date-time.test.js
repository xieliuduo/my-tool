import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDateInTimeZone,
  getTimeZoneOffset,
  normalizeTimestamp,
  parseDateString
} from "../src/utils/date-time.js";

test("识别秒级时间戳并转换为毫秒", () => {
  const result = normalizeTimestamp("1788427994");

  assert.equal(result.unit, "seconds");
  assert.equal(result.seconds, 1788427994);
  assert.equal(result.milliseconds, 1788427994000);
});

test("识别毫秒级时间戳", () => {
  const result = normalizeTimestamp("1788427994000");

  assert.equal(result.unit, "milliseconds");
  assert.equal(result.seconds, 1788427994);
});

test("拒绝非数字时间戳", () => {
  assert.throws(() => normalizeTimestamp("hello"), /有效的数字时间戳/);
});

test("将 GMT 示例转换成北京时间", () => {
  const date = parseDateString("Thu, 03 Sep 2026 09:33:14 GMT");

  assert.equal(formatDateInTimeZone(date, "Asia/Shanghai"), "2026-09-03 17:33:14");
  assert.equal(getTimeZoneOffset(date, "Asia/Shanghai"), "UTC+08:00");
});

test("支持 ISO 8601 输入", () => {
  const date = parseDateString("2026-09-03T09:33:14Z");

  assert.equal(date.toISOString(), "2026-09-03T09:33:14.000Z");
});

test("拒绝无法识别的日期", () => {
  assert.throws(() => parseDateString("not-a-date"), /无法识别/);
});
