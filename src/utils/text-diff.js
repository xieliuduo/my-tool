const MAX_DIFF_LINES = 1000;

function splitLines(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function createInlineSegments(left, right) {
  if (left === right) {
    return {
      left: [{ text: left, changed: false }],
      right: [{ text: right, changed: false }]
    };
  }

  let prefixLength = 0;
  const maxPrefix = Math.min(left.length, right.length);
  while (prefixLength < maxPrefix && left[prefixLength] === right[prefixLength]) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  const maxSuffix = Math.min(left.length, right.length) - prefixLength;
  while (
    suffixLength < maxSuffix &&
    left[left.length - 1 - suffixLength] === right[right.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const createSegments = (value) => {
    const segments = [];
    const prefix = value.slice(0, prefixLength);
    const changedEnd = suffixLength === 0 ? value.length : value.length - suffixLength;
    const changed = value.slice(prefixLength, changedEnd);
    const suffix = suffixLength === 0 ? "" : value.slice(-suffixLength);

    if (prefix) segments.push({ text: prefix, changed: false });
    if (changed || value === "") segments.push({ text: changed, changed: true });
    if (suffix) segments.push({ text: suffix, changed: false });
    return segments;
  };

  return {
    left: createSegments(left),
    right: createSegments(right)
  };
}

function buildOperations(leftLines, rightLines) {
  const rows = leftLines.length + 1;
  const columns = rightLines.length + 1;
  const matrix = Array.from({ length: rows }, () => new Uint32Array(columns));

  for (let leftIndex = leftLines.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = rightLines.length - 1; rightIndex >= 0; rightIndex -= 1) {
      matrix[leftIndex][rightIndex] =
        leftLines[leftIndex] === rightLines[rightIndex]
          ? matrix[leftIndex + 1][rightIndex + 1] + 1
          : Math.max(matrix[leftIndex + 1][rightIndex], matrix[leftIndex][rightIndex + 1]);
    }
  }

  const operations = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < leftLines.length && rightIndex < rightLines.length) {
    if (leftLines[leftIndex] === rightLines[rightIndex]) {
      operations.push({ type: "same", text: leftLines[leftIndex], leftIndex, rightIndex });
      leftIndex += 1;
      rightIndex += 1;
    } else if (matrix[leftIndex + 1][rightIndex] >= matrix[leftIndex][rightIndex + 1]) {
      operations.push({ type: "remove", text: leftLines[leftIndex], leftIndex });
      leftIndex += 1;
    } else {
      operations.push({ type: "add", text: rightLines[rightIndex], rightIndex });
      rightIndex += 1;
    }
  }

  while (leftIndex < leftLines.length) {
    operations.push({ type: "remove", text: leftLines[leftIndex], leftIndex });
    leftIndex += 1;
  }
  while (rightIndex < rightLines.length) {
    operations.push({ type: "add", text: rightLines[rightIndex], rightIndex });
    rightIndex += 1;
  }

  return operations;
}

export function buildSideBySideDiff(leftText, rightText) {
  const leftLines = splitLines(leftText);
  const rightLines = splitLines(rightText);

  if (leftLines.length > MAX_DIFF_LINES || rightLines.length > MAX_DIFF_LINES) {
    throw new Error(`单侧文本最多支持 ${MAX_DIFF_LINES} 行`);
  }

  const operations = buildOperations(leftLines, rightLines);
  const rows = [];
  const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };

  for (let index = 0; index < operations.length; ) {
    const operation = operations[index];
    if (operation.type === "same") {
      rows.push({
        type: "same",
        leftNumber: operation.leftIndex + 1,
        rightNumber: operation.rightIndex + 1,
        leftSegments: [{ text: operation.text, changed: false }],
        rightSegments: [{ text: operation.text, changed: false }]
      });
      summary.unchanged += 1;
      index += 1;
      continue;
    }

    const removed = [];
    const added = [];
    while (index < operations.length && operations[index].type !== "same") {
      const current = operations[index];
      (current.type === "remove" ? removed : added).push(current);
      index += 1;
    }

    const blockLength = Math.max(removed.length, added.length);
    for (let blockIndex = 0; blockIndex < blockLength; blockIndex += 1) {
      const left = removed[blockIndex];
      const right = added[blockIndex];

      if (left && right) {
        const inline = createInlineSegments(left.text, right.text);
        rows.push({
          type: "changed",
          leftNumber: left.leftIndex + 1,
          rightNumber: right.rightIndex + 1,
          leftSegments: inline.left,
          rightSegments: inline.right
        });
        summary.changed += 1;
      } else if (left) {
        rows.push({
          type: "removed",
          leftNumber: left.leftIndex + 1,
          rightNumber: null,
          leftSegments: [{ text: left.text, changed: true }],
          rightSegments: []
        });
        summary.removed += 1;
      } else {
        rows.push({
          type: "added",
          leftNumber: null,
          rightNumber: right.rightIndex + 1,
          leftSegments: [],
          rightSegments: [{ text: right.text, changed: true }]
        });
        summary.added += 1;
      }
    }
  }

  return {
    rows,
    summary,
    identical: summary.added === 0 && summary.removed === 0 && summary.changed === 0
  };
}

export function formatJsonText(value) {
  const normalized = String(value).trim();
  if (!normalized) {
    throw new Error("请先输入 JSON 数据");
  }

  try {
    return JSON.stringify(JSON.parse(normalized), null, 2);
  } catch {
    throw new Error("JSON 格式不正确");
  }
}
