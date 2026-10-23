import type { Unit } from "@/models";
import { cn } from "@/lib/utils";

export function UnitMix({
  units,
  showLabels = false,
  className,
}: {
  units: Unit[];
  showLabels?: boolean;
  className?: string;
}) {
  const counts = units.reduce(
    (acc, unit) => {
      acc[unit.status] += 1;
      return acc;
    },
    { available: 0, reserved: 0, sold: 0, blocked: 0 },
  );
  const total = units.length || 1;

  return (
    <div className={className}>
      <div className="flex h-1.5 w-full gap-px overflow-hidden bg-paper-deep">
        <span
          className="bg-forest"
          style={{ width: `${(counts.available / total) * 100}%` }}
        />
        <span
          className="bg-amber"
          style={{ width: `${(counts.reserved / total) * 100}%` }}
        />
        <span
          className="bg-line-strong"
          style={{ width: `${(counts.sold / total) * 100}%` }}
        />
        <span
          className="bg-ink/25"
          style={{ width: `${(counts.blocked / total) * 100}%` }}
        />
      </div>
      {showLabels && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px] text-muted sm:grid-cols-4">
          <Legend label="Disponíveis" value={counts.available} className="bg-forest" />
          <Legend label="Reservadas" value={counts.reserved} className="bg-amber" />
          <Legend label="Vendidas" value={counts.sold} className="bg-line-strong" />
          <Legend label="Bloqueadas" value={counts.blocked} className="bg-ink/25" />
        </div>
      )}
    </div>
  );
}

function Legend({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-1.5 w-1.5 rounded-full", className)} />
      <span className="truncate">{label}</span>
      <span className="ml-auto font-mono text-[9px] tabular-nums text-ink-soft">
        {value}
      </span>
    </div>
  );
}
