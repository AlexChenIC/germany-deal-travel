import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { HeatEscapeLiveData, RadarData, SourceRun } from "../src/types";

const rootDir = process.cwd();

async function main() {
  const radar = await readJson<RadarData>("src/data/radar-data.json");
  const heatLive = await readJson<HeatEscapeLiveData>("src/data/heat-live-status.json");
  const sourceIssues = radar.sources.filter(
    (source) => source.status === "error" || isCacheFallbackRun(source),
  );
  const heatWarnings = buildHeatWarnings(heatLive);
  const markdown = buildSummaryMarkdown(radar, heatLive, sourceIssues, heatWarnings);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8");
  } else {
    console.log(markdown);
  }

  for (const issue of sourceIssues) {
    emitAnnotation(
      issue.status === "error" ? "error" : "warning",
      issue.status === "error" ? "来源抓取失败" : "来源使用缓存回退",
      `${issue.name}: ${issue.errorMessage ?? issue.message ?? "需要检查"}`,
    );
  }
  for (const warning of heatWarnings) {
    emitAnnotation("warning", warning.title, warning.message);
  }
}

async function readJson<T>(relativePath: string): Promise<T> {
  const rawValue = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(rawValue) as T;
}

function buildSummaryMarkdown(
  radar: RadarData,
  heatLive: HeatEscapeLiveData,
  sourceIssues: SourceRun[],
  heatWarnings: Array<{ title: string; message: string }>,
) {
  const lines = [
    "## 柏林家庭出行雷达自动更新摘要",
    "",
    `- 数据更新时间：${radar.generatedAt}`,
    `- 条目：${radar.items.length}，今日新增：${radar.stats.newToday ?? 0}，近 7 天新增：${radar.stats.newThisWeek ?? 0}`,
    `- 来源：成功 ${radar.stats.sourceOk ?? 0}，失败 ${radar.stats.sourceErrors ?? 0}，跳过 ${radar.stats.sourceSkipped ?? 0}，缓存回退 ${radar.stats.sourceCacheFallbacks ?? 0}`,
    `- 避暑窗口：${heatLive.stayWindow.checkIn} 到 ${heatLive.stayWindow.checkOut}，${heatLive.stayWindow.adults} 位成人 + ${heatLive.stayWindow.children} 位宝宝/儿童`,
    `- 天气触发：${heatLive.weather.trigger.messageZh}`,
    `- 价格检查：${heatLive.sourceStatus.price.status}，${heatLive.sourceStatus.price.messageZh}`,
    `- 评论风险：${heatLive.sourceStatus.reviews.status}，${heatLive.sourceStatus.reviews.messageZh}`,
    "",
    "### 需要留意",
  ];

  if (sourceIssues.length === 0 && heatWarnings.length === 0) {
    lines.push("- 本次没有发现自动化异常。");
  } else {
    for (const issue of sourceIssues) {
      lines.push(
        `- ${issue.status === "error" ? "来源失败" : "缓存回退"}：${issue.name} - ${
          issue.errorMessage ?? issue.message ?? "需要检查"
        }`,
      );
    }
    for (const warning of heatWarnings) {
      lines.push(`- ${warning.title}：${warning.message}`);
    }
  }

  return lines.join("\n");
}

function buildHeatWarnings(data: HeatEscapeLiveData) {
  const warnings: Array<{ title: string; message: string }> = [];

  if (data.weather.trigger.level === "hot" || data.weather.trigger.level === "extreme") {
    warnings.push({
      title: "高温触发",
      message: data.weather.trigger.messageZh,
    });
  }
  if (data.sourceStatus.price.status === "error") {
    warnings.push({
      title: "价格检查失败",
      message: data.sourceStatus.price.messageZh,
    });
  }
  if (data.sourceStatus.reviews.status === "error") {
    warnings.push({
      title: "评论检查失败",
      message: data.sourceStatus.reviews.messageZh,
    });
  }
  if (data.sourceStatus.price.status === "unconfigured") {
    warnings.push({
      title: "价格 API 未配置",
      message: data.sourceStatus.price.messageZh,
    });
  }
  if (data.sourceStatus.reviews.status === "unconfigured") {
    warnings.push({
      title: "评论 API 未配置",
      message: data.sourceStatus.reviews.messageZh,
    });
  }

  return warnings;
}

function isCacheFallbackRun(run: SourceRun) {
  return Boolean(run.usedCache || /cached|cache|缓存|回退/i.test(run.message ?? ""));
}

function emitAnnotation(
  level: "warning" | "error",
  title: string,
  message: string,
) {
  console.log(`::${level} title=${escapeCommandValue(title)}::${escapeCommandValue(message)}`);
}

function escapeCommandValue(value: string) {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
