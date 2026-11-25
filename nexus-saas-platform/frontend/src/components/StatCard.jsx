import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// ─── Color token map ──────────────────────────────────────────────────────────
// NO animated glowing rings — just recessed icon docks with semantic color fills

const COLOR = {
  indigo: {
    icon:  "text-indigo-400",
    dock:  "bg-indigo-500/[0.09] border-indigo-500/[0.18]",
  },
  emerald: {
    icon:  "text-emerald-400",
    dock:  "bg-emerald-500/[0.09] border-emerald-500/[0.18]",
  },
  amber: {
    icon:  "text-amber-400",
    dock:  "bg-amber-500/[0.09] border-amber-500/[0.18]",
  },
  rose: {
    icon:  "text-rose-400",
    dock:  "bg-rose-500/[0.09] border-rose-500/[0.18]",
  },
  sky: {
    icon:  "text-sky-400",
    dock:  "bg-sky-500/[0.09] border-sky-500/[0.18]",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StatCard — precision enterprise KPI tile
 *
 * Props:
 *   title    {string}  — metric label (uppercased internally)
 *   value    {string|number} — primary KPI value (tabular mono)
 *   subtitle {string}  — supporting detail line
 *   icon     {LucideIcon}
 *   color    {'indigo'|'emerald'|'amber'|'rose'|'sky'}
 *   change   {string}  — e.g. "+12%" delta label
 *   positive {boolean} — true = emerald delta, false = rose delta
 */
export default function StatCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  color = "indigo",
  change,
  positive = true,
}) {
  const c = COLOR[color] ?? COLOR.indigo;

  return (
    <div className="spatial-card group relative overflow-hidden rounded-xl p-5 sm:p-6">
      {/* 1-px chamfered specular edge */}
      <div className="specular-edge" />

      {/* ── Header row: label + icon dock ── */}
      <div className="flex items-start justify-between gap-3">
        <span className="ems-section-title leading-none pt-0.5">{title}</span>

        {Icon && (
          /* Recessed icon dock — NO animated glow rings */
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
              border ${c.dock} ${c.icon}
              transition-transform duration-200 group-hover:scale-105`}
          >
            <Icon size={15} strokeWidth={1.75} />
          </div>
        )}
      </div>

      {/* ── Primary value + delta ── */}
      <div className="mt-3.5 flex items-baseline gap-2.5">
        <span className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight text-white leading-none">
          {value !== undefined && value !== null ? value : "—"}
        </span>

        {change && (
          <span
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-[3px]
              font-semibold text-[10px] leading-none border
              ${
                positive
                  ? "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/[0.18]"
                  : "bg-rose-500/[0.08] text-rose-400 border-rose-500/[0.18]"
              }`}
          >
            {positive ? (
              <ArrowUpRight size={10} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={10} strokeWidth={2.5} />
            )}
            {change}
          </span>
        )}
      </div>

      {/* ── Subtitle / description ── */}
      {(subtitle || description) && (
        <p className="mt-2 text-xs text-zinc-400 truncate font-normal leading-snug">
          {subtitle || description}
        </p>
      )}
    </div>
  );
}
