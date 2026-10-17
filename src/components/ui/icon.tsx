import {
  Search,
  Heart,
  Plus,
  Clock,
  Star,
  Grid2X2,
  List,
  ChevronRight,
  ListFilter,
  CalendarDays,
  ShoppingBag,
  Menu,
  X,
  Upload,
  Pencil,
  Play,
  Check,
  House,
  Copy,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  search: Search,
  heart: Heart,
  plus: Plus,
  clock: Clock,
  star: Star,
  grid: Grid2X2,
  list: List,
  chevron: ChevronRight,
  filter: ListFilter,
  calendar: CalendarDays,
  bag: ShoppingBag,
  menu: Menu,
  x: X,
  upload: Upload,
  edit: Pencil,
  play: Play,
  check: Check,
  home: House,
  copy: Copy,
};

export default function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const Component = icons[name] ?? Search;

  return (
    <Component
      className="icon"
      size={size}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  );
}
