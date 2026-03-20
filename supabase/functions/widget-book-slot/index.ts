import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, userId, date, time, attendeeName, attendeeEmail, conversationId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load calendar settings
    const { data: settings } = await supabase
      .from("calendar_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings || !settings.calendar_enabled) {
      return new Response(JSON.stringify({ error: "Calendar not enabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bookingType = settings.booking_type || "consultation";
    const bookingLabel = bookingType === "reservation" ? "Резервация" : bookingType === "meeting" ? "Среща" : "Консултация";
    const duration = settings.default_meeting_duration || 30;
    const buffer = settings.booking_buffer_minutes || 15;
    const workStart = settings.working_hours_start || "09:00";
    const workEnd = settings.working_hours_end || "18:00";
    const workDays = settings.working_days || [1, 2, 3, 4, 5];

    // ── GET AVAILABLE SLOTS ──
    if (action === "get_slots") {
      const targetDate = date || getNextWorkDay(workDays);

      const dayOfWeek = new Date(targetDate).getDay();
      if (!workDays.includes(dayOfWeek)) {
        // Find next available day
        const nextDay = getNextWorkDayFrom(targetDate, workDays);
        return new Response(JSON.stringify({
          available: false,
          message: `Този ден не е работен. Следващият свободен ден е ${formatBgDate(nextDay)}.`,
          nextAvailableDate: nextDay,
          bookingLabel,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get existing bookings for the date
      const dayStart = `${targetDate}T00:00:00`;
      const dayEnd = `${targetDate}T23:59:59`;

      const { data: existingBookings } = await supabase
        .from("calendar_bookings")
        .select("event_start, event_end")
        .eq("user_id", userId)
        .gte("event_start", dayStart)
        .lte("event_start", dayEnd)
        .neq("status", "cancelled");

      // Generate slots
      const slots = generateSlots(workStart, workEnd, duration, buffer, targetDate, existingBookings || []);

      return new Response(JSON.stringify({
        available: slots.length > 0,
        slots,
        date: targetDate,
        bookingLabel,
        message: slots.length > 0
          ? `Свободни часове за ${formatBgDate(targetDate)}: ${slots.map(s => s.display).join(", ")}`
          : `Няма свободни часове за ${formatBgDate(targetDate)}. Опитайте друг ден.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── BOOK SLOT ──
    if (action === "book") {
      if (!date || !time) {
        return new Response(JSON.stringify({ error: "Missing date or time" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify slot is still available
      const slotStart = `${date}T${time}:00`;
      const slotEndTime = addMinutes(time, duration);
      const slotEnd = `${date}T${slotEndTime}:00`;

      const { data: conflicts } = await supabase
        .from("calendar_bookings")
        .select("id")
        .eq("user_id", userId)
        .lt("event_start", slotEnd)
        .gt("event_end", slotStart)
        .neq("status", "cancelled");

      if (conflicts && conflicts.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          message: `Този час (${time}) вече е зает. Моля, изберете друг.`,
          bookingLabel,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load profile for company name
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", userId)
        .maybeSingle();

      const title = (settings.meeting_title_template || `${bookingLabel} - {{lead_name}}`)
        .replace("{{lead_name}}", attendeeName || "Клиент")
        .replace("{{company_name}}", profile?.company_name || "");

      const { data: booking, error: bookError } = await supabase
        .from("calendar_bookings")
        .insert({
          user_id: userId,
          event_title: title,
          event_start: slotStart,
          event_end: slotEnd,
          attendee_name: attendeeName || null,
          attendee_email: attendeeEmail || null,
          conversation_id: conversationId || null,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (bookError) {
        console.error("Booking error:", bookError);
        return new Response(JSON.stringify({ error: bookError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        bookingId: booking.id,
        bookingLabel,
        message: `${bookingLabel}та е записана за ${formatBgDate(date)} в ${time} ч.${attendeeName ? ` за ${attendeeName}` : ""}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("widget-book-slot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helpers ──

function generateSlots(
  workStart: string,
  workEnd: string,
  duration: number,
  buffer: number,
  date: string,
  existingBookings: { event_start: string; event_end: string }[]
) {
  const slots: { time: string; display: string }[] = [];
  const [startH, startM] = workStart.split(":").map(Number);
  const [endH, endM] = workEnd.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const currentMin = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0; // 30 min from now minimum

  for (let min = startMin; min + duration <= endMin; min += duration + buffer) {
    if (min < currentMin) continue;

    const h = String(Math.floor(min / 60)).padStart(2, "0");
    const m = String(min % 60).padStart(2, "0");
    const slotTime = `${h}:${m}`;
    const slotStart = `${date}T${slotTime}:00`;
    const slotEndMin = min + duration;
    const slotEndH = String(Math.floor(slotEndMin / 60)).padStart(2, "0");
    const slotEndM = String(slotEndMin % 60).padStart(2, "0");
    const slotEnd = `${date}T${slotEndH}:${slotEndM}:00`;

    // Check conflicts
    const hasConflict = existingBookings.some(b => {
      return b.event_start < slotEnd && b.event_end > slotStart;
    });

    if (!hasConflict) {
      slots.push({ time: slotTime, display: `${slotTime}` });
    }
  }

  return slots;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function getNextWorkDay(workDays: number[]): string {
  const d = new Date();
  for (let i = 0; i < 14; i++) {
    d.setDate(d.getDate() + (i === 0 ? 0 : 1));
    if (workDays.includes(d.getDay())) {
      return d.toISOString().split("T")[0];
    }
  }
  return new Date().toISOString().split("T")[0];
}

function getNextWorkDayFrom(dateStr: string, workDays: number[]): string {
  const d = new Date(dateStr);
  for (let i = 1; i < 14; i++) {
    d.setDate(d.getDate() + 1);
    if (workDays.includes(d.getDay())) {
      return d.toISOString().split("T")[0];
    }
  }
  return dateStr;
}

function formatBgDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
