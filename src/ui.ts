function infoTip(text: string): string {
  return `<span class="info-tip" tabindex="0" role="button" aria-label="More info"><span class="info-ico">i</span><span class="info-bubble">${text}</span></span>`;
}

export function renderDashboard(userEmail: string): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Network Tools — BYOIP Manager</title>
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
      --header-bg: rgba(22,27,34,0.85); --scrollbar: #30363D;
    }
    [data-theme="light"] {
      --page-bg: #F9FAFB; --surface: #FFFFFF; --border: #E5E7EB; --muted: #6B7280;
      --text-primary: #374151; --text-strong: #111827; --input-bg: #F3F4F6;
      --header-bg: rgba(255,255,255,0.85); --scrollbar: #D1D5DB;
    }
    body { background: var(--page-bg); color: var(--text-primary); transition: background 0.2s, color 0.2s; }
    * { scrollbar-width: thin; scrollbar-color: var(--scrollbar) transparent; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 3px; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .spinner { border: 2px solid var(--border); border-top-color: #F6821F; border-radius: 50%; width: 18px; height: 18px; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    [data-theme="light"] .text-white:not(.btn-force-white) { color: var(--text-strong) !important; }
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
    .badge-pending { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
    .badge-valid { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-invalid { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-unknown { background: rgba(107,114,128,0.15); color: #6b7280; border: 1px solid rgba(107,114,128,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-active { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-service { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .badge-delegation { background: rgba(20,184,166,0.15); color: #14b8a6; border: 1px solid rgba(20,184,166,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; }
    .info-tip { position: relative; display: inline-flex; vertical-align: middle; margin-left: 4px; outline: none; }
    .info-ico { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); color: var(--muted); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; font-style: normal; line-height: 1; cursor: help; transition: all 0.15s; }
    .info-tip:hover .info-ico, .info-tip:focus .info-ico { color: #F6821F; border-color: #F6821F; }
    .info-bubble { display: none; position: fixed; z-index: 9999; width: 240px; padding: 8px 10px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-size: 11px; font-weight: 400; line-height: 1.45; color: var(--text-primary); text-transform: none; letter-spacing: normal; white-space: normal; }
    .info-tip:hover .info-bubble, .info-tip:focus .info-bubble, .info-tip:focus-within .info-bubble { display: block; }
    .cidr-hover { position: relative; cursor: help; }
    .rdap-tip { display: none; position: fixed; z-index: 9999; min-width: 260px; padding: 10px 12px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.4); font-size: 11px; font-weight: 400; line-height: 1.5; color: var(--text-primary); white-space: nowrap; pointer-events: none; }
    .cidr-hover:hover .rdap-tip { display: block; }
    .validation-hover { position: relative; display: inline-block; cursor: help; }
    .validation-tip { display: none; position: fixed; z-index: 9999; min-width: 240px; max-width: 300px; padding: 8px 10px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-size: 11px; font-weight: 400; line-height: 1.45; color: var(--text-primary); white-space: normal; }
    .validation-hover:hover .validation-tip { display: block; }
    .validation-tip a { pointer-events: auto; }
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
    .lg-info-icon .lg-info-tip { display: none; position: absolute; z-index: 60; top: calc(100% + 4px); left: 0; width: 300px; padding: 8px 10px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 10px; color: var(--text-primary); white-space: normal; font-weight: 400; }
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
  </style>
</head>
<body class="font-sans min-h-screen">
  <!-- Header -->
  <header class="sticky top-0 z-40 backdrop-blur-md border-b border-cf-border" style="background:var(--header-bg)">
    <div class="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <svg class="w-7 h-7 flex-shrink-0" viewBox="0 0 64 64" fill="none"><path d="M44.048 43.904H19.2l-1.28-4.352L41.216 36l3.84 3.072-.512 3.84-.496.992z" fill="#F6821F"/><path d="M45.056 43.392l-.512-1.984c-.256-.768-.128-1.536.384-2.048.384-.512.96-.768 1.664-.768h.64l1.024.128c2.304.256 4.864.384 7.552.384h.512c.256 0 .384-.128.512-.256.128-.256.128-.512 0-.768-.896-2.944-3.712-5.056-6.912-5.184l-2.048-.128-.768-1.536c-2.432-5.184-7.68-8.512-13.504-8.512-6.656 0-12.416 4.48-14.08 10.88l-.512 2.048-2.048.256c-3.84.512-6.784 3.84-6.784 7.808 0 .384 0 .768.128 1.152 0 .256.256.384.512.384h34.112c.256 0 .512-.256.64-.512l.128-.384c.128-.384.128-.64.128-.896-.128-.768-.384-1.536-.768-1.984z" fill="#FBAD41"/></svg>
        <div>
          <h1 class="text-base font-semibold leading-tight" style="color:var(--text-strong)">Network Tools</h1>
          <p class="text-[11px] text-cf-gray leading-tight mt-0.5">BYOIP Prefix Manager — View, manage, and monitor IP prefix advertisements</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="toggleAbout()" class="text-xs text-cf-gray hover:text-cf-orange flex items-center gap-1" title="About">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </button>
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
        <h2 class="text-sm font-semibold" style="color:var(--text-strong)">About Network Tools</h2>
        <button onclick="toggleAbout()" class="text-cf-gray hover:text-cf-orange text-xs">Close</button>
      </div>
      <p class="text-xs text-cf-gray leading-relaxed">
        A unified dashboard for managing BYOIP (Bring Your Own IP) prefixes across multiple Cloudflare accounts.
      </p>
      <div class="text-xs text-cf-gray leading-relaxed mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        <div>&bull; Multi-account management with API token verification</div>
        <div>&bull; Prefix stats &amp; filtering (status, lock, CIDR, ASN)</div>
        <div>&bull; BGP sub-prefix creation &amp; advertisement toggling</div>
        <div>&bull; Bulk advertise / withdraw across prefixes</div>
        <div>&bull; Service binding management (CDN, Spectrum, Magic Transit, etc.)</div>
        <div>&bull; Inline prefix description editing</div>
        <div>&bull; Prefix re-validation (RPKI, IRR, ownership)</div>
        <div>&bull; Looking Glass &mdash; interactive BGP path graph via Cloudflare Radar</div>
        <div>&bull; Prefix Visibility &mdash; global propagation % (Radar + RIPEstat)</div>
        <div>&bull; RDAP / Whois hover lookups (org, RIR, country, allocation)</div>
        <div>&bull; RPKI ROA detail view per origin</div>
        <div>&bull; Activity log of all actions</div>
      </div>
      <p class="text-xs text-cf-gray leading-relaxed mt-3">
        <strong>Required API Token Permissions:</strong> Account &rarr; IP Prefixes (Read/Edit) + IP Prefixes: BGP On Demand (Read/Edit) + Radar (Read).
      </p>
    </div>
  </div>

  <!-- Settings Panel -->
  <div id="settings-panel" class="hidden max-w-7xl mx-auto px-4 mt-3 fade-in">
    <div class="panel p-4">
      <div class="flex justify-between items-start mb-3">
        <h2 class="text-sm font-semibold" style="color:var(--text-strong)">Account Settings</h2>
        <button onclick="toggleSettings()" class="text-cf-gray hover:text-cf-orange text-xs">Close</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label class="block text-xs text-cf-gray mb-1">Account Label</label>
          <input id="set-label" type="text" placeholder="e.g. Production" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
        </div>
        <div>
          <label class="block text-xs text-cf-gray mb-1">Account ID</label>
          <input id="set-account-id" type="text" placeholder="Cloudflare Account ID" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
        </div>
        <div>
          <label class="block text-xs text-cf-gray mb-1">API Token</label>
          <input id="set-api-token" type="password" placeholder="Cloudflare API Token" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
        </div>
      </div>
      <div class="flex gap-2 mb-4">
        <button onclick="saveAccount()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Add Account</button>
        <button onclick="testNewAccountToken()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Test Token</button>
        <div id="test-token-result" class="flex items-center text-[10px]"></div>
      </div>
      <div id="accounts-list"></div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 py-4">
    <!-- Filter Bar -->
    <div class="panel p-3 mb-4 flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <label class="text-xs text-cf-gray font-medium">Account:</label>
        <select id="filter-account" onchange="onAccountChange()" class="px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none min-w-[180px]">
          <option value="">No accounts configured</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-cf-gray font-medium">Status:</label>
        <select id="filter-status" onchange="applyFilters()" class="px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          <option value="all">All</option>
          <option value="advertised">Advertised</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-cf-gray font-medium">Lock:</label>
        <select id="filter-lock" onchange="applyFilters()" class="px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
          <option value="all">All</option>
          <option value="locked">Locked</option>
          <option value="unlocked">Unlocked</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-cf-gray font-medium">Prefix:</label>
        <input id="filter-prefix" type="text" placeholder="e.g. 192.168.1" oninput="applyFilters()" class="px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none w-36 font-mono">
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-cf-gray font-medium">ASN:</label>
        <input id="filter-asn" type="text" placeholder="Filter by ASN" oninput="applyFilters()" class="px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none w-28">
      </div>
      <button onclick="loadPrefixes()" class="ml-auto px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Refresh
      </button>
    </div>

    <!-- Stats Row -->
    <div id="stats-row" class="hidden grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
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
              <th class="px-3 py-2.5 text-cf-gray font-medium">Description</th>
              <th class="px-3 py-2.5 text-cf-gray font-medium w-10"></th>
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

  <!-- Delete Service Binding Confirm Modal -->
  <div id="delete-binding-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeDeleteBindingModal()">
    <div class="modal-content" style="max-width:420px">
      <div class="p-4 border-b border-cf-border">
        <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Delete Service Binding</h3>
      </div>
      <div class="p-4">
        <p id="delete-binding-message" class="text-xs text-cf-gray mb-3"></p>
        <p class="text-[10px] text-yellow-400 mb-4">Changes take 4–6 hours to propagate. This action cannot be undone.</p>
        <div class="flex justify-end gap-2">
          <button onclick="closeDeleteBindingModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="delete-binding-btn" onclick="executeDeleteBinding()" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Service Binding Modal -->
  <div id="binding-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeBindingModal()">
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
  <div id="child-prefix-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeChildPrefixModal()">
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
            <select id="child-prefix-mask" class="w-20 px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none"></select>
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
  <div id="delegation-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeDelegationModal()">
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
        <p class="text-[10px] text-yellow-400 mb-4">The delegated account will lose access to this prefix range. This action cannot be undone.</p>
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
        <div id="bulk-confirm-warning" class="text-[10px] text-yellow-400 mb-3 hidden"></div>
        <div id="bulk-confirm-results" class="hidden mb-3 text-xs"></div>
        <div class="flex justify-end gap-2">
          <button onclick="closeBulkConfirmModal()" class="px-3 py-1.5 border border-cf-border text-cf-gray text-xs font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Cancel</button>
          <button id="bulk-confirm-btn" onclick="executeBulkToggle()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Confirm</button>
        </div>
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

    document.addEventListener('mouseenter', function(e) {
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
    }, true);

    document.addEventListener('focusin', function(e) {
      var infoTip = e.target.closest('.info-tip');
      if (infoTip) {
        var bubble = infoTip.querySelector('.info-bubble');
        if (bubble) positionTooltip(infoTip, bubble);
      }
    }, true);

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
      }
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
        var def = a.is_default ? ' (default)' : '';
        return '<option value="' + a.account_id + '">' + escHtml(label) + def + '</option>';
      }).join('');
    }

    function renderAccountsList() {
      var el = document.getElementById('accounts-list');
      if (!el) return;
      if (savedAccounts.length === 0) {
        el.innerHTML = '<p class="text-xs text-cf-gray">No accounts configured yet.</p>';
        return;
      }
      el.innerHTML = '<div class="space-y-2">' + savedAccounts.map(function(a) {
        var defBadge = a.is_default ? '<span class="badge-advertised ml-2">Default</span>' : '';
        var tokenDisplay = a.api_token ? '<span class="text-cf-gray font-mono text-[10px] ml-1">' + escHtml(a.api_token) + '</span>' : '<span class="badge-invalid ml-1">No token</span>';

        return '<div class="flex items-center justify-between p-2.5 rounded-lg border border-cf-border">' +
            '<div class="flex items-center gap-2 text-xs">' +
              '<span style="color:var(--text-strong)" class="font-medium">' + escHtml(a.account_label || 'Untitled') + '</span>' +
              '<span class="text-cf-gray font-mono text-[10px]">' + a.account_id + '</span>' +
              tokenDisplay +
              defBadge +
            '</div>' +
            '<div class="flex gap-1">' +
              (a.is_default ? '' : '<button onclick="setDefault(' + a.id + ')" class="text-[10px] text-cf-gray hover:text-cf-orange px-1.5 py-0.5 border border-cf-border rounded hover:border-cf-orange">Set Default</button>') +
              '<button onclick="deleteAccount(' + a.id + ')" class="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 border border-cf-border rounded hover:border-red-400">Delete</button>' +
            '</div>' +
          '</div>';
      }).join('') + '</div>';
    }

    async function testNewAccountToken() {
      var token = document.getElementById('set-api-token').value.trim();
      var accountId = document.getElementById('set-account-id').value.trim();
      if (!token || !accountId) { alert('Account ID and API Token are required'); return; }
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

    async function saveAccount() {
      var label = document.getElementById('set-label').value.trim();
      var accountId = document.getElementById('set-account-id').value.trim();
      var apiToken = document.getElementById('set-api-token').value.trim();
      if (!accountId) { alert('Account ID is required'); return; }
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_label: label, account_id: accountId, api_token: apiToken || undefined })
        });
        document.getElementById('set-label').value = '';
        document.getElementById('set-account-id').value = '';
        document.getElementById('set-api-token').value = '';
        document.getElementById('test-token-result').innerHTML = '';
        loadAccounts();
      } catch (e) {
        alert('Failed to save account: ' + e);
      }
    }

    async function deleteAccount(id) {
      if (!confirm('Delete this account and all its tokens?')) return;
      await fetch('/api/settings/' + id, { method: 'DELETE' });
      loadAccounts();
    }

    async function setDefault(id) {
      await fetch('/api/settings/' + id + '/default', { method: 'PUT' });
      loadAccounts();
    }

    function onAccountChange() {
      activeAccountId = document.getElementById('filter-account').value;
      loadPrefixes();
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
        } catch (_e) {
          prefixStats = null;
        }
        updateStats();
        applyFilters();
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-red-400">Failed to load: ' + escHtml(String(e)) + '</td></tr>';
      }
    }

    function updateStats() {
      var total = allPrefixes.length;
      if (prefixStats) {
        var s = prefixStats;
        document.getElementById('stat-total').textContent = s.parent.total + s.bgp.total;
        document.getElementById('stat-total-sub').textContent = s.parent.total + ' Parent / ' + s.bgp.total + ' BGP';
        document.getElementById('stat-advertised').textContent = s.parent.advertised + s.bgp.advertised;
        document.getElementById('stat-advertised-sub').textContent = s.parent.advertised + ' Parent / ' + s.bgp.advertised + ' BGP';
        document.getElementById('stat-withdrawn').textContent = s.parent.withdrawn + s.bgp.withdrawn;
        document.getElementById('stat-withdrawn-sub').textContent = s.parent.withdrawn + ' Parent / ' + s.bgp.withdrawn + ' BGP';
        document.getElementById('stat-locked').textContent = s.parent.locked + s.bgp.locked;
        document.getElementById('stat-locked-sub').textContent = s.parent.locked + ' Parent / ' + s.bgp.locked + ' BGP';
      } else {
        var advertised = allPrefixes.filter(function(p) { return p.advertised === true; }).length;
        var withdrawn = allPrefixes.filter(function(p) { return p.advertised === false; }).length;
        var locked = allPrefixes.filter(function(p) { return p.on_demand_locked === true; }).length;
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-total-sub').textContent = '';
        document.getElementById('stat-advertised').textContent = advertised;
        document.getElementById('stat-advertised-sub').textContent = '';
        document.getElementById('stat-withdrawn').textContent = withdrawn;
        document.getElementById('stat-withdrawn-sub').textContent = '';
        document.getElementById('stat-locked').textContent = locked;
        document.getElementById('stat-locked-sub').textContent = '';
      }
      document.getElementById('stats-row').classList.toggle('hidden', total === 0);
    }

    function applyFilters() {
      currentPage = 1;
      var statusFilter = document.getElementById('filter-status').value;
      var lockFilter = document.getElementById('filter-lock').value;
      var prefixFilter = document.getElementById('filter-prefix').value.trim().toLowerCase();
      var asnFilter = document.getElementById('filter-asn').value.trim();

      filteredPrefixes = allPrefixes.filter(function(p) {
        if (statusFilter === 'advertised' && p.advertised !== true) return false;
        if (statusFilter === 'withdrawn' && p.advertised !== false) return false;
        if (lockFilter === 'locked' && !p.on_demand_locked) return false;
        if (lockFilter === 'unlocked' && p.on_demand_locked) return false;
        if (prefixFilter && (!p.cidr || p.cidr.toLowerCase().indexOf(prefixFilter) === -1)) return false;
        if (asnFilter && p.asn !== null && String(p.asn).indexOf(asnFilter) === -1) return false;
        if (asnFilter && p.asn === null) return false;
        return true;
      });

      renderPrefixTable();
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

    // Check if a prefix has actual child BGP sub-prefixes (more specific than the parent itself)
    function hasChildBgpPrefixes(prefixId, parentCidr) {
      var cd = childData[prefixId];
      if (!cd || !cd.bgp_prefixes || cd.bgp_prefixes.length === 0) return false;
      var parentParsed = parseCIDR(parentCidr);
      if (!parentParsed) return false;
      for (var i = 0; i < cd.bgp_prefixes.length; i++) {
        var bp = parseCIDR(cd.bgp_prefixes[i].cidr);
        if (bp && bp.maskLen > parentParsed.maskLen) return true;
      }
      return false;
    }

    function renderPrefixRow(p, isExpanded) {
      var chevClass = isExpanded ? 'chevron open' : 'chevron';
      var lockIcon = p.on_demand_locked ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg><span class="info-bubble" style="width:220px">This prefix is locked. The advertisement state cannot be modified. To unlock, contact your Cloudflare account team.</span></span>' : '';
      var delegationIcon = hasDelegations(p.id) ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg><span class="info-bubble" style="width:220px">This prefix has ' + childData[p.id].delegations.length + ' delegation(s) to other accounts.</span></span>' : '';
      var statusBadge = statusBadgeHtml(p.advertised);
      var irrBadge = validationBadge(p.irr_validation_state, 'irr');
      var rpkiBadge = validationBadge(p.rpki_validation_state, 'rpki', p.cidr);
      var isChecked = selectedPrefixes.has(p.id);

      // Parent-level toggle button
      var parentToggleHtml = '';
      if (p.on_demand_enabled) {
        var isAdv = p.advertised === true;
        parentToggleHtml = '<button class="toggle-btn' + (isAdv ? ' active' : '') + '"' +
          (p.on_demand_locked ? ' disabled title="Locked"' : ' onclick="event.stopPropagation();confirmParentToggle(\\'' + escAttr(p.id) + '\\',' + (isAdv ? 'false' : 'true') + ',\\'' + escAttr(p.cidr) + '\\')"' + ' title="' + (isAdv ? 'Withdraw' : 'Advertise') + ' prefix"') +
          '><span class="toggle-knob"></span></button>';
      }

      // Description with inline edit
      var descHtml = '<span id="desc-display-' + escAttr(p.id) + '">' +
        '<span class="desc-text">' + escHtml(p.description || '—') + '</span>' +
        '<button onclick="event.stopPropagation();startEditDescription(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.description || '') + '\\')" class="text-cf-gray hover:text-cf-orange ml-1 inline-flex align-middle" title="Edit description"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>' +
        '</span>' +
        '<span id="desc-edit-' + escAttr(p.id) + '" class="hidden">' +
          '<input type="text" value="' + escAttr(p.description || '') + '" class="px-1.5 py-0.5 rounded border border-cf-border bg-cf-dark text-xs text-white focus:border-cf-orange focus:outline-none w-40" onclick="event.stopPropagation()" onkeydown="if(event.key===\\'Enter\\'){event.stopPropagation();saveDescription(\\'' + escAttr(p.id) + '\\',this.value)}else if(event.key===\\'Escape\\'){cancelEditDescription(\\'' + escAttr(p.id) + '\\')}" onblur="saveDescription(\\'' + escAttr(p.id) + '\\',this.value)">' +
          '<span id="desc-spinner-' + escAttr(p.id) + '" class="hidden ml-1"><span class="spinner" style="width:12px;height:12px"></span></span>' +
        '</span>';

      return '<tr class="prefix-row border-b border-cf-border" onclick="toggleRow(\\'' + p.id + '\\')">' +
        '<td class="px-2 py-2.5" onclick="event.stopPropagation()"><input type="checkbox" class="prefix-checkbox" value="' + escAttr(p.id) + '" ' + (isChecked ? 'checked' : '') + ' onchange="updateBulkSelection()" style="cursor:pointer;accent-color:#F6821F"></td>' +
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
          (!hasChildBgpPrefixes(p.id, p.cidr) && !p.on_demand_locked ? '<button onclick="event.stopPropagation();openChildPrefixModal(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Add Child Prefix"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16M14 12h2m2 0h2m-2-2v4"/></svg></button>' : '') +
          (!p.on_demand_locked ? '<button onclick="event.stopPropagation();openDelegationModal(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Delegate Prefix"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></button>' : '') +
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
            '<td class="px-3"><span class="badge-' + (b.provisioning && b.provisioning.state === 'active' ? 'valid' : 'pending') + '">' + escHtml(b.provisioning ? b.provisioning.state : 'unknown') + '</span></td>' +
            '<td class="px-3"></td><td class="px-3"></td><td class="px-3"></td>' +
            '<td class="px-3"><button onclick="event.stopPropagation();confirmDeleteBinding(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(b.id) + '\\',\\'' + escAttr(b.service_name) + '\\',\\'' + escAttr(b.cidr) + '\\')" class="text-cf-gray hover:text-red-400" title="Delete Binding"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td>' +
          '</tr>';
        }
      }
      // Delegations on parent prefix
      if (data.delegations && data.delegations.length > 0) {
        for (var d = 0; d < data.delegations.length; d++) {
          var del = data.delegations[d];
          html += '<tr class="child-row border-b border-cf-border">' +
            '<td class="px-2"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-2"><svg class="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></td>' +
            '<td class="px-3 pl-8 font-mono text-cf-gray"><span class="text-teal-400 mr-1">&#9500;&#9472;</span> <span class="badge-delegation">Delegation</span> <span class="text-cf-gray ml-1">' + escHtml(del.cidr) + '</span></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3 text-cf-gray text-[10px] font-mono" title="Delegated Account ID">' + escHtml(del.delegated_account_id) + '</td>' +
            '<td class="px-3"></td><td class="px-3"></td><td class="px-3"></td>' +
            '<td class="px-3"><button onclick="event.stopPropagation();confirmDeleteDelegation(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(del.id) + '\\',\\'' + escAttr(del.cidr) + '\\',\\'' + escAttr(del.delegated_account_id) + '\\')" class="text-cf-gray hover:text-red-400" title="Delete Delegation"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td>' +
          '</tr>';
        }
      }
      // BGP sub-prefixes
      if (data.bgp_prefixes && data.bgp_prefixes.length > 0) {
        for (var j = 0; j < data.bgp_prefixes.length; j++) {
          var bp = data.bgp_prefixes[j];
          var isLast = j === data.bgp_prefixes.length - 1 && (!data.bindings || data.bindings.length === 0 || j > 0);
          var connector = isLast ? '&#9492;&#9472;' : '&#9500;&#9472;';
          var bgpAdv = bp.on_demand && bp.on_demand.advertised;
          var bgpLocked = bp.on_demand && bp.on_demand.on_demand_locked;
          var bgpDelegationIcon = bgpHasDelegation(prefixId, bp.cidr) ? '<svg class="w-3 h-3 text-teal-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' : '';
          var toggleHtml = '<button class="toggle-btn' + (bgpAdv ? ' active' : '') + '"' +
            (bgpLocked ? ' disabled title="Locked"' : ' onclick="event.stopPropagation();confirmToggle(\\'' + prefixId + '\\',\\'' + bp.id + '\\',' + (bgpAdv ? 'false' : 'true') + ',\\'' + escAttr(bp.cidr) + '\\')"') +
            '><span class="toggle-knob"></span></button>';
          var bgpDelegateBtn = !bgpLocked ? '<button onclick="event.stopPropagation();openDelegationModal(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(bp.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Delegate Prefix"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></button>' : '';

          html += '<tr class="child-row border-b border-cf-border">' +
            '<td class="px-2"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-2">' + (bgpLocked ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg><span class="info-bubble" style="width:220px">This prefix is locked. The advertisement state cannot be modified. To unlock, contact your Cloudflare account team.</span></span>' : '') + bgpDelegationIcon + '</td>' +
            '<td class="px-3 pl-8 font-mono" style="color:var(--text-strong)"><span class="text-cf-orange mr-1">' + connector + '</span> <span class="cidr-hover" onmouseenter="showRdap(\\'' + escAttr(bp.cidr) + '\\',this)">' + escHtml(bp.cidr) + '<span class="rdap-tip"></span></span></td>' +
            '<td class="px-3 text-cf-gray">' + (bp.asn != null ? bp.asn : '—') + '</td>' +
            '<td class="px-3">' + statusBadgeHtml(bgpAdv) + '</td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3 flex gap-1 items-center">' + toggleHtml + '<button onclick="event.stopPropagation();openLgModal(\\'' + escAttr(bp.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Looking Glass"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>' + bgpDelegateBtn + '</td>' +
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
        '<span class="text-yellow-400">This will ' + (newState ? 'start announcing' : 'stop announcing') + ' this prefix to the Internet.</span>';
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
        } else {
          alert('Toggle failed: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Toggle failed: ' + e);
      }
    }

    // ─── Parent Prefix Toggle ─────────────────────────────────────
    async function confirmParentToggle(prefixId, newState, cidr) {
      var action = newState ? 'ADVERTISE' : 'WITHDRAW';
      document.getElementById('confirm-message').innerHTML =
        'Are you sure you want to <strong>' + action + '</strong> prefix <strong class="font-mono">' + escHtml(cidr) + '</strong>?<br><br>' +
        '<span class="text-yellow-400">This will ' + (newState ? 'start announcing' : 'stop announcing') + ' all BGP sub-prefixes under this prefix to the Internet.</span>';

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
          alert('Toggled ' + toggled + ' sub-prefix(es), but ' + errors.length + ' failed:\\n' + errors.join('\\n'));
        } else if (toggled === 0) {
          alert('No sub-prefixes were toggled. They may all be locked or already in the desired state.' + (skipped > 0 ? ' (' + skipped + ' skipped)' : ''));
        }

        // Refresh
        delete childData[t.prefixId];
        loadPrefixes();
      } catch (e) {
        alert('Toggle failed: ' + e);
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
          renderPrefixTable();
        } else {
          alert('Failed to update description: ' + (data.error || 'Unknown error'));
          cancelEditDescription(prefixId);
        }
      } catch (e) {
        alert('Failed to update description: ' + e);
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
        checkboxes.forEach(function(cb) { cb.checked = true; selectedPrefixes.add(cb.value); });
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
      // Update select-all checkbox state
      var allCbs = document.querySelectorAll('.prefix-checkbox');
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
        var badge = statusBadgeHtml(p.advertised);
        var lockNote = p.on_demand_locked ? ' <span class="text-yellow-400">(locked - will be skipped)</span>' : '';
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
        } else {
          alert('Bulk toggle failed: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Bulk toggle failed: ' + e);
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

      // Pre-fill IP with parent network address
      document.getElementById('child-prefix-ip').value = ipToString(parsed.network, parsed.v6);

      // Clear error
      document.getElementById('child-prefix-error').classList.add('hidden');
      document.getElementById('child-prefix-submit-btn').disabled = false;
      document.getElementById('child-prefix-submit-btn').textContent = 'Create Child Prefix';

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
        valEl.innerHTML = '<span class="text-yellow-400">First binding must cover the entire prefix (' + escHtml(parentCidr) + ').</span>';
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
        } else {
          alert('Delete failed: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.textContent = 'Delete';
        }
      } catch (e) {
        alert('Delete failed: ' + e);
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
      var prefixId = delegationModalContext.prefixId;

      // Disable button and show loading
      var btn = document.getElementById('delegation-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      document.getElementById('delegation-error').classList.add('hidden');

      try {
        var resp = await fetch('/api/prefixes/' + prefixId + '/delegations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cidr: cidr, delegated_account_id: delegatedAccountId, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          closeDelegationModal();
          // Refresh the child data for this prefix
          delete childData[prefixId];
          expandedRows[prefixId] = false;
          setTimeout(function() { toggleRow(prefixId); }, 100);
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
        } else {
          alert('Delete failed: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.textContent = 'Delete';
        }
      } catch (e) {
        alert('Delete failed: ' + e);
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
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

      // Link to RPKI Portal
      rows.push('<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:6px"><a href="https://rpki.cloudflare.com/" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:#F6821F;text-decoration:none;font-weight:500;font-size:11px">View on Cloudflare RPKI Portal &#8599;</a></div>');

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
        } else {
          alert('Validation failed: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Validation request failed: ' + e.message);
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
    function statusBadgeHtml(advertised) {
      if (advertised === true) return '<span class="badge-advertised">Advertised</span>';
      if (advertised === false) return '<span class="badge-withdrawn">Withdrawn</span>';
      return '<span class="badge-unknown">Unknown</span>';
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

    function escHtml(s) {
      if (!s) return '';
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escAttr(s) {
      return escHtml(s).replace(/'/g, '&#39;');
    }
  </script>
</body>
</html>`;
}
