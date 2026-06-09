import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLYNK_BASE = "https://blr1.blynk.cloud/external/api";
const BLYNK_TOKEN = "oGngIJ_ec4DW-AZiWw3LSh8zNnaMNy1-";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function setFrontLights(on: boolean) {
  const value = on ? 1 : 0;
  await Promise.all([
    fetch(`${BLYNK_BASE}/update?token=${BLYNK_TOKEN}&V1=${value}`),
    fetch(`${BLYNK_BASE}/update?token=${BLYNK_TOKEN}&V2=${value}`),
  ]);
}

function getCurrentIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  return ist.toTimeString().slice(0, 5);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "set") {
      const onTime = body.onTime || "18:30";
      const offTime = body.offTime || "06:00";
      const enabled = body.enabled !== false;

      // Save to database
      const { data: existing } = await supabase.from("timer_settings").select("id").limit(1).single();
      if (existing) {
        await supabase.from("timer_settings").update({ enabled, on_time: onTime, off_time: offTime, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("timer_settings").insert({ enabled, on_time: onTime, off_time: offTime });
      }

      const currentTime = getCurrentIST();
      let triggered = false;
      if (enabled && currentTime === onTime) { await setFrontLights(true); triggered = true; }
      if (enabled && currentTime === offTime) { await setFrontLights(false); triggered = true; }

      return new Response(
        JSON.stringify({ success: true, message: "Timer saved", currentTime, onTime, offTime, enabled, triggered }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check") {
      // Called by cron - read settings from DB
      const { data: settings } = await supabase.from("timer_settings").select("*").limit(1).single();
      if (!settings || !settings.enabled) {
        return new Response(
          JSON.stringify({ success: true, action: "disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentTime = getCurrentIST();
      if (currentTime === settings.on_time) {
        await setFrontLights(true);
        return new Response(
          JSON.stringify({ success: true, action: "turned_on", currentTime }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (currentTime === settings.off_time) {
        await setFrontLights(false);
        return new Response(
          JSON.stringify({ success: true, action: "turned_off", currentTime }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: "no_change", currentTime, on_time: settings.on_time, off_time: settings.off_time }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      const { data: existing } = await supabase.from("timer_settings").select("id").limit(1).single();
      if (existing) {
        await supabase.from("timer_settings").update({ enabled: false, updated_at: new Date().toISOString() }).eq("id", existing.id);
      }
      return new Response(
        JSON.stringify({ success: true, message: "Timer disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
