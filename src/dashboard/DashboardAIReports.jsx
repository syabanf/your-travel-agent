import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { printDocument } from "@/lib/voucher";
import { toast } from "sonner";
import { Sparkles, Send, Loader2, Download, RotateCcw, Lightbulb, Wand2 } from "lucide-react";

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
      const res = await base44.integrations.Core.InvokeLLM({ prompt: text, response_json_schema: REPORT_SCHEMA });
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
    const tables = (report.tables || []).map((t) => `<h3 style="margin:18px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#AD1F23">${t.title}</h3><table><thead><tr>${t.columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("");
    const recs = `<h3 style="margin:18px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#AD1F23">Recommendations</h3><ul>${(report.recommendations || []).map((r) => `<li style="margin-bottom:6px">${r}</li>`).join("")}</ul>`;
    printDocument(report.title, `<h1>${report.title}</h1><p class="muted">${report.subtitle || ""}</p><p style="margin:14px 0">${report.summary}</p>${kpis}${tables}${recs}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI · Demo</p>
        <h1 className="text-2xl font-display font-bold text-ich-primary">AI Report Generator</h1>
        <p className="text-sm text-ich-neutral mt-0.5">Describe the report you want in plain English — Icon Holiday builds it from your live data.</p>
      </header>

      {/* Prompt box */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
            placeholder="e.g. Show me revenue, margin and top suppliers this year"
            className="dash-input flex-1"
          />
          <button onClick={() => generate()} disabled={loading} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Generate
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {DEMO_PROMPTS.map((p) => (
            <button key={p} onClick={() => generate(p)} disabled={loading} className="text-xs text-ich-primary bg-ich-primary/5 hover:bg-ich-gold/10 hover:text-gold rounded-full px-3 py-1.5 transition-colors disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-2xl bg-ich-gold/10 flex items-center justify-center mb-4"><Wand2 className="w-5 h-5 text-gold animate-pulse" /></div>
          <p className="font-display font-semibold text-ich-primary">Analyzing your data…</p>
          <p className="text-sm text-ich-neutral mt-1">Crunching bookings, customers, suppliers and leads to write your report.</p>
        </div>
      )}

      {!loading && !report && (
        <div className="bg-white rounded-2xl border border-dashed border-ich-primary/15 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-ich-gold/10 flex items-center justify-center mx-auto mb-4"><Sparkles className="w-6 h-6 text-gold" /></div>
          <h2 className="font-display font-semibold text-ich-primary">Generate your first report</h2>
          <p className="text-sm text-ich-neutral mt-1 max-w-md mx-auto">Type a request above or tap a suggestion. This demo runs on the built-in AI stub — point it at a real model with <code className="text-gold">configureLLM()</code>.</p>
        </div>
      )}

      {!loading && report && (
        <div className="space-y-4">
          {/* Report header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-ich-primary">{report.title}</h2>
              {report.subtitle && <p className="text-xs text-ich-neutral mt-0.5">{report.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={exportPDF} className="inline-flex items-center gap-1.5 text-sm font-medium text-ich-primary bg-ich-primary/5 hover:bg-ich-primary/10 px-3.5 py-2 rounded-xl"><Download className="w-4 h-4" /> Export PDF</button>
              <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium text-ich-neutral hover:bg-ich-primary/5 px-3 py-2 rounded-xl"><RotateCcw className="w-4 h-4" /> New</button>
            </div>
          </div>

          {/* AI summary */}
          <div className="bg-ich-gold/[0.06] border border-ich-gold/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-gold mb-2"><Sparkles className="w-4 h-4" /><span className="text-xs font-semibold uppercase tracking-wider">Executive summary</span></div>
            <p className="text-sm text-ich-primary leading-relaxed">{report.summary}</p>
          </div>

          {/* KPIs */}
          {report.kpis?.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
              {report.kpis.map((k) => (
                <div key={k.label} className="bg-white rounded-2xl border border-ich-primary/10 p-5 min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-ich-neutral/70">{k.label}</p>
                  <p className="stat-value text-lg lg:text-xl font-display font-bold text-ich-primary mt-1">{k.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tables */}
          {(report.tables || []).map((t) => (
            <div key={t.title} className="bg-white rounded-2xl border border-ich-primary/10 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-ich-primary/10"><h3 className="font-display font-semibold text-ich-primary">{t.title}</h3></div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-ich-neutral/70 border-b border-ich-primary/5">
                  {t.columns.map((c, i) => <th key={c} className={`px-5 py-2.5 font-medium ${i > 0 ? "text-right" : ""}`}>{c}</th>)}
                </tr></thead>
                <tbody>
                  {t.rows.map((r, ri) => (
                    <tr key={ri} className="border-b border-ich-primary/5 last:border-0 hover:bg-ich-primary/[0.02]">
                      {r.map((cell, ci) => <td key={ci} className={`px-5 py-2.5 ${ci === 0 ? "font-medium text-ich-primary" : "text-right text-ich-neutral"}`}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ))}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <div className="bg-white rounded-2xl border border-ich-primary/10 p-5">
              <div className="flex items-center gap-2 text-ich-primary mb-3"><Lightbulb className="w-4 h-4 text-gold" /><h3 className="font-display font-semibold">AI recommendations</h3></div>
              <ul className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ich-neutral">
                    <span className="w-5 h-5 rounded-full bg-ich-gold/10 text-gold flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5">{i + 1}</span>
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
