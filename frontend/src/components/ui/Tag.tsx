import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "ai" | "muted";

interface Props {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

const TONES: Record<Tone, string> = {
  default: "pill",
  success: "pill pill--success",
  warning: "pill pill--warning",
  danger: "pill pill--danger",
  muted: "pill",
  ai: "pill pill--ai",
};

export function Tag({ children, tone = "default", className }: Props) {
  return <span className={cn(TONES[tone], className)}>{children}</span>;
}
