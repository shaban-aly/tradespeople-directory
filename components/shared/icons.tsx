import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Link,
  List,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Moon,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Sun,
  Tags,
  Trash2,
  TrendingUp,
  Users,
  Wrench,
  X,
  type LucideProps,
} from "lucide-react";

type IconProps = {
  className?: string;
};

export function IconPhone(props: LucideProps) {
  return <Phone {...props} />;
}

export function IconPin(props: LucideProps) {
  return <MapPin {...props} />;
}

export function IconCheck(props: LucideProps) {
  return <Check strokeWidth={3} {...props} />;
}

export function IconSun(props: LucideProps) {
  return <Sun {...props} />;
}

export function IconMoon(props: LucideProps) {
  return <Moon {...props} />;
}

export function IconArrow(props: LucideProps) {
  return <ArrowLeft {...props} />;
}

export function IconArrowUp(props: LucideProps) {
  return <ArrowUp {...props} />;
}

export function IconGlobe(props: LucideProps) {
  return <Globe {...props} />;
}

export function IconCamera(props: LucideProps) {
  return <Camera {...props} />;
}

export function IconX(props: LucideProps) {
  return <X {...props} />;
}

export function IconHeartHandshake(props: LucideProps) {
  return <HeartHandshake {...props} />;
}

export function IconMenu(props: LucideProps) {
  return <Menu {...props} />;
}

export function IconSliders(props: LucideProps) {
  return <SlidersHorizontal {...props} />;
}

export function IconChevronDown(props: LucideProps) {
  return <ChevronDown {...props} />;
}

export function IconLayoutDashboard(props: LucideProps) {
  return <LayoutDashboard {...props} />;
}

export function IconGrid(props: LucideProps) {
  return <LayoutGrid {...props} />;
}

export function IconList(props: LucideProps) {
  return <List {...props} />;
}

export function IconInbox(props: LucideProps) {
  return <Inbox {...props} />;
}

export function IconUsers(props: LucideProps) {
  return <Users {...props} />;
}

export function IconTags(props: LucideProps) {
  return <Tags {...props} />;
}

export function IconLogOut(props: LucideProps) {
  return <LogOut {...props} />;
}

export function IconRefresh(props: LucideProps) {
  return <RefreshCw {...props} />;
}

export function IconSearch(props: LucideProps) {
  return <Search {...props} />;
}

export function IconStar(props: LucideProps) {
  return <Star {...props} />;
}

export function IconPlus(props: LucideProps) {
  return <Plus {...props} />;
}

export function IconEdit(props: LucideProps) {
  return <Pencil {...props} />;
}

export function IconTrash(props: LucideProps) {
  return <Trash2 {...props} />;
}

export function IconAlert(props: LucideProps) {
  return <AlertTriangle {...props} />;
}

export function IconEye(props: LucideProps) {
  return <Eye {...props} />;
}

export function IconEyeOff(props: LucideProps) {
  return <EyeOff {...props} />;
}

export function IconExternalLink(props: LucideProps) {
  return <ExternalLink {...props} />;
}

export function IconTrendingUp(props: LucideProps) {
  return <TrendingUp {...props} />;
}

export function IconChart(props: LucideProps) {
  return <BarChart3 {...props} />;
}

export function IconWrench(props: LucideProps) {
  return <Wrench {...props} />;
}

export function IconLock(props: LucideProps) {
  return <Lock {...props} />;
}

export function IconMail(props: LucideProps) {
  return <Mail {...props} />;
}

export function IconLink(props: LucideProps) {
  return <Link {...props} />;
}

export function IconWhatsApp({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.5L3 21l2-5.7A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2-1.5 1z" />
    </svg>
  );
}

export function IconFacebook({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function IconInstagram({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function IconTikTok({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4c.5 2.5 2 4 5 4.5" />
    </svg>
  );
}
