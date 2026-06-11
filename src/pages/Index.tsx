import { useCallback, useEffect, useState } from "react";
import {
  Settings,
  Bolt,
  Sparkles,
  Lightbulb,
  Car,
  Moon,
  CloudSun,
  Info,
  Clock,
  Search,
  Plus,
  ArrowUpRight,
  Volume2,
  VolumeX,
  Home,
  User,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  setLight,
  setMultipleLightsBatch,
  getLightStates,
  checkHardwareStatus,
  updateSchedule,
  getBlynkToken,
  saveBlynkToken,
  type LightKey,
} from "@/lib/blynk";

import houseBothOff from "@/assets/house-both-off.jpg";
import houseWallOn from "@/assets/house-wall-on.jpg";
import houseNameOn from "@/assets/house-name-on.jpg";
import houseBothOn from "@/assets/house-both-on.jpg";
import siriLogo from "@/assets/siri-logo.png";
import alexaLogo from "@/assets/alexa-logo.png";
import exteriorBg from "@/assets/exterior-bg.jpg";

import deviceNameplate from "@/assets/device-nameplate.png";
import deviceWallLight from "@/assets/device-walllight.png";
import deviceParking from "@/assets/device-parking.png";
import deviceAmbient from "@/assets/device-ambient.png";

interface LightState {
  namePlate: boolean;
  wallLight: boolean;
  parking1: boolean;
  parking2: boolean;
}

const Index = () => {
  // Stored preferences
  const [name, setName] = useState<string>(() => localStorage.getItem("user_name") || "");
  const [blynkToken, setBlynkToken] = useState<string>(() => getBlynkToken());
  const [homeTheme, setHomeTheme] = useState<"realistic" | "vector">(() => 
    (localStorage.getItem("home_theme") as "realistic" | "vector") || "realistic"
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("app_theme") !== "light";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    triggerHaptic(12);
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("app_theme", next ? "dark" : "light");
      return next;
    });
  };

  // Setup view / modals
  const [showSetup, setShowSetup] = useState<boolean>(!localStorage.getItem("user_name"));
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // Setup / Settings form states
  const [setupName, setSetupName] = useState<string>("");
  const [setupTheme, setSetupTheme] = useState<"realistic" | "vector">("realistic");
  const [settingsName, setSettingsName] = useState<string>("");
  const [settingsToken, setSettingsToken] = useState<string>("");
  const [settingsTheme, setSettingsTheme] = useState<"realistic" | "vector">("realistic");

  // Dashboard states
  const [lights, setLights] = useState<LightState>({
    namePlate: false,
    wallLight: false,
    parking1: false,
    parking2: false,
  });
  const [hardwareOnline, setHardwareOnline] = useState<boolean>(false);
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [weatherDesc, setWeatherDesc] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  // Scheduling states
  const [onTime, setOnTime] = useState<string>("18:30");
  const [offTime, setOffTime] = useState<string>("06:00");
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=28.69&longitude=77.29&current=temperature_2m,weather_code,is_day,precipitation,rain"
      );
      if (!res.ok) throw new Error("Weather API error");
      const data = await res.json();
      if (data?.current) {
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code ?? 0;
        const isDay = data.current.is_day ?? 1;
        const rain = data.current.rain ?? 0;
        const precip = data.current.precipitation ?? 0;
        setCurrentTemp(temp);
        
        if (temp <= 16) {
          setWeatherDesc("It's too cold outside");
        } else if ([95, 96, 99].includes(code)) {
          setWeatherDesc("It's thunderstorm outside");
        } else if (rain > 0 || precip > 0 || [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
          setWeatherDesc("It's raining outside");
        } else {
          if (isDay === 0) {
            setWeatherDesc("It's a clear night outside");
          } else {
            setWeatherDesc("It's sunny outside");
          }
        }
      }
    } catch (err) {
      console.error("Error fetching weather:", err);
    }
  }, []);

  // Load weather on mount
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Poll weather every 30 seconds
  useEffect(() => {
    if (showSetup) return;
    const interval = setInterval(() => {
      fetchWeather();
    }, 30000);
    return () => clearInterval(interval);
  }, [showSetup, fetchWeather]);

  // Poll states from Blynk API
  const syncBlynkStates = useCallback(async () => {
    const states = await getLightStates();
    setLights({
      namePlate: states.namePlate,
      wallLight: states.wallLight,
      parking1: states.parking1,
      parking2: states.parking2,
    });
    
    if (states.schedule && states.schedule.includes(",")) {
      const [on, off] = states.schedule.split(",");
      if (on && off) {
        setOnTime(on.trim());
        setOffTime(off.trim());
      }
    }

    const online = await checkHardwareStatus();
    setHardwareOnline(online);
  }, []);

  // Set up polling loop
  useEffect(() => {
    if (showSetup) return;

    syncBlynkStates();
    const interval = setInterval(() => {
      syncBlynkStates();
    }, 8000);

    return () => clearInterval(interval);
  }, [showSetup, syncBlynkStates]);

  // Haptic feedback helper
  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if (!muted && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [muted]);

  // Handle single switch toggle
  const handleToggle = useCallback(async (key: LightKey, checked: boolean) => {
    triggerHaptic(15);
    setLights((prev) => ({ ...prev, [key]: checked }));
    await setLight(key, checked);
  }, [muted, triggerHaptic]);

  // Handle batch ON/OFF for Front Lights (Legacy & Wall Light)
  const handleBatchToggle = useCallback(async (on: boolean) => {
    if (on) {
      triggerHaptic([25, 15, 25]);
    } else {
      triggerHaptic(25);
    }

    setLights((prev) => ({
      ...prev,
      namePlate: on,
      wallLight: on,
    }));

    await setMultipleLightsBatch(on);
    toast.success(`Front lights turned ${on ? "ON" : "OFF"}`);
  }, [muted, triggerHaptic]);

  // Save Name Setup
  const handleSaveSetup = () => {
    const trimmed = setupName.trim();
    if (trimmed) {
      triggerHaptic(30);
      localStorage.setItem("user_name", trimmed);
      localStorage.setItem("home_theme", setupTheme);
      setName(trimmed);
      setHomeTheme(setupTheme);
      setShowSetup(false);
      toast.success(`Welcome to your dashboard, ${trimmed}!`);
    }
  };

  // Open Settings Modal
  const handleOpenSettings = () => {
    triggerHaptic(10);
    setSettingsName(name);
    setSettingsToken(localStorage.getItem("blynk_token") || "");
    setSettingsTheme(homeTheme);
    setShowSettings(true);
  };

  // Save Settings Changes
  const handleSaveSettings = () => {
    const trimmedName = settingsName.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }

    triggerHaptic(30);
    localStorage.setItem("user_name", trimmedName);
    setName(trimmedName);
    localStorage.setItem("home_theme", settingsTheme);
    setHomeTheme(settingsTheme);

    const prevToken = getBlynkToken();
    const nextToken = settingsToken.trim();
    saveBlynkToken(nextToken);
    setBlynkToken(getBlynkToken());

    setShowSettings(false);
    toast.success("Settings saved successfully");

    // Force refresh states with new token
    if (prevToken !== getBlynkToken()) {
      syncBlynkStates();
    }
  };

  // Save Scheduling V10
  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    triggerHaptic(20);

    try {
      await updateSchedule(onTime, offTime);
      toast.success("Auto-schedule configuration saved");
    } catch (err) {
      console.error("Error saving schedule:", err);
      toast.error("Failed to save schedule");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Setup View
  if (showSetup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0E] p-5">
        <div className="absolute inset-0 bg-radial-gradient opacity-30 pointer-events-none" />
        <div className="w-full max-w-md glass-setup-card p-8 text-center space-y-6 animate-in fade-in duration-300 overflow-y-auto max-h-[95vh]">
          <h2 className="text-3xl font-heading font-semibold text-gradient-gold tracking-wide">
            Welcome
          </h2>
          <p className="text-sm text-neutral-400">
            Please enter your name to customize your smart lighting dashboard.
          </p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your first name"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-center text-lg font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveSetup();
              }}
            />

            <div className="space-y-2.5 text-left pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block px-1">
                Choose Home Display Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setSetupTheme("realistic");
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    setupTheme === "realistic"
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
                  }`}
                >
                  <img
                    src={houseBothOn}
                    alt="Realistic Facade"
                    className="w-full h-12 object-cover rounded-lg border border-white/10"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">Realistic</span>
                    <span className="block text-[8px] text-neutral-500 mt-0.5 leading-tight">Interactive real house facade</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setSetupTheme("vector");
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    setupTheme === "vector"
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
                  }`}
                >
                  <img
                    src={exteriorBg}
                    alt="Vector Villa"
                    className="w-full h-12 object-cover rounded-lg border border-white/10"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">Vector / Villa</span>
                    <span className="block text-[8px] text-neutral-500 mt-0.5 leading-tight">General villa rendering</span>
                  </div>
                </button>
              </div>
              <p className="text-[9px] text-neutral-500 px-1 mt-1 leading-normal">
                You can change this home rendering style anytime in the dashboard settings.
              </p>
            </div>

            <Button
              onClick={handleSaveSetup}
              disabled={!setupName.trim()}
              className="w-full h-12 rounded-xl btn-glow text-sm font-semibold tracking-widest text-black transition-all duration-300 disabled:opacity-50"
            >
              GET STARTED
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 relative overflow-x-hidden flex flex-col justify-start transition-colors duration-300 ${
      isDarkMode ? "bg-[#090A0E] dashboard-bg text-white" : "light-dashboard-bg text-slate-800"
    }`}>
      {/* Top Header section (Matches Screenshot layout) */}
      <div className="max-w-md w-full mx-auto px-5 pt-8 pb-4 space-y-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Circular Profile Avatar */}
            <div className={`relative w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center shadow-lg transition-colors ${
              isDarkMode ? "border-white/10 bg-neutral-800" : "border-slate-200 bg-slate-100"
            }`}>
              <div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                {name.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-wide leading-tight transition-colors ${
                isDarkMode ? "text-white" : "text-slate-800"
              }`}>
                Hi, {name}
              </h1>
              <div className={`flex flex-col text-[10px] font-medium mt-0.5 leading-snug transition-colors ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                <span>West Jyoti Nagar</span>
                {currentTemp !== null && weatherDesc && (
                  <span className={`${isDarkMode ? "text-cyan-500" : "text-cyan-600"} font-semibold mt-0.5`}>
                    {currentTemp}°C • {weatherDesc}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto px-5 mt-2 space-y-5 flex-1">
        {/* Room Card - House Facade (Fitted to entire container, no crop) */}
        <div className="relative w-full aspect-[4/3] rounded-[2.2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)] border border-white/5 bg-black">
          {homeTheme === "realistic" ? (
            <>
              {/* Stacked House Images with transitions (Clear and visible full size) */}
              <img
                src={houseBothOff}
                alt="Smart Exterior Off"
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                  !lights.namePlate && !lights.wallLight ? "opacity-100" : "opacity-0"
                }`}
              />
              <img
                src={houseWallOn}
                alt="Smart Exterior Wall On"
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                  !lights.namePlate && lights.wallLight ? "opacity-100" : "opacity-0"
                }`}
              />
              <img
                src={houseNameOn}
                alt="Smart Exterior Name On"
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                  lights.namePlate && !lights.wallLight ? "opacity-100" : "opacity-0"
                }`}
              />
              <img
                src={houseBothOn}
                alt="Smart Exterior Both On"
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                  lights.namePlate && lights.wallLight ? "opacity-100" : "opacity-0"
                }`}
              />
            </>
          ) : (
            <img
              src={exteriorBg}
              alt="Vector Exterior Facade"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
            />
          )}
          
          {/* Subtle gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* Top-Right Info Arrow */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                triggerHaptic(10);
                toast.info("Viewing Facade details");
              }}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all"
              aria-label="View room details"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Bottom-Left Room Title & Online Status (Restored back inside the card) */}
          <div className="absolute bottom-5 left-6 text-white z-20">
            <h2 className="text-xl font-bold tracking-wide leading-tight">
              Exterior Facade
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hardwareOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" : "bg-neutral-500"}`} />
              <span className="text-[11px] text-neutral-300 font-semibold">{hardwareOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>

        {/* Control Sheet (Transparent container layout) */}
        <div className="control-sheet space-y-5">
          {/* Master Control Card */}
          <div className="master-card-premium p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#06B6D4]">
                <Bolt size={16} />
              </div>
              <div>
                <h3 className={`text-xs font-semibold tracking-wide transition-colors ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}>
                  Front Facade Lights
                </h3>
                <p className={`text-[9px] transition-colors ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  Control both Legacy & Wall lights
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleBatchToggle(true)}
                className="px-4 py-1.5 rounded-lg bg-[#06B6D4] hover:bg-cyan-600 text-white text-[10px] font-bold tracking-wider transition-all"
              >
                ON
              </button>
              <button
                onClick={() => handleBatchToggle(false)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                  isDarkMode
                    ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                    : "bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700"
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Device Cards 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Wall Light (Top-Left) */}
            <div className={`device-card-premium p-4 flex flex-col justify-between h-44 transition-all relative overflow-hidden ${lights.wallLight ? "device-card-premium-active" : ""}`}>
              <div className="flex flex-col z-10">
                <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  1 Device
                </span>
                <h4 className={`text-sm font-bold leading-tight mt-0.5 transition-colors ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}>
                  Wall Light
                </h4>
              </div>

              {/* Custom Device Image Frame */}
              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-24 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
                lights.wallLight 
                  ? "border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] bg-[#111216]" 
                  : isDarkMode
                    ? "border border-white/5 bg-[#0E1015]"
                    : "border border-slate-200 bg-slate-100"
              }`}>
                <img
                  src={deviceWallLight}
                  alt="Wall light"
                  loading="eager"
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    lights.wallLight ? "opacity-100 grayscale-0" : "opacity-35 grayscale brightness-75"
                  }`}
                />
              </div>

              <div className="z-10">
                <Switch
                  checked={lights.wallLight}
                  onCheckedChange={(checked) => handleToggle("wallLight", checked)}
                  className="switch-cyan scale-95 origin-left"
                />
              </div>
            </div>

            {/* Legacy Light - Name Plate (Top-Right) */}
            <div className={`device-card-premium p-4 flex flex-col justify-between h-44 transition-all relative overflow-hidden ${lights.namePlate ? "device-card-premium-active" : ""}`}>
              <div className="flex flex-col z-10">
                <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  1 Device
                </span>
                <h4 className={`text-sm font-bold leading-tight mt-0.5 transition-colors ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}>
                  Legacy Light
                </h4>
              </div>

              {/* Custom Device Image Frame */}
              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-24 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
                lights.namePlate 
                  ? "border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] bg-[#111216]" 
                  : isDarkMode
                    ? "border border-white/5 bg-[#0E1015]"
                    : "border border-slate-200 bg-slate-100"
              }`}>
                <img
                  src={deviceNameplate}
                  alt="Name plate"
                  loading="eager"
                  className={`w-full h-full object-contain p-1 transition-all duration-300 ${
                    lights.namePlate ? "opacity-100 grayscale-0" : "opacity-35 grayscale brightness-75"
                  }`}
                />
              </div>

              <div className="z-10">
                <Switch
                  checked={lights.namePlate}
                  onCheckedChange={(checked) => handleToggle("namePlate", checked)}
                  className="switch-cyan scale-95 origin-left"
                />
              </div>
            </div>

            {/* Parking Light (Bottom-Left) */}
            <div className={`device-card-premium p-4 flex flex-col justify-between h-44 transition-all relative overflow-hidden ${lights.parking1 ? "device-card-premium-active" : ""}`}>
              <div className="flex flex-col z-10">
                <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  1 Device
                </span>
                <h4 className={`text-sm font-bold leading-tight mt-0.5 transition-colors ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}>
                  Parking Light
                </h4>
              </div>

              {/* Custom Device Image Frame */}
              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-24 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
                lights.parking1 
                  ? "border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] bg-white" 
                  : isDarkMode
                    ? "border border-white/5 bg-[#0E1015]"
                    : "border border-slate-200 bg-slate-100"
              }`}>
                <img
                  src={deviceParking}
                  alt="Parking light"
                  loading="eager"
                  className={`w-full h-full object-contain p-1.5 transition-all duration-300 ${
                    lights.parking1 ? "opacity-100" : "opacity-30 grayscale brightness-75"
                  }`}
                />
              </div>

              <div className="z-10">
                <Switch
                  checked={lights.parking1}
                  onCheckedChange={(checked) => handleToggle("parking1", checked)}
                  className="switch-cyan scale-95 origin-left"
                />
              </div>
            </div>

            {/* Ambient Light (Bottom-Right) */}
            <div className={`device-card-premium p-4 flex flex-col justify-between h-44 transition-all relative overflow-hidden ${lights.parking2 ? "device-card-premium-active" : ""}`}>
              <div className="flex flex-col z-10">
                <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  1 Device
                </span>
                <h4 className={`text-sm font-bold leading-tight mt-0.5 transition-colors ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}>
                  Ambient Light
                </h4>
              </div>

              {/* Custom Device Image Frame */}
              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-24 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
                lights.parking2 
                  ? "border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] bg-[#111216]" 
                  : isDarkMode
                    ? "border border-white/5 bg-[#0E1015]"
                    : "border border-slate-200 bg-slate-100"
              }`}>
                <img
                  src={deviceAmbient}
                  alt="Ambient light"
                  loading="eager"
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    lights.parking2 ? "opacity-100 grayscale-0" : "opacity-35 grayscale brightness-75"
                  }`}
                />
              </div>

              <div className="z-10">
                <Switch
                  checked={lights.parking2}
                  onCheckedChange={(checked) => handleToggle("parking2", checked)}
                  className="switch-cyan scale-95 origin-left"
                />
              </div>
            </div>
          </div>

          {/* Timer Scheduling Card */}
          <div className="timer-card-premium p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#06B6D4]" />
                <div>
                  <h3 className={`text-xs font-semibold tracking-wide transition-colors ${
                    isDarkMode ? "text-white" : "text-slate-800"
                  }`}>
                    Lighting Schedule
                  </h3>
                  <p className={`text-[9px] transition-colors ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    Set automatic lighting window
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setShowInfoModal(true);
                }}
                className={`transition-colors p-1 ${
                  isDarkMode ? "text-neutral-400" : "text-slate-400 hover:text-slate-700"
                }`}
                aria-label="Show scheduling info"
              >
                <Info size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  Turn ON
                </label>
                <input
                  type="time"
                  value={onTime}
                  onChange={(e) => setOnTime(e.target.value)}
                  className={`w-full h-9 px-3 rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-[#06B6D4] text-xs ${
                    isDarkMode
                      ? "border-white/10 bg-white/5 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  Turn OFF
                </label>
                <input
                  type="time"
                  value={offTime}
                  onChange={(e) => setOffTime(e.target.value)}
                  className={`w-full h-9 px-3 rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-[#06B6D4] text-xs ${
                    isDarkMode
                      ? "border-white/10 bg-white/5 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveSchedule}
              disabled={isSavingSchedule}
              className={`w-full h-9 rounded-lg font-semibold text-xs tracking-wider transition-all disabled:opacity-50 ${
                isDarkMode
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {isSavingSchedule ? "SAVING..." : "SAVE SCHEDULE"}
            </Button>
          </div>

          {/* Siri & Alexa Compatibility Badges */}
          <div className={`flex items-center justify-between py-3 px-5 border rounded-2xl shadow-lg transition-colors ${
            isDarkMode
              ? "bg-white/5 border-white/5"
              : "bg-white/80 border-slate-200/50"
          }`}>
            <div className="flex items-center gap-2">
              <img src={siriLogo} alt="Siri Logo" className="w-5 h-5 object-contain" />
              <span className={`text-[8.5px] font-bold uppercase tracking-widest transition-colors ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Siri Compatible
              </span>
            </div>
            <div className={`w-px h-5 transition-colors ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
            <div className="flex items-center gap-2">
              <img src={alexaLogo} alt="Alexa Logo" className="w-5 h-5 object-contain" />
              <span className={`text-[8.5px] font-bold uppercase tracking-widest transition-colors ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Alexa Compatible
              </span>
            </div>
          </div>

          {/* Footer Signature */}
          <footer className="mt-8 flex flex-col items-center px-5 pb-6 text-center select-none">
            <div className="footer-divider mb-4 opacity-40" />
            <p className={`text-[8px] uppercase tracking-[0.25em] font-semibold mb-1 transition-colors ${
              isDarkMode ? "text-neutral-400" : "text-slate-500"
            }`}>
              Designed &amp; Developed by
            </p>
            <h2 className="font-heading text-3xl text-neutral-200 leading-none" style={{ fontFamily: "var(--font-signature)" }}>
              Vaibhav Kaushik
            </h2>
          </footer>
        </div>
      </div>

      {/* Floating Glassmorphic Bottom Navigation Bar */}
      <div className="floating-nav-bar">
        {/* Home Button (Active) */}
        <button
          onClick={() => triggerHaptic(8)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isDarkMode ? "bg-white text-black" : "bg-slate-900 text-white"
          }`}
          aria-label="Home page"
        >
          <Home size={18} />
        </button>

        {/* Theme Toggle Button (Light/Dark Mode) */}
        <button
          onClick={toggleTheme}
          className={`p-2 transition-colors duration-200 ${
            isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings/Gear Button (Opens modal) */}
        <button
          onClick={handleOpenSettings}
          className={`p-2 transition-colors duration-200 ${
            isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
          }`}
          aria-label="Open settings dashboard"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Settings Dialog (Dark premium style) */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={`sm:max-w-[400px] border rounded-2xl transition-colors duration-300 ${
          isDarkMode
            ? "bg-[#0E1015] border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-800"
        }`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-semibold text-gradient-gold">
              Dashboard Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                First Name
              </label>
              <input
                type="text"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className={`w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors ${
                  isDarkMode
                    ? "border-white/10 bg-white/5 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-800"
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Access Token
              </label>
              <input
                type="text"
                value={settingsToken}
                onChange={(e) => setSettingsToken(e.target.value)}
                placeholder="Using default token"
                className={`w-full h-11 px-4 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors ${
                  isDarkMode
                    ? "border-white/10 bg-white/5 text-white placeholder-white/30"
                    : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400"
                }`}
              />
              <p className={`text-[10px] transition-colors ${
                isDarkMode ? "text-neutral-500" : "text-slate-400"
              }`}>
                Provide a custom token if you want to bypass the default dashboard.
              </p>
            </div>
            <div className="space-y-2.5 text-left pt-1">
              <label className={`text-xs font-semibold uppercase tracking-widest block px-1 transition-colors ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Home Display Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setSettingsTheme("realistic");
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    settingsTheme === "realistic"
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md"
                      : isDarkMode
                        ? "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <img
                    src={houseBothOn}
                    alt="Realistic Facade"
                    className="w-full h-12 object-cover rounded-lg border border-white/10"
                  />
                  <div>
                    <span className={`block text-xs font-bold transition-colors ${isDarkMode ? "text-white" : "text-slate-800"}`}>Realistic</span>
                    <span className={`block text-[8px] mt-0.5 leading-tight transition-colors ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>Interactive real house facade</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setSettingsTheme("vector");
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    settingsTheme === "vector"
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md"
                      : isDarkMode
                        ? "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <img
                    src={exteriorBg}
                    alt="Vector Villa"
                    className="w-full h-12 object-cover rounded-lg border border-white/10"
                  />
                  <div>
                    <span className={`block text-xs font-bold transition-colors ${isDarkMode ? "text-white" : "text-slate-800"}`}>Vector / Villa</span>
                    <span className={`block text-[8px] mt-0.5 leading-tight transition-colors ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>General villa rendering</span>
                  </div>
                </button>
              </div>
              <p className={`text-[9.5px] px-1 leading-normal transition-colors ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>
                Realistic reacts dynamically to lighting toggles; Vector / Villa uses a premium static graphic.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                triggerHaptic(10);
                setShowSettings(false);
              }}
              className={`rounded-xl border transition-colors ${
                isDarkMode 
                  ? "border-white/10 bg-transparent text-white hover:bg-white/5" 
                  : "border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="btn-glow text-black rounded-xl font-semibold tracking-wider text-xs px-5"
            >
              SAVE CHANGES
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-Scheduling Information Modal (Dark premium style) */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className={`sm:max-w-[380px] border rounded-2xl transition-colors duration-300 ${
          isDarkMode
            ? "bg-[#0E1015] border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-800"
        }`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-semibold text-gradient-gold">
              Auto-Scheduling Info
            </DialogTitle>
          </DialogHeader>
          <div className={`space-y-4 py-3 text-sm leading-relaxed transition-colors ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
            <p>
              The lighting schedule operates on a shared automatic configuration.
            </p>
            <div className={`p-3 rounded-xl border space-y-2 transition-colors ${
              isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200/50"
            }`}>
              <p className="font-semibold text-cyan-400 text-[10px] uppercase tracking-wider">
                Shared Circuits
              </p>
              <ul className={`list-disc list-inside text-xs space-y-1 transition-colors ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                <li>Legacy Light (Name Plate)</li>
                <li>Wall Light</li>
              </ul>
            </div>
            <p className={`text-xs transition-colors ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
              When the scheduled ON time matches the hardware system clock, both light fixtures will illuminate simultaneously. They will automatically shut down at the designated OFF time.
            </p>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              onClick={() => {
                triggerHaptic(10);
                setShowInfoModal(false);
              }}
              className="btn-glow text-black rounded-xl px-5 font-semibold text-xs tracking-wider"
            >
              UNDERSTOOD
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
