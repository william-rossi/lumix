"use client";

import Image from "next/image";
import { useState } from "react";
import { Expand } from "lucide-react";
import type { MediaItem } from "@/models";
import { Lightbox } from "@/components/ui/lightbox";
import { cn } from "@/lib/utils";

const spans = [
  "col-span-2 row-span-2",
  "col-span-1",
  "col-span-1",
  "col-span-1",
  "col-span-1",
  "col-span-2",
];

export function DevelopmentGallery({ images }: { images: MediaItem[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (position: number) => {
    setIndex(position);
    setOpen(true);
  };

  return (
    <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4 md:auto-rows-[210px] auto-rows-[150px]">
      {images.map((image, position) => (
        <button
          key={image.id}
          type="button"
          onClick={() => openAt(position)}
          className={cn(
            "group relative overflow-hidden bg-paper-deep text-left",
            spans[position] ?? "col-span-1",
          )}
          aria-label={`Abrir foto: ${image.alt}`}
        >
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-stage/55 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
          <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <span className="text-[11px] text-paper/90">{image.caption ?? image.alt}</span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-paper/25 text-paper/80 transition-colors group-hover:border-paper group-hover:bg-paper group-hover:text-ink">
              <Expand className="h-3 w-3" strokeWidth={1.5} />
            </span>
          </span>
        </button>
      ))}

      {open && (
        <Lightbox
          items={images}
          index={index}
          onClose={() => setOpen(false)}
          onIndexChange={setIndex}
        />
      )}
    </div>
  );
}
