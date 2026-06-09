import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ControlSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const ControlSwitch = ({ checked, onCheckedChange, className }: ControlSwitchProps) => {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={checked ? "Turn light off" : "Turn light on"}
      className={cn("switch-premium", className)}
    />
  );
};

export default ControlSwitch;