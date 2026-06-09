const BLYNK_BASE = "https://blr1.blynk.cloud/external/api";
const BLYNK_TOKEN = "oGngIJ_ec4DW-AZiWw3LSh8zNnaMNy1-";

export const PIN_MAP = {
  namePlate: "V1",
  wallLight: "V2",
  parking1: "V3",
  parking2: "V4",
} as const;

export type LightKey = keyof typeof PIN_MAP;

export async function setLight(key: LightKey, on: boolean): Promise<void> {
  const pin = PIN_MAP[key];
  const value = on ? 1 : 0;
  const url = `${BLYNK_BASE}/update?token=${BLYNK_TOKEN}&${pin}=${value}`;
  try {
    await fetch(url, { mode: "no-cors" });
  } catch (err) {
    console.error(`Blynk API error for ${key}:`, err);
  }
}

export async function setMultipleLights(keys: LightKey[], on: boolean): Promise<void> {
  await Promise.all(keys.map((k) => setLight(k, on)));
}
