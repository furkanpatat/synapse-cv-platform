import { Sparkles } from "lucide-react";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

export function AiBadge({ children = "AI tarafından analiz edildi", className }: Props) {
  return (
    <span className={`pill pill--ai ${className ?? ""}`}>
      <Sparkles size={12} className="text-ai-2" />
      <span className="font-medium">{children}</span>
    </span>
  );
}
