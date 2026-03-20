import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response("// Missing userId parameter", {
        headers: { ...corsHeaders, "Content-Type": "application/javascript" },
      });
    }

    // Fetch user profile to get widget config
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile } = await supabase
      .from("profiles")
      .select("widget_config, company_name, logo_url, hide_neo_branding")
      .eq("user_id", userId)
      .single();

    const config = (profile?.widget_config as any) || {
      position: "bottom-right",
      color: "#ea384c",
      buttonText: "Говори с NEO",
      autoGreet: true,
      buttonSize: "medium",
    };

    const companyName = profile?.company_name || "";
    const logoUrl = profile?.logo_url || "";
    const hideNeo = profile?.hide_neo_branding || false;

    // Determine the app URL for the widget iframe
    // Use the published URL or preview URL
    const appUrl = Deno.env.get("WIDGET_APP_URL") || `${supabaseUrl.replace('.supabase.co', '.lovable.app')}`;
    
    // Build widget page URL  
    const widgetPageUrl = `https://companion-insight-guide.lovable.app/widget?userId=${userId}&company=${encodeURIComponent(companyName)}`;

    const buttonSize = config.buttonSize === "small" ? 44 : config.buttonSize === "large" ? 64 : 54;
    const position = config.position === "bottom-left" ? "left: 20px;" : "right: 20px;";

    const script = `
(function() {
  if (window.__neo_widget_loaded) return;
  window.__neo_widget_loaded = true;

  var config = ${JSON.stringify(config)};
  var btnSize = ${buttonSize};
  var isOpen = false;

  // Create button
  var btn = document.createElement('div');
  btn.id = 'neo-widget-btn';
  btn.style.cssText = 'position:fixed;bottom:20px;${position}z-index:999999;width:' + btnSize + 'px;height:' + btnSize + 'px;border-radius:50%;background:${config.color};cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s ease;';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (btnSize * 0.4) + '" height="' + (btnSize * 0.4) + '" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
  btn.onmouseenter = function() { btn.style.transform = 'scale(1.1)'; };
  btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; };

  // Create tooltip
  var tooltip = document.createElement('div');
  tooltip.style.cssText = 'position:fixed;bottom:' + (btnSize + 28) + 'px;${position}z-index:999998;background:#fff;color:#333;padding:8px 14px;border-radius:8px;font-size:13px;font-family:sans-serif;box-shadow:0 2px 12px rgba(0,0,0,0.15);opacity:0;transition:opacity 0.3s;pointer-events:none;';
  tooltip.textContent = config.buttonText || 'Говори с NEO';

  ${config.autoGreet ? `
  setTimeout(function() {
    tooltip.style.opacity = '1';
    setTimeout(function() { tooltip.style.opacity = '0'; }, 4000);
  }, 2000);
  ` : ''}

  // Create iframe container
  var container = document.createElement('div');
  container.id = 'neo-widget-container';
  container.style.cssText = 'position:fixed;bottom:' + (btnSize + 30) + 'px;${position}z-index:999999;width:380px;height:600px;max-height:80vh;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.25);display:none;background:#000;';

  var iframe = document.createElement('iframe');
  iframe.src = '${widgetPageUrl}';
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.setAttribute('allow', 'microphone; autoplay; clipboard-write');
  container.appendChild(iframe);

  // Close button on container
  var closeBtn = document.createElement('div');
  closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;';
  closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    container.style.display = 'none';
    btn.style.display = 'flex';
    isOpen = false;
  };
  container.appendChild(closeBtn);

  btn.onclick = function() {
    if (isOpen) {
      container.style.display = 'none';
      btn.style.display = 'flex';
      isOpen = false;
    } else {
      container.style.display = 'block';
      btn.style.display = 'none';
      tooltip.style.opacity = '0';
      isOpen = true;
    }
  };

  document.body.appendChild(btn);
  document.body.appendChild(tooltip);
  document.body.appendChild(container);
})();
`;

    return new Response(script, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Widget script error:", err);
    return new Response(`// Error: ${err.message}`, {
      headers: { ...corsHeaders, "Content-Type": "application/javascript" },
    });
  }
});
