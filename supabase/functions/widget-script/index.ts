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
  var mustOpenStandalone = !window.isSecureContext;
  var color = '${config.color}';

  // Inject keyframes
  var styleEl = document.createElement('style');
  styleEl.textContent = \`
    @keyframes neo-glow {
      0%, 100% { box-shadow: 0 0 20px \${color}33, 0 4px 16px rgba(0,0,0,0.15); }
      50% { box-shadow: 0 0 32px \${color}55, 0 4px 20px rgba(0,0,0,0.2); }
    }
    @keyframes neo-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    #neo-widget-btn {
      animation: neo-float 4s ease-in-out infinite, neo-glow 3s ease-in-out infinite;
    }
    #neo-widget-btn:hover .neo-phone-icon {
      transition: transform 0.3s ease;
      transform: scale(1.08);
    }
    @media (max-width: 640px) {
      .neo-widget-wrapper {
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
      }
      #neo-widget-container {
        left: 8px !important;
        right: 8px !important;
        width: auto !important;
        bottom: 80px !important;
      }
    }
  \`;
  document.head.appendChild(styleEl);

  // Wrapper for button + pulse rings
  var wrapper = document.createElement('div');
  wrapper.className = 'neo-widget-wrapper';
  wrapper.style.cssText = 'position:fixed;bottom:20px;${position}z-index:999999;display:flex;align-items:center;gap:0;cursor:pointer;';

  // Pill button: icon circle + text label
  var pill = document.createElement('div');
  pill.id = 'neo-widget-btn';
  pill.style.cssText = 'display:flex;align-items:center;gap:10px;padding:6px 20px 6px 6px;border-radius:999px;background:linear-gradient(135deg,' + color + ',' + color + 'dd);box-shadow:0 4px 20px ' + color + '40,0 2px 8px rgba(0,0,0,0.15);transition:transform 0.35s ease,box-shadow 0.35s ease;cursor:pointer;';
  pill.onmouseenter = function() { pill.style.transform = 'scale(1.04)'; pill.style.boxShadow = '0 6px 28px ' + color + '55,0 4px 12px rgba(0,0,0,0.2)'; };
  pill.onmouseleave = function() { pill.style.transform = 'scale(1)'; pill.style.boxShadow = '0 4px 20px ' + color + '40,0 2px 8px rgba(0,0,0,0.15)'; };

  // Icon circle with NEO logo
  var iconCircle = document.createElement('div');
  iconCircle.style.cssText = 'width:' + (btnSize - 12) + 'px;height:' + (btnSize - 12) + 'px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  iconCircle.innerHTML = '<svg class="neo-phone-icon" xmlns="http://www.w3.org/2000/svg" width="' + (btnSize * 0.32) + '" height="' + (btnSize * 0.32) + '" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="m2 14 2-2-2-2"/><path d="m22 14-2-2 2-2"/><path d="M9 15h2"/><path d="M13 15h2"/></svg>';
  pill.appendChild(iconCircle);

  // Text label
  var label = document.createElement('span');
  label.textContent = config.buttonText || 'Говори с NEO';
  label.style.cssText = 'color:#fff;font-size:13px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;white-space:nowrap;letter-spacing:0.02em;';
  pill.appendChild(label);

  wrapper.appendChild(pill);
  // Iframe container - premium glass
  var container = document.createElement('div');
  container.id = 'neo-widget-container';
  container.style.cssText = 'position:fixed;bottom:' + (btnSize + 40) + 'px;${position}z-index:999999;width:380px;height:600px;max-height:80vh;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.06);display:none;background:#0a0a0f;transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.25s ease;transform:scale(0.95) translateY(10px);opacity:0;';

  var iframe = document.createElement('iframe');
  iframe.src = '${widgetPageUrl}';
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.setAttribute('allow', 'microphone *; autoplay *; clipboard-write *');
  iframe.setAttribute('allowusermedia', 'true');
  container.appendChild(iframe);

  // Close button - glass
  var closeBtn = document.createElement('div');
  closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;transition:background 0.2s,transform 0.2s;border:1px solid rgba(255,255,255,0.06);';
  closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.onmouseenter = function() { closeBtn.style.background = 'rgba(255,255,255,0.2)'; closeBtn.style.transform = 'scale(1.1)'; };
  closeBtn.onmouseleave = function() { closeBtn.style.background = 'rgba(255,255,255,0.1)'; closeBtn.style.transform = 'scale(1)'; };
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    container.style.transform = 'scale(0.95) translateY(10px)';
    container.style.opacity = '0';
    setTimeout(function() { container.style.display = 'none'; }, 250);
    wrapper.style.display = 'flex';
    isOpen = false;
  };
  container.appendChild(closeBtn);

  pill.onclick = function() {
    if (mustOpenStandalone) {
      window.open('${widgetPageUrl}', '_blank', 'noopener,noreferrer');
      return;
    }
    if (isOpen) {
      container.style.transform = 'scale(0.95) translateY(10px)';
      container.style.opacity = '0';
      setTimeout(function() { container.style.display = 'none'; }, 250);
      wrapper.style.display = 'flex';
      isOpen = false;
    } else {
      container.style.display = 'block';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          container.style.transform = 'scale(1) translateY(0)';
          container.style.opacity = '1';
        });
      });
      wrapper.style.display = 'none';
      isOpen = true;
    }
  };

  document.body.appendChild(wrapper);
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
