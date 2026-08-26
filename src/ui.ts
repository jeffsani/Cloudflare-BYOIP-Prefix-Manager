function infoTip(text: string): string {
  return `<span class="info-tip" tabindex="0" role="button" aria-label="More info"><span class="info-ico">i</span><span class="info-bubble">${text}</span></span>`;
}

export function renderDashboard(userEmail: string): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prefix Manager — BYOIP Manager</title>
  <link rel="icon" href="https://www.cloudflare.com/favicon.ico" type="image/x-icon">
  <script>
    var _origWarn = console.warn;
    console.warn = function() {
      if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].indexOf('cdn.tailwindcss.com') >= 0) return;
      return _origWarn.apply(console, arguments);
    };
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@dagrejs/dagre@1.1.4/dist/dagre.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
          colors: {
            cf: { orange: '#F6821F', dark: '#0D1117', navy: '#1B2432', gray: '#8B949E', surface: '#161B22', border: '#30363D' },
          }
        }
      }
    }
  </script>
  <style>
    :root, [data-theme="dark"] {
      --page-bg: #0D1117; --surface: #161B22; --border: #30363D; --muted: #8B949E;
      --text-primary: #E5E7EB; --text-strong: #FFFFFF; --input-bg: #0D1117;
      --header-bg: rgba(22,27,34,0.85); --scrollbar: #30363D; --accent: #F6821F;
    }
    [data-theme="light"] {
      --page-bg: #F9FAFB; --surface: #FFFFFF; --border: #E5E7EB; --muted: #6B7280;
      --text-primary: #374151; --text-strong: #111827; --input-bg: #F3F4F6;
      --header-bg: rgba(255,255,255,0.85); --scrollbar: #D1D5DB; --accent: #F6821F;
    }
    html { font-size: 17px; }
    body { background: var(--page-bg); color: var(--text-primary); transition: background 0.2s, color 0.2s; }
    * { scrollbar-width: thin; scrollbar-color: var(--scrollbar) transparent; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 3px; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .spinner { border: 2px solid var(--border); border-top-color: #F6821F; border-radius: 50%; width: 18px; height: 18px; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    [data-theme="light"] .text-white:not(.btn-force-white) { color: var(--text-strong) !important; }
    [data-theme="light"] .bg-cf-orange.text-white { color: #fff !important; }
    [data-theme="light"] .bg-red-600.text-white { color: #fff !important; }
    [data-theme="light"] .bg-cf-dark { background-color: var(--input-bg) !important; }
    [data-theme="light"] .bg-cf-surface { background-color: var(--surface) !important; }
    [data-theme="light"] .border-cf-border { border-color: var(--border) !important; }
    [data-theme="light"] .text-cf-gray { color: var(--muted) !important; }
    [data-theme="light"] select, [data-theme="light"] input { background-color: var(--input-bg); color: var(--text-primary); border-color: var(--border); }
    [data-theme="light"] header { background: var(--header-bg) !important; }
    .theme-toggle { display: flex; align-items: center; padding: 2px; border-radius: 999px; background: var(--input-bg); border: 1px solid var(--border); cursor: pointer; }
    .theme-toggle-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s; }
    .theme-toggle-icon.active { background: #F6821F; color: #FFF; }
    .theme-toggle-icon:not(.active) { color: var(--muted); }
    .badge-advertised { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
    .badge-withdrawn { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
    .badge-partial { background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
    .badge-pending { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
    .badge-valid { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-invalid { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-unknown { background: rgba(107,114,128,0.15); color: #6b7280; border: 1px solid rgba(107,114,128,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-active { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-service { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-delegation { background: rgba(20,184,166,0.15); color: #14b8a6; border: 1px solid rgba(20,184,166,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-tag { background: rgba(99,102,241,0.15); color: #6366f1; border: 1px solid rgba(99,102,241,0.3); padding: 2px 6px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; cursor: pointer; }
    .badge-tag:hover { background: rgba(99,102,241,0.25); }
    .inline-msg { display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 500; line-height: 1.3; }
    .inline-msg-success { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .inline-msg-error { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .inline-msg-close { cursor: pointer; font-weight: 700; opacity: 0.7; margin-left: 2px; }
    .inline-msg-close:hover { opacity: 1; }
    .info-tip { position: relative; display: inline-flex; vertical-align: middle; margin-left: 4px; outline: none; }
    .info-ico { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); color: var(--muted); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; font-style: normal; line-height: 1; cursor: help; transition: all 0.15s; }
    .info-tip:hover .info-ico, .info-tip:focus .info-ico { color: #F6821F; border-color: #F6821F; }
    .info-bubble { display: none; position: fixed; z-index: 9999; width: 240px; padding: 8px 10px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-size: 11px; font-weight: 400; line-height: 1.45; color: var(--text-primary); text-transform: none; letter-spacing: normal; white-space: normal; }
    .info-tip:hover .info-bubble, .info-tip:focus .info-bubble, .info-tip:focus-within .info-bubble { display: block; }
    .cidr-hover { position: relative; cursor: help; }
    .rdap-tip { display: none; position: fixed; z-index: 9999; min-width: 260px; padding: 10px 12px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.4); font-size: 11px; font-weight: 400; line-height: 1.5; color: var(--text-primary); white-space: nowrap; pointer-events: none; }
    .cidr-hover:hover .rdap-tip { display: block; }
    .validation-hover { position: relative; display: inline-block; cursor: help; }
    .validation-tip { display: none; position: fixed; z-index: 9999; min-width: 240px; max-width: 300px; padding: 8px 10px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-size: 11px; font-weight: 400; line-height: 1.45; color: var(--text-primary); white-space: normal; pointer-events: auto; }
    .validation-tip::before { content: ''; position: absolute; bottom: 100%; left: 0; right: 0; height: 6px; }
    .validation-hover:hover .validation-tip { display: block; }
    .rdap-row { display: flex; gap: 6px; }
    .rdap-label { color: var(--muted); min-width: 70px; }
    .rdap-val { color: var(--text-strong); font-weight: 500; }
    .prefix-row { cursor: pointer; transition: background 0.15s; }
    .prefix-row:hover { background: rgba(246,130,31,0.05); }
    .child-row { background: rgba(246,130,31,0.02); }
    .child-row td { padding-top: 6px; padding-bottom: 6px; }
    .chevron { transition: transform 0.2s; display: inline-block; }
    .chevron.open { transform: rotate(90deg); }
    .toggle-btn { position: relative; width: 36px; height: 20px; border-radius: 10px; border: 1px solid var(--border); background: var(--input-bg); cursor: pointer; transition: all 0.2s; }
    .toggle-btn.active { background: rgba(34,197,94,0.3); border-color: #22c55e; }
    .toggle-btn .toggle-knob { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--muted); transition: all 0.2s; }
    .toggle-btn.active .toggle-knob { left: 18px; background: #22c55e; }
    .toggle-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; width: 95vw; max-width: 1200px; max-height: 90vh; overflow: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .lg-node { cursor: pointer; }
    .lg-node rect { rx: 6; ry: 6; }
    .lg-node:hover rect { stroke: #F6821F !important; stroke-width: 2.5 !important; }
    .lg-edge { fill: none; stroke-width: 2; stroke-dasharray: 6 4; }
    .lg-graph-wrap { position: relative; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--surface); }
    .lg-graph-svg { display: block; width: 100%; cursor: grab; }
    .lg-graph-svg.panning { cursor: grabbing; }
    .lg-zoom-controls { position: absolute; bottom: 12px; left: 12px; display: flex; flex-direction: column; gap: 4px; z-index: 10; }
    .lg-zoom-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
    .lg-zoom-btn:hover { border-color: #F6821F; color: #F6821F; }
    .lg-filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 8px 0; }
    .lg-filter-bar select, .lg-filter-bar input[type="text"] { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-primary); font-size: 12px; outline: none; }
    .lg-filter-bar select:focus, .lg-filter-bar input[type="text"]:focus { border-color: #F6821F; }
    .lg-filter-bar label { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-primary); cursor: pointer; user-select: none; }
    .lg-filter-bar input[type="checkbox"] { accent-color: #3b82f6; cursor: pointer; }
    .lg-path-toggle { display: inline-flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); }
    .lg-path-toggle button { padding: 4px 12px; font-size: 12px; font-weight: 500; border: none; cursor: pointer; background: var(--input-bg); color: var(--text-primary); transition: all 0.15s; }
    .lg-path-toggle button.active { background: #F6821F; color: #fff; }
    .lg-path-toggle button:disabled { opacity: 0.4; cursor: not-allowed; }
    .lg-info-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--border); font-size: 10px; color: var(--muted); cursor: help; position: relative; }
    .lg-info-icon:hover { color: #F6821F; border-color: #F6821F; }
    .lg-info-icon .lg-info-tip { display: none; position: fixed; z-index: 9999; width: 300px; padding: 8px 10px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 10px; color: var(--text-primary); white-space: normal; font-weight: 400; pointer-events: none; }
    .lg-info-icon:hover .lg-info-tip { display: block; }
    .lg-vis-section { border-top: 1px solid var(--border); padding-top: 12px; margin-top: 12px; }
    .lg-vis-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .lg-vis-badge { display: inline-flex; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .lg-vis-badge-green { background: rgba(34,197,94,0.2); color: #22c55e; }
    .lg-vis-badge-yellow { background: rgba(234,179,8,0.2); color: #eab308; }
    .lg-vis-badge-red { background: rgba(239,68,68,0.2); color: #ef4444; }
    .lg-vis-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
    .lg-vis-row.lg-vis-partial { background: rgba(234,179,8,0.05); border: 1px solid rgba(234,179,8,0.3); border-radius: 6px; padding: 6px 8px; margin-bottom: 4px; }
    .lg-vis-name { min-width: 140px; color: var(--text-primary); font-weight: 500; }
    .lg-vis-bar-wrap { flex: 1; max-width: 300px; height: 10px; background: var(--input-bg); border-radius: 5px; overflow: hidden; }
    .lg-vis-bar { height: 100%; border-radius: 5px; transition: width 0.3s; }
    .lg-vis-bar-green { background: #22c55e; }
    .lg-vis-bar-yellow { background: #eab308; }
    .lg-vis-bar-gray { background: var(--muted); }
    .lg-vis-pct { min-width: 40px; text-align: right; color: var(--text-primary); }
    .lg-vis-peers { min-width: 80px; text-align: right; color: var(--muted); }
    .lg-vis-row { cursor: pointer; }
    .lg-vis-row:hover { background: rgba(99,102,241,0.04); }
    .lg-vis-chevron { display: inline-flex; transition: transform 0.2s; font-size: 10px; color: var(--muted); margin-right: 4px; }
    .lg-vis-chevron.open { transform: rotate(90deg); }
    .lg-vis-detail { padding: 8px 0 8px 24px; border-bottom: 1px solid var(--border); }
    .lg-vis-detail-label { font-size: 11px; font-weight: 500; color: var(--muted); margin-bottom: 6px; }
    .lg-vis-peer-grid { display: flex; flex-wrap: wrap; gap: 4px; }
    .lg-refresh-bar { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted); }
    .lg-refresh-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
    .lg-refresh-dot.active { animation: lgPulse 1s infinite; }
    @keyframes lgPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .lg-asn-chip { display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: 'Inter', monospace; background: var(--input-bg); border: 1px solid var(--border); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .lg-asn-chip:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); }
    .lg-asn-chip-invalid { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
    .lg-asn-chip-filtered { box-shadow: 0 0 0 2px #6366f1; border-color: #6366f1; }
    .lg-community-tag { display: inline-flex; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-family: monospace; background: var(--input-bg); border: 1px solid var(--border); margin: 1px; white-space: nowrap; color: var(--text-primary); }
    .lg-filter-banner { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-top: 8px; }
    [data-theme="dark"] .lg-filter-banner { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); color: #fbbf24; }
    [data-theme="light"] .lg-filter-banner { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    .lg-json-modal-content { max-width: 640px; }
    .lg-table-row-invalid { background: rgba(239,68,68,0.05); }
    .lg-table-row-invalid:hover { background: rgba(239,68,68,0.1) !important; }
    .lg-chip-tip { position: relative; }
    .lg-chip-tip .lg-chip-tiptext { display: none; position: absolute; z-index: 60; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); padding: 4px 8px; border-radius: 4px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 10px; white-space: nowrap; color: var(--text-primary); pointer-events: none; }
    .lg-chip-tip:hover .lg-chip-tiptext { display: block; }
    .al-badge { display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; white-space: nowrap; }
    .al-badge-green { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .al-badge-red { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .al-badge-blue { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    .al-badge-yellow { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); }
    .al-badge-gray { background: rgba(107,114,128,0.15); color: #6b7280; border: 1px solid rgba(107,114,128,0.3); }
    .al-row { border-bottom: 1px solid var(--border); }
    .al-row:last-child { border-bottom: none; }
    /* ── Architecture + prefix-creation flow diagrams (About panel) ── */
    .arch-diagram { display: flex; flex-direction: column; gap: 6px; overflow-x: auto; padding: 4px 0; }
    .arch-layer { display: flex; flex-wrap: wrap; align-items: stretch; justify-content: center; gap: 8px; }
    .arch-box { border: 1px solid var(--border); border-radius: 8px; background: var(--input-bg); padding: 6px 10px; color: var(--text-primary); text-align: center; min-width: 90px; }
    .arch-box-title { font-weight: 600; color: var(--text-strong); font-size: 11px; }
    .arch-box-sub { font-size: 9px; color: var(--muted); margin-top: 2px; line-height: 1.35; }
    .arch-box-worker { border-color: rgba(246,130,31,0.5); background: rgba(246,130,31,0.06); flex: 1; min-width: 260px; }
    .arch-box-store { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.06); }
    .arch-box-queue { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.06); }
    .arch-chip { display: inline-block; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); padding: 1px 6px; font-size: 9px; color: var(--text-primary); margin: 2px; white-space: nowrap; }
    .arch-conn { text-align: center; color: var(--muted); font-size: 12px; line-height: 1; }
    .arch-caption { font-size: 10px; color: var(--muted); margin-top: 6px; line-height: 1.4; }
    .arch-group-label { font-size: 9px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; width: 100%; text-align: left; }
    .arch-lanes { display: grid; grid-template-columns: 1fr; gap: 6px; }
    @media (min-width: 640px) { .arch-lanes { grid-template-columns: 1fr 1fr; } }
    .arch-lane { border: 1px solid var(--border); border-radius: 8px; padding: 6px 8px; background: var(--input-bg); }
    .arch-lane-title { font-size: 10px; font-weight: 700; color: var(--text-strong); margin-bottom: 4px; }
    .arch-lane-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 9px; color: var(--muted); }
    .arch-lane-step { border: 1px solid var(--border); border-radius: 4px; background: var(--surface); padding: 1px 5px; color: var(--text-primary); white-space: nowrap; }
    .flow { display: flex; flex-direction: column; gap: 0; }
    .flow-step { display: flex; gap: 8px; align-items: flex-start; }
    .flow-num { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .flow-body { flex: 1; min-width: 0; border: 1px solid var(--border); border-left: 3px solid var(--border); border-radius: 8px; padding: 6px 10px; background: var(--input-bg); }
    .flow-cf { border-left-color: #F6821F; }
    .flow-rir { border-left-color: #14b8a6; }
    .flow-lookup { border-left-color: #6b7280; }
    .flow-title { font-size: 11px; font-weight: 600; color: var(--text-strong); }
    .flow-tag { display: inline-block; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 1px 5px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }
    .flow-tag-cf { background: rgba(246,130,31,0.15); color: #F6821F; }
    .flow-tag-rir { background: rgba(20,184,166,0.15); color: #14b8a6; }
    .flow-tag-lookup { background: rgba(107,114,128,0.15); color: #9ca3af; }
    .flow-desc { font-size: 10px; color: var(--muted); margin-top: 2px; line-height: 1.4; }
    .flow-api { display: block; font-family: monospace; font-size: 9.5px; color: var(--text-primary); background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px; margin-top: 4px; white-space: pre-wrap; word-break: break-word; }
    .flow-arrow { color: var(--muted); font-size: 11px; line-height: 1; margin: 2px 0 2px 9px; }
    .flow-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 10px; color: var(--muted); margin-bottom: 8px; }
    .flow-legend-item { display: inline-flex; align-items: center; gap: 4px; }
    .flow-legend-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  </style>
</head>
<body class="font-sans min-h-screen">
  <!-- Header -->
  <header class="sticky top-0 z-40 backdrop-blur-md border-b border-cf-border" style="background:var(--header-bg)">
    <div class="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <svg class="w-7 h-7 flex-shrink-0" viewBox="0 0 64 64" fill="none"><path d="M44.048 43.904H19.2l-1.28-4.352L41.216 36l3.84 3.072-.512 3.84-.496.992z" fill="#F6821F"/><path d="M45.056 43.392l-.512-1.984c-.256-.768-.128-1.536.384-2.048.384-.512.96-.768 1.664-.768h.64l1.024.128c2.304.256 4.864.384 7.552.384h.512c.256 0 .384-.128.512-.256.128-.256.128-.512 0-.768-.896-2.944-3.712-5.056-6.912-5.184l-2.048-.128-.768-1.536c-2.432-5.184-7.68-8.512-13.504-8.512-6.656 0-12.416 4.48-14.08 10.88l-.512 2.048-2.048.256c-3.84.512-6.784 3.84-6.784 7.808 0 .384 0 .768.128 1.152 0 .256.256.384.512.384h34.112c.256 0 .512-.256.64-.512l.128-.384c.128-.384.128-.64.128-.896-.128-.768-.384-1.536-.768-1.984z" fill="#FBAD41"/></svg>
        <div>
          <h1 class="text-base font-semibold leading-tight" style="color:var(--text-strong)">Prefix Manager</h1>
          <p class="text-[11px] text-cf-gray leading-tight mt-0.5">BYOIP Prefix Manager — View, manage, and monitor IP prefix advertisements</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="toggleAbout()" class="text-xs text-cf-gray hover:text-cf-orange flex items-center gap-1" title="About">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </button>
        <a href="/api/docs" target="_blank" rel="noopener" class="text-xs text-cf-gray hover:text-cf-orange flex items-center gap-1" title="API Docs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </a>
        <button onclick="toggleSettings()" class="text-xs text-cf-gray hover:text-cf-orange flex items-center gap-1" title="Settings">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <span id="user-email" class="text-xs text-cf-gray hidden sm:inline">${userEmail}</span>
        <div class="theme-toggle" onclick="toggleTheme()">
          <span id="theme-sun" class="theme-toggle-icon"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg></span>
          <span id="theme-moon" class="theme-toggle-icon active"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg></span>
        </div>
      </div>
    </div>
  </header>

  <!-- About Panel -->
  <div id="about-panel" class="hidden max-w-7xl mx-auto px-4 mt-3 fade-in">
    <div class="panel p-4">
      <div class="flex justify-between items-start mb-2">
        <h2 class="text-sm font-semibold" style="color:var(--text-strong)">About Prefix Manager</h2>
        <button onclick="toggleAbout()" class="text-cf-gray hover:text-cf-orange text-xs">Close</button>
      </div>
      <p class="text-xs text-cf-gray leading-relaxed">
        Prefix Manager is a unified dashboard for managing BYOIP (Bring Your Own IP) prefixes across multiple Cloudflare accounts &mdash;
        covering the full lifecycle from prefix onboarding and RIR/RPKI object management through BGP advertisement, service bindings,
        delegations, and real-time propagation monitoring.
      </p>

      <div class="mt-3">
        <h3 class="text-xs font-semibold mb-1" style="color:var(--text-strong)">Prefix &amp; BGP management</h3>
        <div class="text-xs text-cf-gray leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          <div>&bull; Multi-account management with API token verification</div>
          <div>&bull; Prefix stats &amp; filtering (status, lock, CIDR, ASN)</div>
          <div>&bull; BGP sub-prefix creation &amp; advertisement toggling</div>
          <div>&bull; Bulk advertise / withdraw across prefixes</div>
          <div>&bull; Service binding management (CDN, Spectrum, Magic Transit, etc.)</div>
          <div>&bull; Prefix delegations &mdash; create, list &amp; describe sub-delegations</div>
          <div>&bull; Inline prefix description editing with #tag support</div>
          <div>&bull; Tag-based filtering &mdash; add #tags to descriptions to organize and filter prefixes</div>
        </div>
      </div>

      <div class="mt-3">
        <h3 class="text-xs font-semibold mb-1" style="color:var(--text-strong)">Validation, RIR &amp; RPKI</h3>
        <div class="text-xs text-cf-gray leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          <div>&bull; Prefix re-validation (RPKI, IRR, ownership)</div>
          <div>&bull; RIR API key management with auto-detection</div>
          <div>&bull; Route &amp; autnum object automation (ensure-route, ensure-autnum)</div>
          <div>&bull; RPKI ROA detail view per origin</div>
          <div>&bull; LOA (Letter of Authorization) PDF upload</div>
        </div>
      </div>

      <div class="mt-3">
        <h3 class="text-xs font-semibold mb-1" style="color:var(--text-strong)">Monitoring &amp; lookups</h3>
        <div class="text-xs text-cf-gray leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          <div>&bull; Looking Glass &mdash; interactive BGP path graph via Cloudflare Radar</div>
          <div>&bull; Prefix Visibility &mdash; global propagation % (Radar + RIPEstat)</div>
          <div>&bull; RDAP / Whois hover lookups (org, RIR, country, allocation)</div>
          <div>&bull; Activity log of all actions</div>
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-xs font-semibold mb-2" style="color:var(--text-strong)">Architecture</h3>
        <div class="arch-diagram">
          <div class="arch-layer">
            <div class="arch-box" style="min-width:240px">
              <div class="arch-box-title">Browser Dashboard (SPA)</div>
              <div class="arch-box-sub">Server-rendered HTML &bull; Tailwind &bull; dagre graph &bull; dark/light</div>
            </div>
          </div>
          <div class="arch-conn">&darr;</div>
          <div class="arch-layer">
            <div class="arch-box" style="min-width:240px">
              <div class="arch-box-title">Cloudflare Access (JWT)</div>
              <div class="arch-box-sub">accessAuthMiddleware &bull; per-user identity</div>
            </div>
          </div>
          <div class="arch-conn">&darr;</div>
          <div class="arch-layer">
            <div class="arch-box arch-box-worker">
              <div class="arch-box-title">Cloudflare Worker &middot; Hono + chanfana</div>
              <div class="arch-box-sub">Static UI (/) &bull; OpenAPI (/api/docs, /api/openapi.json) &bull; scheduled() cron &bull; queue() consumer</div>
              <div style="margin-top:4px">
                <span class="arch-chip">settings</span><span class="arch-chip">prefixes</span><span class="arch-chip">bgp</span><span class="arch-chip">bindings</span><span class="arch-chip">delegations</span><span class="arch-chip">services</span><span class="arch-chip">rir</span><span class="arch-chip">lookups</span><span class="arch-chip">activity</span><span class="arch-chip">notifications</span><span class="arch-chip">integrations</span><span class="arch-chip">public (Query API)</span>
              </div>
            </div>
          </div>
          <div class="arch-conn">&darr;</div>
          <div class="arch-layer">
            <div class="arch-box arch-box-store"><div class="arch-box-title">D1 (prefix-mgr-db)</div><div class="arch-box-sub">accounts, tokens, RIR creds,<br>activity, notifications, prefix state</div></div>
            <div class="arch-box arch-box-queue"><div class="arch-box-title">Queue + DLQ</div><div class="arch-box-sub">prefix-mgr-notifications</div></div>
            <div class="arch-box arch-box-store"><div class="arch-box-title">Cron (every 1 min)</div><div class="arch-box-sub">Radar advertisement poller</div></div>
          </div>
          <div class="arch-conn">&darr;</div>
          <div class="arch-layer" style="flex-direction:column">
            <div class="arch-group-label">External services</div>
            <div style="text-align:center">
              <span class="arch-chip">Cloudflare API</span><span class="arch-chip">Cloudflare Audit Logs</span><span class="arch-chip">Cloudflare Radar</span><span class="arch-chip">RIPEstat</span><span class="arch-chip">IRRexplorer</span><span class="arch-chip">RDAP</span><span class="arch-chip">ARIN Reg-RWS / Whois</span><span class="arch-chip">RIPE DB</span><span class="arch-chip">Resend (email)</span><span class="arch-chip">PagerDuty</span><span class="arch-chip">Webhooks</span>
            </div>
          </div>
        </div>
        <p class="arch-caption">Requests flow top &rarr; bottom through Access into the Worker; the cron poller and queue consumer run asynchronously inside the Worker against D1 and external services.</p>

        <div class="mt-3">
          <div class="arch-group-label" style="margin-bottom:4px">Key workflows</div>
          <div class="arch-lanes">
            <div class="arch-lane">
              <div class="arch-lane-title">Prefix onboarding</div>
              <div class="arch-lane-flow"><span class="arch-lane-step">Validate (RPKI / IRR / ownership)</span> &rarr; <span class="arch-lane-step">RIR objects + LOA</span> &rarr; <span class="arch-lane-step">Create prefix</span></div>
            </div>
            <div class="arch-lane">
              <div class="arch-lane-title">Prefix management</div>
              <div class="arch-lane-flow"><span class="arch-lane-step">List / stats / filter</span><span class="arch-lane-step">BGP advertise / withdraw</span><span class="arch-lane-step">Bindings</span><span class="arch-lane-step">Delegations</span><span class="arch-lane-step">Descriptions &amp; #tags</span></div>
            </div>
            <div class="arch-lane">
              <div class="arch-lane-title">Event auditing</div>
              <div class="arch-lane-flow"><span class="arch-lane-step">Tool actions &rarr; D1 activity_log</span> + <span class="arch-lane-step">Cloudflare Audit Logs</span> &rarr; <span class="arch-lane-step">Merged Activity panel</span></div>
            </div>
            <div class="arch-lane">
              <div class="arch-lane-title">Event notifications</div>
              <div class="arch-lane-flow"><span class="arch-lane-step">Radar poller detects change</span> &rarr; <span class="arch-lane-step">Queue + DLQ</span> &rarr; <span class="arch-lane-step">Email / PagerDuty / Webhook</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-xs font-semibold mb-2" style="color:var(--text-strong)">Creating a new prefix</h3>
        <div class="flow-legend">
          <span class="flow-legend-item"><span class="flow-legend-dot" style="background:#F6821F"></span>Cloudflare API</span>
          <span class="flow-legend-item"><span class="flow-legend-dot" style="background:#14b8a6"></span>Registrar (ARIN / RIPE)</span>
          <span class="flow-legend-item"><span class="flow-legend-dot" style="background:#6b7280"></span>Validation lookup</span>
        </div>
        <div class="flow">
          <div class="flow-step">
            <div class="flow-num">1</div>
            <div class="flow-body flow-cf">
              <div class="flow-title">Upload LOA <span class="text-cf-gray font-normal">(optional)</span><span class="flow-tag flow-tag-cf">Cloudflare</span></div>
              <div class="flow-desc">Attach a Letter of Authorization PDF; returns a loa_document_id for the create step.</div>
              <code class="flow-api">POST /api/loa-upload  &rarr;  CF POST /accounts/{id}/addressing/loa_documents</code>
            </div>
          </div>
          <div class="flow-arrow">&darr;</div>
          <div class="flow-step">
            <div class="flow-num">2</div>
            <div class="flow-body flow-lookup">
              <div class="flow-title">Pre-submission validation<span class="flow-tag flow-tag-lookup">Lookup</span></div>
              <div class="flow-desc">Check ROA/RPKI and IRR route objects for an ASN match before creating the prefix.</div>
              <code class="flow-api">POST /api/prefixes/validate-new
  &rarr; RIPEstat GET /data/rpki-validation (ROA)
  &rarr; RIPEstat GET /data/prefix-routing-consistency (IRR)</code>
            </div>
          </div>
          <div class="flow-arrow">&darr;</div>
          <div class="flow-step">
            <div class="flow-num">3</div>
            <div class="flow-body flow-cf">
              <div class="flow-title">Create prefix<span class="flow-tag flow-tag-cf">Cloudflare</span></div>
              <div class="flow-desc">Creates the BYOIP prefix and returns the ownership_validation_token. Logs activity and enqueues a create_prefix notification. If the origin is AS13335 (Cloudflare) or no RIR API keys are saved, the flow stops here.</div>
              <code class="flow-api">POST /api/prefixes  &rarr;  CF POST /accounts/{id}/addressing/prefixes
  body: { cidr, asn, delegate_loa_creation, description?, loa_document_id? }</code>
            </div>
          </div>
          <div class="flow-arrow">&darr;</div>
          <div class="flow-step">
            <div class="flow-num">4</div>
            <div class="flow-body flow-lookup">
              <div class="flow-title">Detect RIR<span class="flow-tag flow-tag-lookup">Lookup</span></div>
              <div class="flow-desc">Determine the responsible registry via RDAP (falls back to the first saved RIR API key).</div>
              <code class="flow-api">GET /api/rir/detect?prefix=&hellip;  &rarr;  RDAP rdap.org &rarr; ARIN / RIPE bootstrap</code>
            </div>
          </div>
          <div class="flow-arrow">&darr;</div>
          <div class="flow-step">
            <div class="flow-num">5</div>
            <div class="flow-body flow-rir">
              <div class="flow-title">Ensure route object (add validation token)<span class="flow-tag flow-tag-rir">Registrar</span></div>
              <div class="flow-desc">Add descr: cf-validation: &lt;token&gt; to the route / route6 object at the registrar.</div>
              <code class="flow-api">POST /api/rir/ensure-route
  ARIN: GET/POST/PUT reg.arin.net/rest/irr/route/{ip}/{mask}/AS{asn} (ApiKey, RPSL/XML)
  RIPE: PUT/POST rest.db.ripe.net/ripe/route[6] (Basic, JSON)</code>
            </div>
          </div>
          <div class="flow-arrow">&darr;</div>
          <div class="flow-step">
            <div class="flow-num">6</div>
            <div class="flow-body flow-rir">
              <div class="flow-title">Ensure aut-num object (add validation token)<span class="flow-tag flow-tag-rir">Registrar</span></div>
              <div class="flow-desc">Add the same cf-validation token to the aut-num object for the origin ASN.</div>
              <code class="flow-api">POST /api/rir/ensure-autnum
  ARIN: GET/POST/PUT reg.arin.net/rest/irr/aut-num/AS{asn} (+POCs from whois.arin.net)
  RIPE: PUT rest.db.ripe.net/ripe/aut-num</code>
            </div>
          </div>
          <div class="flow-arrow">&darr;</div>
          <div class="flow-step">
            <div class="flow-num">7</div>
            <div class="flow-body flow-cf">
              <div class="flow-title">Request Cloudflare validation<span class="flow-tag flow-tag-cf">Cloudflare</span></div>
              <div class="flow-desc">Cloudflare re-checks the IRR objects for the token. May take up to ~10 minutes; the prefix list then refreshes.</div>
              <code class="flow-api">POST /api/prefixes/{prefixId}/validate  &rarr;  CF POST /accounts/{id}/addressing/prefixes/{prefixId}/validate</code>
            </div>
          </div>
        </div>
        <p class="arch-caption">Steps 4&ndash;6 run automatically only for BYO-ASN prefixes (ASN &ne; 13335, Cloudflare&rsquo;s own ASN) with saved RIR API keys; otherwise the UI shows a manual copy-paste guide with the same token and objects.</p>
      </div>

      <p class="text-xs text-cf-gray leading-relaxed mt-3">
        <strong>Required API Token Permissions:</strong> Account &rarr; IP Prefixes (Read/Edit) + IP Prefixes: BGP On Demand (Read/Edit) + Radar (Read) + Account Settings (Read, for audit logs) + Logs (Read/Edit, for audit-log streaming).
      </p>
      <p class="text-xs leading-relaxed mt-3">
        <a href="/api/docs" target="_blank" rel="noopener" style="color:#F6821F;text-decoration:none;font-weight:500">View interactive API docs (/api/docs) &#8599;</a>
        <span class="text-cf-gray">&mdash; OpenAPI spec at <a href="/api/openapi.json" target="_blank" rel="noopener" style="color:#F6821F;text-decoration:none;font-weight:500">/api/openapi.json</a></span>
      </p>
    </div>
  </div>

  <!-- Settings Panel -->
  <div id="settings-panel" class="hidden max-w-7xl mx-auto px-4 mt-3 fade-in">
    <div class="panel p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button onclick="toggleSettings()" class="text-cf-gray hover:text-cf-orange" title="Close settings">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h2 class="text-sm font-semibold" style="color:var(--text-strong)">Accounts</h2>
        </div>
        <button onclick="showAddAccount()" class="px-3 py-1 text-xs font-semibold rounded-lg border border-cf-border text-cf-gray hover:border-cf-orange hover:text-cf-orange">+ Add Account</button>
      </div>

      <!-- Saved accounts list -->
      <div id="accounts-list" class="space-y-2"></div>

      <!-- Add account form (hidden by default) -->
      <div id="account-form" class="hidden border border-cf-border rounded-lg p-4 space-y-3">
        <h3 class="text-xs font-semibold" style="color:var(--text-strong)">Add Account</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-cf-gray mb-1">Account Label</label>
            <input id="set-label" type="text" placeholder="e.g. Production" class="w-full px-3 py-2 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-medium text-cf-gray mb-1">Account ID</label>
            <input id="set-account-id" type="text" placeholder="Cloudflare Account ID" class="w-full px-3 py-2 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-medium text-cf-gray mb-1">API Token</label>
            <input id="set-api-token" type="password" placeholder="Cloudflare API Token" class="w-full px-3 py-2 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-medium text-cf-gray mb-1">API rate limit (req / 5 min)${infoTip('The default Cloudflare API rate limit is <strong>1200 requests / 5 min</strong>. If you need to increase this limit, reach out to your Cloudflare account team.')}</label>
            <input id="set-rate-limit" type="number" min="1" value="1200" class="w-full px-3 py-2 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <button onclick="saveAccount()" class="px-4 py-1.5 bg-cf-orange text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition">Save Account</button>
          <button onclick="testNewAccountToken()" class="px-4 py-1.5 border border-cf-border text-cf-gray text-xs font-semibold rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Test Token</button>
          <button onclick="hideAccountForm()" class="px-4 py-1.5 text-xs text-cf-gray hover:text-white">Cancel</button>
          <div id="test-token-result" class="flex items-center text-xs"></div>
        </div>
        <div id="set-account-msg"></div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 py-4">
    <!-- Filter Bar -->
    <div class="panel px-2.5 py-2 mb-4 flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1.5">
        <label class="text-xs text-cf-gray font-medium">Account:</label>
        <select id="filter-account" onchange="onAccountChange()" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none min-w-[140px]">
          <option value="">No accounts configured</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <label class="text-xs text-cf-gray font-medium">Status:</label>
        <select id="filter-status" onchange="applyFilters()" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          <option value="all">All</option>
          <option value="pending">Pending Approval</option>
          <option value="advertised">Advertised</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="locked">Locked</option>
          <option value="unlocked">Unlocked</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <label class="text-xs text-cf-gray font-medium">Prefix:</label>
        <input id="filter-prefix" type="text" placeholder="e.g. 192.168.1" oninput="applyFilters()" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none w-28 font-mono">
      </div>
      <div class="flex items-center gap-1.5">
        <label class="text-xs text-cf-gray font-medium">Family:</label>
        <select id="filter-family" onchange="applyFilters()" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          <option value="all">All</option>
          <option value="ipv4">IPv4</option>
          <option value="ipv6">IPv6</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <label class="text-xs text-cf-gray font-medium">ASN:</label>
        <input id="filter-asn" type="text" placeholder="Filter by ASN" oninput="applyFilters()" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none w-24">
      </div>
      <div class="flex items-center gap-1.5">
        <label class="text-xs text-cf-gray font-medium">Tag:${infoTip('Add #tags to any prefix description to organize and filter prefixes. For example: <strong>#production</strong>, <strong>#us-east</strong>, <strong>#customer-xyz</strong>. Tags are case-insensitive and support letters, numbers, hyphens, and underscores.')}</label>
        <select id="filter-tag" onchange="applyFilters()" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          <option value="all">All</option>
        </select>
      </div>
      <div class="ml-auto flex-shrink-0">
        <button onclick="resetFilters()" class="px-2.5 py-1 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition flex items-center gap-1" title="Reset all filters to defaults">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Inline status message for prefix operations -->
    <div id="prefix-msg" class="mb-3 empty:hidden"></div>

    <!-- Stats Row -->
    <div id="stats-row" class="hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
      <div class="panel p-3 text-center">
        <div id="stat-total" class="text-xl font-bold" style="color:var(--text-strong)">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">Total Prefixes</div>
        <div id="stat-total-sub" class="text-[10px] text-cf-gray font-normal mt-0.5"></div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-advertised" class="text-xl font-bold text-green-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">Advertised</div>
        <div id="stat-advertised-sub" class="text-[10px] text-cf-gray font-normal mt-0.5"></div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-withdrawn" class="text-xl font-bold text-red-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">Withdrawn</div>
        <div id="stat-withdrawn-sub" class="text-[10px] text-cf-gray font-normal mt-0.5"></div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-locked" class="text-xl font-bold text-yellow-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">Locked</div>
        <div id="stat-locked-sub" class="text-[10px] text-cf-gray font-normal mt-0.5"></div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-irr" class="text-xl font-bold text-green-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">IRR</div>
        <div id="stat-irr-sub" class="text-[10px] text-cf-gray font-normal mt-0.5"></div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-rpki" class="text-xl font-bold text-green-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">RPKI</div>
        <div id="stat-rpki-sub" class="text-[10px] text-cf-gray font-normal mt-0.5"></div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-family" class="text-xl font-bold"><span class="text-blue-400">0</span> / <span class="text-purple-400">0</span></div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">IP Version</div>
        <div id="stat-family-sub" class="text-[10px] text-cf-gray font-normal mt-0.5">IPv4 / IPv6</div>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div id="bulk-action-bar" class="hidden panel p-3 mb-4 flex items-center gap-3 fade-in" style="border-color:#F6821F;border-width:1px">
      <span id="bulk-count" class="text-xs font-medium" style="color:var(--text-strong)">0 prefixes selected</span>
      <button onclick="bulkToggle(true)" class="px-3 py-1.5 bg-green-600 text-white btn-force-white text-xs font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        Advertise Selected
      </button>
      <button onclick="bulkToggle(false)" class="px-3 py-1.5 bg-red-600 text-white btn-force-white text-xs font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
        Withdraw Selected
      </button>
      <button onclick="clearSelection()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Clear Selection</button>
    </div>

    <!-- Prefix Table -->
    <div class="panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-cf-border text-left">
              <th class="px-2 py-2.5 text-cf-gray font-medium w-8"><input type="checkbox" id="select-all-checkbox" onchange="toggleSelectAll(this)" style="cursor:pointer;accent-color:#F6821F"></th>
              <th class="px-3 py-2.5 text-cf-gray font-medium w-8"></th>
              <th class="px-2 py-2.5 text-cf-gray font-medium w-8"></th>
              <th class="px-3 py-2.5 text-cf-gray font-medium">Prefix (CIDR)</th>
              <th class="px-3 py-2.5 text-cf-gray font-medium">ASN</th>
              <th class="px-3 py-2.5 text-cf-gray font-medium">Status</th>
              <th class="px-3 py-2.5 text-cf-gray font-medium">IRR</th>
              <th class="px-3 py-2.5 text-cf-gray font-medium">RPKI</th>
              <th class="px-3 py-2.5 text-cf-gray font-medium">Description / Tags</th>
              <th class="px-3 py-2.5 text-cf-gray font-medium text-right"><div class="inline-flex items-center gap-1.5"><button onclick="loadPrefixes()" title="Refresh prefixes" class="px-2.5 py-1 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Refresh</button><button onclick="openAddPrefixModal()" title="Add a new prefix" class="px-2.5 py-1 border border-cf-orange text-cf-orange text-xs font-medium rounded-lg hover:bg-cf-orange hover:text-white transition inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>Add Prefix</button></div></th>
            </tr>
          </thead>
          <tbody id="prefix-table-body">
            <tr><td colspan="10" class="px-4 py-12 text-center text-cf-gray">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-8 h-8 text-cf-gray opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                <span>Configure an account in Settings to view BYOIP prefixes</span>
              </div>
            </td></tr>
          </tbody>
        </table>
      </div>
      <div id="pagination-controls" class="hidden border-t border-cf-border px-4 py-3 flex items-center justify-between"></div>
    </div>

    <!-- Activity Log Panel -->
    <div id="activity-log-panel" class="panel overflow-hidden mt-4">
      <div onclick="toggleActivityLog()" class="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[rgba(246,130,31,0.05)] transition">
        <div class="flex items-center gap-2">
          <span id="activity-log-chevron" class="chevron text-cf-gray text-xs">&#9654;</span>
          <svg class="w-4 h-4 text-cf-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          <h3 class="text-xs font-semibold" style="color:var(--text-strong)">Activity Log</h3>
          <span id="activity-log-count" class="text-[10px] text-cf-gray px-1.5 py-0.5 rounded-full border border-cf-border hidden">0</span>
        </div>
        <div class="flex items-center gap-2">
          <select id="activity-log-window" onclick="event.stopPropagation()" onchange="event.stopPropagation();setActivityLogDays(this.value)" class="hidden bg-cf-bg border border-cf-border text-cf-gray text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-cf-orange" title="Time window">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
          </select>
          <select id="activity-log-source" onclick="event.stopPropagation()" onchange="event.stopPropagation();setActivityLogSource(this.value)" class="hidden bg-cf-bg border border-cf-border text-cf-gray text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-cf-orange" title="Filter by source">
            <option value="all">All sources</option>
            <option value="local">Local tool</option>
            <option value="audit">Audit log</option>
          </select>
          <select id="activity-log-action" onclick="event.stopPropagation()" onchange="event.stopPropagation();setActivityLogAction(this.value)" class="hidden bg-cf-bg border border-cf-border text-cf-gray text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-cf-orange" title="Filter by action">
            <option value="all">All actions</option>
          </select>
          <span id="activity-log-hint" class="text-[10px] text-cf-gray">Click to expand</span>
          <button id="activity-log-refresh" onclick="event.stopPropagation();loadActivityLog()" class="hidden text-cf-gray hover:text-cf-orange p-1 rounded hover:bg-[rgba(246,130,31,0.1)] transition" title="Refresh">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
        </div>
      </div>
      <div id="activity-log-body" class="hidden" style="border-top:1px solid var(--border)">
        <div id="activity-log-content">
          <div class="px-4 py-8 text-center text-cf-gray text-xs">
            <div class="spinner" style="margin:0 auto 8px"></div>
            Loading activity log...
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Queue Panel -->
    <div id="notif-queue-panel" class="panel overflow-hidden mt-4">
      <div onclick="toggleNotifQueue()" class="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[rgba(246,130,31,0.05)] transition">
        <div class="flex items-center gap-2">
          <span id="notif-queue-chevron" class="chevron text-cf-gray text-xs">&#9654;</span>
          <svg class="w-4 h-4 text-cf-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <h3 class="text-xs font-semibold" style="color:var(--text-strong)">Notifications Queue</h3>
          <span id="notif-queue-count" class="text-[10px] text-cf-gray px-1.5 py-0.5 rounded-full border border-cf-border hidden">0</span>
        </div>
        <div class="flex items-center gap-2">
          <span id="notif-queue-hint" class="text-[10px] text-cf-gray">Click to expand</span>
          <button id="notif-queue-refresh" onclick="event.stopPropagation();loadNotifQueue()" class="hidden text-cf-gray hover:text-cf-orange p-1 rounded hover:bg-[rgba(246,130,31,0.1)] transition" title="Refresh">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
        </div>
      </div>
      <div id="notif-queue-body" class="hidden" style="border-top:1px solid var(--border)">
        <div id="notif-queue-msg" class="px-4 pt-2 empty:hidden"></div>
        <div id="notif-queue-content">
          <div class="px-4 py-8 text-center text-cf-gray text-xs">
            <div class="spinner" style="margin:0 auto 8px"></div>
            Loading notifications...
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Looking Glass Modal -->
  <div id="lg-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeLgModal()">
    <div class="modal-content" style="max-width:95vw;width:1400px;max-height:95vh;display:flex;flex-direction:column;">
      <div class="flex items-center justify-between p-4 border-b border-cf-border flex-shrink-0">
        <div>
          <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Looking Glass</h3>
          <p id="lg-prefix-label" class="text-xs text-cf-gray mt-0.5 font-mono"></p>
        </div>
        <button onclick="closeLgModal()" class="text-cf-gray hover:text-cf-orange p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="lg-content" class="p-4 overflow-y-auto flex-1">
        <div class="flex items-center justify-center py-12">
          <div class="spinner"></div>
          <span class="ml-2 text-xs text-cf-gray">Loading BGP routes...</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Looking Glass JSON Modal -->
  <div id="lg-json-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeLgJsonModal()" style="z-index:110">
    <div class="modal-content lg-json-modal-content">
      <div class="flex items-center justify-between p-3 border-b border-cf-border">
        <div class="flex items-center gap-2">
          <h3 class="text-xs font-semibold" style="color:var(--text-strong)">Route JSON</h3>
          <button onclick="copyLgJson()" class="text-cf-gray hover:text-cf-orange text-[10px] px-1.5 py-0.5 border border-cf-border rounded hover:border-cf-orange" id="lg-json-copy-btn">Copy</button>
        </div>
        <button onclick="closeLgJsonModal()" class="text-cf-gray hover:text-cf-orange p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-3 overflow-auto" style="max-height:60vh">
        <pre id="lg-json-content" class="text-[11px] font-mono p-3 rounded-lg" style="background:var(--input-bg);color:var(--text-primary);white-space:pre-wrap;word-break:break-all;"></pre>
      </div>
    </div>
  </div>

  <!-- Confirm Toggle Modal -->
  <div id="confirm-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeConfirmModal()">
    <div class="modal-content" style="max-width:420px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Confirm Advertisement Change</h3>
      </div>
      <div class="p-4">
        <p id="confirm-message" class="text-xs text-cf-gray mb-4"></p>
        <div class="flex justify-end gap-2">
          <button onclick="closeConfirmModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="confirm-btn" onclick="executeToggle()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Generic App Confirm Modal -->
  <div id="app-confirm-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeAppConfirmModal()" style="z-index:200">
    <div class="modal-content" style="max-width:420px">
      <div class="p-4 border-b border-cf-border">
        <h3 id="app-confirm-title" class="text-sm font-semibold" style="color:var(--text-strong)">Confirm</h3>
      </div>
      <div class="p-4">
        <p id="app-confirm-message" class="text-xs text-cf-gray mb-4"></p>
        <div class="flex justify-end gap-2">
          <button onclick="closeAppConfirmModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="app-confirm-btn" onclick="runAppConfirm()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Service Binding Confirm Modal -->
  <div id="delete-binding-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeDeleteBindingModal()">
    <div class="modal-content" style="max-width:420px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Delete Service Binding</h3>
      </div>
      <div class="p-4">
        <p id="delete-binding-message" class="text-xs text-cf-gray mb-3"></p>
        <p class="text-[10px] text-red-500 mb-4">Changes take 4–6 hours to propagate. This action cannot be undone.</p>
        <div id="delete-binding-error" class="mb-3 empty:hidden"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeDeleteBindingModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="delete-binding-btn" onclick="executeDeleteBinding()" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete BGP Child Prefix Confirm Modal -->
  <div id="delete-bgp-prefix-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeDeleteBgpPrefixModal()">
    <div class="modal-content" style="max-width:420px">
      <div class="p-4 border-b border-cf-border">
        <h3 id="delete-bgp-prefix-title" class="text-sm font-semibold" style="color:var(--text-strong)">Delete BGP Child Prefix</h3>
      </div>
      <div class="p-4">
        <p id="delete-bgp-prefix-message" class="text-xs text-cf-gray mb-3"></p>
        <p class="text-[10px] text-red-500 mb-4">This action cannot be undone.</p>
        <div id="delete-bgp-prefix-error" class="mb-3 empty:hidden"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeDeleteBgpPrefixModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="delete-bgp-prefix-btn" onclick="executeDeleteBgpPrefix()" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Parent Prefix Confirm Modal -->
  <div id="delete-prefix-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeDeletePrefixModal()">
    <div class="modal-content" style="max-width:420px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Delete Prefix</h3>
      </div>
      <div class="p-4">
        <p id="delete-prefix-message" class="text-xs text-cf-gray mb-3"></p>
        <p class="text-[10px] text-red-500 mb-4">This action cannot be undone. Only unapproved prefixes can be deleted.</p>
        <div id="delete-prefix-error" class="mb-3 empty:hidden"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeDeletePrefixModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="delete-prefix-btn" onclick="executeDeletePrefix()" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Service Binding Modal -->
  <div id="binding-modal" class="hidden modal-overlay">
    <div class="modal-content" style="max-width:480px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Add Service Binding</h3>
        <p id="binding-modal-prefix" class="text-xs text-cf-gray mt-0.5 font-mono"></p>
      </div>
      <div class="p-4">
        <p class="text-[10px] text-cf-gray mb-3">Route traffic for a CIDR range within this prefix to a Cloudflare service. Changes take 4–6 hours to propagate.</p>
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">Service</label>
          <select id="binding-service" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
            <option value="">Loading services...</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">CIDR</label>
          <div class="flex gap-2">
            <input id="binding-ip" type="text" placeholder="IP address" class="flex-1 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white font-mono focus:border-cf-orange focus:outline-none">
            <span class="text-cf-gray self-center">/</span>
            <select id="binding-mask" class="w-20 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none"></select>
          </div>
        </div>
        <div id="binding-validation" class="text-[10px] mb-3 hidden"></div>
        <div id="binding-error" class="text-[10px] text-red-400 mb-3 hidden"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeBindingModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="binding-submit-btn" onclick="submitBinding()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Create Binding</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Child Prefix Modal -->
  <div id="child-prefix-modal" class="hidden modal-overlay">
    <div class="modal-content" style="max-width:480px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Add Child Prefix</h3>
        <p id="child-prefix-modal-parent" class="text-xs text-cf-gray mt-0.5 font-mono"></p>
      </div>
      <div class="p-4">
        <p class="text-[10px] text-cf-gray mb-3">Create a more-specific BGP child prefix within this parent prefix. Child prefixes are created in a <strong>withdrawn</strong> state and must be advertised separately.</p>
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">CIDR</label>
          <div class="flex gap-2">
            <input id="child-prefix-ip" type="text" placeholder="IP address" class="flex-1 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white font-mono focus:border-cf-orange focus:outline-none">
            <span class="text-cf-gray self-center">/</span>
            <select id="child-prefix-mask" onchange="autoFillChildPrefixIp()" class="w-20 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none"></select>
          </div>
        </div>
        <div id="child-prefix-error" class="text-[10px] text-red-400 mb-3 hidden"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeChildPrefixModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="child-prefix-submit-btn" onclick="submitChildPrefix()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Create Child Prefix</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delegate Prefix Modal -->
  <div id="delegation-modal" class="hidden modal-overlay">
    <div class="modal-content" style="max-width:480px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Delegate Prefix</h3>
        <p id="delegation-modal-prefix" class="text-xs text-cf-gray mt-0.5 font-mono"></p>
      </div>
      <div class="p-4">
        <p class="text-[10px] text-cf-gray mb-3">Delegate a CIDR range within this prefix to another Cloudflare account. The delegated account will be able to use the prefix for their own services.</p>
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">CIDR</label>
          <div class="flex gap-2">
            <input id="delegation-ip" type="text" placeholder="IP address" class="flex-1 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white font-mono focus:border-cf-orange focus:outline-none">
            <span class="text-cf-gray self-center">/</span>
            <select id="delegation-mask" class="w-20 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none"></select>
          </div>
        </div>
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">Delegated Account ID</label>
          <input id="delegation-account-id" type="text" placeholder="Target Cloudflare Account ID" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white font-mono focus:border-cf-orange focus:outline-none">
        </div>
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">Description <span class="text-[10px]">(optional)</span></label>
          <input id="delegation-description" type="text" placeholder="e.g. Customer XYZ, Partner network" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
        </div>
        <div id="delegation-error" class="text-[10px] text-red-400 mb-3 hidden"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeDelegationModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="delegation-submit-btn" onclick="submitDelegation()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Create Delegation</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Delegation Confirm Modal -->
  <div id="delete-delegation-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeDeleteDelegationModal()">
    <div class="modal-content" style="max-width:420px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Delete Delegation</h3>
      </div>
      <div class="p-4">
        <p id="delete-delegation-message" class="text-xs text-cf-gray mb-3"></p>
        <p class="text-[10px] text-red-500 mb-4">The delegated account will lose access to this prefix range. This action cannot be undone.</p>
        <div id="delete-delegation-error" class="mb-3 empty:hidden"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeDeleteDelegationModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="delete-delegation-btn" onclick="executeDeleteDelegation()" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Bulk Toggle Confirmation Modal -->
  <div id="bulk-confirm-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeBulkConfirmModal()">
    <div class="modal-content" style="max-width:520px">
      <div class="p-4 border-b border-cf-border">
        <h3 id="bulk-confirm-title" class="text-sm font-semibold" style="color:var(--text-strong)">Confirm Bulk Advertisement Change</h3>
      </div>
      <div class="p-4">
        <p id="bulk-confirm-message" class="text-xs text-cf-gray mb-3"></p>
        <div id="bulk-confirm-list" class="max-h-48 overflow-y-auto mb-3 border border-cf-border rounded-lg p-2 text-xs font-mono"></div>
        <div id="bulk-confirm-warning" class="text-[10px] text-red-500 mb-3 hidden"></div>
        <div id="bulk-confirm-results" class="hidden mb-3 text-xs"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeBulkConfirmModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="bulk-confirm-btn" onclick="executeBulkToggle()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Prefix Modal -->
  <div id="add-prefix-modal" class="hidden modal-overlay">
    <div class="modal-content" style="max-width:560px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Add Prefix</h3>
        <p class="text-xs text-cf-gray mt-0.5">Onboard a new BYOIP prefix to your Cloudflare account</p>
      </div>
      <div class="p-4">
        <!-- Prefix CIDR -->
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">Prefix (CIDR)${infoTip('Enter an IPv4 or IPv6 prefix in CIDR notation. Minimum size: /24 for IPv4, /32 for IPv6. Must be a publicly routable prefix registered at an RIR.')}</label>
          <div class="flex items-center gap-2 mb-1.5">
            <div class="flex rounded-lg border border-cf-border overflow-hidden" style="background:var(--input-bg)">
              <button id="add-prefix-ipv4-btn" onclick="setAddPrefixFamily('v4')" class="px-2.5 py-1 text-[11px] font-medium transition" style="background:var(--accent);color:#fff">IPv4</button>
              <button id="add-prefix-ipv6-btn" onclick="setAddPrefixFamily('v6')" class="px-2.5 py-1 text-[11px] font-medium transition" style="color:var(--muted)">IPv6</button>
            </div>
          </div>
          <div class="flex gap-2">
            <input id="add-prefix-ip" type="text" placeholder="e.g. 192.0.2.0" oninput="onAddPrefixIpChange()" class="flex-1 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white font-mono focus:border-cf-orange focus:outline-none">
            <span class="text-cf-gray self-center">/</span>
            <select id="add-prefix-mask" class="w-20 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
            </select>
          </div>
        </div>

        <!-- ASN -->
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">ASN (Autonomous System Number)${infoTip('Select the Cloudflare ASN (13335) or enter your own. If using your own ASN, valid IRR and ROA records are required for the prefix.')}</label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2 text-xs cursor-pointer">
              <input type="radio" name="add-prefix-asn-mode" value="cloudflare" checked onchange="onAsnModeChange()" style="accent-color:#F6821F">
              <span style="color:var(--text-primary)">Use Cloudflare's ASN (13335)</span>
            </label>
            <label class="flex items-center gap-2 text-xs cursor-pointer">
              <input type="radio" name="add-prefix-asn-mode" value="custom" onchange="onAsnModeChange()" style="accent-color:#F6821F">
              <span style="color:var(--text-primary)">Use my own ASN</span>
            </label>
            <div id="add-prefix-custom-asn-wrap" class="hidden ml-5">
              <input id="add-prefix-custom-asn" type="number" placeholder="e.g. 64496" min="1" max="4294967295" class="w-40 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white font-mono focus:border-cf-orange focus:outline-none">
              <p id="add-prefix-byo-asn-note" class="text-[10px] mt-1" style="color:var(--muted)"></p>
            </div>
          </div>
        </div>

        <!-- LOA -->
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">Letter of Authorization (LOA)${infoTip('A LOA proves you are authorized to use this IP prefix. You can let Cloudflare auto-generate one, or upload your own PDF (max 10MB).')}</label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2 text-xs cursor-pointer">
              <input type="radio" name="add-prefix-loa-mode" value="delegate" checked onchange="onLoaModeChange()" style="accent-color:#F6821F">
              <span style="color:var(--text-primary)">Delegate LOA auto-generation to Cloudflare</span>
            </label>
            <label class="flex items-center gap-2 text-xs cursor-pointer">
              <input type="radio" name="add-prefix-loa-mode" value="upload" onchange="onLoaModeChange()" style="accent-color:#F6821F">
              <span style="color:var(--text-primary)">Upload LOA document (PDF)</span>
            </label>
            <div id="add-prefix-loa-upload-wrap" class="hidden ml-5">
              <div class="flex items-center gap-2">
                <input id="add-prefix-loa-file" type="file" accept=".pdf,application/pdf" onchange="onLoaFileSelected()" class="text-xs text-cf-gray file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border file:border-cf-border file:bg-cf-dark file:text-xs file:text-cf-gray file:cursor-pointer hover:file:border-cf-orange">
                <span id="add-prefix-loa-status" class="text-[10px]"></span>
              </div>
              <p class="text-[10px] text-cf-gray mt-1">PDF format only, max 10MB</p>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mb-3">
          <label class="block text-xs text-cf-gray mb-1">Description <span class="text-[10px]">(optional)</span></label>
          <input id="add-prefix-description" type="text" placeholder="e.g. Production network #us-east" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
        </div>

        <!-- Validation Results -->
        <div id="add-prefix-validation-results" class="hidden mb-3 p-3 rounded-lg border border-cf-border" style="background:var(--input-bg)">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold" style="color:var(--text-strong)">Validation Results</span>
            <span id="add-prefix-validation-badge"></span>
          </div>
          <div id="add-prefix-validation-details" class="text-[11px] space-y-1.5"></div>
        </div>

        <!-- Client-Side Errors -->
        <div id="add-prefix-error" class="text-[10px] text-red-400 mb-3 hidden"></div>

        <!-- Buttons -->
        <div class="flex justify-between gap-2">
          <button id="add-prefix-validate-btn" onclick="validatePrefixRemote()" class="px-3 py-1.5 border border-blue-500 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500 hover:text-white transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Validate IRR / ROA
          </button>
          <div class="flex gap-2">
            <button onclick="closeAddPrefixModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
            <button id="add-prefix-submit-btn" onclick="submitNewPrefix()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Add Prefix</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Post-Creation Guide Modal -->
  <div id="post-creation-guide-modal" class="hidden modal-overlay" onclick="if(event.target===this)closePostCreationGuide()">
    <div class="modal-content" style="max-width:580px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Prefix Created Successfully</h3>
      </div>
      <div id="post-creation-guide-body" class="p-4 text-xs" style="color:var(--text-primary)"></div>
      <div class="p-4 pt-0 flex justify-end">
        <button onclick="closePostCreationGuide()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Done</button>
      </div>
    </div>
  </div>

  <script>
    // ─── State ────────────────────────────────────────────────────
    var savedAccounts = [];
    var activeAccountId = '';
    var allPrefixes = [];
    var filteredPrefixes = [];
    var expandedRows = {};
    var childData = {};
    var prefixStats = null;
    var pendingToggle = null;
    
    var rdapCache = {};
    var rpkiCache = {};
    var selectedPrefixes = new Set();
    var pendingBulkToggle = null;
    var servicesCache = {};
    var bindingModalContext = null;
    var childPrefixModalContext = null;
    var delegationModalContext = null;
    var pendingDeleteDelegation = null;
    var currentPage = 1;
    var pageSize = 25;
    var activityLogLoaded = false;
    var activityLogExpanded = false;
    var activityLogEntries = [];
    var activityLogSource = 'all';
    var activityLogAction = 'all';
    var activityLogDays = 30;
    var activityLogSortDir = 'desc';
    var activityLogAuditError = '';
    var notifQueueLoaded = false;
    var notifQueueExpanded = false;

    // ─── Tooltip Positioning (fixed, escapes overflow:hidden) ────
    function positionTooltip(triggerEl, tipEl) {
      var rect = triggerEl.getBoundingClientRect();
      tipEl.style.left = rect.left + 'px';
      tipEl.style.top = (rect.bottom + 6) + 'px';
      requestAnimationFrame(function() {
        var tipRect = tipEl.getBoundingClientRect();
        if (tipRect.bottom > window.innerHeight) {
          tipEl.style.top = (rect.top - tipRect.height - 6) + 'px';
        }
        if (tipRect.right > window.innerWidth) {
          tipEl.style.left = (window.innerWidth - tipRect.width - 8) + 'px';
        }
        if (tipRect.left < 0) {
          tipEl.style.left = '8px';
        }
      });
    }

    document.addEventListener('mouseover', function(e) {
      var infoTip = e.target.closest('.info-tip');
      if (infoTip) {
        var bubble = infoTip.querySelector('.info-bubble');
        if (bubble) positionTooltip(infoTip, bubble);
        return;
      }
      var valHover = e.target.closest('.validation-hover');
      if (valHover) {
        var tip = valHover.querySelector('.validation-tip');
        if (tip) positionTooltip(valHover, tip);
        return;
      }
      var cidrHover = e.target.closest('.cidr-hover');
      if (cidrHover) {
        var tip = cidrHover.querySelector('.rdap-tip');
        if (tip) positionTooltip(cidrHover, tip);
        return;
      }
      var lgInfoIcon = e.target.closest('.lg-info-icon');
      if (lgInfoIcon) {
        var tip = lgInfoIcon.querySelector('.lg-info-tip');
        if (tip) positionTooltip(lgInfoIcon, tip);
        return;
      }
    });

    document.addEventListener('focusin', function(e) {
      var infoTip = e.target.closest('.info-tip');
      if (infoTip) {
        var bubble = infoTip.querySelector('.info-bubble');
        if (bubble) positionTooltip(infoTip, bubble);
      }
    });

    // ─── Init ─────────────────────────────────────────────────────
    (function init() {
      var saved = localStorage.getItem('theme');
      if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('theme-sun').classList.add('active');
        document.getElementById('theme-moon').classList.remove('active');
      }
      loadAccounts();
    })();

    // ─── Theme ────────────────────────────────────────────────────
    function toggleTheme() {
      var html = document.documentElement;
      var isLight = html.getAttribute('data-theme') === 'light';
      html.setAttribute('data-theme', isLight ? 'dark' : 'light');
      document.getElementById('theme-sun').classList.toggle('active', !isLight);
      document.getElementById('theme-moon').classList.toggle('active', isLight);
      localStorage.setItem('theme', isLight ? 'dark' : 'light');
    }

    function toggleAbout() {
      var p = document.getElementById('about-panel');
      p.classList.toggle('hidden');
      if (!p.classList.contains('hidden')) document.getElementById('settings-panel').classList.add('hidden');
    }

    function toggleSettings() {
      var p = document.getElementById('settings-panel');
      p.classList.toggle('hidden');
      if (!p.classList.contains('hidden')) {
        document.getElementById('about-panel').classList.add('hidden');
        renderAccountsList();
      } else {
        hideAccountForm();
      }
    }

    function showAddAccount() {
      var form = document.getElementById('account-form');
      if (form) form.classList.remove('hidden');
    }

    function hideAccountForm() {
      var form = document.getElementById('account-form');
      if (form) form.classList.add('hidden');
      var label = document.getElementById('set-label');
      var accId = document.getElementById('set-account-id');
      var token = document.getElementById('set-api-token');
      var rl = document.getElementById('set-rate-limit');
      var msg = document.getElementById('set-account-msg');
      var result = document.getElementById('test-token-result');
      if (label) label.value = '';
      if (accId) accId.value = '';
      if (token) token.value = '';
      if (rl) rl.value = '1200';
      if (msg) msg.innerHTML = '';
      if (result) result.innerHTML = '';
    }

    // ─── Accounts ─────────────────────────────────────────────────
    async function loadAccounts() {
      try {
        var resp = await fetch('/api/settings');
        var data = await resp.json();
        savedAccounts = data.accounts || [];
        renderAccountSelector();
        renderAccountsList();
        if (savedAccounts.length > 0) {
          var def = savedAccounts.find(function(a) { return a.is_default; }) || savedAccounts[0];
          activeAccountId = def.account_id;
          document.getElementById('filter-account').value = activeAccountId;
          loadPrefixes();
        }
      } catch (e) {
        console.error('Failed to load accounts:', e);
      }
    }

    function renderAccountSelector() {
      var sel = document.getElementById('filter-account');
      if (savedAccounts.length === 0) {
        sel.innerHTML = '<option value="">No accounts configured</option>';
        return;
      }
      sel.innerHTML = savedAccounts.map(function(a) {
        var label = a.account_label || a.account_id;
        return '<option value="' + a.account_id + '">' + escHtml(label) + '</option>';
      }).join('');
    }

    function renderAccountsList() {
      var el = document.getElementById('accounts-list');
      if (!el) return;
      if (savedAccounts.length === 0) {
        el.innerHTML = '<p class="text-xs text-cf-gray">No accounts configured. Click "+ Add Account" to get started.</p>';
        return;
      }
      el.innerHTML = '<div class="space-y-2">' + savedAccounts.map(function(a) {
        var tokenBadge = a.api_token
          ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-green-900 text-green-300">Token saved</span>'
          : '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-900 text-red-300">No token</span>';
        var defBadge = a.is_default ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-900 text-orange-300">Default</span>' : '';
        var aid = a.account_id;

        return '<div class="rounded-lg border border-cf-border' + (a.is_default ? ' border-orange-700' : '') + '">' +
            // Header row (clickable to expand)
            '<div class="flex items-center justify-between px-3 py-2.5 cursor-pointer bg-cf-dark rounded-t-lg" onclick="toggleAccountExpand(\\'' + escAttr(aid) + '\\')">' +
              '<div class="flex items-center gap-3">' +
                '<svg id="acct-chev-' + escAttr(aid) + '" class="w-4 h-4 text-cf-gray transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' +
                '<span class="text-sm font-medium" style="color:var(--text-strong)">' + escHtml(a.account_label || 'Untitled') + '</span>' +
                '<span class="text-xs text-cf-gray font-mono">' + aid + '</span>' +
                tokenBadge +
                defBadge +
              '</div>' +
              '<div class="flex gap-2" onclick="event.stopPropagation()">' +
                (a.is_default ? '' : '<button onclick="setDefault(' + a.id + ')" class="text-xs text-cf-gray hover:text-cf-orange">Set Default</button>') +
                '<button onclick="editAccountToken(\\'' + escAttr(aid) + '\\')" class="text-xs text-cf-gray hover:text-cf-orange">Edit</button>' +
                '<button onclick="deleteAccount(' + a.id + ')" class="text-xs text-cf-gray hover:text-red-400">Delete</button>' +
              '</div>' +
            '</div>' +
            // Expandable edit section
            '<div id="acct-expand-' + escAttr(aid) + '" class="hidden border-t border-cf-border p-4">' +
              // API Token
              '<div class="pb-3">' +
                '<label class="block text-xs font-semibold mb-1" style="color:var(--text-strong)">Cloudflare API Token</label>' +
                // Display row
                '<div id="acct-token-display-' + escAttr(aid) + '" class="flex items-center gap-3 p-2.5 rounded-lg border border-cf-border text-xs">' +
                  '<span class="font-semibold" style="color:var(--text-strong)">Cloudflare</span>' +
                  (a.api_token ? '<span class="font-mono text-cf-gray">' + escHtml(a.api_token) + '</span>' : '<span class="badge-invalid">No token set</span>') +
                  '<button onclick="testSavedAccountToken(\\'' + escAttr(aid) + '\\')" class="ml-auto text-blue-400 hover:text-blue-300 text-xs">Validate</button>' +
                  '<button onclick="editAccountToken(\\'' + escAttr(aid) + '\\')" class="text-blue-400 hover:text-blue-300 text-xs ml-1">Edit</button>' +
                  '<button onclick="deleteAccountToken(' + a.id + ',\\'' + escAttr(aid) + '\\')" class="text-red-400 hover:text-red-300 text-xs ml-1">Delete</button>' +
                '</div>' +
                '<div id="acct-token-test-result-' + escAttr(aid) + '" class="flex items-center flex-wrap gap-1 text-xs mt-1"></div>' +
                '<div id="acct-token-msg-' + escAttr(aid) + '" class="mt-1"></div>' +
                // Edit row (hidden)
                '<div id="acct-token-edit-' + escAttr(aid) + '" class="hidden p-3 rounded-lg border border-cf-orange mt-2" style="background:var(--input-bg)">' +
                  '<div class="flex gap-2 items-end flex-wrap">' +
                    '<div class="flex-1"><label class="block text-xs text-cf-gray mb-1">New API Token</label><input id="acct-token-' + escAttr(aid) + '" type="password" placeholder="Enter new token" class="w-full px-3 py-2 rounded-lg border border-cf-border bg-cf-dark text-sm text-white font-mono focus:border-cf-orange focus:outline-none"></div>' +
                    '<button onclick="updateAccountToken(\\'' + escAttr(aid) + '\\')" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600">Save</button>' +
                    '<button onclick="cancelEditAccountToken(\\'' + escAttr(aid) + '\\')" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange">Cancel</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              // API Rate Limit
              '<div class="border-t border-cf-border pt-3 pb-3">' +
                '<label class="block text-xs font-semibold mb-1" style="color:var(--text-strong)">API rate limit <span class="font-normal text-cf-gray">(requests / 5 min &mdash; used to pace the Radar advertisement poller)</span>${infoTip('The default Cloudflare API rate limit is <strong>1200 requests / 5 min</strong>. If you need to increase this limit, reach out to your Cloudflare account team.')}</label>' +
                '<div class="flex gap-2">' +
                  '<input id="acct-rl-' + escAttr(aid) + '" type="number" min="1" value="' + (a.api_rate_limit_5min || 1200) + '" class="w-40 px-3 py-2 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">' +
                  '<button onclick="updateAccountRateLimit(\\'' + escAttr(aid) + '\\')" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Save</button>' +
                '</div>' +
                '<div id="acct-rl-msg-' + escAttr(aid) + '" class="mt-1"></div>' +
              '</div>' +
              // Notifications
              '<div class="border-t border-cf-border pt-3 pb-3">' +
                '<label class="block text-xs font-semibold mb-2" style="color:var(--text-strong)">Notifications <span class="font-normal text-cf-gray">(channels &amp; per-event subscriptions for this account)</span></label>' +
                '<div id="acct-notif-' + escAttr(aid) + '" class="text-xs text-cf-gray">Loading...</div>' +
              '</div>' +
              // RIR API Keys
              '<div class="border-t border-cf-border pt-3 pb-3">' +
                '<label class="block text-xs font-semibold mb-2" style="color:var(--text-strong)">RIR API Keys <span class="font-normal text-cf-gray">(optional &mdash; for automated IRR record creation at ARIN / RIPE)</span></label>' +
                '<div id="acct-rir-' + escAttr(aid) + '" class="text-xs text-cf-gray">Loading...</div>' +
              '</div>' +
              // API Access & Integrations
              '<div class="border-t border-cf-border pt-3">' +
                '<label class="block text-xs font-semibold mb-2" style="color:var(--text-strong)">API Access &amp; Integrations <span class="font-normal text-cf-gray">(read-only Query API keys &amp; inbound Cloudflare webhooks)</span></label>' +
                '<div id="acct-integrations-' + escAttr(aid) + '" class="text-xs text-cf-gray">Loading...</div>' +
              '</div>' +
            '</div>' +
          '</div>';
      }).join('') + '</div>';
    }

    function toggleAccountExpand(accountId) {
      var sec = document.getElementById('acct-expand-' + accountId);
      var chev = document.getElementById('acct-chev-' + accountId);
      if (!sec) return;
      if (sec.classList.contains('hidden')) {
        sec.classList.remove('hidden');
        if (chev) chev.style.transform = 'rotate(90deg)';
        loadAccountRirCredentials(accountId);
        loadAccountNotifications(accountId);
        loadAccountIntegrations(accountId);
      } else {
        sec.classList.add('hidden');
        if (chev) chev.style.transform = '';
      }
    }

    function editAccountToken(accountId) {
      var display = document.getElementById('acct-token-display-' + accountId);
      var edit = document.getElementById('acct-token-edit-' + accountId);
      if (display) display.classList.add('hidden');
      if (edit) edit.classList.remove('hidden');
    }

    function cancelEditAccountToken(accountId) {
      var display = document.getElementById('acct-token-display-' + accountId);
      var edit = document.getElementById('acct-token-edit-' + accountId);
      var input = document.getElementById('acct-token-' + accountId);
      if (input) input.value = '';
      if (edit) edit.classList.add('hidden');
      if (display) display.classList.remove('hidden');
    }

    function deleteAccountToken(id, accountId) {
      showConfirm({ title: 'Delete Cloudflare API Token', message: 'Delete the saved API token for this account?', confirmLabel: 'Delete', danger: true, onConfirm: async function() {
        await fetch('/api/settings/' + id + '/token', { method: 'DELETE' });
        await loadAccounts();
        reexpandAccount(accountId);
        showInlineMsg('acct-token-msg-' + accountId, 'API token deleted.', 'success');
      } });
    }

    async function updateAccountToken(accountId) {
      var msgId = 'acct-token-msg-' + accountId;
      var input = document.getElementById('acct-token-' + accountId);
      var token = input ? input.value.trim() : '';
      if (!token) { showInlineMsg(msgId, 'Enter a new API token.', 'error'); return; }
      // Find the account label
      var acct = savedAccounts.find(function(a) { return a.account_id === accountId; });
      var resp = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, account_label: acct ? acct.account_label : '', api_token: token })
      });
      if (resp.ok) {
        if (input) input.value = '';
        await loadAccounts();
        reexpandAccount(accountId);
        showInlineMsg(msgId, 'API token updated.', 'success');
      } else {
        showInlineMsg(msgId, 'Failed to update token.', 'error');
      }
    }

    // Re-open an account's edit section after loadAccounts() re-renders the list
    function reexpandAccount(accountId) {
      var sec = document.getElementById('acct-expand-' + accountId);
      if (sec && sec.classList.contains('hidden')) toggleAccountExpand(accountId);
    }

    async function updateAccountRateLimit(accountId) {
      var msgId = 'acct-rl-msg-' + accountId;
      var input = document.getElementById('acct-rl-' + accountId);
      var val = input ? parseInt(input.value, 10) : 0;
      if (!val || val < 1) { showInlineMsg(msgId, 'Enter a positive number.', 'error'); return; }
      var acct = savedAccounts.find(function(a) { return a.account_id === accountId; });
      var resp = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, account_label: acct ? acct.account_label : '', api_rate_limit_5min: val })
      });
      if (resp.ok) {
        await loadAccounts();
        reexpandAccount(accountId);
        showInlineMsg(msgId, 'Rate limit updated.', 'success');
      } else { showInlineMsg(msgId, 'Failed to update rate limit.', 'error'); }
    }

    // ─── Per-account API Access & Integrations ────────────────────
    async function loadAccountIntegrations(accountId) {
      var el = document.getElementById('acct-integrations-' + accountId);
      if (!el) return;
      try {
        var qs = '?account_id=' + encodeURIComponent(accountId);
        var results = await Promise.all([
          fetch('/api/integrations/api-keys' + qs).then(function(r){ return r.json(); }),
          fetch('/api/integrations/webhooks' + qs).then(function(r){ return r.json(); }),
          fetch('/api/integrations/logpush' + qs).then(function(r){ return r.json(); }).catch(function(){ return {}; })
        ]);
        renderAccountIntegrations(accountId, results[0].keys || [], results[1].webhooks || [], results[2] || {});
      } catch (e) {
        el.innerHTML = '<p class="text-xs text-red-400">Failed to load integrations.</p>';
      }
    }

    function renderAccountIntegrations(accountId, keys, webhooks, logpush) {
      var el = document.getElementById('acct-integrations-' + accountId);
      if (!el) return;
      var aid = escAttr(accountId);
      var webhookUrl = window.location.origin + '/webhooks/cloudflare';
      var html = '';

      html += '<div id="intg-msg-' + aid + '" class="mb-2"></div>';
      html += '<div id="intg-secret-' + aid + '" class="mb-2"></div>';

      // ── API keys (Query API) ──
      html += '<div class="mb-4">';
      html += '<div class="flex items-center justify-between mb-2">' +
        '<span class="text-xs font-semibold text-cf-gray">Query API keys</span>' +
        '<button onclick="showApiKeyForm(\\'' + aid + '\\')" class="px-2 py-0.5 text-xs font-semibold rounded border border-cf-border text-cf-gray hover:border-cf-orange hover:text-cf-orange">+ Create Key</button>' +
      '</div>';
      html += '<div class="space-y-1 mb-2">';
      if (keys.length === 0) {
        html += '<div class="text-xs text-cf-gray">No API keys yet.</div>';
      } else {
        keys.forEach(function(k) {
          var used = k.last_used_at ? ('last used ' + escHtml(k.last_used_at)) : 'never used';
          html += '<div class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-cf-border text-xs">' +
            '<div class="min-w-0">' +
              '<span style="color:var(--text-strong)" class="font-medium">' + escHtml(k.name) + '</span> ' +
              '<span class="font-mono text-cf-gray">' + escHtml(k.key_prefix) + '&hellip;</span> ' +
              '<span class="text-cf-gray">(' + used + ')</span>' +
            '</div>' +
            '<button onclick="deleteAccountApiKey(' + k.id + ', \\'' + aid + '\\')" class="text-xs text-cf-gray hover:text-red-400">Revoke</button>' +
          '</div>';
        });
      }
      html += '</div>';
      // Hidden create key form
      html += '<div id="intg-key-form-' + aid + '" class="hidden border border-cf-border rounded-lg p-3 space-y-2">';
      html += '<div><label class="block text-xs font-medium text-cf-gray mb-1">Key Name</label>' +
        '<input id="intg-key-name-' + aid + '" type="text" placeholder="Key name (e.g. monitoring)" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none"></div>';
      html += '<div class="flex gap-2 items-center">' +
        '<button onclick="createAccountApiKey(\\'' + aid + '\\')" class="px-3 py-1 bg-cf-orange text-white text-xs font-semibold rounded-lg hover:opacity-90">Create Key</button>' +
        '<button onclick="hideApiKeyForm(\\'' + aid + '\\')" class="px-3 py-1 text-xs text-cf-gray hover:text-white">Cancel</button>' +
      '</div>';
      html += '</div>';
      html += '</div>';

      // ── Inbound webhooks ──
      html += '<div class="mb-4 pt-3 border-t border-cf-border">';
      html += '<div class="flex items-center justify-between mb-2">' +
        '<span class="text-xs font-semibold text-cf-gray">Inbound Cloudflare webhooks</span>' +
        '<button onclick="showWebhookForm(\\'' + aid + '\\')" class="px-2 py-0.5 text-xs font-semibold rounded border border-cf-border text-cf-gray hover:border-cf-orange hover:text-cf-orange">+ Create Secret</button>' +
      '</div>';
      html += '<div class="text-xs text-cf-gray mb-2">Destination URL: <span class="font-mono" style="color:var(--text-strong)">' + escHtml(webhookUrl) + '</span></div>';
      html += '<div class="space-y-1 mb-2">';
      if (webhooks.length === 0) {
        html += '<div class="text-xs text-cf-gray">No webhook secrets yet.</div>';
      } else {
        webhooks.forEach(function(w) {
          var seen = w.last_seen_at ? ('last seen ' + escHtml(w.last_seen_at)) : 'never received';
          html += '<div class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-cf-border text-xs">' +
            '<div class="min-w-0">' +
              '<span style="color:var(--text-strong)" class="font-medium">' + escHtml(w.name) + '</span> ' +
              '<span class="text-cf-gray">(' + seen + ')</span>' +
            '</div>' +
            '<button onclick="deleteAccountWebhook(' + w.id + ', \\'' + aid + '\\')" class="text-xs text-cf-gray hover:text-red-400">Revoke</button>' +
          '</div>';
        });
      }
      html += '</div>';
      // Hidden create webhook form
      html += '<div id="intg-wh-form-' + aid + '" class="hidden border border-cf-border rounded-lg p-3 space-y-2">';
      html += '<div><label class="block text-xs font-medium text-cf-gray mb-1">Webhook Name</label>' +
        '<input id="intg-wh-name-' + aid + '" type="text" placeholder="Webhook name (e.g. network-flow)" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none"></div>';
      html += '<div class="flex gap-2 items-center">' +
        '<button onclick="createAccountWebhook(\\'' + aid + '\\')" class="px-3 py-1 bg-cf-orange text-white text-xs font-semibold rounded-lg hover:opacity-90">Create Secret</button>' +
        '<button onclick="hideWebhookForm(\\'' + aid + '\\')" class="px-3 py-1 text-xs text-cf-gray hover:text-white">Cancel</button>' +
      '</div>';
      html += '</div>';
      html += '</div>';

      // ── Audit log streaming (Logpush) ──
      html += '<div class="pt-3 border-t border-cf-border">';
      html += '<div class="text-xs font-semibold text-cf-gray mb-1">Audit log streaming (Logpush)</div>';
      html += '<div class="text-xs text-cf-gray mb-2">Streams the account\\'s Audit Logs v2 to this tool so the Activity panel loads instantly instead of polling the API. Requires an Enterprise plan and a token with <span class="font-mono">Logs Write</span>.</div>';
      var jobs = (logpush && logpush.jobs) || [];
      if (jobs.length) {
        jobs.forEach(function(j) {
          var state = j.enabled ? 'enabled' : 'disabled';
          var err = j.last_error || j.error_message;
          html += '<div class="px-3 py-2 rounded-lg border border-cf-border mb-2 text-xs">' +
            '<span style="color:var(--text-strong)" class="font-medium">Job #' + escHtml(String(j.id)) + '</span> ' +
            '<span class="text-cf-gray">(' + escHtml(state) + ')</span>' +
            (err ? '<div class="text-red-400 mt-0.5">' + escHtml(String(err)) + '</div>' : '') +
          '</div>';
        });
      } else if (logpush && logpush.error) {
        html += '<div class="text-xs text-red-500 mb-2">Status unavailable: ' + escHtml(logpush.error) + '</div>';
      } else {
        html += '<div class="text-xs text-cf-gray mb-2">No audit-log Logpush job configured yet.</div>';
      }
      html += '<button onclick="enableAccountLogpush(\\'' + aid + '\\')" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Enable audit log streaming</button>';
      html += '</div>';

      el.innerHTML = html;
    }

    function showApiKeyForm(accountId) {
      var f = document.getElementById('intg-key-form-' + accountId);
      if (f) f.classList.remove('hidden');
    }

    function hideApiKeyForm(accountId) {
      var f = document.getElementById('intg-key-form-' + accountId);
      if (f) f.classList.add('hidden');
    }

    function showWebhookForm(accountId) {
      var f = document.getElementById('intg-wh-form-' + accountId);
      if (f) f.classList.remove('hidden');
    }

    function hideWebhookForm(accountId) {
      var f = document.getElementById('intg-wh-form-' + accountId);
      if (f) f.classList.add('hidden');
    }

    // Show a generated secret exactly once (it cannot be retrieved again).
    function showIntegrationSecret(accountId, label, value) {
      var el = document.getElementById('intg-secret-' + accountId);
      if (!el) return;
      el.innerHTML = '<div class="px-3 py-2.5 rounded-lg border border-cf-orange" style="background:rgba(246,130,31,0.08)">' +
        '<div class="text-xs font-semibold mb-1" style="color:var(--text-strong)">' + escHtml(label) + ' &mdash; copy it now, it will not be shown again</div>' +
        '<div class="flex items-center gap-2">' +
          '<code class="flex-1 font-mono text-sm break-all" style="color:var(--text-strong)">' + escHtml(value) + '</code>' +
          '<button onclick="navigator.clipboard && navigator.clipboard.writeText(\\'' + escAttr(value) + '\\')" class="px-3 py-1 text-xs border border-cf-border rounded-lg hover:border-cf-orange hover:text-cf-orange shrink-0">Copy</button>' +
          '<span class="inline-msg-close" onclick="this.parentNode.parentNode.parentNode.innerHTML=\\'\\'" role="button" aria-label="Dismiss">&times;</span>' +
        '</div>' +
      '</div>';
    }

    async function createAccountApiKey(accountId) {
      var input = document.getElementById('intg-key-name-' + accountId);
      var name = input ? input.value.trim() : '';
      var resp = await fetch('/api/integrations/api-keys', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, name: name })
      });
      var d = await resp.json();
      if (resp.ok && d.ok) {
        if (input) input.value = '';
        await loadAccountIntegrations(accountId);
        showIntegrationSecret(accountId, 'API key', d.key);
      } else {
        showInlineMsg('intg-msg-' + accountId, d.error || 'Failed to create key', 'error');
      }
    }

    async function deleteAccountApiKey(id, accountId) {
      showConfirm({ title: 'Revoke API key', message: 'Revoke this API key? Clients using it will stop working immediately.', confirmLabel: 'Revoke', danger: true, onConfirm: async function() {
        await fetch('/api/integrations/api-keys/' + id, { method: 'DELETE' });
        await loadAccountIntegrations(accountId);
        showInlineMsg('intg-msg-' + accountId, 'API key revoked.', 'success');
      } });
    }

    async function createAccountWebhook(accountId) {
      var input = document.getElementById('intg-wh-name-' + accountId);
      var name = input ? input.value.trim() : '';
      var resp = await fetch('/api/integrations/webhooks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, name: name })
      });
      var d = await resp.json();
      if (resp.ok && d.ok) {
        if (input) input.value = '';
        await loadAccountIntegrations(accountId);
        showIntegrationSecret(accountId, 'Webhook secret (paste into cf-webhook-auth / Cloudflare secret field)', d.secret);
      } else {
        showInlineMsg('intg-msg-' + accountId, d.error || 'Failed to create webhook secret', 'error');
      }
    }

    async function deleteAccountWebhook(id, accountId) {
      showConfirm({ title: 'Revoke webhook secret', message: 'Revoke this webhook secret? Cloudflare notifications using it will be rejected.', confirmLabel: 'Revoke', danger: true, onConfirm: async function() {
        await fetch('/api/integrations/webhooks/' + id, { method: 'DELETE' });
        await loadAccountIntegrations(accountId);
        showInlineMsg('intg-msg-' + accountId, 'Webhook secret revoked.', 'success');
      } });
    }

    async function enableAccountLogpush(accountId) {
      showInlineMsg('intg-msg-' + accountId, 'Enabling audit log streaming…', 'success');
      var resp = await fetch('/api/integrations/logpush', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId })
      });
      var d = await resp.json();
      if (resp.ok && d.ok && d.auto) {
        await loadAccountIntegrations(accountId);
        showInlineMsg('intg-msg-' + accountId, 'Logpush job created (#' + escHtml(String(d.job_id)) + '). Audit logs will begin streaming shortly.', 'success');
      } else if (resp.ok && d.ok) {
        // Auto-create failed — surface the error and the manual-setup details.
        await loadAccountIntegrations(accountId);
        showInlineMsg('intg-msg-' + accountId, 'Automatic setup failed: ' + escHtml(d.error || 'unknown error') + '. Create a Logpush job for the Audit Logs v2 dataset in the Cloudflare dashboard using the HTTP destination below.', 'error');
        if (d.destination) showIntegrationSecret(accountId, 'Logpush HTTP destination URL (dataset: audit_logs_v2)', d.destination);
      } else {
        showInlineMsg('intg-msg-' + accountId, d.error || 'Failed to enable audit log streaming', 'error');
      }
    }

    // ─── Per-account Notifications ────────────────────────────────
    async function loadAccountNotifications(accountId) {
      var el = document.getElementById('acct-notif-' + accountId);
      if (!el) return;
      try {
        var qs = '?account_id=' + encodeURIComponent(accountId);
        var results = await Promise.all([
          fetch('/api/notifications/channels' + qs).then(function(r){ return r.json(); }),
          fetch('/api/notifications/subscriptions' + qs).then(function(r){ return r.json(); })
        ]);
        var channels = results[0].channels || [];
        var events = results[1].events || {};
        var subs = results[1].subscriptions || [];
        el.innerHTML = renderNotifConfig(accountId, channels, events, subs);
      } catch (e) {
        el.innerHTML = '<span class="text-red-400">Failed to load notifications</span>';
      }
    }

    function renderNotifConfig(accountId, channels, events, subs) {
      var aid = escAttr(accountId);
      var html = '';

      // Inline status message area
      html += '<div id="notif-msg-' + aid + '" class="mb-2"></div>';

      // Notification channels header + add button
      html += '<div class="flex items-center justify-between mb-2">' +
        '<span class="text-xs font-semibold text-cf-gray">Notification Channels</span>' +
        '<button onclick="showNotifChannelForm(\\'' + aid + '\\')" class="px-2 py-0.5 text-xs font-semibold rounded border border-cf-border text-cf-gray hover:border-cf-orange hover:text-cf-orange">+ Add Channel</button>' +
      '</div>';

      // Existing channels
      html += '<div class="space-y-1 mb-2">';
      if (channels.length === 0) {
        html += '<div class="text-xs text-cf-gray">No channels configured.</div>';
      } else {
        channels.forEach(function(ch) {
          var cfg = ch.config || {};
          var target = cfg.email || cfg.url || cfg.routing_key || '';
          var typeBadge = '<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-900 text-blue-300 uppercase font-semibold">' + escHtml(ch.type) + '</span>';
          html += '<div class="flex items-center gap-3 px-3 py-2 rounded-lg border border-cf-border">' +
            typeBadge +
            '<span class="text-sm font-medium" style="color:var(--text-strong)">' + escHtml(ch.name) + '</span>' +
            '<span class="text-xs text-cf-gray font-mono">' + escHtml(target) + '</span>' +
            (ch.enabled ? '' : '<span class="badge-invalid">disabled</span>') +
            '<button onclick="testNotifChannel(' + ch.id + ',\\'' + aid + '\\')" class="ml-auto text-cf-orange hover:underline text-xs">Test</button>' +
            '<button onclick="deleteNotifChannel(' + ch.id + ',\\'' + aid + '\\')" class="text-xs text-cf-gray hover:text-red-400">Delete</button>' +
          '</div>';
        });
      }
      html += '</div>';

      // Add channel form (hidden by default)
      html += '<div id="notif-form-' + aid + '" class="hidden border border-cf-border rounded-lg p-3 space-y-2 mb-3">';
      html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-2">';
      html += '<div><label class="block text-xs font-medium text-cf-gray mb-1">Type</label>' +
          '<select id="notif-type-' + aid + '" onchange="onNotifTypeChange(\\'' + aid + '\\')" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white">' +
            '<option value="email">Email</option><option value="webhook">Webhook</option><option value="pagerduty">PagerDuty</option>' +
          '</select></div>';
      html += '<div><label class="block text-xs font-medium text-cf-gray mb-1">Name</label><input id="notif-name-' + aid + '" type="text" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white" placeholder="Label"></div>';
      html += '<div id="notif-f1-wrap-' + aid + '"><label class="block text-xs font-medium text-cf-gray mb-1" id="notif-f1-label-' + aid + '">Email address</label><input id="notif-f1-' + aid + '" type="text" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white" placeholder="alerts@example.com"></div>';
      html += '</div>';
      html += '<div id="notif-f2-wrap-' + aid + '" class="hidden"><label class="block text-xs font-medium text-cf-gray mb-1">Token (optional)</label><input id="notif-f2-' + aid + '" type="password" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white" placeholder="Bearer token"></div>';
      html += '<div class="flex gap-2 items-center">' +
        '<button onclick="addNotifChannel(\\'' + aid + '\\')" class="px-3 py-1 bg-cf-orange text-white text-xs font-semibold rounded-lg hover:opacity-90">Save Channel</button>' +
        '<button onclick="hideNotifChannelForm(\\'' + aid + '\\')" class="px-3 py-1 text-xs text-cf-gray hover:text-white">Cancel</button>' +
      '</div>';
      html += '</div>';

      // Subscriptions matrix
      var subMap = {};
      subs.forEach(function(s) { subMap[s.event_type] = s; });
      var configuredCount = subs.filter(function(s) { return s.channel_ids && s.channel_ids.length > 0; }).length;
      var subsCollapsed = configuredCount > 0;
      html += '<div class="flex items-center gap-1 cursor-pointer mb-1" onclick="toggleNotifSubs(\\'' + aid + '\\')">' +
        '<span id="notif-subs-chev-' + aid + '" class="chevron text-cf-gray text-xs' + (subsCollapsed ? '' : ' open') + '">&#9654;</span>' +
        '<span class="text-xs font-semibold text-cf-gray">Event subscriptions</span>' +
        (configuredCount > 0 ? '<span class="text-xs text-cf-gray font-normal ml-1">(' + configuredCount + ' configured)</span>' : '') +
      '</div>';
      html += '<div id="notif-subs-body-' + aid + '"' + (subsCollapsed ? ' class="hidden"' : '') + '>';
      if (channels.length === 0) {
        html += '<div class="text-xs text-cf-gray">Add a channel to subscribe to events.</div>';
      } else {
        html += '<div class="space-y-1">';
        Object.keys(events).forEach(function(evt) {
          var sub = subMap[evt] || { channel_ids: [], enabled: true };
          var chBoxes = channels.map(function(ch) {
            var checked = (sub.channel_ids || []).indexOf(ch.id) !== -1 ? ' checked' : '';
            return '<label class="inline-flex items-center gap-1 mr-2 text-xs">' +
              '<input type="checkbox" data-evt="' + escAttr(evt) + '" data-ch="' + ch.id + '" class="notif-sub-' + aid + '"' + checked + '>' +
              '<span>' + escHtml(ch.name || ch.type) + '</span></label>';
          }).join('');
          html += '<div class="flex items-start gap-2 p-2 rounded-lg border border-cf-border text-xs">' +
            '<span class="font-medium" style="min-width:180px;color:var(--text-strong)">' + escHtml(events[evt]) + '</span>' +
            '<div class="flex flex-wrap">' + chBoxes + '</div>' +
          '</div>';
        });
        html += '</div>';
        html += '<button onclick="saveNotifSubs(\\'' + aid + '\\')" class="mt-2 px-3 py-1 bg-cf-orange text-white text-xs font-semibold rounded-lg hover:opacity-90">Save subscriptions</button>';
      }
      html += '</div>';

      return html;
    }

    function onNotifTypeChange(accountId) {
      var t = document.getElementById('notif-type-' + accountId).value;
      var f1label = document.getElementById('notif-f1-label-' + accountId);
      var f1 = document.getElementById('notif-f1-' + accountId);
      var f2wrap = document.getElementById('notif-f2-wrap-' + accountId);
      if (t === 'email') { f1label.textContent = 'Email address'; f1.placeholder = 'alerts@example.com'; f2wrap.classList.add('hidden'); }
      else if (t === 'webhook') { f1label.textContent = 'Webhook URL'; f1.placeholder = 'https://…'; f2wrap.classList.remove('hidden'); }
      else { f1label.textContent = 'Routing key'; f1.placeholder = 'PagerDuty routing key'; f2wrap.classList.add('hidden'); }
    }

    async function addNotifChannel(accountId) {
      var type = document.getElementById('notif-type-' + accountId).value;
      var name = document.getElementById('notif-name-' + accountId).value.trim();
      var f1 = document.getElementById('notif-f1-' + accountId).value.trim();
      var f2 = document.getElementById('notif-f2-' + accountId).value.trim();
      var config = {};
      if (type === 'email') config.email = f1;
      else if (type === 'webhook') { config.url = f1; if (f2) config.token = f2; }
      else config.routing_key = f1;
      if (!f1) { showInlineMsg('notif-msg-' + accountId, 'Enter the channel target.', 'error'); return; }
      var resp = await fetch('/api/notifications/channels', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, type: type, name: name, config: config })
      });
      if (resp.ok) {
        await loadAccountNotifications(accountId);
        showInlineMsg('notif-msg-' + accountId, 'Channel added.', 'success');
      } else {
        var d = await resp.json();
        showInlineMsg('notif-msg-' + accountId, d.error || 'Failed to add channel', 'error');
      }
    }

    async function deleteNotifChannel(id, accountId) {
      showConfirm({ title: 'Delete Channel', message: 'Delete this channel?', confirmLabel: 'Delete', danger: true, onConfirm: async function() {
        await fetch('/api/notifications/channels/' + id, { method: 'DELETE' });
        await loadAccountNotifications(accountId);
        showInlineMsg('notif-msg-' + accountId, 'Channel deleted.', 'success');
      } });
    }

    async function testNotifChannel(id, accountId) {
      var resp = await fetch('/api/notifications/channels/' + id + '/test', { method: 'POST' });
      var d = await resp.json();
      if (resp.ok) showInlineMsg('notif-msg-' + accountId, 'Test notification sent.', 'success');
      else showInlineMsg('notif-msg-' + accountId, 'Test failed: ' + (d.error || 'unknown'), 'error');
    }

    async function saveNotifSubs(accountId) {
      var boxes = document.querySelectorAll('.notif-sub-' + accountId);
      var byEvent = {};
      boxes.forEach(function(b) {
        var evt = b.getAttribute('data-evt');
        if (!byEvent[evt]) byEvent[evt] = [];
        if (b.checked) byEvent[evt].push(parseInt(b.getAttribute('data-ch'), 10));
      });
      var events = Object.keys(byEvent);
      try {
        for (var i = 0; i < events.length; i++) {
          await fetch('/api/notifications/subscriptions', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_id: accountId, event_type: events[i], channel_ids: byEvent[events[i]], enabled: true })
          });
        }
        showInlineMsg('notif-msg-' + accountId, 'Subscriptions saved.', 'success');
      } catch (e) {
        showInlineMsg('notif-msg-' + accountId, 'Failed to save subscriptions: ' + e, 'error');
      }
    }

    function toggleNotifSubs(accountId) {
      var body = document.getElementById('notif-subs-body-' + accountId);
      var chev = document.getElementById('notif-subs-chev-' + accountId);
      if (!body) return;
      if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        if (chev) chev.classList.add('open');
      } else {
        body.classList.add('hidden');
        if (chev) chev.classList.remove('open');
      }
    }

    function showNotifChannelForm(accountId) {
      var f = document.getElementById('notif-form-' + accountId);
      if (f) f.classList.remove('hidden');
    }

    function hideNotifChannelForm(accountId) {
      var f = document.getElementById('notif-form-' + accountId);
      if (f) f.classList.add('hidden');
    }

    function showRirForm(accountId) {
      var f = document.getElementById('rir-form-' + accountId);
      if (f) f.classList.remove('hidden');
    }

    function hideRirForm(accountId) {
      var f = document.getElementById('rir-form-' + accountId);
      if (f) f.classList.add('hidden');
    }

    async function loadAccountRirCredentials(accountId) {
      var el = document.getElementById('acct-rir-' + accountId);
      if (!el) return;
      try {
        var r = await fetch('/api/rir/credentials?account_id=' + encodeURIComponent(accountId));
        var data = await r.json();
        var creds = data.credentials || [];
        var html = '';
        var aid = escAttr(accountId);

        // Header with + Add Key button
        html += '<div class="flex items-center justify-between mb-2">' +
          '<span class="text-xs font-semibold text-cf-gray">Saved Keys</span>' +
          '<button onclick="showRirForm(\\'' + aid + '\\')" class="px-2 py-0.5 text-xs font-semibold rounded border border-cf-border text-cf-gray hover:border-cf-orange hover:text-cf-orange">+ Add Key</button>' +
        '</div>';

        // Show existing credentials
        if (creds.length > 0) {
          html += '<div class="space-y-1 mb-2">';
          creds.forEach(function(c) {
            var credRowId = 'rir-cred-row-' + c.id;
            html += '<div id="' + credRowId + '">';
            // Display row
            html += '<div id="' + credRowId + '-display" class="flex items-center gap-3 px-3 py-2 rounded-lg border border-cf-border text-xs">';
            html += '<span class="font-semibold" style="color:var(--text-strong)">' + escHtml(c.rir.toUpperCase()) + '</span>';
            html += '<span class="font-mono text-cf-gray">' + escHtml(c.api_key) + '</span>';
            if (c.maintainer) html += '<span class="text-cf-gray">' + escHtml(c.maintainer) + '</span>';
            html += '<button onclick="validateSavedRirCredential(' + c.id + ',\\'' + aid + '\\',\\'' + escAttr(c.rir) + '\\',\\'' + escAttr(c.maintainer || '') + '\\')" class="ml-auto text-blue-400 hover:text-blue-300 text-xs">Validate</button>';
            html += '<button onclick="editRirCredential(' + c.id + ',\\'' + aid + '\\',\\'' + escAttr(c.rir) + '\\',\\'' + escAttr(c.maintainer || '') + '\\')" class="text-blue-400 hover:text-blue-300 text-xs ml-1">Edit</button>';
            html += '<button onclick="deleteRirCredential(' + c.id + ',\\'' + aid + '\\')" class="text-red-400 hover:text-red-300 text-xs ml-1">Delete</button>';
            html += '</div>';
            html += '<div id="rir-cred-validate-result-' + c.id + '" class="flex items-center flex-wrap gap-1 text-xs mt-1 px-2"></div>';
            // Edit row (hidden)
            html += '<div id="' + credRowId + '-edit" class="hidden p-3 rounded-lg border border-cf-orange mt-1" style="background:var(--input-bg)">';
            html += '<div class="flex gap-2 items-end flex-wrap">';
            html += '<div><label class="block text-xs text-cf-gray mb-1">' + escHtml(c.rir.toUpperCase()) + '</label></div>';
            html += '<div><label class="block text-xs text-cf-gray mb-1">API Key</label><input id="rir-edit-key-' + c.id + '" type="password" class="px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white w-40" placeholder="New API key (leave blank to keep)"></div>';
            html += '<div><label class="block text-xs text-cf-gray mb-1">Org ID</label><input id="rir-edit-mnt-' + c.id + '" type="text" value="' + escAttr(c.maintainer || '') + '" class="px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white w-32" placeholder="e.g. DC-403"></div>';
            html += '<button id="rir-edit-validate-' + c.id + '" data-rir="' + escAttr(c.rir) + '" onclick="validateEditRirCredential(' + c.id + ')" class="px-3 py-1.5 border border-blue-500 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500 hover:text-white transition">Validate</button>';
            html += '<button onclick="saveEditRirCredential(' + c.id + ',\\'' + aid + '\\',\\'' + escAttr(c.rir) + '\\')" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600">Save</button>';
            html += '<button onclick="cancelEditRirCredential(' + c.id + ')" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange">Cancel</button>';
            html += '</div>';
            html += '<div id="rir-edit-validate-result-' + c.id + '" class="flex items-center flex-wrap gap-1 text-xs mt-1"></div>';
            html += '</div>';
            html += '</div>';
          });
          html += '</div>';
        } else {
          html += '<div class="text-xs text-cf-gray mb-2">No RIR API keys yet.</div>';
        }

        // Add new credential form (hidden by default)
        html += '<div id="rir-form-' + aid + '" class="hidden border border-cf-border rounded-lg p-3 space-y-2">';
        html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-2">';
        html += '<div><label class="block text-xs font-medium text-cf-gray mb-1">RIR</label><select id="acct-rir-sel-' + aid + '" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white"><option value="arin">ARIN</option><option value="ripe">RIPE</option></select></div>';
        html += '<div><label class="block text-xs font-medium text-cf-gray mb-1">API Key</label><input id="acct-rir-key-' + aid + '" type="password" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white" placeholder="API key"></div>';
        html += '<div><label class="block text-xs font-medium text-cf-gray mb-1">Org ID</label><input id="acct-rir-mnt-' + aid + '" type="text" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white" placeholder="e.g. DC-403"></div>';
        html += '</div>';
        html += '<div class="flex gap-2 items-center">';
        html += '<button onclick="validateRirCredentialInput(\\'' + aid + '\\')" class="px-3 py-1 border border-blue-500 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500 hover:text-white transition">Validate</button>';
        html += '<button onclick="saveAccountRirCredential(\\'' + aid + '\\')" class="px-3 py-1 bg-cf-orange text-white text-xs font-semibold rounded-lg hover:opacity-90">Save</button>';
        html += '<button onclick="hideRirForm(\\'' + aid + '\\')" class="px-3 py-1 text-xs text-cf-gray hover:text-white">Cancel</button>';
        html += '</div>';
        html += '<div id="acct-rir-validate-result-' + aid + '" class="flex items-center flex-wrap gap-1 text-xs mt-1"></div>';
        html += '</div>';

        el.innerHTML = html;
      } catch (e) {
        el.innerHTML = '<span class="text-xs text-red-400">Failed to load RIR API keys</span>';
      }
    }

    async function saveAccountRirCredential(accountId) {
      var rir = document.getElementById('acct-rir-sel-' + accountId).value;
      var apiKey = document.getElementById('acct-rir-key-' + accountId).value.trim();
      var maintainer = document.getElementById('acct-rir-mnt-' + accountId).value.trim();
      if (!apiKey) { showInlineMsg('acct-rir-validate-result-' + accountId, 'API key is required.', 'error'); return; }
      var r = await fetch('/api/rir/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, rir: rir, api_key: apiKey, maintainer: maintainer })
      });
      var data = await r.json();
      if (data.ok) {
        await loadAccountRirCredentials(accountId);
        showInlineMsg('acct-rir-validate-result-' + accountId, 'API key saved.', 'success');
      } else {
        showInlineMsg('acct-rir-validate-result-' + accountId, data.error || 'Failed to save API key', 'error');
      }
    }

    async function deleteRirCredential(id, accountId) {
      showConfirm({ title: 'Delete RIR API Key', message: 'Delete this RIR API key?', confirmLabel: 'Delete', danger: true, onConfirm: async function() {
        await fetch('/api/rir/credentials/' + id, { method: 'DELETE' });
        await loadAccountRirCredentials(accountId);
        showInlineMsg('acct-rir-validate-result-' + accountId, 'API key deleted.', 'success');
      } });
    }

    function editRirCredential(id, accountId, rir, maintainer) {
      var display = document.getElementById('rir-cred-row-' + id + '-display');
      var edit = document.getElementById('rir-cred-row-' + id + '-edit');
      if (display) display.classList.add('hidden');
      if (edit) edit.classList.remove('hidden');
    }

    function cancelEditRirCredential(id) {
      var display = document.getElementById('rir-cred-row-' + id + '-display');
      var edit = document.getElementById('rir-cred-row-' + id + '-edit');
      if (edit) edit.classList.add('hidden');
      if (display) display.classList.remove('hidden');
    }

    async function saveEditRirCredential(id, accountId, rir) {
      var apiKey = document.getElementById('rir-edit-key-' + id).value.trim();
      var maintainer = document.getElementById('rir-edit-mnt-' + id).value.trim();
      var body = { maintainer: maintainer };
      if (apiKey) body.api_key = apiKey;
      var r = await fetch('/api/rir/credentials/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var data = await r.json();
      if (data.ok) {
        await loadAccountRirCredentials(accountId);
        showInlineMsg('acct-rir-validate-result-' + accountId, 'API key updated.', 'success');
      } else {
        showInlineMsg('rir-edit-validate-result-' + id, data.error || 'Failed to update API key', 'error');
      }
    }

    // Render a RIR validation result as badge pills (matches the CF token style).
    function renderRirValidationBadges(el, data) {
      if (!el) return;
      if (data.valid) {
        var html = '<span class="badge-valid">&#10003; Valid</span>';
        if (data.orgName) html += '<span class="badge-unknown">' + escHtml(data.orgName) + '</span>';
        if (data.adminC) html += '<span class="badge-unknown">Admin: ' + escHtml(data.adminC) + '</span>';
        if (data.techC) html += '<span class="badge-unknown">Tech: ' + escHtml(data.techC) + '</span>';
        if (data.apiKeyValid === true) html += '<span class="badge-valid">API key OK</span>';
        else if (data.apiKeyValid === false) html += '<span class="badge-invalid">API key rejected</span>';
        el.innerHTML = html;
      } else {
        el.innerHTML = '<span class="badge-invalid">&#10007; ' + escHtml(data.error || 'Validation failed') + '</span>';
      }
    }

    async function validateRirCredentialInput(accountId) {
      var rir = document.getElementById('acct-rir-sel-' + accountId).value;
      var apiKey = document.getElementById('acct-rir-key-' + accountId).value.trim();
      var maintainer = document.getElementById('acct-rir-mnt-' + accountId).value.trim();
      var resultEl = document.getElementById('acct-rir-validate-result-' + accountId);
      if (!resultEl) return;
      if (!maintainer && rir === 'arin') { resultEl.innerHTML = '<span class="text-red-400">Org ID is required for ARIN.</span>'; return; }
      if (!maintainer && rir === 'ripe') { resultEl.innerHTML = '<span class="text-red-400">Maintainer is required for RIPE.</span>'; return; }
      resultEl.innerHTML = '<span class="animate-pulse text-cf-gray">Validating...</span>';
      try {
        var body = { rir: rir, maintainer: maintainer };
        if (apiKey) body.api_key = apiKey;
        var r = await fetch('/api/rir/credentials/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        var data = await r.json();
        renderRirValidationBadges(resultEl, data);
      } catch (e) {
        resultEl.innerHTML = '<span class="badge-invalid">Validation request failed: ' + escHtml(String(e)) + '</span>';
      }
    }

    async function validateEditRirCredential(id) {
      var apiKey = document.getElementById('rir-edit-key-' + id).value.trim();
      var maintainer = document.getElementById('rir-edit-mnt-' + id).value.trim();
      var rir = document.getElementById('rir-edit-validate-' + id).getAttribute('data-rir');
      var resultEl = document.getElementById('rir-edit-validate-result-' + id);
      if (!resultEl) return;
      resultEl.innerHTML = '<span class="animate-pulse text-cf-gray">Validating...</span>';
      try {
        var body = { rir: rir, maintainer: maintainer };
        if (apiKey) body.api_key = apiKey;
        var r = await fetch('/api/rir/credentials/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        var data = await r.json();
        renderRirValidationBadges(resultEl, data);
      } catch (e) {
        resultEl.innerHTML = '<span class="badge-invalid">Validation request failed</span>';
      }
    }

    async function validateSavedRirCredential(id, accountId, rir, maintainer) {
      var resultEl = document.getElementById('rir-cred-validate-result-' + id);
      if (!resultEl) return;
      resultEl.innerHTML = '<span class="animate-pulse text-cf-gray">Validating...</span>';
      try {
        var r = await fetch('/api/rir/credentials/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rir: rir, account_id: accountId, maintainer: maintainer })
        });
        var data = await r.json();
        renderRirValidationBadges(resultEl, data);
      } catch (e) {
        resultEl.innerHTML = '<span class="badge-invalid">Validation request failed</span>';
      }
    }

    async function testNewAccountToken() {
      var token = document.getElementById('set-api-token').value.trim();
      var accountId = document.getElementById('set-account-id').value.trim();
      if (!token || !accountId) { showInlineMsg('set-account-msg', 'Account ID and API Token are required.', 'error'); return; }
      clearInlineMsg('set-account-msg');
      var el = document.getElementById('test-token-result');
      el.innerHTML = '<div class="spinner" style="width:12px;height:12px"></div>';
      try {
        var resp = await fetch('/api/test-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_id: accountId, api_token: token })
        });
        var data = await resp.json();
        if (data.results) {
          el.innerHTML = data.results.map(function(r) {
            var cls = r.status === 'ok' ? 'badge-valid' : 'badge-invalid';
            var icon = r.status === 'ok' ? '&#10003;' : '&#10007;';
            return '<span class="' + cls + ' mr-1">' + icon + ' ' + r.permission + '</span>';
          }).join('');
        }
      } catch (e) {
        el.innerHTML = '<span class="badge-invalid">Error</span>';
      }
    }

    async function testSavedAccountToken(accountId) {
      var el = document.getElementById('acct-token-test-result-' + accountId);
      if (!el) return;
      el.innerHTML = '<div class="spinner" style="width:12px;height:12px"></div>';
      try {
        var resp = await fetch('/api/test-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_id: accountId })
        });
        var data = await resp.json();
        if (data.results) {
          el.innerHTML = data.results.map(function(r) {
            var cls = r.status === 'ok' ? 'badge-valid' : 'badge-invalid';
            var icon = r.status === 'ok' ? '&#10003;' : '&#10007;';
            return '<span class="' + cls + ' mr-1">' + icon + ' ' + r.permission + '</span>';
          }).join('');
        } else {
          el.innerHTML = '<span class="badge-invalid">' + escHtml(data.error || 'Test failed') + '</span>';
        }
      } catch (e) {
        el.innerHTML = '<span class="badge-invalid">Error</span>';
      }
    }

    async function saveAccount() {
      var label = document.getElementById('set-label').value.trim();
      var accountId = document.getElementById('set-account-id').value.trim();
      var apiToken = document.getElementById('set-api-token').value.trim();
      var rateLimit = parseInt(document.getElementById('set-rate-limit').value, 10) || 1200;
      if (!accountId) { showInlineMsg('set-account-msg', 'Account ID is required.', 'error'); return; }
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_label: label, account_id: accountId, api_token: apiToken || undefined, api_rate_limit_5min: rateLimit })
        });
        await loadAccounts();
        hideAccountForm();
      } catch (e) {
        showInlineMsg('set-account-msg', 'Failed to save account: ' + e, 'error');
      }
    }

    async function deleteAccount(id) {
      showConfirm({ title: 'Delete Account', message: 'Delete this account and all its tokens?', confirmLabel: 'Delete', danger: true, onConfirm: async function() {
        await fetch('/api/settings/' + id, { method: 'DELETE' });
        await loadAccounts();
      } });
    }

    async function setDefault(id) {
      await fetch('/api/settings/' + id + '/default', { method: 'PUT' });
      loadAccounts();
    }

    function onAccountChange() {
      activeAccountId = document.getElementById('filter-account').value;
      loadPrefixes();
      // Audit-log entries are account-scoped; reload if the panel is open.
      if (activityLogExpanded) loadActivityLog();
    }

    // ─── Prefixes ─────────────────────────────────────────────────
    async function loadPrefixes() {
      if (!activeAccountId) return;
      currentPage = 1;
      var tbody = document.getElementById('prefix-table-body');
      tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-12 text-center text-cf-gray"><div class="spinner"></div><span class="ml-2">Loading prefixes...</span></td></tr>';
      expandedRows = {};
      childData = {};
      selectedPrefixes.clear();
      updateBulkBar();
      var selectAllCb = document.getElementById('select-all-checkbox');
      if (selectAllCb) { selectAllCb.checked = false; selectAllCb.indeterminate = false; }
      try {
        var prefixResp = fetch('/api/prefixes?account_id=' + activeAccountId);
        var statsResp = fetch('/api/prefixes/stats?account_id=' + activeAccountId);
        var results = await Promise.all([prefixResp, statsResp]);
        var data = await results[0].json();
        if (data.error) {
          tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-red-400">' + escHtml(data.error) + '</td></tr>';
          return;
        }
        allPrefixes = data.prefixes || [];
        try {
          var statsData = await results[1].json();
          prefixStats = statsData.stats || null;
          if (prefixStats && prefixStats.per_prefix) {
            allPrefixes.forEach(function(p) {
              var pp = prefixStats.per_prefix[p.id];
              if (pp) {
                p._has_advertised_child = pp.has_advertised_child;
                p._has_withdrawn_child = pp.has_withdrawn_child;
              }
            });
          }
        } catch (_e) {
          prefixStats = null;
        }
        updateStats();
        updateTagFilter();
        applyFilters();
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-red-400">Failed to load: ' + escHtml(String(e)) + '</td></tr>';
      }
    }

    function updateStats() {
      var total = allPrefixes.length;
      var ipv6Count = allPrefixes.filter(function(p) { return p.cidr && p.cidr.indexOf(':') !== -1; }).length;
      var ipv4Count = total - ipv6Count;
      var famEl = document.getElementById('stat-family');
      if (famEl) {
        famEl.innerHTML = '<span class="text-blue-400">' + ipv4Count + '</span> / <span class="text-purple-400">' + ipv6Count + '</span>';
      }
      var famSub = document.getElementById('stat-family-sub');
      if (famSub) famSub.textContent = 'IPv4 / IPv6';
      if (prefixStats) {
        var s = prefixStats;
        document.getElementById('stat-total').textContent = s.parent.total + s.bgp.total;
        var totalSub = s.parent.total + ' Parent / ' + s.bgp.total + ' Child';
        if (s.parent.pending > 0) totalSub += ' / ' + s.parent.pending + ' Pending';
        document.getElementById('stat-total-sub').textContent = totalSub;
        document.getElementById('stat-advertised').textContent = s.parent.advertised + s.bgp.advertised;
        var advSub = s.parent.advertised + ' Parent / ' + s.bgp.advertised + ' Child';
        if (s.parent.partial > 0) advSub += ' / ' + s.parent.partial + ' Partial';
        document.getElementById('stat-advertised-sub').textContent = advSub;
        document.getElementById('stat-withdrawn').textContent = s.parent.withdrawn + s.bgp.withdrawn;
        document.getElementById('stat-withdrawn-sub').textContent = s.parent.withdrawn + ' Parent / ' + s.bgp.withdrawn + ' Child';
        document.getElementById('stat-locked').textContent = s.parent.locked;
        document.getElementById('stat-locked-sub').textContent = 'Parent only';
        document.getElementById('stat-irr').textContent = s.irr.valid;
        document.getElementById('stat-irr-sub').textContent = s.irr.valid + ' Valid / ' + s.irr.invalid + ' Issues';
        document.getElementById('stat-irr').className = 'text-xl font-bold ' + (s.irr.invalid > 0 ? 'text-yellow-400' : 'text-green-400');
        document.getElementById('stat-rpki').textContent = s.rpki.valid;
        document.getElementById('stat-rpki-sub').textContent = s.rpki.valid + ' Valid / ' + s.rpki.invalid + ' Issues';
        document.getElementById('stat-rpki').className = 'text-xl font-bold ' + (s.rpki.invalid > 0 ? 'text-yellow-400' : 'text-green-400');
      } else {
        var advertised = allPrefixes.filter(function(p) { return p._has_advertised_child === true; }).length;
        var withdrawn = allPrefixes.filter(function(p) { return p._has_withdrawn_child === true && p._has_advertised_child !== true; }).length;
        var locked = allPrefixes.filter(function(p) { return p.on_demand_locked === true; }).length;
        var pendingCount = allPrefixes.filter(function(p) { return p.approved === 'P'; }).length;
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-total-sub').textContent = pendingCount > 0 ? pendingCount + ' Pending Approval' : '';
        document.getElementById('stat-advertised').textContent = advertised;
        document.getElementById('stat-advertised-sub').textContent = '';
        document.getElementById('stat-withdrawn').textContent = withdrawn;
        document.getElementById('stat-withdrawn-sub').textContent = '';
        document.getElementById('stat-locked').textContent = locked;
        document.getElementById('stat-locked-sub').textContent = '';
        var irrValid = allPrefixes.filter(function(p) { return (p.irr_validation_state || '').toLowerCase() === 'valid'; }).length;
        var irrInvalid = allPrefixes.filter(function(p) { var s = (p.irr_validation_state || '').toLowerCase(); return s === 'invalid' || s === 'mismatch_asn' || s === 'missing'; }).length;
        document.getElementById('stat-irr').textContent = irrValid;
        document.getElementById('stat-irr-sub').textContent = irrValid + ' Valid / ' + irrInvalid + ' Issues';
        document.getElementById('stat-irr').className = 'text-xl font-bold ' + (irrInvalid > 0 ? 'text-yellow-400' : 'text-green-400');
        var rpkiValid = allPrefixes.filter(function(p) { return (p.rpki_validation_state || '').toLowerCase() === 'valid'; }).length;
        var rpkiInvalid = allPrefixes.filter(function(p) { var s = (p.rpki_validation_state || '').toLowerCase(); return s === 'invalid' || s === 'mismatch_asn' || s === 'missing'; }).length;
        document.getElementById('stat-rpki').textContent = rpkiValid;
        document.getElementById('stat-rpki-sub').textContent = rpkiValid + ' Valid / ' + rpkiInvalid + ' Issues';
        document.getElementById('stat-rpki').className = 'text-xl font-bold ' + (rpkiInvalid > 0 ? 'text-yellow-400' : 'text-green-400');
      }
      document.getElementById('stats-row').classList.toggle('hidden', total === 0);
    }

    function extractTagsRaw(desc) {
      if (!desc) return [];
      var matches = desc.match(/(?:^|\s)#([a-zA-Z0-9_-]+)/g);
      if (!matches) return [];
      return matches.map(function(m) { return m.trim().slice(1); });
    }

    function updateTagFilter() {
      var sel = document.getElementById('filter-tag');
      if (!sel) return;
      var currentVal = sel.value;
      var tagDisplay = {};
      allPrefixes.forEach(function(p) {
        var raw = extractTagsRaw(p.description);
        raw.forEach(function(t) {
          var key = t.toLowerCase();
          if (!tagDisplay[key]) tagDisplay[key] = t;
        });
      });
      var keys = Object.keys(tagDisplay).sort();
      var html = '<option value="all">All</option>';
      keys.forEach(function(k) {
        html += '<option value="' + escAttr(k) + '">#' + escHtml(tagDisplay[k]) + '</option>';
      });
      sel.innerHTML = html;
      if (currentVal && tagDisplay[currentVal]) {
        sel.value = currentVal;
      }
    }

    function applyFilters() {
      currentPage = 1;
      var statusFilter = document.getElementById('filter-status').value;
      var prefixFilter = document.getElementById('filter-prefix').value.trim().toLowerCase();
      var asnFilter = document.getElementById('filter-asn').value.trim();
      var tagFilter = document.getElementById('filter-tag').value;
      var familyFilter = document.getElementById('filter-family').value;

      filteredPrefixes = allPrefixes.filter(function(p) {
        if (statusFilter === 'pending' && p.approved !== 'P') return false;
        if (statusFilter === 'advertised' && !p._has_advertised_child) return false;
        if (statusFilter === 'withdrawn' && !p._has_withdrawn_child) return false;
        if (statusFilter === 'locked' && !p.on_demand_locked) return false;
        if (statusFilter === 'unlocked' && p.on_demand_locked) return false;
        if (prefixFilter && (!p.cidr || p.cidr.toLowerCase().indexOf(prefixFilter) === -1)) return false;
        if (asnFilter && p.asn !== null && String(p.asn).indexOf(asnFilter) === -1) return false;
        if (asnFilter && p.asn === null) return false;
        if (tagFilter !== 'all' && extractTags(p.description).indexOf(tagFilter) === -1) return false;
        var isV6 = p.cidr && p.cidr.indexOf(':') !== -1;
        if (familyFilter === 'ipv4' && isV6) return false;
        if (familyFilter === 'ipv6' && !isV6) return false;
        return true;
      });

      renderPrefixTable();
    }

    function resetFilters() {
      document.getElementById('filter-status').value = 'all';
      document.getElementById('filter-prefix').value = '';
      document.getElementById('filter-family').value = 'all';
      document.getElementById('filter-asn').value = '';
      document.getElementById('filter-tag').value = 'all';
      applyFilters();
    }

    function renderPrefixTable() {
      var tbody = document.getElementById('prefix-table-body');
      if (filteredPrefixes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-cf-gray">No prefixes match the current filters</td></tr>';
        renderPaginationControls();
        return;
      }

      var totalPages = Math.ceil(filteredPrefixes.length / pageSize);
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      var startIdx = (currentPage - 1) * pageSize;
      var endIdx = Math.min(startIdx + pageSize, filteredPrefixes.length);
      var pageItems = filteredPrefixes.slice(startIdx, endIdx);

      var html = '';
      for (var i = 0; i < pageItems.length; i++) {
        var p = pageItems[i];
        var isExpanded = expandedRows[p.id] || false;
        html += renderPrefixRow(p, isExpanded);
        if (isExpanded && childData[p.id]) {
          html += renderChildRows(p.id, childData[p.id]);
        }
      }
      tbody.innerHTML = html;
      renderPaginationControls();
    }

    function renderPaginationControls() {
      var container = document.getElementById('pagination-controls');
      if (!container) return;
      if (filteredPrefixes.length <= pageSize) {
        container.classList.add('hidden');
        return;
      }
      container.classList.remove('hidden');
      var totalPages = Math.ceil(filteredPrefixes.length / pageSize);
      var startIdx = (currentPage - 1) * pageSize + 1;
      var endIdx = Math.min(currentPage * pageSize, filteredPrefixes.length);

      var html = '<span class="text-xs text-cf-gray">Showing ' + startIdx + '–' + endIdx + ' of ' + filteredPrefixes.length + ' prefixes</span>';
      html += '<div class="flex items-center gap-1">';

      // Previous button
      html += '<button onclick="goToPage(' + (currentPage - 1) + ')"' + (currentPage === 1 ? ' disabled' : '') + ' class="px-2 py-1 text-xs rounded border border-cf-border ' + (currentPage === 1 ? 'text-cf-gray opacity-40 cursor-not-allowed' : 'text-white hover:border-cf-orange hover:text-cf-orange') + ' transition">' +
        '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>';

      // Page numbers with ellipsis
      var pages = [];
      if (totalPages <= 7) {
        for (var i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        var rangeStart = Math.max(2, currentPage - 1);
        var rangeEnd = Math.min(totalPages - 1, currentPage + 1);
        for (var i = rangeStart; i <= rangeEnd; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
      }

      for (var i = 0; i < pages.length; i++) {
        var pg = pages[i];
        if (pg === '...') {
          html += '<span class="px-1 text-xs text-cf-gray">…</span>';
        } else if (pg === currentPage) {
          html += '<button class="w-7 h-7 text-xs rounded bg-cf-orange text-white font-medium">' + pg + '</button>';
        } else {
          html += '<button onclick="goToPage(' + pg + ')" class="w-7 h-7 text-xs rounded border border-cf-border text-cf-gray hover:border-cf-orange hover:text-cf-orange transition">' + pg + '</button>';
        }
      }

      // Next button
      html += '<button onclick="goToPage(' + (currentPage + 1) + ')"' + (currentPage === totalPages ? ' disabled' : '') + ' class="px-2 py-1 text-xs rounded border border-cf-border ' + (currentPage === totalPages ? 'text-cf-gray opacity-40 cursor-not-allowed' : 'text-white hover:border-cf-orange hover:text-cf-orange') + ' transition">' +
        '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>';

      html += '</div>';
      container.innerHTML = html;
    }

    function goToPage(page) {
      var totalPages = Math.ceil(filteredPrefixes.length / pageSize);
      if (page < 1 || page > totalPages) return;
      currentPage = page;
      renderPrefixTable();
      var panel = document.getElementById('prefix-table-body');
      if (panel) {
        var el = panel.closest('.panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Check if a prefix has delegations (only known after first expansion)
    function hasDelegations(prefixId) {
      var cd = childData[prefixId];
      return cd && cd.delegations && cd.delegations.length > 0;
    }

    // Check if a BGP child prefix has a matching delegation
    function bgpHasDelegation(prefixId, bgpCidr) {
      var cd = childData[prefixId];
      if (!cd || !cd.delegations || cd.delegations.length === 0) return false;
      var bgpParsed = parseCIDR(bgpCidr);
      if (!bgpParsed) return false;
      for (var i = 0; i < cd.delegations.length; i++) {
        var delParsed = parseCIDR(cd.delegations[i].cidr);
        if (!delParsed) continue;
        if (cidrOverlaps(bgpParsed, delParsed)) return true;
      }
      return false;
    }

    // Check if the parent prefix's address space is fully covered by child BGP sub-prefixes
    function isChildPrefixSpaceFull(prefixId, parentCidr) {
      var cd = childData[prefixId];
      if (!cd || !cd.bgp_prefixes || cd.bgp_prefixes.length === 0) return false;
      var parentParsed = parseCIDR(parentCidr);
      if (!parentParsed) return false;
      var totalBits = parentParsed.v6 ? 128 : 32;
      var parentSize = BigInt(1) << BigInt(totalBits - parentParsed.maskLen);
      var usedSize = BigInt(0);
      for (var i = 0; i < cd.bgp_prefixes.length; i++) {
        var bp = parseCIDR(cd.bgp_prefixes[i].cidr);
        if (bp && bp.maskLen > parentParsed.maskLen) {
          usedSize += BigInt(1) << BigInt(totalBits - bp.maskLen);
        }
      }
      return usedSize >= parentSize;
    }

    function renderPrefixRow(p, isExpanded) {
      var chevClass = isExpanded ? 'chevron open' : 'chevron';
      var lockIcon = p.on_demand_locked ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg><span class="info-bubble" style="width:220px">This prefix is locked. The advertisement state cannot be modified. To unlock, contact your Cloudflare account team.</span></span>' : '';
      var delegationIcon = hasDelegations(p.id) ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg><span class="info-bubble" style="width:220px">This prefix has ' + childData[p.id].delegations.length + ' delegation(s) to other accounts.</span></span>' : '';
      var statusBadge = statusBadgeHtml(p);
      var irrBadge = validationBadge(p.irr_validation_state, 'irr');
      var rpkiBadge = validationBadge(p.rpki_validation_state, 'rpki', p.cidr);
      var isChecked = selectedPrefixes.has(p.id);
      var canBulkToggle = canToggleAdvertisement(p);

      // Parent-level toggle button — shown only for active on-demand prefixes.
      // Locked prefixes still render the toggle (disabled) so the lock reason is visible,
      // but pending/unknown (inactive) prefixes get no toggle at all.
      // Parent advertisement status is derived from BGP sub-prefixes (the
      // parent-level advertised field is deprecated). The toggle acts on all
      // BGP routes under the prefix; a partial prefix is treated as advertised.
      var parentToggleHtml = '';
      var advStatus = parentAdvStatus(p);
      if (p.on_demand_enabled && (advStatus === 'advertised' || advStatus === 'withdrawn' || advStatus === 'partial')) {
        var isAdv = advStatus === 'advertised' || advStatus === 'partial';
        var newState = isAdv ? 'false' : 'true';
        var toggleTip = p.on_demand_locked
          ? 'This prefix is locked and cannot be advertised. Contact your Cloudflare account team to unlock.'
          : advStatus === 'partial'
            ? 'Partially advertised. Click to withdraw all BGP routes under this prefix.'
            : isAdv
              ? 'Currently advertised. Click to withdraw this prefix and stop announcing it via BGP to the Internet.'
              : 'Currently withdrawn. Click to advertise this prefix and begin announcing it via BGP to the Internet.';
        parentToggleHtml = '<span class="validation-hover" onclick="event.stopPropagation()"><button class="toggle-btn' + (isAdv ? ' active' : '') + '"' +
          (p.on_demand_locked ? ' disabled' : ' onclick="event.stopPropagation();confirmParentToggle(\\'' + escAttr(p.id) + '\\',' + newState + ',\\'' + escAttr(p.cidr) + '\\')"') +
          '><span class="toggle-knob"></span></button><span class="validation-tip">' + toggleTip + '</span></span>';
      }

      // Description with inline edit
      var descHtml = '<span id="desc-display-' + escAttr(p.id) + '">' +
        '<span class="desc-text">' + renderDescriptionWithTags(p.description) + '</span>' +
        '<button onclick="event.stopPropagation();startEditDescription(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.description || '') + '\\')" class="text-cf-gray hover:text-cf-orange ml-1 inline-flex align-middle" title="Edit description"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>' +
        '</span>' +
        '<span id="desc-edit-' + escAttr(p.id) + '" class="hidden">' +
          '<input type="text" value="' + escAttr(p.description || '') + '" placeholder="e.g. My prefix #production #us-east" class="px-1.5 py-0.5 rounded border border-cf-border bg-cf-dark text-xs text-white focus:border-cf-orange focus:outline-none w-40" onclick="event.stopPropagation()" onkeydown="if(event.key===\\'Enter\\'){event.stopPropagation();saveDescription(\\'' + escAttr(p.id) + '\\',this.value)}else if(event.key===\\'Escape\\'){cancelEditDescription(\\'' + escAttr(p.id) + '\\')}" onblur="saveDescription(\\'' + escAttr(p.id) + '\\',this.value)">' +
          '<span id="desc-spinner-' + escAttr(p.id) + '" class="hidden ml-1"><span class="spinner" style="width:12px;height:12px"></span></span>' +
        '</span>';

      return '<tr class="prefix-row border-b border-cf-border" onclick="toggleRow(\\'' + p.id + '\\')">' +
        '<td class="px-2 py-2.5" onclick="event.stopPropagation()"><input type="checkbox" class="prefix-checkbox" value="' + escAttr(p.id) + '" ' + (isChecked && canBulkToggle ? 'checked' : '') + (canBulkToggle ? '' : ' disabled title="Cannot advertise/withdraw: ' + escAttr(toggleDisabledReason(p)) + '"') + ' onchange="updateBulkSelection()" style="cursor:' + (canBulkToggle ? 'pointer' : 'not-allowed') + ';accent-color:#F6821F' + (canBulkToggle ? '' : ';opacity:0.4') + '"></td>' +
        '<td class="px-3 py-2.5"><span class="' + chevClass + '" style="font-size:16px">&#9656;</span></td>' +
        '<td class="px-2 py-2.5">' + lockIcon + delegationIcon + '</td>' +
        '<td class="px-3 py-2.5 font-mono font-medium" style="color:var(--text-strong)"><span class="cidr-hover" onmouseenter="showRdap(\\'' + escAttr(p.cidr) + '\\',this)">' + escHtml(p.cidr) + '<span class="rdap-tip"></span></span></td>' +
        '<td class="px-3 py-2.5 text-cf-gray">' + (p.asn != null ? p.asn : '—') + '</td>' +
        '<td class="px-3 py-2.5">' + statusBadge + '</td>' +
        '<td class="px-3 py-2.5">' + irrBadge + '</td>' +
        '<td class="px-3 py-2.5">' + rpkiBadge + '</td>' +
        '<td class="px-3 py-2.5 text-cf-gray max-w-[200px] truncate">' + descHtml + '</td>' +
        '<td class="px-3 py-2.5 flex gap-1 items-center">' +
          parentToggleHtml +
          '<button onclick="event.stopPropagation();revalidatePrefix(\\'' + escAttr(p.id) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Re-validate (RPKI/IRR)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>' +
          '<button onclick="event.stopPropagation();openLgModal(\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Looking Glass"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>' +
          '<button onclick="event.stopPropagation();openBindingModal(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Add Service Binding"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></button>' +
          (!isChildPrefixSpaceFull(p.id, p.cidr) && !p.on_demand_locked ? '<button onclick="event.stopPropagation();openChildPrefixModal(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Add Child Prefix"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16M14 12h2m2 0h2m-2-2v4"/></svg></button>' : '') +
          (!p.on_demand_locked ? '<button onclick="event.stopPropagation();openDelegationModal(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Delegate Prefix"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></button>' : '') +
          '<button onclick="event.stopPropagation();confirmDeletePrefix(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-red-400" title="Delete Prefix (unapproved prefixes only)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' +
        '</td>' +
      '</tr>';
    }

    function renderChildRows(prefixId, data) {
      var html = '';
      // Service bindings on parent prefix
      if (data.bindings && data.bindings.length > 0) {
        for (var i = 0; i < data.bindings.length; i++) {
          var b = data.bindings[i];
          html += '<tr class="child-row border-b border-cf-border">' +
            '<td class="px-2"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-2"></td>' +
            '<td class="px-3 pl-8 font-mono text-cf-gray"><span class="text-purple-400 mr-1">&#9500;&#9472;</span> <span class="badge-service">' + escHtml(b.service_name) + '</span> <span class="text-cf-gray ml-1">' + escHtml(b.cidr) + '</span></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"><span class="badge-' + (b.provisioning && b.provisioning.state === 'active' ? 'valid' : 'pending') + '">' + escHtml(b.provisioning ? (b.provisioning.state.charAt(0).toUpperCase() + b.provisioning.state.slice(1)) : 'Unknown') + '</span></td>' +
            '<td class="px-3"></td><td class="px-3"></td><td class="px-3"></td>' +
            '<td class="px-3"><button onclick="event.stopPropagation();confirmDeleteBinding(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(b.id) + '\\',\\'' + escAttr(b.service_name) + '\\',\\'' + escAttr(b.cidr) + '\\')" class="text-cf-gray hover:text-red-400" title="Delete Binding"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td>' +
          '</tr>';
        }
      }
      // Delegations on parent prefix
      if (data.delegations && data.delegations.length > 0) {
        for (var d = 0; d < data.delegations.length; d++) {
          var del = data.delegations[d];
          var delDesc = del.description || '';
          var descCell = '<span id="del-desc-' + escAttr(del.id) + '" class="del-desc-display" style="display:inline-flex;align-items:center;gap:4px">' +
            (delDesc ? '<span class="text-cf-gray text-[10px] max-w-[160px] truncate" title="' + escAttr(delDesc) + '">' + escHtml(delDesc) + '</span>' : '<span class="text-cf-gray text-[10px] italic opacity-50">No description</span>') +
            '<button onclick="event.stopPropagation();startEditDelegationDesc(\\'' + escAttr(del.id) + '\\',\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(delDesc) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Edit description"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>' +
          '</span>';
          html += '<tr class="child-row border-b border-cf-border">' +
            '<td class="px-2"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-2"><svg class="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></td>' +
            '<td class="px-3 pl-8 font-mono text-cf-gray"><span class="text-teal-400 mr-1">&#9500;&#9472;</span> <span class="badge-delegation">Delegation</span> <span class="text-cf-gray ml-1">' + escHtml(del.cidr) + '</span></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3 text-cf-gray text-[10px] font-mono" title="Delegated Account ID">' + escHtml(del.delegated_account_id) + '</td>' +
            '<td class="px-3"></td><td class="px-3"></td>' +
            '<td class="px-3">' + descCell + '</td>' +
            '<td class="px-3"><button onclick="event.stopPropagation();confirmDeleteDelegation(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(del.id) + '\\',\\'' + escAttr(del.cidr) + '\\',\\'' + escAttr(del.delegated_account_id) + '\\')" class="text-cf-gray hover:text-red-400" title="Delete Delegation"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td>' +
          '</tr>';
        }
      }
      // BGP sub-prefixes
      if (data.bgp_prefixes && data.bgp_prefixes.length > 0) {
        var bgpParentCidr = parentCidrFor(prefixId);
        for (var j = 0; j < data.bgp_prefixes.length; j++) {
          var bp = data.bgp_prefixes[j];
          // A BGP prefix equal to its parent is the whole-prefix advertisement,
          // not a more-specific "child" prefix.
          var bgpIsFullPrefix = bgpParentCidr && cidrEquals(bp.cidr, bgpParentCidr);
          var isLast = j === data.bgp_prefixes.length - 1 && (!data.bindings || data.bindings.length === 0 || j > 0);
          var connector = isLast ? '&#9492;&#9472;' : '&#9500;&#9472;';
          var bgpAdv = bp.on_demand && bp.on_demand.advertised;
          var bgpLocked = bp.on_demand && bp.on_demand.on_demand_locked;
          // Only allow advertise/withdraw when the sub-prefix has a known (active) state.
          var bgpActive = bp.on_demand && (bp.on_demand.advertised === true || bp.on_demand.advertised === false);
          var bgpDelegationIcon = bgpHasDelegation(prefixId, bp.cidr) ? '<svg class="w-3 h-3 text-teal-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' : '';
          var bgpToggleTip = bgpLocked
            ? 'This sub-prefix is locked and cannot be advertised. Contact your Cloudflare account team to unlock.'
            : bgpAdv
              ? 'Currently advertised. Click to withdraw this sub-prefix and stop announcing it via BGP.'
              : 'Currently withdrawn. Click to advertise this sub-prefix and begin announcing it via BGP.';
          var toggleHtml = !bgpActive ? '' :
            '<span class="validation-hover" onclick="event.stopPropagation()"><button class="toggle-btn' + (bgpAdv ? ' active' : '') + '"' +
            (bgpLocked ? ' disabled' : ' onclick="event.stopPropagation();confirmToggle(\\'' + prefixId + '\\',\\'' + bp.id + '\\',' + (bgpAdv ? 'false' : 'true') + ',\\'' + escAttr(bp.cidr) + '\\')"') +
            '><span class="toggle-knob"></span></button><span class="validation-tip">' + bgpToggleTip + '</span></span>';
          var bgpDelegateBtn = !bgpLocked ? '<button onclick="event.stopPropagation();openDelegationModal(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(bp.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Delegate Prefix"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></button>' : '';
          var bgpDeleteBtn = !bgpLocked ? '<button onclick="event.stopPropagation();confirmDeleteBgpPrefix(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(bp.id) + '\\',\\'' + escAttr(bp.cidr) + '\\')" class="text-cf-gray hover:text-red-400" title="' + (bgpIsFullPrefix ? 'Delete BGP Prefix' : 'Delete Child Prefix') + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' : '';

          html += '<tr class="child-row border-b border-cf-border">' +
            '<td class="px-2"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-2">' + (bgpLocked ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg><span class="info-bubble" style="width:220px">This prefix is locked. The advertisement state cannot be modified. To unlock, contact your Cloudflare account team.</span></span>' : '') + bgpDelegationIcon + '</td>' +
            '<td class="px-3 pl-8 font-mono" style="color:var(--text-strong)"><span class="text-cf-orange mr-1">' + connector + '</span> <span class="cidr-hover" onmouseenter="showRdap(\\'' + escAttr(bp.cidr) + '\\',this)">' + escHtml(bp.cidr) + '<span class="rdap-tip"></span></span></td>' +
            '<td class="px-3 text-cf-gray">' + (bp.asn != null ? bp.asn : '—') + '</td>' +
            '<td class="px-3">' + bgpStatusBadgeHtml(bp.on_demand ? bp.on_demand.advertised : undefined) + '</td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3 flex gap-1 items-center">' + toggleHtml + '<button onclick="event.stopPropagation();openLgModal(\\'' + escAttr(bp.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Looking Glass"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>' + bgpDelegateBtn + bgpDeleteBtn + '</td>' +
          '</tr>';
        }
      }
      if ((!data.bgp_prefixes || data.bgp_prefixes.length === 0) && (!data.bindings || data.bindings.length === 0) && (!data.delegations || data.delegations.length === 0)) {
        html += '<tr class="child-row border-b border-cf-border"><td colspan="10" class="px-3 pl-8 py-2 text-cf-gray italic">No BGP sub-prefixes, service bindings, or delegations</td></tr>';
      }
      return html;
    }

    // ─── Row Expansion ────────────────────────────────────────────
    async function toggleRow(prefixId) {
      if (expandedRows[prefixId]) {
        expandedRows[prefixId] = false;
        renderPrefixTable();
        return;
      }

      expandedRows[prefixId] = true;

      if (!childData[prefixId]) {
        childData[prefixId] = { bgp_prefixes: [], bindings: [], delegations: [], loading: true };
        renderPrefixTable();

        try {
          var bgpResp = fetch('/api/prefixes/' + prefixId + '/bgp?account_id=' + activeAccountId);
          var bindResp = fetch('/api/prefixes/' + prefixId + '/bindings?account_id=' + activeAccountId);
          var delResp = fetch('/api/prefixes/' + prefixId + '/delegations?account_id=' + activeAccountId);
          var results = await Promise.all([bgpResp, bindResp, delResp]);
          var bgpData = await results[0].json();
          var bindData = await results[1].json();
          var delData = await results[2].json();
          childData[prefixId] = {
            bgp_prefixes: bgpData.bgp_prefixes || [],
            bindings: bindData.bindings || [],
            delegations: delData.delegations || [],
            loading: false
          };
        } catch (e) {
          childData[prefixId] = { bgp_prefixes: [], bindings: [], delegations: [], loading: false, error: String(e) };
        }
      }

      renderPrefixTable();
    }

    // ─── Advertisement Toggle ─────────────────────────────────────
    function confirmToggle(prefixId, bgpPrefixId, newState, cidr) {
      pendingToggle = { prefixId: prefixId, bgpPrefixId: bgpPrefixId, advertised: newState, cidr: cidr };
      var action = newState ? 'ADVERTISE' : 'WITHDRAW';
      document.getElementById('confirm-message').innerHTML =
        'Are you sure you want to <strong>' + action + '</strong> the BGP prefix <strong class="font-mono">' + escHtml(cidr) + '</strong>?<br><br>' +
        '<span class="text-red-500">This will ' + (newState ? 'start announcing' : 'stop announcing') + ' this prefix to the Internet.</span>';
      document.getElementById('confirm-modal').classList.remove('hidden');
    }

    function closeConfirmModal() {
      document.getElementById('confirm-modal').classList.add('hidden');
      pendingToggle = null;
    }

    async function executeToggle() {
      if (!pendingToggle) return;
      var t = pendingToggle;
      closeConfirmModal();

      // Handle parent-level toggle
      if (t.isParent) {
        await executeParentToggle(t);
        return;
      }

      try {
        var resp = await fetch('/api/prefixes/' + t.prefixId + '/bgp/' + t.bgpPrefixId + '/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ advertised: t.advertised, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          // Refresh parent prefix data and child data
          delete childData[t.prefixId];
          await loadPrefixes();
          // Re-expand the row to show updated child data
          if (!expandedRows[t.prefixId]) {
            toggleRow(t.prefixId);
          }
          refreshActivityLog();
        } else {
          showInlineMsg('prefix-msg', 'Toggle failed: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (e) {
        showInlineMsg('prefix-msg', 'Toggle failed: ' + e, 'error');
      }
    }

    // ─── Parent Prefix Toggle ─────────────────────────────────────
    async function confirmParentToggle(prefixId, newState, cidr) {
      var action = newState ? 'ADVERTISE' : 'WITHDRAW';
      document.getElementById('confirm-message').innerHTML =
        'Are you sure you want to <strong>' + action + '</strong> prefix <strong class="font-mono">' + escHtml(cidr) + '</strong>?<br><br>' +
        '<span class="text-red-500">This will ' + (newState ? 'start announcing' : 'stop announcing') + ' all BGP sub-prefixes under this prefix to the Internet.</span>';

      // We need to fetch BGP sub-prefixes to toggle them
      pendingToggle = { prefixId: prefixId, advertised: newState, cidr: cidr, isParent: true };
      document.getElementById('confirm-modal').classList.remove('hidden');
    }

    async function executeParentToggle(t) {
      try {
        // Fetch BGP sub-prefixes if not cached
        var bgpPrefixes;
        if (childData[t.prefixId] && childData[t.prefixId].bgp_prefixes) {
          bgpPrefixes = childData[t.prefixId].bgp_prefixes;
        } else {
          var resp = await fetch('/api/prefixes/' + t.prefixId + '/bgp?account_id=' + activeAccountId);
          var data = await resp.json();
          bgpPrefixes = data.bgp_prefixes || [];
        }

        var errors = [];
        var toggled = 0;
        var skipped = 0;
        for (var i = 0; i < bgpPrefixes.length; i++) {
          var bp = bgpPrefixes[i];
          if (bp.on_demand && bp.on_demand.on_demand_locked) { skipped++; continue; }
          if (bp.on_demand && bp.on_demand.advertised === t.advertised) { skipped++; continue; }
          try {
            var toggleResp = await fetch('/api/prefixes/' + t.prefixId + '/bgp/' + bp.id + '/toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ advertised: t.advertised, account_id: activeAccountId })
            });
            var toggleData = await toggleResp.json();
            if (toggleData.ok) {
              toggled++;
            } else {
              errors.push(bp.cidr + ': ' + (toggleData.error || 'Failed'));
            }
          } catch (err) {
            errors.push(bp.cidr + ': ' + err);
          }
        }

        if (errors.length > 0) {
          showInlineMsg('prefix-msg', 'Toggled ' + toggled + ' sub-prefix(es), but ' + errors.length + ' failed: ' + errors.join('; '), 'error');
        } else if (toggled === 0) {
          showInlineMsg('prefix-msg', 'No sub-prefixes were toggled. They may all be locked or already in the desired state.' + (skipped > 0 ? ' (' + skipped + ' skipped)' : ''), 'error');
        } else {
          showInlineMsg('prefix-msg', 'Toggled ' + toggled + ' sub-prefix(es).', 'success');
        }

        // Refresh
        delete childData[t.prefixId];
        loadPrefixes();
        refreshActivityLog();
      } catch (e) {
        showInlineMsg('prefix-msg', 'Toggle failed: ' + e, 'error');
      }
    }

    // ─── Description Editing ──────────────────────────────────────
    function startEditDescription(prefixId, currentDesc) {
      var display = document.getElementById('desc-display-' + prefixId);
      var edit = document.getElementById('desc-edit-' + prefixId);
      if (display) display.classList.add('hidden');
      if (edit) {
        edit.classList.remove('hidden');
        var input = edit.querySelector('input');
        if (input) {
          input.value = currentDesc || '';
          input.focus();
          input.select();
        }
      }
    }

    function cancelEditDescription(prefixId) {
      var display = document.getElementById('desc-display-' + prefixId);
      var edit = document.getElementById('desc-edit-' + prefixId);
      if (display) display.classList.remove('hidden');
      if (edit) edit.classList.add('hidden');
    }

    async function saveDescription(prefixId, newDesc) {
      var display = document.getElementById('desc-display-' + prefixId);
      var edit = document.getElementById('desc-edit-' + prefixId);
      var spinner = document.getElementById('desc-spinner-' + prefixId);

      // Find current description to compare
      var prefix = allPrefixes.find(function(p) { return p.id === prefixId; });
      if (prefix && newDesc === (prefix.description || '')) {
        cancelEditDescription(prefixId);
        return;
      }

      if (spinner) spinner.classList.remove('hidden');
      var input = edit ? edit.querySelector('input') : null;
      if (input) input.disabled = true;

      try {
        var resp = await fetch('/api/prefixes/' + encodeURIComponent(prefixId) + '/description', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: newDesc, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          // Update local data
          if (prefix) prefix.description = newDesc;
          updateTagFilter();
          renderPrefixTable();
          refreshActivityLog();
        } else {
          showInlineMsg('prefix-msg', 'Failed to update description: ' + (data.error || 'Unknown error'), 'error');
          cancelEditDescription(prefixId);
        }
      } catch (e) {
        showInlineMsg('prefix-msg', 'Failed to update description: ' + e, 'error');
        cancelEditDescription(prefixId);
      } finally {
        if (spinner) spinner.classList.add('hidden');
        if (input) input.disabled = false;
      }
    }

    // ─── Bulk Selection ───────────────────────────────────────────
    function getCurrentPageIds() {
      var startIdx = (currentPage - 1) * pageSize;
      var endIdx = Math.min(startIdx + pageSize, filteredPrefixes.length);
      var ids = new Set();
      for (var i = startIdx; i < endIdx; i++) ids.add(filteredPrefixes[i].id);
      return ids;
    }

    function toggleSelectAll(checkbox) {
      var checkboxes = document.querySelectorAll('.prefix-checkbox');
      var pageIds = getCurrentPageIds();
      if (checkbox.checked) {
        checkboxes.forEach(function(cb) { if (!cb.disabled) { cb.checked = true; selectedPrefixes.add(cb.value); } });
      } else {
        checkboxes.forEach(function(cb) { cb.checked = false; });
        pageIds.forEach(function(id) { selectedPrefixes.delete(id); });
      }
      updateBulkBar();
    }

    function updateBulkSelection() {
      var pageIds = getCurrentPageIds();
      pageIds.forEach(function(id) { selectedPrefixes.delete(id); });
      var checkboxes = document.querySelectorAll('.prefix-checkbox:checked');
      checkboxes.forEach(function(cb) { selectedPrefixes.add(cb.value); });
      updateBulkBar();
      // Update select-all checkbox state (only count enabled checkboxes)
      var allCbs = document.querySelectorAll('.prefix-checkbox:not(:disabled)');
      var selectAllCb = document.getElementById('select-all-checkbox');
      if (selectAllCb) {
        selectAllCb.checked = allCbs.length > 0 && checkboxes.length === allCbs.length;
        selectAllCb.indeterminate = checkboxes.length > 0 && checkboxes.length < allCbs.length;
      }
    }

    function updateBulkBar() {
      var bar = document.getElementById('bulk-action-bar');
      var count = selectedPrefixes.size;
      if (count === 0) {
        bar.classList.add('hidden');
      } else {
        bar.classList.remove('hidden');
        document.getElementById('bulk-count').textContent = count + ' prefix' + (count === 1 ? '' : 'es') + ' selected';
      }
    }

    function clearSelection() {
      selectedPrefixes.clear();
      var checkboxes = document.querySelectorAll('.prefix-checkbox');
      checkboxes.forEach(function(cb) { cb.checked = false; });
      var selectAllCb = document.getElementById('select-all-checkbox');
      if (selectAllCb) { selectAllCb.checked = false; selectAllCb.indeterminate = false; }
      updateBulkBar();
    }

    function bulkToggle(advertised) {
      if (selectedPrefixes.size === 0) return;
      var action = advertised ? 'ADVERTISE' : 'WITHDRAW';
      var prefixIds = Array.from(selectedPrefixes);
      var selected = prefixIds.map(function(id) {
        return allPrefixes.find(function(p) { return p.id === id; });
      }).filter(Boolean);

      var listHtml = selected.map(function(p) {
        var badge = statusBadgeHtml(p);
        var lockNote = p.on_demand_locked ? ' <span class="text-red-500">(locked - will be skipped)</span>' : '';
        return '<div class="flex items-center gap-2 py-1">' + badge + ' <span>' + escHtml(p.cidr) + '</span>' + lockNote + '</div>';
      }).join('');

      var lockedCount = selected.filter(function(p) { return p.on_demand_locked; }).length;

      document.getElementById('bulk-confirm-title').textContent = 'Confirm Bulk ' + (advertised ? 'Advertise' : 'Withdraw');
      document.getElementById('bulk-confirm-message').innerHTML =
        'Are you sure you want to <strong>' + action + '</strong> the following ' + selected.length + ' prefix' + (selected.length === 1 ? '' : 'es') + '?';
      document.getElementById('bulk-confirm-list').innerHTML = listHtml;

      var warningEl = document.getElementById('bulk-confirm-warning');
      if (lockedCount > 0) {
        warningEl.textContent = lockedCount + ' locked prefix' + (lockedCount === 1 ? '' : 'es') + ' will be skipped.';
        warningEl.classList.remove('hidden');
      } else {
        warningEl.classList.add('hidden');
      }

      document.getElementById('bulk-confirm-results').classList.add('hidden');
      document.getElementById('bulk-confirm-btn').disabled = false;
      document.getElementById('bulk-confirm-btn').textContent = 'Confirm';
      pendingBulkToggle = { prefix_ids: prefixIds, advertised: advertised };
      document.getElementById('bulk-confirm-modal').classList.remove('hidden');
    }

    function closeBulkConfirmModal() {
      document.getElementById('bulk-confirm-modal').classList.add('hidden');
      pendingBulkToggle = null;
    }

    async function executeBulkToggle() {
      if (!pendingBulkToggle) return;
      var t = pendingBulkToggle;
      var btn = document.getElementById('bulk-confirm-btn');
      btn.disabled = true;
      btn.textContent = 'Processing...';

      try {
        var resp = await fetch('/api/prefixes/bulk-toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix_ids: t.prefix_ids, advertised: t.advertised, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok && data.results) {
          var totalToggled = 0, totalSkipped = 0, totalErrors = 0;
          var resultLines = data.results.map(function(r) {
            totalToggled += r.toggled;
            totalSkipped += r.skipped;
            totalErrors += r.errors.length;
            var status = r.toggled > 0 ? '<span class="badge-valid">OK</span>' : (r.errors.length > 0 ? '<span class="badge-invalid">Error</span>' : '<span class="badge-unknown">Skipped</span>');
            return '<div class="py-1">' + status + ' <span class="font-mono">' + escHtml(r.cidr || r.prefix_id) + '</span> — ' + r.toggled + ' toggled, ' + r.skipped + ' skipped' + (r.errors.length > 0 ? ', ' + r.errors.length + ' error(s)' : '') + '</div>';
          });

          var resultsEl = document.getElementById('bulk-confirm-results');
          resultsEl.innerHTML =
            '<div class="border border-cf-border rounded-lg p-2 mb-2">' +
              '<div class="font-medium mb-1" style="color:var(--text-strong)">Results: ' + totalToggled + ' toggled, ' + totalSkipped + ' skipped, ' + totalErrors + ' error(s)</div>' +
              resultLines.join('') +
            '</div>';
          resultsEl.classList.remove('hidden');

          btn.textContent = 'Done';
          // Refresh data
          clearSelection();
          loadPrefixes();
          refreshActivityLog();
        } else {
          var errEl = document.getElementById('bulk-confirm-results');
          errEl.innerHTML = '<span class="inline-msg inline-msg-error">Bulk toggle failed: ' + escHtml(data.error || 'Unknown error') + '</span>';
          errEl.classList.remove('hidden');
        }
      } catch (e) {
        var errEl2 = document.getElementById('bulk-confirm-results');
        errEl2.innerHTML = '<span class="inline-msg inline-msg-error">Bulk toggle failed: ' + escHtml(String(e)) + '</span>';
        errEl2.classList.remove('hidden');
      } finally {
        btn.disabled = false;
      }
    }

    // ─── Service Binding Modal ─────────────────────────────────────

    // CIDR / IP math helpers using BigInt for IPv6 support
    function isIPv6(cidr) { return cidr.indexOf(':') !== -1; }

    function parseIPv4(ip) {
      var parts = ip.split('.');
      if (parts.length !== 4) return null;
      var n = BigInt(0);
      for (var i = 0; i < 4; i++) {
        var v = parseInt(parts[i], 10);
        if (isNaN(v) || v < 0 || v > 255) return null;
        n = (n << BigInt(8)) | BigInt(v);
      }
      return n;
    }

    function parseIPv6(ip) {
      // Expand :: shorthand
      var halves = ip.split('::');
      var groups = [];
      if (halves.length > 2) return null;
      if (halves.length === 2) {
        var left = halves[0] ? halves[0].split(':') : [];
        var right = halves[1] ? halves[1].split(':') : [];
        var missing = 8 - left.length - right.length;
        if (missing < 0) return null;
        groups = left.slice();
        for (var m = 0; m < missing; m++) groups.push('0');
        groups = groups.concat(right);
      } else {
        groups = ip.split(':');
      }
      if (groups.length !== 8) return null;
      var n = BigInt(0);
      for (var i = 0; i < 8; i++) {
        var v = parseInt(groups[i] || '0', 16);
        if (isNaN(v) || v < 0 || v > 0xFFFF) return null;
        n = (n << BigInt(16)) | BigInt(v);
      }
      return n;
    }

    function parseCIDR(cidr) {
      var parts = cidr.split('/');
      if (parts.length !== 2) return null;
      var maskLen = parseInt(parts[1], 10);
      if (isNaN(maskLen)) return null;
      var v6 = isIPv6(cidr);
      var totalBits = v6 ? 128 : 32;
      if (maskLen < 0 || maskLen > totalBits) return null;
      var ip = v6 ? parseIPv6(parts[0]) : parseIPv4(parts[0]);
      if (ip === null) return null;
      var mask = totalBits === maskLen ? (v6 ? (BigInt(1) << BigInt(128)) - BigInt(1) : (BigInt(1) << BigInt(32)) - BigInt(1)) :
                 ((BigInt(1) << BigInt(totalBits)) - BigInt(1)) ^ ((BigInt(1) << BigInt(totalBits - maskLen)) - BigInt(1));
      var network = ip & mask;
      return { ip: ip, network: network, mask: mask, maskLen: maskLen, totalBits: totalBits, v6: v6 };
    }

    function cidrContains(parent, child) {
      if (parent.v6 !== child.v6) return false;
      if (child.maskLen < parent.maskLen) return false;
      return (child.network & parent.mask) === parent.network;
    }

    function cidrOverlaps(a, b) {
      if (a.v6 !== b.v6) return false;
      // Two CIDRs overlap if the smaller one's network falls within the larger, or vice versa
      if (a.maskLen <= b.maskLen) {
        return (b.network & a.mask) === a.network;
      } else {
        return (a.network & b.mask) === b.network;
      }
    }

    // Robust (IPv6-normalized) CIDR equality via parseCIDR; falls back to string compare.
    function cidrEquals(a, b) {
      var pa = parseCIDR(a), pb = parseCIDR(b);
      if (!pa || !pb) return a === b;
      return pa.v6 === pb.v6 && pa.maskLen === pb.maskLen && pa.network === pb.network;
    }

    function parentCidrFor(prefixId) {
      var p = allPrefixes.find(function(x){ return x.id === prefixId; });
      return p ? p.cidr : '';
    }

    // Dependent resources that must be removed before a prefix (or its
    // equal-to-parent BGP prefix) can be deleted. Child BGP prefixes are those
    // whose CIDR differs from the parent; the equal-to-parent BGP prefix is not
    // counted as a dependency.
    function blockingDependencies(prefixId, parentCidr) {
      var d = childData[prefixId] || {};
      var childBgp = (d.bgp_prefixes || []).filter(function(bp){ return !(parentCidr && cidrEquals(bp.cidr, parentCidr)); });
      var bindings = (d.bindings || []).length;
      var delegations = (d.delegations || []).length;
      return { childBgp: childBgp.length, bindings: bindings, delegations: delegations,
               total: childBgp.length + bindings + delegations };
    }

    function dependencyBlockMessage(deps) {
      var items = [];
      if (deps.childBgp > 0) items.push(deps.childBgp + ' child BGP prefix' + (deps.childBgp === 1 ? '' : 'es'));
      if (deps.bindings > 0) items.push(deps.bindings + ' service binding' + (deps.bindings === 1 ? '' : 's'));
      if (deps.delegations > 0) items.push(deps.delegations + ' delegation' + (deps.delegations === 1 ? '' : 's'));
      return '<span class="text-red-500">This prefix still has ' + items.join(', ') +
             '.</span><br><br>Please remove ' + (items.length > 1 ? 'them' : 'it') + ' first, then delete this prefix.';
    }

    // Fetch child data (BGP prefixes, bindings, delegations) if not already
    // cached — used by the delete guards where the row may not be expanded.
    async function ensureChildData(prefixId) {
      if (childData[prefixId] && !childData[prefixId].loading) return childData[prefixId];
      try {
        var results = await Promise.all([
          fetch('/api/prefixes/' + prefixId + '/bgp?account_id=' + activeAccountId),
          fetch('/api/prefixes/' + prefixId + '/bindings?account_id=' + activeAccountId),
          fetch('/api/prefixes/' + prefixId + '/delegations?account_id=' + activeAccountId)
        ]);
        var bgpData = await results[0].json();
        var bindData = await results[1].json();
        var delData = await results[2].json();
        childData[prefixId] = {
          bgp_prefixes: bgpData.bgp_prefixes || [],
          bindings: bindData.bindings || [],
          delegations: delData.delegations || [],
          loading: false
        };
      } catch (e) {
        childData[prefixId] = { bgp_prefixes: [], bindings: [], delegations: [], loading: false, error: String(e) };
      }
      return childData[prefixId];
    }

    function ipToString(n, v6) {
      if (!v6) {
        return [Number((n >> BigInt(24)) & BigInt(255)), Number((n >> BigInt(16)) & BigInt(255)), Number((n >> BigInt(8)) & BigInt(255)), Number(n & BigInt(255))].join('.');
      }
      var groups = [];
      for (var i = 7; i >= 0; i--) {
        groups.push(Number((n >> BigInt(i * 16)) & BigInt(0xFFFF)).toString(16));
      }
      return groups.join(':');
    }

    // Find the next available aligned IP for a given mask length within a parent prefix,
    // skipping over existing bindings. Returns { ip: BigInt|null, error: string|null }.
    function findNextAvailableIp(parentParsed, maskLen, existingBindings, selectedService) {
      var totalBits = parentParsed.v6 ? 128 : 32;
      var blockSize = BigInt(1) << BigInt(totalBits - maskLen);
      var parentSize = BigInt(1) << BigInt(totalBits - parentParsed.maskLen);
      var parentEnd = parentParsed.network + parentSize;

      // Filter out bindings we should ignore for overlap purposes
      // (mirror validateBinding logic: skip parent-level Magic Transit when placing CDN/Spectrum)
      var relevant = [];
      for (var i = 0; i < existingBindings.length; i++) {
        var bp = parseCIDR(existingBindings[i].cidr);
        if (!bp) continue;
        if (isMagicTransit(existingBindings[i].service_name) &&
            bp.maskLen === parentParsed.maskLen &&
            isCdnOrSpectrum(selectedService)) {
          continue;
        }
        relevant.push(bp);
      }

      // Sort by network address
      relevant.sort(function(a, b) {
        if (a.network < b.network) return -1;
        if (a.network > b.network) return 1;
        return 0;
      });

      var candidate = parentParsed.network;

      for (var r = 0; r < relevant.length; r++) {
        if (candidate + blockSize > parentEnd) break;

        var bNet = relevant[r].network;
        var bEnd = bNet + (BigInt(1) << BigInt(totalBits - relevant[r].maskLen));

        // If candidate fits before this binding, we found a gap
        if (candidate + blockSize <= bNet) {
          return { ip: candidate, error: null };
        }

        // If candidate overlaps this binding, jump past it
        if (candidate < bEnd) {
          candidate = bEnd;
          // Align up to the next block boundary
          var remainder = candidate % blockSize;
          if (remainder !== BigInt(0)) {
            candidate = candidate + (blockSize - remainder);
          }
        }
      }

      // Check the last candidate after all bindings
      if (candidate + blockSize <= parentEnd) {
        return { ip: candidate, error: null };
      }

      return { ip: null, error: 'Not enough room for a /' + maskLen + ' binding in this prefix' };
    }

    // Auto-fill the binding IP field with the next available IP for the selected mask length
    function autoFillBindingIp() {
      if (!bindingModalContext) return;
      var parsed = parseCIDR(bindingModalContext.parentCidr);
      if (!parsed) return;

      var existingBindings = (childData[bindingModalContext.prefixId] && childData[bindingModalContext.prefixId].bindings) || [];
      // Skip auto-fill for first binding (CIDR is locked to parent prefix)
      if (existingBindings.length === 0) return;

      var maskSel = document.getElementById('binding-mask');
      var maskLen = parseInt(maskSel.value, 10);
      if (isNaN(maskLen)) return;

      var selectedService = getSelectedServiceName();
      var result = findNextAvailableIp(parsed, maskLen, existingBindings, selectedService);

      var ipInput = document.getElementById('binding-ip');
      var errEl = document.getElementById('binding-error');
      var submitBtn = document.getElementById('binding-submit-btn');

      if (result.ip !== null) {
        ipInput.value = ipToString(result.ip, parsed.v6);
        errEl.classList.add('hidden');
        submitBtn.disabled = false;
      } else {
        ipInput.value = '';
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
        submitBtn.disabled = true;
      }
    }

    async function loadServices() {
      if (servicesCache[activeAccountId]) return servicesCache[activeAccountId];
      try {
        var resp = await fetch('/api/services?account_id=' + activeAccountId);
        var data = await resp.json();
        var services = data.services || [];
        servicesCache[activeAccountId] = services;
        return services;
      } catch (e) {
        return [];
      }
    }

    // ─── Child Prefix Modal ─────────────────────────────────────

    // Auto-fill the child prefix IP field with the next available aligned IP
    function autoFillChildPrefixIp() {
      if (!childPrefixModalContext) return;
      var parsed = parseCIDR(childPrefixModalContext.parentCidr);
      if (!parsed) return;

      var maskLen = parseInt(document.getElementById('child-prefix-mask').value, 10);
      if (isNaN(maskLen)) return;

      var totalBits = parsed.v6 ? 128 : 32;
      var blockSize = BigInt(1) << BigInt(totalBits - maskLen);
      var parentSize = BigInt(1) << BigInt(totalBits - parsed.maskLen);
      var parentEnd = parsed.network + parentSize;

      // Collect existing child BGP prefixes (skip the parent-level prefix itself)
      var existingBgp = (childData[childPrefixModalContext.prefixId] && childData[childPrefixModalContext.prefixId].bgp_prefixes) || [];
      var children = [];
      for (var i = 0; i < existingBgp.length; i++) {
        if (existingBgp[i].cidr === childPrefixModalContext.parentCidr) continue;
        var bp = parseCIDR(existingBgp[i].cidr);
        if (bp) children.push(bp);
      }
      children.sort(function(a, b) { return a.network < b.network ? -1 : a.network > b.network ? 1 : 0; });

      var candidate = parsed.network;
      for (var c = 0; c < children.length; c++) {
        if (candidate + blockSize > parentEnd) break;
        var cEnd = children[c].network + (BigInt(1) << BigInt(totalBits - children[c].maskLen));
        if (candidate + blockSize <= children[c].network) break;
        if (candidate < cEnd) {
          candidate = cEnd;
          var remainder = candidate % blockSize;
          if (remainder !== BigInt(0)) candidate = candidate + (blockSize - remainder);
        }
      }

      var ipInput = document.getElementById('child-prefix-ip');
      var errEl = document.getElementById('child-prefix-error');
      var submitBtn = document.getElementById('child-prefix-submit-btn');

      if (candidate + blockSize <= parentEnd) {
        ipInput.value = ipToString(candidate, parsed.v6);
        errEl.classList.add('hidden');
        submitBtn.disabled = false;
      } else {
        ipInput.value = '';
        errEl.textContent = 'No space available for a /' + maskLen + ' child prefix';
        errEl.classList.remove('hidden');
        submitBtn.disabled = true;
      }
    }

    function openChildPrefixModal(prefixId, parentCidr) {
      childPrefixModalContext = { prefixId: prefixId, parentCidr: parentCidr };
      var parsed = parseCIDR(parentCidr);
      if (!parsed) return;

      // Set parent prefix label
      document.getElementById('child-prefix-modal-parent').textContent = 'Parent: ' + parentCidr;

      // Populate mask dropdown (parent mask + 1 through /24 for IPv4, /48 for IPv6)
      var maskSel = document.getElementById('child-prefix-mask');
      var minMask = parsed.maskLen + 1;
      var maxMask = parsed.v6 ? 48 : 24;
      var html = '';
      for (var m = minMask; m <= maxMask; m++) {
        html += '<option value="' + m + '"' + (m === minMask ? ' selected' : '') + '>/' + m + '</option>';
      }
      maskSel.innerHTML = html;

      // Clear error and reset button
      document.getElementById('child-prefix-error').classList.add('hidden');
      document.getElementById('child-prefix-submit-btn').disabled = false;
      document.getElementById('child-prefix-submit-btn').textContent = 'Create Child Prefix';

      // Auto-fill IP with next available address for the selected mask
      autoFillChildPrefixIp();

      document.getElementById('child-prefix-modal').classList.remove('hidden');
    }

    function closeChildPrefixModal() {
      document.getElementById('child-prefix-modal').classList.add('hidden');
      childPrefixModalContext = null;
    }

    function validateChildPrefix() {
      if (!childPrefixModalContext) return null;
      var parentCidr = childPrefixModalContext.parentCidr;
      var prefixId = childPrefixModalContext.prefixId;
      var parentParsed = parseCIDR(parentCidr);
      if (!parentParsed) return 'Invalid parent prefix';

      var ip = document.getElementById('child-prefix-ip').value.trim();
      var mask = document.getElementById('child-prefix-mask').value;
      if (!ip) return 'IP address is required';

      var childCidr = ip + '/' + mask;
      var childParsed = parseCIDR(childCidr);
      if (!childParsed) return 'Invalid IP address';

      // Check address family matches
      if (childParsed.v6 !== parentParsed.v6) return 'Address family mismatch (IPv4 vs IPv6)';

      // Check containment
      if (!cidrContains(parentParsed, childParsed)) return 'CIDR ' + childCidr + ' is not within parent prefix ' + parentCidr;

      // Check overlap with existing BGP child prefixes (skip the parent prefix itself)
      var existingBgp = (childData[prefixId] && childData[prefixId].bgp_prefixes) || [];
      for (var i = 0; i < existingBgp.length; i++) {
        if (existingBgp[i].cidr === parentCidr) continue;
        var existing = parseCIDR(existingBgp[i].cidr);
        if (existing && cidrOverlaps(childParsed, existing)) {
          return 'CIDR ' + childCidr + ' overlaps existing child prefix ' + existingBgp[i].cidr;
        }
      }

      return null; // valid
    }

    async function submitChildPrefix() {
      if (!childPrefixModalContext) return;

      var validationError = validateChildPrefix();
      if (validationError) {
        var errEl = document.getElementById('child-prefix-error');
        errEl.textContent = validationError;
        errEl.classList.remove('hidden');
        return;
      }

      var ip = document.getElementById('child-prefix-ip').value.trim();
      var mask = document.getElementById('child-prefix-mask').value;
      var cidr = ip + '/' + mask;
      var prefixId = childPrefixModalContext.prefixId;

      // Disable button and show loading
      var btn = document.getElementById('child-prefix-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      document.getElementById('child-prefix-error').classList.add('hidden');

      try {
        var resp = await fetch('/api/prefixes/' + prefixId + '/bgp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cidr: cidr, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          closeChildPrefixModal();
          // Refresh the child data for this prefix
          delete childData[prefixId];
          expandedRows[prefixId] = false;
          setTimeout(function() { toggleRow(prefixId); }, 100);
          refreshActivityLog();
        } else {
          var errEl = document.getElementById('child-prefix-error');
          errEl.textContent = data.error || 'Failed to create child prefix';
          errEl.classList.remove('hidden');
        }
      } catch (e) {
        var errEl = document.getElementById('child-prefix-error');
        errEl.textContent = 'Request failed: ' + e;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Child Prefix';
      }
    }

    // ─── Service Classification Helpers ──────────────────────────
    function isMagicTransit(serviceName) {
      return serviceName && serviceName.toLowerCase().indexOf('magic') !== -1;
    }

    function isEgress(serviceName) {
      return serviceName && serviceName.toLowerCase().indexOf('egress') !== -1;
    }

    function isCdnOrSpectrum(serviceName) {
      if (!serviceName) return false;
      var lower = serviceName.toLowerCase();
      return (lower.indexOf('cdn') !== -1 && !isEgress(lower)) || lower.indexOf('spectrum') !== -1;
    }

    function getSelectedServiceName() {
      var svcSel = document.getElementById('binding-service');
      if (!svcSel || !svcSel.value) return '';
      var opt = svcSel.options[svcSel.selectedIndex];
      return opt ? opt.textContent : '';
    }

    // Check if Magic Transit is already bound at the parent prefix length
    function hasMagicTransitAtParentLength(existingBindings, parentMaskLen) {
      for (var i = 0; i < existingBindings.length; i++) {
        var bp = parseCIDR(existingBindings[i].cidr);
        if (bp && bp.maskLen === parentMaskLen && isMagicTransit(existingBindings[i].service_name)) {
          return true;
        }
      }
      return false;
    }

    // Filter which services are available based on existing bindings
    function getAvailableServices(allServices, existingBindings, parentMaskLen) {
      var hasMT = hasMagicTransitAtParentLength(existingBindings, parentMaskLen);

      return allServices.filter(function(s) {
        // If Magic Transit is bound at the parent length, it acts as the parent binding.
        // Only CDN and Spectrum can be added (as more-specific sub-bindings)
        if (hasMT && isMagicTransit(s.name)) return false;

        return true;
      });
    }

    function rebuildMaskDropdown() {
      if (!bindingModalContext) return;
      var parsed = parseCIDR(bindingModalContext.parentCidr);
      if (!parsed) return;
      var maskSel = document.getElementById('binding-mask');
      var existingBindings = (childData[bindingModalContext.prefixId] && childData[bindingModalContext.prefixId].bindings) || [];
      var isFirst = existingBindings.length === 0;

      // CDN and Spectrum can bind down to /32 (IPv4) or /128 (IPv6)
      var maxMask = parsed.v6 ? 128 : 32;

      // Determine the starting mask length based on the selected service
      var serviceName = getSelectedServiceName();
      var minMask = parsed.maskLen;

      if (!isFirst) {
        var hasMT = hasMagicTransitAtParentLength(existingBindings, parsed.maskLen);
        if (hasMT && isCdnOrSpectrum(serviceName)) {
          // If Magic Transit is at parent length, CDN/Spectrum must be more specific
          minMask = parsed.maskLen + 1;
        }
        if (isMagicTransit(serviceName)) {
          // Magic Transit bindings must be more specific than parent when bindings exist
          minMask = parsed.maskLen + 1;
        }
      }

      var prevVal = maskSel.value;
      // Default to most specific mask (/128 for IPv6, /32 for IPv4) when no previous selection
      var targetVal = prevVal || String(maxMask);
      var html = '';
      for (var m = minMask; m <= maxMask; m++) {
        html += '<option value="' + m + '"' + (String(m) === targetVal ? ' selected' : '') + '>/' + m + '</option>';
      }
      maskSel.innerHTML = html;
      // If target selection is out of range, fall back to most specific available
      if (!maskSel.value && maskSel.options.length > 0) {
        maskSel.value = String(maxMask);
      }

      // Auto-fill next available IP for the selected mask length
      autoFillBindingIp();
    }

    async function openBindingModal(prefixId, parentCidr) {
      bindingModalContext = { prefixId: prefixId, parentCidr: parentCidr };
      var parsed = parseCIDR(parentCidr);
      if (!parsed) return;

      // Set prefix label
      document.getElementById('binding-modal-prefix').textContent = 'Prefix: ' + parentCidr;

      // Pre-fill IP with parent network address
      document.getElementById('binding-ip').value = ipToString(parsed.network, parsed.v6);

      // Clear validation
      document.getElementById('binding-validation').classList.add('hidden');
      document.getElementById('binding-error').classList.add('hidden');
      document.getElementById('binding-submit-btn').disabled = false;

      // Load services into dropdown
      var svcSel = document.getElementById('binding-service');
      svcSel.innerHTML = '<option value="">Loading services...</option>';
      svcSel.onchange = function() { rebuildMaskDropdown(); };
      document.getElementById('binding-mask').onchange = function() { autoFillBindingIp(); };
      document.getElementById('binding-modal').classList.remove('hidden');

      var allServicesList = await loadServices();
      var existingBindings = (childData[prefixId] && childData[prefixId].bindings) || [];
      var available = getAvailableServices(allServicesList, existingBindings, parsed.maskLen);

      if (available.length === 0) {
        svcSel.innerHTML = '<option value="">No eligible services</option>';
      } else {
        svcSel.innerHTML = available.map(function(s) {
          return '<option value="' + escAttr(s.id) + '">' + escHtml(s.name) + '</option>';
        }).join('');
      }

      // Build initial mask dropdown based on the default-selected service
      rebuildMaskDropdown();

      // If this is the first binding, lock CIDR to match parent prefix
      var maskSel = document.getElementById('binding-mask');
      if (existingBindings.length === 0) {
        document.getElementById('binding-ip').value = ipToString(parsed.network, parsed.v6);
        maskSel.value = String(parsed.maskLen);
        document.getElementById('binding-ip').disabled = true;
        maskSel.disabled = true;
        var valEl = document.getElementById('binding-validation');
        valEl.innerHTML = '<span class="text-red-500">First binding must cover the entire prefix (' + escHtml(parentCidr) + ').</span>';
        valEl.classList.remove('hidden');
      } else {
        document.getElementById('binding-ip').disabled = false;
        maskSel.disabled = false;
      }
    }

    function closeBindingModal() {
      document.getElementById('binding-modal').classList.add('hidden');
      bindingModalContext = null;
    }

    function validateBinding() {
      if (!bindingModalContext) return null;
      var parentCidr = bindingModalContext.parentCidr;
      var prefixId = bindingModalContext.prefixId;
      var parentParsed = parseCIDR(parentCidr);
      if (!parentParsed) return 'Invalid parent prefix';

      var ip = document.getElementById('binding-ip').value.trim();
      var mask = document.getElementById('binding-mask').value;
      if (!ip) return 'IP address is required';

      var childCidr = ip + '/' + mask;
      var childParsed = parseCIDR(childCidr);
      if (!childParsed) return 'Invalid IP address';

      var selectedService = getSelectedServiceName();

      // Check address family matches
      if (childParsed.v6 !== parentParsed.v6) return 'Address family mismatch (IPv4 vs IPv6)';

      // Check containment within parent prefix
      if (!cidrContains(parentParsed, childParsed)) return 'CIDR ' + childCidr + ' is not within parent prefix ' + parentCidr;

      // Collect all existing bindings (parent prefix bindings)
      var existingBindings = (childData[prefixId] && childData[prefixId].bindings) || [];

      // Egress can only be bound if no other binding exists at the same CIDR length
      if (isEgress(selectedService)) {
        for (var e = 0; e < existingBindings.length; e++) {
          var eb = parseCIDR(existingBindings[e].cidr);
          if (eb && eb.maskLen === childParsed.maskLen && eb.network === childParsed.network) {
            return 'Egress cannot be bound — another service (' + existingBindings[e].service_name + ') is already bound to ' + existingBindings[e].cidr;
          }
        }
      }

      // If Magic Transit is bound at the parent length, CDN/Spectrum must use a longer prefix
      if (hasMagicTransitAtParentLength(existingBindings, parentParsed.maskLen)) {
        if (isCdnOrSpectrum(selectedService) && childParsed.maskLen === parentParsed.maskLen) {
          return 'When Magic Transit is bound at the parent prefix length, CDN/Spectrum must use a more specific (longer) prefix';
        }
      }

      for (var i = 0; i < existingBindings.length; i++) {
        var existing = parseCIDR(existingBindings[i].cidr);
        if (!existing) continue;

        // Check for same-service at same CIDR length
        if (existing.maskLen === childParsed.maskLen &&
            existing.network === childParsed.network &&
            existingBindings[i].service_name === selectedService) {
          return selectedService + ' is already bound to ' + existingBindings[i].cidr;
        }

        // Check for overlapping bindings (skip the parent-level Magic Transit binding
        // since CDN/Spectrum sub-bindings are expected to be within it)
        if (isMagicTransit(existingBindings[i].service_name) &&
            existing.maskLen === parentParsed.maskLen &&
            isCdnOrSpectrum(selectedService)) {
          // This overlap is expected - CDN/Spectrum within a Magic Transit parent
          continue;
        }

        if (cidrOverlaps(childParsed, existing)) {
          return 'CIDR ' + childCidr + ' overlaps existing binding ' + existingBindings[i].cidr + ' (' + existingBindings[i].service_name + ')';
        }
      }

      return null; // valid
    }

    async function submitBinding() {
      if (!bindingModalContext) return;
      var serviceId = document.getElementById('binding-service').value;
      if (!serviceId) {
        var errEl = document.getElementById('binding-error');
        errEl.textContent = 'Please select a service';
        errEl.classList.remove('hidden');
        return;
      }

      var validationError = validateBinding();
      if (validationError) {
        var errEl = document.getElementById('binding-error');
        errEl.textContent = validationError;
        errEl.classList.remove('hidden');
        return;
      }

      var ip = document.getElementById('binding-ip').value.trim();
      var mask = document.getElementById('binding-mask').value;
      var cidr = ip + '/' + mask;
      var prefixId = bindingModalContext.prefixId;

      // Disable button and show loading
      var btn = document.getElementById('binding-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      document.getElementById('binding-error').classList.add('hidden');

      try {
        var resp = await fetch('/api/prefixes/' + prefixId + '/bindings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cidr: cidr, service_id: serviceId, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          closeBindingModal();
          // Refresh the child data for this prefix
          delete childData[prefixId];
          expandedRows[prefixId] = false;
          setTimeout(function() { toggleRow(prefixId); }, 100);
          refreshActivityLog();
        } else {
          var errEl = document.getElementById('binding-error');
          errEl.textContent = data.error || 'Failed to create binding';
          errEl.classList.remove('hidden');
        }
      } catch (e) {
        var errEl = document.getElementById('binding-error');
        errEl.textContent = 'Request failed: ' + e;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Binding';
      }
    }

    // ─── Delete Service Binding ──────────────────────────────────
    var pendingDeleteBinding = null;

    function confirmDeleteBinding(prefixId, bindingId, serviceName, cidr) {
      pendingDeleteBinding = { prefixId: prefixId, bindingId: bindingId, serviceName: serviceName, cidr: cidr };
      document.getElementById('delete-binding-message').innerHTML =
        'Are you sure you want to delete the service binding <strong>' + escHtml(serviceName) + '</strong> for <strong class="font-mono">' + escHtml(cidr) + '</strong>?';
      document.getElementById('delete-binding-btn').disabled = false;
      document.getElementById('delete-binding-btn').textContent = 'Delete';
      clearInlineMsg('delete-binding-error');
      document.getElementById('delete-binding-modal').classList.remove('hidden');
    }

    function closeDeleteBindingModal() {
      document.getElementById('delete-binding-modal').classList.add('hidden');
      pendingDeleteBinding = null;
    }

    async function executeDeleteBinding() {
      if (!pendingDeleteBinding) return;
      var d = pendingDeleteBinding;
      var btn = document.getElementById('delete-binding-btn');
      btn.disabled = true;
      btn.textContent = 'Deleting...';

      try {
        var resp = await fetch('/api/prefixes/' + d.prefixId + '/bindings/' + d.bindingId + '?account_id=' + activeAccountId, {
          method: 'DELETE'
        });
        var data = await resp.json();
        if (data.ok) {
          closeDeleteBindingModal();
          delete childData[d.prefixId];
          expandedRows[d.prefixId] = false;
          setTimeout(function() { toggleRow(d.prefixId); }, 100);
          refreshActivityLog();
        } else {
          showInlineMsg('delete-binding-error', 'Delete failed: ' + (data.error || 'Unknown error'), 'error');
          btn.disabled = false;
          btn.textContent = 'Delete';
        }
      } catch (e) {
        showInlineMsg('delete-binding-error', 'Delete failed: ' + e, 'error');
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }

    // ─── Delete BGP Child Prefix ──────────────────────────────────
    var pendingDeleteBgpPrefix = null;

    function confirmDeleteBgpPrefix(prefixId, bgpPrefixId, cidr) {
      pendingDeleteBgpPrefix = { prefixId: prefixId, bgpPrefixId: bgpPrefixId, cidr: cidr };
      var parentCidr = parentCidrFor(prefixId);
      var isFullPrefix = parentCidr && cidrEquals(cidr, parentCidr);
      var noun = isFullPrefix ? 'BGP prefix' : 'BGP child prefix';
      document.getElementById('delete-bgp-prefix-title').textContent = isFullPrefix ? 'Delete BGP Prefix' : 'Delete BGP Child Prefix';
      var btn = document.getElementById('delete-bgp-prefix-btn');
      btn.textContent = 'Delete';
      clearInlineMsg('delete-bgp-prefix-error');

      // A BGP prefix equal to the parent can only be removed once nothing else
      // depends on the prefix (other BGP prefixes, service bindings, delegations).
      var deps = isFullPrefix ? blockingDependencies(prefixId, parentCidr) : { total: 0 };
      if (deps.total > 0) {
        document.getElementById('delete-bgp-prefix-message').innerHTML = dependencyBlockMessage(deps);
        btn.disabled = true;
      } else {
        document.getElementById('delete-bgp-prefix-message').innerHTML =
          'Are you sure you want to delete the ' + noun + ' <strong class="font-mono">' + escHtml(cidr) + '</strong>?';
        btn.disabled = false;
      }
      document.getElementById('delete-bgp-prefix-modal').classList.remove('hidden');
    }

    function closeDeleteBgpPrefixModal() {
      document.getElementById('delete-bgp-prefix-modal').classList.add('hidden');
      pendingDeleteBgpPrefix = null;
    }

    async function executeDeleteBgpPrefix() {
      if (!pendingDeleteBgpPrefix) return;
      var d = pendingDeleteBgpPrefix;
      var btn = document.getElementById('delete-bgp-prefix-btn');
      btn.disabled = true;
      btn.textContent = 'Deleting...';

      try {
        var resp = await fetch('/api/prefixes/' + d.prefixId + '/bgp/' + d.bgpPrefixId + '?account_id=' + activeAccountId, {
          method: 'DELETE'
        });
        var data = await resp.json();
        if (data.ok) {
          closeDeleteBgpPrefixModal();
          delete childData[d.prefixId];
          expandedRows[d.prefixId] = false;
          setTimeout(function() { toggleRow(d.prefixId); }, 100);
          refreshActivityLog();
        } else {
          showInlineMsg('delete-bgp-prefix-error', 'Delete failed: ' + (data.error || 'Unknown error'), 'error');
          btn.disabled = false;
          btn.textContent = 'Delete';
        }
      } catch (e) {
        showInlineMsg('delete-bgp-prefix-error', 'Delete failed: ' + e, 'error');
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }

    // ─── Delete Parent Prefix ─────────────────────────────────────
    var pendingDeletePrefix = null;

    async function confirmDeletePrefix(prefixId, cidr) {
      pendingDeletePrefix = { prefixId: prefixId, cidr: cidr };
      var msgEl = document.getElementById('delete-prefix-message');
      var btn = document.getElementById('delete-prefix-btn');
      btn.textContent = 'Delete';
      btn.disabled = true;
      clearInlineMsg('delete-prefix-error');
      msgEl.innerHTML = 'Checking dependencies for <strong class="font-mono">' + escHtml(cidr) + '</strong>...';
      document.getElementById('delete-prefix-modal').classList.remove('hidden');

      // The parent prefix can only be deleted once its dependent resources are
      // gone (child BGP prefixes, service bindings, delegations). The default
      // BGP prefix equal to the parent is not counted as a dependency.
      await ensureChildData(prefixId);
      // Bail if the modal was closed or switched to another prefix meanwhile.
      if (!pendingDeletePrefix || pendingDeletePrefix.prefixId !== prefixId) return;

      var deps = blockingDependencies(prefixId, cidr);
      if (deps.total > 0) {
        msgEl.innerHTML = dependencyBlockMessage(deps);
        btn.disabled = true;
      } else {
        msgEl.innerHTML = 'Are you sure you want to delete the prefix <strong class="font-mono">' + escHtml(cidr) + '</strong>?';
        btn.disabled = false;
      }
    }

    function closeDeletePrefixModal() {
      document.getElementById('delete-prefix-modal').classList.add('hidden');
      pendingDeletePrefix = null;
    }

    async function executeDeletePrefix() {
      if (!pendingDeletePrefix) return;
      var d = pendingDeletePrefix;
      var btn = document.getElementById('delete-prefix-btn');
      btn.disabled = true;
      btn.textContent = 'Deleting...';

      try {
        var resp = await fetch('/api/prefixes/' + d.prefixId + '?account_id=' + activeAccountId, {
          method: 'DELETE'
        });
        var data = await resp.json();
        if (data.ok) {
          closeDeletePrefixModal();
          delete childData[d.prefixId];
          delete expandedRows[d.prefixId];
          await loadPrefixes();
          refreshActivityLog();
        } else {
          showInlineMsg('delete-prefix-error', 'Delete failed: ' + (data.error || 'Unknown error'), 'error');
          btn.disabled = false;
          btn.textContent = 'Delete';
        }
      } catch (e) {
        showInlineMsg('delete-prefix-error', 'Delete failed: ' + e, 'error');
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }

    // ─── Delegation Modal ──────────────────────────────────────────

    function openDelegationModal(prefixId, parentCidr) {
      delegationModalContext = { prefixId: prefixId, parentCidr: parentCidr };
      var parsed = parseCIDR(parentCidr);
      if (!parsed) return;

      // Set prefix label
      document.getElementById('delegation-modal-prefix').textContent = 'Prefix: ' + parentCidr;

      // Pre-fill IP with parent network address
      document.getElementById('delegation-ip').value = ipToString(parsed.network, parsed.v6);

      // Populate mask dropdown (parent mask through /24 for IPv4, /48 for IPv6)
      var maskSel = document.getElementById('delegation-mask');
      var minMask = parsed.maskLen;
      var maxMask = parsed.v6 ? 48 : 24;
      var html = '';
      for (var m = minMask; m <= maxMask; m++) {
        html += '<option value="' + m + '"' + (m === parsed.maskLen ? ' selected' : '') + '>/' + m + '</option>';
      }
      maskSel.innerHTML = html;

      // Clear fields
      document.getElementById('delegation-account-id').value = '';
      document.getElementById('delegation-description').value = '';
      document.getElementById('delegation-error').classList.add('hidden');
      document.getElementById('delegation-submit-btn').disabled = false;
      document.getElementById('delegation-submit-btn').textContent = 'Create Delegation';

      document.getElementById('delegation-modal').classList.remove('hidden');
    }

    function closeDelegationModal() {
      document.getElementById('delegation-modal').classList.add('hidden');
      delegationModalContext = null;
    }

    function validateDelegation() {
      if (!delegationModalContext) return 'No context';
      var parentCidr = delegationModalContext.parentCidr;
      var parentParsed = parseCIDR(parentCidr);
      if (!parentParsed) return 'Invalid parent prefix';

      var ip = document.getElementById('delegation-ip').value.trim();
      var mask = document.getElementById('delegation-mask').value;
      if (!ip) return 'IP address is required';

      var delegatedAccountId = document.getElementById('delegation-account-id').value.trim();
      if (!delegatedAccountId) return 'Delegated Account ID is required';

      var childCidr = ip + '/' + mask;
      var childParsed = parseCIDR(childCidr);
      if (!childParsed) return 'Invalid IP address';

      // Check address family matches
      if (childParsed.v6 !== parentParsed.v6) return 'Address family mismatch (IPv4 vs IPv6)';

      // Check containment within parent prefix
      if (!cidrContains(parentParsed, childParsed)) return 'CIDR ' + childCidr + ' is not within parent prefix ' + parentCidr;

      return null; // valid
    }

    async function submitDelegation() {
      if (!delegationModalContext) return;

      var validationError = validateDelegation();
      if (validationError) {
        var errEl = document.getElementById('delegation-error');
        errEl.textContent = validationError;
        errEl.classList.remove('hidden');
        return;
      }

      var ip = document.getElementById('delegation-ip').value.trim();
      var mask = document.getElementById('delegation-mask').value;
      var cidr = ip + '/' + mask;
      var delegatedAccountId = document.getElementById('delegation-account-id').value.trim();
      var description = document.getElementById('delegation-description').value.trim();
      var prefixId = delegationModalContext.prefixId;

      // Disable button and show loading
      var btn = document.getElementById('delegation-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      document.getElementById('delegation-error').classList.add('hidden');

      try {
        var postBody = { cidr: cidr, delegated_account_id: delegatedAccountId, account_id: activeAccountId };
        if (description) postBody.description = description;
        var resp = await fetch('/api/prefixes/' + prefixId + '/delegations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody)
        });
        var data = await resp.json();
        if (data.ok) {
          closeDelegationModal();
          // Refresh the child data for this prefix
          delete childData[prefixId];
          expandedRows[prefixId] = false;
          setTimeout(function() { toggleRow(prefixId); }, 100);
          refreshActivityLog();
        } else {
          var errEl = document.getElementById('delegation-error');
          errEl.textContent = data.error || 'Failed to create delegation';
          errEl.classList.remove('hidden');
        }
      } catch (e) {
        var errEl = document.getElementById('delegation-error');
        errEl.textContent = 'Request failed: ' + e;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Delegation';
      }
    }

    // ─── Delete Delegation ───────────────────────────────────────

    function confirmDeleteDelegation(prefixId, delegationId, cidr, delegatedAccountId) {
      pendingDeleteDelegation = { prefixId: prefixId, delegationId: delegationId, cidr: cidr, delegatedAccountId: delegatedAccountId };
      document.getElementById('delete-delegation-message').innerHTML =
        'Are you sure you want to delete the delegation of <strong class="font-mono">' + escHtml(cidr) + '</strong> to account <strong class="font-mono">' + escHtml(delegatedAccountId) + '</strong>?';
      document.getElementById('delete-delegation-btn').disabled = false;
      document.getElementById('delete-delegation-btn').textContent = 'Delete';
      clearInlineMsg('delete-delegation-error');
      document.getElementById('delete-delegation-modal').classList.remove('hidden');
    }

    function closeDeleteDelegationModal() {
      document.getElementById('delete-delegation-modal').classList.add('hidden');
      pendingDeleteDelegation = null;
    }

    async function executeDeleteDelegation() {
      if (!pendingDeleteDelegation) return;
      var d = pendingDeleteDelegation;
      var btn = document.getElementById('delete-delegation-btn');
      btn.disabled = true;
      btn.textContent = 'Deleting...';

      try {
        var resp = await fetch('/api/prefixes/' + d.prefixId + '/delegations/' + d.delegationId + '?account_id=' + activeAccountId, {
          method: 'DELETE'
        });
        var data = await resp.json();
        if (data.ok) {
          closeDeleteDelegationModal();
          delete childData[d.prefixId];
          expandedRows[d.prefixId] = false;
          setTimeout(function() { toggleRow(d.prefixId); }, 100);
          refreshActivityLog();
        } else {
          showInlineMsg('delete-delegation-error', 'Delete failed: ' + (data.error || 'Unknown error'), 'error');
          btn.disabled = false;
          btn.textContent = 'Delete';
        }
      } catch (e) {
        showInlineMsg('delete-delegation-error', 'Delete failed: ' + e, 'error');
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }

    // ─── Inline Edit Delegation Description ─────────────────────────
    function startEditDelegationDesc(delegationId, prefixId, currentDesc) {
      var container = document.getElementById('del-desc-' + delegationId);
      if (!container) return;
      container.innerHTML =
        '<input id="del-desc-input-' + delegationId + '" type="text" value="' + escAttr(currentDesc) + '" placeholder="Add description" class="px-1.5 py-0.5 rounded border border-cf-border bg-cf-dark text-[10px] text-white focus:border-cf-orange focus:outline-none" style="width:140px" onkeydown="if(event.key===\\'Enter\\')saveDelegationDesc(\\'' + escAttr(delegationId) + '\\',\\'' + escAttr(prefixId) + '\\');if(event.key===\\'Escape\\')cancelEditDelegationDesc(\\'' + escAttr(delegationId) + '\\',\\'' + escAttr(prefixId) + '\\')">' +
        '<button onclick="event.stopPropagation();saveDelegationDesc(\\'' + escAttr(delegationId) + '\\',\\'' + escAttr(prefixId) + '\\')" class="text-teal-400 hover:text-teal-300 ml-1" title="Save"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></button>' +
        '<button onclick="event.stopPropagation();cancelEditDelegationDesc(\\'' + escAttr(delegationId) + '\\',\\'' + escAttr(prefixId) + '\\')" class="text-cf-gray hover:text-red-400 ml-0.5" title="Cancel"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>';
      var inp = document.getElementById('del-desc-input-' + delegationId);
      if (inp) { inp.focus(); inp.select(); }
    }

    async function saveDelegationDesc(delegationId, prefixId) {
      var inp = document.getElementById('del-desc-input-' + delegationId);
      if (!inp) return;
      var desc = inp.value.trim();

      try {
        var resp = await fetch('/api/delegations/' + delegationId + '/description', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: desc, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          // Update local childData so re-render shows the new description
          var cd = childData[prefixId];
          if (cd && cd.delegations) {
            for (var i = 0; i < cd.delegations.length; i++) {
              if (cd.delegations[i].id === delegationId) {
                cd.delegations[i].description = desc;
                break;
              }
            }
          }
          renderPrefixTable();
          showInlineMsg('prefix-msg', 'Description saved.', 'success');
        } else {
          showInlineMsg('prefix-msg', 'Failed to save description: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (e) {
        showInlineMsg('prefix-msg', 'Failed to save description: ' + e, 'error');
      }
    }

    function cancelEditDelegationDesc(delegationId, prefixId) {
      // Re-render to restore the display state
      renderPrefixTable();
    }

    // ─── Add Prefix Modal ──────────────────────────────────────────
    var addPrefixLoaDocumentId = null;
    var addPrefixValidationResult = null;
    var addPrefixIpFamily = null; // 'v4', 'v6', or null

    // Non-routable IPv4 ranges (network BigInt, prefix length)
    var NON_ROUTABLE_V4 = [
      { cidr: '0.0.0.0/8' },
      { cidr: '10.0.0.0/8' },
      { cidr: '100.64.0.0/10' },
      { cidr: '127.0.0.0/8' },
      { cidr: '169.254.0.0/16' },
      { cidr: '172.16.0.0/12' },
      { cidr: '192.0.2.0/24' },
      { cidr: '192.168.0.0/16' },
      { cidr: '198.51.100.0/24' },
      { cidr: '203.0.113.0/24' },
      { cidr: '224.0.0.0/4' },
      { cidr: '240.0.0.0/4' }
    ];

    var NON_ROUTABLE_V6 = [
      { cidr: '::1/128' },
      { cidr: 'fc00::/7' },
      { cidr: 'fe80::/10' },
      { cidr: 'ff00::/8' },
      { cidr: '2001:db8::/32' },
      { cidr: '100::/64' },
      { cidr: '::ffff:0:0/96' }
    ];

    function openAddPrefixModal() {
      if (!activeAccountId) {
        showInlineMsg('prefix-msg', 'Please configure an account in Settings first.', 'error');
        return;
      }
      // Reset state
      addPrefixLoaDocumentId = null;
      addPrefixValidationResult = null;
      addPrefixIpFamily = null;

      document.getElementById('add-prefix-ip').value = '';
      document.getElementById('add-prefix-custom-asn').value = '';
      document.getElementById('add-prefix-description').value = '';
      document.getElementById('add-prefix-error').classList.add('hidden');
      document.getElementById('add-prefix-validation-results').classList.add('hidden');
      document.getElementById('add-prefix-submit-btn').disabled = false;
      document.getElementById('add-prefix-submit-btn').textContent = 'Add Prefix';
      document.getElementById('add-prefix-validate-btn').disabled = false;
      document.getElementById('add-prefix-validate-btn').innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Validate IRR / ROA';
      document.getElementById('add-prefix-loa-status').innerHTML = '';

      // Reset radio buttons
      var asnRadios = document.querySelectorAll('input[name="add-prefix-asn-mode"]');
      asnRadios.forEach(function(r, i) { r.checked = i === 0; });
      document.getElementById('add-prefix-custom-asn-wrap').classList.add('hidden');

      var loaRadios = document.querySelectorAll('input[name="add-prefix-loa-mode"]');
      loaRadios.forEach(function(r, i) { r.checked = i === 0; });
      document.getElementById('add-prefix-loa-upload-wrap').classList.add('hidden');

      // Reset file input
      var fileInput = document.getElementById('add-prefix-loa-file');
      if (fileInput) fileInput.value = '';

      // Default to IPv4
      setAddPrefixFamily('v4');

      document.getElementById('add-prefix-modal').classList.remove('hidden');
    }

    function closeAddPrefixModal() {
      document.getElementById('add-prefix-modal').classList.add('hidden');
      addPrefixLoaDocumentId = null;
      addPrefixValidationResult = null;
      addPrefixIpFamily = null;
    }

    function setAddPrefixFamily(family) {
      if (family === addPrefixIpFamily) return;
      addPrefixIpFamily = family;

      var v4Btn = document.getElementById('add-prefix-ipv4-btn');
      var v6Btn = document.getElementById('add-prefix-ipv6-btn');
      var ipInput = document.getElementById('add-prefix-ip');
      var maskSel = document.getElementById('add-prefix-mask');

      if (family === 'v4') {
        v4Btn.style.background = 'var(--accent)';
        v4Btn.style.color = '#fff';
        v6Btn.style.background = 'transparent';
        v6Btn.style.color = 'var(--muted)';
        ipInput.placeholder = 'e.g. 192.0.2.0';
        var html = '';
        for (var m = 8; m <= 24; m++) {
          html += '<option value="' + m + '"' + (m === 24 ? ' selected' : '') + '>/' + m + '</option>';
        }
        maskSel.innerHTML = html;
      } else {
        v6Btn.style.background = 'var(--accent)';
        v6Btn.style.color = '#fff';
        v4Btn.style.background = 'transparent';
        v4Btn.style.color = 'var(--muted)';
        ipInput.placeholder = 'e.g. 2001:db8::';
        var html = '';
        for (var m = 32; m <= 48; m++) {
          html += '<option value="' + m + '"' + (m === 48 ? ' selected' : '') + '>/' + m + '</option>';
        }
        maskSel.innerHTML = html;
      }

      // Clear previous validation when family changes
      document.getElementById('add-prefix-validation-results').classList.add('hidden');
      document.getElementById('add-prefix-error').classList.add('hidden');
      addPrefixValidationResult = null;
    }

    function onAddPrefixIpChange() {
      var ip = document.getElementById('add-prefix-ip').value.trim();
      // Auto-switch family based on input content
      if (ip.indexOf(':') !== -1 && addPrefixIpFamily !== 'v6') {
        setAddPrefixFamily('v6');
      } else if (ip.length > 0 && ip.indexOf(':') === -1 && /^\d/.test(ip) && addPrefixIpFamily !== 'v4') {
        setAddPrefixFamily('v4');
      }

      // Clear previous validation when prefix changes
      document.getElementById('add-prefix-validation-results').classList.add('hidden');
      document.getElementById('add-prefix-error').classList.add('hidden');
      addPrefixValidationResult = null;
    }

    function onAsnModeChange() {
      var mode = document.querySelector('input[name="add-prefix-asn-mode"]:checked').value;
      var customWrap = document.getElementById('add-prefix-custom-asn-wrap');
      if (mode === 'custom') {
        customWrap.classList.remove('hidden');
        document.getElementById('add-prefix-custom-asn').focus();
        // Check for RIR credentials and show appropriate note
        updateByoAsnNote();
      } else {
        customWrap.classList.add('hidden');
      }
      // Clear validation when ASN changes
      document.getElementById('add-prefix-validation-results').classList.add('hidden');
      addPrefixValidationResult = null;
    }

    function updateByoAsnNote() {
      var noteEl = document.getElementById('add-prefix-byo-asn-note');
      if (!noteEl) return;
      // Check RIR credentials for the active account
      fetch('/api/rir/credentials?account_id=' + encodeURIComponent(activeAccountId))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.credentials && data.credentials.length > 0) {
            var rirs = data.credentials.map(function(c) { return c.rir.toUpperCase(); }).join(' / ');
            noteEl.style.color = '#22c55e';
            noteEl.textContent = 'RIR API keys saved (' + rirs + '). IRR route object and aut-num will be auto-created after prefix onboarding.';
          } else {
            noteEl.style.color = 'var(--muted)';
            noteEl.textContent = 'Add RIR API keys in Account Settings to auto-create IRR route and aut-num records after prefix onboarding.';
          }
        })
        .catch(function() {
          noteEl.style.color = 'var(--muted)';
          noteEl.textContent = 'BYO-ASN requires valid IRR route object, ROA, and ownership validation.';
        });
    }

    function onLoaModeChange() {
      var mode = document.querySelector('input[name="add-prefix-loa-mode"]:checked').value;
      var uploadWrap = document.getElementById('add-prefix-loa-upload-wrap');
      if (mode === 'upload') {
        uploadWrap.classList.remove('hidden');
      } else {
        uploadWrap.classList.add('hidden');
        addPrefixLoaDocumentId = null;
        document.getElementById('add-prefix-loa-status').innerHTML = '';
      }
    }

    async function onLoaFileSelected() {
      var fileInput = document.getElementById('add-prefix-loa-file');
      var statusEl = document.getElementById('add-prefix-loa-status');
      if (!fileInput.files || fileInput.files.length === 0) return;

      var file = fileInput.files[0];

      // Client-side validation
      if (file.size > 10 * 1024 * 1024) {
        statusEl.innerHTML = '<span class="text-red-400">File exceeds 10MB limit</span>';
        return;
      }
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        statusEl.innerHTML = '<span class="text-red-400">Only PDF files are accepted</span>';
        return;
      }

      statusEl.innerHTML = '<div class="spinner" style="width:12px;height:12px;display:inline-block"></div> <span class="text-cf-gray">Uploading...</span>';

      try {
        var formData = new FormData();
        formData.append('loa_document', file);
        formData.append('account_id', activeAccountId);

        var resp = await fetch('/api/loa-upload', {
          method: 'POST',
          body: formData
        });
        var data = await resp.json();
        if (data.ok && data.loa_document) {
          addPrefixLoaDocumentId = data.loa_document.id;
          statusEl.innerHTML = '<span class="badge-valid">Uploaded</span> <span class="text-cf-gray">' + escHtml(data.loa_document.filename || file.name) + '</span>';
        } else {
          statusEl.innerHTML = '<span class="text-red-400">' + escHtml(data.error || 'Upload failed') + '</span>';
        }
      } catch (e) {
        statusEl.innerHTML = '<span class="text-red-400">Upload failed: ' + escHtml(String(e)) + '</span>';
      }
    }

    function getAddPrefixAsn() {
      var mode = document.querySelector('input[name="add-prefix-asn-mode"]:checked').value;
      if (mode === 'cloudflare') return 13335;
      var val = parseInt(document.getElementById('add-prefix-custom-asn').value, 10);
      return isNaN(val) ? null : val;
    }

    function validateNewPrefix() {
      var ip = document.getElementById('add-prefix-ip').value.trim();
      var mask = document.getElementById('add-prefix-mask').value;
      if (!ip) return 'IP address is required';
      if (!mask) return 'Prefix length is required';

      var cidr = ip + '/' + mask;
      var parsed = parseCIDR(cidr);
      if (!parsed) return 'Invalid IP address format';

      var maskLen = parseInt(mask, 10);

      // Minimum size for BGP on the public internet
      if (!parsed.v6 && maskLen > 24) return 'IPv4 prefix must be /24 or shorter (larger) for BGP on the public internet';
      if (parsed.v6 && maskLen < 32) return 'IPv6 prefix must be /32 or longer. Cloudflare currently supports a minimum (largest) prefix size of /32 for IPv6.';
      if (parsed.v6 && maskLen > 48) return 'IPv6 prefix must be /48 or shorter. Cloudflare does not support prefixes more specific than /48 for IPv6.';

      // Check non-routable / documentation ranges
      var nonRoutable = parsed.v6 ? NON_ROUTABLE_V6 : NON_ROUTABLE_V4;
      for (var i = 0; i < nonRoutable.length; i++) {
        var reserved = parseCIDR(nonRoutable[i].cidr);
        if (reserved && cidrOverlaps(parsed, reserved)) {
          return 'Prefix ' + cidr + ' is in a non-routable or documentation range (' + nonRoutable[i].cidr + ')';
        }
      }

      // Validate ASN
      var asn = getAddPrefixAsn();
      if (asn === null) return 'ASN is required';
      if (asn < 1 || asn > 4294967295) return 'ASN must be between 1 and 4294967295';

      // Check reserved/private ASN ranges
      var asnMode = document.querySelector('input[name="add-prefix-asn-mode"]:checked').value;
      if (asnMode === 'custom') {
        if ((asn >= 64512 && asn <= 65534) || (asn >= 4200000000 && asn <= 4294967294)) {
          return 'ASN ' + asn + ' is in a private/reserved range. Use a public ASN.';
        }
      }

      // Check LOA upload if upload mode selected
      var loaMode = document.querySelector('input[name="add-prefix-loa-mode"]:checked').value;
      if (loaMode === 'upload' && !addPrefixLoaDocumentId) {
        return 'Please upload a LOA document first, or select auto-generation';
      }

      return null; // valid
    }

    async function validatePrefixRemote() {
      // First run client-side validation
      var clientError = validateNewPrefix();
      if (clientError) {
        var errEl = document.getElementById('add-prefix-error');
        errEl.textContent = clientError;
        errEl.classList.remove('hidden');
        return;
      }
      document.getElementById('add-prefix-error').classList.add('hidden');

      var ip = document.getElementById('add-prefix-ip').value.trim();
      var mask = document.getElementById('add-prefix-mask').value;
      var cidr = ip + '/' + mask;
      var asn = getAddPrefixAsn();

      var btn = document.getElementById('add-prefix-validate-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div> Validating...';

      try {
        var resp = await fetch('/api/prefixes/validate-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cidr: cidr, asn: asn, account_id: activeAccountId })
        });
        var data = await resp.json();

        if (data.error) {
          var errEl = document.getElementById('add-prefix-error');
          errEl.textContent = data.error;
          errEl.classList.remove('hidden');
          return;
        }

        addPrefixValidationResult = data.result;
        renderValidationResults(data.result, asn);
      } catch (e) {
        var errEl = document.getElementById('add-prefix-error');
        errEl.textContent = 'Validation request failed: ' + e;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Validate IRR / ROA';
      }
    }

    function renderValidationResults(result, asn) {
      var container = document.getElementById('add-prefix-validation-results');
      var badgeEl = document.getElementById('add-prefix-validation-badge');
      var detailsEl = document.getElementById('add-prefix-validation-details');

      var summary = result.summary;
      if (summary.ready && summary.warnings.length === 0) {
        badgeEl.innerHTML = '<span class="badge-valid">Ready</span>';
      } else if (summary.ready && summary.warnings.length > 0) {
        badgeEl.innerHTML = '<span class="badge-pending">Ready with warnings</span>';
      } else {
        badgeEl.innerHTML = '<span class="badge-invalid">Issues found</span>';
      }

      var html = '';

      // ROA section
      html += '<div style="padding:6px 0;border-bottom:1px solid var(--border)">';
      html += '<div class="flex items-center gap-2 mb-1">';
      html += '<span class="font-semibold" style="color:var(--text-strong)">RPKI / ROA</span>';
      if (result.roa.found && result.roa.matching_asn) {
        html += '<span class="badge-valid">Valid</span>';
      } else if (result.roa.found && !result.roa.matching_asn) {
        html += '<span class="badge-invalid">ASN mismatch</span>';
      } else {
        html += '<span class="badge-unknown">Not found</span>';
      }
      html += '</div>';
      if (result.roa.origins.length > 0) {
        for (var i = 0; i < result.roa.origins.length; i++) {
          var o = result.roa.origins[i];
          var rpkiCls = o.rpki_status.toLowerCase() === 'valid' ? 'badge-valid' : o.rpki_status.toLowerCase() === 'invalid' ? 'badge-invalid' : 'badge-unknown';
          html += '<div style="color:var(--text-primary)">Origin: AS' + o.asn + ' &mdash; <span class="' + rpkiCls + '">' + escHtml(o.rpki_status) + '</span>' + (o.prefix ? ' (' + escHtml(o.prefix) + ')' : '') + '</div>';
        }
      } else {
        html += '<div style="color:var(--muted)">No ROA entries found</div>';
      }
      html += '</div>';

      // IRR section (RIPEstat)
      html += '<div style="padding:6px 0;border-bottom:1px solid var(--border)">';
      html += '<div class="flex items-center gap-2 mb-1">';
      html += '<span class="font-semibold" style="color:var(--text-strong)">IRR Records</span>';
      if (result.irr.found && result.irr.matching_asn && result.irr.exact_match) {
        html += '<span class="badge-valid">Exact match</span>';
      } else if (result.irr.found && result.irr.matching_asn && !result.irr.exact_match) {
        html += '<span class="badge-pending">Parent coverage only</span>';
      } else if (result.irr.found && !result.irr.matching_asn) {
        html += '<span class="badge-invalid">ASN mismatch</span>';
      } else {
        html += '<span class="badge-unknown">Not found</span>';
      }
      html += '</div>';
      if (result.irr.records.length > 0) {
        for (var i = 0; i < result.irr.records.length; i++) {
          var r = result.irr.records[i];
          html += '<div style="color:var(--text-primary)">' + escHtml(r.prefix) + ' &mdash; origin: ' + escHtml(r.origin) + (r.source ? ' (' + escHtml(r.source) + ')' : '') + '</div>';
        }
        if (result.irr.found && !result.irr.exact_match) {
          html += '<div class="mt-1 text-[10px]" style="color:#eab308">An exact route object for this prefix will be created automatically during onboarding.</div>';
        }
      } else {
        html += '<div style="color:var(--muted)">No IRR route/route6 objects found</div>';
      }
      html += '</div>';

      // Summary messages
      var hasRirCreds = result.rir_credentials && result.rir_credentials.length > 0;
      var isCustomAsn = asn !== 13335;
      if (summary.errors.length > 0) {
        html += '<div style="padding:6px 0">';
        for (var i = 0; i < summary.errors.length; i++) {
          html += '<div style="color:#ef4444;margin-bottom:4px">&#10007; ' + escHtml(summary.errors[i]) + '</div>';
        }
        html += '</div>';
      }

      // BYO-ASN credential-aware messaging
      if (isCustomAsn && summary.ready) {
        html += '<div style="padding:6px 0">';
        if (hasRirCreds) {
          html += '<div style="color:#22c55e;margin-bottom:4px">&#10003; IRR route object and aut-num will be auto-created at ' + result.rir_credentials.map(function(r) { return r.toUpperCase(); }).join(' / ') + ' after prefix creation using your saved API keys.</div>';
        } else {
          html += '<div style="color:var(--muted);margin-bottom:4px">Add RIR API keys in Account Settings to enable automatic IRR route and aut-num creation after prefix onboarding.</div>';
        }
        html += '</div>';
      } else if (summary.warnings.length > 0) {
        html += '<div style="padding:6px 0">';
        for (var i = 0; i < summary.warnings.length; i++) {
          html += '<div style="color:#eab308;margin-bottom:4px">&#9888; ' + escHtml(summary.warnings[i]) + '</div>';
        }
        html += '</div>';
      }

      // RPKI Portal link with pre-populated ASN and prefix
      var rpkiCidr = document.getElementById('add-prefix-ip').value.trim() + '/' + document.getElementById('add-prefix-mask').value;
      var rpkiPortalUrl = 'https://rpki.cloudflare.com/?view=validator&validateRoute=' + encodeURIComponent(asn + '_' + rpkiCidr);
      html += '<div style="padding-top:6px"><a href="' + rpkiPortalUrl + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:#F6821F;text-decoration:none;font-weight:500;font-size:11px">View on Cloudflare RPKI Portal &#8599;</a></div>';

      detailsEl.innerHTML = html;
      container.classList.remove('hidden');
    }

    // Check if a CIDR falls within any existing onboarded prefix
    function findParentPrefix(cidr) {
      var parts = cidr.split('/');
      var ip = parts[0];
      var mask = parseInt(parts[1], 10);
      var isV6 = ip.indexOf(':') !== -1;

      for (var i = 0; i < allPrefixes.length; i++) {
        var p = allPrefixes[i];
        var pParts = p.cidr.split('/');
        var pIp = pParts[0];
        var pMask = parseInt(pParts[1], 10);
        var pIsV6 = pIp.indexOf(':') !== -1;

        // Must be same address family and parent must have a shorter (or equal) mask
        if (isV6 !== pIsV6) continue;
        if (pMask >= mask && pMask !== mask) continue;
        if (pMask > mask) continue;

        // Check containment: the new prefix must fall within the parent
        if (isV6) {
          if (ipv6Contains(pIp, pMask, ip, mask)) return p;
        } else {
          if (ipv4Contains(pIp, pMask, ip, mask)) return p;
        }
      }
      return null;
    }

    function ipv4Contains(parentIp, parentMask, childIp, childMask) {
      if (childMask < parentMask) return false;
      var pNum = ipv4ToNum(parentIp);
      var cNum = ipv4ToNum(childIp);
      var maskBits = (0xFFFFFFFF << (32 - parentMask)) >>> 0;
      return (pNum & maskBits) === (cNum & maskBits);
    }

    function ipv4ToNum(ip) {
      var parts = ip.split('.');
      return ((parseInt(parts[0]) << 24) | (parseInt(parts[1]) << 16) | (parseInt(parts[2]) << 8) | parseInt(parts[3])) >>> 0;
    }

    function ipv6Contains(parentIp, parentMask, childIp, childMask) {
      if (childMask < parentMask) return false;
      var pBytes = ipv6ToBytes(parentIp);
      var cBytes = ipv6ToBytes(childIp);
      // Compare the first parentMask bits
      var fullBytes = Math.floor(parentMask / 8);
      for (var i = 0; i < fullBytes; i++) {
        if (pBytes[i] !== cBytes[i]) return false;
      }
      var remainingBits = parentMask % 8;
      if (remainingBits > 0) {
        var mask = (0xFF << (8 - remainingBits)) & 0xFF;
        if ((pBytes[fullBytes] & mask) !== (cBytes[fullBytes] & mask)) return false;
      }
      return true;
    }

    function ipv6ToBytes(ip) {
      // Expand :: and parse into 16 bytes
      var halves = ip.split('::');
      var left = halves[0] ? halves[0].split(':') : [];
      var right = halves.length > 1 && halves[1] ? halves[1].split(':') : [];
      var groups = [];
      for (var i = 0; i < left.length; i++) groups.push(left[i]);
      var missing = 8 - left.length - right.length;
      for (var i = 0; i < missing; i++) groups.push('0');
      for (var i = 0; i < right.length; i++) groups.push(right[i]);
      var bytes = [];
      for (var i = 0; i < 8; i++) {
        var val = parseInt(groups[i] || '0', 16);
        bytes.push((val >> 8) & 0xFF);
        bytes.push(val & 0xFF);
      }
      return bytes;
    }

    async function submitNewPrefix() {
      var clientError = validateNewPrefix();
      if (clientError) {
        var errEl = document.getElementById('add-prefix-error');
        errEl.textContent = clientError;
        errEl.classList.remove('hidden');
        return;
      }
      document.getElementById('add-prefix-error').classList.add('hidden');

      var ip = document.getElementById('add-prefix-ip').value.trim();
      var mask = document.getElementById('add-prefix-mask').value;
      var cidr = ip + '/' + mask;
      var asn = getAddPrefixAsn();
      var description = document.getElementById('add-prefix-description').value.trim();
      var loaMode = document.querySelector('input[name="add-prefix-loa-mode"]:checked').value;
      var delegateLoaCreation = loaMode === 'delegate';

      // For custom ASN: auto-run validation if not done yet, skip prompts when RIR creds exist
      var asnMode = document.querySelector('input[name="add-prefix-asn-mode"]:checked').value;
      if (asnMode === 'custom') {
        if (!addPrefixValidationResult) {
          // Auto-run validation inline instead of prompting
          var valErr = validateNewPrefix();
          if (valErr) {
            var errEl = document.getElementById('add-prefix-error');
            errEl.textContent = valErr;
            errEl.classList.remove('hidden');
            return;
          }
          var valIp = document.getElementById('add-prefix-ip').value.trim();
          var valMask = document.getElementById('add-prefix-mask').value;
          var valCidr = valIp + '/' + valMask;
          var valAsn = getAddPrefixAsn();
          try {
            var valResp = await fetch('/api/prefixes/validate-new', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cidr: valCidr, asn: valAsn }),
            });
            var valData = await valResp.json();
            if (valData.result) {
              addPrefixValidationResult = valData.result;
            }
          } catch (e) {
            // Validation fetch failed - continue anyway, the ensure flow will handle it
          }
        }
        if (addPrefixValidationResult && !addPrefixValidationResult.summary.ready) {
          // Only warn if there are actual errors (not just warnings)
          var hasErrors = addPrefixValidationResult.summary.errors && addPrefixValidationResult.summary.errors.length > 0;
          if (hasErrors) {
            showConfirm({ title: 'Validation issues', message: 'Validation found issues: ' + addPrefixValidationResult.summary.errors.join('; ') + '. Continue anyway?', confirmLabel: 'Continue', danger: true, onConfirm: function() { finishAddPrefix(cidr, asn, description, delegateLoaCreation); } });
            return;
          }
        }
      }

      finishAddPrefix(cidr, asn, description, delegateLoaCreation);
    }

    async function finishAddPrefix(cidr, asn, description, delegateLoaCreation) {
      // Check if this prefix falls within an existing parent prefix
      var parentPrefix = findParentPrefix(cidr);
      if (parentPrefix) {
        var errEl = document.getElementById('add-prefix-error');
        errEl.innerHTML = 'This prefix falls within an existing parent prefix <strong>' + escHtml(parentPrefix.cidr) + '</strong>. ' +
          'Use the <strong>Add Child Prefix</strong> button on the parent prefix row to create it as a delegation. ' +
          '<a href="#" onclick="event.preventDefault();closeAddPrefixModal();openChildPrefixModal(\\\'' + escAttr(parentPrefix.id) + '\\\',\\\'' + escAttr(parentPrefix.cidr) + '\\\')" style="color:#F6821F;font-weight:500">Create child prefix now</a>';
        errEl.classList.remove('hidden');
        return;
      }

      var btn = document.getElementById('add-prefix-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Creating...';

      try {
        var postBody = {
          cidr: cidr,
          asn: asn,
          delegate_loa_creation: delegateLoaCreation,
          account_id: activeAccountId
        };
        if (description) postBody.description = description;
        if (addPrefixLoaDocumentId) postBody.loa_document_id = addPrefixLoaDocumentId;

        var resp = await fetch('/api/prefixes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody)
        });
        var data = await resp.json();
        if (data.ok) {
          // Save validation result before closeAddPrefixModal() nulls it
          var savedValidationResult = addPrefixValidationResult;
          closeAddPrefixModal();
          loadPrefixes();
          refreshActivityLog();

          // Determine if we should auto-create RIR records
          var token = data.prefix ? data.prefix.ownership_validation_token : null;
          var prefixId = data.prefix ? data.prefix.id : null;
          var hasRirCreds = savedValidationResult && savedValidationResult.rir_credentials && savedValidationResult.rir_credentials.length > 0;
          var isByoAsn = asn !== 13335;

          console.log('[add-prefix] token:', token, 'isByoAsn:', isByoAsn, 'hasRirCreds:', hasRirCreds, 'validationResult:', savedValidationResult);

          if (isByoAsn && hasRirCreds) {
            // Auto-create flow: detect RIR, ensure route + aut-num, trigger validation
            var irrAlreadyExists = savedValidationResult && savedValidationResult.irr && savedValidationResult.irr.exact_match;
            showPostCreationGuideAutoCreate(cidr, asn, token, prefixId, irrAlreadyExists, savedValidationResult);
          } else if (isByoAsn && token) {
            // Manual flow: show token and instructions
            showPostCreationGuide(cidr, asn, token);
          }
        } else {
          var errEl = document.getElementById('add-prefix-error');
          errEl.textContent = (data.error || 'Failed to create prefix') + (data.details ? ' (' + data.details + ')' : '');
          errEl.classList.remove('hidden');
        }
      } catch (e) {
        var errEl = document.getElementById('add-prefix-error');
        errEl.textContent = 'Request failed: ' + e;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Add Prefix';
      }
    }

    // ─── Post-Creation Guide ─────────────────────────────────────
    var postCreationState = { cidr: '', asn: 0, token: '', rir: '', rirSupported: false };

    // Automated BYO-ASN flow: auto-create route, aut-num, then trigger validation
    async function showPostCreationGuideAutoCreate(cidr, asn, token, prefixId, irrAlreadyExists, savedValidationResult) {
      // If token is missing, try to fetch it from the prefix details
      if (!token && prefixId) {
        try {
          var prefixResp = await fetch('/api/prefixes/' + encodeURIComponent(prefixId) + '?account_id=' + encodeURIComponent(activeAccountId));
          var prefixData = await prefixResp.json();
          if (prefixData.prefix) {
            token = prefixData.prefix.ownership_validation_token || null;
          }
          console.log('[auto-create] fetched token from prefix:', token);
        } catch (e) {
          console.error('[auto-create] failed to fetch prefix details:', e);
        }
      }

      if (!token) {
        // Cannot proceed without a token - fall back to manual guide
        console.warn('[auto-create] No validation token available, falling back to manual guide');
        showPostCreationGuide(cidr, asn, '(token unavailable - check prefix details)');
        return;
      }

      postCreationState = { cidr: cidr, asn: asn, token: token, rir: '', rirSupported: false };
      var routeType = cidr.indexOf(':') !== -1 ? 'route6' : 'route';

      var html = '';
      html += '<div class="mb-3"><span class="badge-valid">Created</span> <span class="font-mono font-semibold" style="color:var(--text-strong)">' + escHtml(cidr) + '</span> (AS' + asn + ')</div>';
      html += '<div class="mb-3"><strong>Validation Token:</strong></div>';
      html += '<div class="p-2 rounded border border-cf-border font-mono text-[10px] mb-3" style="background:var(--card-bg)">' + escHtml(token) + '</div>';
      html += '<div class="mb-3 text-[10px]" style="color:var(--muted)">Automating BYO-ASN onboarding steps...</div>';

      // Step indicators
      html += '<div class="space-y-2">';
      html += '<div class="flex items-center gap-2 p-2 rounded border border-cf-border" id="auto-step-detect"><div class="spinner" style="width:12px;height:12px"></div> <span class="text-xs">Detecting RIR...</span></div>';
      if (irrAlreadyExists) {
        html += '<div class="flex items-center gap-2 p-2 rounded border border-cf-border" id="auto-step-route"><span class="badge-valid" style="min-width:14px;text-align:center">&#10003;</span> <span class="text-xs">' + routeType + ' object already exists &mdash; adding validation token</span></div>';
      } else {
        html += '<div class="flex items-center gap-2 p-2 rounded border border-cf-border text-cf-gray" id="auto-step-route"><span class="text-xs">Add validation token to ' + routeType + ' object</span></div>';
      }
      html += '<div class="flex items-center gap-2 p-2 rounded border border-cf-border text-cf-gray" id="auto-step-autnum"><span class="text-xs">Add validation token to aut-num object</span></div>';
      html += '<div class="flex items-center gap-2 p-2 rounded border border-cf-border text-cf-gray" id="auto-step-validate"><span class="text-xs">Request Cloudflare validation</span></div>';
      html += '</div>';

      // Fallback area for manual instructions if something fails
      html += '<div id="auto-fallback" class="hidden mt-3"></div>';

      document.getElementById('post-creation-guide-body').innerHTML = html;
      document.getElementById('post-creation-guide-modal').classList.remove('hidden');

      // Run the automated steps
      var anyFailed = false;
      var detectedRir = '';

      // Step 1: Detect RIR (try RDAP first, fall back to saved credentials)
      try {
        var r = await fetch('/api/rir/detect?prefix=' + encodeURIComponent(cidr));
        var d = await r.json();
        detectedRir = d.rir || '';
        postCreationState.rir = detectedRir;
        postCreationState.rirSupported = d.supported || false;

        if (d.supported) {
          document.getElementById('auto-step-detect').innerHTML = '<span class="badge-valid" style="min-width:14px;text-align:center">&#10003;</span> <span class="text-xs">RIR detected: <strong>' + escHtml(d.rir_name || detectedRir.toUpperCase()) + '</strong></span>';
        } else {
          // RDAP didn't return a supported RIR — try using saved credentials
          var credsFallback = savedValidationResult && savedValidationResult.rir_credentials ? savedValidationResult.rir_credentials : [];
          if (credsFallback.length > 0) {
            // Use the first saved credential's RIR
            detectedRir = credsFallback[0].rir.toLowerCase();
            postCreationState.rir = detectedRir;
            postCreationState.rirSupported = true;
            document.getElementById('auto-step-detect').innerHTML = '<span class="badge-valid" style="min-width:14px;text-align:center">&#10003;</span> <span class="text-xs">Using saved RIR API keys: <strong>' + escHtml(detectedRir.toUpperCase()) + '</strong></span>';
          } else {
            document.getElementById('auto-step-detect').innerHTML = '<span class="badge-invalid" style="min-width:14px;text-align:center">&#10007;</span> <span class="text-xs">RIR detected (' + escHtml(d.rir_name || 'unknown') + ') but automated creation not supported</span>';
            anyFailed = true;
          }
        }
      } catch (e) {
        // RDAP failed entirely — try using saved credentials
        var credsFallback2 = savedValidationResult && savedValidationResult.rir_credentials ? savedValidationResult.rir_credentials : [];
        if (credsFallback2.length > 0) {
          detectedRir = credsFallback2[0].rir.toLowerCase();
          postCreationState.rir = detectedRir;
          postCreationState.rirSupported = true;
          document.getElementById('auto-step-detect').innerHTML = '<span class="badge-valid" style="min-width:14px;text-align:center">&#10003;</span> <span class="text-xs">Using saved RIR API keys: <strong>' + escHtml(detectedRir.toUpperCase()) + '</strong></span>';
        } else {
          document.getElementById('auto-step-detect').innerHTML = '<span class="badge-invalid" style="min-width:14px;text-align:center">&#10007;</span> <span class="text-xs">RIR detection failed</span>';
          anyFailed = true;
        }
      }

      // Step 2: Create or update route object with validation token
      if (!anyFailed) {
        var routeAction = irrAlreadyExists ? 'update' : 'create';
        document.getElementById('auto-step-route').innerHTML = '<div class="spinner" style="width:12px;height:12px"></div> <span class="text-xs">Adding validation token to ' + routeType + ' at ' + detectedRir.toUpperCase() + '...</span>';
        try {
          var routeEndpoint = '/api/rir/ensure-route';
          var r = await fetch(routeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              account_id: activeAccountId,
              prefix: cidr,
              origin_asn: asn,
              validation_token: token,
              rir: detectedRir
            })
          });
          var d = await r.json();
          if (d.ok) {
            var routeVerb = d.action === 'created' ? 'Created' : d.action === 'already_present' ? 'Token already in' : 'Updated';
            document.getElementById('auto-step-route').innerHTML = '<span class="badge-valid" style="min-width:14px;text-align:center">&#10003;</span> <span class="text-xs">' + routeVerb + ' ' + routeType + ' at ' + detectedRir.toUpperCase() + '</span>';
          } else {
            document.getElementById('auto-step-route').innerHTML = '<span class="badge-invalid" style="min-width:14px;text-align:center">&#10007;</span> <span class="text-xs">' + routeType + ' failed: ' + escHtml(d.error || 'Unknown error') + '</span>';
            anyFailed = true;
          }
        } catch (e) {
          document.getElementById('auto-step-route').innerHTML = '<span class="badge-invalid" style="min-width:14px;text-align:center">&#10007;</span> <span class="text-xs">' + routeType + ' ' + routeAction + ' failed</span>';
          anyFailed = true;
        }
      }

      // Step 3: Update aut-num
      if (!anyFailed) {
        document.getElementById('auto-step-autnum').innerHTML = '<div class="spinner" style="width:12px;height:12px"></div> <span class="text-xs">Adding validation token to aut-num at ' + detectedRir.toUpperCase() + '...</span>';
        try {
          var r = await fetch('/api/rir/ensure-autnum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              account_id: activeAccountId,
              asn: asn,
              validation_token: token,
              rir: detectedRir,
              prefix: cidr
            })
          });
          var d = await r.json();
          if (d.ok) {
            var autnumVerb = d.action === 'created' ? 'Created' : d.action === 'already_present' ? 'Token already in' : 'Updated';
            document.getElementById('auto-step-autnum').innerHTML = '<span class="badge-valid" style="min-width:14px;text-align:center">&#10003;</span> <span class="text-xs">' + autnumVerb + ' aut-num (AS' + asn + ') at ' + detectedRir.toUpperCase() + '</span>';
          } else {
            document.getElementById('auto-step-autnum').innerHTML = '<span class="badge-invalid" style="min-width:14px;text-align:center">&#10007;</span> <span class="text-xs">aut-num failed: ' + escHtml(d.error || 'Unknown error') + '</span>';
            anyFailed = true;
          }
        } catch (e) {
          document.getElementById('auto-step-autnum').innerHTML = '<span class="badge-invalid" style="min-width:14px;text-align:center">&#10007;</span> <span class="text-xs">aut-num update failed</span>';
          anyFailed = true;
        }
      }

      // Step 4: Trigger Cloudflare validation
      if (!anyFailed && prefixId) {
        document.getElementById('auto-step-validate').innerHTML = '<div class="spinner" style="width:12px;height:12px"></div> <span class="text-xs">Requesting Cloudflare validation...</span>';
        try {
          var r = await fetch('/api/prefixes/' + encodeURIComponent(prefixId) + '/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_id: activeAccountId })
          });
          var d = await r.json();
          if (d.ok) {
            document.getElementById('auto-step-validate').innerHTML = '<span class="badge-valid" style="min-width:14px;text-align:center">&#10003;</span> <span class="text-xs">Validation requested &mdash; may take up to 10 minutes to complete</span>';
          } else {
            document.getElementById('auto-step-validate').innerHTML = '<span class="badge-pending" style="min-width:14px;text-align:center">&#9888;</span> <span class="text-xs">Validation request returned: ' + escHtml(d.error || 'pending') + '. You can re-validate from the prefix table.</span>';
          }
        } catch (e) {
          document.getElementById('auto-step-validate').innerHTML = '<span class="badge-pending" style="min-width:14px;text-align:center">&#9888;</span> <span class="text-xs">Could not trigger validation. Re-validate from the prefix table once RIR changes propagate.</span>';
        }
      }

      // Show fallback instructions if any step failed
      if (anyFailed) {
        var fb = document.getElementById('auto-fallback');
        var fbHtml = '<div class="p-3 rounded-lg border border-yellow-500/30" style="background:rgba(234,179,8,0.1)">';
        fbHtml += '<div class="text-red-500 font-semibold mb-1 text-[11px]">Some steps failed. Complete them manually:</div>';
        fbHtml += '<div class="text-[10px] space-y-1" style="color:var(--text-primary)">';
        fbHtml += '<div class="font-semibold">Validation Token:</div>';
        fbHtml += '<div class="p-2 rounded border border-cf-border font-mono" style="background:var(--input-bg);word-break:break-all">' + escHtml(token) + '</div>';
        fbHtml += '<div class="mt-2">Add to your <strong>' + routeType + '</strong> object:</div>';
        fbHtml += '<div class="p-2 rounded border border-cf-border font-mono" style="background:var(--input-bg)">';
        fbHtml += routeType + ': ' + escHtml(cidr) + '<br>origin: AS' + asn + '<br>descr: cf-validation: ' + escHtml(token);
        fbHtml += '</div>';
        fbHtml += '<div class="mt-2">Add to your <strong>aut-num</strong> object:</div>';
        fbHtml += '<div class="p-2 rounded border border-cf-border font-mono" style="background:var(--input-bg)">';
        fbHtml += 'aut-num: AS' + asn + '<br>descr: cf-validation: ' + escHtml(token);
        fbHtml += '</div>';
        fbHtml += '<div class="mt-2">Then click <strong>re-validate</strong> on the prefix in the table.</div>';
        fbHtml += '</div></div>';
        fb.innerHTML = fbHtml;
        fb.classList.remove('hidden');
      }

      // Refresh prefix list to pick up any validation state changes
      loadPrefixes();
    }

    function showPostCreationGuide(cidr, asn, token) {
      postCreationState = { cidr: cidr, asn: asn, token: token, rir: '', rirSupported: false };
      var isCustomAsn = asn !== 13335;
      var routeType = cidr.indexOf(':') !== -1 ? 'route6' : 'route';

      var html = '';
      html += '<div class="mb-3"><span class="badge-valid">Created</span> <span class="font-mono font-semibold" style="color:var(--text-strong)">' + escHtml(cidr) + '</span> (AS' + asn + ')</div>';
      html += '<div class="mb-2"><span class="text-[10px] font-semibold" style="color:var(--text-strong)">Validation Token:</span></div>';
      html += '<div class="mb-3 p-2 rounded-lg border border-cf-border font-mono text-[11px]" style="background:var(--input-bg);word-break:break-all">' + escHtml(token) + '</div>';
      html += '<div id="pcg-rir-detect" class="mb-3 text-[10px] text-cf-gray"><span class="animate-pulse">Detecting RIR...</span></div>';
      html += '<div class="font-semibold mb-2" style="color:var(--text-strong)">Next Steps: Complete Ownership Validation</div>';

      if (isCustomAsn) {
        // Step 1: Route object
        html += '<div class="space-y-3">';
        html += '<div class="p-3 rounded-lg border border-cf-border" style="background:var(--input-bg)">';
        html += '<div class="font-semibold mb-1" style="color:var(--text-strong)">Step 1: Add validation token to ' + routeType + ' object</div>';
        html += '<div class="p-2 rounded border border-cf-border font-mono text-[10px] mb-2" style="background:var(--card-bg)">';
        html += routeType + ': ' + escHtml(cidr) + '<br>';
        html += 'origin: AS' + asn + '<br>';
        html += 'descr: cf-validation: ' + escHtml(token);
        html += '</div>';
        html += '<div id="pcg-route-actions"></div>';
        html += '<div id="pcg-route-status" class="mt-1"></div>';
        html += '</div>';

        // Step 2: aut-num object
        html += '<div class="p-3 rounded-lg border border-cf-border" style="background:var(--input-bg)">';
        html += '<div class="font-semibold mb-1" style="color:var(--text-strong)">Step 2: Add validation token to aut-num object</div>';
        html += '<div class="p-2 rounded border border-cf-border font-mono text-[10px] mb-2" style="background:var(--card-bg)">';
        html += 'aut-num: AS' + asn + '<br>';
        html += 'descr: cf-validation: ' + escHtml(token);
        html += '</div>';
        html += '<div id="pcg-autnum-actions"></div>';
        html += '<div id="pcg-autnum-status" class="mt-1"></div>';
        html += '</div>';

        // Step 3: Re-validate
        html += '<div class="p-3 rounded-lg border border-cf-border" style="background:var(--input-bg)">';
        html += '<div class="font-semibold mb-1" style="color:var(--text-strong)">Step 3: Validate</div>';
        html += '<div class="text-[10px]">Wait for RIR changes to propagate, then click the <strong>re-validate</strong> button on the prefix in the table.</div>';
        html += '</div>';

        // Validation states info
        html += '<div class="p-2 rounded-lg border border-yellow-500/30" style="background:rgba(234,179,8,0.1)">';
        html += '<div class="text-red-500 font-semibold mb-1 text-[11px]">BYO-ASN requires all four validation states:</div>';
        html += '<div class="text-[10px] space-y-0.5">';
        html += '<div>&bull; <strong>irr_validation_state</strong> &mdash; exact route/route6 with correct origin</div>';
        html += '<div>&bull; <strong>rpki_validation_state</strong> &mdash; valid ROA authorizing your ASN</div>';
        html += '<div>&bull; <strong>ownership_validation_state</strong> &mdash; token in route/route6 object</div>';
        html += '<div>&bull; <strong>asn_ownership_validation_state</strong> &mdash; token in aut-num object</div>';
        html += '</div></div>';

        html += '<div class="text-[10px]" style="color:var(--muted)">ASN ownership is proven once per account. Each additional prefix needs its own prefix and RPKI validation.</div>';
        html += '</div>';
      } else {
        // Cloudflare ASN flow
        html += '<div class="space-y-3">';
        html += '<div class="p-3 rounded-lg border border-cf-border" style="background:var(--input-bg)">';
        html += '<div class="font-semibold mb-1" style="color:var(--text-strong)">Step 1: Add validation token to ' + routeType + ' object</div>';
        html += '<div class="p-2 rounded border border-cf-border font-mono text-[10px] mb-2" style="background:var(--card-bg)">';
        html += routeType + ': ' + escHtml(cidr) + '<br>';
        html += 'origin: AS' + asn + '<br>';
        html += 'descr: cf-validation: ' + escHtml(token);
        html += '</div>';
        html += '<div id="pcg-route-actions"></div>';
        html += '<div id="pcg-route-status" class="mt-1"></div>';
        html += '</div>';

        html += '<div class="p-3 rounded-lg border border-cf-border" style="background:var(--input-bg)">';
        html += '<div class="font-semibold mb-1" style="color:var(--text-strong)">Step 2: Validate</div>';
        html += '<div class="text-[10px]">Wait for changes to propagate, then click the <strong>re-validate</strong> button on the prefix in the table.</div>';
        html += '<div class="mt-1 text-[10px]" style="color:var(--muted)">Cloudflare manages IRR and ROA records for ASN 13335. You only need to prove ownership.</div>';
        html += '</div>';
        html += '</div>';
      }

      document.getElementById('post-creation-guide-body').innerHTML = html;
      document.getElementById('post-creation-guide-modal').classList.remove('hidden');

      // Auto-detect RIR
      detectRirAndRenderActions(cidr, asn, token);
    }

    async function detectRirAndRenderActions(cidr, asn, token) {
      var detectEl = document.getElementById('pcg-rir-detect');
      try {
        var r = await fetch('/api/rir/detect?prefix=' + encodeURIComponent(cidr));
        var data = await r.json();
        postCreationState.rir = data.rir || '';
        postCreationState.rirSupported = data.supported || false;

        if (data.rir && data.supported) {
          detectEl.innerHTML = '<span class="badge-valid">' + escHtml(data.rir_name || data.rir.toUpperCase()) + '</span> detected &mdash; automated creation available';
        } else if (data.rir) {
          detectEl.innerHTML = '<span class="badge-warning">' + escHtml(data.rir_name || data.rir.toUpperCase()) + '</span> detected &mdash; automated creation not available for this RIR';
        } else {
          detectEl.innerHTML = '<span class="text-cf-gray">Could not detect RIR</span>';
        }
      } catch (e) {
        detectEl.innerHTML = '<span class="text-cf-gray">RIR detection failed</span>';
      }

      renderRirActionButtons(cidr, asn, token);
    }

    function renderRirActionButtons(cidr, asn, token) {
      var rir = postCreationState.rir;
      var supported = postCreationState.rirSupported;

      // Route object actions
      var routeEl = document.getElementById('pcg-route-actions');
      if (routeEl) {
        var html = '';
        if (supported) {
          html += '<button onclick="pcgCreateRoute()" id="pcg-route-btn" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">';
          html += 'Add token to ' + (cidr.indexOf(':') !== -1 ? 'route6' : 'route') + ' at ' + rir.toUpperCase();
          html += '</button>';
        }
        // Inline credential fallback
        html += '<div class="mt-2">';
        html += '<details class="text-[10px]"><summary class="cursor-pointer text-cf-gray hover:text-cf-orange">' + (supported ? 'Or use different API keys' : 'Enter RIR API keys to create automatically') + '</summary>';
        html += '<div class="mt-1 flex gap-2 items-end flex-wrap">';
        html += '<div><label class="block text-[10px] text-cf-gray">RIR</label><select id="pcg-route-rir" class="px-2 py-1 rounded border border-cf-border bg-cf-dark text-[11px] text-white">';
        html += '<option value="arin"' + (rir === 'arin' ? ' selected' : '') + '>ARIN</option>';
        html += '<option value="ripe"' + (rir === 'ripe' ? ' selected' : '') + '>RIPE</option>';
        html += '</select></div>';
        html += '<div><label class="block text-[10px] text-cf-gray">API Key</label><input id="pcg-route-apikey" type="password" class="px-2 py-1 rounded border border-cf-border bg-cf-dark text-[11px] text-white w-40" placeholder="API key"></div>';
        html += '<div><label class="block text-[10px] text-cf-gray">Org ID</label><input id="pcg-route-mnt" type="text" class="px-2 py-1 rounded border border-cf-border bg-cf-dark text-[11px] text-white w-28" placeholder="e.g. DC-403"></div>';
        html += '<button onclick="pcgCreateRouteInline()" class="px-2 py-1 bg-cf-orange text-white text-[10px] font-medium rounded hover:bg-orange-600">Submit</button>';
        html += '</div></details></div>';
        routeEl.innerHTML = html;
      }

      // aut-num actions (BYO-ASN only)
      var autnumEl = document.getElementById('pcg-autnum-actions');
      if (autnumEl) {
        var html = '';
        if (supported) {
          html += '<button onclick="pcgUpdateAutnum()" id="pcg-autnum-btn" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">';
          html += 'Add token to aut-num at ' + rir.toUpperCase();
          html += '</button>';
        }
        html += '<div class="mt-2">';
        html += '<details class="text-[10px]"><summary class="cursor-pointer text-cf-gray hover:text-cf-orange">' + (supported ? 'Or use different API keys' : 'Enter RIR API keys to update automatically') + '</summary>';
        html += '<div class="mt-1 flex gap-2 items-end flex-wrap">';
        html += '<div><label class="block text-[10px] text-cf-gray">RIR</label><select id="pcg-autnum-rir" class="px-2 py-1 rounded border border-cf-border bg-cf-dark text-[11px] text-white">';
        html += '<option value="arin"' + (rir === 'arin' ? ' selected' : '') + '>ARIN</option>';
        html += '<option value="ripe"' + (rir === 'ripe' ? ' selected' : '') + '>RIPE</option>';
        html += '</select></div>';
        html += '<div><label class="block text-[10px] text-cf-gray">API Key</label><input id="pcg-autnum-apikey" type="password" class="px-2 py-1 rounded border border-cf-border bg-cf-dark text-[11px] text-white w-40" placeholder="API key"></div>';
        html += '<div><label class="block text-[10px] text-cf-gray">Org ID</label><input id="pcg-autnum-mnt" type="text" class="px-2 py-1 rounded border border-cf-border bg-cf-dark text-[11px] text-white w-28" placeholder="e.g. DC-403"></div>';
        html += '<button onclick="pcgUpdateAutnumInline()" class="px-2 py-1 bg-cf-orange text-white text-[10px] font-medium rounded hover:bg-orange-600">Submit</button>';
        html += '</div></details></div>';
        autnumEl.innerHTML = html;
      }
    }

    // Create route object using saved credentials
    async function pcgCreateRoute() {
      var btn = document.getElementById('pcg-route-btn');
      var statusEl = document.getElementById('pcg-route-status');
      if (btn) { btn.disabled = true; btn.textContent = 'Creating...'; }
      statusEl.innerHTML = '<span class="text-cf-gray text-[10px] animate-pulse">Sending to ' + postCreationState.rir.toUpperCase() + '...</span>';

      var r = await fetch('/api/rir/ensure-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: activeAccountId,
          prefix: postCreationState.cidr,
          origin_asn: postCreationState.asn,
          validation_token: postCreationState.token,
          rir: postCreationState.rir
        })
      });
      var data = await r.json();
      if (data.ok) {
        statusEl.innerHTML = '<span class="badge-valid">Route object created</span>';
        if (btn) { btn.textContent = 'Done'; btn.className = btn.className.replace('bg-cf-orange', 'bg-green-600').replace('hover:bg-orange-600', ''); }
      } else {
        statusEl.innerHTML = '<span class="badge-invalid">' + escHtml(data.error || 'Failed') + '</span>' + (data.details ? '<div class="text-[10px] text-cf-gray mt-1">' + escHtml(data.details) + '</div>' : '');
        if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
      }
    }

    // Create route object using inline credentials
    async function pcgCreateRouteInline() {
      var rir = document.getElementById('pcg-route-rir').value;
      var apiKey = document.getElementById('pcg-route-apikey').value.trim();
      var mnt = document.getElementById('pcg-route-mnt').value.trim();
      var statusEl = document.getElementById('pcg-route-status');
      if (!apiKey) { showInlineMsg('pcg-route-status', 'API key is required.', 'error'); return; }
      if (rir === 'ripe' && !mnt) { showInlineMsg('pcg-route-status', 'RIPE requires a maintainer (mnt-by).', 'error'); return; }

      statusEl.innerHTML = '<span class="text-cf-gray text-[10px] animate-pulse">Creating at ' + rir.toUpperCase() + '...</span>';

      var r = await fetch('/api/rir/ensure-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: activeAccountId,
          prefix: postCreationState.cidr,
          origin_asn: postCreationState.asn,
          validation_token: postCreationState.token,
          rir: rir,
          api_key: apiKey,
          maintainer: mnt
        })
      });
      var data = await r.json();
      if (data.ok) {
        statusEl.innerHTML = '<span class="badge-valid">Route object created at ' + rir.toUpperCase() + '</span>';
      } else {
        statusEl.innerHTML = '<span class="badge-invalid">' + escHtml(data.error || 'Failed') + '</span>' + (data.details ? '<div class="text-[10px] text-cf-gray mt-1">' + escHtml(data.details) + '</div>' : '');
      }
    }

    // Update aut-num using saved credentials
    async function pcgUpdateAutnum() {
      var btn = document.getElementById('pcg-autnum-btn');
      var statusEl = document.getElementById('pcg-autnum-status');
      if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }
      statusEl.innerHTML = '<span class="text-cf-gray text-[10px] animate-pulse">Updating aut-num at ' + postCreationState.rir.toUpperCase() + '...</span>';

      var r = await fetch('/api/rir/ensure-autnum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: activeAccountId,
          asn: postCreationState.asn,
          validation_token: postCreationState.token,
          rir: postCreationState.rir
        })
      });
      var data = await r.json();
      if (data.ok) {
        statusEl.innerHTML = '<span class="badge-valid">aut-num updated</span>' + (data.details ? '<span class="text-[10px] text-cf-gray ml-1">' + escHtml(data.details) + '</span>' : '');
        if (btn) { btn.textContent = 'Done'; btn.className = btn.className.replace('bg-cf-orange', 'bg-green-600').replace('hover:bg-orange-600', ''); }
      } else {
        statusEl.innerHTML = '<span class="badge-invalid">' + escHtml(data.error || 'Failed') + '</span>' + (data.details ? '<div class="text-[10px] text-cf-gray mt-1">' + escHtml(data.details) + '</div>' : '');
        if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
      }
    }

    // Update aut-num using inline credentials
    async function pcgUpdateAutnumInline() {
      var rir = document.getElementById('pcg-autnum-rir').value;
      var apiKey = document.getElementById('pcg-autnum-apikey').value.trim();
      var mnt = document.getElementById('pcg-autnum-mnt').value.trim();
      var statusEl = document.getElementById('pcg-autnum-status');
      if (!apiKey) { showInlineMsg('pcg-autnum-status', 'API key is required.', 'error'); return; }

      statusEl.innerHTML = '<span class="text-cf-gray text-[10px] animate-pulse">Updating aut-num at ' + rir.toUpperCase() + '...</span>';

      var r = await fetch('/api/rir/ensure-autnum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: activeAccountId,
          asn: postCreationState.asn,
          validation_token: postCreationState.token,
          rir: rir,
          api_key: apiKey,
          maintainer: mnt
        })
      });
      var data = await r.json();
      if (data.ok) {
        statusEl.innerHTML = '<span class="badge-valid">aut-num updated at ' + rir.toUpperCase() + '</span>' + (data.details ? '<span class="text-[10px] text-cf-gray ml-1">' + escHtml(data.details) + '</span>' : '');
      } else {
        statusEl.innerHTML = '<span class="badge-invalid">' + escHtml(data.error || 'Failed') + '</span>' + (data.details ? '<div class="text-[10px] text-cf-gray mt-1">' + escHtml(data.details) + '</div>' : '');
      }
    }

    function closePostCreationGuide() {
      document.getElementById('post-creation-guide-modal').classList.add('hidden');
    }

    // ─── RDAP Whois Tooltip ────────────────────────────────────────
    async function showRdap(cidr, el) {
      var tipEl = el.querySelector('.rdap-tip');
      if (!tipEl) return;
      if (rdapCache[cidr]) {
        tipEl.innerHTML = formatRdap(rdapCache[cidr]);
        positionTooltip(el, tipEl);
        return;
      }
      tipEl.innerHTML = '<div class="rdap-row"><span class="rdap-label">Loading...</span></div>';
      positionTooltip(el, tipEl);
      try {
        var resp = await fetch('/api/rdap?prefix=' + encodeURIComponent(cidr));
        var data = await resp.json();
        if (data.result) {
          rdapCache[cidr] = data.result;
          tipEl.innerHTML = formatRdap(data.result);
        } else {
          tipEl.innerHTML = '<div class="rdap-row"><span class="rdap-val" style="color:#ef4444">Lookup failed</span></div>';
        }
        positionTooltip(el, tipEl);
      } catch (e) {
        tipEl.innerHTML = '<div class="rdap-row"><span class="rdap-val" style="color:#ef4444">Lookup failed</span></div>';
        positionTooltip(el, tipEl);
      }
    }

    function formatRdap(r) {
      var rows = [];
      if (r.name) rows.push('<div class="rdap-row"><span class="rdap-label">Name</span><span class="rdap-val">' + escHtml(r.name) + '</span></div>');
      if (r.org) rows.push('<div class="rdap-row"><span class="rdap-label">Org</span><span class="rdap-val">' + escHtml(r.org) + '</span></div>');
      if (r.country) rows.push('<div class="rdap-row"><span class="rdap-label">Country</span><span class="rdap-val">' + escHtml(r.country) + '</span></div>');
      if (r.rir) rows.push('<div class="rdap-row"><span class="rdap-label">RIR</span><span class="rdap-val">' + escHtml(r.rir) + '</span></div>');
      if (r.allocated) rows.push('<div class="rdap-row"><span class="rdap-label">Allocated</span><span class="rdap-val">' + escHtml(r.allocated) + '</span></div>');
      if (r.range) rows.push('<div class="rdap-row"><span class="rdap-label">Range</span><span class="rdap-val font-mono" style="font-size:10px">' + escHtml(r.range) + '</span></div>');
      return rows.length > 0 ? rows.join('') : '<div class="rdap-row"><span class="rdap-val">No data</span></div>';
    }

    // ─── RPKI Details Hover ──────────────────────────────────────
    async function showRpkiDetails(cidr, state, el) {
      var tipEl = el.querySelector('.validation-tip');
      if (!tipEl) return;
      if (rpkiCache[cidr]) {
        tipEl.innerHTML = formatRpkiDetails(rpkiCache[cidr], state, cidr);
        positionTooltip(el, tipEl);
        return;
      }
      tipEl.innerHTML = '<div class="rdap-row"><span class="rdap-label">Loading ROA data...</span></div>';
      positionTooltip(el, tipEl);
      try {
        var resp = await fetch('/api/rpki?prefix=' + encodeURIComponent(cidr) + '&account_id=' + encodeURIComponent(activeAccountId));
        var data = await resp.json();
        if (data.result) {
          rpkiCache[cidr] = data.result;
          tipEl.innerHTML = formatRpkiDetails(data.result, state, cidr);
        } else {
          tipEl.innerHTML = formatRpkiDetails(null, state, cidr);
        }
        positionTooltip(el, tipEl);
      } catch (e) {
        tipEl.innerHTML = formatRpkiDetails(null, state, cidr);
        positionTooltip(el, tipEl);
      }
    }

    function formatRpkiDetails(result, state, cidr) {
      var rows = [];
      // Static explanation of validation state
      var stateText = validationTooltipText(state, 'rpki');
      rows.push('<div style="margin-bottom:6px">' + stateText + '</div>');

      if (result && result.prefix_origins && result.prefix_origins.length > 0) {
        rows.push('<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px">');
        rows.push('<div style="font-weight:600;margin-bottom:4px;color:var(--text-strong)">Live ROA Data</div>');
        for (var i = 0; i < result.prefix_origins.length; i++) {
          var po = result.prefix_origins[i];
          var rpkiBadgeClass = po.rpki_validation === 'VALID' || po.rpki_validation === 'valid' ? 'badge-valid' :
            po.rpki_validation === 'INVALID' || po.rpki_validation === 'invalid' ? 'badge-invalid' : 'badge-unknown';
          var rpkiLabel = po.rpki_validation || 'unknown';
          rows.push('<div class="rdap-row" style="margin-bottom:2px"><span class="rdap-label">Origin</span><span class="rdap-val">AS' + po.origin + '</span></div>');
          rows.push('<div class="rdap-row" style="margin-bottom:2px"><span class="rdap-label">Prefix</span><span class="rdap-val font-mono" style="font-size:10px">' + escHtml(po.prefix) + '</span></div>');
          rows.push('<div class="rdap-row" style="margin-bottom:2px"><span class="rdap-label">RPKI</span><span class="' + rpkiBadgeClass + '" style="font-size:10px">' + escHtml(rpkiLabel) + '</span></div>');
          rows.push('<div class="rdap-row" style="margin-bottom:4px"><span class="rdap-label">Peers</span><span class="rdap-val">' + po.peer_count + (result.total_peers ? ' / ' + result.total_peers : '') + '</span></div>');
          if (i < result.prefix_origins.length - 1) {
            rows.push('<div style="border-top:1px solid var(--border);margin:4px 0"></div>');
          }
        }
        rows.push('</div>');
      } else if (result) {
        rows.push('<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px;color:var(--muted)">No ROA entries found in global routing tables.</div>');
      }

      // Link to RPKI Portal with pre-populated ASN and prefix
      var rpkiPortalHref = 'https://rpki.cloudflare.com/';
      if (result && result.prefix_origins && result.prefix_origins.length > 0 && result.prefix_origins[0].origin) {
        rpkiPortalHref += '?view=validator&validateRoute=' + encodeURIComponent(result.prefix_origins[0].origin + '_' + cidr);
      } else if (cidr) {
        rpkiPortalHref += '?view=validator&prefix=' + encodeURIComponent(cidr);
      }
      rows.push('<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:6px"><a href="' + rpkiPortalHref + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:#F6821F;text-decoration:none;font-weight:500;font-size:11px">View on Cloudflare RPKI Portal &#8599;</a></div>');

      return rows.join('');
    }

    // ─── Prefix Re-validation ─────────────────────────────────────
    async function revalidatePrefix(prefixId) {
      if (!activeAccountId) return;
      var btn = event.target.closest('button');
      if (btn) btn.disabled = true;
      try {
        var resp = await fetch('/api/prefixes/' + encodeURIComponent(prefixId) + '/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          loadPrefixes();
          refreshActivityLog();
        } else {
          showInlineMsg('prefix-msg', 'Validation failed: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (e) {
        showInlineMsg('prefix-msg', 'Validation request failed: ' + e.message, 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    // ─── Looking Glass ────────────────────────────────────────────
    var lgState = {
      result: null,
      prefix: '',
      isIPv6: false,
      asnInfoMap: {},
      rpkiMap: {},
      originAsns: new Set(),
      taintedAsns: new Set(),
      showTier1: true,
      filterAsn: '',
      showRpkiValid: true,
      showRpkiInvalid: true,
      filterCollector: '',
      showVisibility: false,
      ripestatVisibility: null,
      showRoutes: false,
      expandedCollectors: {},
      refreshInterval: null,
      refreshCountdown: 0,
      refreshSeconds: 30,
      // SVG pan/zoom state
      viewBox: { x: 0, y: 0, w: 800, h: 400 },
      baseViewBox: { x: 0, y: 0, w: 800, h: 400 },
      isPanning: false,
      panStart: { x: 0, y: 0 },
      panVBStart: { x: 0, y: 0 }
    };

    // Tier-1 ASes
    var TIER1_IPV4 = [6762, 12956, 2914, 3356, 6453, 1239, 701, 6461, 3257, 1299, 3491, 7018, 3320, 5511, 6830, 174];
    var TIER1_IPV6 = TIER1_IPV4.concat([6939]);
    var TIER1_ALL_SET = {};
    TIER1_IPV4.concat([6939]).forEach(function(a) { TIER1_ALL_SET[a] = true; });

    function lgTier1Set() { return lgState.isIPv6 ? TIER1_IPV6 : TIER1_IPV4; }

    function lgIsTier1(asn) { var s = lgTier1Set(); for (var i=0;i<s.length;i++) if (s[i]===asn) return true; return false; }

    function lgTruncatePath(path) {
      var s = lgTier1Set();
      for (var i = 0; i < path.length; i++) {
        for (var j=0;j<s.length;j++) { if (s[j]===path[i]) return path.slice(i); }
      }
      return path;
    }

    function lgPathReachesTier1(path) {
      var s = lgTier1Set();
      for (var i=0;i<path.length;i++) for (var j=0;j<s.length;j++) if (s[j]===path[i]) return true;
      return false;
    }

    function lgCleanPath(path) {
      if (!path || path.length === 0) return [];
      var c = [path[0]];
      for (var i=1;i<path.length;i++) if (path[i]!==path[i-1]) c.push(path[i]);
      return c;
    }

    function lgCountryFlag(code) {
      if (!code || code.length !== 2) return '';
      var u = code.toUpperCase();
      return String.fromCodePoint(0x1F1E6 + u.charCodeAt(0) - 65) + String.fromCodePoint(0x1F1E6 + u.charCodeAt(1) - 65);
    }

    function lgGetName(asn) {
      var info = lgState.asnInfoMap[asn];
      if (!info) return '';
      var name = info.org_name || info.as_name || '';
      if (TIER1_ALL_SET[asn]) return name.split(/\\s+/)[0] || name;
      return name.length > 16 ? name.substring(0, 15) + '\\u2026' : name;
    }

    function lgRelativeTime(ts) {
      if (!ts) return '\\u2014';
      var diff = (Date.now() - new Date(ts).getTime()) / 1000;
      if (diff < 0) return 'just now';
      if (diff < 60) return Math.floor(diff) + 's ago';
      if (diff < 3600) return Math.floor(diff/60) + 'm ago';
      if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
      return Math.floor(diff/86400) + 'd ago';
    }

    function lgGetFilteredRoutes() {
      var routes = lgState.result ? lgState.result.routes : [];
      return routes.filter(function(r) {
        if (!r.as_path || r.as_path.length === 0) return false;
        if (lgState.filterCollector && r.collector !== lgState.filterCollector) return false;
        if (lgState.filterAsn) {
          var fa = parseInt(lgState.filterAsn);
          if (!isNaN(fa) && r.as_path.indexOf(fa) === -1) return false;
        }
        var origin = r.as_path[r.as_path.length - 1];
        var rpki = lgState.rpkiMap[origin];
        if (rpki === 'valid' && !lgState.showRpkiValid) return false;
        if (rpki === 'invalid' && !lgState.showRpkiInvalid) return false;
        return true;
      });
    }

    function lgGetProcessedPaths(filtered) {
      var result = [];
      for (var i = 0; i < filtered.length; i++) {
        var cleaned = lgCleanPath(filtered[i].as_path);
        if (lgState.showTier1) {
          // In Tier-1 mode, only include paths that reach a Tier-1 AS,
          // and truncate them at the first Tier-1 (from collector side)
          if (lgPathReachesTier1(cleaned)) {
            result.push(lgTruncatePath(cleaned));
          }
          // Skip paths that don't reach Tier-1 entirely
        } else {
          result.push(cleaned);
        }
      }
      return result;
    }

    // Check if tier-1 truncation produces empty result or misses filtered ASN
    function lgShouldForceFullPaths(filtered) {
      if (filtered.length === 0) return false;
      var hasTier1 = false;
      for (var i=0;i<filtered.length;i++) {
        if (lgPathReachesTier1(lgCleanPath(filtered[i].as_path))) { hasTier1 = true; break; }
      }
      if (!hasTier1) return true;
      if (lgState.filterAsn) {
        var fa = parseInt(lgState.filterAsn);
        if (!isNaN(fa)) {
          var found = false;
          for (var i=0;i<filtered.length;i++) {
            var t = lgTruncatePath(lgCleanPath(filtered[i].as_path));
            if (t.indexOf(fa) !== -1) { found = true; break; }
          }
          if (!found) {
            for (var i=0;i<filtered.length;i++) {
              if (lgCleanPath(filtered[i].as_path).indexOf(fa) !== -1) return true;
            }
          }
        }
      }
      return false;
    }

    function lgBuildGraph(paths) {
      var nodeIds = {};
      var edgeKeys = {};
      var edges = [];
      var originAsns = lgState.originAsns;

      for (var p=0;p<paths.length;p++) {
        var reversed = paths[p].slice().reverse();
        for (var n=0;n<reversed.length;n++) {
          nodeIds[reversed[n]] = true;
          if (n > 0) {
            var ek = reversed[n-1] + '->' + reversed[n];
            if (!edgeKeys[ek]) { edgeKeys[ek] = true; edges.push({from: reversed[n-1], to: reversed[n]}); }
          }
        }
      }

      var nodes = Object.keys(nodeIds).map(Number);
      if (nodes.length === 0) return { nodes: [], edges: [], positions: {} };

      // Use dagre for layout
      var g = new dagre.graphlib.Graph();
      g.setDefaultEdgeLabel(function() { return {}; });
      g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 120, marginx: 30, marginy: 30 });

      var nw = 150, nh = 46;
      nodes.forEach(function(asn) { g.setNode(String(asn), { width: nw, height: nh }); });
      edges.forEach(function(e) { g.setEdge(String(e.from), String(e.to)); });
      dagre.layout(g);

      var positions = {};
      nodes.forEach(function(asn) {
        var nd = g.node(String(asn));
        positions[asn] = { x: nd.x - nw/2, y: nd.y - nh/2 };
      });

      return { nodes: nodes, edges: edges, positions: positions, nodeWidth: nw, nodeHeight: nh };
    }

    function lgRenderSvg(graph) {
      var nodes = graph.nodes, edges = graph.edges, positions = graph.positions;
      var nw = graph.nodeWidth || 150, nh = graph.nodeHeight || 46;
      if (nodes.length === 0) return '<div class="text-center py-8 text-cf-gray text-xs">No routes to display with current filters</div>';

      // Compute bounds
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(function(asn) {
        var p = positions[asn];
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x + nw > maxX) maxX = p.x + nw;
        if (p.y + nh > maxY) maxY = p.y + nh;
      });
      var pad = 40;
      var vbX = minX - pad, vbY = minY - pad, vbW = (maxX - minX) + 2*pad, vbH = (maxY - minY) + 2*pad;
      lgState.baseViewBox = { x: vbX, y: vbY, w: vbW, h: vbH };
      lgState.viewBox = { x: vbX, y: vbY, w: vbW, h: vbH };

      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      var edgeColor = '#8A2BE2';
      var textColor = isLight ? '#111827' : '#E5E7EB';
      var subTextColor = isLight ? '#6B7280' : '#8B949E';
      var defaultFill = isLight ? '#FFFFFF' : '#1F2937';
      var defaultStroke = isLight ? '#D1D5DB' : '#374151';

      var svg = '<svg id="lg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="' + vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" class="lg-graph-svg" style="height:500px;">';
      svg += '<defs><marker id="lg-arrow" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto"><path d="M0,0 L10,4 L0,8" fill="' + edgeColor + '" opacity="0.7"/></marker></defs>';

      // Edges
      edges.forEach(function(e) {
        var fp = positions[e.from], tp = positions[e.to];
        if (!fp || !tp) return;
        var x1 = fp.x + nw, y1 = fp.y + nh/2, x2 = tp.x, y2 = tp.y + nh/2;
        var cpx = (x1 + x2) / 2;
        svg += '<path class="lg-edge" d="M' + x1 + ',' + y1 + ' C' + cpx + ',' + y1 + ' ' + cpx + ',' + y2 + ' ' + x2 + ',' + y2 + '" stroke="' + edgeColor + '" marker-end="url(#lg-arrow)"/>';
      });

      // Nodes
      nodes.forEach(function(asn) {
        var p = positions[asn];
        if (!p) return;
        var info = lgState.asnInfoMap[asn] || {};
        var isOrigin = lgState.originAsns.has(asn);
        var rpki = isOrigin ? (lgState.rpkiMap[asn] || null) : null;
        var isTainted = lgState.taintedAsns.has(asn) && rpki !== 'invalid';
        var isFiltered = lgState.filterAsn && String(asn) === lgState.filterAsn;

        var fill = defaultFill, stroke = defaultStroke, strokeW = 1.5;
        if (rpki === 'valid') { stroke = '#4ade80'; fill = isLight ? '#F0FDF4' : '#052E16'; }
        else if (rpki === 'invalid') { stroke = '#f87171'; fill = isLight ? '#FEF2F2' : '#450A0A'; strokeW = 2; }
        else if (isTainted) { stroke = '#fbbf24'; fill = isLight ? '#FFFBEB' : '#422006'; }
        if (isFiltered) { strokeW = 2.5; stroke = '#6366f1'; }

        var flag = lgCountryFlag(info.country_code || '');
        var name = lgGetName(asn);
        var rpkiIcon = '';
        if (rpki === 'valid') rpkiIcon = ' <tspan fill="#16a34a" font-size="11">\\u2713</tspan>';
        else if (rpki === 'invalid') rpkiIcon = ' <tspan fill="#dc2626" font-size="11">\\u2717</tspan>';

        svg += '<g class="lg-node" onclick="lgToggleAsnFilter(' + asn + ')" transform="translate(' + p.x + ',' + p.y + ')">';
        svg += '<rect width="' + nw + '" height="' + nh + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeW + '" rx="6"/>';
        svg += '<text x="' + (nw/2) + '" y="18" text-anchor="middle" fill="' + textColor + '" font-size="13" font-weight="600" font-family="Inter,system-ui,sans-serif">AS ' + asn + rpkiIcon + '</text>';
        if (flag || name) {
          svg += '<text x="' + (nw/2) + '" y="34" text-anchor="middle" fill="' + subTextColor + '" font-size="10" font-family="Inter,system-ui,sans-serif">' + flag + (flag && name ? ' ' : '') + escHtml(name) + '</text>';
        }
        svg += '</g>';
      });

      svg += '</svg>';
      return svg;
    }

    function lgRenderFilters() {
      var routes = lgState.result ? lgState.result.routes : [];
      var meta = lgState.result ? lgState.result.meta : {};
      var collectors = meta.collectors || [];

      // Count RPKI
      var preRpki = routes.filter(function(r) {
        if (!r.as_path || r.as_path.length === 0) return false;
        if (lgState.filterCollector && r.collector !== lgState.filterCollector) return false;
        if (lgState.filterAsn) { var fa = parseInt(lgState.filterAsn); if (!isNaN(fa) && r.as_path.indexOf(fa) === -1) return false; }
        return true;
      });
      var validCount = 0, invalidCount = 0;
      preRpki.forEach(function(r) {
        var origin = r.as_path[r.as_path.length - 1];
        var rpki = lgState.rpkiMap[origin];
        if (rpki === 'valid') validCount++;
        else if (rpki === 'invalid') invalidCount++;
      });

      var collectorsHtml = '<select onchange="lgState.filterCollector=this.value;lgRefresh()" style="min-width:130px">';
      collectorsHtml += '<option value="">All collectors (' + collectors.length + ')</option>';
      collectors.forEach(function(c) {
        var sel = lgState.filterCollector === c.collector ? ' selected' : '';
        collectorsHtml += '<option value="' + escAttr(c.collector) + '"' + sel + '>' + escHtml(c.collector) + ' (' + c.peers_count + ' peers)</option>';
      });
      collectorsHtml += '</select>';

      var html = '<div class="lg-filter-bar">';
      html += collectorsHtml;
      html += '<label style="gap:2px"><span style="font-weight:500">ASN filter</span> <input type="text" value="' + escAttr(lgState.filterAsn) + '" placeholder="Filter..." oninput="lgState.filterAsn=this.value;lgRefresh()" style="width:90px"></label>';
      if (lgState.filterAsn) html += '<button onclick="lgState.filterAsn=\\'\\';lgRefresh()" style="font-size:12px;color:var(--muted);cursor:pointer;background:none;border:none">&times;</button>';
      html += '<label><input type="checkbox" ' + (lgState.showRpkiValid ? 'checked' : '') + ' onchange="lgState.showRpkiValid=this.checked;lgRefresh()"> RPKI valid (' + validCount + ')</label>';
      html += '<label><input type="checkbox" ' + (lgState.showRpkiInvalid ? 'checked' : '') + ' onchange="lgState.showRpkiInvalid=this.checked;lgRefresh()"> RPKI invalid (' + invalidCount + ')</label>';
      // Refresh controls (right-justified)
      var isRunning = !!lgState.refreshInterval;
      html += '<div class="lg-refresh-bar" style="margin-left:auto">';
      if (isRunning) {
        html += '<span class="lg-refresh-dot active"></span>';
        html += '<span id="lg-refresh-countdown">' + lgState.refreshCountdown + 's</span>';
        html += '<button onclick="lgStopRefresh()" style="font-size:10px;padding:2px 8px;border-radius:4px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-primary);cursor:pointer">Stop</button>';
      } else {
        html += '<button onclick="lgStartRefresh()" style="font-size:10px;padding:2px 8px;border-radius:4px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-primary);cursor:pointer">Auto (30s)</button>';
      }
      html += '<button onclick="lgManualRefresh()" style="font-size:10px;padding:2px 8px;border-radius:4px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-primary);cursor:pointer" title="Refresh now">&#x21bb;</button>';
      html += '</div>';
      html += '</div>';
      return html;
    }

    function lgRenderPathToggle(filtered, forceFullMsg) {
      var disableTier1 = !!forceFullMsg;
      var html = '<div style="display:flex;align-items:center;gap:8px;margin:8px 0">';
      html += '<div class="lg-path-toggle">';
      html += '<button onclick="lgState.showTier1=true;lgRefresh()" class="' + (lgState.showTier1 && !disableTier1 ? 'active' : '') + '"' + (disableTier1 ? ' disabled' : '') + '>Tier-1 paths</button>';
      html += '<button onclick="lgState.showTier1=false;lgRefresh()" class="' + (!lgState.showTier1 || disableTier1 ? 'active' : '') + '">Full paths</button>';
      html += '</div>';
      html += '<span class="lg-info-icon">i<span class="lg-info-tip">Tier-1 ASes: ' + TIER1_IPV4.join(', ') + (lgState.isIPv6 ? ', 6939 (IPv6)' : '') + '</span></span>';
      if (forceFullMsg) html += '<span style="font-size:11px;color:var(--muted);font-style:italic">' + escHtml(forceFullMsg) + '</span>';
      html += '</div>';
      return html;
    }

    function lgRenderVisibility() {
      var meta = lgState.result ? lgState.result.meta : {};
      var prefixOrigins = meta.prefix_origins || [];
      var collectors = meta.collectors || [];
      var routes = lgState.result ? lgState.result.routes : [];
      if (prefixOrigins.length === 0) return '';

      // Overall visibility (from first prefix_origin)
      var po = prefixOrigins[0];
      var visPct = Math.round(po.visibility * 100 * 10) / 10;
      var visBadgeClass = visPct >= 95 ? 'lg-vis-badge-green' : visPct >= 50 ? 'lg-vis-badge-yellow' : 'lg-vis-badge-red';

      // Info icon tooltip text
      var infoTip = 'Prefix Visibility shows the percentage of global BGP route collectors that can see your prefix. '
        + 'Data is sourced from RouteViews and RIPE RIS collectors via Cloudflare Radar, with an independent cross-reference from RIPEstat.\\n\\n'
        + '100% visibility \\u2014 Your prefix is fully propagated and visible to all monitored peers.\\n\\n'
        + '< 100% visibility \\u2014 Some peers cannot see your prefix. This could indicate:\\n'
        + '\\u2022 Recent announcement still propagating (allow 5\\u201315 minutes)\\n'
        + '\\u2022 BGP convergence in progress\\n'
        + '\\u2022 Routing filtering by upstream providers\\n'
        + '\\u2022 Missing or incorrect IRR/RPKI records causing route rejection\\n'
        + '\\u2022 Potential routing issues or route leaks\\n\\n'
        + 'If visibility remains below 95% for an extended period, investigate your upstream BGP sessions and route authorization records.';

      var html = '<div class="lg-vis-section">';
      html += '<div class="lg-vis-header">';
      html += '<span style="font-weight:600;font-size:13px;color:var(--text-strong)">Prefix Visibility</span>';
      html += '<span class="lg-info-icon">i<span class="lg-info-tip" style="width:360px;white-space:pre-line">' + escHtml(infoTip) + '</span></span>';
      html += '<span class="lg-vis-badge ' + visBadgeClass + '">' + visPct + '% visible</span>';
      html += '<span style="font-size:12px;color:var(--muted)">' + po.total_visible + ' / ' + po.total_peers + ' peers see ' + escHtml(lgState.prefix) + '</span>';
      html += '<button onclick="lgState.showVisibility=!lgState.showVisibility;lgRefresh()" style="margin-left:auto;font-size:11px;padding:3px 10px;border-radius:4px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-primary);cursor:pointer">' + (lgState.showVisibility ? 'Hide' : 'Show') + ' visibility</button>';
      html += '</div>';

      // Side-by-side comparison with RIPEstat
      var ripestat = lgState.ripestatVisibility;
      if (ripestat && ripestat.total_peers > 0 && ripestat.total_seeing > 0) {
        var ripeVisPct = Math.round(ripestat.visibility * 100 * 10) / 10;
        var ripeBadgeClass = ripeVisPct >= 95 ? 'lg-vis-badge-green' : ripeVisPct >= 50 ? 'lg-vis-badge-yellow' : 'lg-vis-badge-red';
        var discrepancy = Math.abs(visPct - ripeVisPct);

        html += '<div style="display:flex;align-items:center;gap:12px;margin:6px 0 4px;flex-wrap:wrap">';
        html += '<div style="display:flex;align-items:center;gap:6px;font-size:11px">';
        html += '<span style="color:var(--muted)">Cloudflare Radar:</span>';
        html += '<span class="lg-vis-badge ' + visBadgeClass + '" style="font-size:10px">' + visPct + '%</span>';
        html += '<span style="color:var(--muted)">(' + po.total_visible + '/' + po.total_peers + ' peers)</span>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:6px;font-size:11px">';
        html += '<span style="color:var(--muted)">RIPE RIS:</span>';
        html += '<span class="lg-vis-badge ' + ripeBadgeClass + '" style="font-size:10px">' + ripeVisPct + '%</span>';
        html += '<span style="color:var(--muted)">(' + ripestat.total_seeing + '/' + ripestat.total_peers + ' peers)</span>';
        html += '</div>';
        if (discrepancy > 10) {
          html += '<span class="lg-vis-badge lg-vis-badge-yellow" style="font-size:10px">&#9888; ' + Math.round(discrepancy) + '% discrepancy</span>';
        }
        html += '</div>';
        if (ripestat.query_time) {
          html += '<div style="font-size:10px;color:var(--muted);margin-bottom:4px">RIPE RIS data as of ' + escHtml(ripestat.query_time) + ' (snapshots at 00:00, 08:00, 16:00 UTC)</div>';
        }
      } else if (ripestat && ripestat.total_peers > 0 && ripestat.total_seeing === 0) {
        html += '<div style="font-size:11px;color:var(--muted);margin:6px 0 4px">RIPE RIS: Prefix not found in RIPE RIS collectors at this exact CIDR. Visibility data available only via Cloudflare Radar (RouteViews + RIS).</div>';
      }

      if (lgState.showVisibility) {
        // Compute per-collector visibility with peer details
        var collectorPeerAsns = {};
        routes.forEach(function(r) {
          if (!collectorPeerAsns[r.collector]) collectorPeerAsns[r.collector] = {};
          var key = r.peer_asn || r.peer_ip;
          if (key) collectorPeerAsns[r.collector][key] = r.peer_asn;
        });

        collectors.forEach(function(c) {
          var peerMap = collectorPeerAsns[c.collector] || {};
          var peerAsnList = Object.values(peerMap).filter(Boolean);
          var uniquePeerAsns = [];
          var seenAsn = {};
          peerAsnList.forEach(function(a) { if (!seenAsn[a]) { seenAsn[a] = true; uniquePeerAsns.push(a); } });
          uniquePeerAsns.sort(function(a, b) { return a - b; });
          var seen = Object.keys(peerMap).length;
          var total = c.peers_count || 1;
          var pct = Math.round(seen / total * 100);
          var barClass = pct >= 100 ? 'lg-vis-bar-green' : pct > 0 ? 'lg-vis-bar-yellow' : 'lg-vis-bar-gray';
          var isPartial = pct > 0 && pct < 100;
          var missing = total - seen;
          var isIPv6Only = c.peers_v4_count === 0 && c.peers_v6_count > 0;
          var isExpanded = !!lgState.expandedCollectors[c.collector];

          html += '<div class="lg-vis-row' + (isPartial ? ' lg-vis-partial' : '') + '" onclick="lgToggleCollector(\\'' + escAttr(c.collector) + '\\')">';
          html += '<span class="lg-vis-chevron' + (isExpanded ? ' open' : '') + '">&#9654;</span>';
          html += '<span class="lg-vis-name">' + escHtml(c.collector) + '</span>';
          html += '<div class="lg-vis-bar-wrap"><div class="lg-vis-bar ' + barClass + '" style="width:' + Math.min(pct, 100) + '%"></div></div>';
          html += '<span class="lg-vis-pct">' + pct + '%</span>';
          if (isIPv6Only) html += '<span class="lg-vis-badge lg-vis-badge-green" style="font-size:10px">IPv6 only</span>';
          if (missing > 0 && pct < 100) html += '<span class="lg-vis-badge lg-vis-badge-red" style="font-size:10px">' + missing + ' missing</span>';
          html += '<span class="lg-vis-peers">' + seen + ' / ' + total + ' peers</span>';
          html += '</div>';

          if (isExpanded && uniquePeerAsns.length > 0) {
            html += '<div class="lg-vis-detail">';
            html += '<div class="lg-vis-detail-label">Visible peers (' + uniquePeerAsns.length + ')</div>';
            html += '<div class="lg-vis-peer-grid">';
            uniquePeerAsns.forEach(function(asn) {
              var info = lgState.asnInfoMap[asn] || {};
              var flag = lgCountryFlag(info.country_code || '');
              var name = info.org_name || info.as_name || '';
              if (name.length > 20) name = name.substring(0, 18) + '\\u2026';
              var chipClass = 'lg-asn-chip lg-chip-tip';
              if (lgState.filterAsn && String(asn) === lgState.filterAsn) chipClass += ' lg-asn-chip-filtered';
              html += '<span class="' + chipClass + '" onclick="event.stopPropagation();lgToggleAsnFilter(' + asn + ')">';
              html += (flag ? flag + ' ' : '') + 'AS' + asn;
              html += '<span class="lg-chip-tiptext">' + (flag ? flag + ' ' : '') + escHtml(name || 'AS' + asn) + '</span>';
              html += '</span>';
            });
            html += '</div>';
            html += '</div>';
          }
        });
      }

      html += '</div>';
      return html;
    }

    function lgRenderTable(filtered) {
      if (filtered.length === 0) return '<div class="text-center py-4 text-cf-gray text-xs">No routes match the current filters</div>';

      var html = '<div class="overflow-x-auto mt-4 border-t border-cf-border pt-4">';
      html += '<div class="flex items-center justify-between mb-2 flex-wrap gap-2">';
      html += '<div class="flex items-center gap-2">';
      html += '<h3 style="font-size:13px;font-weight:600;color:var(--text-strong)">Routes to <span class="font-mono" style="color:#6366f1">' + escHtml(lgState.prefix) + '</span></h3>';
      html += '<span style="font-size:11px;color:var(--muted)">' + filtered.length + ' routes</span>';
      html += '</div>';
      html += '<button onclick="lgState.showRoutes=!lgState.showRoutes;lgRefresh()" style="font-size:11px;padding:3px 10px;border-radius:4px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-primary);cursor:pointer">' + (lgState.showRoutes ? 'Hide' : 'Show') + ' routes</button>';
      html += '</div>';

      if (!lgState.showRoutes) {
        html += '</div>';
        return html;
      }

      html += '<table class="w-full text-xs"><thead><tr class="border-b border-cf-border">';
      html += '<th class="px-1 py-2 text-cf-gray font-medium w-8">JSON</th>';
      html += '<th class="px-2 py-2 text-cf-gray font-medium text-left">Last updated</th>';
      html += '<th class="px-2 py-2 text-cf-gray font-medium text-left">Collector</th>';
      html += '<th class="px-2 py-2 text-cf-gray font-medium text-left">AS Path</th>';
      html += '<th class="px-2 py-2 text-cf-gray font-medium text-left">Communities</th>';
      html += '</tr></thead><tbody>';

      for (var i = 0; i < filtered.length; i++) {
        var route = filtered[i];
        var origin = route.as_path[route.as_path.length - 1];
        var rpki = lgState.rpkiMap[origin];
        var rowClass = rpki === 'invalid' ? ' lg-table-row-invalid' : '';

        html += '<tr class="border-b border-cf-border hover:bg-cf-surface' + rowClass + '">';

        // JSON button
        html += '<td class="px-1 py-1.5 text-center"><button onclick="lgShowJson(' + i + ')" class="text-cf-gray hover:text-cf-orange" title="View JSON"><svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button></td>';

        // Timestamp
        html += '<td class="px-2 py-1.5 text-cf-gray whitespace-nowrap"><span class="lg-chip-tip">' + lgRelativeTime(route.timestamp) + '<span class="lg-chip-tiptext">' + escHtml(route.timestamp || '') + '</span></span></td>';

        // Collector
        html += '<td class="px-2 py-1.5 text-cf-gray whitespace-nowrap"><span class="lg-chip-tip">' + escHtml(route.collector || '') + '<span class="lg-chip-tiptext">Peer: ' + escHtml(route.peer_ip || '') + '</span></span></td>';

        // AS Path chips
        html += '<td class="px-2 py-1.5"><div style="display:flex;flex-wrap:nowrap;gap:3px;align-items:center">';
        for (var j = 0; j < route.as_path.length; j++) {
          var asn = route.as_path[j];
          var isOrig = j === route.as_path.length - 1;
          var chipRpki = isOrig ? (lgState.rpkiMap[asn] || null) : null;
          var chipClass = 'lg-asn-chip lg-chip-tip';
          if (chipRpki === 'invalid') chipClass += ' lg-asn-chip-invalid';
          if (lgState.filterAsn && String(asn) === lgState.filterAsn) chipClass += ' lg-asn-chip-filtered';
          var info = lgState.asnInfoMap[asn] || {};
          var tipText = lgCountryFlag(info.country_code || '') + ' ' + (info.org_name || info.as_name || 'AS' + asn);
          if (isOrig && chipRpki) tipText += ' \\u00b7 RPKI: ' + chipRpki;
          var rpkiIcon = '';
          if (chipRpki === 'valid') rpkiIcon = '<span style="color:#16a34a;margin-left:2px">\\u2713</span>';
          else if (chipRpki === 'invalid') rpkiIcon = '<span style="color:#dc2626;margin-left:2px">\\u2717</span>';

          html += '<span class="' + chipClass + '" onclick="lgToggleAsnFilter(' + asn + ')">' + asn + rpkiIcon + '<span class="lg-chip-tiptext">' + escHtml(tipText) + '</span></span>';
        }
        html += '</div></td>';

        // Communities
        html += '<td class="px-2 py-1.5"><div style="display:flex;flex-wrap:wrap;gap:2px">';
        var communities = route.communities || [];
        if (typeof communities === 'string') communities = communities.split(' ').filter(Boolean);
        for (var k = 0; k < communities.length; k++) {
          html += '<span class="lg-community-tag">' + escHtml(communities[k]) + '</span>';
        }
        html += '</div></td>';

        html += '</tr>';
      }

      html += '</tbody></table></div>';
      return html;
    }

    function lgRenderFilterBanner(filtered, total) {
      if (filtered.length >= total || total === 0) return '';
      var parts = [];
      if (lgState.filterAsn) parts.push('ASN ' + escHtml(lgState.filterAsn));
      if (lgState.filterCollector) parts.push('collector: ' + escHtml(lgState.filterCollector));
      if (!lgState.showRpkiValid) parts.push('hiding RPKI valid');
      if (!lgState.showRpkiInvalid) parts.push('hiding RPKI invalid');
      var html = '<div class="lg-filter-banner">';
      html += '<span>Filters active \\u2014 showing <strong>' + filtered.length + '</strong> of <strong>' + total + '</strong> routes' + (parts.length ? ' (' + parts.join(', ') + ')' : '') + '</span>';
      html += '<button onclick="lgState.filterAsn=\\'\\';lgState.filterCollector=\\'\\';lgState.showRpkiValid=true;lgState.showRpkiInvalid=true;lgRefresh()" style="font-size:11px;padding:3px 10px;border-radius:4px;border:1px solid;cursor:pointer;background:none;color:inherit">Clear all</button>';
      html += '</div>';
      return html;
    }

    function lgStartRefresh() {
      lgStopRefresh();
      lgState.refreshCountdown = lgState.refreshSeconds;
      lgState.refreshInterval = setInterval(function() {
        lgState.refreshCountdown--;
        // Update just the countdown display without full re-render
        var countEl = document.getElementById('lg-refresh-countdown');
        if (countEl) countEl.textContent = lgState.refreshCountdown + 's';
        if (lgState.refreshCountdown <= 0) {
          lgManualRefresh();
        }
      }, 1000);
      lgRefresh();
    }

    function lgStopRefresh() {
      if (lgState.refreshInterval) {
        clearInterval(lgState.refreshInterval);
        lgState.refreshInterval = null;
      }
      lgState.refreshCountdown = 0;
    }

    async function lgManualRefresh() {
      if (!lgState.prefix) return;
      // Reset countdown
      lgState.refreshCountdown = lgState.refreshSeconds;
      try {
        // Fetch Radar routes and RIPEstat visibility in parallel
        var lgPromise = fetch('/api/looking-glass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix: lgState.prefix, account_id: activeAccountId })
        });
        var ripestatPromise = fetch('/api/ripestat-visibility?prefix=' + encodeURIComponent(lgState.prefix))
          .then(function(r) { return r.json(); })
          .then(function(d) { if (d.result) lgState.ripestatVisibility = d.result; })
          .catch(function() { /* RIPEstat is optional */ });

        var resp = await lgPromise;
        var data = await resp.json();
        if (data.error || !data.result || !data.result.routes) return;
        lgState.result = data.result;

        // Rebuild lookup maps
        lgState.asnInfoMap = {};
        lgState.rpkiMap = {};
        lgState.originAsns = new Set();
        lgState.taintedAsns = new Set();
        var meta = data.result.meta || {};
        if (meta.asn_info) {
          meta.asn_info.forEach(function(info) { lgState.asnInfoMap[info.asn] = info; });
        }
        if (meta.prefix_origins) {
          meta.prefix_origins.forEach(function(po) { lgState.rpkiMap[po.origin] = po.rpki_validation; });
        }
        data.result.routes.forEach(function(r) {
          if (r.as_path && r.as_path.length > 0) {
            var origin = r.as_path[r.as_path.length - 1];
            lgState.originAsns.add(origin);
            if (lgState.rpkiMap[origin] === 'invalid') {
              r.as_path.forEach(function(asn) { lgState.taintedAsns.add(asn); });
            }
          }
        });
        await ripestatPromise;
        lgRefresh();
      } catch (e) {
        // Silently ignore refresh errors
      }
    }

    function lgRefresh() {
      if (!lgState.result) return;
      var container = document.getElementById('lg-content');
      var allRoutes = lgState.result.routes || [];
      var filtered = lgGetFilteredRoutes();

      // Check if we need to force full paths
      var forceFullMsg = '';
      if (lgState.showTier1) {
        if (lgShouldForceFullPaths(filtered)) {
          lgState.showTier1 = false;
          if (!lgPathReachesTier1(lgCleanPath((filtered[0] || {}).as_path || []))) {
            forceFullMsg = 'No paths reach Tier-1 \\u2014 showing full paths';
          } else {
            forceFullMsg = 'Filtered ASN not in Tier-1 paths \\u2014 showing full paths';
          }
        }
      }

      var processedPaths = lgGetProcessedPaths(filtered);
      var graph = lgBuildGraph(processedPaths);

      var html = '';
      html += lgRenderFilters();
      html += lgRenderPathToggle(filtered, forceFullMsg);

      // Graph
      html += '<div class="lg-graph-wrap" id="lg-graph-wrap">';
      html += lgRenderSvg(graph);
      html += '<div class="lg-zoom-controls">';
      html += '<button class="lg-zoom-btn" onclick="lgZoom(0.8)" title="Zoom in">+</button>';
      html += '<button class="lg-zoom-btn" onclick="lgZoom(1.25)" title="Zoom out">&minus;</button>';
      html += '<button class="lg-zoom-btn" onclick="lgFitView()" title="Fit view" style="font-size:12px">&#x2922;</button>';
      html += '</div>';
      html += '</div>';

      // Filter banner
      html += lgRenderFilterBanner(filtered, allRoutes.length);

      // Visibility
      html += lgRenderVisibility();

      // Table
      html += lgRenderTable(filtered);

      container.innerHTML = html;

      // Attach pan/zoom events
      lgAttachSvgEvents();
    }

    // Register document-level pan handlers only once
    var lgDocEventsAttached = false;
    function lgAttachDocEvents() {
      if (lgDocEventsAttached) return;
      lgDocEventsAttached = true;
      document.addEventListener('mousemove', function(e) {
        if (!lgState.isPanning) return;
        var svgEl = document.getElementById('lg-svg');
        if (!svgEl) return;
        var rect = svgEl.getBoundingClientRect();
        var scaleX = lgState.viewBox.w / rect.width;
        var scaleY = lgState.viewBox.h / rect.height;
        var dx = (e.clientX - lgState.panStart.x) * scaleX;
        var dy = (e.clientY - lgState.panStart.y) * scaleY;
        lgState.viewBox.x = lgState.panVBStart.x - dx;
        lgState.viewBox.y = lgState.panVBStart.y - dy;
        lgUpdateViewBox();
      });
      document.addEventListener('mouseup', function() {
        if (lgState.isPanning) {
          lgState.isPanning = false;
          var svgEl = document.getElementById('lg-svg');
          if (svgEl) svgEl.classList.remove('panning');
        }
      });
    }

    function lgAttachSvgEvents() {
      var svg = document.getElementById('lg-svg');
      if (!svg) return;
      lgAttachDocEvents();

      svg.addEventListener('mousedown', function(e) {
        if (e.target.closest('.lg-node')) return;
        lgState.isPanning = true;
        lgState.panStart = { x: e.clientX, y: e.clientY };
        lgState.panVBStart = { x: lgState.viewBox.x, y: lgState.viewBox.y };
        svg.classList.add('panning');
        e.preventDefault();
      });
      svg.addEventListener('wheel', function(e) {
        e.preventDefault();
        var factor = e.deltaY > 0 ? 1.1 : 0.9;
        lgZoomAt(factor, e.clientX, e.clientY);
      }, { passive: false });
    }

    function lgUpdateViewBox() {
      var svg = document.getElementById('lg-svg');
      if (!svg) return;
      var vb = lgState.viewBox;
      svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    }

    function lgZoom(factor) {
      var svg = document.getElementById('lg-svg');
      if (!svg) return;
      var rect = svg.getBoundingClientRect();
      lgZoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    function lgZoomAt(factor, clientX, clientY) {
      var svg = document.getElementById('lg-svg');
      if (!svg) return;
      var rect = svg.getBoundingClientRect();
      var vb = lgState.viewBox;
      var mx = vb.x + (clientX - rect.left) / rect.width * vb.w;
      var my = vb.y + (clientY - rect.top) / rect.height * vb.h;
      var newW = vb.w * factor;
      var newH = vb.h * factor;
      lgState.viewBox = {
        x: mx - (mx - vb.x) * factor,
        y: my - (my - vb.y) * factor,
        w: newW,
        h: newH
      };
      lgUpdateViewBox();
    }

    function lgFitView() {
      lgState.viewBox = { x: lgState.baseViewBox.x, y: lgState.baseViewBox.y, w: lgState.baseViewBox.w, h: lgState.baseViewBox.h };
      lgUpdateViewBox();
    }

    function lgToggleCollector(collector) {
      lgState.expandedCollectors[collector] = !lgState.expandedCollectors[collector];
      lgRefresh();
    }

    function lgToggleAsnFilter(asn) {
      lgState.filterAsn = lgState.filterAsn === String(asn) ? '' : String(asn);
      lgRefresh();
    }

    function lgShowJson(idx) {
      var filtered = lgGetFilteredRoutes();
      var route = filtered[idx];
      if (!route) return;
      var json = JSON.stringify({
        timestamp: route.timestamp,
        prefix: route.prefix,
        as_path: route.as_path,
        collector: route.collector,
        peer_ip: route.peer_ip,
        peer_asn: route.peer_asn,
        next_hop: route.next_hop,
        communities: route.communities
      }, null, 2);
      document.getElementById('lg-json-content').textContent = json;
      document.getElementById('lg-json-modal').classList.remove('hidden');
      document.getElementById('lg-json-copy-btn').textContent = 'Copy';
    }

    function closeLgJsonModal() {
      document.getElementById('lg-json-modal').classList.add('hidden');
    }

    function copyLgJson() {
      var text = document.getElementById('lg-json-content').textContent;
      navigator.clipboard.writeText(text).then(function() {
        document.getElementById('lg-json-copy-btn').textContent = 'Copied!';
        setTimeout(function() { document.getElementById('lg-json-copy-btn').textContent = 'Copy'; }, 1500);
      });
    }

    async function openLgModal(prefix) {
      document.getElementById('lg-prefix-label').textContent = prefix;
      document.getElementById('lg-content').innerHTML =
        '<div class="flex items-center justify-center py-12"><div class="spinner"></div><span class="ml-2 text-xs text-cf-gray">Loading BGP routes for ' + escHtml(prefix) + '...</span></div>';
      document.getElementById('lg-modal').classList.remove('hidden');

      // Reset state
      lgState.result = null;
      lgState.prefix = prefix;
      lgState.isIPv6 = prefix.indexOf(':') !== -1;
      lgState.asnInfoMap = {};
      lgState.rpkiMap = {};
      lgState.originAsns = new Set();
      lgState.taintedAsns = new Set();
      lgState.showTier1 = true;
      lgState.filterAsn = '';
      lgState.showRpkiValid = true;
      lgState.showRpkiInvalid = true;
      lgState.filterCollector = '';
      lgState.showVisibility = false;
      lgState.showRoutes = false;
      lgState.expandedCollectors = {};
      lgState.ripestatVisibility = null;
      lgStopRefresh();

      try {
        // Fetch Radar routes and RIPEstat visibility in parallel
        var lgPromise = fetch('/api/looking-glass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix: prefix, account_id: activeAccountId })
        });
        var ripestatPromise = fetch('/api/ripestat-visibility?prefix=' + encodeURIComponent(prefix))
          .then(function(r) { return r.json(); })
          .then(function(d) { if (d.result) lgState.ripestatVisibility = d.result; })
          .catch(function() { /* RIPEstat is optional - ignore errors */ });

        var resp = await lgPromise;
        var data = await resp.json();
        if (data.error) {
          document.getElementById('lg-content').innerHTML =
            '<div class="text-center py-8 text-red-400 text-xs">' + escHtml(data.error) + '</div>';
          return;
        }
        var result = data.result;
        if (!result || !result.routes || result.routes.length === 0) {
          document.getElementById('lg-content').innerHTML =
            '<div class="text-center py-8 text-cf-gray text-xs">No BGP routes found for ' + escHtml(prefix) + '</div>';
          return;
        }

        lgState.result = result;

        // Build lookup maps
        var meta = result.meta || {};
        if (meta.asn_info) {
          for (var i = 0; i < meta.asn_info.length; i++) {
            var info = meta.asn_info[i];
            lgState.asnInfoMap[info.asn] = info;
          }
        }
        if (meta.prefix_origins) {
          for (var i = 0; i < meta.prefix_origins.length; i++) {
            var po = meta.prefix_origins[i];
            lgState.rpkiMap[po.origin] = po.rpki_validation;
          }
        }

        // Determine origin ASNs and tainted ASNs
        result.routes.forEach(function(r) {
          if (r.as_path && r.as_path.length > 0) {
            var origin = r.as_path[r.as_path.length - 1];
            lgState.originAsns.add(origin);
            if (lgState.rpkiMap[origin] === 'invalid') {
              r.as_path.forEach(function(asn) { lgState.taintedAsns.add(asn); });
            }
          }
        });

        // Auto-detect: if RPKI invalid exists, show invalid only + force full paths
        var hasInvalid = false;
        for (var key in lgState.rpkiMap) { if (lgState.rpkiMap[key] === 'invalid') { hasInvalid = true; break; } }
        if (hasInvalid) {
          lgState.showRpkiValid = false;
          lgState.showRpkiInvalid = true;
        }

        // Wait for RIPEstat to complete before rendering
        await ripestatPromise;
        lgRefresh();
      } catch (e) {
        document.getElementById('lg-content').innerHTML =
          '<div class="text-center py-8 text-red-400 text-xs">Failed to load: ' + escHtml(String(e)) + '</div>';
      }
    }

    function closeLgModal() {
      lgStopRefresh();
      document.getElementById('lg-modal').classList.add('hidden');
      lgState.result = null;
      lgState.ripestatVisibility = null;
    }

    // ─── Helpers ──────────────────────────────────────────────────
    // Derive a parent prefix's advertisement status from its BGP sub-prefixes.
    // The parent-level advertised field is deprecated by Cloudflare; the flags
    // below come from the stats endpoint's per-prefix child summary.
    //   'pending' | 'advertised' | 'withdrawn' | 'partial' | 'none'
    function parentAdvStatus(p) {
      if (p.approved === 'P') return 'pending';
      var hasAdv = p._has_advertised_child === true;
      var hasWith = p._has_withdrawn_child === true;
      if (hasAdv && hasWith) return 'partial';
      if (hasAdv) return 'advertised';
      if (hasWith) return 'withdrawn';
      return 'none';
    }

    function statusBadgeHtml(p) {
      switch (parentAdvStatus(p)) {
        case 'pending': return '<span class="badge-pending">Pending Approval</span>';
        case 'advertised': return '<span class="badge-advertised">Advertised</span>';
        case 'partial': return '<span class="badge-partial">Partial</span>';
        case 'withdrawn': return '<span class="badge-withdrawn">Withdrawn</span>';
        default: return '<span class="badge-unknown">Unknown</span>';
      }
    }

    // Advertisement badge for a single BGP sub-prefix (based on its on_demand state).
    function bgpStatusBadgeHtml(advertised) {
      if (advertised === true) return '<span class="badge-advertised">Advertised</span>';
      if (advertised === false) return '<span class="badge-withdrawn">Withdrawn</span>';
      return '<span class="badge-unknown">Unknown</span>';
    }

    // Badge for a BGP sub-prefix, derived from its own on_demand.advertised flag.
    // (statusBadgeHtml expects a parent prefix object, so it cannot be reused here.)
    function bgpStatusBadgeHtml(advertised) {
      if (advertised === true) return '<span class="badge-advertised">Advertised</span>';
      if (advertised === false) return '<span class="badge-withdrawn">Withdrawn</span>';
      return '<span class="badge-unknown">Unknown</span>';
    }

    // A prefix can be advertised/withdrawn (via in-row toggle or bulk multi-select) only when:
    //  - on-demand advertisement is enabled for it (i.e. it has BGP bindings), AND
    //  - it is not locked, AND
    //  - it is not pending approval, AND
    //  - it has BGP sub-prefixes whose advertisement state is known
    function canToggleAdvertisement(p) {
      return p.on_demand_enabled === true &&
        p.on_demand_locked !== true &&
        p.approved !== 'P' &&
        (p._has_advertised_child === true || p._has_withdrawn_child === true);
    }

    // Human-readable reason why a prefix cannot be advertised/withdrawn (for tooltips).
    function toggleDisabledReason(p) {
      if (p.on_demand_locked) return 'locked';
      if (p.approved === 'P') return 'pending approval';
      if (!p.on_demand_enabled) return 'no BGP bindings / on-demand not enabled';
      if (p._has_advertised_child !== true && p._has_withdrawn_child !== true) return 'inactive (no BGP routes)';
      return '';
    }

    function validationTooltipText(state, type) {
      var s = (state || '').toLowerCase();
      if (type === 'irr') {
        if (s === 'valid') return 'IRR record found. A valid route/route6 object exists in the Internet Routing Registry with the correct origin ASN for this prefix.';
        if (s === 'invalid') return 'IRR validation failed. The route object in the IRR has a mismatched origin ASN or other inconsistency. Update your IRR record to match the configured ASN.';
        if (s === 'pending') return 'IRR validation is pending. Cloudflare is checking the Internet Routing Registry for a matching route object. This may take a few minutes.';
        if (s === 'missing') return 'No IRR record found. Create a route/route6 object in your Regional Internet Registry (RIR) with the correct origin ASN for this prefix.';
        if (s === 'mismatch_asn') return 'IRR record has a mismatched ASN. The origin ASN in your IRR route object does not match the ASN configured for this prefix. Update the IRR record or prefix ASN.';
        return 'IRR validation status: ' + escHtml(state) + '.';
      }
      if (type === 'rpki') {
        if (s === 'valid') return 'RPKI ROA found. A valid Route Origin Authorization exists that authorizes this prefix to be announced by the configured ASN.';
        if (s === 'invalid') return 'RPKI validation failed. The ROA for this prefix is invalid or conflicts with the configured ASN. Check your ROA configuration at your RIR.';
        if (s === 'pending') return 'RPKI validation is pending. Cloudflare is verifying the Route Origin Authorization for this prefix. This may take a few minutes.';
        if (s === 'missing') return 'No ROA found. Create a Route Origin Authorization (ROA) at your Regional Internet Registry (RIR) for this prefix and ASN.';
        if (s === 'mismatch_asn') return 'RPKI ROA has a mismatched ASN. The authorized ASN in the ROA does not match the ASN configured for this prefix.';
        return 'RPKI validation status: ' + escHtml(state) + '.';
      }
      return '';
    }

    function validationBadge(state, type, cidr) {
      var badge;
      if (!state) {
        badge = '<span class="badge-unknown">—</span>';
      } else {
        var s = state.toLowerCase();
        if (s === 'valid') badge = '<span class="badge-valid">Valid</span>';
        else if (s === 'invalid') badge = '<span class="badge-invalid">Invalid</span>';
        else if (s === 'pending') badge = '<span class="badge-pending">Pending</span>';
        else badge = '<span class="badge-unknown">' + escHtml(state) + '</span>';
      }
      if (type === 'rpki' && cidr) {
        return '<span class="validation-hover" onmouseenter="showRpkiDetails(\\'' + escAttr(cidr) + '\\',\\'' + escAttr(state || '') + '\\',this)">' + badge + '<span class="validation-tip">' + validationTooltipText(state, type) + '</span></span>';
      }
      if (type) {
        var tip = validationTooltipText(state, type);
        return '<span class="validation-hover">' + badge + '<span class="validation-tip">' + tip + '</span></span>';
      }
      return badge;
    }

    // ─── Activity Log ───────────────────────────────────────────
    function toggleActivityLog() {
      activityLogExpanded = !activityLogExpanded;
      var body = document.getElementById('activity-log-body');
      var chevron = document.getElementById('activity-log-chevron');
      var hint = document.getElementById('activity-log-hint');
      var refreshBtn = document.getElementById('activity-log-refresh');
      var sourceSel = document.getElementById('activity-log-source');
      var actionSel = document.getElementById('activity-log-action');
      var windowSel = document.getElementById('activity-log-window');
      if (activityLogExpanded) {
        body.classList.remove('hidden');
        chevron.classList.add('open');
        if (hint) hint.textContent = 'Click to collapse';
        if (refreshBtn) refreshBtn.classList.remove('hidden');
        if (sourceSel) sourceSel.classList.remove('hidden');
        if (actionSel) actionSel.classList.remove('hidden');
        if (windowSel) windowSel.classList.remove('hidden');
        if (!activityLogLoaded) loadActivityLog();
      } else {
        body.classList.add('hidden');
        chevron.classList.remove('open');
        if (hint) hint.textContent = 'Click to expand';
        if (refreshBtn) refreshBtn.classList.add('hidden');
        if (sourceSel) sourceSel.classList.add('hidden');
        if (actionSel) actionSel.classList.add('hidden');
        if (windowSel) windowSel.classList.add('hidden');
      }
    }

    async function loadActivityLog() {
      try {
        var params = [];
        if (activeAccountId) params.push('account_id=' + encodeURIComponent(activeAccountId));
        params.push('days=' + encodeURIComponent(activityLogDays));
        var url = '/api/activity?' + params.join('&');
        var resp = await fetch(url);
        var data = await resp.json();
        activityLogLoaded = true;
        activityLogEntries = data.activity || [];
        activityLogAuditError = data.audit_error || '';
        updateActivityLogActionFilter(activityLogEntries);
        renderActivityLog(activityLogEntries);
      } catch (e) {
        document.getElementById('activity-log-content').innerHTML =
          '<div class="px-4 py-8 text-center text-red-400 text-xs">Failed to load activity log</div>';
      }
    }

    function setActivityLogSource(value) {
      activityLogSource = value;
      renderActivityLog(activityLogEntries);
    }

    function setActivityLogAction(value) {
      activityLogAction = value;
      renderActivityLog(activityLogEntries);
    }

    function setActivityLogDays(value) {
      activityLogDays = parseInt(value, 10) || 30;
      loadActivityLog();
    }

    function toggleActivityLogSort() {
      activityLogSortDir = activityLogSortDir === 'desc' ? 'asc' : 'desc';
      renderActivityLog(activityLogEntries);
    }

    function activityLogActionLabel(action) {
      return formatActionBadge(action)
        .replace(/<[^>]*>/g, '')
        .trim() || action;
    }

    function updateActivityLogActionFilter(entries) {
      var sel = document.getElementById('activity-log-action');
      if (!sel) return;
      var labels = {};
      (entries || []).forEach(function(e) {
        var label = activityLogActionLabel(e.action);
        if (label) labels[label] = true;
      });
      var sorted = Object.keys(labels).sort();
      var current = activityLogAction;
      var html = '<option value="all">All actions</option>';
      sorted.forEach(function(label) {
        html += '<option value="' + escAttr(label) + '">' + escHtml(label) + '</option>';
      });
      sel.innerHTML = html;
      // Preserve the current selection if still available, else reset to all.
      if (current !== 'all' && !labels[current]) activityLogAction = 'all';
      sel.value = activityLogAction;
    }

    function refreshActivityLog() {
      if (activityLogExpanded) loadActivityLog();
    }

    function formatActionBadge(action) {
      var map = {
        'advertise': { label: 'Advertised', css: 'al-badge-green' },
        'withdraw': { label: 'Withdrawn', css: 'al-badge-red' },
        'bulk_advertise': { label: 'Bulk Advertised', css: 'al-badge-green' },
        'bulk_withdraw': { label: 'Bulk Withdrawn', css: 'al-badge-red' },
        'create_prefix': { label: 'Create', css: 'al-badge-blue' },
        'delete_prefix': { label: 'Delete', css: 'al-badge-red' },
        'create_bgp_prefix': { label: 'Create', css: 'al-badge-blue' },
        'delete_bgp_prefix': { label: 'Delete', css: 'al-badge-red' },
        'create_binding': { label: 'Create', css: 'al-badge-blue' },
        'delete_binding': { label: 'Delete', css: 'al-badge-red' },
        'create_delegation': { label: 'Create', css: 'al-badge-blue' },
        'delete_delegation': { label: 'Delete', css: 'al-badge-red' },
        'update_description': { label: 'Update', css: 'al-badge-gray' },
        'rir_ensure_route': { label: 'Prefix Validation', css: 'al-badge-yellow' },
        'rir_ensure_autnum': { label: 'Prefix Validation', css: 'al-badge-yellow' },
        'validate': { label: 'IRR Validation', css: 'al-badge-yellow' },
        'create': { label: 'Create', css: 'al-badge-blue' },
        'update': { label: 'Update', css: 'al-badge-gray' },
        'delete': { label: 'Delete', css: 'al-badge-red' },
        'view': { label: 'View', css: 'al-badge-gray' }
      };
      var info = map[action] || { label: action, css: 'al-badge-gray' };
      return '<span class="al-badge ' + info.css + '">' + escHtml(info.label) + '</span>';
    }

    function sourceBadge(source) {
      if (source === 'audit') {
        return '<span class="al-badge al-badge-yellow">Audit</span>';
      }
      return '<span class="al-badge al-badge-blue">Local</span>';
    }

    function activityActorHtml(e) {
      if (e.source === 'audit') {
        var who = e.actor_email || e.actor_type || 'unknown';
        var html = '<div class="font-mono">' + escHtml(who) + '</div>';
        var meta = [];
        if (e.actor_context) meta.push(e.actor_context);
        if (e.actor_ip) meta.push(e.actor_ip);
        if (meta.length) html += '<div class="text-[10px] text-cf-gray">' + escHtml(meta.join(' · ')) + '</div>';
        return html;
      }
      return '<span class="font-mono">' + escHtml(e.user_email || '') + '</span>';
    }

    function formatActivityTime(dateStr) {
      try {
        var d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
          ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return dateStr;
      }
    }

    function activityLogTs(v) {
      var s = String(v || '');
      var norm = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z';
      var t = new Date(norm).getTime();
      return isNaN(t) ? 0 : t;
    }

    function renderActivityLog(entries) {
      var filtered = (entries || []).filter(function(e) {
        var sourceOk = activityLogSource === 'all' || (e.source || 'local') === activityLogSource;
        var actionOk = activityLogAction === 'all' || activityLogActionLabel(e.action) === activityLogAction;
        return sourceOk && actionOk;
      });

      filtered.sort(function(a, b) {
        var diff = activityLogTs(a.created_at) - activityLogTs(b.created_at);
        return activityLogSortDir === 'asc' ? diff : -diff;
      });

      var countEl = document.getElementById('activity-log-count');
      if (countEl) {
        countEl.textContent = filtered.length;
        countEl.classList.toggle('hidden', filtered.length === 0);
      }

      var banner = '';
      if (activityLogAuditError && activityLogSource !== 'local') {
        banner = '<div class="px-4 py-2 text-[11px] text-red-500 border-b border-cf-border" style="background:rgba(234,179,8,0.08)">' +
          '&#9888; Audit log unavailable: ' + escHtml(activityLogAuditError) +
          '. The Audit Logs v2 API requires the <strong>Account Settings: Read</strong> token permission.</div>';
      }

      if (filtered.length === 0) {
        document.getElementById('activity-log-content').innerHTML = banner +
          '<div class="px-4 py-8 text-center text-cf-gray text-xs">' +
          '<svg class="w-6 h-6 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
          'No activity recorded yet</div>';
        return;
      }

      var sortArrow = activityLogSortDir === 'asc' ? ' &#9650;' : ' &#9660;';
      var html = banner + '<table class="w-full text-xs">' +
        '<thead><tr class="border-b border-cf-border text-left">' +
        '<th class="px-4 py-2.5 text-cf-gray font-medium cursor-pointer select-none hover:text-cf-orange transition" style="min-width:150px" onclick="toggleActivityLogSort()" title="Sort by date">Date / Time' + sortArrow + '</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium" style="min-width:70px">Source</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium" style="min-width:140px">Action</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium">Details</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium" style="min-width:140px">User / Actor</th>' +
        '</tr></thead><tbody>';

      for (var i = 0; i < filtered.length; i++) {
        var e = filtered[i];
        html += '<tr class="al-row">' +
          '<td class="px-4 py-2.5 text-cf-gray whitespace-nowrap">' + formatActivityTime(e.created_at) + '</td>' +
          '<td class="px-3 py-2.5">' + sourceBadge(e.source) + '</td>' +
          '<td class="px-3 py-2.5">' + formatActionBadge(e.action) + '</td>' +
          '<td class="px-3 py-2.5" style="color:var(--text-primary)">' + escHtml(e.details) + '</td>' +
          '<td class="px-3 py-2.5 text-cf-gray">' + activityActorHtml(e) + '</td>' +
          '</tr>';
      }

      html += '</tbody></table>';
      document.getElementById('activity-log-content').innerHTML = html;
    }

    // ─── Notifications Queue ─────────────────────────────────────
    function toggleNotifQueue() {
      notifQueueExpanded = !notifQueueExpanded;
      var body = document.getElementById('notif-queue-body');
      var chevron = document.getElementById('notif-queue-chevron');
      var hint = document.getElementById('notif-queue-hint');
      var refreshBtn = document.getElementById('notif-queue-refresh');
      if (notifQueueExpanded) {
        body.classList.remove('hidden');
        chevron.classList.add('open');
        if (hint) hint.textContent = 'Click to collapse';
        if (refreshBtn) refreshBtn.classList.remove('hidden');
        if (!notifQueueLoaded) loadNotifQueue();
      } else {
        body.classList.add('hidden');
        chevron.classList.remove('open');
        if (hint) hint.textContent = 'Click to expand';
        if (refreshBtn) refreshBtn.classList.add('hidden');
      }
    }

    async function loadNotifQueue() {
      try {
        var url = '/api/notifications/log' + (activeAccountId ? '?account_id=' + encodeURIComponent(activeAccountId) : '');
        var resp = await fetch(url);
        var data = await resp.json();
        notifQueueLoaded = true;
        renderNotifQueue(data.log || []);
      } catch (e) {
        document.getElementById('notif-queue-content').innerHTML =
          '<div class="px-4 py-8 text-center text-red-400 text-xs">Failed to load notifications</div>';
      }
    }

    function refreshNotifQueue() {
      if (notifQueueExpanded) loadNotifQueue();
    }

    function notifStatusBadge(status) {
      var map = {
        'queued': { label: 'Queued', css: 'al-badge-gray' },
        'sent': { label: 'Sent', css: 'al-badge-green' },
        'retrying': { label: 'Retrying', css: 'al-badge-yellow' },
        'failed': { label: 'Failed', css: 'al-badge-red' },
        'dead_letter': { label: 'Dead Letter', css: 'al-badge-red' }
      };
      var info = map[status] || { label: status, css: 'al-badge-gray' };
      return '<span class="al-badge ' + info.css + '">' + escHtml(info.label) + '</span>';
    }

    function renderNotifQueue(entries) {
      var countEl = document.getElementById('notif-queue-count');
      if (countEl) {
        countEl.textContent = entries.length;
        countEl.classList.toggle('hidden', entries.length === 0);
      }
      if (entries.length === 0) {
        document.getElementById('notif-queue-content').innerHTML =
          '<div class="px-4 py-8 text-center text-cf-gray text-xs">No notifications yet</div>';
        return;
      }
      var html = '<table class="w-full text-xs">' +
        '<thead><tr class="border-b border-cf-border text-left">' +
        '<th class="px-4 py-2.5 text-cf-gray font-medium" style="min-width:150px">Time</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium">Event</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium">Channel</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium">Status</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium">Attempts</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium">Detail / Error</th>' +
        '<th class="px-3 py-2.5 text-cf-gray font-medium"></th>' +
        '</tr></thead><tbody>';
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var canRetry = (e.status === 'dead_letter' || e.status === 'failed');
        var detail = e.error ? ('<span class="text-red-400">' + escHtml(e.error) + '</span>') : escHtml(e.title || e.details || '');
        html += '<tr class="al-row">' +
          '<td class="px-4 py-2.5 text-cf-gray whitespace-nowrap">' + formatActivityTime(e.created_at) + '</td>' +
          '<td class="px-3 py-2.5" style="color:var(--text-primary)">' + escHtml(e.event_type) + '</td>' +
          '<td class="px-3 py-2.5 text-cf-gray">' + escHtml(e.channel_type) + '</td>' +
          '<td class="px-3 py-2.5">' + notifStatusBadge(e.status) + '</td>' +
          '<td class="px-3 py-2.5 text-cf-gray">' + (e.attempts || 0) + '</td>' +
          '<td class="px-3 py-2.5">' + detail + '</td>' +
          '<td class="px-3 py-2.5">' + (canRetry ? '<button onclick="retryNotif(' + e.id + ')" class="text-[10px] text-cf-orange hover:underline">Retry</button>' : '') + '</td>' +
          '</tr>';
      }
      html += '</tbody></table>';
      document.getElementById('notif-queue-content').innerHTML = html;
    }

    async function retryNotif(id) {
      var resp = await fetch('/api/notifications/log/' + id + '/retry', { method: 'POST' });
      if (resp.ok) { await loadNotifQueue(); showInlineMsg('notif-queue-msg', 'Retry queued.', 'success'); }
      else { var d = await resp.json(); showInlineMsg('notif-queue-msg', d.error || 'Retry failed', 'error'); }
    }

    function extractTags(desc) {
      if (!desc) return [];
      var matches = desc.match(/(?:^|\s)#([a-zA-Z0-9_-]+)/g);
      if (!matches) return [];
      return matches.map(function(m) { return m.trim().slice(1).toLowerCase(); });
    }

    function renderDescriptionWithTags(desc) {
      if (!desc) return escHtml('—');
      return escHtml(desc).replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, function(match, space, tag) {
        return space + '<span class="badge-tag" onclick="event.stopPropagation();filterByTag(\\'' + escAttr(tag.toLowerCase()) + '\\')">#' + escHtml(tag) + '</span>';
      });
    }

    function filterByTag(tag) {
      var sel = document.getElementById('filter-tag');
      if (sel) {
        sel.value = tag;
        applyFilters();
      }
    }

    function escHtml(s) {
      if (!s) return '';
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escAttr(s) {
      return escHtml(s).replace(/'/g, '&#39;');
    }

    // ─── Inline messages & confirm modal ──────────────────────────
    function showInlineMsg(targetId, message, type) {
      var el = document.getElementById(targetId);
      if (!el) return;
      var cls = type === 'success' ? 'inline-msg inline-msg-success' : 'inline-msg inline-msg-error';
      el.innerHTML = '<span class="' + cls + '">' + escHtml(String(message)) +
        '<span class="inline-msg-close" onclick="this.parentNode.parentNode.innerHTML=\\'\\'" role="button" aria-label="Dismiss">&times;</span></span>';
    }

    function clearInlineMsg(targetId) {
      var el = document.getElementById(targetId);
      if (el) el.innerHTML = '';
    }

    var _appConfirmCb = null;
    function showConfirm(opts) {
      opts = opts || {};
      document.getElementById('app-confirm-title').textContent = opts.title || 'Confirm';
      document.getElementById('app-confirm-message').textContent = opts.message || '';
      var btn = document.getElementById('app-confirm-btn');
      btn.textContent = opts.confirmLabel || 'Confirm';
      btn.className = 'px-3 py-1.5 text-white text-xs font-medium rounded-lg transition ' +
        (opts.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-cf-orange hover:bg-orange-600');
      _appConfirmCb = opts.onConfirm || null;
      document.getElementById('app-confirm-modal').classList.remove('hidden');
    }

    function closeAppConfirmModal() {
      document.getElementById('app-confirm-modal').classList.add('hidden');
      _appConfirmCb = null;
    }

    function runAppConfirm() {
      var cb = _appConfirmCb;
      closeAppConfirmModal();
      if (cb) cb();
    }
  </script>
</body>
</html>`;
}
