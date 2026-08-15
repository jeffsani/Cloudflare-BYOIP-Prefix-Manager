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
    [data-theme="light"] .text-white { color: var(--text-strong) !important; }
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
    .info-tip { position: relative; display: inline-flex; vertical-align: middle; margin-left: 4px; outline: none; }
    .info-ico { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); color: var(--muted); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; font-style: normal; line-height: 1; cursor: help; transition: all 0.15s; }
    .info-tip:hover .info-ico, .info-tip:focus .info-ico { color: #F6821F; border-color: #F6821F; }
    .info-bubble { display: none; position: absolute; z-index: 60; top: calc(100% + 6px); left: 0; width: 240px; padding: 8px 10px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-size: 11px; font-weight: 400; line-height: 1.45; color: var(--text-primary); text-transform: none; letter-spacing: normal; white-space: normal; }
    .info-tip:hover .info-bubble, .info-tip:focus .info-bubble, .info-tip:focus-within .info-bubble { display: block; }
    .cidr-hover { position: relative; cursor: help; }
    .rdap-tip { display: none; position: absolute; z-index: 70; top: calc(100% + 8px); left: 0; min-width: 260px; padding: 10px 12px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,0.4); font-size: 11px; font-weight: 400; line-height: 1.5; color: var(--text-primary); white-space: nowrap; pointer-events: none; }
    .cidr-hover:hover .rdap-tip { display: block; }
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
    .lg-node { cursor: default; }
    .lg-node rect { rx: 6; ry: 6; }
    .lg-edge { fill: none; stroke-width: 1.5; opacity: 0.6; }
    .lg-node:hover rect { stroke: #F6821F; stroke-width: 2; }
    .lg-node:hover .lg-edge-connected { opacity: 1; }
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
        This tool provides a unified view of all BYOIP (Bring Your Own IP) prefixes across your Cloudflare accounts.
        You can view prefix status, BGP sub-prefixes, service bindings, toggle advertisement state, and perform
        looking glass queries to visualize BGP routing paths.
      </p>
      <p class="text-xs text-cf-gray leading-relaxed mt-2">
        <strong>Required API Token Permissions:</strong> Account &rarr; IP Prefixes (Read/Edit) + IP Prefixes: BGP On Demand (Read/Edit).
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-xs text-cf-gray mb-1">Account Label</label>
          <input id="set-label" type="text" placeholder="e.g. Production" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
        </div>
        <div>
          <label class="block text-xs text-cf-gray mb-1">Account ID</label>
          <input id="set-account-id" type="text" placeholder="Cloudflare Account ID" class="w-full px-2.5 py-1.5 rounded-lg border border-cf-border bg-cf-dark text-sm text-white focus:border-cf-orange focus:outline-none">
        </div>
      </div>
      <div class="flex gap-2 mb-4">
        <button onclick="saveAccount()" class="px-3 py-1.5 bg-cf-orange text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition">Add Account</button>
      </div>
      <p class="text-[10px] text-cf-gray mb-3">Add multiple API tokens per account to distribute requests and avoid the 1200 req / 5 min / token rate limit. ${infoTip('Tokens are round-robin load balanced across read requests. The first token is used for write operations (e.g. advertisement toggles).')}</p>
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
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-advertised" class="text-xl font-bold text-green-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">Advertised</div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-withdrawn" class="text-xl font-bold text-red-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">Withdrawn</div>
      </div>
      <div class="panel p-3 text-center">
        <div id="stat-locked" class="text-xl font-bold text-yellow-400">0</div>
        <div class="text-[10px] text-cf-gray uppercase tracking-wider mt-0.5">Locked</div>
      </div>
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
    </div>
  </main>

  <!-- Looking Glass Modal -->
  <div id="lg-modal" class="hidden modal-overlay" onclick="if(event.target===this)closeLgModal()">
    <div class="modal-content">
      <div class="flex items-center justify-between p-4 border-b border-cf-border">
        <div>
          <h3 class="text-sm font-semibold" style="color:var(--text-strong)">Looking Glass</h3>
          <p id="lg-prefix-label" class="text-xs text-cf-gray mt-0.5"></p>
        </div>
        <button onclick="closeLgModal()" class="text-cf-gray hover:text-cf-orange p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="lg-content" class="p-4">
        <div class="flex items-center justify-center py-12">
          <div class="spinner"></div>
          <span class="ml-2 text-xs text-cf-gray">Loading BGP routes...</span>
        </div>
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

  <script>
    // ─── State ────────────────────────────────────────────────────
    var savedAccounts = [];
    var activeAccountId = '';
    var allPrefixes = [];
    var filteredPrefixes = [];
    var expandedRows = {};
    var childData = {};
    var pendingToggle = null;
    var expandedAccountTokens = {};
    var rdapCache = {};
    var servicesCache = {};
    var bindingModalContext = null;

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
      el.innerHTML = '<div class="space-y-3">' + savedAccounts.map(function(a) {
        var defBadge = a.is_default ? '<span class="badge-advertised ml-2">Default</span>' : '';
        var tokenBadge = '<span class="badge-active ml-1">' + (a.token_count || 0) + ' token' + (a.token_count === 1 ? '' : 's') + '</span>';
        var isExpanded = expandedAccountTokens[a.account_id] || false;
        var chevClass = isExpanded ? 'chevron open' : 'chevron';

        var html = '<div class="rounded-lg border border-cf-border overflow-hidden">' +
          '<div class="flex items-center justify-between p-2.5 cursor-pointer" onclick="toggleAccountTokens(\\'' + escAttr(a.account_id) + '\\')">' +
            '<div class="flex items-center gap-2 text-xs">' +
              '<span class="' + chevClass + '" style="font-size:10px">&#9656;</span>' +
              '<span style="color:var(--text-strong)" class="font-medium">' + escHtml(a.account_label || 'Untitled') + '</span>' +
              '<span class="text-cf-gray font-mono text-[10px]">' + a.account_id + '</span>' +
              tokenBadge +
              defBadge +
            '</div>' +
            '<div class="flex gap-1" onclick="event.stopPropagation()">' +
              (a.is_default ? '' : '<button onclick="setDefault(' + a.id + ')" class="text-[10px] text-cf-gray hover:text-cf-orange px-1.5 py-0.5 border border-cf-border rounded hover:border-cf-orange">Set Default</button>') +
              '<button onclick="deleteAccount(' + a.id + ')" class="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 border border-cf-border rounded hover:border-red-400">Delete</button>' +
            '</div>' +
          '</div>';

        if (isExpanded) {
          html += '<div class="border-t border-cf-border p-3" id="token-section-' + escAttr(a.account_id) + '">' +
            '<div class="flex items-center gap-2 mb-2">' +
              '<span class="text-[10px] text-cf-gray font-medium uppercase tracking-wider">API Tokens</span>' +
            '</div>' +
            '<div id="token-list-' + escAttr(a.account_id) + '"><div class="spinner"></div></div>' +
            '<div class="mt-3 pt-3 border-t border-cf-border">' +
              '<div class="grid grid-cols-1 md:grid-cols-3 gap-2">' +
                '<input id="add-token-label-' + escAttr(a.account_id) + '" type="text" placeholder="Token label (optional)" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-xs text-white focus:border-cf-orange focus:outline-none">' +
                '<input id="add-token-value-' + escAttr(a.account_id) + '" type="password" placeholder="API Token" class="px-2 py-1 rounded-lg border border-cf-border bg-cf-dark text-xs text-white focus:border-cf-orange focus:outline-none">' +
                '<div class="flex gap-1">' +
                  '<button onclick="addToken(\\'' + escAttr(a.account_id) + '\\')" class="px-2.5 py-1 bg-cf-orange text-white text-[10px] font-medium rounded-lg hover:bg-orange-600 transition">Add Token</button>' +
                  '<button onclick="testNewToken(\\'' + escAttr(a.account_id) + '\\')" class="px-2.5 py-1 border border-cf-border text-cf-gray text-[10px] font-medium rounded-lg hover:border-cf-orange hover:text-cf-orange transition">Test</button>' +
                  '<div id="add-token-result-' + escAttr(a.account_id) + '" class="flex items-center text-[10px] ml-1"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }

        html += '</div>';
        return html;
      }).join('') + '</div>';

      // Load tokens for expanded accounts
      savedAccounts.forEach(function(a) {
        if (expandedAccountTokens[a.account_id]) {
          loadTokensForAccount(a.account_id);
        }
      });
    }

    function toggleAccountTokens(accountId) {
      expandedAccountTokens[accountId] = !expandedAccountTokens[accountId];
      renderAccountsList();
    }

    async function loadTokensForAccount(accountId) {
      var el = document.getElementById('token-list-' + accountId);
      if (!el) return;
      try {
        var resp = await fetch('/api/tokens?account_id=' + accountId);
        var data = await resp.json();
        var tokens = data.tokens || [];
        if (tokens.length === 0) {
          el.innerHTML = '<p class="text-[10px] text-cf-gray italic">No tokens added yet. Add one below.</p>';
          return;
        }
        el.innerHTML = '<div class="space-y-1">' + tokens.map(function(t) {
          return '<div class="flex items-center justify-between py-1 px-2 rounded border border-cf-border">' +
            '<div class="flex items-center gap-2 text-[10px]">' +
              '<span class="text-cf-gray font-mono">' + escHtml(t.api_token) + '</span>' +
              (t.token_label ? '<span style="color:var(--text-strong)" class="font-medium">' + escHtml(t.token_label) + '</span>' : '') +
              '<span class="text-cf-gray">' + escHtml(t.created_at || '') + '</span>' +
            '</div>' +
            '<button onclick="deleteToken(' + t.id + ',\\'' + escAttr(accountId) + '\\')" class="text-[10px] text-red-400 hover:text-red-300 px-1 py-0.5 border border-cf-border rounded hover:border-red-400">Remove</button>' +
          '</div>';
        }).join('') + '</div>';
      } catch (e) {
        el.innerHTML = '<p class="text-[10px] text-red-400">Failed to load tokens</p>';
      }
    }

    async function addToken(accountId) {
      var label = document.getElementById('add-token-label-' + accountId).value.trim();
      var token = document.getElementById('add-token-value-' + accountId).value.trim();
      if (!token) { alert('API Token is required'); return; }
      try {
        var resp = await fetch('/api/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_id: accountId, api_token: token, token_label: label })
        });
        var data = await resp.json();
        if (data.error) { alert(data.error); return; }
        document.getElementById('add-token-label-' + accountId).value = '';
        document.getElementById('add-token-value-' + accountId).value = '';
        document.getElementById('add-token-result-' + accountId).innerHTML = '';
        loadAccounts();
        // Keep expanded
        expandedAccountTokens[accountId] = true;
      } catch (e) {
        alert('Failed to add token: ' + e);
      }
    }

    async function testNewToken(accountId) {
      var token = document.getElementById('add-token-value-' + accountId).value.trim();
      if (!token) { alert('Enter a token first'); return; }
      var el = document.getElementById('add-token-result-' + accountId);
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

    async function deleteToken(tokenId, accountId) {
      if (!confirm('Remove this token?')) return;
      await fetch('/api/tokens/' + tokenId, { method: 'DELETE' });
      loadAccounts();
      expandedAccountTokens[accountId] = true;
    }

    async function saveAccount() {
      var label = document.getElementById('set-label').value.trim();
      var accountId = document.getElementById('set-account-id').value.trim();
      if (!accountId) { alert('Account ID is required'); return; }
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_label: label, account_id: accountId })
        });
        document.getElementById('set-label').value = '';
        document.getElementById('set-account-id').value = '';
        loadAccounts();
        // Auto-expand the new account's token section
        expandedAccountTokens[accountId] = true;
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
      var tbody = document.getElementById('prefix-table-body');
      tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-12 text-center text-cf-gray"><div class="spinner"></div><span class="ml-2">Loading prefixes...</span></td></tr>';
      expandedRows = {};
      childData = {};
      try {
        var resp = await fetch('/api/prefixes?account_id=' + activeAccountId);
        var data = await resp.json();
        if (data.error) {
          tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-red-400">' + escHtml(data.error) + '</td></tr>';
          return;
        }
        allPrefixes = data.prefixes || [];
        updateStats();
        applyFilters();
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-red-400">Failed to load: ' + escHtml(String(e)) + '</td></tr>';
      }
    }

    function updateStats() {
      var total = allPrefixes.length;
      var advertised = allPrefixes.filter(function(p) { return p.advertised === true; }).length;
      var withdrawn = allPrefixes.filter(function(p) { return p.advertised === false; }).length;
      var locked = allPrefixes.filter(function(p) { return p.on_demand_locked === true; }).length;
      document.getElementById('stat-total').textContent = total;
      document.getElementById('stat-advertised').textContent = advertised;
      document.getElementById('stat-withdrawn').textContent = withdrawn;
      document.getElementById('stat-locked').textContent = locked;
      document.getElementById('stats-row').classList.toggle('hidden', total === 0);
    }

    function applyFilters() {
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
        return;
      }

      var html = '';
      for (var i = 0; i < filteredPrefixes.length; i++) {
        var p = filteredPrefixes[i];
        var isExpanded = expandedRows[p.id] || false;
        html += renderPrefixRow(p, isExpanded);
        if (isExpanded && childData[p.id]) {
          html += renderChildRows(p.id, childData[p.id]);
        }
      }
      tbody.innerHTML = html;
    }

    function renderPrefixRow(p, isExpanded) {
      var chevClass = isExpanded ? 'chevron open' : 'chevron';
      var lockIcon = p.on_demand_locked ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg><span class="info-bubble" style="width:220px">This prefix is locked. The advertisement state cannot be modified. To unlock, contact your Cloudflare account team.</span></span>' : '';
      var statusBadge = statusBadgeHtml(p.advertised);
      var irrBadge = validationBadge(p.irr_validation_state);
      var rpkiBadge = validationBadge(p.rpki_validation_state);
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
        '<td class="px-2 py-2.5">' + lockIcon + '</td>' +
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
          '<button onclick="event.stopPropagation();openBindingModal(\\'' + escAttr(p.id) + '\\',\\'' + escAttr(p.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Add Service Binding"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg></button>' +
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
            '<td class="px-3"></td>' +
            '<td class="px-2"></td>' +
            '<td class="px-3 pl-8 font-mono text-cf-gray"><span class="text-purple-400 mr-1">&#9500;&#9472;</span> <span class="badge-service">' + escHtml(b.service_name) + '</span> <span class="text-cf-gray ml-1">' + escHtml(b.cidr) + '</span></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"><span class="badge-' + (b.provisioning && b.provisioning.state === 'active' ? 'valid' : 'pending') + '">' + escHtml(b.provisioning ? b.provisioning.state : 'unknown') + '</span></td>' +
            '<td class="px-3"></td><td class="px-3"></td><td class="px-3"></td><td class="px-3"></td>' +
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
          var bgpEnabled = bp.on_demand && bp.on_demand.on_demand_enabled;
          var toggleHtml = '';
          if (bgpEnabled) {
            toggleHtml = '<button class="toggle-btn' + (bgpAdv ? ' active' : '') + '"' +
              (bgpLocked ? ' disabled title="Locked"' : ' onclick="event.stopPropagation();confirmToggle(\\'' + prefixId + '\\',\\'' + bp.id + '\\',' + (bgpAdv ? 'false' : 'true') + ',\\'' + escAttr(bp.cidr) + '\\')"') +
              '><span class="toggle-knob"></span></button>';
          }

          html += '<tr class="child-row border-b border-cf-border">' +
            '<td class="px-3"></td>' +
            '<td class="px-2">' + (bgpLocked ? '<span class="info-tip" tabindex="0" style="cursor:help"><svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg><span class="info-bubble" style="width:220px">This prefix is locked. The advertisement state cannot be modified. To unlock, contact your Cloudflare account team.</span></span>' : '') + '</td>' +
            '<td class="px-3 pl-8 font-mono" style="color:var(--text-strong)"><span class="text-cf-orange mr-1">' + connector + '</span> <span class="cidr-hover" onmouseenter="showRdap(\\'' + escAttr(bp.cidr) + '\\',this)">' + escHtml(bp.cidr) + '<span class="rdap-tip"></span></span></td>' +
            '<td class="px-3 text-cf-gray">' + (bp.asn != null ? bp.asn : '—') + '</td>' +
            '<td class="px-3">' + statusBadgeHtml(bgpAdv) + ' ' + toggleHtml + '</td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"></td>' +
            '<td class="px-3"><button onclick="event.stopPropagation();openLgModal(\\'' + escAttr(bp.cidr) + '\\')" class="text-cf-gray hover:text-cf-orange" title="Looking Glass"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button></td>' +
          '</tr>';
        }
      }
      if ((!data.bgp_prefixes || data.bgp_prefixes.length === 0) && (!data.bindings || data.bindings.length === 0)) {
        html += '<tr class="child-row border-b border-cf-border"><td colspan="10" class="px-3 pl-8 py-2 text-cf-gray italic">No BGP sub-prefixes or service bindings</td></tr>';
      }
      // Add binding row
      var parentPrefix = allPrefixes.find(function(p) { return p.id === prefixId; });
      var parentCidr = parentPrefix ? parentPrefix.cidr : '';
      html += '<tr class="child-row border-b border-cf-border">' +
        '<td class="px-3"></td><td class="px-2"></td>' +
        '<td class="px-3 pl-8" colspan="7">' +
          '<button onclick="event.stopPropagation();openBindingModal(\\'' + escAttr(prefixId) + '\\',\\'' + escAttr(parentCidr) + '\\')" class="text-cf-gray hover:text-cf-orange text-[10px] flex items-center gap-1 py-1">' +
            '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>' +
            'Add Service Binding' +
          '</button>' +
        '</td>' +
      '</tr>';
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
        childData[prefixId] = { bgp_prefixes: [], bindings: [], loading: true };
        renderPrefixTable();

        try {
          var bgpResp = fetch('/api/prefixes/' + prefixId + '/bgp?account_id=' + activeAccountId);
          var bindResp = fetch('/api/prefixes/' + prefixId + '/bindings?account_id=' + activeAccountId);
          var results = await Promise.all([bgpResp, bindResp]);
          var bgpData = await results[0].json();
          var bindData = await results[1].json();
          childData[prefixId] = {
            bgp_prefixes: bgpData.bgp_prefixes || [],
            bindings: bindData.bindings || [],
            loading: false
          };
        } catch (e) {
          childData[prefixId] = { bgp_prefixes: [], bindings: [], loading: false, error: String(e) };
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

      try {
        var resp = await fetch('/api/prefixes/' + t.prefixId + '/bgp/' + t.bgpPrefixId + '/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ advertised: t.advertised, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.ok) {
          // Refresh the child data for this prefix
          delete childData[t.prefixId];
          toggleRow(t.prefixId);
          // Close and re-expand to refresh
          expandedRows[t.prefixId] = false;
          setTimeout(function() { toggleRow(t.prefixId); }, 100);
        } else {
          alert('Toggle failed: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Toggle failed: ' + e);
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

    async function openBindingModal(prefixId, parentCidr) {
      bindingModalContext = { prefixId: prefixId, parentCidr: parentCidr };
      var parsed = parseCIDR(parentCidr);
      if (!parsed) return;

      // Set prefix label
      document.getElementById('binding-modal-prefix').textContent = 'Prefix: ' + parentCidr;

      // Populate mask dropdown
      var maskSel = document.getElementById('binding-mask');
      var maxMask = parsed.v6 ? 48 : 32;
      var html = '';
      for (var m = parsed.maskLen; m <= maxMask; m++) {
        html += '<option value="' + m + '"' + (m === parsed.maskLen ? ' selected' : '') + '>/' + m + '</option>';
      }
      maskSel.innerHTML = html;

      // Pre-fill IP with parent network address
      document.getElementById('binding-ip').value = ipToString(parsed.network, parsed.v6);

      // Clear validation
      document.getElementById('binding-validation').classList.add('hidden');
      document.getElementById('binding-error').classList.add('hidden');
      document.getElementById('binding-submit-btn').disabled = false;

      // Load services into dropdown
      var svcSel = document.getElementById('binding-service');
      svcSel.innerHTML = '<option value="">Loading services...</option>';
      document.getElementById('binding-modal').classList.remove('hidden');

      var services = await loadServices();
      if (services.length === 0) {
        svcSel.innerHTML = '<option value="">No services available</option>';
      } else {
        svcSel.innerHTML = services.map(function(s) {
          return '<option value="' + escAttr(s.id) + '">' + escHtml(s.name) + '</option>';
        }).join('');
      }

      // If this is the first binding, lock CIDR to match parent prefix
      var existingBindings = (childData[prefixId] && childData[prefixId].bindings) || [];
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

      // Check address family matches
      if (childParsed.v6 !== parentParsed.v6) return 'Address family mismatch (IPv4 vs IPv6)';

      // Check containment
      if (!cidrContains(parentParsed, childParsed)) return 'CIDR ' + childCidr + ' is not within parent prefix ' + parentCidr;

      // Check overlap with existing bindings
      var existingBindings = (childData[prefixId] && childData[prefixId].bindings) || [];
      for (var i = 0; i < existingBindings.length; i++) {
        var existing = parseCIDR(existingBindings[i].cidr);
        if (existing && cidrOverlaps(childParsed, existing)) {
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

    // ─── RDAP Whois Tooltip ────────────────────────────────────────
    async function showRdap(cidr, el) {
      var tipEl = el.querySelector('.rdap-tip');
      if (!tipEl) return;
      if (rdapCache[cidr]) {
        tipEl.innerHTML = formatRdap(rdapCache[cidr]);
        return;
      }
      tipEl.innerHTML = '<div class="rdap-row"><span class="rdap-label">Loading...</span></div>';
      try {
        var resp = await fetch('/api/rdap?prefix=' + encodeURIComponent(cidr));
        var data = await resp.json();
        if (data.result) {
          rdapCache[cidr] = data.result;
          tipEl.innerHTML = formatRdap(data.result);
        } else {
          tipEl.innerHTML = '<div class="rdap-row"><span class="rdap-val" style="color:#ef4444">Lookup failed</span></div>';
        }
      } catch (e) {
        tipEl.innerHTML = '<div class="rdap-row"><span class="rdap-val" style="color:#ef4444">Lookup failed</span></div>';
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
    async function openLgModal(prefix) {
      document.getElementById('lg-prefix-label').textContent = prefix;
      document.getElementById('lg-content').innerHTML =
        '<div class="flex items-center justify-center py-12"><div class="spinner"></div><span class="ml-2 text-xs text-cf-gray">Loading BGP routes for ' + escHtml(prefix) + '...</span></div>';
      document.getElementById('lg-modal').classList.remove('hidden');

      try {
        var resp = await fetch('/api/looking-glass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix: prefix, account_id: activeAccountId })
        });
        var data = await resp.json();
        if (data.error) {
          document.getElementById('lg-content').innerHTML =
            '<div class="text-center py-8 text-red-400 text-xs">' + escHtml(data.error) + '</div>';
          return;
        }
        renderLookingGlass(data.result, prefix);
      } catch (e) {
        document.getElementById('lg-content').innerHTML =
          '<div class="text-center py-8 text-red-400 text-xs">Failed to load: ' + escHtml(String(e)) + '</div>';
      }
    }

    function closeLgModal() {
      document.getElementById('lg-modal').classList.add('hidden');
    }

    function renderLookingGlass(result, prefix) {
      var container = document.getElementById('lg-content');
      if (!result || !result.routes || result.routes.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-cf-gray text-xs">No BGP routes found for ' + escHtml(prefix) + '</div>';
        return;
      }

      var routes = result.routes;
      var meta = result.meta || {};
      var asnInfoMap = {};
      if (meta.asn_info) {
        for (var i = 0; i < meta.asn_info.length; i++) {
          var info = meta.asn_info[i];
          asnInfoMap[info.asn] = info;
        }
      }

      // Build RPKI map from prefix_origins
      var rpkiMap = {};
      if (meta.prefix_origins) {
        for (var i = 0; i < meta.prefix_origins.length; i++) {
          var po = meta.prefix_origins[i];
          rpkiMap[po.origin] = po.rpki_validation;
        }
      }

      // Build graph data: unique nodes and edges
      var nodeSet = {};
      var edgeSet = {};
      var nodeLayers = {};

      for (var r = 0; r < routes.length; r++) {
        var path = routes[r].as_path;
        if (!path || path.length === 0) continue;
        // Remove prepending (consecutive duplicates)
        var cleaned = [path[0]];
        for (var k = 1; k < path.length; k++) {
          if (path[k] !== path[k - 1]) cleaned.push(path[k]);
        }
        // Origin is last ASN; reverse so origin is at left (layer 0)
        var reversed = cleaned.slice().reverse();
        for (var n = 0; n < reversed.length; n++) {
          var asn = reversed[n];
          if (!nodeSet[asn]) {
            nodeSet[asn] = true;
            nodeLayers[asn] = n;
          } else {
            // Take the minimum layer (closest to origin)
            nodeLayers[asn] = Math.min(nodeLayers[asn], n);
          }
          if (n > 0) {
            var eKey = reversed[n - 1] + '-' + reversed[n];
            edgeSet[eKey] = { from: reversed[n - 1], to: reversed[n] };
          }
        }
      }

      // Assign layers and compute positions
      var nodes = Object.keys(nodeSet).map(Number);
      var edges = Object.values(edgeSet);

      // Group nodes by layer
      var layers = {};
      var maxLayer = 0;
      for (var i = 0; i < nodes.length; i++) {
        var l = nodeLayers[nodes[i]];
        if (!layers[l]) layers[l] = [];
        layers[l].push(nodes[i]);
        maxLayer = Math.max(maxLayer, l);
      }

      // Calculate positions
      var nodeWidth = 140;
      var nodeHeight = 36;
      var layerGap = 180;
      var nodeGap = 50;
      var positions = {};
      var svgWidth = (maxLayer + 1) * layerGap + 100;
      var maxNodesInLayer = 0;
      for (var l in layers) {
        maxNodesInLayer = Math.max(maxNodesInLayer, layers[l].length);
      }
      var svgHeight = Math.max(300, maxNodesInLayer * (nodeHeight + nodeGap) + 60);

      for (var l = 0; l <= maxLayer; l++) {
        var layerNodes = layers[l] || [];
        var totalHeight = layerNodes.length * nodeHeight + (layerNodes.length - 1) * nodeGap;
        var startY = (svgHeight - totalHeight) / 2;
        for (var j = 0; j < layerNodes.length; j++) {
          positions[layerNodes[j]] = {
            x: 50 + l * layerGap,
            y: startY + j * (nodeHeight + nodeGap)
          };
        }
      }

      // Country flag helper
      function countryFlag(code) {
        if (!code || code.length !== 2) return '';
        var c1 = 0x1F1E6 + code.charCodeAt(0) - 65;
        var c2 = 0x1F1E6 + code.charCodeAt(1) - 65;
        return String.fromCodePoint(c1) + String.fromCodePoint(c2);
      }

      // Render SVG
      var svgParts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" style="width:100%;height:auto;min-height:300px;max-height:600px;">'];

      // Draw edges
      for (var e = 0; e < edges.length; e++) {
        var fromPos = positions[edges[e].from];
        var toPos = positions[edges[e].to];
        if (!fromPos || !toPos) continue;
        var x1 = fromPos.x + nodeWidth;
        var y1 = fromPos.y + nodeHeight / 2;
        var x2 = toPos.x;
        var y2 = toPos.y + nodeHeight / 2;
        var cpx = (x1 + x2) / 2;
        svgParts.push('<path class="lg-edge" d="M' + x1 + ',' + y1 + ' C' + cpx + ',' + y1 + ' ' + cpx + ',' + y2 + ' ' + x2 + ',' + y2 + '" stroke="' + (document.documentElement.getAttribute('data-theme') === 'light' ? '#9CA3AF' : '#4B5563') + '"/>');
      }

      // Draw nodes
      for (var i = 0; i < nodes.length; i++) {
        var asn = nodes[i];
        var pos = positions[asn];
        if (!pos) continue;
        var info = asnInfoMap[asn] || {};
        var rpki = rpkiMap[asn];
        var fillColor = rpki === 'valid' ? (document.documentElement.getAttribute('data-theme') === 'light' ? '#DCFCE7' : '#052E16') :
                        rpki === 'invalid' ? (document.documentElement.getAttribute('data-theme') === 'light' ? '#FEE2E2' : '#450A0A') :
                        (document.documentElement.getAttribute('data-theme') === 'light' ? '#F3F4F6' : '#1F2937');
        var strokeColor = rpki === 'valid' ? '#22c55e' : rpki === 'invalid' ? '#ef4444' : (document.documentElement.getAttribute('data-theme') === 'light' ? '#D1D5DB' : '#374151');
        var textColor = document.documentElement.getAttribute('data-theme') === 'light' ? '#111827' : '#E5E7EB';
        var flag = countryFlag(info.country_code ? info.country_code.toUpperCase() : '');
        var orgName = info.org_name || info.as_name || '';
        if (orgName.length > 16) orgName = orgName.substring(0, 14) + '..';

        svgParts.push('<g class="lg-node" transform="translate(' + pos.x + ',' + pos.y + ')">');
        svgParts.push('<rect width="' + nodeWidth + '" height="' + nodeHeight + '" fill="' + fillColor + '" stroke="' + strokeColor + '" stroke-width="1.5" rx="6"/>');
        svgParts.push('<text x="' + (nodeWidth / 2) + '" y="14" text-anchor="middle" fill="' + textColor + '" font-size="11" font-weight="600" font-family="Inter,system-ui,sans-serif">' + flag + ' AS' + asn + '</text>');
        svgParts.push('<text x="' + (nodeWidth / 2) + '" y="28" text-anchor="middle" fill="' + (document.documentElement.getAttribute('data-theme') === 'light' ? '#6B7280' : '#8B949E') + '" font-size="9" font-family="Inter,system-ui,sans-serif">' + escHtml(orgName) + '</text>');
        svgParts.push('</g>');
      }

      svgParts.push('</svg>');

      // Build route table
      var tableHtml = '<div class="overflow-x-auto mt-4 border-t border-cf-border pt-4">' +
        '<div class="flex items-center justify-between mb-2">' +
          '<span class="text-xs font-medium" style="color:var(--text-strong)">' + routes.length + ' routes from ' + (meta.collectors ? meta.collectors.length : '?') + ' collectors</span>' +
        '</div>' +
        '<table class="w-full text-xs">' +
        '<thead><tr class="border-b border-cf-border">' +
          '<th class="px-2 py-2 text-cf-gray font-medium text-left">Collector</th>' +
          '<th class="px-2 py-2 text-cf-gray font-medium text-left">AS Path</th>' +
          '<th class="px-2 py-2 text-cf-gray font-medium text-left">Next Hop</th>' +
          '<th class="px-2 py-2 text-cf-gray font-medium text-left">Peer ASN</th>' +
        '</tr></thead><tbody>';

      for (var r = 0; r < Math.min(routes.length, 50); r++) {
        var route = routes[r];
        var pathStr = (route.as_path || []).join(' ');
        tableHtml += '<tr class="border-b border-cf-border hover:bg-cf-surface">' +
          '<td class="px-2 py-1.5 text-cf-gray">' + escHtml(route.collector || '') + '</td>' +
          '<td class="px-2 py-1.5 font-mono" style="color:var(--text-strong)">' + escHtml(pathStr) + '</td>' +
          '<td class="px-2 py-1.5 font-mono text-cf-gray">' + escHtml(route.next_hop || '') + '</td>' +
          '<td class="px-2 py-1.5 text-cf-gray">' + (route.peer_asn || '') + '</td>' +
        '</tr>';
      }
      if (routes.length > 50) {
        tableHtml += '<tr><td colspan="4" class="px-2 py-2 text-center text-cf-gray italic">Showing 50 of ' + routes.length + ' routes</td></tr>';
      }
      tableHtml += '</tbody></table></div>';

      // RPKI & prefix origin info
      var rpkiHtml = '';
      if (meta.prefix_origins && meta.prefix_origins.length > 0) {
        rpkiHtml = '<div class="flex flex-wrap gap-2 mt-3">';
        for (var i = 0; i < meta.prefix_origins.length; i++) {
          var po = meta.prefix_origins[i];
          var badge = po.rpki_validation === 'valid' ? 'badge-valid' : po.rpki_validation === 'invalid' ? 'badge-invalid' : 'badge-unknown';
          rpkiHtml += '<span class="' + badge + '">Origin AS' + po.origin + ': RPKI ' + po.rpki_validation + ' (' + Math.round(po.visibility * 100) + '% visibility)</span>';
        }
        rpkiHtml += '</div>';
      }

      container.innerHTML =
        '<div class="border border-cf-border rounded-lg p-3 overflow-x-auto">' + svgParts.join('') + '</div>' +
        rpkiHtml +
        tableHtml;
    }

    // ─── Helpers ──────────────────────────────────────────────────
    function statusBadgeHtml(advertised) {
      if (advertised === true) return '<span class="badge-advertised">Advertised</span>';
      if (advertised === false) return '<span class="badge-withdrawn">Withdrawn</span>';
      return '<span class="badge-unknown">Unknown</span>';
    }

    function validationBadge(state) {
      if (!state) return '<span class="badge-unknown">—</span>';
      var s = state.toLowerCase();
      if (s === 'valid') return '<span class="badge-valid">Valid</span>';
      if (s === 'invalid') return '<span class="badge-invalid">Invalid</span>';
      if (s === 'pending') return '<span class="badge-pending">Pending</span>';
      return '<span class="badge-unknown">' + escHtml(state) + '</span>';
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
