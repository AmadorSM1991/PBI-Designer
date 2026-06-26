import { useState, useRef, useCallback, useEffect, Fragment } from "react";

// ═══════════════════════════════════════════════════════════════════
// APP SHELL THEMES — solo cambian la UI (panels, topbar, chat)
// El usuario las elige para su comodidad visual
// NUNCA afectan el canvas
// ═══════════════════════════════════════════════════════════════════
const APP_THEMES = {
  light:  { id:"light",  icon:"☀️",  name:"Light",
    bg:"#f1f5f9", surface:"#ffffff", topbar:"#ffffff", sidebar:"#ffffff",
    border:"#e2e8f0", border2:"#cbd5e1",
    text:"#1e293b", textMuted:"#64748b", textLight:"#94a3b8",
    accent:"#2563eb", accentBg:"#eff6ff", accentLight:"#dbeafe",
    success:"#059669", danger:"#dc2626",
    bubbleUser:"#eff6ff", bubbleAI:"#f8fafc", inputBg:"#f8fafc",
  },
  slate:  { id:"slate",  icon:"🌑",  name:"Dark",
    bg:"#0f172a", surface:"#1e293b", topbar:"#0f172a", sidebar:"#1e293b",
    border:"#334155", border2:"#475569",
    text:"#f1f5f9", textMuted:"#94a3b8", textLight:"#64748b",
    accent:"#38bdf8", accentBg:"#0c2d4a", accentLight:"#0369a1",
    success:"#34d399", danger:"#f87171",
    bubbleUser:"#0c2d4a", bubbleAI:"#1e293b", inputBg:"#0f172a",
  },
  navy:   { id:"navy",   icon:"🌊",  name:"Navy",
    bg:"#060e1c", surface:"#0e1e3a", topbar:"#060e1c", sidebar:"#0e1e3a",
    border:"#1a2e50", border2:"#243d65",
    text:"#e0eaff", textMuted:"#7aa3d4", textLight:"#4a6080",
    accent:"#3b82f6", accentBg:"#1a2d50", accentLight:"#1d3a6b",
    success:"#34d399", danger:"#f87171",
    bubbleUser:"#1a2d50", bubbleAI:"#0e1e3a", inputBg:"#060e1c",
  },
};

// ═══════════════════════════════════════════════════════════════════
// CANVAS DEFAULT — Clean Light, punto de partida siempre
// Solo la IA lo modifica cuando el usuario lo pide explícitamente
// ═══════════════════════════════════════════════════════════════════
const CANVAS_DEFAULT = {
  canvas:"#ffffff", wallpaper:"#e8edf2", cardBg:"#ffffff", cardBorder:"#e2e8f0",
  accent:"#2563eb", accent2:"#1d4ed8", secondary:"#eff6ff",
  text:"#1e293b", textSub:"#64748b", textMuted:"#94a3b8",
  headerBg:"#2563eb", success:"#059669", danger:"#dc2626", warning:"#f59e0b",
  r:8,
};

// ── TAMAÑOS DE CANVAS — estándares reales de Power BI ─────────────
const CANVAS_SIZES=[
  {id:"960x580",   label:"PBI Default — 960×580",      w:960,  h:580},
  {id:"1280x720",  label:"16:9 — 1280×720",            w:1280, h:720},
  {id:"1600x900",  label:"16:9 — 1600×900",            w:1600, h:900},
  {id:"1920x1080", label:"Full HD — 1920×1080",        w:1920, h:1080},
  {id:"900x1600",  label:"9:16 Vertical — 900×1600",   w:900,  h:1600},
  {id:"768x1024",  label:"3:4 Vertical — 768×1024",    w:768,  h:1024},
  {id:"1024x768",  label:"4:3 — 1024×768",             w:1024, h:768},
  {id:"custom",    label:"Personalizado",               w:1280, h:720},
];

// ── NAV DEFAULT — config completa del nav builder ─────────────────
const NAV_DEFAULT={
  position:"left", style:"collapsible",
  width:220, widthCollapsed:64,
  logoUrl:"", reportName:"Mi Reporte", reportSubtitle:"",
  fontSize:13, iconSize:16, borderRadius:8,
  colors:{
    bg:"#1e293b", accent:"#3b82f6",
    textActive:"#ffffff", textInactive:"#94a3b8",
    hover:"#ffffff", hoverOpacity:15,
    press:"#ffffff", pressOpacity:20,
    selected:"#3b82f6", selectedOpacity:25,
  },
  pages:[
    {id:1,label:"Dashboard",icon:"⊞"},
    {id:2,label:"Ventas",icon:"📊"},
    {id:3,label:"Finanzas",icon:"💰"},
    {id:4,label:"RRHH",icon:"👥"},
  ],
  exportSeparate:false,
};

// Paleta de iconos para páginas del nav (categorizados para dashboards)
const NAV_ICONS=["⊞","📊","📈","📉","💰","💵","💳","🏦","🛒","📦","🚚","🏭","⚙","🔧","👥","👤","🧑‍💼","📋","📁","🗂","📅","🕐","🌍","🗺","📍","🎯","🏆","⭐","🔔","📌","🔍","🔎","💡","⚡","🔥","✅","⚠","❤","🩺","🥑","🌱","🍎","🐄","☀","💧","📡","🖥","📱","🏠","🏢","🎓","📚"];


// ── PALETA DE ELEMENTOS ───────────────────────────────────────────
const PALETTE=[
  {type:"kpi",    label:"KPI Card",    icon:"▣", color:"#2563eb"},
  {type:"kpispark",label:"KPI Sparkline",icon:"📈",color:"#0ea5e9"},
  {type:"bar",    label:"Bar Chart",   icon:"▦", color:"#7c3aed"},
  {type:"line",   label:"Line Chart",  icon:"📈", color:"#059669"},
  {type:"pie",    label:"Donut Chart", icon:"◎", color:"#d97706"},
  {type:"gauge",  label:"Gauge",       icon:"◔", color:"#0891b2"},
  {type:"scatter",label:"Scatter",     icon:"⠿", color:"#db2777"},
  {type:"treemap",label:"Treemap",     icon:"▥", color:"#16a34a"},
  {type:"matrix", label:"Matrix",      icon:"▤", color:"#9333ea"},
  {type:"table",  label:"Table",       icon:"⊞", color:"#dc2626"},
  {type:"slicer", label:"Slicer",      icon:"⊟", color:"#0891b2"},
  {type:"card",   label:"Text Card",   icon:"☐", color:"#7c3aed"},
  {type:"nav",    label:"Nav Menu",    icon:"☰", color:"#059669"},
  {type:"header", label:"Header Bar",  icon:"▬", color:"#4f46e5"},
  {type:"image",  label:"Image/Logo",  icon:"🖼", color:"#ea580c"},
  {type:"button", label:"Button",      icon:"⬭", color:"#db2777"},
];
const DEF_SIZE={kpi:[170,88],kpispark:[180,110],bar:[320,215],line:[310,195],pie:[205,205],gauge:[180,140],scatter:[280,200],treemap:[260,200],matrix:[300,180],table:[310,215],slicer:[170,215],card:[205,120],nav:[190,550],header:[940,58],image:[165,125],button:[145,44]};

// ── SNAP / HANDLES ────────────────────────────────────────────────
const GRID=8;
const snap=v=>Math.round(v/GRID)*GRID;
// [cursor, dx, dy, dw, dh] — dx/dy: cuánto mueve la posición; dw/dh: cuánto cambia el tamaño
// Borde derecho (e): solo ancho. Borde izq (w): mueve x + ancho inverso. Análogo vertical.
const HANDLES=[
  ["nw-resize",1,1,-1,-1],["n-resize",0,1,0,-1],["ne-resize",0,1,1,-1],
  ["w-resize",1,0,-1,0],                          ["e-resize",0,0,1,0],
  ["sw-resize",1,0,-1,1],["s-resize",0,0,0,1],    ["se-resize",0,0,1,1],
];
const HPOS=[[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]];
const MIN_W=60,MIN_H=40;

// ── HELPERS ───────────────────────────────────────────────────────
function adjHex(hex,f){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if(!r)return hex;
  const c=v=>Math.min(255,Math.max(0,Math.round(parseInt(v,16)*f)));
  return`#${c(r[1]).toString(16).padStart(2,"0")}${c(r[2]).toString(16).padStart(2,"0")}${c(r[3]).toString(16).padStart(2,"0")}`;
}
function rgba(hex,a){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if(!r)return hex;
  return`rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${a})`;
}
// Mezcla dos colores hex: t=0 → a, t=1 → b
function mix(a,b,t){
  const pa=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);
  const pb=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(b);
  if(!pa||!pb)return a;
  const m=(x,y)=>Math.round(parseInt(x,16)*(1-t)+parseInt(y,16)*t).toString(16).padStart(2,"0");
  return`#${m(pa[1],pb[1])}${m(pa[2],pb[2])}${m(pa[3],pb[3])}`;
}
// ¿Es un color oscuro? (para decidir tono del nav)
function isDark(hex){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if(!r)return false;
  const lum=0.299*parseInt(r[1],16)+0.587*parseInt(r[2],16)+0.114*parseInt(r[3],16);
  return lum<128;
}
// Luminancia relativa WCAG
function _relLum(hex){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if(!r)return 0;
  const ch=v=>{const s=parseInt(v,16)/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
  return 0.2126*ch(r[1])+0.7152*ch(r[2])+0.0722*ch(r[3]);
}
// Ratio de contraste WCAG entre dos colores (1 a 21)
function contrastRatio(fg,bg){
  const l1=_relLum(fg),l2=_relLum(bg);
  const lighter=Math.max(l1,l2),darker=Math.min(l1,l2);
  return (lighter+0.05)/(darker+0.05);
}
function fileIcon(n=""){
  if(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(n))return"🖼";
  if(/\.json$/i.test(n))return"📄";
  if(/\.pdf$/i.test(n))return"📕";
  if(/\.(xlsx|xls|csv)$/i.test(n))return"📊";
  return"📎";
}
function fmtN(n){
  if(Math.abs(n)>=1e6)return(n/1e6).toFixed(1)+'M';
  if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1)+'K';
  return Number.isInteger(n)?String(n):n.toFixed(2);
}
function tabularSummary(headers,dataRows,source){
  const cols=headers.map((h,i)=>{
    const vals=dataRows.map(r=>r[i]).filter(v=>v!==''&&v!=null);
    const nums=vals.map(v=>parseFloat(String(v).replace(/[$,%\s]/g,''))).filter(v=>!isNaN(v)&&isFinite(v));
    if(nums.length>vals.length*0.6){
      const sum=nums.reduce((a,b)=>a+b,0);
      return{h,k:'n',sum,avg:sum/nums.length,n:nums.length};
    }
    const uniq=[...new Set(vals.map(String))];
    return{h,k:'c',uniq,n:vals.length};
  });
  const colLines=cols.map(c=>
    c.k==='n'
      ?`  • ${c.h} [numérica: total=${fmtN(c.sum)}, prom=${fmtN(c.avg)}]`
      :`  • ${c.h} [categórica: ${c.uniq.slice(0,6).join(', ')}${c.uniq.length>6?` +${c.uniq.length-6} más`:''}]`
  );
  const sample=dataRows.slice(0,5).map(r=>
    headers.map((_,i)=>String(r[i]??'').slice(0,16)).join(' | ')
  );
  const numCols=cols.filter(c=>c.k==='n').map(c=>c.h);
  const catCols=cols.filter(c=>c.k==='c').map(c=>c.h);
  const content=[
    `${source} — ${dataRows.length} filas, ${headers.length} columnas`,
    'Columnas:',
    ...colLines,
    '',
    'Muestra:',
    headers.join(' | '),
    ...sample
  ].join('\n');
  return{content,numCols,catCols,rows:dataRows.length};
}
async function readFile(file){
  const MAX_SIZE=15*1024*1024; // 15 MB
  if(file.size>MAX_SIZE){
    throw new Error(`El archivo "${file.name}" es demasiado grande (${(file.size/1024/1024).toFixed(1)} MB). Máximo: 15 MB.`);
  }
  if(file.type.startsWith("image/")){
    const b64=await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.readAsDataURL(file);});
    return{type:"image",name:file.name,mediaType:file.type,base64:b64};
  }
  // Excel — formato binario, necesita SheetJS para parsear
  if(/\.(xlsx|xls)$/i.test(file.name)){
    try{
      const XLSX=await import('xlsx');
      const ab=await file.arrayBuffer();
      const wb=XLSX.read(ab);
      const sheetName=wb.SheetNames[0];
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:''});
      const headers=(rows[0]||[]).map(String).filter(Boolean);
      const dataRows=rows.slice(1).filter(r=>r.some(c=>c!==''&&c!=null));
      const{content,numCols,catCols,rows:rowCount}=tabularSummary(headers,dataRows,`Hoja "${sheetName}"`);
      return{type:"text",name:file.name,content,meta:{rows:rowCount,numCols,catCols}};
    }catch(err){
      throw new Error(`No se pudo leer el Excel "${file.name}": ${err.message}`);
    }
  }
  // CSV — texto plano, parseo propio sin librería
  if(/\.csv$/i.test(file.name)){
    const raw=await file.text();
    const lines=raw.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<2)return{type:"text",name:file.name,content:raw.slice(0,3000)};
    const sep=lines[0].includes('\t')?'\t':lines[0].split(';').length>lines[0].split(',').length?';':',';
    const parseL=l=>{
      const res=[];let cur='';let q=false;
      for(const ch of l){if(ch==='"'){q=!q;}else if(ch===sep&&!q){res.push(cur.trim());cur='';}else cur+=ch;}
      res.push(cur.trim());return res;
    };
    const headers=parseL(lines[0]).map(h=>h.replace(/^"|"$/g,''));
    const dataRows=lines.slice(1).map(l=>parseL(l).map(v=>v.replace(/^"|"$/g,'')));
    const{content,numCols,catCols,rows:rowCount}=tabularSummary(headers,dataRows,'CSV');
    return{type:"text",name:file.name,content,meta:{rows:rowCount,numCols,catCols}};
  }
  return{type:"text",name:file.name,content:await file.text()};
}

// Convierte links de compartir (Drive/Dropbox/OneDrive/Imgur) a URL directa de imagen
function directImageUrl(url=""){
  const u=url.trim();
  if(!u)return u;
  // Google Drive: /file/d/ID/view → uc?export=view&id=ID
  let m=u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if(m)return`https://drive.google.com/uc?export=view&id=${m[1]}`;
  m=u.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if(m)return`https://drive.google.com/uc?export=view&id=${m[1]}`;
  // Dropbox: www.dropbox.com → dl.dropboxusercontent.com, sin ?dl=0
  if(/dropbox\.com/.test(u))return u.replace("www.dropbox.com","dl.dropboxusercontent.com").replace(/[?&]dl=\d/,"");
  // OneDrive: 1drv.ms o onedrive.live.com → forzar descarga directa
  if(/1drv\.ms|onedrive\.live\.com/.test(u))return u.includes("?")?u+"&download=1":u+"?download=1";
  // Imgur: página imgur.com/ID → i.imgur.com/ID.png
  m=u.match(/^https?:\/\/(?:www\.)?imgur\.com\/(?:gallery\/|a\/)?([a-zA-Z0-9]+)$/);
  if(m)return`https://i.imgur.com/${m[1]}.png`;
  return u;
}

// ── EXPORT ────────────────────────────────────────────────────────
function buildThemeJson(ct){
  const hex=(c,fb="#000000")=>typeof c==="string"&&/^#[0-9a-fA-F]{6}$/.test(c.trim())?c.trim():fb;
  const accent  =hex(ct.accent,  "#2563eb");
  const accent2 =hex(ct.accent2, "#1d4ed8");
  const canvas  =hex(ct.canvas,  "#ffffff");
  const textCol =hex(ct.text,    "#1e293b");
  const textSub =hex(ct.textSub, "#64748b");
  const success =hex(ct.success, "#059669");
  const danger  =hex(ct.danger,  "#dc2626");
  const warning =hex(ct.warning, "#f59e0b");
  const safeAdj=(c,f,fb)=>hex(adjHex(c,f),fb);
  // Schema MÍNIMO y validado — Power BI endureció la validación en 2025.
  // Solo propiedades de nivel superior garantizadas + textClasses simples.
  // dataColors, background, foreground, tableAccent y textClasses son
  // las propiedades estables que PBI Desktop acepta sin error de schema.
  return{
    name:"PBI Designer",
    dataColors:[accent,accent2,success,warning,danger,
      safeAdj(accent,1.2,accent),safeAdj(accent,0.7,accent2),safeAdj(accent,0.4,"#94a3b8")],
    background:canvas,
    foreground:textCol,
    tableAccent:accent,
    good:success,
    neutral:warning,
    bad:danger,
    maximum:accent,
    minimum:safeAdj(accent,0.4,"#94a3b8"),
    textClasses:{
      title:    {fontFace:"Segoe UI Semibold",fontSize:14,color:textCol},
      header:   {fontFace:"Segoe UI Semibold",fontSize:12,color:textCol},
      label:    {fontFace:"Segoe UI",fontSize:10,color:textSub},
      callout:  {fontFace:"Segoe UI",fontSize:32,color:accent},
    },
  };
}
function buildLayoutJson(els,ct,navCfg,hdrCfg,cw=960,ch=580){
  const pbiMap={kpi:"card",bar:"barChart",line:"lineChart",pie:"donutChart",table:"tableEx",slicer:"slicer",nav:"actionButton",card:"textbox",button:"actionButton",image:"image",header:"shape"};
  return{metadata:{tool:"PBI Designer v2.0",exportedAt:new Date().toISOString()},page:{width:cw,height:ch,background:ct.canvas},colors:{accent:ct.accent,cardBg:ct.cardBg,text:ct.text},header:hdrCfg,navigation:navCfg,elements:els.map(e=>({id:e.id,type:e.type,label:e.label,position:{x:e.x,y:e.y},size:{width:e.w,height:e.h},powerBIVisual:pbiMap[e.type]||"textbox"}))};
}
function buildReadme(els,ct,navCfg,cw=960,ch=580){
  return`PBI Designer v2.0 — Export Guide
===================================
Canvas BG  : ${ct.canvas}
Accent     : ${ct.accent}
Canvas Size: ${cw} × ${ch} px
Elements   : ${els.length}   Nav: ${navCfg.position} / ${navCfg.style}
Exported   : ${new Date().toLocaleString()}

STEP 1 — Import Theme
  Power BI Desktop → View → Themes → Browse for themes → pbi-theme.json

STEP 2 — Set Page Size
  Format pane → Canvas settings → Custom → ${cw} × ${ch} px
  Background: ${ct.canvas}

STEP 3 — Add Visuals (use pbi-layout.json for exact positions)
${els.map(e=>`  [${String(e.type).toUpperCase().padEnd(7)}] "${e.label}"  Left:${e.x}  Top:${e.y}  W:${e.w}  H:${e.h}`).join("\n")}

STEP 4 — Navigation (${navCfg.position} / ${navCfg.style})
  • Rectangle shape, width: ${navCfg.width||190}px, fill: ${ct.secondary}
  • Add Button per page → Action = Bookmark
  • Collapsible: group in Selection Pane, toggle via bookmark
  • Floating: Bring to Front, show/hide via bookmark

Docs: https://learn.microsoft.com/power-bi/create-reports/desktop-report-themes`;
}
function dlUri(n,c,m){const a=document.createElement("a");a.href="data:"+m+";charset=utf-8,"+encodeURIComponent(c);a.download=n;document.body.appendChild(a);a.click();document.body.removeChild(a);}


// ═══════════════════════════════════════════════════════════════════
// AI ENGINE
// canvasTheme en el JSON solo se envía cuando el usuario pide colores
// ═══════════════════════════════════════════════════════════════════
function AI_SYS(cw,ch){return`You are an expert Power BI report designer and dataviz auditor. Help users design professional dashboards.

Always respond in the user's language (Spanish if they write in Spanish).

OUTPUT FORMAT — CRITICAL ORDER:
1. FIRST output the <LAYOUT>...</LAYOUT> block (so it never gets cut off)
2. THEN a brief explanation (max 4 lines). Exception: AUDIT mode outputs <AUDIT>...</AUDIT> instead.
3. NEVER wrap blocks inside markdown code fences (no \`\`\`)
4. JSON must be COMPACT: one line per element, no extra whitespace
5. FORBIDDEN fields: "note", "description", "comment" — ONLY the schema fields below
6. Maximum 20 elements per layout

JSON SCHEMA (for LAYOUT):
{
  "mode": "replace | update",
  "canvasTheme": { "canvas":"#ffffff","wallpaper":"#e8edf2","cardBg":"#ffffff","cardBorder":"#e2e8f0","accent":"#2563eb","accent2":"#1d4ed8","secondary":"#eff6ff","text":"#1e293b","textSub":"#64748b","textMuted":"#94a3b8","headerBg":"#2563eb","success":"#059669","danger":"#dc2626","warning":"#f59e0b","r":8 },
  "header":    { "show": true, "title": "...", "subtitle": "...", "height": 58, "bgColor": "" },
  "navConfig": { "position": "left|right|top|none", "style": "static|collapsible|floating", "width": 190 },
  "elements":  [{ "id":1, "type":"header|nav|kpi|kpispark|bar|line|pie|gauge|scatter|treemap|matrix|table|slicer|card|button|image", "x":0, "y":0, "w":${cw}, "h":58, "label":"Title" }]
}

MODE — CRITICAL:
- "replace" → NEW dashboard from scratch. Return FULL elements array.
- "update" → MODIFY current design. Keep ALL elements with SAME ids/x/y/w/h/label — only change what user asked.
- If user only changes theme/colors → mode:"update", return canvasTheme + SAME elements unchanged.
- Default to "update" when CURRENT_STATE exists and user says "este/el reporte/cámbiale/ahora/también/agrega/quita".
- Use "replace" only for clearly new requests ("crea un dashboard de...", "haz uno nuevo de...").

AUDIT MODE — when user asks "audita", "revisa el diseño", "qué mejorar", "critica", "analiza":
Output <AUDIT>JSON</AUDIT> instead of <LAYOUT>. JSON schema:
{
  "score": 0-100,
  "grade": "A|B|C|D",
  "summary": "Evaluación general en 1 oración",
  "issues": [
    { "severity": "high|medium|low", "category": "jerarquía|contraste|accesibilidad|espaciado|tipografía|solapamiento|dataviz", "element": "id o descripción", "problem": "qué está mal", "fix": "cómo corregirlo" }
  ],
  "strengths": ["punto positivo 1", "punto positivo 2"],
  "quickFixes": ["fix rápido 1", "fix rápido 2"]
}

MOBILE MODE — when user asks "vista móvil", "versión móvil", "layout para teléfono/celular":
Generate a LAYOUT for 900×1600 canvas (9:16 vertical), mode:"replace".
CRITICAL — STACK VERTICALLY with NO OVERLAPS. Each element's y = previous element's (y + h) + 16 gap.
Use this EXACT vertical sequence (x=20, w=860 for all content, gap=16):
  - header:  x=0,   y=0,    w=900, h=70
  - nav:     x=0,   y=70,   w=900, h=54   (position:"top")
  - slicer:  x=20,  y=140,  w=860, h=80   (FILTROS ARRIBA, justo bajo el nav)
  - kpi 1:   x=20,  y=236,  w=860, h=110
  - kpi 2:   x=20,  y=362,  w=860, h=110
  - kpi 3:   x=20,  y=488,  w=860, h=110
  - kpi 4:   x=20,  y=614,  w=860, h=110
  - chart 1: x=20,  y=740,  w=860, h=280
  - chart 2: x=20,  y=1036, w=860, h=280
  - table:   x=20,  y=1332, w=860, h=252
Skip rows you don't need, but NEVER let two elements share vertical space. ALWAYS verify y+h of one ≤ y of the next. Max y+h must be ≤ 1600.
SLICERS/filtros van SIEMPRE arriba (tras el nav), nunca al final.
If there are more KPIs than fit, you may place 2 KPIs side by side: kpi_left x=20 w=422, kpi_right x=458 w=422, same y and h=110.

IMPORT MODE — when user uploads an image of an existing dashboard: analyze the image and recreate the layout as faithfully as possible. Infer element types, approximate positions and sizes. Use mode:"replace".

CANVAS THEME RULES:
- mode:"replace" (NEW dashboard): ALWAYS generate canvasTheme. Detect the domain from the user's request and apply the matching palette below. Never return canvasTheme:null for new dashboards.
- mode:"update": only change canvasTheme if user EXPLICITLY asks to change colors/theme/dark mode.
- If user mentions specific brand colors (e.g. "colores corporativos verdes") → override accent/accent2/headerBg with those.
- "wallpaper" = area OUTSIDE the page. "canvas" = page background itself.

DOMAIN COLOR PALETTES — pick the best match for the request:

AGRICULTURE/COSECHA/CAMPO/FRUTA/ARÁNDANO/PALTA/UVA/CULTIVO/AGRÍCOLA:
{"canvas":"#f8faf5","wallpaper":"#dcfce7","cardBg":"#ffffff","cardBorder":"#bbf7d0","accent":"#16a34a","accent2":"#15803d","secondary":"#f0fdf4","text":"#14532d","textSub":"#166534","textMuted":"#4ade80","headerBg":"#15803d","success":"#16a34a","danger":"#dc2626","warning":"#d97706","r":8}

FINANCE/FINANZAS/COSTOS/PRESUPUESTO/BUDGET/CONTABILIDAD/EBITDA/INVERSIÓN:
{"canvas":"#f8faff","wallpaper":"#dbeafe","cardBg":"#ffffff","cardBorder":"#bfdbfe","accent":"#1e40af","accent2":"#1d4ed8","secondary":"#eff6ff","text":"#1e293b","textSub":"#475569","textMuted":"#94a3b8","headerBg":"#1e3a5f","success":"#059669","danger":"#dc2626","warning":"#d97706","r":8}

MANUFACTURING/PRODUCCIÓN/PROCESO/PLANTA/INDUSTRIA/OEE/EFICIENCIA/TURNO/FÁBRICA:
{"canvas":"#faf5ff","wallpaper":"#ede9fe","cardBg":"#ffffff","cardBorder":"#ddd6fe","accent":"#7c3aed","accent2":"#6d28d9","secondary":"#f5f3ff","text":"#1e1b4b","textSub":"#5b21b6","textMuted":"#8b5cf6","headerBg":"#4c1d95","success":"#059669","danger":"#dc2626","warning":"#d97706","r":8}

SALES/VENTAS/COMERCIAL/RETAIL/TIENDA/PRODUCTO/CLIENTE/CRM:
{"canvas":"#fffbeb","wallpaper":"#fde68a","cardBg":"#ffffff","cardBorder":"#fcd34d","accent":"#b45309","accent2":"#92400e","secondary":"#fef3c7","text":"#1c1917","textSub":"#78350f","textMuted":"#d97706","headerBg":"#92400e","success":"#16a34a","danger":"#dc2626","warning":"#f59e0b","r":8}

HEALTH/SALUD/MÉDICO/HOSPITAL/CLÍNICA/PACIENTE/FARMACIA:
{"canvas":"#f0f9ff","wallpaper":"#bae6fd","cardBg":"#ffffff","cardBorder":"#7dd3fc","accent":"#0284c7","accent2":"#0369a1","secondary":"#e0f2fe","text":"#082f49","textSub":"#0369a1","textMuted":"#38bdf8","headerBg":"#0c4a6e","success":"#059669","danger":"#dc2626","warning":"#d97706","r":8}

TECHNOLOGY/IT/SOFTWARE/DIGITAL/SISTEMA/APP/PLATAFORMA/DATOS/DATA:
{"canvas":"#0f172a","wallpaper":"#020617","cardBg":"#1e293b","cardBorder":"#334155","accent":"#818cf8","accent2":"#6366f1","secondary":"#1e293b","text":"#f1f5f9","textSub":"#94a3b8","textMuted":"#64748b","headerBg":"#1e1b4b","success":"#22c55e","danger":"#f87171","warning":"#fbbf24","r":8}

LOGISTICS/LOGÍSTICA/DELIVERY/SUPPLY/TRANSPORTE/FLOTA/CADENA:
{"canvas":"#f0fdfa","wallpaper":"#a7f3d0","cardBg":"#ffffff","cardBorder":"#99f6e4","accent":"#0891b2","accent2":"#0e7490","secondary":"#ccfbf1","text":"#134e4a","textSub":"#0f766e","textMuted":"#2dd4bf","headerBg":"#164e63","success":"#059669","danger":"#dc2626","warning":"#d97706","r":8}

HR/RRHH/RECURSOS HUMANOS/PERSONAS/EMPLEADOS/NÓMINA/COLABORADORES/TALENTO:
{"canvas":"#fff1f2","wallpaper":"#fecdd3","cardBg":"#ffffff","cardBorder":"#fda4af","accent":"#be185d","accent2":"#9d174d","secondary":"#ffe4e6","text":"#1e293b","textSub":"#be185d","textMuted":"#f43f5e","headerBg":"#831843","success":"#059669","danger":"#dc2626","warning":"#d97706","r":8}

ENERGY/ENERGÍA/UTILITIES/ELECTRICIDAD/SOLAR/CONSUMO/GAS:
{"canvas":"#fffbeb","wallpaper":"#fed7aa","cardBg":"#ffffff","cardBorder":"#fcd34d","accent":"#d97706","accent2":"#b45309","secondary":"#ffedd5","text":"#1c1917","textSub":"#78350f","textMuted":"#f59e0b","headerBg":"#78350f","success":"#16a34a","danger":"#dc2626","warning":"#f59e0b","r":8}

DEFAULT (domain not recognized — use for general/mixed dashboards):
{"canvas":"#f8fafc","wallpaper":"#e2e8f0","cardBg":"#ffffff","cardBorder":"#bfdbfe","accent":"#2563eb","accent2":"#1d4ed8","secondary":"#eff6ff","text":"#1e293b","textSub":"#475569","textMuted":"#94a3b8","headerBg":"#1e3a8a","success":"#059669","danger":"#dc2626","warning":"#f59e0b","r":8}

LAYOUT RULES — Canvas ${cw}×${ch}px, NO overlaps. Apply PROFESSIONAL dashboard design science:

DESIGN PRINCIPLES (Stephen Few, Edward Tufte, Microsoft guidelines):
1. VISUAL HIERARCHY: most important KPIs top-left (eyes land there first). Size = importance: big visual="this matters", small="reference".
2. SCANNING PATTERN: users read top→bottom, left→right (Z-pattern). Layout must follow this: overview at top, detail at bottom.
3. 8PX GRID SYSTEM: ALL gaps, margins and spacing in multiples of 8 (8,16,24). This is non-negotiable for professional polish.
4. WHITESPACE: leave breathing room. Don't cram. Consistent margins (16px from canvas edges).
5. GROUPING: related visuals share alignment and spacing. Misalignment = unprofessional.
6. PROGRESSIVE DISCLOSURE: KPIs (glance) → charts (trends) → tables (detail).

ZONE STRUCTURE (apply the 8px grid):
- header: x=0, y=0, w=${cw}, h=56  ← ALWAYS add {type:"header"} element to elements array
- nav-left: x=0, y=56, w=192, h=${ch}-56  ← ALWAYS add {type:"nav"} element to elements array
- (or nav-top: x=0, y=56, w=${cw}, h=48)
- content margin: 16px from nav and from canvas right/bottom edges
- content_x = nav.width+16, content_w = ${cw}-content_x-16

MANDATORY: The FIRST 2 elements in the array MUST always be:
  {"id":1,"type":"header","x":0,"y":0,"w":${cw},"h":56,"label":"<report title>"}
  {"id":2,"type":"nav","x":0,"y":56,"w":192,"h":${ch}-56,"label":"Nav Menu"}
Then all other elements follow (KPIs, charts, etc.) starting at id:3.

ROW 0 — Filter bar (slicers): y=content_y+16, h=40. ALL slicers horizontal here, NEVER at bottom.
ROW 1 — KPIs (the hero metrics): y=ROW0.bottom+16, h=96. Equal widths, 16px gaps. 3-5 KPIs max.
   kpi_w = floor((content_w-(n-1)*16)/n)
ROW 2 — Primary charts (trends): y=ROW1.bottom+16, h=216. Usually 2 charts, 16px gap.
ROW 3 — Detail (tables/secondary): y=ROW2.bottom+16, fill remaining height-16. Tables and breakdowns.

TITLES: descriptive, not generic. "Ventas por Región" not "Gráfico 1". Titles teach what the user learns.
COLOR DISCIPLINE: 3-5 colors max. Accent for emphasis, neutrals for structure. Never rainbow.
VERIFY every element: x+w≤${cw} AND y+h≤${ch}. Gaps are multiples of 8. No overlaps. Aligned edges.

DOMAIN INTELLIGENCE — match labels and visual types to the domain detected in the user's request:

MANUFACTURING / PROCESS CONTROL → gauge for efficiency/OEE/quality %, bar for production by shift/line, line for hourly/daily trends.
  KPI labels to use: "Producción Diaria", "Producción Total", "Eficiencia de Proceso", "OEE", "Rendimiento", "Tiempo de Ciclo", "Defectos PPM", "Capacidad Utilizada", "Paros No Plan.", "Costo por Unidad", "Throughput", "Turno A", "Turno B", "Nivel de Calidad", "Rechazos", "Cumplimiento"

AGRICULTURE / CROP PROCESSING → gauge for humidity/quality/drying %, line for seasonal trends, pie for quality grade distribution.
  KPI labels to use: "Kg Cosechados", "Kg Procesados", "Rendimiento/Ha", "Humedad Promedio", "Lotes Procesados", "Calidad A", "Merma", "Tiempo de Proceso", "Costo Operativo", "Lotes Rechazados", "Temperatura Prom.", "Secado Completado"

LOGISTICS / SUPPLY CHAIN → line for on-time trend, bar for deliveries by zone, gauge for service level.
  KPI labels to use: "Deliveries", "On-Time %", "Entregas a Tiempo", "Inventario (días)", "Nivel de Servicio", "Rotación Inv."

SALES / FINANCE → bar for revenue by product/region, line for monthly trend, pie for segment mix.
  KPI labels to use: "Total Revenue", "Units Sold", "Avg. Deal", "Win Rate %", "Net Revenue", "EBITDA", "Net Margin", "Cash Flow"

GAUGE USAGE — use gauge when the metric is a % with an implicit target (quality, efficiency, OEE, humidity, capacity utilization). Gauge works best at w≥160, h≥160. Place 2-3 gauges in the primary chart row alongside a bar or line chart.

FEW-SHOT EXAMPLE — Process/Agriculture dashboard (960×580). NOTE: elements[0]=header, elements[1]=nav ALWAYS. ROW 0=slicer filter bar, ROW 1=KPIs, ROW 2=charts, ROW 3=tables:
<LAYOUT>{"mode":"replace","canvasTheme":null,"header":{"show":true,"title":"Control de Proceso","subtitle":"Turno Actual","height":56,"bgColor":""},"navConfig":{"position":"left","style":"collapsible","width":192},"elements":[{"id":1,"type":"header","x":0,"y":0,"w":960,"h":56,"label":"Control de Proceso"},{"id":2,"type":"nav","x":0,"y":56,"w":192,"h":524,"label":"Nav Menu"},{"id":3,"type":"slicer","x":208,"y":72,"w":736,"h":40,"label":"Filtros: Turno · Línea · Fecha"},{"id":4,"type":"kpi","x":208,"y":128,"w":176,"h":88,"label":"Producción Diaria"},{"id":5,"type":"kpi","x":392,"y":128,"w":176,"h":88,"label":"Eficiencia de Proceso"},{"id":6,"type":"kpi","x":576,"y":128,"w":176,"h":88,"label":"Defectos PPM"},{"id":7,"type":"kpi","x":760,"y":128,"w":184,"h":88,"label":"Paros No Plan."},{"id":8,"type":"gauge","x":208,"y":232,"w":184,"h":184,"label":"OEE"},{"id":9,"type":"gauge","x":400,"y":232,"w":184,"h":184,"label":"Capacidad Utilizada"},{"id":10,"type":"line","x":592,"y":232,"w":352,"h":184,"label":"Producción por Hora"},{"id":11,"type":"bar","x":208,"y":432,"w":352,"h":140,"label":"Producción por Turno"},{"id":12,"type":"table","x":568,"y":432,"w":376,"h":140,"label":"Detalle por Línea"}]}</LAYOUT>`;}


// Intenta parsear JSON; si está truncado, lo repara recortando al último
// elemento completo y balanceando llaves/corchetes
function tryParseLayout(raw){
  const clean=raw.replace(/```json\n?|```/g,"").trim();
  try{return JSON.parse(clean);}catch(e){}
  // Reparación: recortar al último "}" y balancear cierres
  let cut=clean.lastIndexOf("}");
  let attempts=0;
  while(cut>0&&attempts<30){
    let frag=clean.slice(0,cut+1);
    const oB=(frag.match(/{/g)||[]).length-(frag.match(/}/g)||[]).length;
    const oA=(frag.match(/\[/g)||[]).length-(frag.match(/]/g)||[]).length;
    // El schema cierra arrays antes que el objeto raíz: ] primero, } después
    const repaired=frag+"]".repeat(Math.max(0,oA))+"}".repeat(Math.max(0,oB));
    try{return JSON.parse(repaired);}catch(e){}
    cut=clean.lastIndexOf("}",cut-1);
    attempts++;
  }
  return null;
}

async function callAI(msgs,cw=960,ch=580,currentState=null){
  try{
    let sys=AI_SYS(cw,ch);
    if(currentState&&currentState.elements&&currentState.elements.length){
      const compact=currentState.elements.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,w:e.w,h:e.h,label:e.label}));
      sys+=`\n\nCURRENT_STATE (el reporte actual en el canvas — úsalo para "mode":"update"):\n`+
        `canvasTheme: ${JSON.stringify(currentState.ct)}\n`+
        `elements: ${JSON.stringify(compact)}`;
    }else{
      sys+=`\n\nCURRENT_STATE: (canvas vacío — cualquier petición es "mode":"replace")`;
    }
    const token=localStorage.getItem('token');
    if(!token)return{text:"⚠️ No has iniciado sesión. Por favor inicia sesión para usar el asistente.",layout:null,audit:null};
    const res=await fetch('http://localhost:3001/api/generate',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body:JSON.stringify({messages:msgs,system:sys}),
    });
    const data=await res.json();
    if(!res.ok){
      if(res.status===401||res.status===403){
        return{text:`⚠️ Sesión expirada. Por favor recarga la página e inicia sesión de nuevo.`,layout:null,audit:null};
      }
      if(res.status===402){
        const bal=data?.creditsBalance??0;
        return{text:`⚠️ Créditos insuficientes (saldo: ${bal}). Contacta al administrador.`,layout:null,audit:null};
      }
      if(res.status===429){
        const wait=data?.retryAfter||60;
        return{text:`⏳ Límite de solicitudes alcanzado (máx. ${data?.limit||12}/min). Espera unos ${wait} segundos e inténtalo de nuevo.`,layout:null,audit:null};
      }
      if(res.status===503){
        return{text:`⏳ El servicio de IA está con alta demanda. Espera unos segundos e intenta de nuevo.`,layout:null,audit:null};
      }
      const msg=data?.error||`HTTP ${res.status}`;
      return{text:`⚠️ Error API: ${msg}`,layout:null,audit:null};
    }
    // Backend devuelve { text, layout } — layout ya extraído y normalizado por el servidor
    let audit=null;
    let cleanText=data.text||'';
    let layout=data.layout||null;

    // Fallback: si el backend no pudo extraer el layout (lo devolvió en text crudo),
    // intentar extraerlo aquí en el cliente con tryParseLayout + sanitizador
    if(!layout&&cleanText.includes('<LAYOUT>')){
      const m=cleanText.match(/<LAYOUT>([\s\S]*?)<\/LAYOUT>/);
      if(m){
        const sanitized=m[1].trim()
          .replace(/\r\n/g,'\\n').replace(/\r/g,'\\n').replace(/\n/g,'\\n').replace(/\t/g,'\\t');
        const parsed=tryParseLayout(sanitized);
        if(parsed){layout=parsed;cleanText=cleanText.replace(/<LAYOUT>[\s\S]*?<\/LAYOUT>/,'').trim();}
      }
    }
    // Si aún hay <LAYOUT> en el texto (parse falló), quitarlo para no mostrarlo al usuario
    cleanText=cleanText.replace(/<LAYOUT>[\s\S]*?<\/LAYOUT>/gi,'').trim();

    // Detectar bloque <AUDIT>
    const auditM=cleanText.match(/<audit>([\s\S]*?)<\/audit>/i);
    if(auditM){
      try{audit=JSON.parse(auditM[1].trim());}catch(e){}
      cleanText=cleanText.replace(/<audit>[\s\S]*?<\/audit>/gi,'').trim();
    }
    return{text:cleanText,layout,audit};
  }catch(e){
    return{text:`⚠️ Error de red: ${e.message}`,layout:null,audit:null};
  }
}

// ═══════════════════════════════════════════════════════════════════
// VISUALS  (pointerEvents nunca se tocan aquí — se bloquean en CanvasEl)
// ═══════════════════════════════════════════════════════════════════
function KPICard({el,ct}){
  const D={
    // Sales & Finance
    "Total Revenue":["$2.41M",12.3,true,[1.8,2.0,1.9,2.1,2.2,2.41]],"Units Sold":["8,432",5.7,true,[6.5,7.1,7.4,7.9,8.1,8.4]],"Avg. Deal":["$28.6K",-2.1,false,[31,30,29.5,29,28.8,28.6]],"Win Rate %":["34.8%",1.2,true,[32,33,33.5,34,34.5,34.8]],"Net Revenue":["$1.8M",8.7,true,[1.4,1.5,1.6,1.65,1.72,1.8]],"EBITDA":["$540K",14.2,true,[380,420,450,480,510,540]],"Net Margin":["29.8%",2.1,true,[26,27,28,28.5,29.2,29.8]],"Cash Flow":["$320K",-3.4,false,[370,360,350,340,330,320]],
    // HR
    "Headcount":["1,248",3.2,true,[1100,1150,1180,1210,1230,1248]],"Attrition %":["8.4%",-1.1,true,[10,9.5,9,8.9,8.6,8.4]],"Productividad":["94.2%",3.1,true,[86,88,90,91.5,93,94.2]],"Ausentismo":["2.1%",-0.8,false,[3.2,3.0,2.8,2.6,2.3,2.1]],"Satisfacción":["87/100",4.2,true,[78,80,82,84,85,87]],"Capacitaciones":["24",20.0,true,[14,16,18,20,22,24]],
    // Marketing
    "Impressions":["2.4M",18,true,[1.6,1.8,2.0,2.1,2.25,2.4]],"CTR %":["3.2%",0.4,true,[2.7,2.8,2.9,3.0,3.1,3.2]],"Conversions":["12,841",9.3,true,[9500,10200,11000,11500,12100,12841]],"CAC":["$48",-12,true,[60,57,54,52,50,48]],"ROAS":["4.2x",8.1,true,[3.1,3.4,3.6,3.8,4.0,4.2]],
    // Logistics
    "Deliveries":["4,821",6.1,true,[3800,4100,4300,4500,4650,4821]],"On-Time %":["94.2%",1.8,true,[90,91.5,92,93,93.5,94.2]],"Entregas a Tiempo":["96.8%",1.4,true,[93,94,95,95.8,96.3,96.8]],"Inventario (días)":["18 días",-5.3,false,[22,21,20,19.5,18.8,18]],"Nivel de Servicio":["98.2%",0.8,true,[96,96.8,97.2,97.6,98,98.2]],"Rotación Inv.":["4.8x",8.1,true,[3.6,3.9,4.1,4.4,4.6,4.8]],
    // Manufacturing / Process Control
    "Producción Diaria":["4,821 un",6.1,true,[3800,4100,4300,4500,4650,4821]],"Producción Total":["38,240 un",8.3,true,[30000,32000,33500,35000,36800,38240]],"Eficiencia de Proceso":["94.2%",1.8,true,[90,91.5,92,93,93.5,94.2]],"OEE":["78.3%",3.1,true,[70,72,74,75.5,77,78.3]],"Rendimiento":["87.5%",2.3,true,[82,83.5,84,85,86.5,87.5]],"Tiempo de Ciclo":["4.2 min",-8.3,false,[5.1,4.9,4.7,4.6,4.4,4.2]],"Defectos PPM":["312",-15.4,false,[480,440,400,370,340,312]],"Capacidad Utilizada":["82.1%",4.2,true,[74,76,78,79.5,81,82.1]],"Paros No Plan.":["3",-25.0,false,[8,7,6,5,4,3]],"Costo por Unidad":["$2.84",-5.2,false,[3.2,3.1,3.0,2.98,2.91,2.84]],"Throughput":["1,248/h",7.8,true,[1050,1100,1140,1180,1210,1248]],"Turno A":["8,420 un",4.1,true,[7200,7600,7900,8100,8280,8420]],"Turno B":["7,840 un",2.8,true,[7000,7200,7400,7580,7700,7840]],"Turno C":["6,910 un",-1.2,false,[7100,7050,7000,6980,6940,6910]],
    // Agriculture / Crop Processing
    "Kg Cosechados":["12,840 kg",9.3,true,[9500,10200,11000,11500,12100,12840]],"Kg Procesados":["11,480 kg",7.6,true,[8800,9400,10000,10600,11100,11480]],"Rendimiento/Ha":["8.4 t/ha",1.8,true,[7.5,7.7,7.9,8.0,8.2,8.4]],"Humedad Promedio":["14.2%",-0.8,false,[15.1,14.9,14.7,14.5,14.3,14.2]],"Lotes Procesados":["48",12.5,true,[34,37,40,43,46,48]],"Calidad A":["91.3%",2.1,true,[87,88,89,90,90.8,91.3]],"Merma":["6.8%",-1.2,false,[8.2,7.9,7.6,7.3,7.0,6.8]],"Tiempo de Proceso":["3.2 h",-5.1,false,[3.8,3.7,3.6,3.5,3.4,3.2]],"Costo Operativo":["$18,240",-3.4,false,[20100,19800,19500,19200,18800,18240]],"Lotes Rechazados":["2",-33.3,false,[5,4,4,3,3,2]],"Temperatura Prom.":["22.4°C",0.4,true,[21.8,22.0,22.1,22.2,22.3,22.4]],"Secado Completado":["89.6%",3.2,true,[83,85,86.5,87.5,88.8,89.6]],
    // Quality
    "Nivel de Calidad":["97.8%",1.2,true,[95,95.8,96.3,97,97.4,97.8]],"Rechazos":["1.8%",-0.6,false,[2.8,2.6,2.4,2.2,2.0,1.8]],"Reprocesos":["0.9%",-0.3,false,[1.5,1.4,1.2,1.1,1.0,0.9]],"Cumplimiento":["98.4%",0.8,true,[96,96.8,97.2,97.6,98,98.4]],
  };
  const[v,chg,up,pts]=D[el.label]||["—",0,true,[20,30,25,40,35,45]];
  const W=58,H=22,mn=Math.min(...pts),mx=Math.max(...pts),rng=mx-mn||1;
  const sp=pts.map((p,i)=>`${(i/(pts.length-1))*W},${H-((p-mn)/rng)*H}`).join(" ");
  const showSpark=el.w>120&&el.h>65;
  // Font size adaptativo: cabe el valor sin truncarse
  const availW=Math.max(40,(showSpark?el.w-90:el.w-26));
  const baseFz=Math.max(15,Math.min(26,el.w/7));
  const charW=baseFz*0.62; // ancho promedio por carácter en Segoe UI
  const fz=v.length*charW>availW?Math.max(11,Math.floor(availW/v.length/0.62)):baseFz;
  return(
    <div style={{width:"100%",height:"100%",background:`linear-gradient(145deg,${rgba(ct.accent,0.05)} 0%,${ct.cardBg} 55%)`,border:`1px solid ${ct.cardBorder}`,borderTop:`3px solid ${ct.accent}`,borderRadius:ct.r,padding:"11px 13px",display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden",boxSizing:"border-box"}}>
      <div style={{fontSize:8,color:ct.accent,textTransform:"uppercase",letterSpacing:1.2,fontFamily:"'Segoe UI',sans-serif",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",opacity:0.75}}>{el.label}</div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
        <div style={{overflow:"hidden",flex:1,minWidth:0}}>
          <div style={{fontSize:fz,fontWeight:800,color:ct.text,letterSpacing:-0.5,lineHeight:1.1,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</div>
          {el.h>70&&<div style={{fontSize:9,color:up?ct.success:ct.danger,display:"flex",alignItems:"center",gap:2,marginTop:2}}>
            <span>{up?"▲":"▼"}</span><span style={{fontWeight:700}}>{Math.abs(chg)}%</span>
            <span style={{color:ct.textMuted,marginLeft:2}}>vs prev</span>
          </div>}
        </div>
        {showSpark&&<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{flexShrink:0,marginLeft:6}}>
          <defs><linearGradient id={`sk${el.id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={up?ct.success:ct.danger} stopOpacity="0.5"/><stop offset="100%" stopColor={up?ct.success:ct.danger} stopOpacity="1"/></linearGradient></defs>
          <polyline points={sp} fill="none" stroke={`url(#sk${el.id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
      </div>
    </div>
  );
}
function BarChart({el,ct}){
  const data=[{l:"Jan",v:65},{l:"Feb",v:80},{l:"Mar",v:45},{l:"Apr",v:92},{l:"May",v:70},{l:"Jun",v:55},{l:"Jul",v:88},{l:"Aug",v:72}];
  const vis=data.slice(0,Math.max(3,Math.floor((el.w-50)/30)));
  const mx=Math.max(...vis.map(d=>d.v));
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px 6px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{flex:1,display:"flex",gap:4,overflow:"hidden",minHeight:0}}>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",paddingBottom:16,paddingTop:2,flexShrink:0}}>
          {[100,75,50,25,0].map(t=><div key={t} style={{fontSize:7,color:ct.textMuted,fontFamily:"monospace",lineHeight:1}}>{t}</div>)}
        </div>
        <div style={{flex:1,position:"relative",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:"2px 0 16px 0",display:"flex",flexDirection:"column",justifyContent:"space-between",pointerEvents:"none"}}>
            {[0,1,2,3,4].map(i=><div key={i} style={{height:1,background:ct.cardBorder,opacity:0.6}}/>)}
          </div>
          <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:3,paddingBottom:16,paddingTop:2,overflow:"hidden"}}>
            {vis.map((d,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:2,height:"100%",minWidth:0}}>
                <div style={{position:"relative",width:"68%",height:`${(d.v/mx)*100}%`,background:`linear-gradient(180deg,${ct.accent},${ct.accent2||ct.accent})`,borderRadius:"3px 3px 0 0",minHeight:2}}>
                  {el.h>150&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",fontSize:7,color:ct.textMuted,whiteSpace:"nowrap"}}>{d.v}</div>}
                </div>
                {el.h>110&&<div style={{fontSize:7,color:ct.textMuted,fontFamily:"'Segoe UI',sans-serif",whiteSpace:"nowrap"}}>{d.l}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function LineChart({el,ct}){
  const pts=[28,45,38,62,50,75,60,82,70,90,78,95];
  const lbls=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const W=240,H=80,mn=Math.min(...pts),mx=Math.max(...pts),rng=mx-mn||1;
  const path=pts.map((p,i)=>`${(i/(pts.length-1))*W},${H-((p-mn)/rng)*H}`).join(" ");
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px 6px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H+14}`} preserveAspectRatio="none" style={{flex:1}}>
        <defs>
          <linearGradient id={`g${el.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ct.accent} stopOpacity="0.32"/><stop offset="100%" stopColor={ct.accent} stopOpacity="0.03"/></linearGradient>
          <linearGradient id={`gl${el.id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={ct.accent2||ct.accent}/><stop offset="100%" stopColor={ct.accent}/></linearGradient>
        </defs>
        {[.25,.5,.75,1].map(t=><line key={t} x1="0" y1={H*(1-t)} x2={W} y2={H*(1-t)} stroke={ct.cardBorder} strokeWidth="0.6" opacity="0.7"/>)}
        <polygon points={`0,${H} ${path} ${W},${H}`} fill={`url(#g${el.id})`}/>
        <polyline points={path} fill="none" stroke={`url(#gl${el.id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {el.w>200&&pts.map((p,i)=><circle key={i} cx={(i/(pts.length-1))*W} cy={H-((p-mn)/rng)*H} r="3" fill={ct.accent} stroke={ct.cardBg} strokeWidth="1.5"/>)}
        {el.h>120&&pts.filter((_,i)=>i%2===0).map((_,i)=><text key={i} x={(i*2/(pts.length-1))*W} y={H+12} fontSize="7" fill={ct.textMuted} textAnchor="middle" fontFamily="'Segoe UI',sans-serif">{lbls[i*2]}</text>)}
      </svg>
    </div>
  );
}
function DonutChart({el,ct}){
  const segs=[{p:35,c:ct.accent,l:"Segment A"},{p:27,c:ct.accent2||"#8b5cf6",l:"Segment B"},{p:22,c:ct.success,l:"Segment C"},{p:16,c:ct.warning,l:"Segment D"}];
  let cum=0;const R=36,CX=48,CY=48;
  const paths=segs.map(s=>{
    const a1=(cum/100)*2*Math.PI-Math.PI/2;cum+=s.p;
    const a2=(cum/100)*2*Math.PI-Math.PI/2;
    const x1=CX+R*Math.cos(a1),y1=CY+R*Math.sin(a1),x2=CX+R*Math.cos(a2),y2=CY+R*Math.sin(a2);
    return{...s,d:`M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 ${s.p>50?1:0} 1 ${x2} ${y2}Z`};
  });
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{display:"flex",alignItems:"center",flex:1,gap:10,overflow:"hidden",minHeight:0}}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{flexShrink:0}}>
          <circle cx={CX} cy={CY} r="20" fill={ct.cardBg}/>
          {paths.map((p,i)=><path key={i} d={p.d} fill={p.c} stroke={ct.cardBg} strokeWidth="1.5"/>)}
          <text x={CX} y={CY+4} textAnchor="middle" fontSize="9" fontWeight="700" fill={ct.text} fontFamily="'Segoe UI',sans-serif">{segs[0].p}%</text>
        </svg>
        <div style={{display:"flex",flexDirection:"column",gap:5,flex:1,overflow:"hidden"}}>
          {paths.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,overflow:"hidden"}}>
              <div style={{width:8,height:8,borderRadius:2,background:p.c,flexShrink:0}}/>
              <div style={{flex:1,fontSize:8,color:ct.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{p.l}</div>
              <div style={{fontSize:9,fontWeight:700,color:ct.text,flexShrink:0,fontFamily:"monospace"}}>{p.p}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function TableViz({el,ct}){
  const lbl=(el.label||"").toLowerCase();
  const isAg=/(lote|cosech|proceso|arilo|palta|uva|fruta|agr|campo|fundo|calibr|kg|merma)/i.test(lbl);
  const isMfg=/(línea|turno|máquin|defect|producción|oe|planta|operac)/i.test(lbl);
  const isLog=/(envío|entrega|ruta|flota|guía|pedido|logíst|proveedor)/i.test(lbl);
  const isHR=/(emplead|colabor|rrhh|contrat|cargo|área|departament)/i.test(lbl);
  let cols,rows;
  if(isAg){
    cols=["Lote","Fundo","Kg Netos","Calidad","Merma %"];
    rows=[["LT-2401","El Olivo","8,420","A","3.2%"],["LT-2402","San José","6,150","A","4.1%"],["LT-2403","El Peral","9,800","B","5.8%"],["LT-2404","La Viña","7,230","A","2.9%"],["LT-2405","El Monte","5,640","B","6.3%"],["LT-2406","San Luis","4,890","A","3.7%"]];
  } else if(isMfg){
    cols=["Línea","Turno","Producción","OEE","Defectos"];
    rows=[["L-01","Mañana","1,240 u","87%","12 ppm"],["L-02","Mañana","980 u","79%","28 ppm"],["L-01","Tarde","1,180 u","84%","15 ppm"],["L-03","Mañana","1,420 u","91%","8 ppm"],["L-02","Tarde","910 u","76%","34 ppm"],["L-03","Tarde","1,350 u","89%","10 ppm"]];
  } else if(isLog){
    cols=["Guía","Destino","Estado","Tiempo","Costo"];
    rows=[["GU-0981","Lima Norte","Entregado","2.1 h","$18"],["GU-0982","Lima Sur","En ruta","—","$22"],["GU-0983","Callao","Entregado","1.4 h","$14"],["GU-0984","San Isidro","Pendiente","—","$20"],["GU-0985","Miraflores","Entregado","1.8 h","$16"],["GU-0986","Surco","En ruta","—","$19"]];
  } else if(isHR){
    cols=["Colaborador","Área","Cargo","Ingreso","Estado"];
    rows=[["A. Rodríguez","Operaciones","Supervisor","Ene 2022","Activo"],["B. Torres","Calidad","Inspector","Mar 2021","Activo"],["C. Díaz","Logística","Analista","Jun 2023","Activo"],["D. Vargas","RRHH","Coordinador","Feb 2020","Activo"],["E. Soto","Finanzas","Contador","Sep 2022","Activo"],["F. Ríos","TI","Desarrollador","Nov 2023","Activo"]];
  } else {
    cols=["Producto","Categoría","Ventas","Unidades","Margen"];
    rows=[["Línea Premium","A","$48,200","324","32%"],["Línea Estándar","B","$12,400","892","45%"],["Línea Pro","A","$38,600","210","28%"],["Línea Basic","C","$8,700","580","52%"],["Línea Elite","A","$15,300","418","41%"],["Línea Value","B","$9,800","340","38%"]];
  }
  const vC=Math.max(2,Math.floor((el.w-24)/75));
  const vR=Math.max(2,Math.floor((el.h-52)/24));
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,padding:"10px 12px 6px",flexShrink:0,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{el.label}</div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${vC},1fr)`,background:rgba(ct.accent,0.08),borderBottom:`2px solid ${rgba(ct.accent,0.3)}`,flexShrink:0}}>
          {cols.slice(0,vC).map(c=><div key={c} style={{padding:"5px 10px",fontSize:9,fontWeight:700,color:ct.accent,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c} <span style={{opacity:0.4,fontSize:7}}>⇅</span></div>)}
        </div>
        {rows.slice(0,vR).map((row,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:`repeat(${vC},1fr)`,background:i%2===1?rgba(ct.accent,0.03):"transparent",borderBottom:`1px solid ${rgba(ct.cardBorder,0.6)}`,flexShrink:0}}>
            {row.slice(0,vC).map((cell,j)=><div key={j} style={{padding:"5px 10px",fontSize:9,color:j===0?ct.text:ct.textSub,fontFamily:j>1?"monospace":"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:j===0?500:400}}>{cell}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}
function SlicerViz({el,ct}){
  // Detectar orientación: si es ancho y bajo (barra de filtros) → horizontal con dropdowns
  const horiz=el.w>el.h*2.2;
  // Parsear el label para extraer los filtros: "Filtros: Fundo · Variedad · Campaña"
  const parseFilters=(lbl)=>{
    const m=(lbl||"").split(/:\s*/);
    const tail=m.length>1?m.slice(1).join(":"):lbl;
    return tail.split(/[·,|]/).map(s=>s.trim()).filter(Boolean);
  };

  if(horiz){
    const filters=parseFilters(el.label);
    const chips=filters.length?filters:["Filtro 1","Filtro 2"];
    return(
      <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,overflow:"hidden",boxSizing:"border-box",display:"flex",alignItems:"center",gap:8,padding:"0 12px"}}>
        <span style={{fontSize:9,fontWeight:700,color:ct.textMuted,textTransform:"uppercase",letterSpacing:0.8,fontFamily:"'Segoe UI',sans-serif",flexShrink:0,display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:11}}>⛛</span>Filtros
        </span>
        <div style={{display:"flex",gap:8,flex:1,overflow:"hidden"}}>
          {chips.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,
              padding:"0 10px",height:26,borderRadius:6,border:`1px solid ${ct.cardBorder}`,
              background:rgba(ct.secondary,0.55),flex:`1 1 0`,minWidth:0,maxWidth:200}}>
              <span style={{fontSize:9,color:ct.textSub,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{f}</span>
              <span style={{fontSize:7,color:ct.textMuted,flexShrink:0}}>▾</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical (lista de checkboxes) — cuando el slicer es alto
  const opts=["All Periods","FY 2024","FY 2023","Q4 2024","Q3 2024","Q2 2024","Q1 2024"];
  const vis=Math.max(3,Math.floor((el.h-60)/28));
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"10px 12px 6px",flexShrink:0}}>
        <div style={{fontSize:9,fontWeight:700,color:ct.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:4,border:`1px solid ${ct.cardBorder}`,background:rgba(ct.secondary,0.5)}}>
          <span style={{fontSize:9,color:ct.textMuted}}>🔍</span>
          <span style={{fontSize:9,color:ct.textMuted,fontFamily:"'Segoe UI',sans-serif"}}>Search...</span>
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",gap:1,padding:"0 8px 8px"}}>
        {opts.slice(0,vis).map((o,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 6px",borderRadius:3,background:i===0?rgba(ct.accent,0.1):"transparent",flexShrink:0}}>
            <div style={{width:13,height:13,borderRadius:2,border:`1.5px solid ${i===0?ct.accent:ct.textMuted}`,background:i===0?ct.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {i===0&&<span style={{color:"#fff",fontSize:8,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:9,color:i===0?ct.text:ct.textSub,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function NavViz({el,ct,navCfg}){
  const nav=navCfg||NAV_DEFAULT;
  const c=nav.colors||{};
  const pages=(nav.pages&&nav.pages.length)?nav.pages:NAV_DEFAULT.pages;
  // Horizontal si la config dice "top" O si el elemento es más ancho que alto (vista móvil apilada)
  const horiz=nav.position==="top"||(el&&el.w>el.h*1.5);
  // El nav deriva un tono SUAVE del tema (mezcla acento con el fondo del canvas).
  const themeNavBg=(()=>{
    const base=ct.headerBg||ct.accent2||ct.accent||"#1e293b";
    const canvasC=ct.canvas||"#ffffff";
    return isDark(canvasC)?mix(base,canvasC,0.45):mix(base,canvasC,0.78);
  })();
  const navBg=c.bgCustom?c.bg:themeNavBg;
  const navIsDark=isDark(navBg);
  const accent=c.selectedCustom?c.selected:(ct.accent||c.accent||c.selected);
  const txtActive=c.textActiveCustom?c.textActive:(navIsDark?"#ffffff":(ct.text||"#1e293b"));
  const txtInactive=c.textInactiveCustom?c.textInactive:(navIsDark?rgba("#ffffff",0.65):rgba(ct.text||"#1e293b",0.6));
  const defaultActive=pages.findIndex(p=>p.active);
  // actI es estado local — no afecta el diseño guardado, solo la preview interactiva
  const[actI,setActI]=useState(defaultActive>=0?defaultActive:0);
  const[hoverI,setHoverI]=useState(-1);
  const fs=nav.fontSize||9;
  // Modo "Ninguno": franja delgada con indicador visual
  if(nav.position==="none"){
    return(
      <div style={{width:"100%",height:"100%",background:"repeating-linear-gradient(45deg,rgba(0,0,0,0.06) 0px,rgba(0,0,0,0.06) 3px,transparent 3px,transparent 8px)",border:"1.5px dashed rgba(0,0,0,0.2)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        <span style={{fontSize:7,color:"rgba(0,0,0,0.35)",writingMode:"vertical-rl",letterSpacing:1,userSelect:"none",fontFamily:"monospace"}}>NAV OFF</span>
      </div>
    );
  }
  const isCollapsible=nav.style==="collapsible";
  const isFloating=nav.style==="floating";
  // Flotante: borde sutil + sombra para indicar que flota sobre el contenido
  const floatStyle=isFloating?{boxShadow:"4px 0 16px rgba(0,0,0,0.22)",borderRight:"2px solid rgba(255,255,255,0.12)"}:{};
  return(
    <div style={{width:"100%",height:"100%",background:navBg,borderRadius:ct.r,border:`1px solid ${rgba("#000000",0.1)}`,overflow:"hidden",display:"flex",flexDirection:horiz?"row":"column",...floatStyle}}>
      {!horiz&&<div style={{padding:"14px 12px 10px",borderBottom:`1px solid ${rgba(txtInactive,0.2)}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {nav.logoUrl
            ?<img src={directImageUrl(nav.logoUrl)} alt="" style={{width:26,height:26,borderRadius:6,objectFit:"contain",flexShrink:0}} onError={e=>{e.currentTarget.style.display="none";}}/>
            :<div style={{width:26,height:26,borderRadius:6,background:`linear-gradient(135deg,${accent},${ct.accent2||accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",flexShrink:0}}>⬡</div>}
          <div style={{overflow:"hidden",flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:txtActive,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"'Segoe UI',sans-serif"}}>{nav.reportName||"Mi Reporte"}</div>
            <div style={{fontSize:7,color:txtInactive,fontFamily:"monospace",letterSpacing:0.8}}>{isFloating?"FLOTANTE":isCollapsible?"COLAPSABLE":"ESTÁTICO"}</div>
          </div>
          {isCollapsible&&(
            <div title="Botón colapsar (visible en Power BI)" style={{width:20,height:20,borderRadius:4,background:rgba(txtInactive,0.15),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"default"}}>
              <span style={{fontSize:10,color:txtInactive}}>≡</span>
            </div>
          )}
        </div>
      </div>}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:horiz?"row":"column",padding:horiz?"0":"6px 0"}}>
        {pages.map((p,idx)=>{
          const on=idx===actI;
          const hovering=idx===hoverI&&!on;
          return(
            <div key={p.id??idx}
              onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();setActI(idx);}}
              onMouseEnter={()=>setHoverI(idx)}
              onMouseLeave={()=>setHoverI(-1)}
              style={{display:"flex",alignItems:"center",gap:7,padding:horiz?"8px 14px":"7px 12px",
                background:on?rgba(accent,(c.selectedOpacity??25)/100):hovering?rgba(accent,0.08):"transparent",
                borderLeft:!horiz?`3px solid ${on?accent:hovering?rgba(accent,0.4):"transparent"}`:"none",
                borderBottom:horiz?`2px solid ${on?accent:"transparent"}`:"none",
                flexShrink:0,minWidth:0,cursor:"pointer",
                transition:"background 0.15s,border-color 0.15s"}}>
              <span style={{fontSize:11,flexShrink:0,opacity:on?1:hovering?0.85:0.7,transition:"opacity 0.15s"}}>{p.icon}</span>
              <span style={{fontSize:fs,color:on?txtActive:hovering?mix(txtInactive,txtActive,0.5):txtInactive,fontFamily:"'Segoe UI',sans-serif",fontWeight:on?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",transition:"color 0.15s"}}>{p.label}</span>
              {on&&!horiz&&<div style={{marginLeft:"auto",width:4,height:4,borderRadius:"50%",background:accent,flexShrink:0,boxShadow:`0 0 6px ${accent}`}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function HeaderViz({el,ct,hdrCfg}){
  const bg=hdrCfg?.bgColor||ct.headerBg||ct.accent;
  return(
    <div style={{width:"100%",height:"100%",background:`linear-gradient(135deg,${bg},${adjHex(bg,0.72)})`,borderRadius:ct.r,overflow:"hidden",display:"flex",alignItems:"center",padding:"0 18px",gap:14,boxSizing:"border-box"}}>
      <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⬡</div>
      <div style={{overflow:"hidden",flex:1}}>
        <div style={{fontSize:14,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{hdrCfg?.title||el.label||"Report Title"}</div>
        {el.h>46&&<div style={{fontSize:9,color:"rgba(255,255,255,0.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{hdrCfg?.subtitle||"Business Intelligence Dashboard"}</div>}
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        {["YTD","QTD","MTD"].map(f=><div key={f} style={{padding:"4px 9px",borderRadius:5,background:"rgba(255,255,255,0.15)",fontSize:8,color:"rgba(255,255,255,0.9)",fontFamily:"'Segoe UI',sans-serif",fontWeight:600,border:"1px solid rgba(255,255,255,0.2)"}}>{f}</div>)}
      </div>
    </div>
  );
}
function TextCard({el,ct}){return <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"12px 14px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column",gap:6}}><div style={{fontSize:10,fontWeight:700,color:ct.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div><div style={{fontSize:9,color:ct.textSub,lineHeight:1.65,overflow:"hidden",flex:1,fontFamily:"'Segoe UI',sans-serif"}}>Add descriptive text or annotation here.</div></div>;}
function ButtonViz({el,ct}){return <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><div style={{padding:"8px 18px",borderRadius:ct.r-2,background:`linear-gradient(135deg,${ct.accent},${ct.accent2||ct.accent})`,fontSize:10,fontWeight:600,color:"#fff",boxShadow:`0 3px 10px ${rgba(ct.accent,0.4)}`,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"90%",fontFamily:"'Segoe UI',sans-serif"}}>{el.label||"Button"}</div></div>;}
function ImageViz({el,ct}){return <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`2px dashed ${ct.cardBorder}`,borderRadius:ct.r,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}><span style={{fontSize:22,opacity:0.25}}>🖼</span><span style={{fontSize:8,color:ct.textMuted,fontFamily:"monospace"}}>Image / Logo</span></div>;}

// ── VISUALES NUEVOS ───────────────────────────────────────────────
function GaugeViz({el,ct}){
  const hash=el.label.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const pct=45+(hash%40), angle=-90+pct/100*180;
  const cx=60,cy=60,r=44;
  const arc=(from,to,col,w)=>{
    const a0=(from-90)*Math.PI/180,a1=(to-90)*Math.PI/180;
    const x0=cx+r*Math.cos(a0),y0=cy+r*Math.sin(a0);
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
    const laf=to-from>180?1:0;
    return(<path d={`M${x0},${y0} A${r},${r},0,${laf},1,${x1},${y1}`} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round"/>);
  };
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:0}}>
        <svg width="120" height="78" viewBox="0 0 120 70">
          {arc(0,180,rgba(ct.accent,0.15),9)}
          {arc(0,pct/100*180,ct.accent,9)}
          <line x1={cx} y1={cy} x2={cx+34*Math.cos(angle*Math.PI/180)} y2={cy+34*Math.sin(angle*Math.PI/180)} stroke={ct.text} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r="4" fill={ct.text}/>
          <text x={cx} y={cy-14} textAnchor="middle" fontSize="15" fontWeight="700" fill={ct.text} fontFamily="'Segoe UI',sans-serif">{pct}%</text>
        </svg>
      </div>
    </div>
  );
}
function MatrixViz({el,ct}){
  const rows=["Norte","Sur","Este","Oeste"];
  const cols=["Q1","Q2","Q3","Q4"];
  const data=[[120,145,98,160],[88,92,110,75],[200,180,220,195],[60,70,55,80]];
  const max=220;
  const vR=Math.max(2,Math.min(rows.length,Math.floor((el.h-56)/26)));
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,padding:"10px 12px 6px",fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{el.label}</div>
      <div style={{flex:1,overflow:"hidden",padding:"0 8px 8px"}}>
        <div style={{display:"grid",gridTemplateColumns:`70px repeat(${cols.length},1fr)`,gap:2}}>
          <div/>
          {cols.map(c=><div key={c} style={{fontSize:8,fontWeight:700,color:ct.textSub,textAlign:"center",padding:"2px",fontFamily:"monospace"}}>{c}</div>)}
          {rows.slice(0,vR).map((r,ri)=>(
            <Fragment key={r}>
              <div style={{fontSize:8,color:ct.textSub,display:"flex",alignItems:"center",fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r}</div>
              {data[ri].map((v,ci)=>(
                <div key={ci} style={{fontSize:8,fontWeight:600,textAlign:"center",padding:"4px 2px",borderRadius:3,fontFamily:"monospace",
                  background:rgba(ct.accent,0.08+0.5*v/max),color:v/max>0.5?"#fff":ct.text}}>{v}</div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
function ScatterViz({el,ct}){
  const pts=[[20,70],[35,55],[45,60],[55,38],[62,45],[70,28],[78,35],[85,20],[30,65],[50,48],[68,40],[40,58]];
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{flex:1,minHeight:0}}>
        <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
          <line x1="8" y1="72" x2="96" y2="72" stroke={ct.cardBorder} strokeWidth="0.5"/>
          <line x1="8" y1="8" x2="8" y2="72" stroke={ct.cardBorder} strokeWidth="0.5"/>
          {pts.map(([x,y],i)=><circle key={i} cx={8+x*0.88} cy={y} r="2.5" fill={rgba(ct.accent,0.7)}/>)}
        </svg>
      </div>
    </div>
  );
}
function TreemapViz({el,ct}){
  const blocks=[
    {l:"Electrónica",v:42,c:ct.accent},{l:"Ropa",v:24,c:ct.accent2||ct.accent},
    {l:"Hogar",v:18,c:rgba(ct.accent,0.6)},{l:"Deporte",v:10,c:rgba(ct.accent,0.4)},
    {l:"Otros",v:6,c:rgba(ct.accent,0.25)},
  ];
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{flex:1,display:"flex",gap:2,minHeight:0,overflow:"hidden"}}>
        <div style={{flex:42,display:"flex",flexDirection:"column",gap:2}}>
          <div style={{flex:1,background:blocks[0].c,borderRadius:3,padding:6,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
            <div style={{fontSize:8,fontWeight:700,color:"#fff",fontFamily:"'Segoe UI',sans-serif"}}>{blocks[0].l}</div>
            <div style={{fontSize:9,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>{blocks[0].v}%</div>
          </div>
        </div>
        <div style={{flex:58,display:"flex",flexDirection:"column",gap:2}}>
          <div style={{flex:24,display:"flex",gap:2}}>
            {[blocks[1],blocks[2]].map((b,i)=>(
              <div key={i} style={{flex:b.v,background:b.c,borderRadius:3,padding:5,display:"flex",flexDirection:"column",justifyContent:"flex-end",overflow:"hidden"}}>
                <div style={{fontSize:7,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{b.l}</div>
                <div style={{fontSize:8,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>{b.v}%</div>
              </div>
            ))}
          </div>
          <div style={{flex:16,display:"flex",gap:2}}>
            {[blocks[3],blocks[4]].map((b,i)=>(
              <div key={i} style={{flex:b.v,background:b.c,borderRadius:3,padding:4,display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                <div style={{fontSize:7,fontWeight:600,color:ct.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{b.l} {b.v}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function KpiSparkViz({el,ct}){
  const data=[30,45,38,52,48,65,58,72,68,80];
  const max=Math.max(...data),min=Math.min(...data);
  const pts=data.map((v,i)=>`${i*(100/(data.length-1))},${30-((v-min)/(max-min))*26}`).join(" ");
  return(
    <div style={{width:"100%",height:"100%",background:`linear-gradient(145deg,${rgba(ct.accent,0.05)} 0%,${ct.cardBg} 55%)`,border:`1px solid ${ct.cardBorder}`,borderLeft:`3px solid ${ct.accent}`,borderRadius:ct.r,padding:"11px 13px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
      <div style={{fontSize:9,fontWeight:700,color:ct.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif",opacity:0.75}}>{el.label}</div>
      <div style={{fontSize:22,fontWeight:800,color:ct.text,fontFamily:"'Segoe UI',sans-serif",lineHeight:1}}>$84.2K</div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:8}}>
        <span style={{fontSize:9,fontWeight:700,color:ct.success||"#059669",fontFamily:"monospace"}}>▲ 12.4%</span>
        <svg width="60%" height="28" viewBox="0 0 100 30" preserveAspectRatio="none" style={{flexShrink:0}}>
          <defs><linearGradient id={`sp2${el.id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={ct.accent} stopOpacity="0.4"/><stop offset="100%" stopColor={ct.accent} stopOpacity="1"/></linearGradient></defs>
          <polyline points={pts} fill="none" stroke={`url(#sp2${el.id})`} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        </svg>
      </div>
    </div>
  );
}

function Visual({el,ct,navCfg,hdrCfg}){
  switch(el.type){
    case"kpi":return <KPICard el={el} ct={ct}/>;
    case"kpispark":return <KpiSparkViz el={el} ct={ct}/>;
    case"bar":return <BarChart el={el} ct={ct}/>;
    case"line":return <LineChart el={el} ct={ct}/>;
    case"pie":return <DonutChart el={el} ct={ct}/>;
    case"gauge":return <GaugeViz el={el} ct={ct}/>;
    case"matrix":return <MatrixViz el={el} ct={ct}/>;
    case"scatter":return <ScatterViz el={el} ct={ct}/>;
    case"treemap":return <TreemapViz el={el} ct={ct}/>;
    case"table":return <TableViz el={el} ct={ct}/>;
    case"slicer":return <SlicerViz el={el} ct={ct}/>;
    case"nav":return <NavViz el={el} ct={ct} navCfg={navCfg}/>;
    case"header":return <HeaderViz el={el} ct={ct} hdrCfg={hdrCfg}/>;
    case"card":return <TextCard el={el} ct={ct}/>;
    case"button":return <ButtonViz el={el} ct={ct}/>;
    case"image":return <ImageViz el={el} ct={ct}/>;
    default:return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// CANVAS ELEMENT — selección y resize SIEMPRE funcionan
// Clave: pointerEvents:none en el wrapper del visual
// ═══════════════════════════════════════════════════════════════════
// ── CanvasEl — drag + visual únicamente (handles en HandleOverlay)──
function CanvasEl({el,ct,selected,onSelect,onUpdate,onCommit,snapGrid,navCfg,hdrCfg,zoom,CW,CH,allEls,onGuides}){
  const op=useRef({sx:0,sy:0,ox:0,oy:0});

  const beginDrag=e=>{
    e.stopPropagation();
    onSelect(el.id);
    op.current={sx:e.clientX,sy:e.clientY,ox:el.x,oy:el.y};
    const z=zoom;
    // Umbral de snap escalado al zoom: mismo "radio visual" independientemente del nivel de zoom
    const SNAP=Math.max(4,Math.round(6/z));
    const others=(allEls||[]).filter(o=>o.id!==el.id);
    const mv=e=>{
      const ddx=(e.clientX-op.current.sx)/z;
      const ddy=(e.clientY-op.current.sy)/z;
      let nx=snapGrid?snap(op.current.ox+ddx):Math.round(op.current.ox+ddx);
      let ny=snapGrid?snap(op.current.oy+ddy):Math.round(op.current.oy+ddy);
      nx=Math.max(0,Math.min(CW-el.w,nx));
      ny=Math.max(0,Math.min(CH-el.h,ny));

      // ── Guías inteligentes: alinear con bordes/centros de otros + canvas ──
      const guides=[];
      const myL=nx, myR=nx+el.w, myCX=nx+el.w/2;
      const myT=ny, myB=ny+el.h, myCY=ny+el.h/2;
      // Líneas verticales candidatas (x): bordes y centros de otros + canvas
      const vTargets=[{v:0,t:"edge"},{v:CW,t:"edge"},{v:CW/2,t:"center"}];
      const hTargets=[{v:0,t:"edge"},{v:CH,t:"edge"},{v:CH/2,t:"center"}];
      others.forEach(o=>{
        vTargets.push({v:o.x,t:"edge"},{v:o.x+o.w,t:"edge"},{v:o.x+o.w/2,t:"center"});
        hTargets.push({v:o.y,t:"edge"},{v:o.y+o.h,t:"edge"},{v:o.y+o.h/2,t:"center"});
      });
      // Snap X: probar left, center, right del elemento contra cada target
      let bestVX=null,bestVDist=SNAP+1;
      vTargets.forEach(({v,t})=>{
        [["L",myL,0],["CX",myCX,el.w/2],["R",myR,el.w]].forEach(([k,val,off])=>{
          const d=Math.abs(val-v);
          if(d<bestVDist){bestVDist=d;bestVX={lineX:v,newX:v-off,kind:t};}
        });
      });
      if(bestVX){nx=Math.max(0,Math.min(CW-el.w,bestVX.newX));guides.push({type:"v",pos:bestVX.lineX,kind:bestVX.kind});}
      // Snap Y
      let bestHY=null,bestHDist=SNAP+1;
      hTargets.forEach(({v,t})=>{
        [["T",myT,0],["CY",myCY,el.h/2],["B",myB,el.h]].forEach(([k,val,off])=>{
          const d=Math.abs(val-v);
          if(d<bestHDist){bestHDist=d;bestHY={lineY:v,newY:v-off,kind:t};}
        });
      });
      if(bestHY){ny=Math.max(0,Math.min(CH-el.h,bestHY.newY));guides.push({type:"h",pos:bestHY.lineY,kind:bestHY.kind});}

      onGuides?.(guides);
      onUpdate(el.id,{x:nx,y:ny});
    };
    const up=()=>{onCommit?.();onGuides?.([]);window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",up);
  };

  return(
    <div onMouseDown={beginDrag}
      style={{
        position:"absolute",left:el.x,top:el.y,
        width:el.w,height:el.h,
        cursor:"move",userSelect:"none",zIndex:selected?200:1,
      }}>
      {/* Visual — nav permite pointerEvents para interactividad de páginas */}
      <div style={{
        position:"absolute",inset:0,overflow:"hidden",
        borderRadius:ct.r,
        pointerEvents:el.type==="nav"?"auto":"none",
        boxShadow:selected
          ?`0 0 0 2px ${ct.accent}, 0 0 0 5px ${rgba(ct.accent,0.2)}, 0 4px 20px rgba(0,0,0,0.15)`
          :`0 1px 4px rgba(0,0,0,0.08)`,
        transition:"box-shadow 0.1s",
      }}>
        <Visual el={el} ct={ct} navCfg={navCfg} hdrCfg={hdrCfg}/>
      </div>
      {/* Badge "Interactivo" — solo en nav, solo cuando NO está seleccionado */}
      {el.type==="nav"&&!selected&&(
        <div style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",borderRadius:4,padding:"2px 5px",display:"flex",alignItems:"center",gap:3,pointerEvents:"none",zIndex:300}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 5px #22c55e",flexShrink:0}}/>
          <span style={{fontSize:7,color:"rgba(255,255,255,0.85)",fontFamily:"monospace",letterSpacing:0.5}}>INTERACTIVO</span>
        </div>
      )}
    </div>
  );
}

// ── HandleOverlay — handles de resize fuera del clip layer ─────────
// Vive en una capa con overflow:visible sobre el clip layer
function HandleOverlay({el,ct,zoom,CW,CH,snapGrid,onResize,onCommit}){
  const op=useRef({sx:0,sy:0,ox:0,oy:0,ow:0,oh:0,hdx:0,hdy:0,hdw:0,hdh:0});
  const HS=14;

  const beginResize=(e,hi)=>{
    e.stopPropagation();e.preventDefault();
    const[,dx,dy,dw,dh]=HANDLES[hi];
    op.current={sx:e.clientX,sy:e.clientY,ox:el.x,oy:el.y,ow:el.w,oh:el.h,hdx:dx,hdy:dy,hdw:dw,hdh:dh};
    const z=zoom;
    const mv=e=>{
      const ddx=(e.clientX-op.current.sx)/z;
      const ddy=(e.clientY-op.current.sy)/z;
      let nw=Math.max(MIN_W,Math.round(op.current.ow+ddx*op.current.hdw));
      let nh=Math.max(MIN_H,Math.round(op.current.oh+ddy*op.current.hdh));
      if(snapGrid){nw=Math.max(MIN_W,snap(nw));nh=Math.max(MIN_H,snap(nh));}
      const nx=op.current.hdx?Math.max(0,Math.min(CW-nw,Math.round(op.current.ox+ddx*op.current.hdx))):op.current.ox;
      const ny=op.current.hdy?Math.max(0,Math.min(CH-nh,Math.round(op.current.oy+ddy*op.current.hdy))):op.current.oy;
      // Clamp tamaño para que no salga del canvas
      const fw=Math.min(nw,CW-nx);
      const fh=Math.min(nh,CH-ny);
      onResize(el.id,{x:nx,y:ny,w:fw,h:fh});
    };
    const up=()=>{onCommit?.();window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",up);
  };

  return(
    <div style={{position:"absolute",left:el.x,top:el.y,width:el.w,height:el.h,pointerEvents:"none",zIndex:300}}>
      {HPOS.map(([lf,tp],i)=>(
        <div key={i}
          onMouseDown={e=>beginResize(e,i)}
          style={{
            position:"absolute",
            left:`calc(${lf*100}% - ${HS/2}px)`,
            top:`calc(${tp*100}% - ${HS/2}px)`,
            width:HS,height:HS,
            background:"#ffffff",
            border:`2.5px solid ${ct.accent}`,
            borderRadius:3,cursor:HANDLES[i][0],
            boxShadow:`0 2px 8px rgba(0,0,0,0.35)`,
            pointerEvents:"all",
            transition:"transform 0.1s",
            zIndex:301,
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.5)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        />
      ))}
    </div>
  );
}

// ── GENERADORES HTML CONTENT + DAX ───────────────────────────────
function escapeHtml(str){
  return String(str||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function hexToRgb(hex){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:"0,0,0";
}

function generateNavHTML(nav,ct){
  if(nav.position==="none") return `<!-- Nav desactivado (posición: ninguno) — no incluir este visual en Power BI -->`;
  const{colors,pages,fontSize,borderRadius,width,widthCollapsed,logoUrl,reportName,style}=nav;
  const isCollapsible=style==="collapsible";
  // Color de fondo: tono suave derivado del tema (igual que NavViz)
  const themeNavBg=(()=>{
    if(!ct)return colors.bg;
    const base=ct.headerBg||ct.accent2||ct.accent||colors.bg;
    const canvasC=ct.canvas||"#ffffff";
    return isDark(canvasC)?mix(base,canvasC,0.45):mix(base,canvasC,0.78);
  })();
  const navBg=colors.bgCustom?colors.bg:themeNavBg;
  const navIsDark=isDark(navBg);
  const navAccent=(colors.selectedCustom||!ct)?colors.accent:(ct.accent||colors.accent);
  const navTxtActive=colors.textActiveCustom?colors.textActive:(navIsDark?"#ffffff":(ct?.text||"#1e293b"));
  const navTxtInactive=colors.textInactiveCustom?colors.textInactive:(navIsDark?"rgba(255,255,255,0.65)":"rgba(30,41,59,0.6)");
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif;}
  body{background:${navBg};width:100%;height:100%;overflow:hidden;}
  .nav{display:flex;flex-direction:column;height:100%;width:100%;background:${navBg};}
  .nav-header{padding:16px 12px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.08);}
  .logo{width:28px;height:28px;border-radius:6px;object-fit:contain;flex-shrink:0;}
  .logo-placeholder{width:28px;height:28px;border-radius:6px;background:${navAccent};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
  .report-name{font-size:${fontSize}px;font-weight:700;color:${navTxtActive};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .nav-items{flex:1;padding:8px 0;overflow:hidden;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;font-size:${fontSize}px;color:${navTxtInactive};border-radius:${borderRadius}px;margin:2px 8px;transition:all 0.15s;}
  .nav-item:hover{background:rgba(${hexToRgb(colors.hover)},${colors.hoverOpacity/100});color:${navTxtActive};}
  .nav-item:active{background:rgba(${hexToRgb(colors.press)},${colors.pressOpacity/100});}
  .nav-item.active{background:rgba(${hexToRgb(colors.selected)},${colors.selectedOpacity/100});color:${navTxtActive};font-weight:600;}
  .nav-item .icon{font-size:${nav.iconSize}px;width:20px;text-align:center;flex-shrink:0;}
  .nav-item .label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  ${isCollapsible?`.collapsed .label{display:none;}.collapsed .report-name{display:none;}.toggle{margin-left:auto;cursor:pointer;font-size:12px;color:${navTxtInactive};}`:""}
</style></head>
<body>
<div class="nav" id="nav">
  <div class="nav-header">
    ${logoUrl?`<img src="${directImageUrl(logoUrl)}" class="logo" onerror="this.style.display='none'">`:`<div class="logo-placeholder">⬡</div>`}
    <span class="report-name">${escapeHtml(reportName)}</span>
    ${isCollapsible?`<span class="toggle" onclick="toggleNav()">◀</span>`:""}
  </div>
  <div class="nav-items">
    ${pages.map((p,i)=>`<div class="nav-item${(p.active||(!pages.some(x=>x.active)&&i===0))?" active":""}" onclick="setActive(this)">
      <span class="icon">${escapeHtml(p.icon)}</span>
      <span class="label">${escapeHtml(p.label)}</span>
    </div>`).join("\n    ")}
  </div>
</div>
${isCollapsible?`<script>
  function toggleNav(){
    const n=document.getElementById('nav');
    n.classList.toggle('collapsed');
    const t=n.querySelector('.toggle');
    t.textContent=n.classList.contains('collapsed')?'▶':'◀';
  }
  function setActive(el){
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
    el.classList.add('active');
  }
<\/script>`:`<script>
  function setActive(el){
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
    el.classList.add('active');
  }
<\/script>`}
</body></html>`;
}

// Genera el header del reporte como visual HTML Content (barra superior)
function generateHeaderHTML(hdr,ct,nav){
  const bg=hdr.bgColor||ct.headerBg||ct.accent||"#2563eb";
  const title=hdr.title||"Mi Reporte";
  const subtitle=hdr.subtitle||"";
  const logoUrl=nav?.logoUrl||"";
  const titleColor="#ffffff";
  const subColor="rgba(255,255,255,0.78)";
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif;}
  body{width:100%;height:100%;overflow:hidden;}
  .header{display:flex;align-items:center;gap:14px;height:100%;width:100%;
    background:${bg};padding:0 20px;}
  .logo{height:60%;max-height:40px;object-fit:contain;flex-shrink:0;}
  .logo-ph{width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.2);
    display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
  .titles{display:flex;flex-direction:column;justify-content:center;overflow:hidden;}
  .title{font-size:18px;font-weight:700;color:${titleColor};
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2;}
  .subtitle{font-size:11px;color:${subColor};
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;}
</style></head>
<body>
<div class="header">
  ${logoUrl?`<img src="${directImageUrl(logoUrl)}" class="logo" onerror="this.outerHTML='<div class=&quot;logo-ph&quot;>⬡</div>'">`:`<div class="logo-ph">⬡</div>`}
  <div class="titles">
    <div class="title">${escapeHtml(title)}</div>
    ${subtitle?`<div class="subtitle">${escapeHtml(subtitle)}</div>`:""}
  </div>
</div>
</body></html>`;
}

function generateNavDAX(nav){
  const{pages,colors,borderRadius,fontSize}=nav;
  // Una medida por página — cada una con su página marcada como activa.
  // Ventaja: no requiere SELECTEDVALUE ni tabla desconectada.
  // Solo pegas la medida correspondiente en el visual HTML Content de cada página.
  const buildMeasure=(activePage)=>{
    const safeName=activePage.label.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g,"").replace(/\s+/g,"_");
    const items=pages.map(p=>{
      const isActive=p.id===activePage.id;
      return isActive
        ?`"<div class='nav-item active'>${p.icon} ${p.label}</div>"`
        :`"<div class='nav-item'>${p.icon} ${p.label}</div>"`;
    }).join(" &\n    ");
    return`// ── Página: ${activePage.label} ──────────────────────────
// Pega esta medida en el visual HTML Content de la página "${activePage.label}"
NavMenu_${safeName} =
"<style>" &
"  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 14px;" &
"    cursor:pointer; font-size:${fontSize}px; border-radius:${borderRadius}px; margin:2px 8px;" &
"    color:${colors.textInactive}; font-family:Segoe UI,sans-serif; transition:background 0.15s; }" &
"  .nav-item:hover { background:rgba(${hexToRgb(colors.hover)},${colors.hoverOpacity/100}); color:${colors.textActive}; }" &
"  .nav-item:active { background:rgba(${hexToRgb(colors.press)},${colors.pressOpacity/100}); }" &
"  .nav-item.active { background:rgba(${hexToRgb(colors.selected)},${colors.selectedOpacity/100});" &
"    color:${colors.textActive}; font-weight:600; }" &
"</style>" &
"<div style='background:${colors.bg};height:100%;padding:8px 0;'>" &
    ${items} &
"</div>"`;
  };

  return`// ═══════════════════════════════════════════════════════
// MEDIDAS DAX — Menú de Navegación PBI Designer v2.0
// UNA MEDIDA POR PÁGINA — cada página tiene su menú con
// su propio ítem marcado como activo.
//
// INSTRUCCIONES:
// 1. Agrega el visual "HTML Content" a cada página del reporte
// 2. Pega en cada página SU medida correspondiente
// 3. Configura los botones de navegación con marcadores (bookmarks)
// ═══════════════════════════════════════════════════════

${pages.map(p=>buildMeasure(p)).join("\n\n")}
`;
}

// ── BIBLIOTECA DE TEMAS DE MARCA (paletas reutilizables) ──────────
// Solo colores del canvas (ct), no layouts. Se aplican sobre el diseño actual.
const BRAND_THEMES=[
  {id:"agrolatina",name:"Agrolatina",emoji:"🥑",
    ct:{canvas:"#ffffff",wallpaper:"#eef3ec",cardBg:"#ffffff",cardBorder:"#dce7d6",accent:"#4d7c2f",accent2:"#3d6325",secondary:"#eef5e9",text:"#1f2e16",textSub:"#5a6b4a",textMuted:"#92a382",headerBg:"#3d6325",success:"#16a34a",danger:"#dc2626",warning:"#ea9a16",r:8}},
  {id:"corporate-blue",name:"Corporate Blue",emoji:"🔵",
    ct:{canvas:"#ffffff",wallpaper:"#eef2f7",cardBg:"#ffffff",cardBorder:"#dbe4ee",accent:"#2563eb",accent2:"#1d4ed8",secondary:"#eff6ff",text:"#1e293b",textSub:"#64748b",textMuted:"#94a3b8",headerBg:"#1e3a8a",success:"#059669",danger:"#dc2626",warning:"#f59e0b",r:8}},
  {id:"midnight",name:"Midnight Dark",emoji:"🌙",
    ct:{canvas:"#0d1b2a",wallpaper:"#060e18",cardBg:"#0f2236",cardBorder:"#1d3349",accent:"#38bdf8",accent2:"#0ea5e9",secondary:"#0c2a3f",text:"#e2f4ff",textSub:"#7dd3fc",textMuted:"#5a7a92",headerBg:"#0a1828",success:"#22c55e",danger:"#f87171",warning:"#fbbf24",r:10}},
  {id:"emerald",name:"Emerald Fresh",emoji:"💚",
    ct:{canvas:"#ffffff",wallpaper:"#e8f5ee",cardBg:"#ffffff",cardBorder:"#c8e9d6",accent:"#059669",accent2:"#047857",secondary:"#ecfdf5",text:"#14322a",textSub:"#4b6b5e",textMuted:"#84a394",headerBg:"#065f46",success:"#16a34a",danger:"#dc2626",warning:"#f59e0b",r:8}},
  {id:"sunset",name:"Sunset Warm",emoji:"🌅",
    ct:{canvas:"#fffbf7",wallpaper:"#f7ede2",cardBg:"#ffffff",cardBorder:"#f3ddc8",accent:"#ea580c",accent2:"#c2410c",secondary:"#fff7ed",text:"#3a1f12",textSub:"#7a5a47",textMuted:"#b09080",headerBg:"#9a3412",success:"#16a34a",danger:"#dc2626",warning:"#f59e0b",r:10}},
  {id:"royal",name:"Royal Purple",emoji:"👑",
    ct:{canvas:"#0e0b1e",wallpaper:"#070512",cardBg:"#1a1430",cardBorder:"#2d1f50",accent:"#a78bfa",accent2:"#8b5cf6",secondary:"#1e1640",text:"#ede9fe",textSub:"#c4b5fd",textMuted:"#6d5e9e",headerBg:"#4c1d95",success:"#22c55e",danger:"#f87171",warning:"#fbbf24",r:10}},
  {id:"slate-pro",name:"Slate Pro",emoji:"⬜",
    ct:{canvas:"#ffffff",wallpaper:"#eef1f4",cardBg:"#ffffff",cardBorder:"#e2e8f0",accent:"#475569",accent2:"#334155",secondary:"#f1f5f9",text:"#0f172a",textSub:"#475569",textMuted:"#94a3b8",headerBg:"#1e293b",success:"#059669",danger:"#dc2626",warning:"#f59e0b",r:6}},
  {id:"crimson",name:"Crimson Bold",emoji:"🔴",
    ct:{canvas:"#ffffff",wallpaper:"#f7eaea",cardBg:"#ffffff",cardBorder:"#f0d0d0",accent:"#dc2626",accent2:"#b91c1c",secondary:"#fef2f2",text:"#2e1414",textSub:"#7a4a4a",textMuted:"#b08888",headerBg:"#991b1b",success:"#16a34a",danger:"#dc2626",warning:"#f59e0b",r:8}},
];

// ── PRESETS (incluyen canvasTheme propio) ─────────────────────────
const PRESETS={
  sales:{
    ct:{...CANVAS_DEFAULT,accent:"#0ea5e9",accent2:"#0284c7",secondary:"#e0f2fe",headerBg:"#0c4a6e",cardBorder:"#bae6fd"},
    nav:{position:"left",style:"collapsible",width:190,exportSeparate:false},
    header:{show:true,title:"Sales Dashboard",subtitle:"Revenue · Units · Pipeline",height:58,bgColor:"#0c4a6e"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Sales Dashboard"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navigation"},{id:3,type:"slicer",x:198,y:66,w:754,h:44,label:"Filtros: Periodo · Región"},{id:4,type:"kpi",x:198,y:114,w:180,h:88,label:"Total Revenue"},{id:5,type:"kpi",x:386,y:114,w:180,h:88,label:"Units Sold"},{id:6,type:"kpi",x:574,y:114,w:180,h:88,label:"Avg. Deal"},{id:7,type:"kpi",x:762,y:114,w:190,h:88,label:"Win Rate %"},{id:8,type:"bar",x:198,y:210,w:370,h:200,label:"Revenue by Region"},{id:9,type:"line",x:576,y:210,w:376,h:200,label:"Monthly Trend"},{id:10,type:"pie",x:198,y:418,w:240,h:154,label:"By Segment"},{id:11,type:"table",x:446,y:418,w:506,h:154,label:"Top Deals"}]},
  finance:{
    ct:{...CANVAS_DEFAULT,canvas:"#0e0b1e",cardBg:"#1a1430",cardBorder:"#2d1f50",accent:"#a78bfa",accent2:"#8b5cf6",secondary:"#1e1640",text:"#ede9fe",textSub:"#a78bfa",textMuted:"#6d5e9e",headerBg:"#2d1b69",r:10},
    nav:{position:"left",style:"static",width:190,exportSeparate:false},
    header:{show:true,title:"Financial Overview",subtitle:"P&L · Cash Flow · Budget",height:58,bgColor:"#2d1b69"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Financial Overview"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navigation"},{id:3,type:"slicer",x:198,y:66,w:754,h:44,label:"Filtros: Trimestre · Centro de Costo"},{id:4,type:"kpi",x:198,y:114,w:180,h:88,label:"Net Revenue"},{id:5,type:"kpi",x:386,y:114,w:180,h:88,label:"EBITDA"},{id:6,type:"kpi",x:574,y:114,w:180,h:88,label:"Net Margin"},{id:7,type:"kpi",x:762,y:114,w:190,h:88,label:"Cash Flow"},{id:8,type:"line",x:198,y:210,w:528,h:200,label:"P&L Monthly"},{id:9,type:"bar",x:734,y:210,w:218,h:200,label:"Expenses"},{id:10,type:"table",x:198,y:418,w:556,h:154,label:"Budget vs Actual"},{id:11,type:"pie",x:762,y:418,w:190,h:154,label:"Cost Centers"}]},
  hr:{
    ct:{...CANVAS_DEFAULT,accent:"#f472b6",accent2:"#ec4899",secondary:"#fdf2f8",headerBg:"#831843",cardBorder:"#fbcfe8"},
    nav:{position:"right",style:"static",width:185,exportSeparate:false},
    header:{show:true,title:"HR Analytics",subtitle:"People · Performance · Culture",height:58,bgColor:"#831843"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"HR Analytics"},{id:2,type:"nav",x:775,y:58,w:185,h:522,label:"Navigation"},{id:3,type:"slicer",x:8,y:66,w:759,h:44,label:"Filtros: Departamento · Periodo"},{id:4,type:"kpi",x:8,y:114,w:180,h:88,label:"Headcount"},{id:5,type:"kpi",x:196,y:114,w:180,h:88,label:"Attrition %"},{id:6,type:"kpi",x:384,y:114,w:180,h:88,label:"Avg. Tenure"},{id:7,type:"kpi",x:572,y:114,w:195,h:88,label:"Engagement"},{id:8,type:"bar",x:8,y:210,w:370,h:200,label:"Headcount by Dept"},{id:9,type:"line",x:386,y:210,w:381,h:200,label:"Hiring Trend"},{id:10,type:"pie",x:8,y:418,w:240,h:154,label:"By Gender"},{id:11,type:"table",x:256,y:418,w:511,h:154,label:"Top Performers"}]},
  marketing:{
    ct:{...CANVAS_DEFAULT,accent:"#fb923c",accent2:"#f97316",secondary:"#fff7ed",headerBg:"#9a3412",cardBorder:"#fed7aa"},
    nav:{position:"top",style:"static",width:960,exportSeparate:false},
    header:{show:true,title:"Marketing Dashboard",subtitle:"Campaigns · Conversions · ROI",height:54,bgColor:"#9a3412"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:54,label:"Marketing Dashboard"},{id:2,type:"nav",x:0,y:54,w:960,h:42,label:"Navigation"},{id:3,type:"slicer",x:8,y:104,w:944,h:44,label:"Filtros: Campaña · Canal · Periodo"},{id:4,type:"kpi",x:8,y:150,w:177,h:84,label:"Impressions"},{id:5,type:"kpi",x:193,y:150,w:177,h:84,label:"CTR %"},{id:6,type:"kpi",x:378,y:150,w:177,h:84,label:"Conversions"},{id:7,type:"kpi",x:563,y:150,w:177,h:84,label:"CAC"},{id:8,type:"kpi",x:748,y:150,w:204,h:84,label:"ROAS"},{id:9,type:"line",x:8,y:242,w:560,h:170,label:"Campaign Performance"},{id:10,type:"bar",x:576,y:242,w:376,h:170,label:"Channel Mix"},{id:11,type:"table",x:8,y:420,w:560,h:152,label:"Top Campaigns"},{id:12,type:"pie",x:576,y:420,w:376,h:152,label:"Audience Split"}]},
  // ── PLANTILLAS POR INDUSTRIA ──
  agro:{
    ct:{...CANVAS_DEFAULT,canvas:"#ffffff",wallpaper:"#eef3ec",accent:"#4d7c2f",accent2:"#3d6325",secondary:"#eef5e9",headerBg:"#3d6325",cardBorder:"#dce7d6",text:"#1f2e16",textSub:"#5a6b4a",warning:"#ea9a16"},
    nav:{position:"left",style:"collapsible",width:190,exportSeparate:false},
    header:{show:true,title:"Control de Proceso Agrícola",subtitle:"Campaña · Calibres · Rendimiento",height:58,bgColor:"#3d6325"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Control de Proceso Agrícola"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navegación"},{id:3,type:"slicer",x:198,y:66,w:754,h:44,label:"Filtros: Fundo · Variedad · Campaña"},{id:4,type:"kpi",x:198,y:114,w:180,h:88,label:"Kg Cosechados"},{id:5,type:"kpi",x:386,y:114,w:180,h:88,label:"Kg Exportados"},{id:6,type:"kpi",x:574,y:114,w:180,h:88,label:"% Rendimiento"},{id:7,type:"kpi",x:762,y:114,w:190,h:88,label:"Merma Total"},{id:8,type:"bar",x:198,y:210,w:370,h:200,label:"Producción por Calibre"},{id:9,type:"line",x:576,y:210,w:376,h:200,label:"Tendencia de Cosecha"},{id:10,type:"pie",x:198,y:418,w:240,h:154,label:"Destino Export"},{id:11,type:"table",x:446,y:418,w:506,h:154,label:"Detalle por Lote"}]},
  retail:{
    ct:{...CANVAS_DEFAULT,accent:"#7c3aed",accent2:"#6d28d9",secondary:"#f3effe",headerBg:"#5b21b6",cardBorder:"#ddd0f7"},
    nav:{position:"left",style:"static",width:190,exportSeparate:false},
    header:{show:true,title:"Retail Performance",subtitle:"Ventas · Inventario · Tiendas",height:58,bgColor:"#5b21b6"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Retail Performance"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navegación"},{id:3,type:"slicer",x:198,y:66,w:754,h:44,label:"Filtros: Categoría · Tienda · Periodo"},{id:4,type:"kpi",x:198,y:114,w:180,h:88,label:"Ventas Totales"},{id:5,type:"kpi",x:386,y:114,w:180,h:88,label:"Ticket Promedio"},{id:6,type:"kpi",x:574,y:114,w:180,h:88,label:"Unidades"},{id:7,type:"kpi",x:762,y:114,w:190,h:88,label:"Margen %"},{id:8,type:"bar",x:198,y:210,w:370,h:200,label:"Ventas por Tienda"},{id:9,type:"line",x:576,y:210,w:376,h:200,label:"Tendencia Diaria"},{id:10,type:"pie",x:198,y:418,w:240,h:154,label:"Mix de Productos"},{id:11,type:"table",x:446,y:418,w:506,h:154,label:"Top SKUs"}]},
  salud:{
    ct:{...CANVAS_DEFAULT,accent:"#0891b2",accent2:"#0e7490",secondary:"#ecfeff",headerBg:"#155e75",cardBorder:"#bae6fd"},
    nav:{position:"left",style:"static",width:190,exportSeparate:false},
    header:{show:true,title:"Indicadores de Salud",subtitle:"Pacientes · Ocupación · Tiempos",height:58,bgColor:"#155e75"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Indicadores de Salud"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navegación"},{id:3,type:"slicer",x:198,y:66,w:754,h:44,label:"Filtros: Área · Especialidad · Periodo"},{id:4,type:"kpi",x:198,y:114,w:180,h:88,label:"Pacientes Atendidos"},{id:5,type:"kpi",x:386,y:114,w:180,h:88,label:"% Ocupación"},{id:6,type:"kpi",x:574,y:114,w:180,h:88,label:"Tiempo Espera"},{id:7,type:"kpi",x:762,y:114,w:190,h:88,label:"Satisfacción"},{id:8,type:"line",x:198,y:210,w:528,h:200,label:"Atenciones por Día"},{id:9,type:"bar",x:734,y:210,w:218,h:200,label:"Por Especialidad"},{id:10,type:"table",x:198,y:418,w:556,h:154,label:"Detalle por Área"},{id:11,type:"pie",x:762,y:418,w:190,h:154,label:"Tipo de Atención"}]},
  logistica:{
    ct:{...CANVAS_DEFAULT,canvas:"#0d1b2a",wallpaper:"#060e18",cardBg:"#0f2236",cardBorder:"#1d3349",accent:"#f59e0b",accent2:"#d97706",secondary:"#1e2a3f",text:"#e2f4ff",textSub:"#94a3b8",textMuted:"#5a7a92",headerBg:"#1e293b",r:8},
    nav:{position:"left",style:"collapsible",width:190,exportSeparate:false},
    header:{show:true,title:"Centro de Control Logístico",subtitle:"Flota · Rutas · Entregas",height:58,bgColor:"#1e293b"},
    els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Centro de Control Logístico"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navegación"},{id:3,type:"slicer",x:198,y:66,w:754,h:44,label:"Filtros: Zona · Vehículo · Fecha"},{id:4,type:"kpi",x:198,y:114,w:180,h:88,label:"Entregas Hoy"},{id:5,type:"kpi",x:386,y:114,w:180,h:88,label:"% A Tiempo"},{id:6,type:"kpi",x:574,y:114,w:180,h:88,label:"Km Recorridos"},{id:7,type:"kpi",x:762,y:114,w:190,h:88,label:"Costo/Entrega"},{id:8,type:"bar",x:198,y:210,w:370,h:200,label:"Entregas por Ruta"},{id:9,type:"line",x:576,y:210,w:376,h:200,label:"Cumplimiento Diario"},{id:10,type:"pie",x:198,y:418,w:240,h:154,label:"Estado Entregas"},{id:11,type:"table",x:446,y:418,w:506,h:154,label:"Detalle de Rutas"}]},
};

// ── Apilado vertical inteligente para vista móvil ─────────────────
// Orden: header → nav → filtros → KPIs (2 por fila) → charts → tabla
// Agrupa elementos pequeños en la misma fila cuando caben; garantiza cero solapes.
function forceStackVertical(els,CW,CH){
  const PAD=20, GAP=14;
  const W=CW-PAD*2; // ancho de contenido
  const order={header:0,nav:1,slicer:2,kpi:3,card:3,button:3,bar:4,line:4,pie:4,donut:4,table:5,image:5};
  const sorted=[...els].sort((a,b)=>{
    const oa=order[a.type]??9, ob=order[b.type]??9;
    if(oa!==ob)return oa-ob;
    return (a.y||0)-(b.y||0);
  });
  const hFor=t=>({header:70,nav:54,slicer:78,kpi:120,card:120,button:64,bar:240,line:240,pie:240,donut:240,table:240,image:200}[t]||120);
  // Tipos que pueden ir 2 por fila en móvil (elementos compactos)
  const pairable=new Set(["kpi","card","pie","donut"]);
  let cursorY=0;
  const out=[];
  let i=0;
  while(i<sorted.length){
    const e=sorted[i];
    const isFullBleed=e.type==="header"||e.type==="nav";
    if(isFullBleed){
      out.push({...e,x:0,y:cursorY,w:CW,h:hFor(e.type)});
      cursorY+=hFor(e.type)+GAP;
      i++;continue;
    }
    // ¿El siguiente es del mismo tipo pareable? → ponerlos lado a lado (2 por fila)
    const next=sorted[i+1];
    if(pairable.has(e.type)&&next&&next.type===e.type){
      const half=Math.floor((W-GAP)/2);
      const h=hFor(e.type);
      out.push({...e,x:PAD,y:cursorY,w:half,h});
      out.push({...next,x:PAD+half+GAP,y:cursorY,w:W-half-GAP,h});
      cursorY+=h+GAP;
      i+=2;continue;
    }
    // Elemento ancho completo
    const h=hFor(e.type);
    out.push({...e,x:PAD,y:cursorY,w:W,h});
    cursorY+=h+GAP;
    i++;
  }
  // Exponer la altura total necesaria (último elemento + margen inferior)
  out.neededHeight=cursorY+PAD;
  return out;
}
// Calcula la altura de canvas móvil ideal: 1600 estándar, o más si el contenido lo requiere
function mobileCanvasHeight(stackedEls){
  const needed=stackedEls.neededHeight||1600;
  if(needed<=1600)return 1600;
  // Redondear hacia arriba a múltiplos de 100 para un canvas limpio
  return Math.ceil(needed/100)*100;
}


// ═══════════════════════════════════════════════════════════════════
// LOGIN / REGISTER SCREEN
// ═══════════════════════════════════════════════════════════════════
function LoginScreen({onLogin}){
  const[view,setView]=useState("login");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[confirmPwd,setConfirmPwd]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[showPwd,setShowPwd]=useState(false);

  const FIELD_STYLE={
    width:"100%",background:"rgba(255,255,255,0.06)",
    border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,
    padding:"9px 12px",color:"#f1f5f9",fontSize:12,outline:"none",
    boxSizing:"border-box",transition:"border-color 0.2s",
    fontFamily:"'Segoe UI',sans-serif",
  };
  const LBL_STYLE={
    fontSize:10,color:"#94a3b8",fontFamily:"monospace",letterSpacing:0.5,
    display:"block",marginBottom:5,textTransform:"uppercase",
  };

  const submit=async()=>{
    setError("");
    if(!email.trim()||!password.trim()){setError("Email y contraseña son obligatorios.");return;}
    if(view==="register"&&password!==confirmPwd){setError("Las contraseñas no coinciden.");return;}
    if(view==="register"&&password.length<6){setError("La contraseña debe tener mínimo 6 caracteres.");return;}
    setLoading(true);
    try{
      const url=`http://localhost:3001/api/auth/${view==="login"?"login":"register"}`;
      const res=await fetch(url,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:email.trim().toLowerCase(),password}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Error de autenticación");
      onLogin(data.user,data.token);
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  };

  return(
    <div style={{width:"100vw",height:"100vh",
      background:"linear-gradient(135deg,#0a0f1e 0%,#0f2044 50%,#0a0f1e 100%)",
      display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>

      {/* Cuadrícula de fondo */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:`linear-gradient(rgba(59,130,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.05) 1px,transparent 1px)`,
        backgroundSize:"48px 48px"}}/>
      {/* Glow central */}
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",
        width:600,height:400,borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(59,130,246,0.12) 0%,transparent 70%)",
        pointerEvents:"none"}}/>

      {/* Card */}
      <div style={{background:"rgba(10,15,30,0.88)",backdropFilter:"blur(20px)",
        border:"1px solid rgba(59,130,246,0.2)",borderRadius:18,
        padding:"38px 40px",width:400,maxWidth:"92vw",
        boxShadow:"0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        position:"relative",zIndex:1}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:30}}>
          <div style={{width:46,height:46,borderRadius:13,
            background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:22,color:"#fff",fontWeight:900,
            boxShadow:"0 6px 24px rgba(59,130,246,0.45)"}}>⬡</div>
          <div>
            <div style={{fontSize:19,fontWeight:800,color:"#f0f6ff",letterSpacing:-0.5,lineHeight:1.1}}>PBI Designer</div>
            <div style={{fontSize:9,color:"#4a6080",fontFamily:"monospace",letterSpacing:1,marginTop:2}}>v2.0 · AI-POWERED</div>
          </div>
        </div>

        {/* Toggle Login / Registro */}
        <div style={{display:"flex",background:"rgba(255,255,255,0.04)",
          borderRadius:9,padding:3,marginBottom:22,
          border:"1px solid rgba(255,255,255,0.08)"}}>
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(([v,lbl])=>(
            <button key={v} onClick={()=>{setView(v);setError("");setConfirmPwd("");}}
              style={{flex:1,padding:"7px 0",border:"none",borderRadius:7,cursor:"pointer",
                fontSize:11,fontWeight:600,transition:"all 0.2s",
                background:view===v?"#3b82f6":"transparent",
                color:view===v?"#fff":"#4a6080",
                boxShadow:view===v?"0 3px 12px rgba(59,130,246,0.35)":"none"}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Campos */}
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          <div>
            <label style={LBL_STYLE}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()}
              placeholder="tu@empresa.com" style={FIELD_STYLE}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Contraseña</label>
            <div style={{position:"relative"}}>
              <input type={showPwd?"text":"password"} value={password}
                onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="••••••••"
                style={{...FIELD_STYLE,paddingRight:36}}
                onFocus={e=>e.target.style.borderColor="#3b82f6"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              <button onClick={()=>setShowPwd(s=>!s)}
                style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",color:"#4a6080",fontSize:14,padding:0,lineHeight:1}}>
                {showPwd?"🙈":"👁"}
              </button>
            </div>
          </div>
          {view==="register"&&(
            <div>
              <label style={LBL_STYLE}>Confirmar contraseña</label>
              <input type={showPwd?"text":"password"} value={confirmPwd}
                onChange={e=>setConfirmPwd(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="••••••••" style={FIELD_STYLE}
                onFocus={e=>e.target.style.borderColor="#3b82f6"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
            </div>
          )}
        </div>

        {/* Error */}
        {error&&(
          <div style={{marginTop:13,padding:"9px 12px",
            background:"rgba(220,38,38,0.1)",border:"1px solid rgba(220,38,38,0.28)",
            borderRadius:8,fontSize:11,color:"#fca5a5",lineHeight:1.55}}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={loading}
          style={{width:"100%",marginTop:16,padding:"12px",borderRadius:9,border:"none",
            cursor:loading?"default":"pointer",
            background:loading?"rgba(59,130,246,0.4)":"linear-gradient(135deg,#3b82f6,#1d4ed8)",
            color:"#fff",fontSize:13,fontWeight:700,letterSpacing:0.3,
            boxShadow:loading?"none":"0 6px 24px rgba(59,130,246,0.4)",
            transition:"all 0.2s",opacity:loading?0.7:1}}>
          {loading?"Verificando..."
            :view==="login"?"Iniciar sesión →":"Crear cuenta →"}
        </button>

        {/* Acceso dev */}
        <div style={{marginTop:18,textAlign:"center"}}>
          <button onClick={async()=>{
            setLoading(true);setError("");
            try{
              const res=await fetch("http://localhost:3001/api/auth/simple-login",{method:"POST"});
              const data=await res.json();
              if(!res.ok)throw new Error(data.error||"Error");
              onLogin(data.user,data.token);
            }catch(e){setError(e.message);}
            finally{setLoading(false);}
          }} style={{background:"none",border:"none",cursor:"pointer",
            fontSize:9,color:"rgba(100,116,139,0.5)",fontFamily:"monospace",
            textDecoration:"underline",textDecorationStyle:"dotted"}}>
            Acceso rápido (dev)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PBIDesigner(){
  // UI shell theme — solo afecta la interfaz
  const[appThemeId,setAppThemeId]=useState("light");
  const A=APP_THEMES[appThemeId];

  // ── AUTENTICACIÓN ──
  const[user,setUser]=useState(()=>{
    try{const s=localStorage.getItem('pbi_user');return s?JSON.parse(s):null;}catch{return null;}
  });
  const handleLogin=(userData,token)=>{
    localStorage.setItem('token',token);
    localStorage.setItem('pbi_user',JSON.stringify(userData));
    setUser(userData);
  };
  const handleLogout=()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('pbi_user');
    setUser(null);
  };

  // Verificar token al montar — si expiró, forzar login
  useEffect(()=>{
    const token=localStorage.getItem('token');
    if(!token){setUser(null);return;}
    fetch('http://localhost:3001/api/auth/verify',{headers:{'Authorization':`Bearer ${token}`}})
      .then(r=>{if(!r.ok){handleLogout();}else{r.json().then(d=>{if(d.user)setUser(prev=>({...prev,...d.user}));});}})
      .catch(()=>{}); // sin internet: mantener sesión en caché
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Canvas theme — arranca Clean Light, solo la IA lo cambia
  const[ct,setCt]=useState({...CANVAS_DEFAULT});

  const[els,setEls]=useState([]);
  // ── Sistema de doble diseño: Normal (desktop) y Móvil ──
  const[viewMode,setViewMode]=useState("desktop"); // "desktop" | "mobile"
  const[mobileEls,setMobileEls]=useState(null); // diseño móvil guardado (null = no generado aún)
  const desktopBackup=useRef(null); // respaldo del desktop mientras editas móvil
  const desktopSizeBackup=useRef(null);
  const[sel,setSel]=useState(null);
  const[canvasSize,setCanvasSize]=useState(CANVAS_SIZES[0]); // 960×580 por defecto
  const[customW,setCustomW]=useState(1280);
  const[customH,setCustomH]=useState(720);
  const[draftW,setDraftW]=useState(1280); // valores en edición (antes de aplicar)
  const[draftH,setDraftH]=useState(720);
  const CW=canvasSize.id==="custom"?customW:canvasSize.w;
  const[mobileH,setMobileH]=useState(1600); // altura dinámica del canvas móvil
  // En vista móvil, la altura puede crecer si el contenido lo necesita
  const CH=viewMode==="mobile"?mobileH:(canvasSize.id==="custom"?customH:canvasSize.h);
  const[resizePrompt,setResizePrompt]=useState(null); // {oldW,oldH} cuando cambia el tamaño
  const[confirmNew,setConfirmNew]=useState(false); // modal de confirmación nuevo lienzo
  const prevSize=useRef({w:CW,h:CH});
  const suppressResize=useRef(false); // suprime banner cuando el cambio es programático
  const[zoom,setZoom]=useState(0.72);
  const[snapGrid,setSnapGrid]=useState(true);
  const[guides,setGuides]=useState([]); // líneas guía de alineación durante drag
  const[showGrid,setShowGrid]=useState(true);
  const[history,setHistory]=useState([[]]);
  const[histIdx,setHistIdx]=useState(0);
  const histIdxRef=useRef(0);
  const[msgs,setMsgs]=useState([{role:"ai",text:"¡Hola! Soy tu asistente de diseño para Power BI. 👋\n\nEl canvas arranca siempre en Clean Light. Solo cambia si tú lo pides.\n\nPuedes:\n• Describir el reporte: «Dashboard de ventas con menú izquierdo»\n• Pedir colores: «tema oscuro azul» o «acento verde corporativo»\n• Subir una imagen/captura de referencia\n• Cargar una plantilla desde el panel ⬡\n\n¿Con qué te ayudo hoy?"}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[aiOpen,setAiOpen]=useState(true);
  const[nextId,setNextId]=useState(50);
  const[exportModal,setExportModal]=useState(false);
  const[themeModal,setThemeModal]=useState(false);
  const[versionsModal,setVersionsModal]=useState(false);
  const[savedDesigns,setSavedDesigns]=useState([]);
  const[savedThemes,setSavedThemes]=useState([]); // temas guardados por el usuario
  const[autoSaveTs,setAutoSaveTs]=useState(null); // timestamp del último auto-save
  const autoSaveTimer=useRef(null);
  const[navCfg,setNavCfg]=useState({...NAV_DEFAULT});
  const[hdrCfg,setHdrCfg]=useState({show:false,title:"My Report",subtitle:"Business Intelligence Dashboard",height:58,bgColor:""});

  // ── SYNC NAV: reposiciona el nav Y reformula el área de contenido cuando cambia position/width ──
  const prevNavLayout=useRef({position:NAV_DEFAULT.position,width:NAV_DEFAULT.width});
  useEffect(()=>{
    const{position:prevPos,width:prevW}=prevNavLayout.current;
    if(prevPos===navCfg.position&&prevW===navCfg.width)return;
    const oldPos=prevPos||"left";
    const oldNavW=prevW||192;
    prevNavLayout.current={position:navCfg.position,width:navCfg.width};
    setEls(cur=>{
      if(!cur.length)return cur;
      const hdrEl=cur.find(e=>e.type==="header");
      const hdrH=hdrEl?hdrEl.h:56;
      const NAV_TOP_H=48;
      const pos=navCfg.position||"left";
      const newNavW=navCfg.width||192;
      // Área de contenido: zona donde van los elementos que no son nav/header
      const contentArea=(p,nw)=>{
        if(p==="left")  return{x:nw,      y:hdrH,            w:CW-nw,  h:CH-hdrH};
        if(p==="right") return{x:0,       y:hdrH,            w:CW-nw,  h:CH-hdrH};
        if(p==="top")   return{x:0,       y:hdrH+NAV_TOP_H,  w:CW,     h:CH-hdrH-NAV_TOP_H};
        /*none*/        return{x:0,       y:hdrH,            w:CW,     h:CH-hdrH};
      };
      const old=contentArea(oldPos,oldNavW);
      const nw=contentArea(pos,newNavW);
      // Nuevo elemento nav (para "none": franja delgada al borde izquierdo como indicador visual)
      const navPatch=
        pos==="left"  ?{x:0,         y:hdrH, w:newNavW,   h:CH-hdrH}:
        pos==="right" ?{x:CW-newNavW,y:hdrH, w:newNavW,   h:CH-hdrH}:
        pos==="top"   ?{x:0,         y:hdrH, w:CW,        h:NAV_TOP_H}:
        /*none*/       {x:0,         y:hdrH, w:6,         h:CH-hdrH};
      return cur.map(e=>{
        if(e.type==="nav")    return navPatch?{...e,...navPatch}:e;
        if(e.type==="header") return e; // header no se mueve
        // Remap proporcional del elemento al nuevo área de contenido
        if(old.w<=0||old.h<=0) return e;
        const rx=nw.w/old.w, ry=nw.h/old.h;
        return{
          ...e,
          x:Math.max(nw.x, Math.round(nw.x+(e.x-old.x)*rx)),
          y:Math.max(nw.y, Math.round(nw.y+(e.y-old.y)*ry)),
          w:Math.max(MIN_W,Math.round(e.w*rx)),
          h:Math.max(MIN_H,Math.round(e.h*ry)),
        };
      });
    });
  },[navCfg.position,navCfg.width,CW,CH]);

  // ── RESTORE: recuperar estado al montar (una sola vez) ──
  useEffect(()=>{
    try{
      const raw=localStorage.getItem('pbi_autosave');
      if(!raw)return;
      const s=JSON.parse(raw);
      if(!s||!Array.isArray(s.els)||s.els.length===0)return;
      // Filtrar elementos con estructura mínima válida
      const validEls=s.els.filter(e=>
        e&&typeof e.id==='number'&&typeof e.type==='string'&&
        typeof e.x==='number'&&typeof e.y==='number'
      );
      if(!validEls.length)return;
      const size=CANVAS_SIZES.find(x=>x.id===s.canvasSizeId)||CANVAS_SIZES[0];
      suppressResize.current=true;
      setEls(validEls);
      if(s.ct&&typeof s.ct==='object')setCt(prev=>({...prev,...s.ct}));
      if(s.hdrCfg&&typeof s.hdrCfg==='object')setHdrCfg(prev=>({...prev,...s.hdrCfg}));
      if(s.navCfg&&typeof s.navCfg==='object'){
        setNavCfg(n=>({...n,...s.navCfg,
          colors:{...NAV_DEFAULT.colors,...(s.navCfg.colors||{})},
          pages:s.navCfg.pages||n.pages||NAV_DEFAULT.pages}));
        // Evita que el sync-effect remapee un diseño ya posicionado correctamente
        prevNavLayout.current={position:s.navCfg.position||NAV_DEFAULT.position,width:s.navCfg.width||NAV_DEFAULT.width};
      }
      setCanvasSize(size);
      if(typeof s.customW==='number')setCustomW(s.customW);
      if(typeof s.customH==='number')setCustomH(s.customH);
      const validELIds=validEls.map(e=>e.id).filter(id=>typeof id==='number'&&isFinite(id)&&id>0);
      setNextId(Math.max(...validELIds,49)+1);
      const ts=s.savedAt?new Date(s.savedAt):new Date();
      setAutoSaveTs(ts);
      const ago=Math.round((Date.now()-ts.getTime())/60000);
      const agoStr=ago<1?"hace un momento":ago===1?"hace 1 min":`hace ${ago} min`;
      setMsgs(m=>[...m,{role:"ai",text:`↩️ Recuperé tu último trabajo (${agoStr}). Puedes continuar donde lo dejaste. Usa Ctrl+Z si prefieres empezar de cero.`}]);
    }catch(e){
      // Estado corrupto — limpiar para que no bloquee futuros arranques
      try{localStorage.removeItem('pbi_autosave');}catch(_){}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── AUTO-SAVE: 3s después del último cambio ──
  useEffect(()=>{
    if(els.length===0)return;
    if(autoSaveTimer.current)clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current=setTimeout(()=>{
      try{
        const state={els,ct,hdrCfg,navCfg,
          canvasSizeId:canvasSize.id,customW,customH,
          savedAt:new Date().toISOString(),v:1};
        localStorage.setItem('pbi_autosave',JSON.stringify(state));
        setAutoSaveTs(new Date());
      }catch(e){
        // localStorage lleno o deshabilitado — avisar al usuario (una sola vez)
        setMsgs(m=>{
          const lastMsg=m[m.length-1];
          const warn='⚠️ No se pudo guardar automáticamente (almacenamiento del navegador lleno). Usa "Diseños > Guardar" para no perder tu trabajo.';
          if(lastMsg?.text===warn)return m; // no duplicar
          return[...m,{role:"ai",text:warn}];
        });
      }
    },3000);
    return()=>clearTimeout(autoSaveTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[els,ct,hdrCfg,navCfg,canvasSize,customW,customH]);

  // Cargar temas guardados desde storage al iniciar
  useEffect(()=>{
    (async()=>{
      try{
        const r=await window.storage?.get("savedThemes");
        if(r?.value){setSavedThemes(JSON.parse(r.value));return;}
        const ls=localStorage.getItem("pbi_savedThemes");
        if(ls)setSavedThemes(JSON.parse(ls));
      }catch(e){}
    })();
  },[]);

  const saveCurrentTheme=async(name)=>{
    const theme={id:"u"+Date.now(),name:name||"Mi tema "+(savedThemes.length+1),emoji:"🎨",ct:{...ct},custom:true};
    const updated=[...savedThemes,theme];
    setSavedThemes(updated);
    try{await window.storage?.set("savedThemes",JSON.stringify(updated),false);}catch(e){}
    try{localStorage.setItem("pbi_savedThemes",JSON.stringify(updated));}catch(e){}
  };
  const deleteTheme=async(id)=>{
    const updated=savedThemes.filter(t=>t.id!==id);
    setSavedThemes(updated);
    try{await window.storage?.set("savedThemes",JSON.stringify(updated),false);}catch(e){}
    try{localStorage.setItem("pbi_savedThemes",JSON.stringify(updated));}catch(e){}
  };

  // ── VERSIONADO DE DISEÑOS (proyectos guardados) ──
  const LS_DESIGNS="pbi_saved_designs";
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(LS_DESIGNS);
      if(raw)setSavedDesigns(JSON.parse(raw));
    }catch(e){}
  },[]);

  const saveDesign=async(name)=>{
    const design={
      id:"d"+Date.now(),
      name:name||"Diseño "+(savedDesigns.length+1),
      date:new Date().toLocaleDateString("es"),
      els:els.map(e=>({...e})),
      mobileEls:mobileEls?mobileEls.map(e=>({...e})):null,
      ct:{...ct},navCfg:JSON.parse(JSON.stringify(navCfg)),hdrCfg:{...hdrCfg},
      canvasSizeId:canvasSize.id,customW,customH,count:els.length,
      source:"local",
    };
    const updated=[design,...savedDesigns].slice(0,30);
    setSavedDesigns(updated);
    try{localStorage.setItem(LS_DESIGNS,JSON.stringify(updated));}catch(e){}
    // Sincronizar a Supabase en background
    const token=localStorage.getItem("token");
    if(token){
      fetch("http://localhost:3001/api/save-design",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body:JSON.stringify({name:design.name,layout:{els:design.els,ct:design.ct,navCfg:design.navCfg,hdrCfg:design.hdrCfg,canvasSizeId:design.canvasSizeId}}),
      }).catch(()=>{});
    }
  };

  const loadDesign=(d)=>{
    suppressResize.current=true;
    const s=CANVAS_SIZES.find(x=>x.id===d.canvasSizeId);if(s)setCanvasSize(s);
    if(d.canvasSizeId==="custom"&&d.customW&&d.customH){
      setCustomW(d.customW);setCustomH(d.customH);setDraftW(d.customW);setDraftH(d.customH);
    }
    setCt({...CANVAS_DEFAULT,...d.ct});
    const loadedNav=d.navCfg||NAV_DEFAULT;
    setNavCfg(loadedNav);
    // Evita que el sync-effect remapee un diseño ya posicionado correctamente
    prevNavLayout.current={position:loadedNav.position||NAV_DEFAULT.position,width:loadedNav.width||NAV_DEFAULT.width};
    setHdrCfg(d.hdrCfg||{show:false,title:"My Report",subtitle:"",height:58,bgColor:""});
    setEls(d.els.map(e=>({...e})));pushHistory(d.els);
    setMobileEls(d.mobileEls||null);
    const loadIds=d.els.map(e=>e.id).filter(id=>typeof id==='number'&&isFinite(id)&&id>0);
    setNextId(Math.max(...loadIds,49)+1);
    setViewMode("desktop");setSel(null);setVersionsModal(false);
    setMsgs(m=>[...m,{role:"ai",text:`📂 Diseño "${d.name}" cargado (${d.count||d.els?.length||"?"} elementos).`}]);
  };

  const deleteDesign=async(id)=>{
    const updated=savedDesigns.filter(d=>d.id!==id);
    setSavedDesigns(updated);
    try{localStorage.setItem(LS_DESIGNS,JSON.stringify(updated));}catch(e){}
  };

  const fetchCloudDesigns=async()=>{
    const token=localStorage.getItem("token");
    if(!token)return null;
    try{
      const r=await fetch("http://localhost:3001/api/user-designs",{
        headers:{"Authorization":`Bearer ${token}`},
      });
      if(!r.ok)return null;
      const data=await r.json();
      return(data.designs||[]).map((d,i)=>({
        id:"cloud_"+i+"_"+Date.now(),
        name:d.layout?.name||`Diseño nube ${i+1}`,
        date:new Date(d.created_at).toLocaleDateString("es"),
        els:d.layout?.els||[],
        ct:d.layout?.ct||{},
        navCfg:d.layout?.navCfg||NAV_DEFAULT,
        hdrCfg:d.layout?.hdrCfg||{show:false,title:"",subtitle:"",height:58,bgColor:""},
        canvasSizeId:d.layout?.canvasSizeId||"960x580",
        count:(d.layout?.els||[]).length,
        source:"cloud",
      }));
    }catch(e){return null;}
  };

  const[tab,setTab]=useState("elements");
  const[panelW,setPanelW]=useState(170); // ancho del panel izquierdo, redimensionable
  const[leftOpen,setLeftOpen]=useState(true); // mostrar/ocultar panel izquierdo
  const[aiW,setAiW]=useState(292); // ancho del panel derecho IA, redimensionable
  const[navBuilderTab,setNavBuilderTab]=useState("config"); // config|preview|code
  const[atts,setAtts]=useState([]);
  const[auditResult,setAuditResult]=useState(null); // resultado del último audit
  const[dragStatus,setDragStatus]=useState(null);

  const canvasRef=useRef(null);
  const chatEndRef=useRef(null);
  const fileRef=useRef(null);
  const imgFileRef=useRef(null); // solo imágenes — para importar capturas de dashboard
  const selEl=els.find(e=>e.id===sel);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  // ── DETECTOR DE CAMBIO DE TAMAÑO DE CANVAS ──
  useEffect(()=>{
    const{w:ow,h:oh}=prevSize.current;
    if((ow!==CW||oh!==CH)&&els.length>0){
      // Si el cambio fue programático (botón móvil), no mostrar el banner
      if(suppressResize.current){
        suppressResize.current=false;
      }else{
        const overflows=els.some(e=>e.x+e.w>CW||e.y+e.h>CH);
        if(overflows||ow!==CW||oh!==CH){
          setResizePrompt({oldW:ow,oldH:oh,hasOverflow:overflows});
        }
      }
    }
    prevSize.current={w:CW,h:CH};
  },[CW,CH]);

  // Escala los elementos de un tamaño a otro, anclando el contenido al header (sin huecos)
  const scaleElementsTo=(oldW,oldH,newW,newH)=>{
    setEls(a=>{
      const header=a.find(e=>e.type==="header");
      const headerH=header?header.h:0;
      const oldHeaderBottom=header?(header.y+header.h):0;
      const navLeft=a.find(e=>e.type==="nav"&&e.h>e.w);
      const navRight=navLeft&&navLeft.x>oldW/2;
      const navW=navLeft?navLeft.w:0;
      const rx=newW/oldW, ry=newH/oldH;
      const n=a.map(e=>{
        if(e.type==="header")return{...e,x:0,y:0,w:newW,h:e.h};
        if(e.type==="nav"&&e.h>e.w){const navX=navRight?newW-e.w:0;return{...e,x:navX,y:headerH,w:e.w,h:newH-headerH};}
        if(e.type==="nav")return{...e,x:0,y:headerH,w:newW,h:e.h};
        const oldContentTop=oldHeaderBottom,newContentTop=headerH;
        const oldContentH=oldH-oldContentTop,newContentH=newH-newContentTop;
        const cry=oldContentH>0?newContentH/oldContentH:ry;
        const newY=Math.round(newContentTop+(e.y-oldContentTop)*cry);
        const oldLeft=navLeft&&!navRight?navW:0,newLeft=navLeft&&!navRight?navW:0;
        const oldContentW=oldW-oldLeft-(navRight?navW:0),newContentW=newW-newLeft-(navRight?navW:0);
        const crx=oldContentW>0?newContentW/oldContentW:rx;
        const newX=Math.round(newLeft+(e.x-oldLeft)*crx);
        return{...e,x:newX,y:newY,w:Math.max(MIN_W,Math.round(e.w*crx)),h:Math.max(MIN_H,Math.round(e.h*cry))};
      });
      pushHistory(n);return n;
    });
  };

  // Escala todos los elementos proporcionalmente al nuevo tamaño (usado por el banner)
  const scaleAllElements=()=>{
    if(!resizePrompt)return;
    scaleElementsTo(resizePrompt.oldW,resizePrompt.oldH,CW,CH);
    setResizePrompt(null);
  };
  // Solo ajusta (clamp) los elementos que se desbordan
  const clampOverflowElements=()=>{
    setEls(a=>{
      const n=a.map(e=>{
        let w=Math.min(e.w,CW), h=Math.min(e.h,CH);
        let x=Math.max(0,Math.min(e.x,CW-w));
        let y=Math.max(0,Math.min(e.y,CH-h));
        return{...e,x,y,w,h};
      });
      pushHistory(n);return n;
    });
    setResizePrompt(null);
  };

  // Aplica el tamaño personalizado (una sola vez, con validación de límites)
  const applyCustomSize=()=>{
    const w=Math.max(200,Math.min(4000,draftW||1280));
    const h=Math.max(200,Math.min(4000,draftH||720));
    const curW=CW, curH=CH;
    setDraftW(w);setDraftH(h);
    // Escalar automáticamente los elementos al nuevo tamaño (sin banner)
    if(els.length>0&&(w!==curW||h!==curH)){
      suppressResize.current=true;
      scaleElementsTo(curW,curH,w,h);
    }
    setCustomW(w);setCustomH(h);
  };

  // ── HISTORY — limitado a 50 entradas para evitar memory leak ──
  const HISTORY_LIMIT=50;
  const pushHistory=useCallback(newEls=>{
    setHistory(h=>{
      const trimmed=h.slice(0,histIdxRef.current+1);
      trimmed.push([...newEls]);
      return trimmed.length>HISTORY_LIMIT?trimmed.slice(trimmed.length-HISTORY_LIMIT):trimmed;
    });
    setHistIdx(i=>{const next=Math.min(i+1,HISTORY_LIMIT-1);histIdxRef.current=next;return next;});
  },[]);
  const undo=useCallback(()=>{if(histIdx>0){const i=histIdx-1;histIdxRef.current=i;setHistIdx(i);setEls([...history[i]]);};},[histIdx,history]);
  const redo=useCallback(()=>{if(histIdx<history.length-1){const i=histIdx+1;histIdxRef.current=i;setHistIdx(i);setEls([...history[i]]);};},[histIdx,history]);

  // ── KEYBOARD ──
  useEffect(()=>{
    const kd=e=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
      if(e.key==="Delete"||e.key==="Backspace"){if(sel){setEls(a=>{const n=a.filter(x=>x.id!==sel);pushHistory(n);return n;});setSel(null);}}
      if(e.key==="Escape")setSel(null);
      if((e.metaKey||e.ctrlKey)&&e.key==="z"){e.preventDefault();undo();}
      if((e.metaKey||e.ctrlKey)&&(e.key==="y"||(e.shiftKey&&e.key==="Z"))){e.preventDefault();redo();}
      if(sel&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
        e.preventDefault();
        const step=e.shiftKey?8:1;
        const d={ArrowLeft:{x:-step},ArrowRight:{x:step},ArrowUp:{y:-step},ArrowDown:{y:step}};
        setEls(a=>a.map(el=>{
          if(el.id!==sel)return el;
          const patch=d[e.key];
          const nx=patch.x!==undefined?Math.max(0,Math.min(CW-el.w,el.x+patch.x)):el.x;
          const ny=patch.y!==undefined?Math.max(0,Math.min(CH-el.h,el.y+patch.y)):el.y;
          return{...el,x:nx,y:ny};
        }));
      }
    };
    window.addEventListener("keydown",kd);
    return()=>window.removeEventListener("keydown",kd);
  },[sel,undo,redo,pushHistory,CW,CH]);

  // ── UPDATE / COMMIT ──
  const updateEl=useCallback((id,patch)=>{
    setEls(a=>a.map(e=>e.id===id?{...e,...patch}:e));
    setDragStatus(s=>{const base=s||{};return{...base,...patch};});
  },[]);
  const commitEl=useCallback(()=>{
    setDragStatus(null);
    setEls(curr=>{pushHistory([...curr]);return curr;});
  },[pushHistory]);

  // ── DROP ──
  const handleDrop=e=>{
    const type=e.dataTransfer.getData("elementType");if(!type)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const rx=(e.clientX-rect.left)/zoom,ry=(e.clientY-rect.top)/zoom;
    const[dw,dh]=DEF_SIZE[type]||[160,100];
    // Tamaño clampado al canvas
    const w=Math.min(dw,CW), h=Math.min(dh,CH);
    let x=snapGrid?snap(Math.round(rx-w/2)):Math.round(rx-w/2);
    let y=snapGrid?snap(Math.round(ry-h/2)):Math.round(ry-h/2);
    // Posición clampada: el elemento queda completo dentro del canvas
    x=Math.max(0,Math.min(CW-w,x));
    y=Math.max(0,Math.min(CH-h,y));
    const info=PALETTE.find(p=>p.type===type);
    const id=nextId;
    const newEl={id,type,x,y,w,h,label:info?.label||type};
    setEls(a=>{const n=[...a,newEl];pushHistory(n);return n;});
    setNextId(n=>n+1);setSel(id);
  };

  // ── FILES ──
  const handleFiles=async files=>{
    const r=[];
    const errs=[];
    for(const f of files){
      try{r.push(await readFile(f));}
      catch(e){errs.push(e.message||`Error leyendo ${f.name}`);}
    }
    if(errs.length){
      setMsgs(m=>[...m,{role:"ai",text:`⚠️ ${errs.join('\n')}`}]);
    }
    setAtts(a=>[...a,...r]);
    if(!r.length)return;
    const descs=r.map(x=>{
      if(x.meta){
        const{rows,numCols,catCols}=x.meta;
        const m=numCols.slice(0,3).join(', ')||'—';
        const c=catCols.slice(0,3).join(', ')||'—';
        return `📊 ${x.name} — ${rows} filas\n   Métricas: ${m}\n   Dimensiones: ${c}`;
      }
      return x.type==='image'?`🖼 ${x.name} (imagen lista para analizar)`:`📄 ${x.name}`;
    });
    setMsgs(m=>[...m,{role:"ai",text:`${descs.join('\n')}\n\nEscribe qué dashboard quieres — usaré las columnas reales para los títulos y métricas.`}]);
  };
  const handlePaste=e=>{
    const imgs=[...e.clipboardData?.items||[]].filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);
    if(imgs.length)handleFiles(imgs);
  };

  // ── ENVIAR AL AI ──
  const sendMsg=async(opts={})=>{
    // opts.prompt = texto técnico para la IA; opts.visible = lo que se muestra como mensaje del usuario
    const useOverride=opts&&typeof opts==="object"&&opts.prompt;
    if(!useOverride&&(!input.trim()&&atts.length===0))return;
    if(loading)return;
    const text=useOverride?opts.prompt:input.trim();
    const visibleText=useOverride?(opts.visible||opts.prompt):text;
    if(!useOverride)setInput("");
    const userContent=[];
    const hasTabular=atts.some(a=>a.type==="text"&&a.meta);
    atts.forEach(a=>{
      if(a.type==="image")userContent.push({type:"image",source:{type:"base64",media_type:a.mediaType,data:a.base64}});
      else userContent.push({type:"text",text:`[DATOS DEL ARCHIVO: ${a.name}]\n${a.content?.slice(0,5000)||""}`});
    });
    if(hasTabular)userContent.push({type:"text",text:`INSTRUCCIÓN: Usa los nombres de columnas del archivo como labels de los elementos del dashboard. Las columnas numéricas → KPIs y gráficos. Las columnas categóricas → slicers y dimensiones de agrupación. Deriva el título del reporte del nombre del archivo o dominio de los datos.`});
    if(text)userContent.push({type:"text",text});
    setMsgs(m=>[...m,{role:"user",text:[atts.map(a=>`📎 ${a.name}`).join(" "),visibleText].filter(Boolean).join("\n"),atts:[...atts]}]);
    setAtts([]);setLoading(true);
    try{
    const hist=msgs.slice(-8).map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
    const curState={ct,elements:els};
    const{text:aiText,layout,audit}=await callAI([...hist,{role:"user",content:userContent.length===1&&userContent[0].type==="text"?userContent[0].text:userContent}],CW,CH,curState);

    // ── Resultado de auditoría ────────────────────────────────
    if(audit){
      setAuditResult(audit);
      setMsgs(m=>[...m,{role:"ai",text:aiText||"Auditoría completada — revisa el panel de resultados."}]);
      return;
    }
    if(layout){
      // Solo aplica canvasTheme si la IA lo envió explícitamente (no null)
      if(layout.canvasTheme&&typeof layout.canvasTheme==="object"&&Object.keys(layout.canvasTheme).length>0){
        setCt(prev=>({...prev,...layout.canvasTheme}));
      }
      if(layout.elements?.length){
        const maxX=Math.max(...layout.elements.map(e=>(e.x||0)+(e.w||0)));
        const maxY=Math.max(...layout.elements.map(e=>(e.y||0)+(e.h||0)));
        // Es vertical si: estamos en modo móvil, o el layout es claramente vertical
        const isVerticalLayout=viewMode==="mobile"||maxY>maxX||maxY>900||CH>CW;
        const targetW=isVerticalLayout?900:CW;
        const targetH=isVerticalLayout?1600:CH;

        let newEls=layout.elements.map(e=>{
          let w=Math.min(e.w||160,targetW), h=Math.min(e.h||90,targetH);
          let x=Math.max(0,Math.min(e.x||0,targetW-w));
          let y=Math.max(0,Math.min(e.y||0,targetH-h));
          if(x+w>targetW)w=targetW-x;
          if(y+h>targetH)h=targetH-y;
          return{...e,x,y,w,h};
        });
        if(isVerticalLayout){
          newEls=forceStackVertical(newEls,targetW,targetH);
          const mh=mobileCanvasHeight(newEls);
          setMobileH(mh);
          if(CH<=CW){suppressResize.current=true;const v=CANVAS_SIZES.find(s=>s.id==="900x1600");if(v)setCanvasSize(v);}
          // Guardar como diseño móvil
          setMobileEls(newEls.map(e=>({...e})));
          if(viewMode!=="mobile")setViewMode("mobile");
        }
        setEls(newEls);pushHistory(newEls);
        const validIds=layout.elements.map(e=>e.id).filter(id=>typeof id==="number"&&isFinite(id)&&id>0);
        setNextId(Math.max(...(validIds.length?validIds:[0]),nextId,49)+1);setSel(null);
      }
      if(layout.header)setHdrCfg(h=>({...h,...layout.header}));
      if(layout.navConfig)setNavCfg(n=>({...n,...layout.navConfig,
        colors:{...NAV_DEFAULT.colors,...(n.colors||{}),...(layout.navConfig.colors||{})},
        pages:layout.navConfig.pages||n.pages||NAV_DEFAULT.pages}));
    }
    setMsgs(m=>[...m,{role:"ai",text:aiText||"Diseño aplicado en el canvas."}]);
    }finally{setLoading(false);}
  };

  // ── PRESETS ──
  // ── ALTERNAR VISTA NORMAL / MÓVIL ──
  const switchToMobile=()=>{
    if(viewMode==="mobile")return;
    desktopBackup.current=els.map(e=>({...e}));
    desktopSizeBackup.current={size:canvasSize,cw:CW,ch:CH,customW,customH};
    suppressResize.current=true;
    const vSize=CANVAS_SIZES.find(s=>s.id==="900x1600");
    if(vSize)setCanvasSize(vSize);
    setViewMode("mobile");
    setSel(null);
    if(mobileEls){
      // Calcular altura según el contenido móvil existente
      const maxBottom=Math.max(1600,...mobileEls.map(e=>(e.y||0)+(e.h||0)+20));
      setMobileH(Math.ceil(maxBottom/100)*100);
      setEls(mobileEls.map(e=>({...e})));
      setMsgs(m=>[...m,{role:"ai",text:"📱 Vista móvil. Puedes editarla o pedirme cambios. Usa 🖥️ para volver a la normal."}]);
    }else{
      const generated=forceStackVertical(els.map(e=>({...e})),900,1600);
      setMobileH(mobileCanvasHeight(generated));
      setEls(generated);
      setMobileEls(generated.map(e=>({...e})));
      pushHistory(generated);
      const hNote=generated.neededHeight>1600?` (canvas extendido a ${mobileCanvasHeight(generated)}px de alto para que quepa todo)`:"";
      setMsgs(m=>[...m,{role:"ai",text:`📱 Generé la vista móvil apilando los elementos verticalmente${hNote}. Edítala o pídeme ajustes. El botón 🖥️ regresa a la vista normal.`}]);
    }
  };
  const switchToDesktop=()=>{
    if(viewMode==="desktop")return;
    setMobileEls(els.map(e=>({...e})));
    suppressResize.current=true;
    const bk=desktopSizeBackup.current;
    if(bk){
      // Restaurar tamaño exacto (incluye custom)
      if(bk.size?.id==="custom"){
        setCustomW(bk.customW);setCustomH(bk.customH);
        setDraftW(bk.customW);setDraftH(bk.customH);
      }
      if(bk.size)setCanvasSize(bk.size);
    }
    setViewMode("desktop");
    setSel(null);
    if(desktopBackup.current)setEls(desktopBackup.current.map(e=>({...e})));
    setMsgs(m=>[...m,{role:"ai",text:"🖥️ Vista normal. Tu diseño móvil quedó guardado — vuelve con 📱 cuando quieras."}]);
  };
  const regenerateMobile=()=>{
    const source=desktopBackup.current||els;
    const generated=forceStackVertical(source.map(e=>({...e})),900,1600);
    setMobileH(mobileCanvasHeight(generated));
    setEls(generated);setMobileEls(generated.map(e=>({...e})));pushHistory(generated);
    setMsgs(m=>[...m,{role:"ai",text:"🔄 Vista móvil regenerada desde el diseño normal."}]);
  };

  const loadPreset=key=>{
    const p=PRESETS[key];if(!p)return;
    setCt({...CANVAS_DEFAULT,...p.ct});
    // Merge con NAV_DEFAULT para garantizar pages, colors y demás props del panel
    setNavCfg({...NAV_DEFAULT,...p.nav,
      colors:{...NAV_DEFAULT.colors,...(p.nav.colors||{})},
      pages:p.nav.pages||NAV_DEFAULT.pages.map(pg=>({...pg}))});
    setHdrCfg({...p.header});
    // Las plantillas están diseñadas para 960×580. Si el canvas actual es distinto,
    // escalar los elementos anclando el contenido al header (sin huecos).
    const BASE_W=960, BASE_H=580;
    let newEls=p.els.map(e=>({...e}));
    if(CW!==BASE_W||CH!==BASE_H){
      const header=newEls.find(e=>e.type==="header");
      const headerH=header?header.h:0;
      const oldHeaderBottom=header?(header.y+header.h):0;
      const navLeft=newEls.find(e=>e.type==="nav"&&e.h>e.w);
      const navRight=navLeft&&navLeft.x>BASE_W/2;
      const navW=navLeft?navLeft.w:0;
      newEls=newEls.map(e=>{
        if(e.type==="header")return{...e,x:0,y:0,w:CW,h:e.h};
        if(e.type==="nav"&&e.h>e.w){
          const navX=navRight?CW-e.w:0;
          return{...e,x:navX,y:headerH,w:e.w,h:CH-headerH};
        }
        if(e.type==="nav")return{...e,x:0,y:headerH,w:CW,h:e.h};
        const oldContentH=BASE_H-oldHeaderBottom, newContentH=CH-headerH;
        const cry=oldContentH>0?newContentH/oldContentH:1;
        const newY=Math.round(headerH+(e.y-oldHeaderBottom)*cry);
        const oldLeft=navLeft&&!navRight?navW:0, newLeft=navLeft&&!navRight?navW:0;
        const oldContentW=BASE_W-oldLeft-(navRight?navW:0), newContentW=CW-newLeft-(navRight?navW:0);
        const crx=oldContentW>0?newContentW/oldContentW:1;
        const newX=Math.round(newLeft+(e.x-oldLeft)*crx);
        return{...e,x:newX,y:newY,w:Math.max(MIN_W,Math.round(e.w*crx)),h:Math.max(MIN_H,Math.round(e.h*cry))};
      });
    }
    // Evitar que el sync-effect remapee elementos ya posicionados para el nav de la plantilla
    prevNavLayout.current={position:p.nav.position||NAV_DEFAULT.position,width:p.nav.width||NAV_DEFAULT.width};
    setEls(newEls);pushHistory(newEls);setSel(null);
    const sizeNote=(CW!==BASE_W||CH!==BASE_H)?` (adaptada a ${CW}×${CH})`:"";
    setMsgs(m=>[...m,{role:"ai",text:`✅ Plantilla "${p.header.title}" cargada — ${p.els.length} elementos${sizeNote}. Pídeme ajustes o cámbiale los colores cuando quieras.`}]);
  };

  // ── EXPORT ── (las descargas se manejan en ExportModal)

  // ── STYLE SHORTCUTS (todos usan A = app theme) ──
  const B=(x={})=>({padding:"5px 10px",background:A.surface,border:`1px solid ${A.border2}`,color:A.textMuted,borderRadius:6,cursor:"pointer",fontSize:9,fontFamily:"'Segoe UI',sans-serif",...x});
  const PB=(x={})=>({padding:"5px 13px",background:A.accent,border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontSize:9,fontWeight:700,...x});
  const IS={background:A.surface,border:`1px solid ${A.border2}`,color:A.text,borderRadius:5,padding:"4px 8px",fontSize:9,fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box"};
  const LS={fontSize:8,color:A.textMuted,fontFamily:"monospace",letterSpacing:0.4,marginBottom:3,display:"block",textTransform:"uppercase"};

  return !user ? <LoginScreen onLogin={handleLogin}/> : (
    <div style={{width:"100vw",height:"100vh",background:A.bg,display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',system-ui,sans-serif",color:A.text,position:"relative"}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ══ TOPBAR ══════════════════════════════════════════════════ */}
      <div style={{minHeight:54,background:A.topbar,borderBottom:`1px solid ${A.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:6,zIndex:1000,flexShrink:0,boxShadow:`0 2px 20px ${rgba(A.accent,0.08)},0 1px 0 ${A.border}`,flexWrap:"wrap",rowGap:4}}>

        {/* ─── Logo ───────────────────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:4,flexShrink:0,padding:"2px 0"}}>
          <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${A.accent} 0%,${adjHex(A.accent,0.65)} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:900,flexShrink:0,boxShadow:`0 4px 16px ${rgba(A.accent,0.5)},0 0 0 1px ${rgba(A.accent,0.2)}`}}>⬡</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:A.text,lineHeight:1.1,letterSpacing:-0.4}}>PBI Designer</div>
            <div style={{fontSize:7,color:A.textLight,fontFamily:"monospace",letterSpacing:1.2,marginTop:2,textTransform:"uppercase"}}>v2.0 · AI-Powered</div>
          </div>
        </div>

        <div style={{width:1,height:28,background:A.border,flexShrink:0,margin:"0 2px"}}/>

        {/* ─── Tema UI ────────────────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",gap:3,background:A.surface,borderRadius:8,padding:"3px 7px",border:`1px solid ${A.border}`,flexShrink:0}}>
          <span style={{fontSize:7,color:A.textMuted,fontFamily:"monospace",letterSpacing:0.8,textTransform:"uppercase",marginRight:2}}>UI</span>
          {Object.values(APP_THEMES).map(t=>(
            <button key={t.id} onClick={()=>setAppThemeId(t.id)} title={t.name}
              style={{width:23,height:23,borderRadius:6,background:appThemeId===t.id?A.accentBg:t.surface,border:`2px solid ${appThemeId===t.id?A.accent:A.border}`,cursor:"pointer",fontSize:11,transition:"all 0.15s",transform:appThemeId===t.id?"scale(1.18)":"scale(1)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:appThemeId===t.id?`0 2px 8px ${rgba(A.accent,0.3)}`:"none"}}>
              {t.icon}
            </button>
          ))}
        </div>

        <div style={{width:1,height:28,background:A.border,flexShrink:0,margin:"0 2px"}}/>

        {/* ─── Zoom ───────────────────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",gap:1,background:A.surface,borderRadius:8,padding:"2px 3px",border:`1px solid ${A.border}`,flexShrink:0}}>
          <button aria-label="Reducir zoom" onClick={()=>setZoom(z=>+(Math.max(0.3,z-0.1)).toFixed(1))} style={{...B({width:24,height:24,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}),border:"none",borderRadius:6}}>−</button>
          <span style={{fontSize:9,color:A.textMuted,fontFamily:"monospace",width:38,textAlign:"center",fontWeight:600}}>{Math.round(zoom*100)}%</span>
          <button aria-label="Aumentar zoom" onClick={()=>setZoom(z=>+(Math.min(2,z+0.1)).toFixed(1))} style={{...B({width:24,height:24,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}),border:"none",borderRadius:6}}>+</button>
          <div style={{width:1,height:14,background:A.border,margin:"0 2px"}}/>
          <button onClick={()=>{
            const vw=window.innerWidth-panelW-(aiOpen?aiW:0)-80;
            const vh=window.innerHeight-54-22-(resizePrompt?40:0)-80;
            setZoom(+Math.max(0.1,Math.min(vw/CW,vh/(CH+26),1)).toFixed(2));
          }} style={{...B({fontSize:8,padding:"0 7px",height:24}),border:"none",borderRadius:6,fontWeight:700}}>FIT</button>
        </div>

        <div style={{width:1,height:28,background:A.border,flexShrink:0,margin:"0 2px"}}/>

        {/* ─── Vista Normal / Móvil ───────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",background:A.surface,borderRadius:8,padding:2,gap:1,border:`1px solid ${A.border}`,flexShrink:0}}>
          <button onClick={switchToDesktop} title="Vista normal (escritorio)"
            style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:viewMode==="desktop"?700:500,
              background:viewMode==="desktop"?A.accent:"transparent",color:viewMode==="desktop"?"#fff":A.textMuted,
              display:"flex",alignItems:"center",gap:4,transition:"all 0.15s",whiteSpace:"nowrap",boxShadow:viewMode==="desktop"?`0 2px 8px ${rgba(A.accent,0.35)}`:"none"}}>
            🖥️ Normal
          </button>
          <button onClick={()=>{
              if(els.length===0&&!mobileEls){
                setMsgs(m=>[...m,{role:"ai",text:"Primero crea un diseño en la vista normal. Luego podrás generar su versión móvil. 📱"}]);
                return;
              }
              switchToMobile();
            }} title={mobileEls?"Ver diseño móvil":"Generar y ver diseño móvil"}
            style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:viewMode==="mobile"?700:500,
              background:viewMode==="mobile"?A.accent:"transparent",color:viewMode==="mobile"?"#fff":A.textMuted,
              display:"flex",alignItems:"center",gap:4,transition:"all 0.15s",whiteSpace:"nowrap",boxShadow:viewMode==="mobile"?`0 2px 8px ${rgba(A.accent,0.35)}`:"none"}}>
            📱 Móvil{mobileEls?" ✓":""}
          </button>
        </div>
        {viewMode==="mobile"&&(
          <button onClick={regenerateMobile} title="Regenerar vista móvil"
            style={{...B({fontSize:11,padding:"0 8px",height:26,flexShrink:0}),borderRadius:7}}>🔄</button>
        )}

        <div style={{width:1,height:28,background:A.border,flexShrink:0,margin:"0 2px"}}/>

        {/* ─── Canvas ─────────────────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <span style={{fontSize:7,color:A.textMuted,fontFamily:"monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Canvas</span>
          {viewMode==="mobile"?(
            <div title="En vista móvil el ancho es fijo (900px, estándar Power BI Mobile). La altura se ajusta al contenido."
              style={{display:"flex",alignItems:"center",gap:5,fontSize:8,fontFamily:"monospace",
                background:rgba(A.accent,0.08),color:A.accent,border:`1px solid ${rgba(A.accent,0.3)}`,
                borderRadius:7,padding:"3px 9px",fontWeight:700}}>
              🔒 900×{CH} · Móvil
            </div>
          ):(<>
          <select value={canvasSize.id}
            onChange={e=>{
              const s=CANVAS_SIZES.find(x=>x.id===e.target.value);
              if(!s)return;
              const curW=CW, curH=CH;
              if(s.id==="custom"){
                setCustomW(curW);setCustomH(curH);setDraftW(curW);setDraftH(curH);
                setCanvasSize(s);
                return;
              }
              const newW=s.w, newH=s.h;
              setCanvasSize(s);
            }}
            style={{fontSize:8,fontFamily:"monospace",background:A.surface,color:A.text,border:`1px solid ${A.border}`,borderRadius:7,padding:"3px 6px",cursor:"pointer"}}>
            {CANVAS_SIZES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select></>)}
          {viewMode!=="mobile"&&canvasSize.id==="custom"&&<>
            <div style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
              <div style={{position:"absolute",left:4,display:"flex",flexDirection:"column",alignItems:"center",pointerEvents:"none",lineHeight:1}}>
                <span style={{fontSize:9,fontWeight:800,color:A.accent,fontFamily:"monospace"}}>A</span>
                <span style={{fontSize:8,color:A.accent,marginTop:-1}}>↔</span>
              </div>
              <input type="number" value={draftW} onChange={e=>setDraftW(+e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")applyCustomSize();}}
                title="Ancho (px)" min={200} max={4000}
                style={{width:62,fontSize:8,fontFamily:"monospace",background:A.surface,color:A.text,border:`1px solid ${A.border}`,borderRadius:5,padding:"2px 4px 2px 20px",textAlign:"center"}}/>
            </div>
            <span style={{fontSize:8,color:A.textMuted}}>×</span>
            <div style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
              <div style={{position:"absolute",left:4,display:"flex",flexDirection:"row",alignItems:"center",gap:1,pointerEvents:"none",lineHeight:1}}>
                <span style={{fontSize:9,fontWeight:800,color:"#d97706",fontFamily:"monospace"}}>H</span>
                <span style={{fontSize:8,color:"#d97706"}}>↕</span>
              </div>
              <input type="number" value={draftH} onChange={e=>setDraftH(+e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")applyCustomSize();}}
                title="Alto (px)" min={200} max={4000}
                style={{width:62,fontSize:8,fontFamily:"monospace",background:A.surface,color:A.text,border:`1px solid ${A.border}`,borderRadius:5,padding:"2px 4px 2px 22px",textAlign:"center"}}/>
            </div>
            <button onClick={applyCustomSize}
              disabled={draftW===customW&&draftH===customH}
              style={{fontSize:8,fontWeight:700,padding:"3px 9px",borderRadius:6,border:"none",cursor:(draftW===customW&&draftH===customH)?"default":"pointer",
                background:(draftW===customW&&draftH===customH)?A.border:A.accent,
                color:(draftW===customW&&draftH===customH)?A.textLight:"#fff"}}>
              Aplicar
            </button>
          </>}
          <span style={{fontSize:7,color:A.textLight,fontFamily:"monospace",background:A.surface,border:`1px solid ${A.border}`,padding:"2px 6px",borderRadius:5}}>{CW}×{CH}</span>
        </div>

        <div style={{width:1,height:28,background:A.border,flexShrink:0,margin:"0 2px"}}/>

        {/* ─── Grid / Snap ────────────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",gap:2,background:A.surface,borderRadius:8,padding:"2px 4px",border:`1px solid ${A.border}`,flexShrink:0}}>
          {[["⊡",showGrid,"Grid",()=>setShowGrid(x=>!x)],["⊞",snapGrid,"Snap",()=>setSnapGrid(x=>!x)]].map(([ic,on,tip,fn])=>(
            <button key={tip} onClick={fn} title={`${tip} ${on?"ON":"OFF"}`}
              style={{width:26,height:24,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,border:"none",borderRadius:6,cursor:"pointer",transition:"all 0.15s",background:on?A.accentBg:"transparent",color:on?A.accent:A.textLight,boxShadow:on?`0 1px 6px ${rgba(A.accent,0.25)}`:"none"}}>{ic}</button>
          ))}
        </div>

        <div style={{width:1,height:28,background:A.border,flexShrink:0,margin:"0 2px"}}/>

        {/* ─── Undo / Redo + info ─────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
          <button onClick={undo} disabled={histIdx===0} title="Deshacer (Ctrl+Z)" aria-label="Deshacer"
            style={{...B({width:26,height:24,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,borderRadius:7}),opacity:histIdx===0?0.28:1}}>↩</button>
          <button onClick={redo} disabled={histIdx>=history.length-1} title="Rehacer (Ctrl+Y)" aria-label="Rehacer"
            style={{...B({width:26,height:24,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,borderRadius:7}),opacity:histIdx>=history.length-1?0.28:1}}>↪</button>
          <span style={{fontSize:8,color:A.textLight,fontFamily:"monospace",background:A.surface,border:`1px solid ${A.border}`,padding:"2px 7px",borderRadius:5,marginLeft:2,flexShrink:0}}>{els.length} elem</span>
        </div>

        {dragStatus&&<span style={{fontSize:8,color:A.accent,background:A.accentBg,padding:"2px 8px",borderRadius:5,fontFamily:"monospace",border:`1px solid ${rgba(A.accent,0.2)}`,flexShrink:0}}>
          x:{dragStatus.x??""} y:{dragStatus.y??""}{dragStatus.w?` · ${dragStatus.w}×${dragStatus.h}`:""}
        </span>}

        {/* ─── Acciones principales ───────────────────────────────── */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          {sel&&<button onClick={()=>{setEls(a=>{const n=a.filter(e=>e.id!==sel);pushHistory(n);return n;});setSel(null);}}
            style={{padding:"5px 10px",borderRadius:7,background:rgba(A.danger,0.07),border:`1px solid ${rgba(A.danger,0.3)}`,color:A.danger,fontSize:9,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=rgba(A.danger,0.14);}}
            onMouseLeave={e=>{e.currentTarget.style.background=rgba(A.danger,0.07);}}>🗑 Eliminar</button>}

          <button onClick={()=>{
            if(els.length===0){setMsgs(m=>[...m,{role:"ai",text:"El lienzo ya está vacío. Describe tu nuevo dashboard. 🆕"}]);return;}
            setConfirmNew(true);
          }} title="Nuevo lienzo"
            style={{padding:"6px 13px",borderRadius:7,background:A.accentBg,border:`1px solid ${A.accentLight}`,color:A.accent,fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=rgba(A.accent,0.15);e.currentTarget.style.borderColor=A.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background=A.accentBg;e.currentTarget.style.borderColor=A.accentLight;}}>
            📊 Nuevo
          </button>

          <button onClick={()=>setVersionsModal(true)} title="Diseños guardados"
            style={{...B({padding:"6px 12px",fontSize:9,display:"flex",alignItems:"center",gap:4,flexShrink:0,borderRadius:7}),transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.color=A.accent;e.currentTarget.style.background=A.accentBg;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border2;e.currentTarget.style.color=A.textMuted;e.currentTarget.style.background=A.surface;}}>
            📂 Diseños
          </button>

          <button onClick={()=>setThemeModal(true)} title="Temas de marca"
            style={{...B({padding:"6px 12px",fontSize:9,display:"flex",alignItems:"center",gap:4,flexShrink:0,borderRadius:7}),transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.color=A.accent;e.currentTarget.style.background=A.accentBg;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border2;e.currentTarget.style.color=A.textMuted;e.currentTarget.style.background=A.surface;}}>
            🎨 Temas
          </button>

          <button onClick={()=>setExportModal(true)}
            style={{padding:"6px 15px",borderRadius:7,background:`linear-gradient(135deg,${A.accent} 0%,${adjHex(A.accent,0.72)} 100%)`,border:"none",color:"#fff",fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0,boxShadow:`0 3px 14px ${rgba(A.accent,0.42)}`,transition:"all 0.2s",letterSpacing:0.2}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 5px 22px ${rgba(A.accent,0.6)}`;e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 3px 14px ${rgba(A.accent,0.42)}`;e.currentTarget.style.transform="translateY(0)";}}>
            ↗ Exportar PBI
          </button>

          <button onClick={()=>setAiOpen(o=>!o)}
            style={{padding:"6px 12px",borderRadius:7,background:aiOpen?A.accentBg:"transparent",border:`1px solid ${aiOpen?A.accentLight:A.border2}`,color:aiOpen?A.accent:A.textMuted,fontSize:9,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.color=A.accent;e.currentTarget.style.background=A.accentBg;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=aiOpen?A.accentLight:A.border2;e.currentTarget.style.color=aiOpen?A.accent:A.textMuted;e.currentTarget.style.background=aiOpen?A.accentBg:"transparent";}}>
            {aiOpen?"◀ Ocultar IA":"▶ Chat IA"}
          </button>

          <div style={{width:1,height:28,background:A.border,flexShrink:0,margin:"0 2px"}}/>

          {/* ─── Usuario (avatar + nombre + créditos) ── */}
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 12px 4px 5px",background:rgba(A.accent,0.06),border:`1px solid ${rgba(A.accent,0.16)}`,borderRadius:22,flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=rgba(A.accent,0.1);e.currentTarget.style.borderColor=rgba(A.accent,0.28);}}
            onMouseLeave={e=>{e.currentTarget.style.background=rgba(A.accent,0.06);e.currentTarget.style.borderColor=rgba(A.accent,0.16);}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${A.accent} 0%,${adjHex(A.accent,0.65)} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0,boxShadow:`0 2px 10px ${rgba(A.accent,0.4)}`}}>
              {(user?.email?.[0]||"U").toUpperCase()}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              <span style={{fontSize:9,color:A.text,fontWeight:600,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
                {user?.email?.split('@')[0]||"usuario"}
              </span>
              {user?.credits!=null&&(
                <span style={{fontSize:7,color:A.accent,fontFamily:"monospace",fontWeight:700,lineHeight:1}}>
                  {Number(user.credits).toLocaleString()} cr
                </span>
              )}
            </div>
          </div>

          <button onClick={handleLogout} title="Cerrar sesión"
            style={{padding:"6px 11px",borderRadius:7,background:"transparent",border:`1px solid ${rgba(A.danger,0.28)}`,color:A.danger,fontSize:9,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=rgba(A.danger,0.1);e.currentTarget.style.borderColor=A.danger;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=rgba(A.danger,0.28);}}>
            ↩ Salir
          </button>
        </div>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════ */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minWidth:0,width:"100%"}}>

        {/* ── PANEL IZQUIERDO (redimensionable + colapsable) ── */}
        {leftOpen?(
        <div style={{width:panelW,background:A.sidebar,borderRight:`1px solid ${A.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:"relative"}}>
          {/* Drag handle para redimensionar */}
          <div
            onMouseDown={e=>{
              e.preventDefault();
              const sx=e.clientX, sw=panelW;
              const mv=ev=>setPanelW(Math.max(150,Math.min(340,sw+(ev.clientX-sx))));
              const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
              window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
            }}
            style={{position:"absolute",right:-3,top:0,bottom:0,width:6,cursor:"col-resize",zIndex:60}}
            onMouseEnter={e=>e.currentTarget.style.background=rgba(A.accent,0.25)}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          />
          <div style={{display:"flex",alignItems:"stretch",borderBottom:`1px solid ${A.border}`,flexShrink:0}}>
            {[["elements","⊞","Elementos"],["properties","⚙","Propiedades"],["presets","⬡","Plantillas"]].map(([t,ic,lbl])=>(
              <button key={t} onClick={()=>setTab(t)} title={lbl}
                style={{flex:1,padding:"7px 0",background:tab===t?A.accentBg:"transparent",border:"none",color:tab===t?A.accent:A.textMuted,fontSize:12,cursor:"pointer",borderBottom:tab===t?`2px solid ${A.accent}`:"2px solid transparent",transition:"all 0.15s"}}>{ic}</button>
            ))}
            {/* Divisor + botón ocultar panel (integrado, no flotante) */}
            <div style={{width:1,background:A.border,margin:"6px 0"}}/>
            <button onClick={()=>setLeftOpen(false)} title="Ocultar panel"
              style={{width:30,flexShrink:0,padding:0,background:"rgba(34,197,94,0.12)",border:"none",
                color:"#16a34a",fontSize:11,cursor:"pointer",borderBottom:"2px solid transparent",
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(34,197,94,0.22)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(34,197,94,0.12)";}}>◀</button>
          </div>

          {/* TAB: Elements */}
          {tab==="elements"&&(
            <div style={{flex:1,overflowY:"auto",padding:"7px 6px"}}>
              <div style={{fontSize:7,color:A.textLight,fontFamily:"monospace",letterSpacing:1,padding:"3px 6px 6px",textTransform:"uppercase"}}>Arrastra al canvas</div>
              {PALETTE.map(p=>(
                <div key={p.type} draggable onDragStart={e=>e.dataTransfer.setData("elementType",p.type)}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:5,background:A.bg,border:`1px solid ${A.border}`,cursor:"grab",marginBottom:3,transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=rgba(p.color,0.1);e.currentTarget.style.borderColor=rgba(p.color,0.4);}}
                  onMouseLeave={e=>{e.currentTarget.style.background=A.bg;e.currentTarget.style.borderColor=A.border;}}>
                  <span style={{fontSize:12,width:16,textAlign:"center",flexShrink:0}}>{p.icon}</span>
                  <span style={{fontSize:9,color:A.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</span>
                </div>
              ))}
              <div style={{padding:"8px 4px 2px",borderTop:`1px dashed ${A.border}`,marginTop:6}}>
                <div style={{fontSize:7,color:A.textLight,fontFamily:"monospace",letterSpacing:0.8,marginBottom:5,textTransform:"uppercase"}}>Shortcuts</div>
                {[["Del","Eliminar"],["Ctrl+Z","Deshacer"],["Ctrl+Y","Rehacer"],["↑↓←→","Mover 1px"],["⇧+↑↓","Mover 8px"],["Esc","Deseleccionar"]].map(([k,d])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:7,fontFamily:"monospace",color:A.accent,background:A.accentBg,padding:"1px 5px",borderRadius:3}}>{k}</span>
                    <span style={{fontSize:7,color:A.textMuted}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Properties */}
          {tab==="properties"&&(
            <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
              {!selEl
                ?(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",letterSpacing:1,padding:"3px 6px",background:A.accentBg,borderRadius:4,textAlign:"center",textTransform:"uppercase"}}>⬡ Canvas</div>
                    <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${A.border}`}}>
                      <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",marginBottom:6,fontWeight:700}}>FONDOS DE PÁGINA</div>
                      {[["Fondo del lienzo","canvas"],["Papel tapiz","wallpaper"]].map(([l,k])=>(
                        <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                          <input type="color" value={ct[k]||"#ffffff"} onChange={e=>setCt(c=>({...c,[k]:e.target.value,[k+"Gradient"]:null}))}
                            style={{width:24,height:20,padding:0,border:`1px solid ${A.border2}`,borderRadius:4,cursor:"pointer"}}/>
                          <span style={{fontSize:8,color:A.textMuted,flex:1}}>{l}</span>
                          <span style={{fontSize:7,fontFamily:"monospace",color:A.textLight}}>{ct[k]}</span>
                        </div>
                      ))}
                      {/* Editor de gradientes para el papel tapiz */}
                      <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",margin:"8px 0 5px",fontWeight:700}}>GRADIENTE (papel tapiz)</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginBottom:5}}>
                        {[
                          {n:"Ninguno",g:null},
                          {n:"Azul",g:`linear-gradient(135deg,${ct.accent},${adjHex(ct.accent,0.6)})`},
                          {n:"Suave",g:`linear-gradient(135deg,${ct.wallpaper||"#e8edf2"},${adjHex(ct.wallpaper||"#e8edf2",0.85)})`},
                          {n:"Oscuro",g:`linear-gradient(160deg,#1e293b,#0f172a)`},
                          {n:"Verde",g:`linear-gradient(135deg,#4d7c2f,#2d4a1a)`},
                          {n:"Atard.",g:`linear-gradient(135deg,#f59e0b,#dc2626)`},
                          {n:"Violeta",g:`linear-gradient(135deg,#7c3aed,#4c1d95)`},
                          {n:"Cian",g:`linear-gradient(135deg,#0891b2,#155e75)`},
                        ].map(opt=>(
                          <button key={opt.n} onClick={()=>setCt(c=>({...c,wallpaperGradient:opt.g}))}
                            title={opt.n}
                            style={{height:26,borderRadius:5,cursor:"pointer",
                              border:`1.5px solid ${ct.wallpaperGradient===opt.g?A.accent:A.border2}`,
                              background:opt.g||ct.wallpaper||"#e8edf2",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:6,color:opt.g?"#fff":A.textMuted,fontWeight:600}}>
                            {opt.g?"":"✕"}
                          </button>
                        ))}
                      </div>
                      <div style={{fontSize:7,color:A.textLight,lineHeight:1.6,marginTop:4,padding:"5px 7px",background:A.surface,borderRadius:4}}>
                        💡 El <b>lienzo</b> es la página; el <b>papel tapiz</b> el área alrededor. El gradiente se exporta como imagen SVG de fondo.
                      </div>
                    </div>
                    {/* Validador de accesibilidad WCAG */}
                    {(()=>{
                      const checks=[
                        {l:"Texto / lienzo",fg:ct.text,bg:ct.canvas},
                        {l:"Texto sec. / tarjeta",fg:ct.textSub,bg:ct.cardBg},
                        {l:"Acento / lienzo",fg:ct.accent,bg:ct.canvas},
                        {l:"Texto / header",fg:"#ffffff",bg:ct.headerBg||ct.accent},
                      ];
                      const evald=checks.map(c=>({...c,ratio:contrastRatio(c.fg,c.bg)}));
                      const fails=evald.filter(c=>c.ratio<4.5).length;
                      return(
                        <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${fails>0?"#fca5a5":"#86efac"}`}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                            <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",fontWeight:700}}>♿ ACCESIBILIDAD WCAG</div>
                            <span style={{fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:3,
                              background:fails>0?"#fef2f2":"#f0fdf4",color:fails>0?"#dc2626":"#059669"}}>
                              {fails>0?`${fails} alerta${fails>1?"s":""}`:"✓ AA"}
                            </span>
                          </div>
                          {evald.map((c,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                              <div style={{width:22,height:14,borderRadius:3,background:c.bg,border:`1px solid ${A.border2}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <span style={{fontSize:8,fontWeight:700,color:c.fg}}>A</span>
                              </div>
                              <span style={{fontSize:8,color:A.textMuted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.l}</span>
                              <span style={{fontSize:8,fontWeight:700,fontFamily:"monospace",
                                color:c.ratio>=4.5?"#059669":c.ratio>=3?"#d97706":"#dc2626"}}>
                                {c.ratio.toFixed(1)}:1 {c.ratio>=4.5?"✓":c.ratio>=3?"◐":"✕"}
                              </span>
                            </div>
                          ))}
                          <div style={{fontSize:7,color:A.textLight,lineHeight:1.6,marginTop:5,padding:"5px 7px",background:A.surface,borderRadius:4}}>
                            WCAG AA exige ≥4.5:1 para texto normal. ✓ cumple · ◐ solo texto grande · ✕ insuficiente.
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{fontSize:9,color:A.textLight,textAlign:"center",padding:"10px 8px",lineHeight:2}}>Selecciona un elemento<br/>para editar sus propiedades</div>
                  </div>
                )
                :(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",letterSpacing:1,padding:"3px 6px",background:A.accentBg,borderRadius:4,textAlign:"center",textTransform:"uppercase"}}>{selEl.type} #{selEl.id}</div>
                    {[["Label","label","text",selEl.label],["X px","x","number",selEl.x],["Y px","y","number",selEl.y],["Ancho","w","number",selEl.w],["Alto","h","number",selEl.h]].map(([l,f,t,v])=>(
                      <div key={f}>
                        <label style={LS}>{l}</label>
                        <input type={t} value={v}
                          onChange={e=>updateEl(selEl.id,{[f]:f==="label"?e.target.value:Math.max(f==="x"||f==="y"?0:MIN_W,parseInt(e.target.value)||0)})}
                          onBlur={commitEl} style={IS}/>
                      </div>
                    ))}
                    {selEl.type==="nav"&&(
                      <NavBuilderPanel
                        nav={navCfg} setNav={setNavCfg}
                        activeTab={navBuilderTab} setActiveTab={setNavBuilderTab}
                        A={A} IS={IS} LS={LS} ct={ct}/>
                    )}
                    {selEl.type==="header"&&(
                      <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${A.border}`}}>
                        <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",marginBottom:6}}>HEADER CONFIG</div>
                        {[["Título","title",hdrCfg.title],["Subtítulo","subtitle",hdrCfg.subtitle]].map(([l,f,v])=>(
                          <div key={f} style={{marginBottom:5}}>
                            <label style={LS}>{l}</label>
                            <input value={v} onChange={e=>setHdrCfg(h=>({...h,[f]:e.target.value}))} style={IS}/>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>{setEls(a=>{const n=a.filter(e=>e.id!==sel);pushHistory(n);return n;});setSel(null);}}
                      style={B({color:A.danger,borderColor:rgba(A.danger,0.3),background:rgba(A.danger,0.06),width:"100%",marginTop:4})}>🗑 Eliminar</button>
                  </div>
                )
              }
            </div>
          )}

          {/* TAB: Presets */}
          {tab==="presets"&&(
            <div style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
              <div style={{fontSize:7,color:A.textLight,fontFamily:"monospace",letterSpacing:1,padding:"3px 6px 7px",textTransform:"uppercase"}}>Plantillas genéricas</div>
              {[{k:"sales",i:"📊",l:"Ventas",s:"Azul · Nav izq"},{k:"finance",i:"💰",l:"Finanzas",s:"Morado · Oscuro"},{k:"hr",i:"👥",l:"RRHH",s:"Rosa · Nav der"},{k:"marketing",i:"📢",l:"Marketing",s:"Naranja · Nav top"}].map(p=>(
                <div key={p.k} onClick={()=>loadPreset(p.k)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px",borderRadius:6,background:A.bg,border:`1px solid ${A.border}`,cursor:"pointer",marginBottom:4,transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=A.accentBg;e.currentTarget.style.borderColor=A.accentLight;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=A.bg;e.currentTarget.style.borderColor=A.border;}}>
                  <span style={{fontSize:14}}>{p.i}</span>
                  <div><div style={{fontSize:9,color:A.text,fontWeight:600}}>{p.l}</div><div style={{fontSize:7,color:A.textMuted}}>{p.s}</div></div>
                </div>
              ))}
              <div style={{fontSize:7,color:A.textLight,fontFamily:"monospace",letterSpacing:1,padding:"10px 6px 7px",textTransform:"uppercase"}}>Por industria</div>
              {[{k:"agro",i:"🥑",l:"Agro",s:"Verde · Cosecha y calibres"},{k:"retail",i:"🛒",l:"Retail",s:"Violeta · Ventas y stock"},{k:"salud",i:"🏥",l:"Salud",s:"Cyan · Pacientes y áreas"},{k:"logistica",i:"🚚",l:"Logística",s:"Oscuro · Flota y rutas"}].map(p=>(
                <div key={p.k} onClick={()=>loadPreset(p.k)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px",borderRadius:6,background:A.bg,border:`1px solid ${A.border}`,cursor:"pointer",marginBottom:4,transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=A.accentBg;e.currentTarget.style.borderColor=A.accentLight;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=A.bg;e.currentTarget.style.borderColor=A.border;}}>
                  <span style={{fontSize:14}}>{p.i}</span>
                  <div><div style={{fontSize:9,color:A.text,fontWeight:600}}>{p.l}</div><div style={{fontSize:7,color:A.textMuted}}>{p.s}</div></div>
                </div>
              ))}
              <div style={{padding:"9px",borderRadius:6,background:A.accentBg,border:`1px dashed ${A.accentLight}`,fontSize:8,color:A.textMuted,lineHeight:1.7,textAlign:"center",marginTop:6}}>
                O describe el reporte<br/>en el chat IA 💬
              </div>
            </div>
          )}
        </div>
        ):(
          <button onClick={()=>setLeftOpen(true)} title="Mostrar panel de herramientas"
            style={{width:28,flexShrink:0,background:A.sidebar,borderRight:`1px solid ${A.border}`,
              border:"none",borderRightColor:A.border,cursor:"pointer",color:A.accent,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
              fontSize:13,transition:"all 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=A.accentBg}
            onMouseLeave={e=>e.currentTarget.style.background=A.sidebar}>
            <span style={{fontSize:14}}>▶</span>
            <span style={{writingMode:"vertical-rl",fontSize:9,fontWeight:600,letterSpacing:1,color:A.textMuted}}>HERRAMIENTAS</span>
          </button>
        )}

        {/* ── CANVAS ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          {/* Banner de auto-ajuste al cambiar tamaño */}
          {resizePrompt&&(
            <div style={{padding:"10px 16px",background:"#fffbeb",borderBottom:"1px solid #fcd34d",
              display:"flex",flexDirection:"column",gap:8,flexShrink:0,zIndex:50,position:"relative"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:8,paddingRight:20}}>
                <span style={{fontSize:14,flexShrink:0}}>📐</span>
                <span style={{fontSize:10,color:"#92400e",lineHeight:1.5}}>
                  Canvas cambió de {resizePrompt.oldW}×{resizePrompt.oldH} a {CW}×{CH}.
                  {resizePrompt.hasOverflow?" Hay elementos fuera del lienzo.":""} ¿Cómo ajustar los elementos?
                </span>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button type="button" onClick={scaleAllElements}
                  style={{padding:"6px 14px",borderRadius:6,background:"#d97706",border:"none",
                    color:"#fff",fontSize:9.5,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                  ⤢ Escalar todo proporcionalmente
                </button>
                <button type="button" onClick={clampOverflowElements}
                  style={{padding:"6px 14px",borderRadius:6,background:"#fff",border:"1px solid #d97706",
                    color:"#92400e",fontSize:9.5,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  ⊞ Solo ajustar desbordados
                </button>
              </div>
              <button type="button" onClick={()=>setResizePrompt(null)}
                style={{position:"absolute",top:8,right:10,background:"none",border:"none",color:"#92400e",fontSize:15,cursor:"pointer",padding:0,lineHeight:1}}>×</button>
            </div>
          )}
        <div
          style={{flex:1,overflow:"auto",background:ct.wallpaperGradient
            ?ct.wallpaperGradient
            :(showGrid
              ?`repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(0,0,0,0.05) 31px,rgba(0,0,0,0.05) 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(0,0,0,0.05) 31px,rgba(0,0,0,0.05) 32px),${ct.wallpaper||"#e2e8f0"}`
              :(ct.wallpaper||"#e2e8f0"))}}
          onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}}
          onDrop={handleDrop} onDragOver={e=>e.preventDefault()}>
          <div style={{padding:40,minWidth:"100%",minHeight:"100%",display:"inline-block"}}
            onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}}>
            <div ref={canvasRef}
              style={{position:"relative",width:CW,height:CH+26,
                background:ct.canvas,borderRadius:12,
                boxShadow:"0 8px 40px rgba(0,0,0,0.16),0 0 0 1px rgba(0,0,0,0.05)",
                transform:`scale(${zoom})`,transformOrigin:"top left",
                marginRight:`${(zoom-1)*CW}px`,marginBottom:`${(zoom-1)*(CH+26)}px`}}
              onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}}>

              {/* Titlebar decorativa */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:26,background:"rgba(0,0,0,0.025)",borderBottom:`1px solid ${ct.cardBorder}`,borderRadius:"12px 12px 0 0",display:"flex",alignItems:"center",padding:"0 10px",gap:4,zIndex:0,pointerEvents:"none"}}>
                {["#ef4444","#f59e0b","#10b981"].map((c,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:c,opacity:0.5}}/>)}
                <span style={{fontSize:8,color:ct.textMuted,marginLeft:7,fontFamily:"monospace",opacity:0.6}}>{CW} × {CH} px</span>
                <span style={{marginLeft:"auto",fontSize:8,color:ct.textMuted,fontFamily:"monospace",opacity:0.4}}>{ct.canvas} · {ct.accent}</span>
              </div>

              {/* Capa de elementos — DOS capas:
                  1. clip-layer: overflow:hidden → los visuals nunca salen del canvas
                  2. handles-layer: overflow:visible → los handles sí pueden sobresalir */}

              {/* CLIP LAYER — recorta todo el contenido al área del canvas */}
              <div style={{position:"absolute",left:0,right:0,top:26,height:CH,overflow:"hidden",borderRadius:"0 0 12px 12px"}}
                onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}}>
                {els.length===0&&(
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,pointerEvents:"none",opacity:0.7}}>
                    <div style={{fontSize:32,color:ct.textMuted}}>⬡</div>
                    <div style={{fontSize:11,color:ct.textSub,textAlign:"center",lineHeight:1.8,fontFamily:"'Segoe UI',sans-serif"}}>Describe tu reporte en el chat IA<br/>o arrastra elementos desde el panel izquierdo</div>
                  </div>
                )}
                {/* Visuals + drag/select — dentro del clip */}
                {els.map(el=>(
                  <CanvasEl key={el.id} el={el} ct={ct} selected={sel===el.id}
                    zoom={zoom} snapGrid={snapGrid} CW={CW} CH={CH}
                    onSelect={setSel} onUpdate={updateEl} onCommit={commitEl}
                    navCfg={navCfg} hdrCfg={hdrCfg}
                    allEls={els} onGuides={setGuides}/>
                ))}
                {/* Líneas guía de alineación (solo durante drag) */}
                {guides.map((g,i)=>(
                  <div key={i} style={{position:"absolute",pointerEvents:"none",zIndex:300,
                    background:g.kind==="center"?"#ec4899":"#2563eb",
                    boxShadow:`0 0 0 0.5px ${g.kind==="center"?"#ec4899":"#2563eb"}`,
                    ...(g.type==="v"
                      ?{left:g.pos,top:0,width:1,height:CH}
                      :{top:g.pos,left:0,height:1,width:CW})}}/>
                ))}
              </div>

              {/* HANDLES LAYER — overflow:visible, solo renderiza handles del elemento seleccionado */}
              {sel&&(()=>{
                const el=els.find(e=>e.id===sel);
                if(!el)return null;
                return(
                  <div style={{position:"absolute",left:0,right:0,top:26,height:CH,overflow:"visible",pointerEvents:"none"}}>
                    <HandleOverlay el={el} ct={ct} zoom={zoom} CW={CW} CH={CH} snapGrid={snapGrid}
                      onResize={(id,patch)=>{updateEl(id,patch);}}
                      onCommit={commitEl}/>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        </div>

        {/* ── PANEL IA ── */}
        {aiOpen&&(
          <div style={{width:aiW,background:A.sidebar,borderLeft:`1px solid ${A.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:"relative"}}>
            {/* Handle de redimensión — borde izquierdo del panel IA */}
            <div
              onMouseDown={e=>{
                e.preventDefault();
                const sx=e.clientX, sw=aiW;
                const mv=ev=>setAiW(Math.max(240,Math.min(520,sw-(ev.clientX-sx))));
                const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
                window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
              }}
              style={{position:"absolute",left:-3,top:0,bottom:0,width:6,cursor:"col-resize",zIndex:60}}
              title="Arrastra para ajustar el ancho"
            />
            <div style={{padding:"9px 14px",borderBottom:`1px solid ${A.border}`,display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:loading?"#f59e0b":A.success,boxShadow:`0 0 5px ${loading?"#f59e0b":A.success}`,transition:"all 0.3s"}}/>
              <span style={{fontSize:11,fontWeight:700,color:A.text}}>AI Design Assistant</span>
              {loading&&<span style={{fontSize:8,color:A.textMuted,marginLeft:"auto",fontFamily:"monospace",animation:"pulse 1s infinite"}}>generando…</span>}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
              {msgs.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:6}}>
                  {m.role==="ai"&&<div style={{width:20,height:20,borderRadius:"50%",background:A.accentBg,border:`1px solid ${A.accentLight}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0,marginTop:2}}>⬡</div>}
                  <div style={{maxWidth:"88%",padding:"8px 11px",
                    borderRadius:m.role==="user"?"10px 10px 3px 10px":"3px 10px 10px 10px",
                    background:m.role==="user"?A.bubbleUser:A.bubbleAI,
                    border:`1px solid ${m.role==="user"?A.accentLight:A.border}`,
                    fontSize:10,color:A.text,lineHeight:1.55,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                    {m.atts?.length>0&&<div style={{marginBottom:5,display:"flex",flexWrap:"wrap",gap:3}}>{m.atts.map((a,ai)=><span key={ai} style={{fontSize:8,padding:"2px 5px",background:A.accentBg,borderRadius:4,color:A.accent,fontFamily:"monospace"}}>{fileIcon(a.name)} {a.name.slice(0,16)}</span>)}</div>}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading&&(
                <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:A.accentBg,border:`1px solid ${A.accentLight}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>⬡</div>
                  <div style={{padding:"8px 14px",borderRadius:"3px 10px 10px 10px",background:A.bubbleAI,border:`1px solid ${A.border}`,fontSize:13,color:A.textLight,letterSpacing:4}}>···</div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            {/* Adjuntos */}
            {atts.length>0&&(
              <div style={{padding:"5px 10px",borderTop:`1px solid ${A.border}`,display:"flex",flexWrap:"wrap",gap:3,flexShrink:0}}>
                {atts.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px",background:A.accentBg,borderRadius:5,border:`1px solid ${A.accentLight}`}}>
                    <span style={{fontSize:8,color:A.accent,fontFamily:"monospace"}}>{fileIcon(a.name)} {a.name.slice(0,14)}</span>
                    <span onClick={()=>setAtts(a=>a.filter((_,j)=>j!==i))} style={{fontSize:11,color:A.danger,cursor:"pointer",lineHeight:1}}>×</span>
                  </div>
                ))}
              </div>
            )}
            {/* Panel de resultado de auditoría */}
            {auditResult&&(
              <div style={{margin:"0 10px 6px",background:A.bg,border:`1px solid ${A.border}`,borderRadius:8,overflow:"hidden",flexShrink:0}}>
                <div style={{padding:"7px 10px",background:A.accentBg,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18,fontWeight:900,color:A.accent}}>{auditResult.grade}</span>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:A.text}}>Auditoría de diseño</div>
                      <div style={{fontSize:8.5,color:A.textMuted}}>{auditResult.summary}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${auditResult.score>=80?"#059669":auditResult.score>=60?"#f59e0b":"#dc2626"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:A.text}}>{auditResult.score}</div>
                    <button onClick={()=>setAuditResult(null)} style={{background:"none",border:"none",cursor:"pointer",color:A.textMuted,fontSize:14}}>×</button>
                  </div>
                </div>
                <div style={{maxHeight:160,overflowY:"auto",padding:"6px 10px"}}>
                  {auditResult.issues?.map((issue,i)=>(
                    <div key={i} style={{padding:"5px 0",borderBottom:`1px solid ${A.border}`,display:"flex",gap:6,alignItems:"flex-start"}}>
                      <span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,flexShrink:0,
                        background:issue.severity==="high"?"#fef2f2":issue.severity==="medium"?"#fffbeb":"#f0fdf4",
                        color:issue.severity==="high"?"#dc2626":issue.severity==="medium"?"#d97706":"#059669"}}>
                        {issue.severity==="high"?"●":issue.severity==="medium"?"◐":"○"}
                      </span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:8.5,fontWeight:600,color:A.text}}>{issue.problem}</div>
                        <div style={{fontSize:8,color:A.textMuted,marginTop:1}}>→ {issue.fix}</div>
                      </div>
                    </div>
                  ))}
                  {auditResult.strengths?.length>0&&(
                    <div style={{marginTop:6,padding:"4px 0"}}>
                      <div style={{fontSize:7.5,color:A.textMuted,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Puntos fuertes</div>
                      {auditResult.strengths.map((s,i)=><div key={i} style={{fontSize:8,color:"#059669",marginBottom:1}}>✓ {s}</div>)}
                    </div>
                  )}
                  {/* Botón para aplicar las mejoras recomendadas */}
                  {auditResult.issues?.length>0&&(
                    <button
                      onClick={()=>{
                        const issuesList=auditResult.issues.map(it=>typeof it==="string"?it:(it.text||it.issue||"")).filter(Boolean).join("; ");
                        setAuditResult(null);
                        setTimeout(()=>sendMsg({
                          visible:"✨ Aplicar mejoras de la auditoría",
                          prompt:`Reconstruye el diseño actual aplicando estas mejoras detectadas en la auditoría: ${issuesList}. Mantén los mismos elementos y datos, solo corrige la disposición, espaciado, jerarquía y proporciones según las recomendaciones. Usa mode:"update" para preservar los elementos existentes.`
                        }),60);
                      }}
                      style={{width:"100%",marginTop:8,padding:"8px",borderRadius:7,border:"none",
                        background:`linear-gradient(135deg,${A.accent},${adjHex(A.accent,0.8)})`,
                        color:"#fff",fontSize:9.5,fontWeight:700,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                        boxShadow:`0 3px 10px ${rgba(A.accent,0.35)}`}}>
                      ✨ Aplicar mejoras recomendadas
                    </button>
                  )}
                  <div style={{fontSize:7,color:A.textLight,marginTop:6,textAlign:"center",lineHeight:1.5}}>
                    La IA reconstruirá el diseño con las mejoras. Puedes deshacer con Ctrl+Z si no te convence.
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{padding:"9px 12px",borderTop:`1px solid ${A.border}`,flexShrink:0}}>
              <div style={{display:"flex",gap:4,marginBottom:6}}>
                {/* Adjuntar archivo genérico */}
                <button onClick={()=>fileRef.current?.click()}
                  title="Adjuntar archivo (Excel, CSV, JSON, imagen…)"
                  style={{...B({flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:3,padding:"5px",fontSize:9}),transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.color=A.accent;e.currentTarget.style.background=A.accentBg;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border2;e.currentTarget.style.color=A.textMuted;e.currentTarget.style.background=A.surface;}}>
                  📎 Adjuntar
                </button>
                {/* Importar captura de dashboard */}
                <button onClick={()=>imgFileRef.current?.click()}
                  title="Importar imagen de un dashboard — la IA recreará el layout automáticamente"
                  style={{...B({flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:3,padding:"5px",fontSize:9}),transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#d97706";e.currentTarget.style.color="#d97706";e.currentTarget.style.background="rgba(217,119,6,0.08)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border2;e.currentTarget.style.color=A.textMuted;e.currentTarget.style.background=A.surface;}}>
                  📸 Importar
                </button>
                {/* Auditar diseño */}
                <button
                  title={els.length===0?"Primero crea un diseño para auditarlo":"Auditar diseño — detecta problemas de jerarquía, contraste y dataviz"}
                  onClick={()=>{
                    if(els.length===0)return;
                    setTimeout(()=>sendMsg({
                      visible:"🔍 Auditar diseño",
                      prompt:"Audita el diseño actual: jerarquía visual, contraste, accesibilidad, espaciado y mejores prácticas de dataviz. Sé específico con cada problema encontrado."
                    }),80);
                  }}
                  style={{...B({display:"flex",alignItems:"center",justifyContent:"center",gap:3,padding:"5px 8px",fontSize:9,opacity:els.length===0?0.4:1}),transition:"all 0.12s"}}
                  onMouseEnter={e=>{if(els.length>0){e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.background=A.accentBg;e.currentTarget.style.color=A.accent;}}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border2;e.currentTarget.style.background=A.surface;e.currentTarget.style.color=A.textMuted;}}>
                  🔍 Auditar
                </button>
                {/* Vista móvil */}
                <button title="Vista móvil (9:16)"
                  onClick={()=>{if(els.length===0&&!mobileEls)return;switchToMobile();}}
                  style={{...B({padding:"5px 8px",fontSize:12}),transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.background=A.accentBg;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border2;e.currentTarget.style.background=A.surface;}}>
                  📱
                </button>
              </div>
              <input ref={fileRef} type="file" multiple accept="*/*" style={{display:"none"}} onChange={e=>{handleFiles(Array.from(e.target.files));e.target.value="";}}/>
              {/* Input solo imágenes: dispara IMPORT MODE en la IA */}
              <input ref={imgFileRef} type="file" multiple accept="image/*" style={{display:"none"}} onChange={async e=>{
                const files=Array.from(e.target.files);e.target.value="";
                if(!files.length)return;
                await handleFiles(files);
                const names=files.map(f=>f.name).join(", ");
                setTimeout(()=>sendMsg({
                  visible:`📸 Importar dashboard desde imagen: ${names}`,
                  prompt:`El usuario ha subido una imagen de un dashboard existente (${names}). Usa IMPORT MODE: analiza la imagen en detalle y recrea el layout fielmente. Identifica cada visual (tipo, posición, tamaño, título). Genera un layout completo con mode:"replace". Si detectas colores de marca, inclúyelos en canvasTheme.`
                }),300);
              }}/>
              <div style={{display:"flex",gap:5,alignItems:"flex-end"}}>
                <textarea value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                  onPaste={handlePaste}
                  placeholder="Describe tu reporte, colores, layout… (Enter para enviar)"
                  style={{flex:1,background:A.inputBg,border:`1px solid ${loading?"#f59e0b":A.border2}`,color:A.text,borderRadius:7,padding:"7px 9px",fontSize:10,resize:"none",outline:"none",height:54,fontFamily:"'Segoe UI',sans-serif",transition:"border-color 0.2s",lineHeight:1.5}}/>
                <button onClick={sendMsg} disabled={loading||(!input.trim()&&atts.length===0)}
                  style={{width:30,height:30,borderRadius:7,background:(loading||(!input.trim()&&atts.length===0))?A.border:A.accent,border:"none",color:(loading||(!input.trim()&&atts.length===0))?A.textLight:"#fff",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>↑</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ STATUS BAR ══════════════════════════════════════════════ */}
      <div style={{height:22,background:A.topbar,borderTop:`1px solid ${A.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:14,flexShrink:0}}>
        <span style={{fontSize:8,color:A.textLight,fontFamily:"monospace"}}>Canvas {CW}×{CH}</span>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:8,color:A.textMuted,fontFamily:"monospace"}}>Canvas:</span>
          {[ct.canvas,ct.accent,ct.secondary,ct.cardBg].map((c,i)=>
            <div key={i} title={c} onClick={()=>navigator.clipboard?.writeText(c)} style={{width:12,height:12,borderRadius:2,background:c,border:`1px solid ${A.border2}`,cursor:"pointer"}}/>
          )}
        </div>
        <span style={{fontSize:8,color:snapGrid?A.accent:A.textLight,fontFamily:"monospace"}}>{snapGrid?"⊞ Snap":"⊟ Snap"}</span>
        {selEl&&<span style={{fontSize:8,color:A.text,fontFamily:"monospace"}}>Sel: [{selEl.type}] x:{selEl.x} y:{selEl.y} {selEl.w}×{selEl.h}px</span>}
        {autoSaveTs&&<span style={{fontSize:8,color:"#059669",fontWeight:600,fontFamily:"monospace"}}>✓ {autoSaveTs.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</span>}
        <span style={{marginLeft:"auto",fontSize:8,color:A.textLight,fontFamily:"monospace"}}>Del · Ctrl+Z · ↑↓←→</span>
      </div>

      {/* ══ EXPORT MODAL ════════════════════════════════════════════ */}
      {exportModal&&(
        <ExportModal
          ct={ct}
          els={viewMode==="mobile"?(desktopBackup.current||els):els}
          mobileEls={viewMode==="mobile"?els:mobileEls}
          navCfg={navCfg} hdrCfg={hdrCfg}
          A={A}
          CW={viewMode==="mobile"?(desktopSizeBackup.current?.cw||960):CW}
          CH={viewMode==="mobile"?(desktopSizeBackup.current?.ch||580):CH}
          onClose={()=>setExportModal(false)}
        />
      )}

      {/* ══ THEME LIBRARY MODAL ═════════════════════════════════════ */}
      {themeModal&&(
        <ThemeLibraryModal
          A={A} ct={ct} brandThemes={BRAND_THEMES} savedThemes={savedThemes}
          onApply={(theme)=>{setCt({...CANVAS_DEFAULT,...theme.ct});setThemeModal(false);}}
          onSave={saveCurrentTheme} onDelete={deleteTheme}
          onClose={()=>setThemeModal(false)}
        />
      )}
      {versionsModal&&(
        <VersionsModal
          A={A} savedDesigns={savedDesigns} currentCount={els.length}
          hasUnsaved={els.length>0}
          onSave={saveDesign} onLoad={loadDesign} onDelete={deleteDesign}
          onFetchCloud={fetchCloudDesigns}
          onClose={()=>setVersionsModal(false)}
        />
      )}
      {/* ══ CONFIRMAR NUEVO LIENZO ══════════════════════════════════ */}
      {confirmNew&&(
        <div onClick={()=>setConfirmNew(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:14,width:380,maxWidth:"92vw",padding:"22px",boxShadow:"0 30px 80px rgba(0,0,0,0.4)"}}>
            <div style={{fontSize:15,fontWeight:700,color:A.text,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>📊 Nuevo lienzo</div>
            <div style={{fontSize:11,color:A.textSub,lineHeight:1.6,marginBottom:18}}>
              Se limpiarán los {els.length} elementos del canvas actual para empezar un dashboard nuevo. Podrás deshacerlo con Ctrl+Z.
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmNew(false)}
                style={{padding:"8px 16px",borderRadius:8,background:A.bg,border:`1px solid ${A.border2}`,color:A.textSub,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                Cancelar
              </button>
              <button onClick={()=>{
                setEls([]);pushHistory([]);setSel(null);setConfirmNew(false);
                // Resetear a estado por defecto: tamaño 960×580, tema limpio, nav default
                suppressResize.current=true;
                setCanvasSize(CANVAS_SIZES[0]);
                setCt({...CANVAS_DEFAULT});
                setNavCfg({...NAV_DEFAULT,pages:NAV_DEFAULT.pages.map(p=>({...p}))});
                setHdrCfg({show:false,title:"My Report",subtitle:"Business Intelligence Dashboard",height:58,bgColor:""});
                setMsgs(m=>[...m,{role:"ai",text:"🆕 Lienzo limpio y restablecido a 960×580. Listo para un nuevo dashboard — descríbeme qué necesitas."}]);
              }}
                style={{padding:"8px 16px",borderRadius:8,background:A.accent,border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                Sí, limpiar lienzo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Versions Modal (proyectos guardados) ─────────────────────────
function VersionsModal({A,savedDesigns,currentCount,onSave,onLoad,onDelete,onClose,onFetchCloud,hasUnsaved}){
  const[name,setName]=useState("");
  const[cloudDesigns,setCloudDesigns]=useState([]);
  const[syncing,setSyncing]=useState(false);
  const[tab,setTab]=useState("local"); // "local" | "cloud"
  const[confirmLoad,setConfirmLoad]=useState(null); // diseño pendiente de confirmación

  const handleSync=async()=>{
    setSyncing(true);
    const designs=await onFetchCloud();
    if(designs)setCloudDesigns(designs);
    setSyncing(false);
    setTab("cloud");
  };

  const allDesigns=tab==="local"?savedDesigns:cloudDesigns;

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:16,width:680,maxWidth:"94vw",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.35)"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${A.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:A.text}}>📂 Mis diseños</div>
            <div style={{fontSize:9,color:A.textMuted,marginTop:1}}>Guarda y recupera tus dashboards — también sincroniza con la nube</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:A.textMuted,fontSize:18}}>×</button>
        </div>

        {/* Tabs local / nube */}
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${A.border}`,flexShrink:0}}>
          {[["local","💾 Local",savedDesigns.length],["cloud","☁️ Nube",cloudDesigns.length]].map(([id,label,count])=>(
            <button key={id} onClick={()=>id==="cloud"&&cloudDesigns.length===0?handleSync():setTab(id)}
              style={{flex:1,padding:"9px 0",fontSize:10,fontWeight:tab===id?700:400,
                color:tab===id?A.accent:A.textMuted,background:"none",border:"none",
                borderBottom:tab===id?`2px solid ${A.accent}`:"2px solid transparent",cursor:"pointer"}}>
              {label}{count>0?` (${count})`:""}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {/* Barra de guardar (solo en tab local) */}
          {tab==="local"&&(
            <div style={{display:"flex",gap:8,marginBottom:16,padding:"10px",background:A.accentBg,borderRadius:10}}>
              <input value={name} onChange={e=>setName(e.target.value)}
                placeholder="Nombre del diseño actual…"
                onKeyDown={e=>{if(e.key==="Enter"&&currentCount>0){onSave(name);setName("");}}}
                style={{flex:1,background:A.surface,border:`1px solid ${A.border2}`,color:A.text,borderRadius:7,padding:"7px 10px",fontSize:10,outline:"none"}}/>
              <button onClick={()=>{if(currentCount===0)return;onSave(name);setName("");}}
                disabled={currentCount===0}
                style={{background:currentCount===0?A.border:A.accent,color:currentCount===0?A.textLight:"#fff",border:"none",borderRadius:7,padding:"7px 16px",fontSize:10,fontWeight:600,cursor:currentCount===0?"default":"pointer",whiteSpace:"nowrap"}}>
                💾 Guardar
              </button>
            </div>
          )}

          {/* Botón sincronizar (tab nube) */}
          {tab==="cloud"&&(
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
              <button onClick={handleSync} disabled={syncing}
                style={{background:A.accent,color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:10,fontWeight:600,cursor:"pointer",opacity:syncing?0.7:1}}>
                {syncing?"Sincronizando…":"↻ Actualizar desde nube"}
              </button>
            </div>
          )}

          {/* Grid de diseños */}
          {allDesigns.length===0
            ?(
              <div style={{textAlign:"center",padding:"30px 10px",color:A.textLight,fontSize:10}}>
                {tab==="local"
                  ?"Aún no tienes diseños guardados localmente. Crea un dashboard y guárdalo."
                  :(syncing?"Cargando diseños de la nube…":"Haz clic en «Actualizar desde nube» para cargar tus diseños guardados.")}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
                {allDesigns.map(d=>(
                  <div key={d.id} style={{borderRadius:10,border:`1px solid ${A.border}`,background:A.bg,overflow:"hidden",cursor:"pointer",transition:"all 0.15s",position:"relative"}}
                    onClick={()=>hasUnsaved?setConfirmLoad(d):onLoad(d)}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,0.12)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{height:44,background:d.ct?.wallpaper||A.accentBg,padding:6,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                      <div style={{fontSize:8,fontFamily:"monospace",color:d.ct?.accent||A.accent,fontWeight:700}}>{d.count||"?"} elem</div>
                      {d.mobileEls&&<span style={{fontSize:8}}>📱</span>}
                      <div style={{position:"absolute",top:4,left:6,fontSize:8,background:d.source==="cloud"?"#dbeafe":"#dcfce7",color:d.source==="cloud"?"#1e40af":"#166534",padding:"1px 5px",borderRadius:4,fontWeight:600}}>
                        {d.source==="cloud"?"☁️ nube":"💾 local"}
                      </div>
                      {tab==="local"&&<button onClick={e=>{e.stopPropagation();onDelete(d.id);}}
                        style={{position:"absolute",top:4,right:4,width:18,height:18,borderRadius:"50%",background:"rgba(220,38,38,0.9)",border:"none",color:"#fff",cursor:"pointer",fontSize:11,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                    </div>
                    <div style={{padding:"7px 9px"}}>
                      <div style={{fontSize:10,fontWeight:600,color:A.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
                      <div style={{fontSize:8,color:A.textMuted,marginTop:1}}>{d.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
      {confirmLoad&&(
        <div onClick={()=>setConfirmLoad(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:10001,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:12,padding:"20px 24px",width:340,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:13,fontWeight:700,color:A.text,marginBottom:6}}>¿Cargar diseño?</div>
            <div style={{fontSize:10,color:A.textMuted,lineHeight:1.6,marginBottom:16}}>
              Se perderán los cambios sin guardar del canvas actual.<br/>
              <b style={{color:A.text}}>"{confirmLoad.name}"</b> reemplazará el diseño actual.
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmLoad(null)} style={{background:"none",border:`1px solid ${A.border2}`,color:A.textMuted,borderRadius:7,padding:"6px 14px",fontSize:10,cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>{onLoad(confirmLoad);setConfirmLoad(null);}} style={{background:A.accent,color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Cargar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Theme Library Modal ───────────────────────────────────────────
function ThemeLibraryModal({A,ct,brandThemes,savedThemes,onApply,onSave,onDelete,onClose}){
  const[newName,setNewName]=useState("");
  const ThemeCard=({theme,deletable})=>(
    <div style={{borderRadius:10,border:`1px solid ${A.border}`,overflow:"hidden",background:A.bg,cursor:"pointer",transition:"all 0.15s"}}
      onClick={()=>onApply(theme)}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=A.accent;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,0.12)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
      {/* Swatch preview */}
      <div style={{height:54,background:theme.ct.wallpaper,padding:8,position:"relative"}}>
        <div style={{height:"100%",background:theme.ct.canvas,borderRadius:6,border:`1px solid ${theme.ct.cardBorder}`,display:"flex",alignItems:"center",padding:"0 8px",gap:5}}>
          <div style={{width:18,height:18,borderRadius:4,background:theme.ct.accent}}/>
          <div style={{flex:1,height:7,borderRadius:3,background:theme.ct.secondary}}/>
          <div style={{width:10,height:10,borderRadius:2,background:theme.ct.accent2}}/>
        </div>
        {deletable&&(
          <button onClick={e=>{e.stopPropagation();onDelete(theme.id);}}
            style={{position:"absolute",top:4,right:4,width:18,height:18,borderRadius:"50%",background:"rgba(220,38,38,0.9)",border:"none",color:"#fff",cursor:"pointer",fontSize:11,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        )}
      </div>
      <div style={{padding:"7px 9px",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:14}}>{theme.emoji}</span>
        <span style={{fontSize:10,fontWeight:600,color:A.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{theme.name}</span>
      </div>
    </div>
  );
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:16,width:660,maxWidth:"94vw",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.35)"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${A.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:A.text}}>🎨 Biblioteca de temas</div>
            <div style={{fontSize:9,color:A.textMuted,marginTop:1}}>Aplica una paleta de marca al diseño actual (solo cambia colores, no el layout)</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:A.textMuted,fontSize:18}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {/* Guardar tema actual */}
          <div style={{display:"flex",gap:8,marginBottom:18,padding:"10px",background:A.accentBg,borderRadius:10}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre del tema actual…"
              style={{flex:1,background:A.surface,border:`1px solid ${A.border2}`,color:A.text,borderRadius:7,padding:"7px 10px",fontSize:10,outline:"none"}}/>
            <button onClick={()=>{onSave(newName);setNewName("");}}
              style={{background:A.accent,color:"#fff",border:"none",borderRadius:7,padding:"7px 16px",fontSize:10,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
              💾 Guardar tema actual
            </button>
          </div>
          {savedThemes.length>0&&<>
            <div style={{fontSize:9,fontWeight:700,color:A.textMuted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Mis temas guardados</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:18}}>
              {savedThemes.map(t=><ThemeCard key={t.id} theme={t} deletable/>)}
            </div>
          </>}
          <div style={{fontSize:9,fontWeight:700,color:A.textMuted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Temas de marca</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
            {brandThemes.map(t=><ThemeCard key={t.id} theme={t}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Nav Builder Panel ─────────────────────────────────────────────
function NavBuilderPanel({nav:rawNav,setNav,activeTab,setActiveTab,A,IS,LS,ct}){
  // Normaliza el nav para que SIEMPRE tenga pages y colors (evita crashes)
  const nav={...NAV_DEFAULT,...rawNav,
    colors:{...NAV_DEFAULT.colors,...(rawNav?.colors||{})},
    pages:(rawNav?.pages&&rawNav.pages.length)?rawNav.pages:NAV_DEFAULT.pages};
  const upd=patch=>setNav(n=>({...n,...patch}));
  const updColor=patch=>setNav(n=>({...n,colors:{...NAV_DEFAULT.colors,...(n.colors||{}),...patch}}));
  const acc=A.accent,acBg=A.accentBg,acL=A.accentLight;
  const[iconPicker,setIconPicker]=useState(null); // índice de página con picker abierto

  // Preview del nav
  const actIdx=(()=>{const i=nav.pages.findIndex(p=>p.active);return i>=0?i:0;})();
  const NavPreview=({collapsed})=>(
    <div style={{background:nav.colors.bg,borderRadius:6,overflow:"hidden",
      width:collapsed?nav.widthCollapsed:nav.width,
      maxHeight:240,flexShrink:0,transition:"width 0.3s",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"10px 8px",borderBottom:"1px solid rgba(255,255,255,0.08)",
        display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        {nav.logoUrl
          ?<img src={directImageUrl(nav.logoUrl)} alt="" style={{width:20,height:20,borderRadius:4,objectFit:"contain",flexShrink:0}} onError={e=>{e.currentTarget.style.display="none";}}/>
          :<div style={{width:20,height:20,borderRadius:4,background:nav.colors.accent,
            flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:10,color:"#fff"}}>⬡</div>}
        {!collapsed&&<div style={{fontSize:9,fontWeight:700,color:nav.colors.textActive,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nav.reportName||"Mi Reporte"}</div>}
      </div>
      <div style={{padding:"4px 0",overflow:"auto"}}>
        {nav.pages.map((p,i)=>(
          <div key={p.id??i} style={{display:"flex",alignItems:"center",gap:6,
            padding:"6px 8px",margin:"1px 4px",borderRadius:4,
            background:i===actIdx?`rgba(${hexToRgb(nav.colors.selected)},${nav.colors.selectedOpacity/100})`:"transparent",
            color:i===actIdx?nav.colors.textActive:nav.colors.textInactive,
            fontWeight:i===actIdx?600:400}}>
            <span style={{fontSize:11,flexShrink:0}}>{p.icon}</span>
            {!collapsed&&<span style={{fontSize:8,overflow:"hidden",textOverflow:"ellipsis",
              whiteSpace:"nowrap"}}>{p.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Tabs del nav builder */}
      <div style={{display:"flex",gap:2,marginBottom:8}}>
        {[["config","⚙ Config"],["preview","👁 Preview"],["code","💻 Código"]].map(([t,l])=>(
          <button key={t} type="button" onClick={()=>setActiveTab(t)}
            style={{flex:1,padding:"5px 2px",fontSize:7,fontWeight:activeTab===t?700:400,
              background:activeTab===t?acBg:A.bg,color:activeTab===t?acc:A.textMuted,
              border:`1px solid ${activeTab===t?acL:A.border}`,borderRadius:5,cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>

      {activeTab==="config"&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {/* Posición y estilo */}
          <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${A.border}`}}>
            <div style={{fontSize:8,color:acc,fontFamily:"monospace",marginBottom:6,fontWeight:700}}>POSICIÓN & ESTILO</div>
            <label style={LS}>Posición</label>
            <select value={nav.position} onChange={e=>upd({position:e.target.value})} style={{...IS,marginBottom:6}}>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
              <option value="top">Superior</option>
              <option value="none">Ninguno</option>
            </select>
            <label style={LS}>Estilo</label>
            <select value={nav.style} onChange={e=>upd({style:e.target.value})} style={{...IS,marginBottom:6}}>
              <option value="static">Estático</option>
              <option value="collapsible">Colapsable</option>
              <option value="floating">Flotante</option>
            </select>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              <div>
                <label style={LS}>Ancho expandido</label>
                <input type="number" value={nav.width} onChange={e=>upd({width:+e.target.value})} style={IS}/>
              </div>
              <div>
                <label style={LS}>Ancho colapsado</label>
                <input type="number" value={nav.widthCollapsed} onChange={e=>upd({widthCollapsed:+e.target.value})} style={IS}/>
              </div>
            </div>
          </div>

          {/* Identidad */}
          <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${A.border}`}}>
            <div style={{fontSize:8,color:acc,fontFamily:"monospace",marginBottom:6,fontWeight:700}}>IDENTIDAD</div>
            <label style={LS}>Nombre del reporte</label>
            <input value={nav.reportName} onChange={e=>upd({reportName:e.target.value})} style={{...IS,marginBottom:5}}/>
            <label style={LS}>URL del logo (opcional)</label>
            <input value={nav.logoUrl} onChange={e=>upd({logoUrl:e.target.value})}
              onBlur={e=>{const d=directImageUrl(e.target.value);if(d!==e.target.value)upd({logoUrl:d});}}
              placeholder="https://..." style={IS}/>
            <div style={{fontSize:6.5,color:A.textLight,marginTop:3,lineHeight:1.5}}>
              Soporta links de Dropbox, Google Drive, OneDrive e Imgur — se convierten automáticamente
            </div>
          </div>

          {/* Colores */}
          <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${A.border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontSize:8,color:acc,fontFamily:"monospace",fontWeight:700}}>COLORES</div>
              <button type="button" onClick={()=>updColor({bgCustom:false,selectedCustom:false})}
                title="Usar los colores del tema del diseño"
                style={{fontSize:7,padding:"2px 6px",borderRadius:4,border:`1px solid ${A.border2}`,background:A.surface,color:A.textMuted,cursor:"pointer"}}>
                ↺ Tema
              </button>
            </div>
            {[
              ["Fondo sidebar","bg"],["Acento","accent"],
              ["Texto activo","textActive"],["Texto inactivo","textInactive"],
            ].map(([l,k])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <input type="color" value={nav.colors[k]} onChange={e=>{
                  const patch={[k]:e.target.value};
                  if(k==="bg")patch.bgCustom=true;
                  if(k==="accent"||k==="selected")patch.selectedCustom=true;
                  updColor(patch);
                }}
                  style={{width:24,height:20,padding:0,border:`1px solid ${A.border2}`,borderRadius:4,cursor:"pointer"}}/>
                <span style={{fontSize:8,color:A.textMuted,flex:1}}>{l}</span>
                <span style={{fontSize:7,fontFamily:"monospace",color:A.textLight}}>{nav.colors[k]}</span>
              </div>
            ))}
            {/* Hover con opacidad — layout 2 líneas para no desbordar */}
            <div style={{marginTop:4,padding:"6px",background:A.surface,borderRadius:4,border:`1px solid ${A.border}`}}>
              <div style={{fontSize:7,color:A.textMuted,marginBottom:5}}>HOVER / PRESS / SELECTED</div>
              {[["Hover","hover","hoverOpacity"],["Selected","selected","selectedOpacity"]].map(([l,ck,ok])=>(
                <div key={l} style={{marginBottom:6}}>
                  {/* Línea 1: color + label + valor */}
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                    <input type="color" value={nav.colors[ck]} onChange={e=>updColor({[ck]:e.target.value})}
                      style={{width:18,height:16,padding:0,border:`1px solid ${A.border2}`,borderRadius:3,cursor:"pointer",flexShrink:0}}/>
                    <span style={{fontSize:7,color:A.textMuted,flex:1}}>{l}</span>
                    <span style={{fontSize:7,fontFamily:"monospace",color:A.textLight,flexShrink:0}}>{nav.colors[ok]}%</span>
                  </div>
                  {/* Línea 2: slider de ancho completo */}
                  <input type="range" min="0" max="100" value={nav.colors[ok]}
                    onChange={e=>updColor({[ok]:+e.target.value})}
                    style={{width:"100%",accentColor:acc,display:"block"}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Páginas */}
          <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${A.border}`}}>
            <div style={{fontSize:8,color:acc,fontFamily:"monospace",marginBottom:6,fontWeight:700}}>PÁGINAS</div>
            {nav.pages.map((p,i)=>(
              <div key={p.id} style={{display:"flex",gap:4,alignItems:"center",marginBottom:4}}>
                <button type="button" title={p.active?"Página activa":"Marcar como activa"}
                  onClick={()=>setNav(n=>({...n,pages:n.pages.map((x,j)=>({...x,active:j===i}))}))}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:11,padding:"0 1px",flexShrink:0,
                    color:p.active?acc:A.textLight,opacity:p.active?1:0.4}}>{p.active?"★":"☆"}</button>
                <div style={{position:"relative",flexShrink:0}}>
                  <button type="button" onClick={()=>setIconPicker(iconPicker===i?null:i)}
                    title="Elegir icono"
                    style={{...IS,width:30,textAlign:"center",padding:"3px",cursor:"pointer",
                      background:iconPicker===i?acBg:A.surface,borderColor:iconPicker===i?acc:A.border2}}>
                    {p.icon}
                  </button>
                  {iconPicker===i&&(
                    <div style={{position:"absolute",top:"110%",left:0,zIndex:200,
                      width:208,padding:6,background:A.surface,border:`1px solid ${acc}`,
                      borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",
                      display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:2,
                      maxHeight:160,overflowY:"auto"}}>
                      {NAV_ICONS.map(ic=>(
                        <button key={ic} type="button"
                          onClick={()=>{setNav(n=>({...n,pages:n.pages.map((x,j)=>j===i?{...x,icon:ic}:x)}));setIconPicker(null);}}
                          style={{border:"none",background:p.icon===ic?acBg:"transparent",
                            borderRadius:4,cursor:"pointer",fontSize:14,padding:"3px 0",
                            transition:"background 0.1s"}}
                          onMouseEnter={e=>e.currentTarget.style.background=acBg}
                          onMouseLeave={e=>e.currentTarget.style.background=p.icon===ic?acBg:"transparent"}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input value={p.label} onChange={e=>setNav(n=>({...n,pages:n.pages.map((x,j)=>j===i?{...x,label:e.target.value}:x)}))}
                  style={{...IS,flex:1,padding:"3px 6px"}}/>
                <button type="button" onClick={()=>setNav(n=>{
                  const filtered=n.pages.filter((_,j)=>j!==i);
                  // si borramos la activa, activar la primera
                  if(p.active&&filtered.length&&!filtered.some(x=>x.active))filtered[0]={...filtered[0],active:true};
                  return{...n,pages:filtered};
                })}
                  style={{background:"none",border:"none",color:A.danger,cursor:"pointer",fontSize:12,padding:"0 2px",flexShrink:0}}>×</button>
              </div>
            ))}
            <button type="button"
              onClick={()=>setNav(n=>({...n,pages:[...n.pages,{id:Date.now(),label:"Nueva página",icon:"📄"}]}))}
              style={{width:"100%",padding:"5px",borderRadius:5,background:acBg,border:`1px dashed ${acL}`,
                color:acc,fontSize:8,cursor:"pointer",marginTop:2}}>+ Agregar página</button>
          </div>
        </div>
      )}

      {activeTab==="preview"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:8,color:A.textMuted,textAlign:"center"}}>Expandido</div>
          <div style={{display:"flex",justifyContent:"center"}}><NavPreview collapsed={false}/></div>
          {nav.style==="collapsible"&&<>
            <div style={{fontSize:8,color:A.textMuted,textAlign:"center",marginTop:4}}>Colapsado</div>
            <div style={{display:"flex",justifyContent:"center"}}><NavPreview collapsed={true}/></div>
          </>}
        </div>
      )}

      {activeTab==="code"&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:8,color:A.textMuted,lineHeight:1.6}}>
            Copia el código HTML y pégalo en el visual <b style={{color:acc}}>HTML Content</b> de Power BI.
          </div>
          <textarea readOnly
            value={generateNavHTML(nav,ct)}
            onClick={e=>e.target.select()}
            style={{...IS,height:130,resize:"none",lineHeight:1.4,fontSize:7,fontFamily:"monospace"}}/>
          <div style={{fontSize:8,color:A.textMuted,lineHeight:1.6,marginTop:4}}>
            Medida <b style={{color:acc}}>DAX</b> para navegación dinámica:
          </div>
          <textarea readOnly
            value={generateNavDAX(nav)}
            onClick={e=>e.target.select()}
            style={{...IS,height:110,resize:"none",lineHeight:1.4,fontSize:7,fontFamily:"monospace"}}/>
        </div>
      )}
    </div>
  );
}

// ── PBIT EXPORT — genera Power BI Template (.pbit) real ──────────
// Un .pbit es un ZIP con archivos internos codificados en UTF-16LE.
// Generamos el ZIP a mano (método STORED, sin compresión) — cero dependencias.

const _crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function _crc32(buf){let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=_crcTable[(c^buf[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
// UTF-16LE SIN BOM — confirmado por stack trace real de PBI Desktop:
// PowerBIPackager.ValidateVersion lee los bytes con Encoding.Unicode sin
// quitar BOM, así que '\uFEFF1.28' es rechazado como versión inválida.
function _utf16le(str){
  const b=new Uint8Array(str.length*2);
  for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);b[i*2]=c&0xFF;b[i*2+1]=c>>8;}
  return b;
}
function _utf8(str){return new TextEncoder().encode(str);}

function _buildZip(entries){
  const chunks=[],central=[];let offset=0;
  // Fecha DOS válida (2026-01-01 00:00) — fecha 0 (mes 0/día 0) es inválida
  // y el lector ZIP de .NET puede rechazarla
  const DOS_TIME=0x0000,DOS_DATE=((2026-1980)<<9)|(1<<5)|1;
  for(const e of entries){
    const nameB=_utf8(e.name),crc=_crc32(e.data);
    const local=new Uint8Array(30+nameB.length);
    const dv=new DataView(local.buffer);
    dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);
    dv.setUint16(8,0,true); // método STORED
    dv.setUint16(10,DOS_TIME,true);dv.setUint16(12,DOS_DATE,true);
    dv.setUint32(14,crc,true);
    dv.setUint32(18,e.data.length,true);dv.setUint32(22,e.data.length,true);
    dv.setUint16(26,nameB.length,true);
    local.set(nameB,30);
    chunks.push(local,e.data);
    const cen=new Uint8Array(46+nameB.length);
    const cv=new DataView(cen.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);
    cv.setUint16(12,DOS_TIME,true);cv.setUint16(14,DOS_DATE,true);
    cv.setUint32(16,crc,true);
    cv.setUint32(20,e.data.length,true);cv.setUint32(24,e.data.length,true);
    cv.setUint16(28,nameB.length,true);
    cv.setUint32(42,offset,true);
    cen.set(nameB,46);
    central.push(cen);
    offset+=local.length+e.data.length;
  }
  const cenSize=central.reduce((s,c)=>s+c.length,0);
  const eocd=new Uint8Array(22);
  const ev=new DataView(eocd.buffer);
  ev.setUint32(0,0x06054b50,true);
  ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);
  ev.setUint32(12,cenSize,true);ev.setUint32(16,offset,true);
  const out=new Uint8Array(offset+cenSize+22);
  let p=0;
  for(const c of chunks){out.set(c,p);p+=c.length;}
  for(const c of central){out.set(c,p);p+=c.length;}
  out.set(eocd,p);
  return out;
}

// ── GENERADOR DE SVG — renderiza el diseño completo como SVG vectorial ──────
function generateDesignSVG(els,ct,CW,CH){
  const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const ac=ct.accent||"#2563eb";const ac2=ct.accent2||"#1d4ed8";
  const bg=ct.cardBg||"#ffffff";const bd=ct.cardBorder||"#e2e8f0";
  const tx=ct.text||"#1e293b";const ts=ct.textSub||"#64748b";
  const hBg=ct.headerBg||ac;const nBg=ct.headerBg||ac2||"#1e293b";
  const sec=ct.secondary||"#eff6ff";const r2=ct.r!==undefined?ct.r:8;
  const el2svg=e=>{
    const{x,y,w,h,type}=e;const lbl=esc(e.label||type);
    switch(type){
      case'header':return`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${hBg}"/><text x="${x+20}" y="${y+h*.65}" font-family="Segoe UI Semibold,sans-serif" font-size="16" fill="white">${lbl}</text>`;
      case'nav':{const items=['Home','Análisis','Ventas','Config'];const ih=Math.min(32,(h-32)/items.length);return`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${nBg}"/>${items.map((t,i)=>`<text x="${x+16}" y="${y+32+(i+.7)*ih}" font-family="Segoe UI,sans-serif" font-size="9" fill="rgba(255,255,255,.6)">${t}</text>`).join('')}`;}
      case'kpi':return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><text x="${x+w/2}" y="${y+h*.5}" font-family="Segoe UI,sans-serif" font-size="${Math.min(26,w/4)}" font-weight="700" fill="${ac}" text-anchor="middle">—</text><text x="${x+w/2}" y="${y+h*.77}" font-family="Segoe UI,sans-serif" font-size="10" fill="${ts}" text-anchor="middle">${lbl}</text>`;
      case'kpispark':{const pts=[[0,.4],[.2,.6],[.4,.3],[.6,.7],[.8,.4],[1,.2]];const sw=w*.38;const sx=x+w*.57;const sy=y+h*.25;const sh=h*.45;const sp=pts.map(([px,py])=>`${sx+px*sw},${sy+py*sh}`).join(' ');return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><text x="${x+10}" y="${y+h*.48}" font-family="Segoe UI,sans-serif" font-size="${Math.min(20,w/5)}" font-weight="700" fill="${ac}">—</text><text x="${x+10}" y="${y+h*.73}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}">${lbl}</text><polyline points="${sp}" fill="none" stroke="${ac}" stroke-width="1.5" stroke-linejoin="round" opacity=".75"/>`;}
      case'slicer':{const chips=lbl.split('·').slice(0,5);const cw2=Math.min(90,(w-32)/Math.max(chips.length,1));return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/>${chips.map((c,i)=>`<rect x="${x+14+i*(cw2+6)}" y="${y+(h-20)/2}" width="${cw2}" height="20" rx="10" fill="${sec}" stroke="${ac}" stroke-width="1"/><text x="${x+14+i*(cw2+6)+cw2/2}" y="${y+h/2+4}" font-family="Segoe UI,sans-serif" font-size="8" fill="${ac}" text-anchor="middle">${esc(c.trim()).slice(0,11)}</text>`).join('')}`;}
      case'bar':{const n=Math.min(6,Math.floor(w/26));const vals=[.65,.85,.5,.95,.7,.4];const bw=(w-28)/(n*1.4);const mh=h-36;return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><text x="${x+10}" y="${y+15}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}">${lbl}</text>${vals.slice(0,n).map((v,i)=>{const bh=mh*v;return`<rect x="${x+14+i*(bw+bw*.4)}" y="${y+20+mh-bh}" width="${bw}" height="${bh}" rx="2" fill="${ac}" opacity="${.6+i*.06}"/>`;}).join('')}`;}
      case'line':{const pts2=[[0,.6],[.17,.3],[.33,.5],[.5,.15],[.67,.35],[.83,.2],[1,.4]];const ax=x+12;const ay=y+22;const aw=w-24;const ah=h-34;const ps=pts2.map(([px,py])=>`${ax+px*aw},${ay+py*ah}`).join(' ');return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><text x="${x+10}" y="${y+15}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}">${lbl}</text><polygon points="${ax},${ay+ah} ${ps} ${ax+aw},${ay+ah}" fill="${ac}" opacity=".1"/><polyline points="${ps}" fill="none" stroke="${ac}" stroke-width="2" stroke-linejoin="round"/>`;}
      case'pie':{const cx=x+w/2;const cy=y+h/2;const ro=Math.min(w,h)/2-14;const ri=ro*.56;const slices=[.35,.25,.22,.18];const cols=[ac,ac2,ct.success||"#059669",ct.warning||"#f59e0b"];let ang=0;const paths=slices.map((v,i)=>{const s=ang;const en=ang+v*2*Math.PI;ang=en;const x1=cx+ro*Math.cos(s-Math.PI/2),y1=cy+ro*Math.sin(s-Math.PI/2),x2=cx+ro*Math.cos(en-Math.PI/2),y2=cy+ro*Math.sin(en-Math.PI/2),ix1=cx+ri*Math.cos(s-Math.PI/2),iy1=cy+ri*Math.sin(s-Math.PI/2),ix2=cx+ri*Math.cos(en-Math.PI/2),iy2=cy+ri*Math.sin(en-Math.PI/2),lg=en-s>Math.PI?1:0;return`<path d="M ${x1} ${y1} A ${ro} ${ro} 0 ${lg} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ri} ${ri} 0 ${lg} 0 ${ix1} ${iy1} Z" fill="${cols[i]}" opacity=".85"/>`;}).join('');return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/>${paths}<text x="${cx}" y="${cy+5}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}" text-anchor="middle">${lbl}</text>`;}
      case'gauge':{const gcx=x+w/2;const gcy=y+h*.68;const gr=Math.min(w*.38,h*.46);const fx=gcx+gr*Math.cos(Math.PI-.72*Math.PI);const fy=gcy-gr*Math.sin(.72*Math.PI);return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><path d="M ${gcx-gr} ${gcy} A ${gr} ${gr} 0 0 1 ${gcx+gr} ${gcy}" fill="none" stroke="${bd}" stroke-width="${gr*.27}" stroke-linecap="round"/><path d="M ${gcx-gr} ${gcy} A ${gr} ${gr} 0 0 1 ${fx} ${fy}" fill="none" stroke="${ac}" stroke-width="${gr*.27}" stroke-linecap="round"/><text x="${gcx}" y="${gcy-6}" font-family="Segoe UI,sans-serif" font-size="13" font-weight="700" fill="${ac}" text-anchor="middle">72%</text><text x="${gcx}" y="${y+h-8}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}" text-anchor="middle">${lbl}</text>`;}
      case'table':{const nR=Math.floor((h-28)/20);const rrows=Array.from({length:Math.min(nR,6)},(_,i)=>`<rect x="${x}" y="${y+26+i*20}" width="${w}" height="20" fill="${i%2?bg:sec}" opacity=".7"/>`).join('');return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><rect x="${x}" y="${y}" width="${w}" height="26" fill="${ac}" opacity=".13" rx="${r2}"/>${rrows}<text x="${x+10}" y="${y+18}" font-family="Segoe UI Semibold,sans-serif" font-size="10" fill="${tx}">${lbl}</text>`;}
      case'matrix':return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><rect x="${x}" y="${y}" width="${w}" height="24" fill="${ac}" opacity=".12" rx="${r2}"/><text x="${x+10}" y="${y+16}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}">${lbl}</text>`;
      case'scatter':{const dots=[[.2,.3],[.4,.6],[.6,.2],[.8,.7],[.3,.8],[.7,.4],[.5,.5],[.15,.55],[.85,.3]];return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><text x="${x+10}" y="${y+15}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}">${lbl}</text>${dots.map(([px,py])=>`<circle cx="${x+16+px*(w-32)}" cy="${y+22+py*(h-36)}" r="4" fill="${ac}" opacity=".7"/>`).join('')}`;}
      case'treemap':{const blks=[{x:0,y:0,w:.6,h:.55},{x:.6,y:0,w:.4,h:.35},{x:.6,y:.35,w:.4,h:.2},{x:0,y:.55,w:.35,h:.45},{x:.35,y:.55,w:.25,h:.45},{x:.6,y:.55,w:.4,h:.45}];const cls=[ac,ac2,ct.success||"#059669",ct.warning||"#f59e0b",ct.danger||"#dc2626",ts];const iw=w-4;const ih2=h-24;return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/>${blks.map((b,i)=>`<rect x="${x+2+b.x*iw}" y="${y+2+b.y*ih2}" width="${b.w*iw-2}" height="${b.h*ih2-2}" fill="${cls[i%cls.length]}" opacity=".8"/>`).join('')}<text x="${x+6}" y="${y+h-6}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}">${lbl}</text>`;}
      case'button':return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${ac}"/><text x="${x+w/2}" y="${y+h/2+4}" font-family="Segoe UI Semibold,sans-serif" font-size="10" fill="white" text-anchor="middle">${lbl}</text>`;
      case'image':return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${sec}" stroke="${bd}" stroke-width="1"/><text x="${x+w/2}" y="${y+h*.5}" font-size="${Math.min(w,h)*.28}" text-anchor="middle">🖼</text><text x="${x+w/2}" y="${y+h*.78}" font-family="Segoe UI,sans-serif" font-size="9" fill="${ts}" text-anchor="middle">${lbl}</text>`;
      default:return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2}" fill="${bg}" stroke="${bd}" stroke-width="1"/><text x="${x+w/2}" y="${y+h/2+4}" font-family="Segoe UI,sans-serif" font-size="10" fill="${ts}" text-anchor="middle">${lbl}</text>`;
    }
  };
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="${ct.canvas||"#ffffff"}"/>${els.map(e=>el2svg(e)).join('')}</svg>`;
}
function generatePreviewHTML(els,ct,navCfg,hdrCfg,CW,CH){
  const svg=generateDesignSVG(els,ct,CW,CH);
  const title=hdrCfg?.title||"PBI Dashboard";
  const ac=ct.accent||"#2563eb";
  const types=[...new Set(els.map(e=>e.type))];
  return`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Preview</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:28px 20px}.top{text-align:center;margin-bottom:20px}.top h1{font-size:18px;font-weight:700;color:#f1f5f9}.top p{font-size:11px;color:#64748b;margin-top:4px}.wrap{max-width:${CW}px;margin:0 auto;border-radius:10px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.6)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;max-width:${CW}px;margin:18px auto 0}.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px}.card h3{font-size:9px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}.card p{font-size:11px;color:#e2e8f0}.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;margin:2px 2px 2px 0;background:${ac}22;color:${ac};border:1px solid ${ac}44}</style></head><body><div class="top"><h1>📊 ${title}</h1><p>Vista previa del diseño · ${els.length} elementos · Canvas ${CW}×${CH}px · Generado por PBI Designer</p></div><div class="wrap">${svg}</div><div class="grid"><div class="card"><h3>Dimensiones</h3><p>${CW} × ${CH} px</p></div><div class="card"><h3>Colores del tema</h3><p>${[ct.accent,ct.canvas,ct.cardBg].filter(Boolean).map(c=>`<span class="badge" style="background:${c}33;border-color:${c}55;color:${c}">${c}</span>`).join('')}</p></div><div class="card"><h3>Tipos de visual (${els.length})</h3><p>${types.map(t=>`<span class="badge">${t}</span>`).join('')}</p></div><div class="card"><h3>Navegación</h3><p>${navCfg?.position||'left'} · ${navCfg?.style||'collapsible'}</p></div></div></body></html>`;
}

// Mapeo de nuestros tipos → tipos de visual reales de Power BI
const PBIT_VISUAL_MAP={
  kpi:"card", kpispark:"card", bar:"clusteredBarChart", line:"lineChart", pie:"donutChart",
  gauge:"gauge", scatter:"scatterChart", treemap:"treemap", matrix:"pivotTable",
  table:"tableEx", slicer:"slicer", button:"actionButton",
  nav:"shape", card:"shape", header:"shape", image:"image",
};

// ═══ ESTRUCTURA VERIFICADA contra pbit REAL (FlowViz, diseccionado byte a byte) ═══
// Version="1.30" · Settings con QueriesSettings · Metadata Version:5 (PascalCase)
// Content_Types UTF-8 CON BOM · resto UTF-16LE SIN BOM · baseTheme CY18SU04
function buildPbit(els,ct,CW,CH,mobileEls,navCfg,hdrCfg){
  const esc=s=>String(s||"").replace(/'/g,"").replace(/"/g,"");
  const rid=()=>Math.floor(Math.random()*900000000)+100000000; // ids numéricos como el real
  const hexname=()=>Array.from({length:20},()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
  // GUID del visual HTML Content by dm-p (Daniel Marsh-Patrick) — instalar 1 vez desde PBI Desktop marketplace
  const HTML_CONTENT_GUID="htmlContent443BE3AD55E043BF878BED274D3A6865";
  // Escapa un string para expresión DAX (las comillas dobles se representan como "")
  const daxStr=s=>'"'+String(s).replace(/"/g,'""')+'"';

  // Mapear elementos móviles por id para emparejarlos con los desktop
  const mobileById={};
  if(mobileEls&&mobileEls.length)mobileEls.forEach(m=>{mobileById[m.id]=m;});

  const C=hex=>({solid:{color:{expr:{Literal:{Value:`'${hex}'`}}}}});
  const acHex=ct.accent||"#2563eb";
  const hdrBgHex=ct.headerBg||ct.accent||"#2563eb";
  const navBgHex=ct.headerBg||ct.accent2||"#1e293b";
  const cardBgHex=ct.cardBg||"#ffffff";
  const cardBdrHex=ct.cardBorder||"#e2e8f0";
  const txHex=ct.text||"#1e293b";
  const tsHex=ct.textSub||"#64748b";

  // Genera HTMLs para nav y header si los elementos existen y tenemos la config
  const navEl=els.find(e=>e.type==="nav");
  const hdrEl=els.find(e=>e.type==="header");
  const navHtmlStr=(navCfg&&navEl)?generateNavHTML(navCfg,ct):null;
  const hdrHtmlStr=(hdrCfg&&hdrEl)?generateHeaderHTML(hdrCfg,ct,navCfg):null;

  const visualContainers=els.map((e,i)=>{
    const name=hexname();
    const layouts=[{id:0,position:{x:e.x,y:e.y,z:i,width:e.w,height:e.h,tabOrder:(i+1)*1000}}];
    const m=mobileById[e.id];
    if(m)layouts.push({id:1,position:{x:m.x,y:m.y,z:i,width:m.w,height:m.h,tabOrder:(i+1)*1000},parentGroupName:null});

    let cfg;

    if(e.type==="header"){
      if(hdrHtmlStr){
        // Visual HTML Content — renderiza el HTML del header cuando el visual está instalado en PBI Desktop
        const qRef="_Medidas._HeaderHTML";
        cfg={name,layouts,singleVisual:{
          visualType:HTML_CONTENT_GUID,
          projections:{content:[{queryRef:qRef,active:false}]},
          prototypeQuery:{Version:2,From:[{Name:"m",Entity:"_Medidas",Type:0}],
            Select:[{Measure:{Expression:{SourceRef:{Source:"m"}},Property:"_HeaderHTML"},Name:qRef}]},
          vcObjects:{background:[{properties:{show:{expr:{Literal:{Value:"false"}}}}}]},
        }};
      }else{
        // Fallback: shape coloreado (si no hay hdrCfg disponible)
        cfg={name,layouts,singleVisual:{visualType:"shape",
          vcObjects:{background:[{properties:{color:C(hdrBgHex),show:{expr:{Literal:{Value:"true"}}}}}],
                     title:[{properties:{show:{expr:{Literal:{Value:"false"}}}}}]}}};
      }
    }else if(e.type==="nav"){
      if(navHtmlStr){
        // Visual HTML Content — renderiza el HTML del nav cuando el visual está instalado en PBI Desktop
        const qRef="_Medidas._NavHTML";
        cfg={name,layouts,singleVisual:{
          visualType:HTML_CONTENT_GUID,
          projections:{content:[{queryRef:qRef,active:false}]},
          prototypeQuery:{Version:2,From:[{Name:"m",Entity:"_Medidas",Type:0}],
            Select:[{Measure:{Expression:{SourceRef:{Source:"m"}},Property:"_NavHTML"},Name:qRef}]},
          vcObjects:{background:[{properties:{show:{expr:{Literal:{Value:"false"}}}}}]},
        }};
      }else{
        // Fallback: shape coloreado (si no hay navCfg disponible)
        cfg={name,layouts,singleVisual:{visualType:"shape",
          vcObjects:{background:[{properties:{color:C(navBgHex),show:{expr:{Literal:{Value:"true"}}}}}],
                     title:[{properties:{show:{expr:{Literal:{Value:"false"}}}}}]}}};
      }
    }else if(e.type==="button"){
      // Shape con color de acento para botones
      cfg={name,layouts,singleVisual:{visualType:"shape",
        vcObjects:{background:[{properties:{color:C(acHex),show:{expr:{Literal:{Value:"true"}}}}}],
                   title:[{properties:{show:{expr:{Literal:{Value:"false"}}}}}]}}};
    }else{
      // Visuals nativos de Power BI — muestran "Seleccione o arrastre campos" hasta conectar datos
      const pbiType=PBIT_VISUAL_MAP[e.type]||"card";
      cfg={name,layouts,singleVisual:{
        visualType:pbiType,
        vcObjects:{
          title:[{properties:{
            show:{expr:{Literal:{Value:"true"}}},
            titleText:{expr:{Literal:{Value:`'${esc(e.label||e.type)}'`}}},
          }}],
        },
      }};
    }

    return{id:rid(),x:e.x,y:e.y,z:i,width:e.w,height:e.h,
      config:JSON.stringify(cfg),filters:"[]",tabOrder:(i+1)*1000};
  });

  // Fondo de página + papel tapiz (formato estándar de objects de página)
  const sectionConfig=JSON.stringify({
    objects:{
      background:[{properties:{color:{solid:{color:{expr:{Literal:{Value:`'${ct.canvas||"#ffffff"}'`}}}}},transparency:{expr:{Literal:{Value:"0D"}}}}}],
      outspace:[{properties:{color:{solid:{color:{expr:{Literal:{Value:`'${ct.wallpaper||"#e8edf2"}'`}}}}},transparency:{expr:{Literal:{Value:"0D"}}}}}],
    },
  });

  // Tema personalizado embebido — para que el .pbit traiga los colores aplicados
  // sin importar el theme.json aparte. Se registra como recurso y se referencia.
  const customTheme=buildThemeJson(ct);
  const themeName=customTheme.name||"PBI Designer";

  // Layout — top-level real: id, filters, sections, config, layoutOptimization
  const layout={
    id:rid(),
    filters:"[]",
    // resourcePackages: registra el tema custom como recurso del reporte
    resourcePackages:[
      {resourcePackage:{name:"SharedResources",type:2,items:[
        {type:202,path:"BaseThemes/CY18SU04.json",name:"CY18SU04"},
      ],disabled:false}},
      {resourcePackage:{name:"RegisteredResources",type:1,items:[
        {type:202,path:"CustomTheme.json",name:themeName},
      ],disabled:false}},
    ],
    sections:[{
      id:rid(),
      name:"ReportSection"+hexname(),
      displayName:"Página 1",
      filters:"[]",ordinal:0,
      visualContainers,
      config:sectionConfig,
      displayOption:1,width:CW,height:CH,
    }],
    config:JSON.stringify({
      version:"5.66",
      themeCollection:{
        baseTheme:{name:"CY18SU04",type:2,version:{visual:"1.8.26",report:"2.0.26",page:"1.3.26"}},
        customTheme:{name:themeName,type:1,version:""},
      },
      activeSectionIndex:0,
      defaultDrillFilterOtherVisuals:true,
    }),
    layoutOptimization:0,
  };

  // DataModelSchema real: name=GUID, compatibilityLevel 1567, dataAccessOptions
  const guid=()=>"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
    const r=Math.random()*16|0;return(c==="x"?r:(r&0x3|0x8)).toString(16);});

  // Tabla de medidas placeholder: una medida DAX por cada KPI del canvas,
  // lista para que el usuario reemplace el "0" por su cálculo real.
  const kpiEls=els.filter(e=>e.type==="kpi");
  const measures=kpiEls.map(e=>{
    const cleanName=String(e.label||"Medida").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g,"").trim()||"Medida";
    return{
      name:cleanName,
      expression:"0 // TODO: reemplaza con tu cálculo, ej: SUM('Tabla'[Columna])",
      formatString:"#,0",
      annotations:[{name:"PBIDesigner_Source",value:"KPI placeholder"}],
    };
  });
  // Medidas HTML: expresiones DAX constantes con el HTML completo del nav y header
  if(navHtmlStr)measures.push({name:"_NavHTML",expression:daxStr(navHtmlStr),formatString:"",
    annotations:[{name:"PBIDesigner_Source",value:"Nav HTML Content — visual HTML Content de dm-p"}]});
  if(hdrHtmlStr)measures.push({name:"_HeaderHTML",expression:daxStr(hdrHtmlStr),formatString:"",
    annotations:[{name:"PBIDesigner_Source",value:"Header HTML Content — visual HTML Content de dm-p"}]});
  const measuresTable=measures.length?[{
    name:"_Medidas",
    isHidden:false,
    columns:[{name:"_dummy",dataType:"int64",isHidden:true,
      sourceColumn:"_dummy",annotations:[{name:"SummarizationSetBy",value:"Automatic"}]}],
    partitions:[{name:"_Medidas",mode:"import",
      source:{type:"calculated",expression:"{0}"}}],
    measures,
    annotations:[{name:"PBI_Id",value:guid()}],
  }]:[];

  const dataModel={
    name:guid(),
    compatibilityLevel:1567,
    model:{
      culture:"es-PE",
      dataAccessOptions:{legacyRedirects:true,returnErrorValuesAsNull:true},
      defaultPowerBIDataSourceVersion:"powerBI_V3",
      sourceQueryCulture:"es-PE",
      tables:measuresTable,
      annotations:[{name:"__PBI_TimeIntelligenceEnabled",value:"1"}],
    },
  };

  // Settings y Metadata — copiados del pbit real (PascalCase, Version 1 y 5)
  const settings={Version:1,ReportSettings:{},
    QueriesSettings:{TypeDetectionEnabled:true,RelationshipImportEnabled:true,Version:"2.82.5858.641"}};
  const metadata={Version:5,AutoCreatedRelationships:[],
    FileDescription:"Plantilla generada con PBI Designer v2.0"};

  return _buildZip([
    // [Content_Types].xml en UTF-8 CON BOM (\uFEFF → EF BB BF) como el real
    {name:"[Content_Types].xml",data:_utf8('\uFEFF<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="" /><Override PartName="/Version" ContentType="" /><Override PartName="/DataModelSchema" ContentType="" /><Override PartName="/DiagramLayout" ContentType="" /><Override PartName="/Report/Layout" ContentType="" /><Override PartName="/Report/CustomTheme.json" ContentType="" /><Override PartName="/Settings" ContentType="application/json" /><Override PartName="/Metadata" ContentType="application/json" /></Types>')},
    {name:"Version",data:_utf16le("1.30")},
    {name:"Settings",data:_utf16le(JSON.stringify(settings))},
    {name:"Metadata",data:_utf16le(JSON.stringify(metadata))},
    {name:"DiagramLayout",data:_utf16le(JSON.stringify({version:"1.1.0",diagrams:[]}))},
    {name:"Report/Layout",data:_utf16le(JSON.stringify(layout))},
    // Tema custom embebido — Power BI lo aplica al abrir la plantilla
    {name:"Report/CustomTheme.json",data:_utf16le(JSON.stringify(customTheme))},
    {name:"DataModelSchema",data:_utf16le(JSON.stringify(dataModel))},
  ]);
}

// ── Export Modal ─────────────────────────────────────────────────
// Usa URL.createObjectURL — Blob URL funciona dentro del iframe
// El usuario hace clic directamente en el <a> — no hay a.click() programático
function ExportModal({ct,els,navCfg,hdrCfg,A,onClose,CW=960,CH=580,mobileEls=null}){
  const[activeTab,setActiveTab]=useState("theme");
  const[copied,setCopied]=useState(false);
  const[blobUrl,setBlobUrl]=useState(null);
  const[blobName,setBlobName]=useState("");
  const[lang,setLang]=useState("es"); // idioma del export: es | en
  const[selected,setSelected]=useState({}); // {key:true} para descarga múltiple
  const[zipUrl,setZipUrl]=useState(null); // url del ZIP generado
  const T=(es,en)=>lang==="es"?es:en;

  const files={
    pbit:  {label:"report.pbit",    mime:"application/octet-stream", icon:"📦", binary:true,
            hint:T("📦 Plantilla Power BI — ábrela directo en PBI Desktop con los visuals ya posicionados","📦 Power BI template — open directly in PBI Desktop with visuals already placed"),
            content:()=>T(`📦 PLANTILLA POWER BI (.pbit)

Este archivo es una plantilla real de Power BI que contiene:

  ✓ Página configurada a ${CW}×${CH}px
  ✓ ${els.length} visuals posicionados exactamente como en tu canvas:
${els.map(e=>`     [${(PBIT_VISUAL_MAP[e.type]||"textbox").padEnd(18)}] "${e.label}" → x:${e.x} y:${e.y} ${e.w}×${e.h}`).join("\n")}
  ✓ Fondo del lienzo: ${ct.canvas}
  ✓ Papel tapiz: ${ct.wallpaper||"#e8edf2"}
  ✓ Título visible en cada visual
${mobileEls&&mobileEls.length?`  ✓ 📱 VISTA MÓVIL INCLUIDA (${mobileEls.length} visuals) — embebida en el mismo archivo.`:`  ⚠ Sin vista móvil — genera el diseño móvil (botón 📱) antes de exportar.`}

REQUISITO — VISUAL "HTML Content":
  ⚡ El nav y el header usan el visual "HTML Content" by dm-p.
     Si no lo tienes: en PBI Desktop → panel Visualizaciones → ⋯ → Obtener más visuals → busca "HTML Content" (by Daniel Marsh-Patrick)
     O descarga el .pbiviz desde: github.com/dm-p/powerbi-visuals-html-content/releases

CÓMO USARLO:
  1. Instala el visual "HTML Content" en PBI Desktop (solo 1 vez)
  2. Genera el link de descarga abajo
  3. Abre report.pbit con Power BI Desktop (doble clic)
  4. El nav y el header se renderizan automáticamente con tu diseño
  5. Conecta tus datos y arrastra los campos a cada visual
  6. La vista móvil ya viene dentro — ábrela en Power BI Mobile`,
`📦 POWER BI TEMPLATE (.pbit)

This is a real Power BI template containing:

  ✓ Page set to ${CW}×${CH}px
  ✓ ${els.length} visuals positioned exactly as in your canvas:
${els.map(e=>`     [${(PBIT_VISUAL_MAP[e.type]||"textbox").padEnd(18)}] "${e.label}" → x:${e.x} y:${e.y} ${e.w}×${e.h}`).join("\n")}
  ✓ Canvas background: ${ct.canvas}
  ✓ Wallpaper: ${ct.wallpaper||"#e8edf2"}
  ✓ Title visible on each visual
${mobileEls&&mobileEls.length?`  ✓ 📱 MOBILE VIEW INCLUDED (${mobileEls.length} visuals) — embedded in the same file.`:`  ⚠ No mobile view — generate the mobile layout (📱 button) before exporting.`}

REQUIREMENT — "HTML Content" VISUAL:
  ⚡ Nav and header use the "HTML Content" visual by dm-p.
     If not installed: PBI Desktop → Visualizations pane → ⋯ → Get more visuals → search "HTML Content" (by Daniel Marsh-Patrick)
     Or download .pbiviz from: github.com/dm-p/powerbi-visuals-html-content/releases

HOW TO USE:
  1. Install the "HTML Content" visual in PBI Desktop (once only)
  2. Generate the download link below
  3. Open report.pbit with Power BI Desktop (double-click)
  4. Nav and header render automatically with your design
  5. Connect your data and drag fields onto each visual
  4. The mobile view is already inside — open it in Power BI Mobile`)},
    theme: {label:"pbi-theme.json", mime:"application/json", icon:"🎨",
            hint:"Power BI → View → Themes → Browse for themes",
            content:()=>JSON.stringify(buildThemeJson(ct),null,2)},
    layout:{label:"pbi-layout.json",mime:"application/json", icon:"📐",
            hint:`Posiciones exactas de cada visual (${CW}×${CH}px) — úsalo como referencia manual`,
            content:()=>JSON.stringify(buildLayoutJson(els,ct,navCfg,hdrCfg,CW,CH),null,2)},
    htmlnav:{label:"nav-menu.html", mime:"text/html",         icon:"☰",
            hint:"Pega este código en el visual HTML Content de Power BI",
            content:()=>generateNavHTML(navCfg,ct)},
    htmlhdr:{label:"header.html",   mime:"text/html",         icon:"▭",
            hint:"Barra superior del reporte — pégala en otro visual HTML Content",
            content:()=>generateHeaderHTML(hdrCfg,ct,navCfg)},
    daxnav:{label:"nav-medida.dax", mime:"text/plain",        icon:"⚡",
            hint:"Medida DAX para navegación dinámica — reemplaza en tu modelo",
            content:()=>generateNavDAX(navCfg)},
    readme:{label:"README.txt",     mime:"text/plain",        icon:"📋",
            hint:"Instrucciones paso a paso para recrear en Power BI Desktop",
            content:()=>buildReadme(els,ct,navCfg,CW,CH)},
    preview:{label:"design-preview.html",mime:"text/html",    icon:"🖼",
            hint:"Abre en el navegador — muestra el diseño completo con colores reales para usarlo como referencia al conectar datos en PBI Desktop",
            content:()=>generatePreviewHTML(els,ct,navCfg,hdrCfg,CW,CH)},
  };

  useEffect(()=>{
    if(blobUrl){URL.revokeObjectURL(blobUrl);}
    setBlobUrl(null);setBlobName("");
  },[activeTab]);

  const cur=files[activeTab];
  const text=cur.content();
  const acc=A.accent,acBg=A.accentBg,acL=A.accentLight;
  const GREEN="#16a34a";

  const copyText=()=>{
    navigator.clipboard.writeText(text)
      .then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2400);})
      .catch(()=>{
        const el=document.createElement("textarea");
        el.value=text;document.body.appendChild(el);el.select();
        document.execCommand("copy");document.body.removeChild(el);
        setCopied(true);setTimeout(()=>setCopied(false),2400);
      });
  };

  const generateBlob=()=>{
    if(blobUrl) URL.revokeObjectURL(blobUrl);
    const blob=cur.binary
      ?new Blob([buildPbit(els,ct,CW,CH,mobileEls,navCfg,hdrCfg)],{type:cur.mime})
      :new Blob([text],{type:cur.mime});
    setBlobUrl(URL.createObjectURL(blob));
    setBlobName(cur.label);
  };

  // Construye el contenido binario de un archivo dado su key
  const fileBytes=(key)=>{
    const f=files[key];
    if(f.binary)return buildPbit(els,ct,CW,CH,mobileEls,navCfg,hdrCfg);
    return _utf8(f.content());
  };

  // Descarga múltiple: empaqueta los seleccionados en un ZIP
  const downloadSelected=()=>{
    const keys=Object.keys(selected).filter(k=>selected[k]);
    if(keys.length===0)return;
    if(keys.length===1){
      // Un solo archivo → descarga directa (sin ZIP)
      const f=files[keys[0]];
      const data=fileBytes(keys[0]);
      const blob=new Blob([data],{type:f.mime});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=f.label;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      return;
    }
    // Varios → ZIP
    const entries=keys.map(k=>({name:files[k].label,data:fileBytes(k)}));
    const zip=_buildZip(entries);
    if(zipUrl)URL.revokeObjectURL(zipUrl);
    const blob=new Blob([zip],{type:"application/zip"});
    const url=URL.createObjectURL(blob);
    setZipUrl(url);
    const a=document.createElement("a");a.href=url;a.download="pbi-designer-export.zip";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  };

  const selectedCount=Object.keys(selected).filter(k=>selected[k]).length;
  const allKeys=Object.keys(files);
  const allSelected=selectedCount===allKeys.length;
  const toggleAll=()=>{
    if(allSelected)setSelected({});
    else setSelected(Object.fromEntries(allKeys.map(k=>[k,true])));
  };

  const ready=blobUrl&&blobName===cur.label;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div style={{background:A.surface,border:`1px solid ${A.border}`,
        borderRadius:16,width:720,maxWidth:"94vw",maxHeight:"88vh",display:"flex",
        flexDirection:"column",overflow:"hidden",
        boxShadow:"0 40px 100px rgba(0,0,0,0.35)"}}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 24px 14px",borderBottom:`1px solid ${A.border}`,flexShrink:0}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:A.text}}>{T("Exportar a Power BI","Export to Power BI")}</div>
            <div style={{fontSize:9,color:A.textMuted,marginTop:3}}>
              {T("Selecciona archivo · cópialo o genera el link de descarga directa","Pick a file · copy it or generate the direct download link")}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Selector de idioma del export */}
            <div style={{display:"flex",background:A.bg,borderRadius:6,padding:2,border:`1px solid ${A.border2}`}}>
              {[["es","ES"],["en","EN"]].map(([code,lbl])=>(
                <button key={code} onClick={()=>setLang(code)}
                  style={{padding:"3px 9px",borderRadius:4,border:"none",cursor:"pointer",fontSize:9,fontWeight:lang===code?700:400,
                    background:lang===code?A.accent:"transparent",color:lang===code?"#fff":A.textMuted}}>{lbl}</button>
              ))}
            </div>
            <button type="button" onClick={onClose}
              style={{background:"none",border:"none",fontSize:22,cursor:"pointer",
                color:A.textMuted,lineHeight:1,padding:"4px 8px"}}>×</button>
          </div>
        </div>

        {/* PALETA CANVAS */}
        <div style={{padding:"9px 24px",borderBottom:`1px solid ${A.border}`,
          display:"flex",alignItems:"center",gap:9,background:acBg,flexShrink:0}}>
          <span style={{fontSize:8,color:A.textMuted,fontFamily:"monospace",flexShrink:0}}>CANVAS:</span>
          {[ct.canvas,ct.accent,ct.accent2,ct.secondary,ct.cardBg,ct.cardBorder]
            .filter(Boolean).map((c,i)=>(
            <div key={i} title={c} onClick={()=>navigator.clipboard?.writeText(c)}
              style={{width:16,height:16,borderRadius:3,background:c,
                border:`1px solid ${A.border2}`,cursor:"pointer",flexShrink:0}}/>
          ))}
          <span style={{fontSize:9,color:A.text,fontFamily:"monospace"}}>{ct.accent}</span>
          <span style={{marginLeft:"auto",fontSize:9,color:A.textMuted}}>
            {els.length} elem · nav: {navCfg.position}
          </span>
        </div>

        {/* TABS — con wrap + checkbox de selección para descarga múltiple */}
        <div style={{display:"flex",flexWrap:"wrap",padding:"12px 24px 8px",gap:5,flexShrink:0,alignItems:"center"}}>
          {Object.entries(files).map(([k,f])=>{
            const sel=!!selected[k];
            return(
              <div key={k} style={{display:"flex",alignItems:"center",
                border:`1.5px solid ${activeTab===k?acc:sel?GREEN:A.border}`,
                borderRadius:8,background:activeTab===k?acBg:sel?"rgba(22,163,74,0.06)":A.surface,
                overflow:"hidden",transition:"all 0.15s"}}>
                <button type="button" onClick={()=>setSelected(s=>({...s,[k]:!s[k]}))}
                  title={sel?"Quitar de la selección":"Agregar a la selección"}
                  style={{padding:"7px 4px 7px 9px",border:"none",background:"transparent",
                    cursor:"pointer",fontSize:11,lineHeight:1,color:sel?GREEN:A.textLight,display:"flex",alignItems:"center"}}>
                  {sel?"☑":"☐"}
                </button>
                <button type="button" onClick={()=>setActiveTab(k)}
                  style={{padding:"7px 12px 7px 4px",border:"none",background:"transparent",
                    color:activeTab===k?acc:A.textMuted,fontSize:9,cursor:"pointer",
                    fontFamily:"monospace",fontWeight:activeTab===k?700:400,
                    transition:"all 0.15s"}}>
                  {f.icon} {f.label}
                </button>
              </div>
            );
          })}
          {/* Seleccionar todo */}
          <button type="button" onClick={toggleAll}
            style={{padding:"6px 11px",borderRadius:8,border:`1.5px dashed ${A.border2}`,
              background:"transparent",color:A.textMuted,fontSize:8.5,cursor:"pointer",
              fontWeight:600,marginLeft:"auto"}}>
            {allSelected?"☒ Ninguno":"☑ Todos"}
          </button>
        </div>

        {/* BARRA DE DESCARGA MÚLTIPLE */}
        {selectedCount>0&&(
          <div style={{margin:"0 24px 4px",padding:"8px 14px",borderRadius:9,
            background:"rgba(22,163,74,0.08)",border:`1px solid ${rgba(GREEN,0.3)}`,
            display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <span style={{fontSize:9,color:"#166534",fontWeight:600,flex:1}}>
              {selectedCount===1
                ?T(`1 archivo seleccionado`,`1 file selected`)
                :T(`${selectedCount} archivos seleccionados`,`${selectedCount} files selected`)}
              {selectedCount>1&&T(" — se descargan juntos en un ZIP"," — downloaded together as a ZIP")}
            </span>
            <button type="button" onClick={()=>setSelected({})}
              style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${A.border2}`,
                background:A.surface,color:A.textMuted,fontSize:8.5,cursor:"pointer",fontWeight:600}}>
              {T("Limpiar","Clear")}
            </button>
            <button type="button" onClick={downloadSelected}
              style={{padding:"6px 16px",borderRadius:7,border:"none",
                background:"#16a34a",color:"#fff",fontSize:9.5,fontWeight:700,cursor:"pointer",
                display:"flex",alignItems:"center",gap:6,
                boxShadow:"0 3px 10px rgba(22,163,74,0.4)"}}>
              ↓ {selectedCount>1?T(`Descargar ${selectedCount} (ZIP)`,`Download ${selectedCount} (ZIP)`):T("Descargar","Download")}
            </button>
          </div>
        )}

        {/* CONTENIDO */}
        <div style={{margin:"0 24px",border:`1px solid ${acL}`,
          borderRadius:10,background:A.bg,
          display:"flex",flexDirection:"column",flex:1,minHeight:0,overflow:"hidden"}}>
          <div style={{padding:"6px 14px",borderBottom:`1px solid ${A.border}`,
            fontSize:8,color:A.textMuted,flexShrink:0,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>{cur.hint}</span>
            <span style={{fontFamily:"monospace",fontSize:7,color:acL}}>
              {(text.length/1024).toFixed(1)} KB
            </span>
          </div>
          <textarea readOnly value={text} onClick={e=>e.target.select()}
            style={{flex:1,background:"transparent",border:"none",color:A.text,
              padding:"10px 14px",fontSize:9,fontFamily:"'Courier New',monospace",
              resize:"none",outline:"none",lineHeight:1.65,minHeight:180}}/>
        </div>

        {/* LINK GENERADO — aparece tras hacer clic en Generar */}
        {ready&&(
          <div style={{margin:"10px 24px 0",padding:"11px 16px",borderRadius:10,
            background:"#f0fdf4",border:"1.5px solid #86efac",
            display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
            <span style={{fontSize:18,flexShrink:0}}>✅</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,fontWeight:700,color:"#166534"}}>
                Archivo listo — haz clic en el botón para descargarlo
              </div>
              <div style={{fontSize:8,color:"#15803d",marginTop:2,fontFamily:"monospace"}}>
                {blobName} · {(text.length/1024).toFixed(1)} KB
              </div>
            </div>
            <a href={blobUrl} download={blobName}
              style={{display:"inline-flex",alignItems:"center",gap:7,
                padding:"10px 20px",borderRadius:9,
                background:"#16a34a",color:"#fff",fontSize:11,fontWeight:700,
                textDecoration:"none",flexShrink:0,
                boxShadow:"0 4px 12px rgba(22,163,74,0.45)"}}>
              ↓ Descargar {blobName}
            </a>
          </div>
        )}

        {/* BOTONES */}
        <div style={{padding:"12px 24px 10px",display:"flex",gap:10,flexShrink:0}}>
          <button type="button" onClick={cur.binary?undefined:copyText} disabled={cur.binary}
            style={{flex:1,padding:"11px",borderRadius:9,
              background:copied?"#059669":A.surface,
              border:`1.5px solid ${copied?"#059669":A.border2}`,
              color:cur.binary?A.textLight:copied?"#fff":A.text,
              cursor:cur.binary?"not-allowed":"pointer",fontSize:10,fontWeight:600,
              opacity:cur.binary?0.5:1,
              transition:"all 0.2s",display:"flex",alignItems:"center",
              justifyContent:"center",gap:6}}>
            {cur.binary?"📦 Archivo binario — solo descarga":copied?"✓ ¡Copiado!":"📋 Copiar al portapapeles"}
          </button>
          <button type="button" onClick={generateBlob}
            style={{flex:1,padding:"11px",borderRadius:9,
              background:ready?"#15803d":acc,
              border:"none",color:"#fff",cursor:"pointer",
              fontSize:10,fontWeight:700,transition:"all 0.2s",
              display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              boxShadow:ready?"none":`0 4px 14px rgba(37,99,235,0.4)`}}>
            {ready?"✓ Ver link arriba ↑":"⬇ Generar link de descarga"}
          </button>
        </div>

        {/* INSTRUCCIÓN */}
        <div style={{padding:"0 24px 14px",flexShrink:0}}>
          <div style={{padding:"8px 14px",borderRadius:7,background:acBg,
            border:`1px solid ${acL}`,fontSize:8,color:A.textMuted,
            lineHeight:1.8,fontFamily:"'Segoe UI',sans-serif"}}>
            <b style={{color:acc}}>Pasos:</b>
            {" "}1. Clic en <b>⬇ Generar link</b>
            {" "}→ 2. Aparece botón verde arriba
            {" "}→ 3. Clic en <b>↓ Descargar</b>
            {" "}| Alternativa: <b>Copiar</b> → pega en Notepad → guarda como <code>{cur.label}</code>
          </div>
        </div>

      </div>
    </div>
  );
}
