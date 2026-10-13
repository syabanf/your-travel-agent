import { useState } from "react";
import { backend } from "@/api/backend";
import { printDocument } from "@/lib/voucher";
import { toast } from "sonner";
import { Sparkles, Send, Loader2, Download, RotateCcw, Lightbulb, Wand2 } from "lucide-react";
import { BRAND } from "@/lib/brand";

const DEMO_PROMPTS = [
  "Revenue and margin summary",
  "Supplier performance and commissions",
  "Sales pipeline and lead conversion",
  "Customer tiers and lifetime value",
  "Marketing campaign performance",
  "Overall business overview",
];

const REPORT_SCHEMA = { type: "object", properties: { report: { type: "object" } } };

export default function DashboardAIReports() {
  const [prompt, setPrompt] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (p) => {
    const text = (p ?? prompt).trim();
    if (!text) { toast.error("Describe the report you want"); return; }
    setPrompt(text);
    setLoading(true);
    setReport(null);
    try {
      const res = await backend.ask({ prompt: text, schema: REPORT_SCHEMA });
      if (res?.report) setReport(res.report);
      else toast.error("Couldn't generate a report");
    } catch {
      toast.error("Report generation failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setReport(null); setPrompt(""); };

  const exportPDF = () => {
    if (!report) return;
    const kpis = `<div class="grid">${report.kpis.map((k) => `<div class="row"><div class="k">${k.label}</div><div class="v">${k.value}</div></div>`).join("")}</div>`;
    const tables = (report.tables || []).map((t) => `<h3 style="margin:18px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.accent}">${t.title}</h3><table><thead><tr>${t.columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("");
    const recs = `<h3 style="margin:18px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.accent}">Recommendations</h3><ul>${(report.recommendations || []).map((r) => `<li style="margin-bottom:6px">${r}</li>`).join("")}</ul>`;
    printDocument(report.title, `<h1>${report.title}</h1><p class="muted">${report.subtitle || ""}</p><p style="margin:14px 0">${report.summary}</p>${kpis}${tables}${recs}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-accent-strong font-semibold mb-1 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI · Demo</p>
        <h1 className="text-2xl font-display font-bold text-foreground">AI Report Generator</h1>
        <p className="text-sm text-muted mt-0.5">Describe the report you want in plain English — Icon Holiday builds it from your live data.</p>
      </header>

      {/* Prompt box */}
      <div className="bg-card rounded-card p-4 mb-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
            placeholder="e.g. Show me revenue, margin and top suppliers this year"
            className="dash-input flex-1"
          />
          <button onClick={() => generate()} disabled={loading} className="bg-accent-strong text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-50 rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Generate
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {DEMO_PROMPTS.map((p) => (
            <button key={p} onClick={() => generate(p)} disabled={loading} className="text-xs text-foreground bg-surface hover:bg-accent/10 hover:text-accent-strong rounded-full px-3 py-1.5 transition-colors disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-card rounded-card p-12 flex flex-col items-center justify-center text-center shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center mb-4"><Wand2 className="w-5 h-5 text-accent-strong animate-pulse" /></div>
          <p className="font-display font-semibold text-foreground">Analyzing your data…</p>
          <p className="text-sm text-muted mt-1">Crunching bookings, customers, suppliers and leads to write your report.</p>
        </div>
      )}

      {!loading && !report && (
        <div className="bg-white rounded-2xl border border-dashed border-foreground/15 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4"><Sparkles className="w-6 h-6 text-accent-strong" /></div>
          <h2 className="font-display font-semibold text-foreground">Generate your first report</h2>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">Type a request above or tap a suggestion. This demo runs on the built-in AI stub — point it at a real model with <code className="text-accent-strong">configureLLM()</code>.</p>
        </div>
      )}

      {!loading && report && (
        <div className="space-y-4">
          {/* Report header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">{report.title}</h2>
              {report.subtitle && <p className="text-xs text-muted mt-0.5">{report.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={exportPDF} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground bg-surface hover:bg-surface px-3.5 py-2 rounded-xl"><Download className="w-4 h-4" /> Export PDF</button>
              <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:bg-surface px-3 py-2 rounded-xl"><RotateCcw className="w-4 h-4" /> New</button>
            </div>
          </div>

          {/* AI summary */}
          <div className="bg-accent/[0.06] border border-accent/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-accent-strong mb-2"><Sparkles className="w-4 h-4" /><span className="text-xs font-semibold uppercase tracking-wider">Executive summary</span></div>
            <p className="text-sm text-foreground leading-relaxed">{report.summary}</p>
          </div>

          {/* KPIs */}
          {report.kpis?.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
              {report.kpis.map((k) => (
                <div key={k.label} className="bg-card rounded-card p-5 min-w-0 shadow-card">
                  <p className="text-[11px] uppercase tracking-wider text-muted">{k.label}</p>
                  <p className="stat-value text-lg lg:text-xl font-display font-bold text-foreground mt-1">{k.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tables */}
          {(report.tables || []).map((t) => (
            <div key={t.title} className="bg-card rounded-card overflow-hidden shadow-card">
              <div className="px-5 py-3.5 border-b border-border"><h3 className="font-display font-semibold text-foreground">{t.title}</h3></div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border">
                  {t.columns.map((c, i) => <th key={c} className={`px-5 py-2.5 font-medium ${i > 0 ? "text-right" : ""}`}>{c}</th>)}
                </tr></thead>
                <tbody>
                  {t.rows.map((r, ri) => (
                    <tr key={ri} className="border-b border-border last:border-0 hover:bg-surface">
                      {r.map((cell, ci) => <td key={ci} className={`px-5 py-2.5 ${ci === 0 ? "font-medium text-foreground" : "text-right text-muted"}`}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ))}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <div className="bg-card rounded-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-foreground mb-3"><Lightbulb className="w-4 h-4 text-accent-strong" /><h3 className="font-display font-semibold">AI recommendations</h3></div>
              <ul className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent-strong flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
