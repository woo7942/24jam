import { Shield, CheckCircle2, Award, Loader2 } from "lucide-react";

interface VerificationBadgeProps {
  level: string | null | undefined;
  size?: "sm" | "md";
  showUnverified?: boolean;
}

const CONFIG = {
  unverified: {
    label: "미인증",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: Shield,
  },
  pending: {
    label: "심사 중",
    color: "text-orange-700",
    bg: "bg-orange-50",
    icon: Loader2,
  },
  verified: {
    label: "인증 기사",
    color: "text-mint-700",
    bg: "bg-mint-50",
    icon: CheckCircle2,
  },
  veteran: {
    label: "베테랑",
    color: "text-purple-700",
    bg: "bg-purple-50",
    icon: Award,
  },
};

export function VerificationBadge({
  level,
  size = "sm",
  showUnverified = false,
}: VerificationBadgeProps) {
  const key = (level || "unverified") as keyof typeof CONFIG;
  const config = CONFIG[key] ?? CONFIG.unverified;

  // 미인증/심사중은 기본적으로 표시 안 함
  if (key === "unverified" && !showUnverified) return null;
  if (key === "pending" && !showUnverified) return null;

  const Icon = config.icon;
  const isPending = key === "pending";

  const sizeClass =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] gap-0.5"
      : "px-2 py-0.5 text-xs gap-1";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${config.bg} ${config.color} ${sizeClass}`}
    >
      <Icon className={`${iconSize} ${isPending ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}
