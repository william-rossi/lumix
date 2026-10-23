import type { Unit } from "@/models";
import { formatArea } from "@/lib/format";

export function UnitFloorPlan({ unit }: { unit: Unit }) {
  const bedrooms = Math.max(unit.rooms.bedrooms, 1);
  const bedroomWidth = 300 / bedrooms;

  return (
    <svg
      viewBox="0 0 400 280"
      role="img"
      aria-label={`Planta esquemática da unidade ${unit.code}`}
      className="w-full text-ink"
    >
      <rect x="0" y="0" width="400" height="280" fill="transparent" />

      <g stroke="currentColor" strokeWidth="1.2" fill="none">
        <rect x="12" y="12" width="376" height="256" />
        <rect x="18" y="18" width="364" height="244" opacity="0.35" />
      </g>

      {/* Living */}
      <g>
        <rect x="18" y="18" width="212" height="126" fill="currentColor" opacity="0.04" />
        <text x="30" y="42" className="fill-current font-mono text-[8px] uppercase tracking-[0.16em] opacity-55">
          Living
        </text>
        <text x="30" y="56" className="fill-current font-mono text-[7px] opacity-35">
          {formatArea(Math.round(unit.area.private * 0.32))}
        </text>
      </g>

      {/* Kitchen */}
      <g>
        <rect x="230" y="18" width="152" height="62" fill="currentColor" opacity="0.06" />
        <text x="242" y="40" className="fill-current font-mono text-[8px] uppercase tracking-[0.16em] opacity-55">
          Cozinha
        </text>
        <text x="242" y="52" className="fill-current font-mono text-[7px] opacity-35">
          {formatArea(Math.round(unit.area.private * 0.12))}
        </text>
      </g>

      {/* Bathroom */}
      <g>
        <rect x="230" y="80" width="74" height="64" fill="currentColor" opacity="0.08" />
        <text x="240" y="100" className="fill-current font-mono text-[8px] uppercase tracking-[0.14em] opacity-55">
          Banho
        </text>
        <circle cx="267" cy="122" r="10" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      </g>

      {/* Circulation */}
      <g>
        <rect x="304" y="80" width="78" height="64" fill="currentColor" opacity="0.03" />
        <text x="314" y="100" className="fill-current font-mono text-[8px] uppercase tracking-[0.14em] opacity-45">
          Hall
        </text>
        <path d="M304 112h78" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
      </g>

      {/* Bedrooms */}
      {Array.from({ length: bedrooms }).map((_, index) => {
        const x = 18 + index * bedroomWidth;
        const isSuite = index < unit.rooms.suites;
        return (
          <g key={index}>
            <rect
              x={x}
              y="144"
              width={bedroomWidth}
              height="90"
              fill="currentColor"
              opacity={isSuite ? 0.07 : 0.04}
              stroke="currentColor"
              strokeWidth="0.6"
              strokeOpacity="0.25"
            />
            <text x={x + 10} y="166" className="fill-current font-mono text-[7.5px] uppercase tracking-[0.12em] opacity-50">
              {isSuite ? "Suíte" : "Dorm."} {index + 1}
            </text>
            <rect
              x={x + 12}
              y="184"
              width={bedroomWidth - 40}
              height="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              strokeOpacity="0.22"
            />
          </g>
        );
      })}

      {/* Balcony */}
      {unit.rooms.hasBalcony && (
        <g>
          <rect
            x="18"
            y="234"
            width={364}
            height="28"
            fill="currentColor"
            opacity="0.03"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            strokeOpacity="0.4"
          />
          <text x="26" y="252" className="fill-current font-mono text-[7.5px] uppercase tracking-[0.18em] opacity-45">
            Varanda {unit.area.balcony ? `· ${formatArea(unit.area.balcony)}` : ""}
          </text>
        </g>
      )}

      {/* Dimensions */}
      <g className="fill-current font-mono text-[6.5px] opacity-30">
        <text x="180" y="274">frente 8,40 m</text>
        <text x="330" y="274" opacity="0.8">prof. 12,20 m</text>
        <text x="22" y="10">PLANTA ESQUEMÁTICA · SEM ESCALA</text>
      </g>
    </svg>
  );
}
