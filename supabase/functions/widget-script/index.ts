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
    @keyframes neo-pulse-ring {
      0% { transform: scale(1); opacity: 0.5; }
      70% { transform: scale(1.7); opacity: 0; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    @keyframes neo-pulse-ring2 {
      0% { transform: scale(1); opacity: 0.35; }
      70% { transform: scale(2); opacity: 0; }
      100% { transform: scale(2); opacity: 0; }
    }
    @keyframes neo-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @keyframes neo-tooltip-in {
      0% { opacity: 0; transform: translateY(8px) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes neo-icon-breathe {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(4deg); }
    }
    #neo-widget-btn:hover .neo-phone-icon {
      animation: neo-icon-breathe 0.5s ease-in-out;
    }
  \`;
  document.head.appendChild(styleEl);

  // Wrapper for button + pulse rings
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;bottom:20px;${position}z-index:999999;width:' + (btnSize + 28) + 'px;height:' + (btnSize + 28) + 'px;display:flex;align-items:center;justify-content:center;';

  // Pulse rings
  var ring1 = document.createElement('div');
  ring1.style.cssText = 'position:absolute;width:' + btnSize + 'px;height:' + btnSize + 'px;border-radius:50%;background:' + color + ';animation:neo-pulse-ring 2.5s cubic-bezier(0.4,0,0.6,1) infinite;pointer-events:none;';
  wrapper.appendChild(ring1);
  var ring2 = document.createElement('div');
  ring2.style.cssText = 'position:absolute;width:' + btnSize + 'px;height:' + btnSize + 'px;border-radius:50%;background:' + color + ';animation:neo-pulse-ring2 2.5s cubic-bezier(0.4,0,0.6,1) infinite 0.6s;pointer-events:none;';
  wrapper.appendChild(ring2);

  // Button
  var btn = document.createElement('div');
  btn.id = 'neo-widget-btn';
  btn.style.cssText = 'position:relative;width:' + btnSize + 'px;height:' + btnSize + 'px;border-radius:50%;background:linear-gradient(135deg,' + color + ',' + color + 'cc);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 28px ' + color + '55,0 2px 8px rgba(0,0,0,0.2),inset 0 1px 1px rgba(255,255,255,0.2);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s ease;animation:neo-float 3s ease-in-out infinite;';
  btn.innerHTML = '<svg class="neo-phone-icon" xmlns="http://www.w3.org/2000/svg" width="' + (btnSize * 0.38) + '" height="' + (btnSize * 0.38) + '" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.25))"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
  btn.onmouseenter = function() { btn.style.transform = 'scale(1.12)'; btn.style.boxShadow = '0 8px 36px ' + color + '70,0 4px 12px rgba(0,0,0,0.25),inset 0 1px 1px rgba(255,255,255,0.3)'; };
  btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 6px 28px ' + color + '55,0 2px 8px rgba(0,0,0,0.2),inset 0 1px 1px rgba(255,255,255,0.2)'; };
  wrapper.appendChild(btn);

  // Tooltip - premium dark
  var tooltip = document.createElement('div');
  tooltip.style.cssText = 'position:fixed;bottom:' + (btnSize + 38) + 'px;${position}z-index:999998;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.06);opacity:0;pointer-events:none;letter-spacing:0.01em;';

  var arrow = document.createElement('div');
  arrow.style.cssText = 'position:absolute;bottom:-5px;${config.position === 'bottom-left' ? 'left:20px;' : 'right:20px;'}width:10px;height:10px;background:#16213e;transform:rotate(45deg);border-radius:2px;';
  tooltip.appendChild(arrow);
  var tooltipText = document.createElement('span');
  tooltipText.textContent = config.buttonText || 'Говори с NEO';
  tooltip.insertBefore(tooltipText, arrow);

  ${config.autoGreet ? `
  setTimeout(function() {
    tooltip.style.animation = 'neo-tooltip-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards';
    setTimeout(function() { tooltip.style.opacity = '0'; tooltip.style.animation = 'none'; }, 5000);
  }, 1500);
  ` : ''}

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

  btn.onclick = function() {
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
      tooltip.style.opacity = '0';
      tooltip.style.animation = 'none';
      isOpen = true;
    }
  };

  document.body.appendChild(wrapper);
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
