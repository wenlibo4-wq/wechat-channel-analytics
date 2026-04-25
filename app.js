const fields = {
  title: [
    "标题",
    "作品标题",
    "视频标题",
    "内容标题",
    "作品名称",
    "视频名称",
    "内容",
    "发表内容",
    "作品",
    "title",
    "name",
  ],
  date: ["发布时间", "发布日期", "时间", "publishTime", "date"],
  completionRate: ["完播率", "completion", "completionRate"],
  avgWatchTime: ["平均播放时长", "平均观看时长", "播放时长", "avgWatchTime"],
  views: ["播放", "播放量", "观看量", "views", "play"],
  hearts: ["心", "爱心", "喜欢", "likeHeart", "heart"],
  likes: ["赞", "点赞", "点赞量", "likes", "like"],
  comments: ["评论", "评论数", "comments"],
  shares: ["分享", "分享数", "shares"],
  follows: ["关注", "新增关注", "粉丝增长", "follows"],
  shareToChatMoments: ["转发聊天和朋友圈", "转发", "转发数", "朋友圈转发", "shareToChatMoments"],
  setAsRingtone: ["设为铃声", "铃声", "setAsRingtone"],
  setAsStatus: ["设为状态", "状态", "setAsStatus"],
  setAsCover: ["设为朋友圈封面", "朋友圈封面", "setAsCover"],
};

const sampleRows = [
  ["作品标题", "发布时间", "播放", "心", "赞", "评论", "分享", "关注", "转发聊天和朋友圈", "设为铃声", "设为状态", "设为朋友圈封面", "完播率", "平均播放时长"],
  ["3 个动作修复账号冷启动", "2026-03-25 09:30", "18400", "420", "860", "92", "168", "126", "315", "21", "18", "9", "42%", "00:18"],
  ["真实复盘：一条视频带来 600 个咨询", "2026-03-27 20:15", "58600", "1840", "3410", "428", "690", "612", "1230", "86", "76", "42", "61%", "00:32"],
  ["别再这样写视频号开头", "2026-03-30 12:10", "26200", "760", "1340", "166", "288", "203", "552", "34", "26", "15", "48%", "00:24"],
  ["直播预约页怎么提高点击", "2026-04-02 18:50", "14200", "310", "520", "64", "106", "88", "180", "12", "9", "4", "35%", "00:16"],
  ["老板最该看的 5 个数据", "2026-04-05 08:20", "33800", "1080", "1970", "210", "405", "355", "760", "45", "38", "18", "54%", "00:28"],
  ["30 秒讲透私域转化路径", "2026-04-08 21:05", "70200", "2350", "4620", "610", "980", "824", "2160", "112", "95", "51", "66%", "00:35"],
  ["为什么你的点赞高但没人关注", "2026-04-12 11:40", "29400", "920", "1880", "240", "330", "184", "690", "39", "31", "14", "52%", "00:26"],
  ["一张表看懂视频号复盘", "2026-04-16 19:35", "47600", "1530", "2850", "318", "622", "493", "1320", "72", "59", "29", "59%", "00:31"],
  ["小团队怎么安排选题会", "2026-04-20 10:00", "21100", "510", "940", "108", "206", "151", "380", "18", "16", "7", "44%", "00:20"],
  ["数据不好时先改哪一步", "2026-04-23 20:30", "51600", "1680", "3020", "356", "710", "568", "1480", "79", "68", "33", "63%", "00:34"],
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
  const headers = rows[0].map((item) => item.trim().replace(/^\uFEFF/, ""));
  const map = Object.fromEntries(
    Object.entries(fields).map(([key, aliases]) => [key, findHeader(headers, aliases)]),
  );

  return rows.slice(1).map((row) => {
    const date = parseDate(read(row, map.date));
    const views = toNumber(read(row, map.views));
    const rawTitle = read(row, map.title).trim();
    const item = {
      title: rawTitle || fallbackTitle(date, views),
      date,
      views,
      completionRate: toRate(read(row, map.completionRate)),
      avgWatchTime: toDurationSeconds(read(row, map.avgWatchTime)),
      hearts: toNumber(read(row, map.hearts)),
      likes: toNumber(read(row, map.likes)),
      comments: toNumber(read(row, map.comments)),
      shares: toNumber(read(row, map.shares)),
      follows: toNumber(read(row, map.follows)),
      shareToChatMoments: toNumber(read(row, map.shareToChatMoments)),
      setAsRingtone: toNumber(read(row, map.setAsRingtone)),
      setAsStatus: toNumber(read(row, map.setAsStatus)),
      setAsCover: toNumber(read(row, map.setAsCover)),
    };
    item.engagements = item.hearts + item.likes + item.comments + item.shares + item.shareToChatMoments;
    item.engagementRate = item.views ? item.engagements / item.views : 0;
    item.followRate = item.views ? item.follows / item.views : 0;
    item.score = item.views * 0.45 + item.engagements * 8 + item.follows * 22 + item.completionRate * item.views * 0.25;
    return item;
  }).filter((item) => item.views || item.engagements || item.follows || item.completionRate);
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

function fallbackTitle(date, views) {
  const dateText = date ? formatDateLabel(date) : "未知时间";
  return `${dateText}｜${Math.round(views || 0)}播放`;
}

function formatDateLabel(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
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

function toDurationSeconds(value) {
  if (!value) return 0;
  const text = String(value).trim();
  const timeParts = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (timeParts) {
    const first = Number(timeParts[1]);
    const second = Number(timeParts[2]);
    const third = Number(timeParts[3] || 0);
    return timeParts[3] ? first * 3600 + second * 60 + third : first * 60 + second;
  }
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*分/);
  const secondMatch = text.match(/(\d+(?:\.\d+)?)\s*秒/);
  if (minuteMatch || secondMatch) {
    return (Number(minuteMatch?.[1] || 0) * 60) + Number(secondMatch?.[1] || 0);
  }
  return toNumber(text);
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
  const avgWatchTime = weightedAverage(data, "avgWatchTime");
  const followRate = totals.views ? totals.follows / totals.views : 0;
  const bestByViews = [...data].sort((a, b) => b.views - a.views)[0];
  const bestByCompletion = [...data].sort((a, b) => {
    if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
    return b.views - a.views;
  })[0];
  const items = [
    ["总播放量", formatNumber(totals.views), `${data.length} 条视频`],
    ["平均完播率", formatPercent(avgCompletion), completionHint(avgCompletion)],
    ["平均播放时长", formatDuration(avgWatchTime), "按播放量加权"],
    ["总互动量", formatNumber(totals.engagements), "心 + 赞 + 评论 + 分享 + 转发"],
    ["关注转化", formatPercent(followRate), `${formatNumber(totals.follows)} 次关注`],
    ["单条均播", formatNumber(totals.views / Math.max(data.length, 1)), "衡量内容稳定性"],
    ["最佳播放作品", bestByViews ? shortTitle(bestByViews.title) : "-", bestByViews ? `${formatNumber(bestByViews.views)} 播放` : "-"],
    ["最佳完播作品", bestByCompletion ? shortTitle(bestByCompletion.title) : "-", bestByCompletion ? formatPercent(bestByCompletion.completionRate) : "-"],
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
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)
    .map((item) => `
      <tr>
        <td title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</td>
        <td>${formatDateTime(item.date)}</td>
        <td>${formatNumber(item.views)}</td>
        <td>${formatPercent(item.completionRate)}</td>
        <td>${formatDuration(item.avgWatchTime)}</td>
        <td>${formatNumber(item.hearts)}</td>
        <td>${formatNumber(item.likes)}</td>
        <td>${formatNumber(item.comments)}</td>
        <td>${formatNumber(item.shares)}</td>
        <td>${formatNumber(item.follows)}</td>
        <td>${formatNumber(item.shareToChatMoments)}</td>
        <td>${formatNumber(item.setAsRingtone)}</td>
        <td>${formatNumber(item.setAsStatus)}</td>
        <td>${formatNumber(item.setAsCover)}</td>
      </tr>
    `)
    .join("");
}

function renderInsights(data) {
  if (!data.length) {
    insights.innerHTML = "";
    return;
  }

  const benchmarks = buildDiagnosisBenchmarks(data);
  const diagnosed = data.map((item) => ({
    ...item,
    diagnosis: diagnoseContent(item, benchmarks),
    isHighInteraction: item.engagements >= benchmarks.highInteractions || item.engagementRate >= benchmarks.highEngagementRate,
    isHighFollow: item.follows >= benchmarks.highFollows || item.followRate >= benchmarks.highFollowRate,
  }));
  const reviewItem = pickReviewItem(diagnosed);
  const nextItem = reviewItem || diagnosed[0];
  const avoidItem = pickAvoidItem(diagnosed);

  const reviewBullets = reviewItem.diagnosis.actions.slice();
  if (reviewItem.isHighInteraction) {
    reviewBullets.push("评论区继续追问一个具体问题，把这条做成二创回应或社群讨论话题。");
  }
  if (reviewItem.isHighFollow) {
    reviewBullets.push("复用这条里的人设表达和信任背书，下一条增加个人故事或系列栏目入口。");
  }

  const nextBullets = nextVideoActions(nextItem);
  const avoidBullets = avoidActions(avoidItem);

  insights.innerHTML = [
    insightSection(
      "A. 本期最值得复盘的内容",
      `《${shortTitle(reviewItem.title)}》：${reviewItem.diagnosis.label}。播放 ${formatNumber(reviewItem.views)}，完播率 ${formatPercent(reviewItem.completionRate)}，互动 ${formatNumber(reviewItem.engagements)}，关注转化率 ${formatPercent(reviewItem.followRate)}。`,
      reviewBullets,
      "good",
    ),
    insightSection(
      "B. 下一条视频具体怎么拍",
      `围绕《${shortTitle(nextItem.title)}》继续拍，但不要只换标题。先复用有效钩子，再把内容承接做扎实。`,
      nextBullets,
      "good",
    ),
    insightSection(
      "C. 需要避免的内容问题",
      `重点避开《${shortTitle(avoidItem.title)}》暴露的问题：${avoidItem.diagnosis.label}。播放 ${formatNumber(avoidItem.views)}，完播率 ${formatPercent(avoidItem.completionRate)}。`,
      avoidBullets,
      "warn",
    ),
  ].join("");
}

function buildDiagnosisBenchmarks(data) {
  const views = data.map((item) => item.views);
  const completionRates = data.map((item) => item.completionRate);
  const interactions = data.map((item) => item.engagements);
  const engagementRates = data.map((item) => item.engagementRate);
  const follows = data.map((item) => item.follows);
  const followRates = data.map((item) => item.followRate);
  return {
    highViews: Math.max(percentile(views, 0.65), average(views)),
    highCompletion: Math.max(percentile(completionRates, 0.55), 0.45),
    highInteractions: Math.max(percentile(interactions, 0.75), average(interactions)),
    highEngagementRate: Math.max(percentile(engagementRates, 0.75), 0.06),
    highFollows: Math.max(percentile(follows, 0.75), average(follows)),
    highFollowRate: Math.max(percentile(followRates, 0.75), 0.008),
  };
}

function diagnoseContent(item, benchmarks) {
  const highViews = item.views >= benchmarks.highViews;
  const highCompletion = item.completionRate >= benchmarks.highCompletion;
  if (highViews && highCompletion) {
    return {
      label: "可复用爆款选题",
      priority: 4,
      actions: [
        "拆成 3-5 条系列选题，分别讲原因、误区、案例、操作步骤和复盘。",
        "复用这条的标题结构，只替换人群、场景或结果数字。",
        "复用开头 3 秒表达，第一句话直接给冲突、结论或反常识判断。",
        "延展成公众号长文或直播话题，用这条视频承接预约和私域导流。",
      ],
    };
  }
  if (highViews && !highCompletion) {
    return {
      label: "标题/选题有吸引力，但内容承接不足",
      priority: 3,
      actions: [
        "重剪前 15 秒，第一屏先给结论，不要先解释背景。",
        "减少铺垫，把案例、结果或冲突提前到第 1 句话。",
        "更早抛出核心冲突，让用户知道看完能解决什么问题。",
        "开头不要讲背景太久，背景最多一句，马上进入判断或步骤。",
      ],
    };
  }
  if (!highViews && highCompletion) {
    return {
      label: "内容质量不错，但标题和封面钩子不够",
      priority: 2,
      actions: [
        "重写标题，把泛泛描述改成明确痛点或具体结果。",
        "强化痛点，用用户会说出口的话替代行业概念。",
        "增加反差感，例如“很多人以为 A，其实真正影响的是 B”。",
        "用更具体的人群和场景表达，比如新号、门店老板、知识博主、直播前 1 小时。",
      ],
    };
  }
  return {
    label: "选题和表达都需要重做",
    priority: 1,
    actions: [
      "暂停复制这个方向，先不要继续用同类标题和结构。",
      "回到用户痛点，重新写出用户正在焦虑的一句话。",
      "用故事替代说理，先讲一个具体场景，再给方法。",
      "开头不要太抽象，避免“今天聊聊”“很多人不知道”这类低信息密度表达。",
    ],
  };
}

function pickReviewItem(items) {
  return [...items].sort((a, b) => {
    if (b.diagnosis.priority !== a.diagnosis.priority) return b.diagnosis.priority - a.diagnosis.priority;
    if (Number(b.isHighFollow) !== Number(a.isHighFollow)) return Number(b.isHighFollow) - Number(a.isHighFollow);
    if (Number(b.isHighInteraction) !== Number(a.isHighInteraction)) return Number(b.isHighInteraction) - Number(a.isHighInteraction);
    return b.score - a.score;
  })[0];
}

function pickAvoidItem(items) {
  return [...items].sort((a, b) => {
    if (a.diagnosis.priority !== b.diagnosis.priority) return a.diagnosis.priority - b.diagnosis.priority;
    if (a.completionRate !== b.completionRate) return a.completionRate - b.completionRate;
    return a.views - b.views;
  })[0];
}

function nextVideoActions(item) {
  const actions = item.diagnosis.actions.slice(0, 3);
  if (item.isHighInteraction) {
    actions.push("结尾加一个可回答的问题，发布后 30 分钟内在评论区追问，筛出下一条二创选题。");
  }
  if (item.isHighFollow) {
    actions.push("中段加入一句个人经历或判断依据，把“为什么值得关注你”说清楚。");
  }
  if (!item.isHighInteraction && !item.isHighFollow) {
    actions.push("结尾不要泛泛求点赞，改成“想要模板/清单/案例，在评论区留关键词”。");
  }
  return actions;
}

function avoidActions(item) {
  const actions = item.diagnosis.actions.slice();
  if (item.views >= 1 && item.completionRate < 0.4) {
    actions.push("这类标题能拉点击，但正文留不住人；下次先写 15 秒脚本，再决定标题。");
  }
  if (item.engagementRate < 0.04) {
    actions.push("不要只做单向讲解，至少设计一个争议点、选择题或评论区追问。");
  }
  return actions.slice(0, 5);
}

function insightSection(title, body, bullets, kind) {
  return `
    <div class="insight ${kind}">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(body)}</p>
      <ul>
        ${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function sumMetrics(data) {
  return data.reduce((sum, item) => {
    sum.views += item.views;
    sum.hearts += item.hearts;
    sum.likes += item.likes;
    sum.comments += item.comments;
    sum.shares += item.shares;
    sum.follows += item.follows;
    sum.shareToChatMoments += item.shareToChatMoments;
    sum.setAsRingtone += item.setAsRingtone;
    sum.setAsStatus += item.setAsStatus;
    sum.setAsCover += item.setAsCover;
    sum.engagements += item.engagements;
    return sum;
  }, {
    views: 0,
    hearts: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    follows: 0,
    shareToChatMoments: 0,
    setAsRingtone: 0,
    setAsStatus: 0,
    setAsCover: 0,
    engagements: 0,
  });
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

function percentile(values, ratio) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const index = Math.min(clean.length - 1, Math.max(0, Math.ceil(clean.length * ratio) - 1));
  return clean[index];
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
    avgWatchTime: weightedAverage(items, "avgWatchTime"),
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
    formatter: metric === "avgWatchTime" ? formatDuration : metric.includes("Rate") ? formatPercent : formatNumber,
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
    followRate: "关注转化率",
    completionRate: "完播率",
    avgWatchTime: "平均播放时长",
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

function formatDuration(seconds) {
  const total = Math.round(seconds || 0);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes <= 0) return `${rest}秒`;
  return `${minutes}分${String(rest).padStart(2, "0")}秒`;
}

function formatDateTime(date) {
  if (!date) return "-";
  const dateText = formatDateLabel(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${dateText} ${hours}:${minutes}`;
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
