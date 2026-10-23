"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { BuildingViewerProps } from "@/components/viewer/building-viewer";

export const BuildingViewerLoader = dynamic<BuildingViewerProps>(
  () => import("@/components/viewer/building-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="stage flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-paper/50" strokeWidth={1.5} />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
            Carregando maquete 3D
          </span>
        </div>
      </div>
    ),
  },
);
