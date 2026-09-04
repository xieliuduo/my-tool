import {
  TIMEZONES,
  formatDateInTimeZone,
  formatLocalDate,
  getTimeZoneOffset,
  normalizeTimestamp,
  parseDateString
} from "./src/utils/date-time.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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
  toast: $("#toast")
};

let toastTimer;

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

function switchTool(tool) {
  $$(".tool-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tool === tool));
  $$(".tool-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === tool));
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

updateLiveTimestamp();
setInterval(updateLiveTimestamp, 1000);
resetTimestampResults();
resetTimezoneResult();
