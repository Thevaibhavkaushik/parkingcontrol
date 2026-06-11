const BLYNK_BASE = "https://blynk.cloud/external/api";
const DEFAULT_TOKEN = "IjtBbFOk20OTeFxwQ-C9ROUjYIjVIlrM";

export const getBlynkToken = (): string => {
  return localStorage.getItem("blynk_token") || DEFAULT_TOKEN;
};

export const saveBlynkToken = (token: string): void => {
  if (token.trim()) {
    localStorage.setItem("blynk_token", token.trim());
  } else {
    localStorage.removeItem("blynk_token");
  }
};

export const PIN_MAP = {
  namePlate: "V0",
  wallLight: "V1",
  parking1: "V2",
  parking2: "V3",
} as const;

export type LightKey = keyof typeof PIN_MAP;

export async function setLight(key: LightKey, on: boolean): Promise<void> {
  const token = getBlynkToken();
  const pin = PIN_MAP[key];
  const value = on ? 1 : 0;
  const url = `${BLYNK_BASE}/update?token=${token}&${pin}=${value}`;
  try {
    await fetch(url, { mode: "no-cors" });
  } catch (err) {
    console.error(`Blynk API error for ${key}:`, err);
  }
}

export async function setMultipleLightsBatch(on: boolean): Promise<void> {
  const token = getBlynkToken();
  const val = on ? 1 : 0;
  // Batch update only Legacy Light (V0) and Wall Light (V1)
  const url = `${BLYNK_BASE}/batch/update?token=${token}&V0=${val}&V1=${val}`;
  try {
    await fetch(url, { mode: "no-cors" });
  } catch (err) {
    console.error("Error setting multiple lights batch in Blynk:", err);
  }
}

export async function getLightStates(): Promise<{
  namePlate: boolean;
  wallLight: boolean;
  parking1: boolean;
  parking2: boolean;
  schedule: string;
}> {
  const token = getBlynkToken();
  const url = `${BLYNK_BASE}/get?token=${token}&V0&V1&V2&V3&V10`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    return {
      namePlate: data.V0 === "1" || data.V0 === 1,
      wallLight: data.V1 === "1" || data.V1 === 1,
      parking1: data.V2 === "1" || data.V2 === 1,
      parking2: data.V3 === "1" || data.V3 === 1,
      schedule: data.V10 || "18:30,06:00",
    };
  } catch (err) {
    console.error("Error fetching light states from Blynk:", err);
    return {
      namePlate: false,
      wallLight: false,
      parking1: false,
      parking2: false,
      schedule: "18:30,06:00",
    };
  }
}

export async function checkHardwareStatus(): Promise<boolean> {
  const token = getBlynkToken();
  const url = `${BLYNK_BASE}/isHardwareConnected?token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const text = await res.text();
    return text.trim() === "true";
  } catch (err) {
    console.error("Error checking hardware status:", err);
    return false;
  }
}

export async function updateSchedule(onTime: string, offTime: string): Promise<void> {
  const token = getBlynkToken();
  const value = `${onTime},${offTime}`;
  const url = `${BLYNK_BASE}/update?token=${token}&V10=${value}`;
  try {
    await fetch(url, { mode: "no-cors" });
  } catch (err) {
    console.error("Error updating schedule in Blynk:", err);
  }
}
