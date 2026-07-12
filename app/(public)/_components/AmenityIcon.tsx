import {
  Wifi,
  UtensilsCrossed,
  Car,
  Flame,
  Mountain,
  Coffee,
  BookOpen,
  Waves,
  ThermometerSun,
  Droplets,
  Leaf,
  Landmark,
  MapPinned,
  Home,
  Sparkles,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";

const RULES: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /wi-?fi/i, icon: Wifi },
  { match: /restaurant|meal|cafe|cuisine/i, icon: UtensilsCrossed },
  { match: /transfer|desk|guide|permit/i, icon: Car },
  { match: /bonfire|fireplace/i, icon: Flame },
  { match: /mountain|view|valley/i, icon: Mountain },
  { match: /tea|coffee/i, icon: Coffee },
  { match: /library/i, icon: BookOpen },
  { match: /river|water spring|lake/i, icon: Waves },
  { match: /heater|hot water 24/i, icon: ThermometerSun },
  { match: /hot water/i, icon: Droplets },
  { match: /organic|orchard|garden/i, icon: Leaf },
  { match: /monastery|heritage|hosted|family/i, icon: Landmark },
  { match: /walk|bridge|mall|village/i, icon: MapPinned },
  { match: /cooperative|local/i, icon: Home },
];

export function getAmenityIcon(label: string): LucideIcon {
  const rule = RULES.find((r) => r.match.test(label));
  return rule?.icon ?? Sparkles ?? CircleCheck;
}

export function AmenityIcon({ label, className }: { label: string; className?: string }) {
  const Icon = getAmenityIcon(label);
  return <Icon className={className} aria-hidden />;
}
