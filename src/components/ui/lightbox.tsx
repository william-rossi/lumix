"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { MediaItem } from "@/models";

export function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const count = items.length;
  const current = items[index];

  const next = useCallback(() => {
    if (count === 0) return;
    onIndexChange((index + 1) % count);
  }, [count, index, onIndexChange]);

  const previous = useCallback(() => {
    if (count === 0) return;
    onIndexChange((index - 1 + count) % count);
  }, [count, index, onIndexChange]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [next, previous, onClose]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de fotos"
      className="fixed inset-0 z-[100] flex flex-col bg-stage/95 backdrop-blur-sm animate-fade"
    >
      <div className="flex items-center justify-between border-b border-stage-line px-5 py-4 sm:px-8">
        <span className="eyebrow text-paper/60">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-paper/70 transition-colors hover:text-paper"
          aria-label="Fechar galeria"
        >
          <span className="eyebrow">Fechar</span>
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-16">
        <button
          type="button"
          onClick={previous}
          aria-label="Foto anterior"
          className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-stage-line text-paper/70 transition-colors hover:border-paper hover:text-paper sm:left-6"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <div className="relative h-full w-full max-w-6xl">
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Próxima foto"
          className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-stage-line text-paper/70 transition-colors hover:border-paper hover:text-paper sm:right-6"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="border-t border-stage-line px-5 py-4 sm:px-8">
        <p className="text-sm text-paper/80">{current.alt}</p>
        {current.caption && (
          <p className="mt-1 text-[11px] text-paper/45">{current.caption}</p>
        )}
      </div>
    </div>
  );
}
