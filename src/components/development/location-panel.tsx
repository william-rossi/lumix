import { MapPin } from "lucide-react";
import type { Address, NearbyPlace } from "@/models";

export function LocationPanel({
  address,
  nearby,
}: {
  address: Address;
  nearby: NearbyPlace[];
}) {
  const coords = address.coordinates;
  const mapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${address.street} ${address.number}, ${address.neighborhood}, ${address.city} ${address.state}`,
      )}`;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <div className="relative aspect-[4/3] overflow-hidden border border-line bg-paper-deep">
          <svg
            viewBox="0 0 640 480"
            className="absolute inset-0 h-full w-full text-ink"
            aria-hidden="true"
          >
            <rect width="640" height="480" fill="#e8e2d5" />
            <g stroke="#d3cbbb" strokeWidth="1">
              {Array.from({ length: 13 }).map((_, index) => (
                <line
                  key={`v${index}`}
                  x1={index * 52}
                  y1="0"
                  x2={index * 52 + 120}
                  y2="480"
                  opacity="0.55"
                />
              ))}
              {Array.from({ length: 10 }).map((_, index) => (
                <line
                  key={`h${index}`}
                  x1="0"
                  y1={index * 52}
                  x2="640"
                  y2={index * 52 + 26}
                  opacity="0.5"
                />
              ))}
            </g>
            <g fill="#dfd8c9">
              <rect x="64" y="92" width="120" height="76" />
              <rect x="216" y="52" width="88" height="116" />
              <rect x="342" y="96" width="132" height="70" />
              <rect x="482" y="168" width="92" height="88" />
              <rect x="88" y="228" width="96" height="104" />
              <rect x="238" y="214" width="132" height="62" />
              <rect x="402" y="292" width="128" height="82" />
              <rect x="176" y="352" width="104" height="78" />
            </g>
            <path
              d="M0 400 C 140 340, 240 430, 360 372 S 560 300, 640 340"
              fill="none"
              stroke="#b9c8c0"
              strokeWidth="18"
              opacity="0.8"
            />
            <path
              d="M0 400 C 140 340, 240 430, 360 372 S 560 300, 640 340"
              fill="none"
              stroke="#e8e2d5"
              strokeWidth="10"
              opacity="0.5"
            />
            <path
              d="M-20 250 L 300 40"
              stroke="#cfc7b6"
              strokeWidth="22"
            />
            <path
              d="M-20 250 L 300 40"
              stroke="#e8e2d5"
              strokeWidth="2"
              strokeDasharray="10 10"
            />
            <g>
              <circle cx="320" cy="240" r="46" fill="#c8492c" opacity="0.08" />
              <circle cx="320" cy="240" r="26" fill="#c8492c" opacity="0.12" />
              <circle cx="320" cy="240" r="6" fill="#c8492c" />
            </g>
            <g className="fill-current font-mono" opacity="0.35">
              <text x="20" y="470" fontSize="9" letterSpacing="2">
                {address.neighborhood.toUpperCase()}
              </text>
              <text x="486" y="30" fontSize="9" letterSpacing="2">
                {address.city.toUpperCase()}
              </text>
              <text x="340" y="228" fontSize="8" letterSpacing="1.5">
                {address.street}
              </text>
            </g>
          </svg>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 border border-line bg-paper/90 px-2.5 py-1.5 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-ink">
              {address.neighborhood} · {address.city} / {address.state}
            </span>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute right-3 top-3 border border-ink/15 bg-paper/90 px-2.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            Abrir no mapa ↗
          </a>
        </div>
      </div>

      <div className="lg:col-span-5">
        <p className="eyebrow text-muted">Endereço</p>
        <p className="mt-2 font-display text-2xl leading-snug text-ink">
          {address.street}, {address.number}
          {address.complement ? ` · ${address.complement}` : ""}
        </p>
        <p className="mt-1 text-[12px] text-muted">
          {address.neighborhood} · {address.city} / {address.state} ·{" "}
          {address.zipCode}
        </p>

        {coords && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted/60">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}

        {nearby.length > 0 && (
          <div className="mt-6 border-t border-line">
            <div className="flex items-center justify-between border-b border-line py-2.5">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/60">
                Perto de você
              </span>
              <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/60">
                A pé / carro
              </span>
            </div>
            <ul>
              {nearby.map((place) => (
                <li
                  key={place.label}
                  className="flex items-center justify-between gap-4 border-b border-line py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">{place.label}</p>
                    <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted/60">
                      {place.category}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-lg tabular-nums text-ink">
                    {place.minutes}
                    <span className="ml-1 font-sans text-[9px] uppercase tracking-wide text-muted">
                      min
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-muted/70">
          Tempos estimados a partir do endereço do empreendimento. Consulte a
          imobiliária para confirmar.
        </p>
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted/40">
          Dados do empreendimento
        </p>
      </div>
    </div>
  );
}
