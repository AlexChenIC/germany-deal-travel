import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { apiSafetyChecklist } from "../config";
import { formatFullDateTime } from "../lib/date";
import type { SourceDefinition, SourceRun } from "../types";

export function SourcesView({
  runs,
  sources,
  timezone,
}: {
  runs: SourceRun[];
  sources: SourceDefinition[];
  timezone: string;
}) {
  const runsById = new Map(runs.map((run) => [run.id, run]));
  return (
    <section className="sources-page">
      <ApiSafetyPanel />
      <div className="source-list">
        {sources.map((source) => {
          const run = runsById.get(source.id);
          const sourceState = getSourceState(run, source);
          return (
            <article className="source-row" key={source.id}>
              <div className={`source-status is-${sourceState.tone}`}>
                {sourceState.tone === "ok" ? (
                  <CheckCircle2 size={22} />
                ) : sourceState.tone === "warning" ? (
                  <RefreshCcw size={22} />
                ) : source.status === "candidate" ? (
                  <Sparkles size={22} />
                ) : (
                  <CircleAlert size={22} />
                )}
              </div>
              <div className="source-main">
                <div className="source-title">
                  <h3>{source.name}</h3>
                  <span>{sourceState.label}</span>
                </div>
                <p>{source.notes}</p>
                <div className="source-tags">
                  {source.focus.map((focus) => (
                    <span key={focus}>{focus}</span>
                  ))}
                </div>
              </div>
              <div className="source-side">
                <strong>{run?.itemCount ?? 0}</strong>
                <span>{run?.message ?? source.access}</span>
                {run?.fetchedAt && (
                  <small>最近抓取：{formatFullDateTime(run.fetchedAt, timezone)}</small>
                )}
                <a href={source.homepage} target="_blank" rel="noreferrer">
                  源站
                  <ExternalLink size={14} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ApiSafetyPanel() {
  return (
    <section className="api-safety-panel" aria-label="API cost and key safety">
      <div>
        <p className="eyebrow">Cost guardrails</p>
        <h2>API 成本和安全</h2>
        <p>
          预算提醒已创建；真正的硬保护仍建议在 Google Maps Platform 配置 API 限制和 quota。
        </p>
      </div>
      <div className="api-safety-grid">
        {apiSafetyChecklist.map((item) => (
          <article className="api-safety-item" key={item.id}>
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <strong>{item.labelZh}</strong>
              <span>{item.statusZh}</span>
              <small>{item.noteZh}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function getSourceState(run: SourceRun | undefined, source: SourceDefinition) {
  if (!run || run.status === "skipped" || source.status !== "active") {
    return { label: source.status === "active" ? "已跳过" : "候选/未启用", tone: "skipped" };
  }
  if (run.status === "error") return { label: "抓取失败", tone: "error" };
  if (isCacheFallbackRun(run)) return { label: "缓存回退", tone: "warning" };
  return { label: "运行正常", tone: "ok" };
}

function isCacheFallbackRun(run: SourceRun) {
  return Boolean(run.usedCache || /cached|cache|缓存|回退/i.test(run.message ?? ""));
}
