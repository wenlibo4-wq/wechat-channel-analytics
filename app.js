const fields = {
  title: ["标题", "视频标题", "内容标题", "title", "name"],
  date: ["发布时间", "日期", "时间", "date", "publish_time", "created_at"],
  views: ["播放量", "观看量", "曝光播放", "views", "plays", "play"],
  likes: ["点赞", "点赞数", "likes", "like"],
  comments: ["评论", "评论数", "comments", "comment"],
  shares: ["转发", "分享", "转发数", "shares", "share"],
  saves: ["收藏", "收藏数", "saves", "favorites", "collect"],
  completionRate: ["完播率", "完成率", "completion", "completion_rate"],
  follows: ["新增关注", "涨粉", "转粉", "follows", "followers_gained"],
};

const sampleRows = [
  ["标题", "发布时间", "播放量", "点赞", "评论", "转发", "收藏", "完播率", "新增关注"],
  ["3 个动作修复账号冷启动", "2026-03-25 09:30", "18400", "860", "92", "315", "410", "42%", "126"],
  ["真实复盘：一条视频带来 600 个咨询", "2026-03-27 20:15", "58600", "3410", "428", "1230", "1680", "61%", "612"],
  ["别再这样写视频号开头", "2026-03-30 12:10", "26200", "1340", "166", "552", "690", "48%", "203"],
  ["直播预约页怎么提高点击", "2026-04-02 18:50", "14200", "520", "64", "180", "240", "35%", "88"],
  ["老板最该看的 5 个数据", "2026-04-05 08:20", "33800", "1970", "210", "760", "930", "54%", "355"],
  ["30 秒讲透私域转化路径", "2026-04-08 21:05", "70200", "4620", "610", "2160", "2710", "66%", "824"],
  ["为什么你的点赞高但没人关注", "2026-04-12 11:40", "29400", "1880", "240", "690", "720", "52%", "184"],
  ["一张表看懂视频号复盘", "2026-04-16 19:35", "47600", "2850", "318", "1320", "1410", "59%", "493"],
  ["小团队怎么安排选题会", "2026-04-20 10:00", "21100", "940", "108", "380", "520", "44%", "151"],
  ["数据不好时先改哪一步", "2026-04-23 20:30", "51600", "3020", "356", "1480", "1830", "63%", "568"],
];

let rawData = [];

const csvInput = document.querySelector("#csvFile");
const sampleBtn = document.querySelector("#sampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const rangeSelect = document.querySelector("#rangeSelect");
const metricSelect = document.querySelector("#metricSelect");
const emptyState = document.querySelector("#emptyState");
const dashboard = document.querySelector("#dashboard");
const kpiGrid = document.querySelector("#kpiGrid");
const topRows = document.querySelector("#topRows");
const insights = document.querySelector("#insights");
const trendLabel = document.querySelector("#trendLabel");

csvInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  rawData = normalizeRows(parseCsv(text));
  render();
});

sampleBtn.addEventListener("click", () => {
  rawData = normalizeRows(sampleRows);
  render();
});

clearBtn.addEventListener("click", () => {
  rawData = [];
  csvInput.value = "";
  render();
});

rangeSelect.addEventListener("change", render);
metricSelect.addEventListener("change", render);
window.addEventListener("resize", render);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeRows(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((item) => item.trim());
  const map = Object.fromEntries(
    Object.entries(fields).map(([key, aliases]) => [key, findHeader(headers, aliases)]),
  );

  return rows.slice(1).map((row, index) => {
    const item = {
      title: read(row, map.title) || `未命名视频 ${index + 1}`,
      date: parseDate(read(row, map.date)),
      views: toNumber(read(row, map.views)),
      likes: toNumber(read(row, map.likes)),
      comments: toNumber(read(row, map.comments)),
      shares: toNumber(read(row, map.shares)),
      saves: toNumber(read(row, map.saves)),
      completionRate: toRate(read(row, map.completionRate)),
      follows: toNumber(read(row, map.follows)),
    };
    item.engagements = item.likes + item.comments + item.shares + item.saves;
    item.engagementRate = item.views ? item.engagements / item.views : 0;
    item.followRate = item.views ? item.follows / item.views : 0;
    item.score = item.views * 0.45 + item.engagements * 8 + item.follows * 22;
    return item;
  }).filter((item) => item.views || item.engagements || item.follows);
}

function findHeader(headers, aliases) {
  const lowered = headers.map((header) => header.toLowerCase());
  const alias = aliases.find((name) => lowered.includes(name.toLowerCase()));
  return alias ? lowered.indexOf(alias.toLowerCase()) : -1;
}

function read(row, index) {
  return index >= 0 ? row[index] : "";
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value.replace(/\./g, "-").replace(/\//g, "-"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value) {
  if (!value) return 0;
  return Number(String(value).replace(/[,，\s]/g, "").replace(/[^\d.-]/g, "")) || 0;
}

function toRate(value) {
  if (!value) return 0;
  const text = String(value).trim();
  const number = toNumber(text);
  if (text.includes("%")) return number / 100;
  return number > 1 ? number / 100 : number;
}

function render() {
  const data = getFilteredData();
  emptyState.classList.toggle("is-hidden", rawData.length > 0);
  dashboard.classList.toggle("is-hidden", rawData.length === 0);
  if (!rawData.length) return;

  renderKpis(data);
  renderTable(data);
  renderInsights(data);
  renderLineChart(document.querySelector("#trendChart"), groupByDay(data), metricSelect.value);
  renderBarChart(document.querySelector("#hourChart"), groupByHour(data));
}

function getFilteredData() {
  const range = rangeSelect.value;
  const dated = rawData.filter((item) => item.date);
  if (range === "all" || dated.length === 0) return rawData;
  const latest = new Date(Math.max(...dated.map((item) => item.date.getTime())));
  const start = new Date(latest);
  start.setDate(start.getDate() - Number(range) + 1);
  return rawData.filter((item) => !item.date || item.date >= start);
}

function renderKpis(data) {
  const totals = sumMetrics(data);
  const avgCompletion = weightedAverage(data, "completionRate");
  const engagementRate = totals.views ? totals.engagements / totals.views : 0;
  const followRate = totals.views ? totals.follows / totals.views : 0;
  const best = [...data].sort((a, b) => b.score - a.score)[0];
  const items = [
    ["总播放量", formatNumber(totals.views), `${data.length} 条内容`],
    ["互动率", formatPercent(engagementRate), `${formatNumber(totals.engagements)} 次互动`],
    ["转粉率", formatPercent(followRate), `${formatNumber(totals.follows)} 新增关注`],
    ["最佳内容", best ? shortTitle(best.title) : "-", best ? `${formatNumber(best.views)} 播放` : "-"],
    ["平均完播率", formatPercent(avgCompletion), completionHint(avgCompletion)],
    ["单条均播", formatNumber(totals.views / Math.max(data.length, 1)), "衡量内容稳定性"],
    ["分享收藏比", formatPercent((totals.shares + totals.saves) / Math.max(totals.engagements, 1)), "衡量内容沉淀价值"],
    ["评论占比", formatPercent(totals.comments / Math.max(totals.engagements, 1)), "衡量讨论强度"],
  ];

  kpiGrid.innerHTML = items.map(([label, value, hint]) => `
    <article class="panel kpi">
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${hint}</em>
    </article>
  `).join("");
}

function renderTable(data) {
  topRows.innerHTML = [...data]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => `
      <tr>
        <td title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</td>
        <td>${formatNumber(item.views)}</td>
        <td>${formatPercent(item.engagementRate)}</td>
        <td>${formatPercent(item.completionRate)}</td>
        <td>${formatNumber(item.follows)}</td>
      </tr>
    `)
    .join("");
}

function renderInsights(data) {
  const totals = sumMetrics(data);
  const bestHour = bestHourOf(data);
  const best = [...data].sort((a, b) => b.score - a.score)[0];
  const engagementRate = totals.views ? totals.engagements / totals.views : 0;
  const followRate = totals.views ? totals.follows / totals.views : 0;
  const completion = weightedAverage(data, "completionRate");
  const notes = [];

  if (best) {
    notes.push(["good", `优先拆解《${shortTitle(best.title)}》：它贡献了 ${formatNumber(best.views)} 播放，互动率 ${formatPercent(best.engagementRate)}，可复用选题角度、开头钩子和评论区引导。`]);
  }
  if (bestHour !== null) {
    notes.push(["good", `${bestHour}:00 附近发布的视频平均表现最好，建议把重点内容排在该时段，并连续测试 2 周。`]);
  }
  notes.push([completion >= 0.5 ? "good" : "warn", `当前平均完播率为 ${formatPercent(completion)}。${completion >= 0.5 ? "说明内容结构较稳，可以增加转化 CTA。" : "建议缩短开头铺垫，把结论或冲突前置到前 3 秒。"} `]);
  notes.push([engagementRate >= 0.06 ? "good" : "warn", `互动率为 ${formatPercent(engagementRate)}。${engagementRate >= 0.06 ? "可以把高互动主题做系列化。" : "建议在标题和结尾加入明确问题，提升评论与收藏动机。"} `]);
  notes.push([followRate >= 0.008 ? "good" : "warn", `转粉率为 ${formatPercent(followRate)}。${followRate >= 0.008 ? "账号人设和价值承诺较清晰。" : "建议在视频中强化“关注后能持续获得什么”。"} `]);

  insights.innerHTML = notes.map(([kind, text]) => `<div class="insight ${kind}">${escapeHtml(text)}</div>`).join("");
}

function sumMetrics(data) {
  return data.reduce((sum, item) => {
    sum.views += item.views;
    sum.likes += item.likes;
    sum.comments += item.comments;
    sum.shares += item.shares;
    sum.saves += item.saves;
    sum.follows += item.follows;
    sum.engagements += item.engagements;
    return sum;
  }, { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, follows: 0, engagements: 0 });
}

function weightedAverage(data, key) {
  const totalViews = data.reduce((sum, item) => sum + item.views, 0);
  if (!totalViews) return average(data.map((item) => item[key]));
  return data.reduce((sum, item) => sum + item[key] * item.views, 0) / totalViews;
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.reduce((sum, value) => sum + value, 0) / Math.max(clean.length, 1);
}

function groupByDay(data) {
  const groups = new Map();
  data.forEach((item) => {
    if (!item.date) return;
    const key = item.date.toISOString().slice(0, 10);
    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({
    label: date.slice(5),
    ...aggregateGroup(items),
  }));
}

function groupByHour(data) {
  const groups = Array.from({ length: 24 }, (_, hour) => ({ label: `${hour}`, items: [] }));
  data.forEach((item) => {
    if (item.date) groups[item.date.getHours()].items.push(item);
  });
  return groups.map((group) => ({
    label: group.label,
    views: average(group.items.map((item) => item.views)),
  }));
}

function aggregateGroup(items) {
  const totals = sumMetrics(items);
  return {
    views: totals.views,
    engagementRate: totals.views ? totals.engagements / totals.views : 0,
    followRate: totals.views ? totals.follows / totals.views : 0,
    completionRate: weightedAverage(items, "completionRate"),
  };
}

function bestHourOf(data) {
  const groups = groupByHour(data).filter((item) => item.views > 0);
  if (!groups.length) return null;
  return Number(groups.sort((a, b) => b.views - a.views)[0].label);
}

function renderLineChart(canvas, points, metric) {
  trendLabel.textContent = metricName(metric);
  const values = points.map((point) => point[metric] || 0);
  drawChart(canvas, points.map((point) => point.label), values, {
    color: "#2563eb",
    fill: "rgba(37, 99, 235, 0.12)",
    formatter: metric.includes("Rate") ? formatPercent : formatNumber,
    line: true,
  });
}

function renderBarChart(canvas, points) {
  drawChart(canvas, points.map((point) => point.label), points.map((point) => point.views), {
    color: "#0f9f7a",
    fill: "rgba(15, 159, 122, 0.16)",
    formatter: formatNumber,
    line: false,
  });
}

function drawChart(canvas, labels, values, options) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = { top: 24, right: 26, bottom: 44, left: 58 };
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(...values, 1);
  const stepX = labels.length > 1 ? (width - pad.left - pad.right) / (labels.length - 1) : 0;
  const barGap = 5;
  const plotHeight = height - pad.top - pad.bottom;

  ctx.strokeStyle = "#d9e1e8";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#697586";
  ctx.font = "12px system-ui";
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (plotHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    const value = max - (max / 4) * i;
    ctx.fillText(options.formatter(value), 8, y + 4);
  }

  if (options.line) {
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = pad.left + stepX * index;
      const y = pad.top + plotHeight - (value / max) * plotHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = options.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    values.forEach((value, index) => {
      const x = pad.left + stepX * index;
      const y = pad.top + plotHeight - (value / max) * plotHeight;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = options.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else {
    const barWidth = (width - pad.left - pad.right) / values.length - barGap;
    values.forEach((value, index) => {
      const x = pad.left + index * (barWidth + barGap);
      const barHeight = (value / max) * plotHeight;
      ctx.fillStyle = options.fill;
      ctx.fillRect(x, pad.top + plotHeight - barHeight, barWidth, barHeight);
      ctx.fillStyle = options.color;
      ctx.fillRect(x, pad.top + plotHeight - barHeight, barWidth, Math.min(barHeight, 5));
    });
  }

  ctx.fillStyle = "#697586";
  labels.forEach((label, index) => {
    if (labels.length > 12 && index % Math.ceil(labels.length / 10) !== 0) return;
    const x = options.line ? pad.left + stepX * index : pad.left + index * ((width - pad.left - pad.right) / values.length) + 4;
    ctx.fillText(label, x - 10, height - 16);
  });
}

function metricName(metric) {
  return {
    views: "播放量",
    engagementRate: "互动率",
    followRate: "转粉率",
    completionRate: "完播率",
  }[metric];
}

function completionHint(value) {
  if (value >= 0.6) return "内容留存优秀";
  if (value >= 0.45) return "内容结构健康";
  return "开头和节奏待优化";
}

function formatNumber(value) {
  return Math.round(value || 0).toLocaleString("zh-CN");
}

function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function shortTitle(value) {
  return value.length > 12 ? `${value.slice(0, 12)}...` : value;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
