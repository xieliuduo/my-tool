import test from "node:test";
import assert from "node:assert/strict";

import { buildSideBySideDiff, formatJsonText } from "../src/utils/text-diff.js";

test("相同文本没有差异", () => {
  const result = buildSideBySideDiff("alpha\nbeta", "alpha\nbeta");

  assert.equal(result.identical, true);
  assert.deepEqual(result.summary, { added: 0, removed: 0, changed: 0, unchanged: 2 });
});

test("对齐新增和删除的行", () => {
  const result = buildSideBySideDiff("alpha\nbeta", "alpha\nnew\nbeta");

  assert.equal(result.summary.added, 1);
  assert.equal(result.rows[1].type, "added");
  assert.equal(result.rows[1].rightNumber, 2);
});

test("将相邻删除和新增识别为修改", () => {
  const result = buildSideBySideDiff("name: old\nstatus: ok", "name: new\nstatus: ok");

  assert.equal(result.summary.changed, 1);
  assert.equal(result.rows[0].type, "changed");
  assert.ok(result.rows[0].leftSegments.some((segment) => segment.changed));
  assert.ok(result.rows[0].rightSegments.some((segment) => segment.changed));
});

test("标准化不同平台的换行符", () => {
  const result = buildSideBySideDiff("a\r\nb", "a\nb");

  assert.equal(result.identical, true);
});

test("格式化 JSON 数据", () => {
  assert.equal(formatJsonText('{"name":"tool","enabled":true}'), '{\n  "name": "tool",\n  "enabled": true\n}');
});

test("拒绝无效 JSON", () => {
  assert.throws(() => formatJsonText("{bad json}"), /JSON 格式不正确/);
});
