import {
  TIMEZONES,
  formatDateInTimeZone,
  formatLocalDate,
  getTimeZoneOffset,
  normalizeTimestamp,
  parseDateString
} from "./src/utils/date-time.js";
import { buildSideBySideDiff, formatJsonText } from "./src/utils/text-diff.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const AVAILABLE_TOOLS = new Set(["timestamp", "timezone", "diff"]);
const TOOL_TITLES = {
  timestamp: "时间戳转换",
  timezone: "时间转换",
  diff: "文本 / 数据对比"
};

const elements = {
  liveTimestamp: $("#liveTimestamp"),
  timestampInput: $("#timestampInput"),
  timestampUnit: $("#timestampUnit"),
  timestampError: $("#timestampError"),
  dateStringInput: $("#dateStringInput"),
  timezoneSelect: $("#timezoneSelect"),
  timezoneError: $("#timezoneError"),
  timezoneLabel: $("#timezoneLabel"),
  timezoneOffset: $("#timezoneOffset"),
  parsedDate: $("#parsedDate"),
  convertedDate: $("#convertedDate"),
  leftDiffInput: $("#leftDiffInput"),
  rightDiffInput: $("#rightDiffInput"),
  diffView: $("#diffView"),
  diffSummary: $("#diffSummary"),
  diffError: $("#diffError"),
  toast: $("#toast")
};

let toastTimer;
let diffTimer;

function setText(id, value) {
  $(`#${id}`).textContent = value;
}

function updateLiveTimestamp() {
  elements.liveTimestamp.textContent = Math.floor(Date.now() / 1000);
}

function resetTimestampResults() {
  elements.timestampUnit.textContent = "自动识别秒 / 毫秒";
  elements.timestampError.textContent = "";
  setText("beijingTime", "等待输入");
  ["localTime", "utcTime", "secondsValue", "millisecondsValue"].forEach((id) => setText(id, "—"));
}

function convertTimestamp() {
  const value = elements.timestampInput.value;
  if (!value.trim()) {
    resetTimestampResults();
    return;
  }

  try {
    const result = normalizeTimestamp(value);
    elements.timestampError.textContent = "";
    elements.timestampUnit.textContent = result.unit === "seconds" ? "已识别：秒" : "已识别：毫秒";
    setText("beijingTime", formatDateInTimeZone(result.date, "Asia/Shanghai"));
    setText("localTime", formatLocalDate(result.date));
    setText("utcTime", result.date.toISOString());
    setText("secondsValue", String(result.seconds));
    setText("millisecondsValue", String(result.milliseconds));
  } catch (error) {
    resetTimestampResults();
    elements.timestampError.textContent = error.message;
  }
}

function resetTimezoneResult() {
  elements.timezoneError.textContent = "";
  elements.parsedDate.textContent = "等待输入";
  elements.convertedDate.textContent = "—";
  updateTimezoneMetadata();
}

function updateTimezoneMetadata(date = new Date()) {
  const timeZone = elements.timezoneSelect.value;
  elements.timezoneLabel.textContent = TIMEZONES[timeZone] ?? timeZone;
  elements.timezoneOffset.textContent = `${timeZone} · ${getTimeZoneOffset(date, timeZone)}`;
}

function convertTimezone() {
  const value = elements.dateStringInput.value;
  if (!value.trim()) {
    resetTimezoneResult();
    return;
  }

  try {
    const date = parseDateString(value);
    const timeZone = elements.timezoneSelect.value;
    elements.timezoneError.textContent = "";
    elements.parsedDate.textContent = date.toISOString();
    elements.convertedDate.textContent = formatDateInTimeZone(date, timeZone);
    updateTimezoneMetadata(date);
  } catch (error) {
    resetTimezoneResult();
    elements.timezoneError.textContent = error.message;
  }
}

function switchTool(tool, syncHash = true) {
  const nextTool = AVAILABLE_TOOLS.has(tool) ? tool : "timestamp";
  $$(".tool-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tool === nextTool));
  $$(".tool-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === nextTool));
  document.title = `${TOOL_TITLES[nextTool]} · 研发工具箱`;

  if (syncHash && window.location.hash !== `#${nextTool}`) {
    history.replaceState(null, "", `#${nextTool}`);
  }
}

function appendSegments(container, segments, side) {
  if (segments.length === 0) {
    container.textContent = " ";
    return;
  }

  segments.forEach((segment) => {
    const span = document.createElement("span");
    span.textContent = segment.text || " ";
    if (segment.changed) {
      span.className = side === "left" ? "diff-inline-left" : "diff-inline-right";
    }
    container.appendChild(span);
  });
}

function createDiffCell(side, lineNumber, segments) {
  const cell = document.createElement("div");
  cell.className = `diff-cell diff-cell-${side}`;

  const number = document.createElement("span");
  number.className = "diff-line-number";
  number.textContent = lineNumber ?? "";

  const code = document.createElement("pre");
  code.className = "diff-code";
  appendSegments(code, segments, side);

  cell.append(number, code);
  return cell;
}

function renderDiff() {
  elements.diffError.textContent = "";
  elements.diffView.replaceChildren();
  elements.diffView.classList.remove("is-identical");

  try {
    const result = buildSideBySideDiff(elements.leftDiffInput.value, elements.rightDiffInput.value);
    const { added, removed, changed } = result.summary;
    elements.diffSummary.innerHTML = `
      <strong>${result.identical ? "内容完全一致" : "发现差异"}</strong>
      <span class="summary-added">+${added} 新增</span>
      <span class="summary-removed">−${removed} 删除</span>
      <span class="summary-changed">~${changed} 修改</span>
    `;

    if (result.rows.length === 0) {
      const empty = document.createElement("div");
      empty.className = "diff-empty";
      empty.textContent = "两侧内容均为空";
      elements.diffView.appendChild(empty);
      elements.diffView.classList.add("is-identical");
      return;
    }

    result.rows.forEach((row) => {
      const line = document.createElement("div");
      line.className = `diff-row is-${row.type}`;
      line.append(
        createDiffCell("left", row.leftNumber, row.leftSegments),
        createDiffCell("right", row.rightNumber, row.rightSegments)
      );
      elements.diffView.appendChild(line);
    });

    if (result.identical) {
      elements.diffView.classList.add("is-identical");
    }
  } catch (error) {
    elements.diffError.textContent = error.message;
    const empty = document.createElement("div");
    empty.className = "diff-empty";
    empty.textContent = "无法生成对比结果";
    elements.diffView.appendChild(empty);
  }
}

function scheduleDiff() {
  clearTimeout(diffTimer);
  diffTimer = setTimeout(renderDiff, 180);
}

function formatJson(side) {
  const input = side === "left" ? elements.leftDiffInput : elements.rightDiffInput;
  try {
    input.value = formatJsonText(input.value);
    elements.diffError.textContent = "";
    renderDiff();
    showToast("JSON 已格式化");
  } catch (error) {
    elements.diffError.textContent = error.message;
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 1300);
}

async function copyOutput(targetId) {
  const value = $(`#${targetId}`).textContent.trim();
  if (!value || value === "—" || value === "等待输入") {
    showToast("暂无可复制内容");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    showToast("已复制到剪贴板");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast("已复制到剪贴板");
  }
}

$$(".tool-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTool(tab.dataset.tool));
});
window.addEventListener("hashchange", () => switchTool(window.location.hash.slice(1), false));

elements.timestampInput.addEventListener("input", convertTimestamp);
$("#clearTimestamp").addEventListener("click", () => {
  elements.timestampInput.value = "";
  elements.timestampInput.focus();
  resetTimestampResults();
});
$("#useCurrentTimestamp").addEventListener("click", () => {
  elements.timestampInput.value = String(Date.now());
  convertTimestamp();
});

elements.dateStringInput.addEventListener("input", convertTimezone);
elements.timezoneSelect.addEventListener("change", convertTimezone);
$("#useExampleDate").addEventListener("click", () => {
  elements.dateStringInput.value = "Thu, 03 Sep 2026 09:33:14 GMT";
  convertTimezone();
});
$("#useCurrentDate").addEventListener("click", () => {
  elements.dateStringInput.value = new Date().toISOString();
  convertTimezone();
});

$$(".copy-button").forEach((button) => {
  button.addEventListener("click", () => copyOutput(button.dataset.copyTarget));
});

elements.leftDiffInput.addEventListener("input", scheduleDiff);
elements.rightDiffInput.addEventListener("input", scheduleDiff);
$("#compareText").addEventListener("click", renderDiff);
$("#swapDiffText").addEventListener("click", () => {
  const left = elements.leftDiffInput.value;
  elements.leftDiffInput.value = elements.rightDiffInput.value;
  elements.rightDiffInput.value = left;
  renderDiff();
});
$("#clearDiffText").addEventListener("click", () => {
  elements.leftDiffInput.value = "";
  elements.rightDiffInput.value = "";
  renderDiff();
  elements.leftDiffInput.focus();
});
$("#formatLeftJson").addEventListener("click", () => formatJson("left"));
$("#formatRightJson").addEventListener("click", () => formatJson("right"));

updateLiveTimestamp();
setInterval(updateLiveTimestamp, 1000);
resetTimestampResults();
resetTimezoneResult();
renderDiff();
switchTool(window.location.hash.slice(1), true);
