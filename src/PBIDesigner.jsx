import { useState, useRef, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// APP SHELL THEMES
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
  slate:  { id:"slate",  icon:"🌑",  name:"Slate",
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
  purple: { id:"purple", icon:"🔮",  name:"Purple",
    bg:"#0e0b1e", surface:"#1a1430", topbar:"#0e0b1e", sidebar:"#1a1430",
    border:"#2d1f50", border2:"#3d2a6a",
    text:"#ede9fe", textMuted:"#a78bfa", textLight:"#6d5e9e",
    accent:"#a78bfa", accentBg:"#1e1640", accentLight:"#2d1b69",
    success:"#4ade80", danger:"#fb7185",
    bubbleUser:"#1e1640", bubbleAI:"#1a1430", inputBg:"#0e0b1e",
  },
  forest: { id:"forest", icon:"🌲",  name:"Forest",
    bg:"#081910", surface:"#0f2d18", topbar:"#081910", sidebar:"#0f2d18",
    border:"#1a4a28", border2:"#235e35",
    text:"#d1fae5", textMuted:"#6ee7b7", textLight:"#3d7d5c",
    accent:"#34d399", accentBg:"#0d3520", accentLight:"#065f3a",
    success:"#6ee7b7", danger:"#fca5a5",
    bubbleUser:"#0d3520", bubbleAI:"#0f2d18", inputBg:"#081910",
  },
};

// ═══════════════════════════════════════════════════════════════════
// CANVAS DEFAULT
// ═══════════════════════════════════════════════════════════════════
const CANVAS_DEFAULT = {
  canvas:"#ffffff", cardBg:"#ffffff", cardBorder:"#e2e8f0",
  accent:"#2563eb", accent2:"#1d4ed8", secondary:"#eff6ff",
  text:"#1e293b", textSub:"#64748b", textMuted:"#94a3b8",
  headerBg:"#2563eb", success:"#059669", danger:"#dc2626", warning:"#f59e0b",
  r:8,
};

const PALETTE=[
  {type:"kpi",    label:"KPI Card",    icon:"▣", color:"#2563eb"},
  {type:"bar",    label:"Bar Chart",   icon:"▦", color:"#7c3aed"},
  {type:"line",   label:"Line Chart",  icon:"📈", color:"#059669"},
  {type:"pie",    label:"Donut Chart", icon:"◎", color:"#d97706"},
  {type:"table",  label:"Table",       icon:"⊞", color:"#dc2626"},
  {type:"slicer", label:"Slicer",      icon:"⊟", color:"#0891b2"},
  {type:"card",   label:"Text Card",   icon:"☐", color:"#7c3aed"},
  {type:"nav",    label:"Nav Menu",    icon:"☰", color:"#059669"},
  {type:"header", label:"Header Bar",  icon:"▬", color:"#4f46e5"},
  {type:"image",  label:"Image/Logo",  icon:"🖼", color:"#ea580c"},
  {type:"button", label:"Button",      icon:"⬭", color:"#db2777"},
];
const DEF_SIZE={kpi:[170,88],bar:[320,215],line:[310,195],pie:[205,205],table:[310,215],slicer:[170,215],card:[205,120],nav:[190,550],header:[940,58],image:[165,125],button:[145,44]};

const GRID=8;
const snap=v=>Math.round(v/GRID)*GRID;
const HANDLES=[
  ["nw-resize",1,1,-1,-1],["n-resize",0,1,0,-1],["ne-resize",-1,1,1,-1],
  ["w-resize",1,0,-1,0],                          ["e-resize",-1,0,1,0],
  ["sw-resize",1,-1,-1,1],["s-resize",0,-1,0,1],  ["se-resize",-1,-1,1,1],
];
const HPOS=[[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]];
const MIN_W=60,MIN_H=40;

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
function fileIcon(n=""){
  if(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(n))return"🖼";
  if(/\.json$/i.test(n))return"📄";
  if(/\.pdf$/i.test(n))return"📕";
  if(/\.(xlsx|xls|csv)$/i.test(n))return"📊";
  return"📎";
}
async function readFile(file){
  if(file.type.startsWith("image/")){
    const b64=await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.readAsDataURL(file);});
    return{type:"image",name:file.name,mediaType:file.type,base64:b64};
  }
  return{type:"text",name:file.name,content:await file.text()};
}

function buildThemeJson(ct) {
  // Función para asegurar color HEX válido (6 dígitos con #)
  const safeHex = (c, fallback = "#ffffff") => {
    if (!c || typeof c !== "string") return fallback;
    let clean = c.trim().toLowerCase();
    // Si ya es #rrggbb válido
    if (/^#[0-9a-f]{6}$/.test(clean)) return clean;
    // Si es #rgb, expandir a #rrggbb
    if (/^#[0-9a-f]{3}$/.test(clean)) {
      const r = clean[1], g = clean[2], b = clean[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    // Si es rgb sin #
    if (/^[0-9a-f]{6}$/.test(clean)) return `#${clean}`;
    // Si es rgb sin # de 3 dígitos
    if (/^[0-9a-f]{3}$/.test(clean)) {
      return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
    }
    return fallback;
  };

  // Colores base con fallbacks seguros
  const canvas   = safeHex(ct.canvas,   "#ffffff");
  const accent   = safeHex(ct.accent,   "#2563eb");
  const accent2  = safeHex(ct.accent2,  "#1d4ed8");
  const secondary= safeHex(ct.secondary, "#eff6ff");
  const textCol  = safeHex(ct.text,     "#1e293b");
  const textSub  = safeHex(ct.textSub,  "#64748b");
  const success  = safeHex(ct.success,  "#059669");
  const danger   = safeHex(ct.danger,   "#dc2626");
  const warning  = safeHex(ct.warning,  "#f59e0b");

  // Paleta de colores: mínimo 8 colores
  const dataColors = [
    accent, accent2, success, warning, danger,
    "#3b82f6", "#8b5cf6", "#10b981"
  ];

  // Tema simplificado (sin visualStyles complejos para evitar errores)
  return {
    name: "PBI Designer",
    dataColors: dataColors,
    background: canvas,
    foreground: textCol,
    tableAccent: accent,
    textClasses: {
      title: {
        fontFace: "Segoe UI",
        fontSize: 18,
        bold: true,
        color: textCol
      },
      header: {
        fontFace: "Segoe UI",
        fontSize: 11,
        bold: true,
        color: textCol
      },
      body: {
        fontFace: "Segoe UI",
        fontSize: 10,
        bold: false,
        color: textSub
      },
      callout: {
        fontFace: "Segoe UI",
        fontSize: 28,
        bold: true,
        color: accent
      }
    }
  };
}

function buildLayoutJson(els,ct,navCfg,hdrCfg){
  const pbiMap={kpi:"card",bar:"barChart",line:"lineChart",pie:"donutChart",table:"tableEx",slicer:"slicer",nav:"actionButton",card:"textbox",button:"actionButton",image:"image",header:"shape"};
  return{metadata:{tool:"PBI Designer v1.5",exportedAt:new Date().toISOString()},page:{width:960,height:580,background:ct.canvas},colors:{accent:ct.accent,cardBg:ct.cardBg,text:ct.text},header:hdrCfg,navigation:navCfg,elements:els.map(e=>({id:e.id,type:e.type,label:e.label,position:{x:e.x,y:e.y},size:{width:e.w,height:e.h},powerBIVisual:pbiMap[e.type]||"textbox"}))};
}
function buildReadme(els,ct,navCfg){
  return`PBI Designer v1.5 — Export Guide
===================================
Canvas BG  : ${ct.canvas}
Accent     : ${ct.accent}
Elements   : ${els.length}   Nav: ${navCfg.position} / ${navCfg.style}
Exported   : ${new Date().toLocaleString()}

STEP 1 — Import Theme
  Power BI Desktop → View → Themes → Browse for themes → pbi-theme.json

STEP 2 — Set Page Size
  Format pane → Canvas settings → Custom → 960 × 580 px
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
//function dlUri(n,c,m){const a=document.createElement("a");a.href="data:"+m+";charset=utf-8,"+encodeURIComponent(c);
//  a.download=n;document.body.appendChild(a);a.click();document.body.removeChild(a);}
function dlUri(name, content, mime) {
  // Convertir string a Uint8Array para evitar BOM
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const blob = new Blob([data], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════
// AI SYSTEM PROMPT (mejorado para forzar formato estándar)
// ═══════════════════════════════════════════════════════════════════
const AI_SYS = `Eres un arquitecto de dashboards de Power BI. Cuando el usuario pida crear o modificar un dashboard, DEBES responder ÚNICAMENTE con un bloque <LAYOUT> que contenga el JSON completo del diseño. NUNCA añadas texto fuera del bloque.
El JSON debe incluir: canvasThemeId (opcional), header, navConfig y elements.
CADA elemento debe usar las propiedades: id (número), type (string), x (número), y (número), w (ancho en px), h (alto en px), label (texto).
NO uses width, height, displayName ni fields.

Ejemplo de respuesta CORRECTA:
<LAYOUT>{"canvasThemeId":"clean","header":{"show":true,"title":"Mi Dashboard","subtitle":"Ventas","height":58,"bgColor":""},"navConfig":{"position":"left","style":"static","width":190},"elements":[{"id":1,"type":"kpi","x":10,"y":10,"w":180,"h":90,"label":"Ventas"}]}</LAYOUT>

Si el usuario hace una pregunta normal (como "hola" o "¿estás listo?"), responde en lenguaje natural sin el bloque.`;

async function callAI(msgs){
  try{
    const token = localStorage.getItem('token');
    if (!token) {
      return { text: "Error: No has iniciado sesión", layout: null };
    }
    const response = await fetch('http://localhost:3001/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: msgs,
        system: AI_SYS
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return { text: `Error ${response.status}: ${data.error || 'Desconocido'}`, layout: null };
    }
    return { text: data.text, layout: data.layout };
  } catch(e){
    console.error('callAI error:', e);
    return { text: `Error de red: ${e.message}`, layout: null };
  }
}

// ═══════════════════════════════════════════════════════════════════
// VISUALS (KPICard, BarChart, LineChart, etc.) - se mantienen igual
// (omitidos por brevedad, pero están en el código original completo)
// ═══════════════════════════════════════════════════════════════════
function DEFAULT_DATA() {
  const randomValue = (Math.random() * 1000).toFixed(0);
  const randomChange = (Math.random() * 20 - 10).toFixed(1);
  const isUp = randomChange > 0;
  const trend = [20, 30, 40, 50, 60, 70].map(v => v * (Math.random() * 0.5 + 0.75));
  return [`$${randomValue}K`, Math.abs(randomChange), isUp, trend];
}

function KPICard({el, ct}) {
  // Datos predefinidos para algunos labels
  const PREDEFINED = {
    "Total Revenue": ["$2.41M", 12.3, true, [1.8,2.0,1.9,2.1,2.2,2.41]],
    "Units Sold": ["8,432", 5.7, true, [6.5,7.1,7.4,7.9,8.1,8.4]],
    "Avg. Deal": ["$28.6K", -2.1, false, [31,30,29.5,29,28.8,28.6]],
    "Win Rate %": ["34.8%", 1.2, true, [32,33,33.5,34,34.5,34.8]],
    "Producción Diaria": ["1,240", 5.2, true, [1100,1150,1180,1200,1220,1240]],
    "Unidades Producidas": ["1,240", 5.2, true, [1100,1150,1180,1200,1220,1240]],
    "Eficiencia de Línea": ["94.2%", 2.1, true, [89,91,92,93,93.5,94.2]],
    "Tasa de Defectos": ["3.8%", -1.2, false, [4.5,4.2,4.0,3.9,3.8,3.7]],
    "Tiempo de Ciclo": ["28.4min", -3.5, true, [32,31,30,29,28.5,28.4]],
    "Nivel de Inventario": ["2,450", 8.3, true, [2100,2200,2300,2350,2400,2450]]
  };

  // Generar datos por defecto (random pero realistas)
  const getDefaultData = (label) => {
    let value, change, isUp, trend;
    if (label.toLowerCase().includes('porcentaje') || label.toLowerCase().includes('tasa') || label.includes('%')) {
      value = `${(Math.random() * 30 + 70).toFixed(1)}%`;
      change = (Math.random() * 10 - 5).toFixed(1);
      isUp = change > 0;
      trend = [70,72,75,78,80,82].map(v => v * (0.8 + Math.random() * 0.4));
    } else if (label.toLowerCase().includes('tiempo') || label.toLowerCase().includes('ciclo')) {
      value = `${(Math.random() * 30 + 15).toFixed(0)}min`;
      change = (Math.random() * 10 - 5).toFixed(1);
      isUp = change > 0;
      trend = [25,24,23,22,21,20].map(v => v * (0.9 + Math.random() * 0.2));
    } else if (label.toLowerCase().includes('unidades') || label.toLowerCase().includes('producción')) {
      value = `${Math.floor(Math.random() * 2000 + 500)}`;
      change = (Math.random() * 20 - 10).toFixed(1);
      isUp = change > 0;
      trend = [500,700,900,1100,1200,1300].map(v => v * (0.8 + Math.random() * 0.4));
    } else {
      value = `$${(Math.random() * 500 + 100).toFixed(0)}K`;
      change = (Math.random() * 20 - 10).toFixed(1);
      isUp = change > 0;
      trend = [100,150,200,250,300,350].map(v => v * (0.7 + Math.random() * 0.6));
    }
    return [value, Math.abs(change), isUp, trend];
  };

  const [v, chg, up, pts] = PREDEFINED[el.label] || getDefaultData(el.label);
  const W = 58, H = 22;
  const mn = Math.min(...pts);
  const mx = Math.max(...pts);
  const rng = mx - mn || 1;
  const sp = pts.map((p, i) => `${(i / (pts.length - 1)) * W},${H - ((p - mn) / rng) * H}`).join(" ");

  return (
    <div style={{ width: "100%", height: "100%", background: ct.cardBg, border: `1px solid ${ct.cardBorder}`, borderRadius: ct.r, padding: "11px 13px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", boxSizing: "border-box" }}>
      <div style={{ fontSize: 8, color: ct.textMuted, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'Segoe UI', sans-serif", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: Math.max(15, Math.min(26, el.w / 7)), fontWeight: 700, color: ct.text, letterSpacing: -0.5, lineHeight: 1.1, fontFamily: "'Segoe UI', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
          {el.h > 70 && <div style={{ fontSize: 9, color: up ? ct.success : ct.danger, display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
            <span>{up ? "▲" : "▼"}</span>
            <span style={{ fontWeight: 600 }}>{Math.abs(chg)}%</span>
            <span style={{ color: ct.textMuted, marginLeft: 2 }}>vs prev</span>
          </div>}
        </div>
        {el.w > 120 && el.h > 65 && <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ flexShrink: 0, marginLeft: 6 }}>
          <polyline points={sp} fill="none" stroke={up ? ct.success : ct.danger} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
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
            {[0,1,2,3,4].map(i=><div key={i} style={{height:1,background:ct.cardBorder,opacity:0.7}}/>)}
          </div>
          <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:3,paddingBottom:16,paddingTop:2,overflow:"hidden"}}>
            {vis.map((d,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:2,height:"100%",minWidth:0}}>
                <div style={{position:"relative",width:"68%",height:`${(d.v/mx)*100}%`,background:`linear-gradient(180deg,${ct.accent},${ct.accent2||ct.accent})`,borderRadius:"2px 2px 0 0",minHeight:2}}>
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
        <defs><linearGradient id={`g${el.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ct.accent} stopOpacity="0.22"/><stop offset="100%" stopColor={ct.accent} stopOpacity="0.02"/></linearGradient></defs>
        {[.25,.5,.75,1].map(t=><line key={t} x1="0" y1={H*(1-t)} x2={W} y2={H*(1-t)} stroke={ct.cardBorder} strokeWidth="0.6" opacity="0.8"/>)}
        <polygon points={`0,${H} ${path} ${W},${H}`} fill={`url(#g${el.id})`}/>
        <polyline points={path} fill="none" stroke={ct.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {el.w>200&&pts.map((p,i)=><circle key={i} cx={(i/(pts.length-1))*W} cy={H-((p-mn)/rng)*H} r="2.5" fill={ct.accent} stroke={ct.cardBg} strokeWidth="1.5"/>)}
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

function TableViz({el, ct}) {
  // Generar datos dummy según el contexto
  const generateRows = (label) => {
    if (label.toLowerCase().includes("producción") || label.toLowerCase().includes("lote")) {
      return [
        ["Lote A", "Línea 1", "1,240", "98.2%", "0.8%"],
        ["Lote B", "Línea 1", "1,180", "97.5%", "1.2%"],
        ["Lote C", "Línea 2", "1,350", "99.1%", "0.5%"],
        ["Lote D", "Línea 2", "1,210", "96.8%", "1.5%"],
        ["Lote E", "Línea 3", "1,090", "98.7%", "0.9%"]
      ];
    }
    // Datos por defecto
    return [
      ["Producto A", "Categoría 1", "$12,400", "324", "12%"],
      ["Producto B", "Categoría 2", "$8,700", "580", "8%"],
      ["Producto C", "Categoría 1", "$15,300", "418", "15%"],
      ["Producto D", "Categoría 3", "$9,800", "340", "10%"]
    ];
  };

  const cols = ["Item", "Detalle", "Valor", "Cantidad", "Margen"];
  const rows = generateRows(el.label);
  const vC = Math.max(2, Math.floor((el.w - 24) / 75));
  const vR = Math.max(2, Math.floor((el.h - 52) / 24));

  return (
    <div style={{ width: "100%", height: "100%", background: ct.cardBg, border: `1px solid ${ct.cardBorder}`, borderRadius: ct.r, overflow: "hidden", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: ct.text, padding: "10px 12px 6px", flexShrink: 0, fontFamily: "'Segoe UI', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.label}</div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${vC}, 1fr)`, background: rgba(ct.accent, 0.08), borderBottom: `2px solid ${rgba(ct.accent, 0.3)}`, flexShrink: 0 }}>
          {cols.slice(0, vC).map(c => <div key={c} style={{ padding: "5px 10px", fontSize: 9, fontWeight: 700, color: ct.accent, fontFamily: "'Segoe UI', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c} <span style={{ opacity: 0.4, fontSize: 7 }}>⇅</span></div>)}
        </div>
        {rows.slice(0, vR).map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${vC}, 1fr)`, background: i % 2 === 1 ? rgba(ct.accent, 0.03) : "transparent", borderBottom: `1px solid ${rgba(ct.cardBorder, 0.6)}`, flexShrink: 0 }}>
            {row.slice(0, vC).map((cell, j) => <div key={j} style={{ padding: "5px 10px", fontSize: 9, color: j === 0 ? ct.text : ct.textSub, fontFamily: j > 1 ? "monospace" : "'Segoe UI', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: j === 0 ? 500 : 400 }}>{cell}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}
function SlicerViz({el,ct}){
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
  const items=[{l:"Dashboard",i:"⊞"},{l:"Analytics",i:"📊"},{l:"Finance",i:"💰"},{l:"HR",i:"👥"},{l:"Reports",i:"📋"},{l:"Settings",i:"⚙"}];
  const horiz=navCfg?.position==="top";
  return(
    <div style={{width:"100%",height:"100%",background:rgba(ct.secondary,0.9),borderRadius:ct.r,border:`1px solid ${ct.cardBorder}`,overflow:"hidden",display:"flex",flexDirection:horiz?"row":"column"}}>
      {!horiz&&<div style={{padding:"14px 12px 10px",borderBottom:`1px solid ${ct.cardBorder}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,borderRadius:6,background:`linear-gradient(135deg,${ct.accent},${ct.accent2||ct.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",flexShrink:0}}>⬡</div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:ct.accent,whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>Analytics Hub</div>
            <div style={{fontSize:7,color:ct.textMuted,fontFamily:"monospace",letterSpacing:0.8}}>POWER BI</div>
          </div>
        </div>
      </div>}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:horiz?"row":"column",padding:horiz?"0":"6px 0"}}>
        {items.map((item,idx)=>(
          <div key={item.l} style={{display:"flex",alignItems:"center",gap:7,padding:horiz?"8px 14px":"7px 12px",background:idx===0?rgba(ct.accent,0.12):"transparent",borderLeft:!horiz?`3px solid ${idx===0?ct.accent:"transparent"}`:"none",borderBottom:horiz?`2px solid ${idx===0?ct.accent:"transparent"}`:"none",flexShrink:0}}>
            <span style={{fontSize:11}}>{item.i}</span>
            <span style={{fontSize:9,color:idx===0?ct.text:ct.textSub,fontFamily:"'Segoe UI',sans-serif",fontWeight:idx===0?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.l}</span>
          </div>
        ))}
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

function Visual({el,ct,navCfg,hdrCfg}){
  switch(el.type){
    case"kpi":return <KPICard el={el} ct={ct}/>;
    case"bar":return <BarChart el={el} ct={ct}/>;
    case"line":return <LineChart el={el} ct={ct}/>;
    case"pie":return <DonutChart el={el} ct={ct}/>;
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
// CANVAS ELEMENT
// ═══════════════════════════════════════════════════════════════════
function CanvasEl({el,ct,selected,onSelect,onUpdate,onCommit,snapGrid,navCfg,hdrCfg,zoom}){
  const op=useRef({mode:null,sx:0,sy:0,ox:0,oy:0,ow:0,oh:0,hdx:0,hdy:0,hdw:0,hdh:0});
  const beginDrag=e=>{
    e.stopPropagation();
    onSelect(el.id);
    op.current={mode:"drag",sx:e.clientX,sy:e.clientY,ox:el.x,oy:el.y,ow:el.w,oh:el.h};
    bind();
  };
  const beginResize=(e,hi)=>{
    e.stopPropagation();e.preventDefault();
    const[,dx,dy,dw,dh]=HANDLES[hi];
    op.current={mode:"resize",sx:e.clientX,sy:e.clientY,ox:el.x,oy:el.y,ow:el.w,oh:el.h,hdx:dx,hdy:dy,hdw:dw,hdh:dh};
    bind();
  };
  const bind=()=>{
    const z=zoom;
    const mv=e=>{
      const ddx=(e.clientX-op.current.sx)/z;
      const ddy=(e.clientY-op.current.sy)/z;
      if(op.current.mode==="drag"){
        const nx=snapGrid?snap(op.current.ox+ddx):Math.round(op.current.ox+ddx);
        const ny=snapGrid?snap(op.current.oy+ddy):Math.round(op.current.oy+ddy);
        onUpdate(el.id,{x:Math.max(0,nx),y:Math.max(0,ny)});
      }else{
        let nw=Math.max(MIN_W,Math.round(op.current.ow+ddx*op.current.hdw));
        let nh=Math.max(MIN_H,Math.round(op.current.oh+ddy*op.current.hdh));
        if(snapGrid){nw=Math.max(MIN_W,snap(nw));nh=Math.max(MIN_H,snap(nh));}
        const nx=op.current.hdx?Math.max(0,Math.round(op.current.ox+ddx*op.current.hdx)):op.current.ox;
        const ny=op.current.hdy?Math.max(0,Math.round(op.current.oy+ddy*op.current.hdy)):op.current.oy;
        onUpdate(el.id,{x:nx,y:ny,w:nw,h:nh});
      }
    };
    const up=()=>{onCommit?.();window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",up);
  };
  const HS=14;
  return(
    <div onMouseDown={beginDrag} style={{position:"absolute",left:el.x,top:el.y,width:el.w,height:el.h,cursor:"move",userSelect:"none",overflow:"visible",zIndex:selected?200:1}}>
      <div style={{position:"absolute",inset:0,overflow:"hidden",borderRadius:ct.r,pointerEvents:"none",boxShadow:selected?`0 0 0 2px ${ct.accent}, 0 0 0 5px ${rgba(ct.accent,0.2)}, 0 4px 20px rgba(0,0,0,0.15)`: `0 1px 4px rgba(0,0,0,0.08)`,transition:"box-shadow 0.1s"}}>
        <Visual el={el} ct={ct} navCfg={navCfg} hdrCfg={hdrCfg}/>
      </div>
      {selected&&HPOS.map(([lf,tp],i)=>(
        <div key={i} onMouseDown={e=>beginResize(e,i)} style={{position:"absolute",left:`calc(${lf*100}% - ${HS/2}px)`,top:`calc(${tp*100}% - ${HS/2}px)`,width:HS,height:HS,background:"#ffffff",border:`2.5px solid ${ct.accent}`,borderRadius:3,cursor:HANDLES[i][0],zIndex:500,boxShadow:"0 2px 6px rgba(0,0,0,0.3)",transition:"transform 0.1s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.5)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>
      ))}
    </div>
  );
}

// ── PRESETS (simplificado) ──
const PRESETS={
  sales:{ct:{...CANVAS_DEFAULT,accent:"#0ea5e9",accent2:"#0284c7",secondary:"#e0f2fe",headerBg:"#0c4a6e",cardBorder:"#bae6fd"},nav:{position:"left",style:"collapsible",width:190,exportSeparate:false},header:{show:true,title:"Sales Dashboard",subtitle:"Revenue · Units · Pipeline",height:58,bgColor:"#0c4a6e"},els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Sales Dashboard"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navigation"},{id:3,type:"kpi",x:198,y:66,w:180,h:88,label:"Total Revenue"},{id:4,type:"kpi",x:386,y:66,w:180,h:88,label:"Units Sold"},{id:5,type:"kpi",x:574,y:66,w:180,h:88,label:"Avg. Deal"},{id:6,type:"kpi",x:762,y:66,w:190,h:88,label:"Win Rate %"},{id:7,type:"bar",x:198,y:162,w:370,h:205,label:"Revenue by Region"},{id:8,type:"line",x:576,y:162,w:376,h:205,label:"Monthly Trend"},{id:9,type:"slicer",x:198,y:375,w:170,h:197,label:"Period Filter"},{id:10,type:"pie",x:376,y:375,w:200,h:197,label:"By Segment"},{id:11,type:"table",x:584,y:375,w:368,h:197,label:"Top Deals"}]},
  finance:{ct:{...CANVAS_DEFAULT,canvas:"#0e0b1e",cardBg:"#1a1430",cardBorder:"#2d1f50",accent:"#a78bfa",accent2:"#8b5cf6",secondary:"#1e1640",text:"#ede9fe",textSub:"#a78bfa",textMuted:"#6d5e9e",headerBg:"#2d1b69",r:10},nav:{position:"left",style:"static",width:190,exportSeparate:false},header:{show:true,title:"Financial Overview",subtitle:"P&L · Cash Flow · Budget",height:58,bgColor:"#2d1b69"},els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Financial Overview"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navigation"},{id:3,type:"kpi",x:198,y:66,w:180,h:88,label:"Net Revenue"},{id:4,type:"kpi",x:386,y:66,w:180,h:88,label:"EBITDA"},{id:5,type:"kpi",x:574,y:66,w:180,h:88,label:"Net Margin"},{id:6,type:"kpi",x:762,y:66,w:190,h:88,label:"Cash Flow"},{id:7,type:"line",x:198,y:162,w:528,h:205,label:"P&L Monthly"},{id:8,type:"bar",x:734,y:162,w:218,h:205,label:"Expenses"},{id:9,type:"table",x:198,y:375,w:388,h:197,label:"Budget vs Actual"},{id:10,type:"pie",x:594,y:375,w:200,h:197,label:"Cost Centers"},{id:11,type:"slicer",x:802,y:375,w:150,h:197,label:"Quarter"}]},
};

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function PBIDesigner(){
  const[appThemeId,setAppThemeId]=useState("light");
  const A=APP_THEMES[appThemeId];
  const[ct,setCt]=useState({...CANVAS_DEFAULT});
  const[els,setEls]=useState([]);
  const[sel,setSel]=useState(null);
  const[zoom,setZoom]=useState(0.82);
  const[snapGrid,setSnapGrid]=useState(true);
  const[showGrid,setShowGrid]=useState(true);
  const[history,setHistory]=useState([[]]);
  const[histIdx,setHistIdx]=useState(0);
  const[msgs,setMsgs]=useState([{role:"ai",text:"¡Hola! Soy tu asistente de diseño para Power BI. 👋\n\nEl canvas arranca siempre en Clean Light. Solo cambia si tú lo pides.\n\nPuedes:\n• Describir el reporte: «Dashboard de ventas con menú izquierdo»\n• Pedir colores: «tema oscuro azul» o «acento verde corporativo»\n• Subir una imagen/captura de referencia\n• Cargar una plantilla desde el panel ⬡\n\n¿Con qué te ayudo hoy?"}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[aiOpen,setAiOpen]=useState(true);
  const[nextId,setNextId]=useState(50);
  const[exportModal,setExportModal]=useState(false);
  const[tab,setTab]=useState("elements");
  const[navCfg,setNavCfg]=useState({position:"left",style:"collapsible",width:190,exportSeparate:false});
  const[hdrCfg,setHdrCfg]=useState({show:false,title:"My Report",subtitle:"Business Intelligence Dashboard",height:58,bgColor:""});
  const[atts,setAtts]=useState([]);
  const[dragStatus,setDragStatus]=useState(null);
  const canvasRef=useRef(null);
  const chatEndRef=useRef(null);
  const fileRef=useRef(null);
  const selEl=els.find(e=>e.id===sel);
  const [exportActiveTab, setExportActiveTab] = useState("theme");

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const pushHistory=useCallback(newEls=>{
    setHistory(h=>{const n=h.slice(0,histIdx+1);n.push([...newEls]);return n;});
    setHistIdx(i=>i+1);
  },[histIdx]);
  const undo=useCallback(()=>{if(histIdx>0){const i=histIdx-1;setHistIdx(i);setEls([...history[i]]);}}, [histIdx,history]);
  const redo=useCallback(()=>{if(histIdx<history.length-1){const i=histIdx+1;setHistIdx(i);setEls([...history[i]]);}}, [histIdx,history]);

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
        setEls(a=>a.map(el=>el.id===sel?{...el,...Object.fromEntries(Object.entries(d[e.key]).map(([k,v])=>[k,Math.max(0,(el[k]||0)+v)]))}:el));
      }
    };
    window.addEventListener("keydown",kd);
    return()=>window.removeEventListener("keydown",kd);
  },[sel,undo,redo,pushHistory]);

  const updateEl=useCallback((id,patch)=>{
    setEls(a=>a.map(e=>e.id===id?{...e,...patch}:e));
    setDragStatus(s=>{const base=s||{};return{...base,...patch};});
  },[]);
  const commitEl=useCallback(()=>{
    setDragStatus(null);
    setEls(curr=>{pushHistory([...curr]);return curr;});
  },[pushHistory]);

  const handleDrop=e=>{
    const type=e.dataTransfer.getData("elementType");if(!type)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const rx=(e.clientX-rect.left)/zoom,ry=(e.clientY-rect.top)/zoom;
    const[w,h]=DEF_SIZE[type]||[160,100];
    const x=snapGrid?snap(Math.round(rx-w/2)):Math.round(rx-w/2);
    const y=snapGrid?snap(Math.round(ry-h/2)):Math.round(ry-h/2);
    const info=PALETTE.find(p=>p.type===type);
    const id=nextId;
    const newEl={id,type,x:Math.max(0,x),y:Math.max(0,y),w,h,label:info?.label||type};
    setEls(a=>{const n=[...a,newEl];pushHistory(n);return n;});
    setNextId(n=>n+1);setSel(id);
  };

  const handleFiles=async files=>{
    const r=[];for(const f of files){try{r.push(await readFile(f));}catch(e){}}
    setAtts(a=>[...a,...r]);
    if(r.length)setMsgs(m=>[...m,{role:"ai",text:`📎 ${r.length} archivo(s) listo(s): ${r.map(x=>x.name).join(", ")}.\nDescribe cómo usarlo — ej: «usa estos colores» o «recrea este layout».`}]);
  };
  const handlePaste=e=>{
    const imgs=[...e.clipboardData?.items||[]].filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);
    if(imgs.length)handleFiles(imgs);
  };

  // sendMsg con fallback mejorado para JSON suelto y normalización de atributos
  const sendMsg = async () => {
  if ((!input.trim() && atts.length === 0) || loading) return;
  const text = input.trim();
  setInput("");

  const userContent = [];
  atts.forEach(a => {
    if (a.type === "image") {
      userContent.push({ type: "image", source: { type: "base64", media_type: a.mediaType, data: a.base64 } });
    } else {
      userContent.push({ type: "text", text: `[File: ${a.name}]\n${a.content?.slice(0, 4000) || ""}` });
    }
  });

  let finalText = text;
  if (els.length > 0) {
    const elementSummary = els.slice(0, 5).map(e => `${e.type} (${e.x},${e.y})`).join(', ');
    finalText = `[Diseño actual: ${els.length} elementos - ${elementSummary}${els.length > 5 ? '...' : ''}]. ${text}`;
  }
  if (finalText) userContent.push({ type: "text", text: finalText });

  setMsgs(prev => [...prev, { role: "user", text: [atts.map(a => `📎 ${a.name}`).join(" "), text].filter(Boolean).join("\n"), atts: [...atts] }]);
  setAtts([]);
  setLoading(true);

  const hist = msgs.slice(-6).map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));

  try {
    const { text: aiText, layout } = await callAI(hist.concat([{ role: "user", content: userContent.length === 1 && userContent[0].type === "text" ? userContent[0].text : userContent }]));

    console.log('📦 Layout recibido del backend:', layout);

    if (layout && layout.elements && layout.elements.length > 0) {
      // Mapeo de tipos no estándar
      const typeMap = {
        "lineChart": "line",
        "gauge": "kpi",
        "waterfall": "bar",
        "scatter": "line",
        "ribbon": "line",
        "map": "image",
        "funnel": "bar",
        "donut": "pie"
      };

      let newEls = layout.elements.map(el => ({
        id: el.id || Math.random(),
        type: typeMap[el.type] || el.type || "kpi",
        x: el.x || 0,
        y: el.y || 0,
        w: el.w || 160,
        h: el.h || 90,
        label: el.label || "Elemento"
      }));

      // --- NORMALIZACIÓN DE COORDENADAS (reubica, no descarta) ---
      const navWidth = layout.navConfig?.width || 190;
      const headerHeight = layout.header?.height || 58;
      const gap = 8;
      const margin = 8;

      // 1. Reorganizar KPIs
      const kpis = newEls.filter(el => el.type === "kpi");
      if (kpis.length > 0) {
        const contentWidth = 960 - navWidth - margin * 2;
        const totalGaps = (kpis.length - 1) * gap;
        const kpiWidth = Math.floor((contentWidth - totalGaps) / kpis.length);
        const startX = navWidth + margin;
        const startY = headerHeight + margin;
        kpis.forEach((el, idx) => {
          el.x = startX + idx * (kpiWidth + gap);
          el.y = startY;
          el.w = kpiWidth;
          el.h = 90;
        });
      }

      // 2. Gráficos en dos columnas
      const charts = newEls.filter(el => (el.type === "bar" || el.type === "line" || el.type === "pie") && el.y < 250);
      if (charts.length > 0) {
        const chartWidth = Math.floor((960 - navWidth - margin * 3) / 2);
        const startX = navWidth + margin;
        const startY = (kpis.length > 0 ? (headerHeight + margin + 90 + gap) : (headerHeight + margin));
        charts.forEach((el, idx) => {
          const col = idx % 2;
          el.x = startX + col * (chartWidth + gap);
          el.y = startY;
          el.w = chartWidth;
          el.h = 210;
        });
      }

      // 3. Tablas en la parte inferior
      const tables = newEls.filter(el => el.type === "table");
      if (tables.length > 0) {
        const startY = (charts.length > 0 ? (headerHeight + margin + 90 + gap + 210 + gap) : (headerHeight + margin + 90 + gap));
        tables.forEach((el, idx) => {
          el.x = navWidth + margin;
          el.y = startY + idx * (200 + gap);
          el.w = 960 - navWidth - margin * 2;
          el.h = 180;
        });
      }

      // 4. Reubicar cualquier elemento que quede fuera del canvas (en lugar de descartarlo)
      const finalElements = newEls.map(el => {
        let { x, y, w, h } = el;
        if (x < 0) x = 0;
        if (x + w > 960) x = 960 - w;
        if (y < 0) y = 0;
        if (y + h > 580) y = 580 - h;
        if (w <= 0) w = 160;
        if (h <= 0) h = 90;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + w > 960) w = 960 - x;
        if (y + h > 580) h = 580 - y;
        return { ...el, x, y, w, h };
      });

      console.log(`🎨 Aplicando ${finalElements.length} elementos (reubicados si fue necesario)`, finalElements);
      setEls(finalElements);
      pushHistory(finalElements);
      const maxId = Math.max(...finalElements.map(e => e.id), 0);
      setNextId(maxId + 1);
      setSel(null);

      if (layout.header) setHdrCfg(h => ({ ...h, ...layout.header }));
      if (layout.navConfig) setNavCfg(n => ({ ...n, ...layout.navConfig }));
    } else {
      console.warn('⚠️ El layout no contiene elementos o es nulo:', layout);
    }

    setMsgs(prev => [...prev, { role: "ai", text: aiText || (layout?.elements?.length ? "✅ Dashboard creado." : "No se generaron elementos. Intenta con más detalles.") }]);
  } catch (error) {
    console.error('Error en sendMsg:', error);
    setMsgs(prev => [...prev, { role: "ai", text: `Error: ${error.message}` }]);
  } finally {
    setLoading(false);
  }
};

  const loadPreset=key=>{
    const p=PRESETS[key];if(!p)return;
    setCt({...CANVAS_DEFAULT,...p.ct});
    setNavCfg(p.nav);setHdrCfg(p.header);
    const newEls=p.els.map(e=>({...e}));
    setEls(newEls);pushHistory(newEls);setSel(null);
    setMsgs(m=>[...m,{role:"ai",text:`✅ Plantilla "${key}" cargada — ${p.els.length} elementos.`}]);
  };

  const downloadAll=()=>{
    dlUri("pbi-theme.json",JSON.stringify(buildThemeJson(ct),null,2),"application/json");
    dlUri("pbi-layout.json",JSON.stringify(buildLayoutJson(els,ct,navCfg,hdrCfg),null,2),"application/json");
    dlUri("README.txt",buildReadme(els,ct,navCfg),"text/plain");
    if(navCfg.exportSeparate)dlUri("pbi-nav.json",JSON.stringify({navigation:{...navCfg,accent:ct.accent}},null,2),"application/json");
  };

  const copyToClipboard=async(text)=>{
    try{
      await navigator.clipboard.writeText(text);
      alert("Copiado al portapapeles");
    }catch(err){
      const textarea=document.createElement("textarea");
      textarea.value=text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Copiado al portapapeles");
    }
  };

  const getExportText=()=>{
    if(exportActiveTab==="theme") return JSON.stringify(buildThemeJson(ct),null,2);
    if(exportActiveTab==="layout") return JSON.stringify(buildLayoutJson(els,ct,navCfg,hdrCfg),null,2);
    return buildReadme(els,ct,navCfg);
  };

  const B=(x={})=>({padding:"5px 10px",background:A.surface,border:`1px solid ${A.border2}`,color:A.textMuted,borderRadius:6,cursor:"pointer",fontSize:9,fontFamily:"'Segoe UI',sans-serif",...x});
  const PB=(x={})=>({padding:"5px 13px",background:A.accent,border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontSize:9,fontWeight:700,...x});
  const IS={background:A.surface,border:`1px solid ${A.border2}`,color:A.text,borderRadius:5,padding:"4px 8px",fontSize:9,fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box"};
  const LS={fontSize:8,color:A.textMuted,fontFamily:"monospace",letterSpacing:0.4,marginBottom:3,display:"block",textTransform:"uppercase"};

  return (
    <div style={{width:"100vw",height:"100vh",background:A.bg,display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',system-ui,sans-serif",color:A.text,position:"relative"}}>
      {/* TOPBAR */}
      <div style={{height:48,background:A.topbar,borderBottom:`1px solid ${A.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:8,zIndex:1000,flexShrink:0,boxShadow:`0 1px 3px ${rgba(A.accent,0.07)}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:6}}>
          <div style={{width:26,height:26,borderRadius:6,background:`linear-gradient(135deg,${A.accent},${adjHex(A.accent,0.75)})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900,flexShrink:0}}>⬡</div>
          <div><div style={{fontSize:11,fontWeight:800,color:A.text,lineHeight:1.1}}>PBI Designer</div><div style={{fontSize:7,color:A.textLight,fontFamily:"monospace",letterSpacing:0.8}}>v1.5 · AI</div></div>
        </div>
        <div style={{width:1,height:22,background:A.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:8,color:A.textMuted,fontFamily:"monospace",flexShrink:0}}>UI</span>
          {Object.values(APP_THEMES).map(t=>(
            <button key={t.id} onClick={()=>setAppThemeId(t.id)} title={t.name}
              style={{width:24,height:24,borderRadius:5,background:t.surface,border:`2px solid ${appThemeId===t.id?A.accent:A.border}`,cursor:"pointer",fontSize:12,transition:"all 0.15s",transform:appThemeId===t.id?"scale(1.2)":"scale(1)",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.icon}</button>
          ))}
        </div>
        <div style={{width:1,height:22,background:A.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <button onClick={()=>setZoom(z=>+(Math.max(0.3,z-0.1)).toFixed(1))} style={B({width:22,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14})}>−</button>
          <span style={{fontSize:9,color:A.textMuted,fontFamily:"monospace",width:34,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>+(Math.min(2,z+0.1)).toFixed(1))} style={B({width:22,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14})}>+</button>
          <button onClick={()=>setZoom(0.82)} style={B({fontSize:8,padding:"0 6px",height:22})}>FIT</button>
        </div>
        <div style={{width:1,height:22,background:A.border}}/>
        {[["⊡",showGrid,"Grid",()=>setShowGrid(x=>!x)],["⊞",snapGrid,"Snap",()=>setSnapGrid(x=>!x)]].map(([ic,on,tip,fn])=>(
          <button key={tip} onClick={fn} title={`${tip} ${on?"ON":"OFF"}`} style={B({width:26,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,background:on?A.accentBg:A.surface,borderColor:on?A.accentLight:A.border2,color:on?A.accent:A.textLight})}>{ic}</button>
        ))}
        <div style={{width:1,height:22,background:A.border}}/>
        <button onClick={undo} disabled={histIdx===0} title="Ctrl+Z" style={B({width:24,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:histIdx===0?0.3:1})}>↩</button>
        <button onClick={redo} disabled={histIdx>=history.length-1} title="Ctrl+Y" style={B({width:24,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:histIdx>=history.length-1?0.3:1})}>↪</button>
        <span style={{fontSize:8,color:A.textLight,fontFamily:"monospace"}}>{els.length} elem</span>
        {dragStatus&&<span style={{fontSize:8,color:A.accent,background:A.accentBg,padding:"2px 7px",borderRadius:4,fontFamily:"monospace"}}>x:{dragStatus.x??""} y:{dragStatus.y??""}{dragStatus.w?` · ${dragStatus.w}×${dragStatus.h}`:""}</span>}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
          {sel&&<button onClick={()=>{setEls(a=>{const n=a.filter(e=>e.id!==sel);pushHistory(n);return n;});setSel(null);}} style={B({color:A.danger,borderColor:rgba(A.danger,0.3),background:rgba(A.danger,0.06)})}>🗑 Delete</button>}
          <button onClick={()=>setAiOpen(o=>!o)} style={B({color:A.accent,borderColor:A.accentLight,background:A.accentBg})}>{aiOpen?"◀ Ocultar IA":"▶ Chat IA"}</button>
          <button onClick={()=>setExportModal(true)} style={PB({boxShadow:`0 3px 10px ${rgba(A.accent,0.35)}`})}>↗ Exportar PBI</button>
        </div>
      </div>

      {/* BODY: LEFT PANEL + CANVAS + AI PANEL */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LEFT PANEL */}
        <div style={{width:162,background:A.sidebar,borderRight:`1px solid ${A.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{display:"flex",borderBottom:`1px solid ${A.border}`,flexShrink:0}}>
            {[["elements","⊞"],["properties","⚙"],["presets","⬡"]].map(([t,ic])=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px 0",background:tab===t?A.accentBg:"transparent",border:"none",color:tab===t?A.accent:A.textMuted,fontSize:12,cursor:"pointer",borderBottom:tab===t?`2px solid ${A.accent}`:"2px solid transparent",transition:"all 0.15s"}}>{ic}</button>
            ))}
          </div>
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
          {tab==="properties"&&(
            <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
              {!selEl
                ?<div style={{fontSize:9,color:A.textLight,textAlign:"center",padding:"24px 8px",lineHeight:2.1}}>Selecciona un<br/>elemento en el canvas</div>
                :(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",letterSpacing:1,padding:"3px 6px",background:A.accentBg,borderRadius:4,textAlign:"center",textTransform:"uppercase"}}>{selEl.type} #{selEl.id}</div>
                    {[["Label","label","text",selEl.label],["X px","x","number",selEl.x],["Y px","y","number",selEl.y],["Ancho","w","number",selEl.w],["Alto","h","number",selEl.h]].map(([l,f,t,v])=>(
                      <div key={f}>
                        <label style={LS}>{l}</label>
                        <input type={t} value={v} onChange={e=>updateEl(selEl.id,{[f]:f==="label"?e.target.value:Math.max(f==="x"||f==="y"?0:MIN_W,parseInt(e.target.value)||0)})} onBlur={commitEl} style={IS}/>
                      </div>
                    ))}
                    {selEl.type==="nav"&&(
                      <div style={{padding:"8px",background:A.bg,borderRadius:6,border:`1px solid ${A.border}`}}>
                        <div style={{fontSize:8,color:A.accent,fontFamily:"monospace",marginBottom:6}}>NAV CONFIG</div>
                        <label style={LS}>Posición</label>
                        <select value={navCfg.position} onChange={e=>setNavCfg(n=>({...n,position:e.target.value}))} style={{...IS,marginBottom:6}}>
                          <option value="left">Izquierda</option><option value="right">Derecha</option><option value="top">Superior</option><option value="none">Ninguno</option>
                        </select>
                        <label style={LS}>Estilo</label>
                        <select value={navCfg.style} onChange={e=>setNavCfg(n=>({...n,style:e.target.value}))} style={{...IS,marginBottom:7}}>
                          <option value="static">Estático</option><option value="collapsible">Colapsable</option><option value="floating">Flotante</option>
                        </select>
                        <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:8,color:A.textMuted}}>
                          <input type="checkbox" checked={navCfg.exportSeparate} onChange={e=>setNavCfg(n=>({...n,exportSeparate:e.target.checked}))} style={{accentColor:A.accent}}/>
                          Exportar nav separado
                        </label>
                      </div>
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
                    <button onClick={()=>{setEls(a=>{const n=a.filter(e=>e.id!==sel);pushHistory(n);return n;});setSel(null);}} style={B({color:A.danger,borderColor:rgba(A.danger,0.3),background:rgba(A.danger,0.06),width:"100%",marginTop:4})}>🗑 Eliminar</button>
                  </div>
                )
              }
            </div>
          )}
          {tab==="presets"&&(
            <div style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
              <div style={{fontSize:7,color:A.textLight,fontFamily:"monospace",letterSpacing:1,padding:"3px 6px 7px",textTransform:"uppercase"}}>Plantillas completas</div>
              {[{k:"sales",i:"📊",l:"Ventas",s:"Azul · Nav izq"},{k:"finance",i:"💰",l:"Finanzas",s:"Morado · Oscuro"}].map(p=>(
                <div key={p.k} onClick={()=>loadPreset(p.k)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px",borderRadius:6,background:A.bg,border:`1px solid ${A.border}`,cursor:"pointer",marginBottom:4,transition:"all 0.12s"}} onMouseEnter={e=>{e.currentTarget.style.background=A.accentBg;e.currentTarget.style.borderColor=A.accentLight;}} onMouseLeave={e=>{e.currentTarget.style.background=A.bg;e.currentTarget.style.borderColor=A.border;}}>
                  <span style={{fontSize:14}}>{p.i}</span>
                  <div><div style={{fontSize:9,color:A.text,fontWeight:600}}>{p.l}</div><div style={{fontSize:7,color:A.textMuted}}>{p.s}</div></div>
                </div>
              ))}
              <div style={{padding:"9px",borderRadius:6,background:A.accentBg,border:`1px dashed ${A.accentLight}`,fontSize:8,color:A.textMuted,lineHeight:1.7,textAlign:"center",marginTop:6}}>O describe el reporte<br/>en el chat IA 💬</div>
            </div>
          )}
        </div>

        {/* CANVAS */}
        <div style={{flex:1,overflow:"auto",background:showGrid?"repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(0,0,0,0.05) 31px,rgba(0,0,0,0.05) 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(0,0,0,0.05) 31px,rgba(0,0,0,0.05) 32px),#e2e8f0":"#e2e8f0"}} onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}} onDrop={handleDrop} onDragOver={e=>e.preventDefault()}>
          <div style={{padding:40,minWidth:"100%",minHeight:"100%",display:"inline-block"}} onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}}>
            <div ref={canvasRef} style={{position:"relative",width:960,height:580,background:ct.canvas,borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,0.16),0 0 0 1px rgba(0,0,0,0.05)",transform:`scale(${zoom})`,transformOrigin:"top left",marginRight:`${(zoom-1)*960}px`,marginBottom:`${(zoom-1)*580}px`}} onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:26,background:"rgba(0,0,0,0.025)",borderBottom:`1px solid ${ct.cardBorder}`,borderRadius:"12px 12px 0 0",display:"flex",alignItems:"center",padding:"0 10px",gap:4,zIndex:0,pointerEvents:"none"}}>
                {["#ef4444","#f59e0b","#10b981"].map((c,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:c,opacity:0.5}}/>)}
                <span style={{fontSize:8,color:ct.textMuted,marginLeft:7,fontFamily:"monospace",opacity:0.6}}>960 × 580 px</span>
                <span style={{marginLeft:"auto",fontSize:8,color:ct.textMuted,fontFamily:"monospace",opacity:0.4}}>{ct.canvas} · {ct.accent}</span>
              </div>
              <div style={{position:"absolute",inset:0,top:26}} onMouseDown={e=>{if(e.target===e.currentTarget)setSel(null);}}>
                {els.length===0&&(
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,pointerEvents:"none",opacity:0.35}}>
                    <div style={{fontSize:32,color:ct.textMuted}}>⬡</div>
                    <div style={{fontSize:11,color:ct.textSub,textAlign:"center",lineHeight:1.8,fontFamily:"'Segoe UI',sans-serif"}}>Describe tu reporte en el chat IA<br/>o arrastra elementos desde el panel izquierdo</div>
                  </div>
                )}
                {els.map(el=>(
                  <CanvasEl key={el.id} el={el} ct={ct} selected={sel===el.id} zoom={zoom} snapGrid={snapGrid} onSelect={setSel} onUpdate={updateEl} onCommit={commitEl} navCfg={navCfg} hdrCfg={hdrCfg}/>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI PANEL */}
        {aiOpen && (
          <div style={{ width: 292, background: A.sidebar, borderLeft: `1px solid ${A.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "9px 14px", borderBottom: `1px solid ${A.border}`, display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? "#f59e0b" : A.success, boxShadow: `0 0 5px ${loading ? "#f59e0b" : A.success}`, transition: "all 0.3s" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: A.text }}>AI Design Assistant</span>
              {loading && <span style={{ fontSize: 8, color: A.textMuted, marginLeft: "auto", fontFamily: "monospace", animation: "pulse 1s infinite" }}>generando…</span>}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 6 }}>
                  {m.role === "ai" && <div style={{ width: 20, height: 20, borderRadius: "50%", background: A.accentBg, border: `1px solid ${A.accentLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0, marginTop: 2 }}>⬡</div>}
                  <div style={{ maxWidth: "88%", padding: "8px 11px", borderRadius: m.role === "user" ? "10px 10px 3px 10px" : "3px 10px 10px 10px", background: m.role === "user" ? A.bubbleUser : A.bubbleAI, border: `1px solid ${m.role === "user" ? A.accentLight : A.border}`, fontSize: 10, color: A.text, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {m.atts?.length > 0 && (
                      <div style={{ marginBottom: 5, display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {m.atts.map((a, ai) => (
                          <span key={ai} style={{ fontSize: 8, padding: "2px 5px", background: A.accentBg, borderRadius: 4, color: A.accent, fontFamily: "monospace" }}>{fileIcon(a.name)} {a.name.slice(0, 16)}</span>
                        ))}
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: A.accentBg, border: `1px solid ${A.accentLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0 }}>⬡</div>
                  <div style={{ padding: "8px 14px", borderRadius: "3px 10px 10px 10px", background: A.bubbleAI, border: `1px solid ${A.border}`, fontSize: 13, color: A.textLight, letterSpacing: 4 }}>···</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* Quick prompts */}
            <div style={{ padding: "5px 10px", borderTop: `1px solid ${A.border}`, display: "flex", flexWrap: "wrap", gap: 3, flexShrink: 0 }}>
              {["Dashboard ventas", "Header azul oscuro", "Tema oscuro verde", "Finanzas corporativo", "HR minimalista"].map(p => (
                <button key={p} onClick={() => setInput(p)} style={{ fontSize: 8, padding: "3px 6px", background: A.bg, border: `1px solid ${A.border}`, color: A.textMuted, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", transition: "all 0.12s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = A.accent; e.currentTarget.style.color = A.accent; }} onMouseLeave={e => { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.color = A.textMuted; }}>{p}</button>
              ))}
            </div>
            {/* Attachments */}
            {atts.length > 0 && (
              <div style={{ padding: "5px 10px", borderTop: `1px solid ${A.border}`, display: "flex", flexWrap: "wrap", gap: 3, flexShrink: 0 }}>
                {atts.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", background: A.accentBg, borderRadius: 5, border: `1px solid ${A.accentLight}` }}>
                    <span style={{ fontSize: 8, color: A.accent, fontFamily: "monospace" }}>{fileIcon(a.name)} {a.name.slice(0, 14)}</span>
                    <span onClick={() => setAtts(a => a.filter((_, j) => j !== i))} style={{ fontSize: 11, color: A.danger, cursor: "pointer", lineHeight: 1 }}>×</span>
                  </div>
                ))}
              </div>
            )}
            {/* Input area */}
            <div style={{ padding: "9px 12px", borderTop: `1px solid ${A.border}`, flexShrink: 0 }}>
              <button onClick={() => fileRef.current?.click()} style={{ ...B({ width: "100%", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "5px" }), transition: "all 0.12s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = A.accent; e.currentTarget.style.color = A.accent; e.currentTarget.style.background = A.accentBg; }} onMouseLeave={e => { e.currentTarget.style.borderColor = A.border2; e.currentTarget.style.color = A.textMuted; e.currentTarget.style.background = A.surface; }}>📎 Adjuntar archivo (imagen, JSON, PDF, Excel…)</button>
              <input ref={fileRef} type="file" multiple accept="*/*" style={{ display: "none" }} onChange={e => { handleFiles(Array.from(e.target.files)); e.target.value = ""; }} />
              <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} onPaste={handlePaste} placeholder="Describe tu reporte, colores, layout… (Enter para enviar)" style={{ flex: 1, background: A.inputBg, border: `1px solid ${loading ? "#f59e0b" : A.border2}`, color: A.text, borderRadius: 7, padding: "7px 9px", fontSize: 10, resize: "none", outline: "none", height: 54, fontFamily: "'Segoe UI', sans-serif", transition: "border-color 0.2s", lineHeight: 1.5 }} />
                <button onClick={sendMsg} disabled={loading || (!input.trim() && atts.length === 0)} style={{ width: 30, height: 30, borderRadius: 7, background: (loading || (!input.trim() && atts.length === 0)) ? A.border : A.accent, border: "none", color: (loading || (!input.trim() && atts.length === 0)) ? A.textLight : "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>↑</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STATUS BAR */}
      <div style={{ height: 22, background: A.topbar, borderTop: `1px solid ${A.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: A.textLight, fontFamily: "monospace" }}>Canvas 960×580</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 8, color: A.textMuted, fontFamily: "monospace" }}>Canvas:</span>{[ct.canvas, ct.accent, ct.secondary, ct.cardBg].map((c, i) => <div key={i} title={c} onClick={() => navigator.clipboard?.writeText(c)} style={{ width: 12, height: 12, borderRadius: 2, background: c, border: `1px solid ${A.border2}`, cursor: "pointer" }} />)}</div>
        <span style={{ fontSize: 8, color: snapGrid ? A.accent : A.textLight, fontFamily: "monospace" }}>{snapGrid ? "⊞ Snap" : "⊟ Snap"}</span>
        {selEl && <span style={{ fontSize: 8, color: A.text, fontFamily: "monospace" }}>Sel: [{selEl.type}] x:{selEl.x} y:{selEl.y} {selEl.w}×{selEl.h}px</span>}
        <span style={{ marginLeft: "auto", fontSize: 8, color: A.textLight, fontFamily: "monospace" }}>Del · Ctrl+Z · ↑↓←→</span>
      </div>

      {/* EXPORT MODAL */}
      {exportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 16, width: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px 14px", borderBottom: `1px solid ${A.border}`, flexShrink: 0 }}>
              <div><div style={{ fontSize: 15, fontWeight: 800, color: A.text }}>Exportar a Power BI</div><div style={{ fontSize: 9, color: A.textMuted, marginTop: 3 }}>Selecciona archivo · cópialo o genera el link de descarga directa</div></div>
              <button type="button" onClick={() => setExportModal(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: A.textMuted, lineHeight: 1, padding: "4px 8px" }}>×</button>
            </div>
            <div style={{ padding: "9px 24px", borderBottom: `1px solid ${A.border}`, display: "flex", alignItems: "center", gap: 9, background: A.accentBg, flexShrink: 0 }}>
              <span style={{ fontSize: 8, color: A.textMuted, fontFamily: "monospace", flexShrink: 0 }}>CANVAS:</span>
              {[ct.canvas, ct.accent, ct.accent2, ct.secondary, ct.cardBg, ct.cardBorder].filter(Boolean).map((c, i) => <div key={i} title={c} onClick={() => navigator.clipboard?.writeText(c)} style={{ width: 16, height: 16, borderRadius: 3, background: c, border: `1px solid ${A.border2}`, cursor: "pointer", flexShrink: 0 }} />)}
              <span style={{ fontSize: 9, color: A.text, fontFamily: "monospace" }}>{ct.accent}</span>
              <span style={{ marginLeft: "auto", fontSize: 9, color: A.textMuted }}>{els.length} elem · nav: {navCfg.position}</span>
            </div>
            <div style={{ display: "flex", padding: "12px 24px 0", gap: 4, flexShrink: 0 }}>
              {[
                { k: "theme", label: "pbi-theme.json", icon: "🎨" },
                { k: "layout", label: "pbi-layout.json", icon: "📐" },
                { k: "readme", label: "README.txt", icon: "📋" }
              ].map(item => (
                <button key={item.k} onClick={() => setExportActiveTab(item.k)} style={{ padding: "8px 14px", border: `1px solid ${exportActiveTab === item.k ? A.accentLight : A.border}`, borderBottom: exportActiveTab === item.k ? "none" : `1px solid ${A.border}`, borderRadius: "8px 8px 0 0", background: exportActiveTab === item.k ? A.bg : A.surface, color: exportActiveTab === item.k ? A.accent : A.textMuted, fontSize: 9, cursor: "pointer", fontFamily: "monospace", fontWeight: exportActiveTab === item.k ? 700 : 400, flexShrink: 0 }}>{item.icon} {item.label}</button>
              ))}
            </div>
            <div style={{ margin: "0 24px", border: `1px solid ${A.accentLight}`, borderRadius: "0 10px 10px 10px", background: A.bg, display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div style={{ padding: "6px 14px", borderBottom: `1px solid ${A.border}`, fontSize: 8, color: A.textMuted, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{"Paso a paso"}</span><span style={{ fontFamily: "monospace", fontSize: 7, color: A.accentLight }}>{(getExportText().length / 1024).toFixed(1)} KB</span></div>
              <textarea readOnly value={getExportText()} onClick={e => e.target.select()} style={{ flex: 1, background: "transparent", border: "none", color: A.text, padding: "10px 14px", fontSize: 9, fontFamily: "'Courier New', monospace", resize: "none", outline: "none", lineHeight: 1.65, minHeight: 180 }} />
            </div>
            <div style={{ padding: "12px 24px 10px", display: "flex", gap: 10, flexShrink: 0 }}>
              <button type="button" onClick={() => copyToClipboard(getExportText())} style={{ flex: 1, padding: "11px", borderRadius: 9, background: A.surface, border: `1.5px solid ${A.border2}`, color: A.text, cursor: "pointer", fontSize: 10, fontWeight: 600, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>📋 Copiar al portapapeles</button>
              <button type="button" onClick={downloadAll} style={{ flex: 1, padding: "11px", borderRadius: 9, background: A.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 700, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 4px 14px ${rgba(A.accent, 0.4)}` }}>⬇ Descargar todos los archivos</button>
            </div>
            <div style={{ padding: "0 24px 14px", flexShrink: 0 }}>
              <div style={{ padding: "8px 14px", borderRadius: 7, background: A.accentBg, border: `1px solid ${A.accentLight}`, fontSize: 8, color: A.textMuted, lineHeight: 1.8, fontFamily: "'Segoe UI', sans-serif" }}><b style={{ color: A.accent }}>Pasos:</b> 1. Copia o descarga cada archivo. 2. En Power BI Desktop: Vista → Temas → Examinar temas → selecciona pbi-theme.json. 3. Ajusta el tamaño de página a 960×580 px. 4. Coloca cada visual según las coordenadas de pbi-layout.json.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}