import type { LucideProps } from "lucide-react";
import {
  Bell,
  Bike,
  Blocks,
  Briefcase,
  Building2,
  Coffee,
  Dumbbell,
  Leaf,
  Package,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  WashingMachine,
  Waves,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  bell: Bell,
  bike: Bike,
  blocks: Blocks,
  briefcase: Briefcase,
  building: Building2,
  coffee: Coffee,
  dumbbell: Dumbbell,
  leaf: Leaf,
  package: Package,
  paw: PawPrint,
  shield: ShieldCheck,
  sparkles: Sparkles,
  sun: Sun,
  users: Users,
  washer: WashingMachine,
  waves: Waves,
  zap: Zap,
};

export function AmenityIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon className={className} strokeWidth={1.25} aria-hidden="true" />;
}
