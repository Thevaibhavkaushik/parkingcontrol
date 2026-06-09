import { useCallback, useEffect, useRef, useState } from "react";
import { Sun, Ban } from "lucide-react";
import FrontLightsTimer from "@/components/light-controls/FrontLightsTimer";
import LightControlCard from "@/components/light-controls/LightControlCard";
import SignatureFooter from "@/components/light-controls/SignatureFooter";
import { Button } from "@/components/ui/button";
import { setLight, setMultipleLights, type LightKey } from "@/lib/blynk";
import { supabase } from "@/integrations/supabase/client";
import punchOff from "@/assets/punch-off.jpg";
import punchOn from "@/assets/punch-on.jpg";
import xuvOff from "@/assets/xuv-off.jpg";
import xuvOn from "@/assets/xuv-on.jpg";
import wallOff from "@/assets/wall-off.jpg";
import wallOn from "@/assets/wall-on.jpg";

interface LightState {
  namePlate: boolean;
  wallLight: boolean;
  parking1: boolean;
  parking2: boolean;
}

interface FrontLightTimerState {
  enabled: boolean;
  onTime: string;
  offTime: string;
}

const Index = () => {
  const [lights, setLights] = useState<LightState>({
    namePlate: false,
    wallLight: false,
    parking1: false,
    parking2: false,
  });
  const [frontLightTimer, setFrontLightTimer] = useState<FrontLightTimerState>({
    enabled: false,
    onTime: "18:30",
    offTime: "06:00",
  });

  const toggle = useCallback((key: keyof LightState, checked: boolean) => {
    setLights((prev) => ({ ...prev, [key]: checked }));
    setLight(key as LightKey, checked);
  }, []);

  const setFrontLights = useCallback((checked: boolean) => {
    setLights((prev) => ({
      ...prev,
      namePlate: checked,
      wallLight: checked,
    }));
    setMultipleLights(["namePlate", "wallLight"], checked);
  }, []);

  const updateTimerValue = useCallback((field: "onTime" | "offTime", value: string) => {
    setFrontLightTimer((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Save timer to backend when changed
  useEffect(() => {
    if (!frontLightTimer.enabled) return;
    supabase.functions.invoke("light-timer", {
      body: {
        action: "set",
        onTime: frontLightTimer.onTime,
        offTime: frontLightTimer.offTime,
        enabled: frontLightTimer.enabled,
      },
    }).catch(console.error);
  }, [frontLightTimer]);

  const handleTimerToggle = useCallback((enabled: boolean) => {
    setFrontLightTimer((prev) => ({ ...prev, enabled }));
    if (!enabled) {
      supabase.functions.invoke("light-timer", {
        body: { action: "disable" },
      }).catch(console.error);
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen pb-8">
      {/* Header */}
      <header
        className="w-full pt-14 pb-6 text-center"
        style={{ animation: "fadeInUp 0.7s both ease-out" }}
      >
        <h1 className="font-heading text-3xl font-semibold text-gradient-gold tracking-wide">
          Parking Lights
        </h1>
        <div className="flex items-center justify-end max-w-[280px] mx-auto mt-1 gap-3">
          <p className="text-muted-foreground text-xs tracking-[0.3em] uppercase">
            Control
          </p>
          <p className="text-foreground/70 text-[11px] italic" style={{ fontFamily: "var(--font-signature)" }}>
            by Vaibhav Kaushik
          </p>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md px-5">
        {/* Name Plate */}
        <LightControlCard active={lights.namePlate} delay={0.15} title="Name Plate" onToggle={(checked) => toggle("namePlate", checked)}>
          <div className="flex h-full items-center justify-center">
            <span className={`name-plate-chip whitespace-nowrap ${lights.namePlate ? "name-plate-chip-active" : ""}`}>
              K. K. KAUSHIK
            </span>
          </div>
        </LightControlCard>

        {/* Wall Light */}
        <LightControlCard active={lights.wallLight} delay={0.25} title="Wall Light" onToggle={(checked) => toggle("wallLight", checked)}>
          <div className="flex items-center justify-center h-full overflow-hidden rounded-lg">
            <img
              src={lights.wallLight ? wallOn : wallOff}
              alt="Wall light"
              loading="eager"
              decoding="async"
              className={`icon-image h-20 w-auto object-contain ${lights.wallLight ? "icon-image-active" : ""}`}
            />
          </div>
        </LightControlCard>

        {/* Parking Light 1 */}
        <LightControlCard active={lights.parking1} delay={0.35} title="Parking Light 1" onToggle={(checked) => toggle("parking1", checked)}>
          <div className="relative flex h-full items-center justify-center overflow-hidden rounded-lg">
            <img
              src={lights.parking1 ? xuvOn : xuvOff}
              alt="Parking light 1"
              loading="eager"
              decoding="async"
              className={`icon-image h-24 w-auto object-contain ${lights.parking1 ? "icon-image-active" : ""}`}
            />
            {lights.parking1 && (
              <div className="absolute inset-0 light-beam pointer-events-none" />
            )}
          </div>
        </LightControlCard>

        {/* Parking Light 2 */}
        <LightControlCard active={lights.parking2} delay={0.45} title="Parking Light 2" onToggle={(checked) => toggle("parking2", checked)}>
          <div className="relative flex h-full items-center justify-center overflow-hidden rounded-lg">
            <img
              src={lights.parking2 ? punchOn : punchOff}
              alt="Parking light 2"
              loading="eager"
              decoding="async"
              className={`icon-image h-24 w-auto object-contain ${lights.parking2 ? "icon-image-active" : ""}`}
            />
            {lights.parking2 && (
              <div className="absolute inset-0 light-beam pointer-events-none" />
            )}
          </div>
        </LightControlCard>
      </div>

      {/* Master Controls */}
      <div
        className="w-full max-w-md px-5 mt-6 flex flex-col gap-3"
        style={{ animation: "fadeInUp 0.6s 0.55s both ease-out" }}
      >
        <Button
          onClick={() => setFrontLights(true)}
          className="btn-glow h-14 w-full rounded-2xl text-sm font-semibold tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sun size={18} />
          Turn ON Front Lights
        </Button>
        <Button
          onClick={() => setFrontLights(false)}
          variant="secondary"
          className="master-button-muted h-14 w-full rounded-2xl text-sm font-semibold tracking-[0.18em] text-foreground transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Ban size={18} />
          Turn OFF Front Lights
        </Button>
      </div>

      <div
        className="w-full max-w-md px-5 mt-4"
        style={{ animation: "fadeInUp 0.6s 0.6s both ease-out" }}
      >
        <FrontLightsTimer />
      </div>

      <SignatureFooter />
    </div>
  );
};

export default Index;
