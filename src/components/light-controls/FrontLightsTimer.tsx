import { Clock3, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FrontLightsTimer = () => {
  const [onTime, setOnTime] = useState("18:30");
  const [offTime, setOffTime] = useState("06:00");

  const handleSendRequest = () => {
    const message = `Hi, I'd like to update the front light timer schedule.\n\n⏰ Turn ON: ${onTime}\n⏰ Turn OFF: ${offTime}\n\nPlease update the timer settings. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919971925145?text=${encoded}`, "_blank");
  };

  return (
    <section className="timer-panel card-glass rounded-[calc(var(--radius)+0.125rem)] p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-foreground">
          <Clock3 size={16} className="text-primary" />
          <h2 className="text-sm font-semibold tracking-[0.04em]">Front Light Timer</h2>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
            Coming Soon
          </span>
          <p className="text-xs text-muted-foreground">
            Auto-scheduling will be live soon!
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="timer-label">Turn ON</span>
          <Input
            type="time"
            value={onTime}
            onChange={(e) => setOnTime(e.target.value)}
            className="timer-input"
          />
        </label>
        <label className="space-y-2">
          <span className="timer-label">Turn OFF</span>
          <Input
            type="time"
            value={offTime}
            onChange={(e) => setOffTime(e.target.value)}
            className="timer-input"
          />
        </label>
      </div>

      <Button
        onClick={handleSendRequest}
        className="mt-4 w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white font-semibold tracking-wide gap-2"
      >
        <MessageCircle size={18} />
        Send Request via WhatsApp
      </Button>

      <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        Manually request a timer change
      </p>
    </section>
  );
};

export default FrontLightsTimer;
