import type { ReactNode } from "react";

import ControlSwitch from "@/components/light-controls/ControlSwitch";
import { cn } from "@/lib/utils";

interface LightControlCardProps {
  title: string;
  active: boolean;
  delay: number;
  onToggle: (checked: boolean) => void;
  children: ReactNode;
}

const LightControlCard = ({ title, active, delay, onToggle, children }: LightControlCardProps) => {
  return (
    <article
      className={cn(
        "card-glass light-card flex h-52 flex-col justify-between p-5 transition-all duration-150",
        active && "card-glass-active light-card-active",
      )}
      style={{ animation: `fadeInUp 0.55s ${delay}s both ease-out` }}
    >
      <div className={cn("control-visual", active && "control-visual-active")}>{children}</div>

      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-medium tracking-[0.02em] text-foreground">{title}</p>
        <ControlSwitch checked={active} onCheckedChange={onToggle} />
      </div>
    </article>
  );
};

export default LightControlCard;
