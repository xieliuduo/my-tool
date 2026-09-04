# 研发工具箱

一个面向研发人员的轻量浏览器插件，所有数据均在本地处理。

## 已有工具

### 1. 时间戳转换

- 自动识别秒级和毫秒级 Unix 时间戳
- 输出北京时间、本地时间和 UTC ISO 8601
- 同时输出秒、毫秒值并支持一键复制

### 2. 时间转换

- 支持 RFC 2822、ISO 8601 等浏览器可解析的日期格式
- 默认转换为北京时间
- 支持 UTC、东京、新加坡、伦敦、纽约、洛杉矶等常见时区

示例：

```text
Thu, 03 Sep 2026 09:33:14 GMT
→ 北京时间 2026-09-03 17:33:14
```

## 本地安装

1. 打开 Chrome 的 `chrome://extensions/`，或 Edge 的 `edge://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目目录。

## 开发与验证

本项目不需要安装依赖：

```bash
npm test
npm run check
```

## 项目结构

```text
manifest.json             插件清单
popup.html                弹窗结构
popup.css                 弹窗样式
popup.js                  UI 交互
src/utils/date-time.js    日期时间核心逻辑
tests/                    自动化测试
```
