import { useState, useRef, useCallback, useEffect } from "react";

// ── APP SHELL THEME (always Clean Light, never changes) ──────────
const APP = {
  bg:"#f1f5f9", surface:"#ffffff", border:"#e2e8f0", border2:"#cbd5e1",
  text:"#1e293b", textMuted:"#64748b", textLight:"#94a3b8",
  accent:"#2563eb", accentBg:"#eff6ff", accentLight:"#dbeafe",
  success:"#059669", danger:"#dc2626", warning:"#d97706",
  shadow:"0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.05)",
  shadowMd:"0 4px 16px rgba(0,0,0,0.1)",
};

// ── CANVAS THEMES ─────────────────────────────────────────────────
const CT = [
  {id:"clean",    name:"Clean Light",     canvas:"#ffffff", pageBg:"#f0f4f8", accent:"#2563eb", accent2:"#1d4ed8", secondary:"#eff6ff", text:"#1e293b", textSub:"#64748b", textMuted:"#94a3b8", cardBg:"#ffffff", cardBorder:"#e2e8f0", success:"#059669", danger:"#dc2626", warning:"#f59e0b", r:8},
  {id:"ocean",    name:"Ocean Blue",      canvas:"#0d1b2a", pageBg:"#0a1628", accent:"#38bdf8", accent2:"#0ea5e9", secondary:"#0c2d4a", text:"#e2f4ff",  textSub:"#7ec8e3", textMuted:"#4a7a94", cardBg:"#0f2236", cardBorder:"#163859", success:"#34d399", danger:"#f87171", warning:"#fbbf24", r:10},
  {id:"midnight", name:"Midnight Purple", canvas:"#120e22", pageBg:"#0e0b1e", accent:"#a78bfa", accent2:"#8b5cf6", secondary:"#1e1640", text:"#ede9fe",  textSub:"#a78bfa", textMuted:"#6d5e9e", cardBg:"#1a1430", cardBorder:"#2d1f50", success:"#4ade80", danger:"#fb7185", warning:"#fcd34d", r:12},
  {id:"forest",   name:"Forest Green",    canvas:"#0b2010", pageBg:"#081910", accent:"#34d399", accent2:"#10b981", secondary:"#0d3520", text:"#d1fae5",  textSub:"#6ee7b7", textMuted:"#3d7d5c", cardBg:"#0f2d18", cardBorder:"#1a4a28", success:"#6ee7b7", danger:"#fca5a5", warning:"#fde68a", r:8},
  {id:"sunset",   name:"Sunset Orange",   canvas:"#1c0f06", pageBg:"#160c04", accent:"#fb923c", accent2:"#f97316", secondary:"#3b1a0a", text:"#ffedd5",  textSub:"#fdba74", textMuted:"#7c5030", cardBg:"#241508", cardBorder:"#3d2010", success:"#86efac", danger:"#fda4af", warning:"#fde68a", r:14},
  {id:"rose",     name:"Rose Gold",       canvas:"#1c0e18", pageBg:"#160b14", accent:"#f472b6", accent2:"#ec4899", secondary:"#3b0e30", text:"#fce7f3",  textSub:"#f9a8d4", textMuted:"#7c3d5e", cardBg:"#240e1e", cardBorder:"#3d1432", success:"#6ee7b7", danger:"#fca5a5", warning:"#fde68a", r:16},
  {id:"corp",     name:"Corporate Navy",  canvas:"#0a1428", pageBg:"#060e1c", accent:"#3b82f6", accent2:"#2563eb", secondary:"#1a2d50", text:"#e0eaff",  textSub:"#7aa3d4", textMuted:"#4a6080", cardBg:"#0e1e3a", cardBorder:"#1a2e50", success:"#34d399", danger:"#f87171", warning:"#fbbf24", r:6},
];

// ── PALETTE ───────────────────────────────────────────────────────
const PALETTE = [
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
  {type:"map",    label:"Mapa",        icon:"🗺️", color:"#10b981"},
  {type:"gauge",  label:"Medidor",     icon:"🌡️", color:"#f59e0b"},
  {type:"funnel", label:"Embudo",      icon:"🔽", color:"#8b5cf6"},
  {type:"waterfall", label:"Waterfall", icon:"📊", color:"#06b6d4"},
  {type:"scatter", label:"Dispersión", icon:"⚫", color:"#ec4899"},
  {type:"ribbon", label:"Cinta",       icon:"🎀", color:"#14b8a6"},
];
const DEF_SIZE = {kpi:[170,88],bar:[320,215],line:[310,195],pie:[205,205],table:[310,215],slicer:[170,215],card:[205,120],nav:[190,550],header:[940,58],image:[165,125],button:[145,44]};

// ── SNAP ──────────────────────────────────────────────────────────
const GRID = 8;
const snap = v => Math.round(v / GRID) * GRID;

// ── RESIZE HANDLES ─────────────────────────────────────────────────
const HANDLES = [
  ["nw-resize", 1,1,-1,-1],["n-resize",0,1,0,-1],["ne-resize",-1,1,1,-1],
  ["w-resize",1,0,-1,0],                          ["e-resize",-1,0,1,0],
  ["sw-resize",1,-1,-1,1],["s-resize",0,-1,0,1],  ["se-resize",-1,-1,1,1],
];
const HPOS = [[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]];
const MIN_W=60, MIN_H=40;

// ── COLOR HELPER ──────────────────────────────────────────────────
function adjHex(hex,f){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if(!r)return hex;
  const c=v=>Math.min(255,Math.max(0,Math.round(parseInt(v,16)*f)));
  return `#${c(r[1]).toString(16).padStart(2,"0")}${c(r[2]).toString(16).padStart(2,"0")}${c(r[3]).toString(16).padStart(2,"0")}`;
}

// ── EXPORT BUILDERS ───────────────────────────────────────────────
function buildThemeJson(ct){
  return {name:`PBI Designer — ${ct.name}`,dataColors:[ct.accent,ct.accent2,ct.success,ct.warning,ct.danger,adjHex(ct.accent,1.3),adjHex(ct.accent,0.6)],background:ct.canvas,foreground:ct.text,tableAccent:ct.accent,textClasses:{title:{fontFace:"Segoe UI",fontSize:18,fontBold:true,color:ct.text},header:{fontFace:"Segoe UI",fontSize:11,fontBold:true,color:ct.text},body:{fontFace:"Segoe UI",fontSize:10,color:ct.textSub},callout:{fontFace:"Segoe UI",fontSize:28,fontBold:true,color:ct.accent}},visualStyles:{"*":{"*":{background:[{color:{solid:{color:ct.canvas}}}],border:[{show:false}]}},card:{"*":{calloutValue:[{fontSize:28,fontBold:true,color:{solid:{color:ct.accent}}}],categoryLabel:[{fontSize:9,color:{solid:{color:ct.textMuted}}}]}},barChart:{"*":{dataPoint:[{defaultColor:{solid:{color:ct.accent}}}],categoryAxis:[{labelColor:{solid:{color:ct.textSub}},gridlineColor:{solid:{color:ct.cardBorder}}}],valueAxis:[{labelColor:{solid:{color:ct.textSub}},gridlineColor:{solid:{color:ct.cardBorder}}}]}},lineChart:{"*":{dataPoint:[{defaultColor:{solid:{color:ct.accent}}}]}},tableEx:{"*":{header:[{fontColor:{solid:{color:ct.accent}},backColor:{solid:{color:ct.secondary}}}],values:[{fontColorPrimary:{solid:{color:ct.text}},fontColorSecondary:{solid:{color:ct.textSub}}}]}}}};
}
function buildLayoutJson(els,ct,navCfg,hdrCfg){
  const pbiMap={kpi:"card",bar:"barChart",line:"lineChart",pie:"donutChart",table:"tableEx",slicer:"slicer",nav:"actionButton",card:"textbox",button:"actionButton",image:"image",header:"shape"};
  return {metadata:{tool:"PBI Designer v1.3",exportedAt:new Date().toISOString()},page:{width:960,height:580,background:ct.canvas},theme:{id:ct.id,name:ct.name,accent:ct.accent},header:hdrCfg,navigation:navCfg,elements:els.map(e=>({id:e.id,type:e.type,label:e.label,position:{x:e.x,y:e.y},size:{width:e.w,height:e.h},powerBIVisual:pbiMap[e.type]||"textbox"}))};
}
function buildReadme(els,ct,navCfg){
  return `PBI Designer v1.3 — Export Guide
===================================
Theme     : ${ct.name}
Accent    : ${ct.accent}  Background: ${ct.canvas}
Elements  : ${els.length}   Nav: ${navCfg.position} / ${navCfg.style}
Exported  : ${new Date().toLocaleString()}

STEP 1 — IMPORT THEME
  Power BI Desktop → View → Themes ▾ → Browse for themes
  Select: pbi-theme.json

STEP 2 — SET PAGE SIZE
  Format pane → Canvas settings → Type: Custom → 960 × 580 px

STEP 3 — ADD VISUALS  (refer to pbi-layout.json for exact positions)
  Each element's position is in pixels from top-left of page.
  In Power BI: drag a visual, then set Size & Position in Format pane.

ELEMENTS:
${els.map(e=>`  [${String(e.type).toUpperCase().padEnd(7)}] "${e.label}" — Left:${e.x} Top:${e.y} W:${e.w} H:${e.h}`).join("\n")}

STEP 4 — NAVIGATION (${navCfg.position} / ${navCfg.style})
  • Add a Rectangle shape (${navCfg.width||190}px wide, full height)
  • Fill with hex: ${ct.secondary}
  • Add Button visuals for each page, set Action = Bookmark
  • Collapsible: group in Selection Pane, toggle with a bookmark button
  • Floating: layer on top using z-order (Bring to Front)

Docs: https://learn.microsoft.com/power-bi/create-reports/desktop-report-themes
`;
}
function dlUri(name,content,mime){
  const a=document.createElement("a");
  a.href="data:"+mime+";charset=utf-8,"+encodeURIComponent(content);
  a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── AI SYSTEM PROMPT ──────────────────────────────────────────────
const AI_SYS = `Eres un arquitecto de dashboards de Power BI. Tu tarea es generar layouts PRECISOS.

REGLAS ESTRICTAS:
1. SIEMPRE debes incluir <LAYOUT> con JSON completo
2. Usa coordenadas exactas (x,y) basadas en grid de 8px
3. Respeta márgenes de 8px entre elementos
4. Ajusta tamaños según el contenido:
   - KPI: 170-200px ancho, 80-100px alto
   - Gráficos: mínimo 300px ancho para legibilidad
   - Tablas: ajustar columnas según espacio disponible

FORMATO DE RESPUESTA:
<LAYOUT>{...}</LAYOUT>
[Explicación breve de los cambios]`;

async function callAI(msgs){
  try{
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No hay token en localStorage');
      return { text: "Error: No has iniciado sesión", layout: null };
    }

    console.log('🔑 Token enviado (primeros 20 chars):', token.substring(0, 20) + '...');

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

    console.log('📊 Status de respuesta:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error en respuesta:', data);
      return { text: `Error ${response.status}: ${data.error || 'Desconocido'}`, layout: null };
    }

    console.log('✅ Respuesta exitosa:', data);
    return { text: data.text, layout: data.layout };
  } catch (error) {
    console.error('❌ Error en callAI:', error);
    return { text: `Error: ${error.message}`, layout: null };
  }
}

// ── PBI-FAITHFUL VISUALS ──────────────────────────────────────────
function KPICard({el,ct}){
  const DATA={"Total Revenue":["$2.41M",12.3,true,[1.8,2.0,1.9,2.1,2.2,2.41]],"Units Sold":["8,432",5.7,true,[6.5,7.1,7.4,7.9,8.1,8.4]],"Avg. Deal":["$28.6K",-2.1,false,[31,30,29.5,29,28.8,28.6]],"Win Rate %":["34.8%",1.2,true,[32,33,33.5,34,34.5,34.8]],"Net Revenue":["$1.8M",8.7,true,[1.4,1.5,1.6,1.65,1.72,1.8]],"EBITDA":["$540K",14.2,true,[380,420,450,480,510,540]],"Net Margin":["29.8%",2.1,true,[26,27,28,28.5,29.2,29.8]],"Cash Flow":["$320K",-3.4,false,[370,360,350,340,330,320]],"Headcount":["1,248",3.2,true,[1100,1150,1180,1210,1230,1248]],"Attrition %":["8.4%",-1.1,true,[10,9.5,9,8.9,8.6,8.4]],"Impressions":["2.4M",18,true,[1.6,1.8,2.0,2.1,2.25,2.4]],"CTR %":["3.2%",0.4,true,[2.7,2.8,2.9,3.0,3.1,3.2]],"Conversions":["12,841",9.3,true,[9500,10200,11000,11500,12100,12841]],"CAC":["$48",-12,true,[60,57,54,52,50,48]],"Deliveries":["4,821",6.1,true,[3800,4100,4300,4500,4650,4821]],"On-Time %":["94.2%",1.8,true,[90,91.5,92,93,93.5,94.2]]};
  const [v,chg,up,pts]=DATA[el.label]||["—",0,true,[0,0,0,0,0,0]];
  const W=60,H=24;
  const mn=Math.min(...pts),mx=Math.max(...pts),rng=mx-mn||1;
  const sp=pts.map((p,i)=>`${(i/(pts.length-1))*W},${H-(((p-mn)/rng)*H)}`).join(" ");
  const isDark=ct.id!=="clean";
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"12px 14px",display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden",boxSizing:"border-box",boxShadow:isDark?"none":"0 1px 4px rgba(0,0,0,0.06)"}}>
      <div style={{fontSize:9,color:ct.textMuted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>{el.label}</div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",overflow:"hidden"}}>
        <div>
          <div style={{fontSize:Math.max(16,Math.min(26,el.w/7)),fontWeight:700,color:ct.text,letterSpacing:-0.5,lineHeight:1.1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{v}</div>
          {el.h>70&&<div style={{fontSize:9,color:up?ct.success:ct.danger,display:"flex",alignItems:"center",gap:2,marginTop:2}}>
            <span style={{fontSize:8}}>{up?"▲":"▼"}</span>
            <span style={{fontWeight:600}}>{Math.abs(chg)}%</span>
            <span style={{color:ct.textMuted,fontWeight:400}}>vs prev</span>
          </div>}
        </div>
        {el.w>120&&el.h>65&&<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{flexShrink:0,marginLeft:6}}>
          <polyline points={sp} fill="none" stroke={up?ct.success:ct.danger} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
        </svg>}
      </div>
    </div>
  );
}

function BarChart({el,ct}){
  const data=[{l:"Jan",v:65},{l:"Feb",v:80},{l:"Mar",v:45},{l:"Apr",v:92},{l:"May",v:70},{l:"Jun",v:55},{l:"Jul",v:88},{l:"Aug",v:72},{l:"Sep",v:60},{l:"Oct",v:85}];
  const visible=data.slice(0,Math.max(3,Math.floor((el.w-40)/28)));
  const maxV=Math.max(...visible.map(d=>d.v));
  const ticks=[0,25,50,75,100];
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px 8px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{flex:1,display:"flex",gap:4,overflow:"hidden",minHeight:0}}>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",paddingBottom:16,paddingTop:2,flexShrink:0}}>
          {ticks.slice().reverse().map(t=><div key={t} style={{fontSize:7,color:ct.textMuted,fontFamily:"monospace",textAlign:"right",lineHeight:1}}>{t}</div>)}
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",inset:"2px 0 16px 0",display:"flex",flexDirection:"column",justifyContent:"space-between",pointerEvents:"none"}}>
            {ticks.map(t=><div key={t} style={{height:1,background:ct.cardBorder,opacity:0.6,width:"100%"}}/>)}
          </div>
          <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:3,paddingBottom:16,paddingTop:2,position:"relative",overflow:"hidden"}}>
            {visible.map((d,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:1,height:"100%",minWidth:0,overflow:"hidden"}}>
                <div style={{width:"70%",height:`${(d.v/maxV)*100}%`,background:`linear-gradient(180deg,${ct.accent},${ct.accent2||ct.accent})`,borderRadius:"2px 2px 0 0",minHeight:2,position:"relative"}}>
                  {el.h>140&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",fontSize:7,color:ct.textMuted,fontFamily:"monospace",whiteSpace:"nowrap"}}>{d.v}</div>}
                </div>
                {el.h>100&&<div style={{fontSize:7,color:ct.textMuted,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",whiteSpace:"nowrap"}}>{d.l}</div>}
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
  const labels=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const W=240,H=80;
  const mn=Math.min(...pts),mx=Math.max(...pts),rng=mx-mn||1;
  const path=pts.map((p,i)=>`${(i/(pts.length-1))*W},${H-((p-mn)/rng)*H}`).join(" ");
  const area=`0,${H} ${path} ${W},${H}`;
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px 8px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H+14}`} preserveAspectRatio="none" style={{flex:1,overflow:"hidden"}}>
        <defs>
          <linearGradient id={`lg-${el.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ct.accent} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={ct.accent} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {[.25,.5,.75,1].map(t=><line key={t} x1="0" y1={H*(1-t)} x2={W} y2={H*(1-t)} stroke={ct.cardBorder} strokeWidth="0.5" opacity="0.8"/>)}
        <polygon points={area} fill={`url(#lg-${el.id})`}/>
        <polyline points={path} fill="none" stroke={ct.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {el.w>200&&pts.map((p,i)=><circle key={i} cx={(i/(pts.length-1))*W} cy={H-((p-mn)/rng)*H} r="2.5" fill={ct.accent} stroke={ct.cardBg} strokeWidth="1.5"/>)}
        {el.h>120&&pts.filter((_,i)=>i%2===0).map((_,i)=><text key={i} x={(i*2/(pts.length-1))*W} y={H+12} fontSize="7" fill={ct.textMuted} textAnchor="middle" fontFamily="'Segoe UI',sans-serif">{labels[i*2]}</text>)}
      </svg>
    </div>
  );
}

function DonutChart({el,ct}){
  const segments=[{p:35,c:ct.accent,l:"Category A"},{p:27,c:ct.accent2||"#8b5cf6",l:"Category B"},{p:22,c:ct.success,l:"Category C"},{p:16,c:ct.warning,l:"Category D"}];
  let cum=0; const R=38,CX=50,CY=50;
  const paths=segments.map(s=>{
    const a1=(cum/100)*2*Math.PI-Math.PI/2; cum+=s.p;
    const a2=(cum/100)*2*Math.PI-Math.PI/2;
    const x1=CX+R*Math.cos(a1),y1=CY+R*Math.sin(a1),x2=CX+R*Math.cos(a2),y2=CY+R*Math.sin(a2);
    return {...s,d:`M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 ${s.p>50?1:0} 1 ${x2} ${y2}Z`};
  });
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"10px 12px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{display:"flex",alignItems:"center",flex:1,gap:10,overflow:"hidden",minHeight:0}}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{flexShrink:0}}>
          <circle cx={CX} cy={CY} r="22" fill={ct.cardBg}/>
          {paths.map((p,i)=><path key={i} d={p.d} fill={p.c} stroke={ct.cardBg} strokeWidth="1.5"/>)}
          <text x={CX} y={CY+4} textAnchor="middle" fontSize="9" fontWeight="700" fill={ct.text} fontFamily="'Segoe UI',sans-serif">{segments[0].p}%</text>
        </svg>
        <div style={{display:"flex",flexDirection:"column",gap:5,overflow:"hidden",flex:1}}>
          {paths.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,overflow:"hidden"}}>
              <div style={{width:8,height:8,borderRadius:2,background:p.c,flexShrink:0}}/>
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{fontSize:8,color:ct.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{p.l}</div>
              </div>
              <div style={{fontSize:9,fontWeight:700,color:ct.text,flexShrink:0,fontFamily:"monospace"}}>{p.p}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableViz({el,ct}){
  const cols=["Product","Category","Sales","Units","Margin"];
  const rows=[["Laptop Pro","Electronics","$48,200","324","32%"],["Wireless Mouse","Accessories","$12,400","892","45%"],["Monitor 27\"","Electronics","$38,600","210","28%"],["USB-C Hub","Accessories","$8,700","580","52%"],["Keyboard Mech","Accessories","$15,300","418","41%"],["Webcam HD","Electronics","$9,800","340","38%"]];
  const visibleCols=Math.max(2,Math.floor((el.w-24)/70));
  const visibleRows=Math.max(2,Math.floor((el.h-52)/24));
  const isDark=ct.id!=="clean";
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,padding:"10px 12px 6px",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${visibleCols},1fr)`,background:isDark?ct.secondary:`${ct.accent}10`,borderBottom:`2px solid ${ct.accent}40`,flexShrink:0}}>
          {cols.slice(0,visibleCols).map(c=>(
            <div key={c} style={{padding:"5px 10px",fontSize:9,fontWeight:700,color:ct.accent,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:3}}>
              {c}<span style={{fontSize:7,opacity:0.5}}>⇅</span>
            </div>
          ))}
        </div>
        {rows.slice(0,visibleRows).map((row,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:`repeat(${visibleCols},1fr)`,background:i%2===1?(isDark?`${ct.cardBorder}20`:`${ct.accent}04`):"transparent",borderBottom:`1px solid ${ct.cardBorder}40`,flexShrink:0}}>
            {row.slice(0,visibleCols).map((cell,j)=>(
              <div key={j} style={{padding:"5px 10px",fontSize:9,color:j===0?ct.text:ct.textSub,fontFamily:j>1?"monospace":"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:j===0?500:400}}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlicerViz({el,ct}){
  const [sel,setSel]=useState([0]);
  const opts=["All Periods","FY 2024","FY 2023","FY 2022","Q4 2024","Q3 2024","Q2 2024","Q1 2024"];
  const visible=Math.max(3,Math.floor((el.h-60)/28));
  const isDark=ct.id!=="clean";
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"10px 12px 6px",flexShrink:0}}>
        <div style={{fontSize:9,fontWeight:700,color:ct.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:4,border:`1px solid ${ct.cardBorder}`,background:isDark?ct.secondary:"#f8fafc"}}>
          <span style={{fontSize:9,color:ct.textMuted}}>🔍</span>
          <span style={{fontSize:9,color:ct.textMuted,fontFamily:"'Segoe UI',sans-serif"}}>Search...</span>
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",gap:1,padding:"0 8px 8px"}}>
        {opts.slice(0,visible).map((o,i)=>(
          <div key={i} onClick={e=>{e.stopPropagation();setSel(s=>s.includes(i)?s.filter(x=>x!==i):[...s,i]);}}
            style={{display:"flex",alignItems:"center",gap:8,padding:"5px 6px",borderRadius:3,background:sel.includes(i)?(isDark?`${ct.accent}25`:`${ct.accent}12`):"transparent",cursor:"pointer",transition:"background 0.1s",flexShrink:0}}>
            <div style={{width:13,height:13,borderRadius:2,border:`1.5px solid ${sel.includes(i)?ct.accent:ct.textMuted}`,background:sel.includes(i)?ct.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.1s"}}>
              {sel.includes(i)&&<span style={{color:"#fff",fontSize:8,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:9,color:sel.includes(i)?ct.text:ct.textSub,fontFamily:"'Segoe UI',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavViz({el,ct,navCfg}){
  const [active,setActive]=useState("Dashboard");
  const [exp,setExp]=useState(["Analytics"]);
  const items=[{l:"Dashboard",i:"⊞",sub:[]},{l:"Analytics",i:"📊",sub:["Overview","By Region","Trends"]},{l:"Finance",i:"💰",sub:["P&L","Cash Flow","Budget"]},{l:"HR",i:"👥",sub:[]},{l:"Reports",i:"📋",sub:[]},{l:"Settings",i:"⚙",sub:[]}];
  const horiz=navCfg?.position==="top";
  return(
    <div style={{width:"100%",height:"100%",background:ct.id==="clean"?"#f8fafc":ct.secondary,borderRadius:ct.r,border:`1px solid ${ct.cardBorder}`,overflow:"hidden",display:"flex",flexDirection:horiz?"row":"column"}}>
      {!horiz&&<div style={{padding:"14px 12px 10px",borderBottom:`1px solid ${ct.cardBorder}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,borderRadius:6,background:`linear-gradient(135deg,${ct.accent},${ct.accent2||ct.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",flexShrink:0}}>⬡</div>
          <div style={{overflow:"hidden"}}>
            <div style={{fontSize:10,fontWeight:700,color:ct.accent,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"'Segoe UI',sans-serif"}}>Analytics Hub</div>
            <div style={{fontSize:7,color:ct.textMuted,fontFamily:"monospace",letterSpacing:0.8}}>POWER BI</div>
          </div>
        </div>
      </div>}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:horiz?"row":"column",padding:horiz?"0":"6px 0"}}>
        {items.map(item=>(
          <div key={item.l} style={{flexShrink:0}}>
            <div onClick={e=>{e.stopPropagation();setActive(item.l);if(item.sub.length)setExp(ex=>ex.includes(item.l)?ex.filter(x=>x!==item.l):[...ex,item.l]);}}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:horiz?"8px 14px":"7px 12px",cursor:"pointer",background:active===item.l?`${ct.accent}18`:"transparent",borderLeft:!horiz?`3px solid ${active===item.l?ct.accent:"transparent"}`:"none",borderBottom:horiz?`2px solid ${active===item.l?ct.accent:"transparent"}`:"none",transition:"all 0.12s"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontSize:11,flexShrink:0}}>{item.i}</span>
                <span style={{fontSize:9,color:active===item.l?ct.text:ct.textSub,fontFamily:"'Segoe UI',sans-serif",fontWeight:active===item.l?600:400}}>{item.l}</span>
              </div>
              {!horiz&&item.sub.length>0&&<span style={{fontSize:7,color:ct.textMuted,transform:exp.includes(item.l)?"rotate(180deg)":"none",transition:"transform 0.2s",marginLeft:4}}>▼</span>}
            </div>
            {!horiz&&exp.includes(item.l)&&item.sub.map(s=>(
              <div key={s} onClick={e=>{e.stopPropagation();setActive(s);}}
                style={{padding:"5px 12px 5px 32px",cursor:"pointer",background:active===s?`${ct.accent}10`:"transparent",transition:"background 0.12s"}}>
                <span style={{fontSize:8,color:active===s?ct.accent:ct.textMuted,fontFamily:"'Segoe UI',sans-serif"}}>· {s}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderViz({el,ct,hdrCfg}){
  const bg=hdrCfg?.bgColor||ct.accent;
  return(
    <div style={{width:"100%",height:"100%",background:`linear-gradient(135deg,${bg} 0%,${adjHex(bg,0.72)} 100%)`,borderRadius:ct.r,overflow:"hidden",display:"flex",alignItems:"center",padding:"0 18px",gap:14,boxSizing:"border-box"}}>
      <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⬡</div>
      <div style={{overflow:"hidden",flex:1}}>
        <div style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:0.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{hdrCfg?.title||el.label||"Report Title"}</div>
        {el.h>46&&<div style={{fontSize:9,color:"rgba(255,255,255,0.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{hdrCfg?.subtitle||"Business Intelligence Dashboard"}</div>}
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        {["YTD","QTD","MTD"].map(f=>(
          <div key={f} style={{padding:"4px 9px",borderRadius:5,background:"rgba(255,255,255,0.15)",fontSize:8,color:"rgba(255,255,255,0.9)",fontFamily:"'Segoe UI',sans-serif",fontWeight:600,border:"1px solid rgba(255,255,255,0.2)"}}>{f}</div>
        ))}
      </div>
    </div>
  );
}
function TextCard({el,ct}){
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`1px solid ${ct.cardBorder}`,borderRadius:ct.r,padding:"12px 14px",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column",gap:6}}>
      <div style={{fontSize:10,fontWeight:700,color:ct.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Segoe UI',sans-serif"}}>{el.label}</div>
      <div style={{fontSize:9,color:ct.textSub,lineHeight:1.65,overflow:"hidden",flex:1,fontFamily:"'Segoe UI',sans-serif"}}>Add descriptive text, insight, or annotation here. This text card can hold any commentary or context for the dashboard.</div>
    </div>
  );
}
function ButtonViz({el,ct}){
  return(
    <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <div style={{padding:"8px 18px",borderRadius:ct.r-2,background:`linear-gradient(135deg,${ct.accent},${ct.accent2||ct.accent})`,fontSize:10,fontWeight:600,color:"#fff",cursor:"pointer",boxShadow:`0 3px 10px ${ct.accent}45`,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"90%",fontFamily:"'Segoe UI',sans-serif"}}>{el.label||"Button"}</div>
    </div>
  );
}
function ImageViz({el,ct}){
  return(
    <div style={{width:"100%",height:"100%",background:ct.cardBg,border:`2px dashed ${ct.cardBorder}`,borderRadius:ct.r,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,overflow:"hidden"}}>
      <span style={{fontSize:22,opacity:0.25}}>🖼</span>
      <span style={{fontSize:8,color:ct.textMuted,fontFamily:"monospace"}}>Image / Logo</span>
    </div>
  );
}

function Visual({el,ct,navCfg,hdrCfg}){
  switch(el.type){
    case"kpi":    return <KPICard el={el} ct={ct}/>;
    case"bar":    return <BarChart el={el} ct={ct}/>;
    case"line":   return <LineChart el={el} ct={ct}/>;
    case"pie":    return <DonutChart el={el} ct={ct}/>;
    case"table":  return <TableViz el={el} ct={ct}/>;
    case"slicer": return <SlicerViz el={el} ct={ct}/>;
    case"nav":    return <NavViz el={el} ct={ct} navCfg={navCfg}/>;
    case"header": return <HeaderViz el={el} ct={ct} hdrCfg={hdrCfg}/>;
    case"card":   return <TextCard el={el} ct={ct}/>;
    case"button": return <ButtonViz el={el} ct={ct}/>;
    case"image":  return <ImageViz el={el} ct={ct}/>;
    default:      return null;
  }
}

function CanvasEl({el,ct,selected,onSelect,onUpdate,snapGrid,onDragStart,onDragEnd,navCfg,hdrCfg,zoom}){
  const op=useRef({mode:null,sx:0,sy:0,ox:0,oy:0,ow:0,oh:0,hdx:0,hdy:0,hdw:0,hdh:0,zoom:1});

  const startDrag=(e)=>{
    e.stopPropagation(); onSelect(el.id);
    op.current={mode:"drag",sx:e.clientX,sy:e.clientY,ox:el.x,oy:el.y,ow:el.w,oh:el.h,zoom};
    onDragStart?.(el.id); attach();
  };
  const startResize=(e,hi)=>{
    e.stopPropagation(); e.preventDefault();
    const [,dx,dy,dw,dh]=HANDLES[hi];
    op.current={mode:"resize",sx:e.clientX,sy:e.clientY,ox:el.x,oy:el.y,ow:el.w,oh:el.h,hdx:dx,hdy:dy,hdw:dw,hdh:dh,zoom};
    attach();
  };
  const attach=()=>{
    const mv=(e)=>{
      const z=op.current.zoom;
      const ddx=(e.clientX-op.current.sx)/z, ddy=(e.clientY-op.current.sy)/z;
      if(op.current.mode==="drag"){
        const nx=snapGrid?snap(op.current.ox+ddx):Math.round(op.current.ox+ddx);
        const ny=snapGrid?snap(op.current.oy+ddy):Math.round(op.current.oy+ddy);
        onUpdate(el.id,{x:Math.max(0,nx),y:Math.max(0,ny)});
      } else {
        let nw=Math.max(MIN_W,Math.round(op.current.ow+ddx*op.current.hdw));
        let nh=Math.max(MIN_H,Math.round(op.current.oh+ddy*op.current.hdh));
        if(snapGrid){nw=snap(nw);nh=snap(nh);}
        const nx=op.current.hdx?Math.max(0,Math.round(op.current.ox+ddx*op.current.hdx)):op.current.ox;
        const ny=op.current.hdy?Math.max(0,Math.round(op.current.oy+ddy*op.current.hdy)):op.current.oy;
        onUpdate(el.id,{x:nx,y:ny,w:nw,h:nh});
      }
    };
    const up=()=>{onDragEnd?.();window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
  };

  return(
    <div
      onMouseDown={e=>startDrag(e)}
      style={{position:"absolute",left:el.x,top:el.y,width:el.w,height:el.h,cursor:"move",userSelect:"none",
        outline:selected?`2px solid ${ct.accent}`:"2px solid transparent",
        borderRadius:ct.r,
        boxShadow:selected?`0 0 0 4px ${ct.accent}22,0 4px 20px rgba(0,0,0,0.14)`:"0 1px 4px rgba(0,0,0,0.08)",
        zIndex:selected?100:1,transition:"outline 0.08s,box-shadow 0.08s",overflow:"hidden"}}>
      <Visual el={el} ct={ct} navCfg={navCfg} hdrCfg={hdrCfg}/>
      {selected&&HPOS.map(([lf,tp],i)=>(
        <div key={i}
          onMouseDown={e=>{e.stopPropagation();startResize(e,i);}}
          style={{position:"absolute",left:`${lf*100}%`,top:`${tp*100}%`,width:10,height:10,
            background:"#fff",border:`2px solid ${ct.accent}`,borderRadius:2,
            transform:"translate(-50%,-50%)",zIndex:101,cursor:HANDLES[i][0],
            boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translate(-50%,-50%) scale(1.4)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translate(-50%,-50%) scale(1)"}/>
      ))}
    </div>
  );
}

function fileIcon(n=""){
  if(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(n))return"🖼";
  if(/\.json$/i.test(n))return"📄";
  if(/\.pdf$/i.test(n))return"📕";
  if(/\.(xlsx|xls|csv)$/i.test(n))return"📊";
  if(/\.(pptx|ppt)$/i.test(n))return"📑";
  if(/\.(docx|doc|txt|md)$/i.test(n))return"📝";
  return"📎";
}
async function readFile(file){
  if(file.type.startsWith("image/")){
    const b64=await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.readAsDataURL(file);});
    return{type:"image",name:file.name,mediaType:file.type,base64:b64};
  }
  const text=await file.text();
  return{type:"text",name:file.name,content:text};
}

const PRESETS={
  sales:{themeId:"ocean",nav:{position:"left",style:"collapsible",width:190,exportSeparate:false},header:{show:true,title:"Sales Dashboard",subtitle:"Revenue · Units · Pipeline",height:58,bgColor:""},els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Sales Dashboard"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navigation"},{id:3,type:"kpi",x:198,y:66,w:180,h:88,label:"Total Revenue"},{id:4,type:"kpi",x:386,y:66,w:180,h:88,label:"Units Sold"},{id:5,type:"kpi",x:574,y:66,w:180,h:88,label:"Avg. Deal"},{id:6,type:"kpi",x:762,y:66,w:190,h:88,label:"Win Rate %"},{id:7,type:"bar",x:198,y:162,w:370,h:210,label:"Revenue by Region"},{id:8,type:"line",x:576,y:162,w:376,h:210,label:"Monthly Trend"},{id:9,type:"slicer",x:198,y:380,w:170,h:190,label:"Period Filter"},{id:10,type:"pie",x:376,y:380,w:200,h:190,label:"By Segment"},{id:11,type:"table",x:584,y:380,w:368,h:190,label:"Top Deals"}]},
  finance:{themeId:"midnight",nav:{position:"left",style:"static",width:190,exportSeparate:false},header:{show:true,title:"Financial Overview",subtitle:"P&L · Cash Flow · Budget vs Actual",height:58,bgColor:""},els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"Financial Overview"},{id:2,type:"nav",x:0,y:58,w:190,h:522,label:"Navigation"},{id:3,type:"kpi",x:198,y:66,w:180,h:88,label:"Net Revenue"},{id:4,type:"kpi",x:386,y:66,w:180,h:88,label:"EBITDA"},{id:5,type:"kpi",x:574,y:66,w:180,h:88,label:"Net Margin"},{id:6,type:"kpi",x:762,y:66,w:190,h:88,label:"Cash Flow"},{id:7,type:"line",x:198,y:162,w:528,h:210,label:"P&L Monthly"},{id:8,type:"bar",x:734,y:162,w:218,h:210,label:"Expense Breakdown"},{id:9,type:"table",x:198,y:380,w:388,h:190,label:"Budget vs Actual"},{id:10,type:"pie",x:594,y:380,w:200,h:190,label:"Cost Centers"},{id:11,type:"slicer",x:802,y:380,w:150,h:190,label:"Quarter"}]},
  hr:{themeId:"rose",nav:{position:"right",style:"static",width:185,exportSeparate:false},header:{show:true,title:"HR Analytics",subtitle:"People · Performance · Culture",height:58,bgColor:""},els:[{id:1,type:"header",x:0,y:0,w:960,h:58,label:"HR Analytics"},{id:2,type:"nav",x:775,y:58,w:185,h:522,label:"Navigation"},{id:3,type:"kpi",x:8,y:66,w:180,h:88,label:"Headcount"},{id:4,type:"kpi",x:196,y:66,w:180,h:88,label:"Attrition %"},{id:5,type:"kpi",x:384,y:66,w:180,h:88,label:"Avg. Tenure"},{id:6,type:"kpi",x:572,y:66,w:195,h:88,label:"Engagement"},{id:7,type:"bar",x:8,y:162,w:370,h:210,label:"Headcount by Dept"},{id:8,type:"line",x:386,y:162,w:381,h:210,label:"Hiring Trend"},{id:9,type:"pie",x:8,y:380,w:200,h:190,label:"By Gender"},{id:10,type:"table",x:216,y:380,w:320,h:190,label:"Top Performers"},{id:11,type:"slicer",x:544,y:380,w:223,h:190,label:"Department"}]},
  marketing:{themeId:"sunset",nav:{position:"top",style:"static",width:960,exportSeparate:false},header:{show:true,title:"Marketing Dashboard",subtitle:"Campaigns · Conversions · ROI",height:54,bgColor:""},els:[{id:1,type:"header",x:0,y:0,w:960,h:54,label:"Marketing Dashboard"},{id:2,type:"nav",x:0,y:54,w:960,h:42,label:"Navigation"},{id:3,type:"kpi",x:8,y:104,w:175,h:88,label:"Impressions"},{id:4,type:"kpi",x:191,y:104,w:175,h:88,label:"CTR %"},{id:5,type:"kpi",x:374,y:104,w:175,h:88,label:"Conversions"},{id:6,type:"kpi",x:557,y:104,w:175,h:88,label:"CAC"},{id:7,type:"kpi",x:740,y:104,w:212,h:88,label:"ROAS"},{id:8,type:"line",x:8,y:200,w:490,h:198,label:"Campaign Performance"},{id:9,type:"bar",x:506,y:200,w:296,h:198,label:"Channel Mix"},{id:10,type:"slicer",x:810,y:200,w:142,h:198,label:"Campaign"},{id:11,type:"table",x:8,y:406,w:460,h:164,label:"Top Campaigns"},{id:12,type:"pie",x:476,y:406,w:200,h:164,label:"Audience Split"}]},
};

export default function PBIDesigner(){
  const [els,setEls]=useState([]);
  const [sel,setSel]=useState(null);
  const [ctIdx,setCtIdx]=useState(0);
  const [zoom,setZoom]=useState(0.82);
  const [snapGrid,setSnapGrid]=useState(true);
  const [showGrid,setShowGrid]=useState(true);
  const [dragStatus,setDragStatus]=useState(null);
  const [history,setHistory]=useState([[]]);
  const [histIdx,setHistIdx]=useState(0);
  const [msgs,setMsgs]=useState([{role:"ai",text:"¡Hola! Soy tu asistente de diseño para Power BI. 👋\n\nPuedes empezar así:\n• Describe el reporte: «Dashboard de ventas con menú izquierdo y header azul»\n• Sube una captura o imagen de referencia\n• Pega un JSON de tema Power BI\n• Usa una plantilla del panel Presets ⬡\n\nTe generaré el layout completo sin solapamientos y listo para recrear en PBI."}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [aiOpen,setAiOpen]=useState(true);
  const [nextId,setNextId]=useState(50);
  const [exportModal,setExportModal]=useState(false);
  const [tab,setTab]=useState("elements");
  const [navCfg,setNavCfg]=useState({position:"left",style:"collapsible",width:190,exportSeparate:false});
  const [hdrCfg,setHdrCfg]=useState({show:false,title:"My Report",subtitle:"Business Intelligence Dashboard",height:58,bgColor:""});
  const [atts,setAtts]=useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const canvasRef=useRef(null);
  const chatEndRef=useRef(null);
  const fileRef=useRef(null);

  const ct=CT[ctIdx];
  const selEl=els.find(e=>e.id===sel);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const pushHistory=(newEls)=>{
    setHistory(h=>{const n=h.slice(0,histIdx+1);n.push(newEls);return n;});
    setHistIdx(i=>i+1);
  };
  const undo=()=>{ if(histIdx>0){setHistIdx(i=>i-1);setEls(history[histIdx-1]||[]);} };
  const redo=()=>{ if(histIdx<history.length-1){setHistIdx(i=>i+1);setEls(history[histIdx+1]);} };

  useEffect(()=>{
    const kd=(e)=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
      if(e.key==="Delete"||e.key==="Backspace"){if(sel){setEls(a=>{const n=a.filter(el=>el.id!==sel);pushHistory(n);return n;});setSel(null);}}
      if(e.key==="Escape")setSel(null);
      if((e.metaKey||e.ctrlKey)&&e.key==="z"){e.preventDefault();undo();}
      if((e.metaKey||e.ctrlKey)&&(e.key==="y"||(e.shiftKey&&e.key==="z"))){e.preventDefault();redo();}
      if(sel&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
        e.preventDefault();
        const step=e.shiftKey?8:1;
        const d={ArrowLeft:{x:-step},ArrowRight:{x:step},ArrowUp:{y:-step},ArrowDown:{y:step}};
        setEls(a=>a.map(el=>el.id===sel?{...el,...Object.fromEntries(Object.entries(d[e.key]).map(([k,v])=>[k,Math.max(0,(el[k]||0)+v)]))}:el));
      }
    };
    window.addEventListener("keydown",kd);
    return()=>window.removeEventListener("keydown",kd);
  },[sel,histIdx,history]);

  const updateEl=useCallback((id,patch)=>{
    setEls(a=>a.map(e=>e.id===id?{...e,...patch}:e));
  },[]);
  const commitEl=useCallback((id,patch)=>{
    setEls(a=>{const n=a.map(e=>e.id===id?{...e,...patch}:e);pushHistory(n);return n;});
  },[]);

  const handleDrop=(e)=>{
    const type=e.dataTransfer.getData("elementType"); if(!type)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const rx=(e.clientX-rect.left)/zoom, ry=(e.clientY-rect.top)/zoom;
    const [w,h]=DEF_SIZE[type]||[160,100];
    const x=snapGrid?snap(Math.round(rx-w/2)):Math.round(rx-w/2);
    const y=snapGrid?snap(Math.round(ry-h/2)):Math.round(ry-h/2);
    const info=PALETTE.find(p=>p.type===type);
    const id=nextId;
    const newEl={id,type,x:Math.max(0,x),y:Math.max(0,y),w,h,label:info?.label||type};
    setEls(a=>{const n=[...a,newEl];pushHistory(n);return n;});
    setNextId(n=>n+1); setSel(id);
  };

  const handleFiles=async(files)=>{
    const result=[];
    for(const f of files){try{result.push(await readFile(f));}catch(e){}}
    setAtts(a=>[...a,...result]);
    if(result.length)setMsgs(m=>[...m,{role:"ai",text:`📎 ${result.length} archivo(s) listos: ${result.map(r=>r.name).join(", ")}.\nDescribe cómo quieres que use esta referencia para el diseño.`}]);
  };
  const handlePaste=(e)=>{
    const imgs=[...e.clipboardData?.items||[]].filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);
    if(imgs.length)handleFiles(imgs);
  };

  const sendMsg = async () => {
    if ((!input.trim() && atts.length === 0) || loading) return;
    
    const text = input.trim();
    setInput("");
    
    const userContent = [];
    atts.forEach(a => {
      if (a.type === "image") {
        userContent.push({ 
          type: "image", 
          source: { 
            type: "base64", 
            media_type: a.mediaType, 
            data: a.base64 
          } 
        });
      } else {
        userContent.push({ 
          type: "text", 
          text: `[File: ${a.name}]\n${a.content?.slice(0, 4000) || ""}` 
        });
      }
    });

let previousDesignsContext = '';
try {
  const token = localStorage.getItem('token');
  if (token) {
    const designsRes = await fetch('http://localhost:3001/api/user-designs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (designsRes.ok) {
      const { designs } = await designsRes.json();
      if (designs && designs.length > 0) {
        previousDesignsContext = `Basado en tus ${designs.length} diseños anteriores: `;
      }
    }
  }
} catch (e) {
  console.log('No se pudieron obtener diseños anteriores', e);
}


    let finalText = text;
    
    if (previousDesignsContext) {
      finalText = previousDesignsContext + finalText;
    }
    
    if (els.length > 0) {
      const elementSummary = els.slice(0, 5).map(e => `${e.type} (${e.x},${e.y})`).join(', ');
      finalText = `[Diseño actual: ${els.length} elementos - ${elementSummary}${els.length > 5 ? '...' : ''}]. ${finalText}`;
    }
    
    if (finalText) {
      userContent.push({ type: "text", text: finalText });
    }

    setMsgs(prev => [...prev, { 
      role: "user", 
      text: [atts.map(a => `📎 ${a.name}`).join(" "), text].filter(Boolean).join("\n"), 
      atts: [...atts] 
    }]);
    setAtts([]);
    setLoading(true);

    const hist = msgs.slice(-6).map(m => ({ 
      role: m.role === "ai" ? "assistant" : "user", 
      content: m.text 
    }));

    try {
      const { text: aiText, layout } = await callAI(hist.concat([{ 
        role: "user", 
        content: userContent.length === 1 && userContent[0].type === "text" 
          ? userContent[0].text 
          : userContent 
      }]));

      if (layout) {
        if (layout.canvasThemeId) {
          const ti = CT.findIndex(t => t.id === layout.canvasThemeId);
          if (ti >= 0) setCtIdx(ti);
        }
        if (layout.elements?.length) {
          const newEls = layout.elements.map(e => ({
            ...e,
            w: e.w || 160,
            h: e.h || 90
          }));
          setEls(newEls);
          pushHistory(newEls);
          setNextId(Math.max(...layout.elements.map(e => e.id), nextId) + 1);
          setSel(null);
        }
        if (layout.header) setHdrCfg(h => ({ ...h, ...layout.header }));
        if (layout.navConfig) setNavCfg(n => ({ ...n, ...layout.navConfig }));
      }

      setMsgs(prev => [...prev, { role: "ai", text: aiText || "Diseño aplicado en el canvas." }]);
    } catch (error) {
      console.error('Error en sendMsg:', error);
      setMsgs(prev => [...prev, { role: "ai", text: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset=(key)=>{
    const p=PRESETS[key]; if(!p)return;
    const ti=CT.findIndex(t=>t.id===p.themeId);
    if(ti>=0)setCtIdx(ti);
    setNavCfg(p.nav); setHdrCfg(p.header);
    const newEls=p.els.map(e=>({...e}));
    setEls(newEls); pushHistory(newEls); setSel(null);
    setMsgs(m=>[...m,{role:"ai",text:`✅ Plantilla "${key}" cargada — ${p.els.length} elementos, tema ${CT.find(t=>t.id===p.themeId)?.name}.`}]);
  };

  const analyzeDesign = async () => {
    if (els.length === 0) {
      setMsgs(prev => [...prev, { 
        role: "ai", 
        text: "Primero necesitas tener algunos elementos en el canvas para poder sugerir mejoras. Arrastra algunos elementos o pide a la IA que genere un diseño." 
      }]);
      return;
    }
  
    setSuggestionsLoading(true);
    
    try {
      const designSummary = {
        theme: ct.name,
        elements: els.map(e => ({
          type: e.type,
          label: e.label,
          position: { x: e.x, y: e.y },
          size: { w: e.w, h: e.h }
        }))
      };
  
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          design: designSummary,
          theme: ct
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener sugerencias');
      }
  
      setSuggestions(data.suggestions);
      
      setMsgs(prev => [...prev, { 
        role: "ai", 
        text: `🔍 **Análisis de diseño completado**\n\n${data.suggestions}` 
      }]);
      
    } catch (error) {
      console.error('Error en analyzeDesign:', error);
      setMsgs(prev => [...prev, { 
        role: "ai", 
        text: `Error al analizar el diseño: ${error.message}` 
      }]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const dlDataUri=(n,c,m)=>{const a=document.createElement("a");a.href="data:"+m+";charset=utf-8,"+encodeURIComponent(c);a.download=n;document.body.appendChild(a);a.click();document.body.removeChild(a);};
  const downloadAll=()=>{
    dlDataUri("pbi-theme.json",JSON.stringify(buildThemeJson(ct),null,2),"application/json");
    dlDataUri("pbi-layout.json",JSON.stringify(buildLayoutJson(els,ct,navCfg,hdrCfg),null,2),"application/json");
    dlDataUri("README.txt",buildReadme(els,ct,navCfg),"text/plain");
    if(navCfg.exportSeparate)dlDataUri("pbi-nav.json",JSON.stringify({navigation:{...navCfg,accent:ct.accent}},null,2),"application/json");
  };

  const B=(x={})=>({padding:"5px 11px",background:APP.surface,border:`1px solid ${APP.border2}`,color:APP.textMuted,borderRadius:6,cursor:"pointer",fontSize:9,fontFamily:"'Segoe UI',sans-serif",...x});
  const PB=(x={})=>({padding:"5px 14px",background:APP.accent,border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontSize:9,fontWeight:700,...x});
  const IS={background:APP.surface,border:`1px solid ${APP.border2}`,color:APP.text,borderRadius:5,padding:"4px 8px",fontSize:9,fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box"};
  const LS={fontSize:8,color:APP.textMuted,fontFamily:"monospace",letterSpacing:0.4,marginBottom:3,display:"block",textTransform:"uppercase"};

  return(
    <div style={{width:"100vw",height:"100vh",background:APP.bg,display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',system-ui,sans-serif",overflow:"hidden",color:APP.text}}>
      <div style={{height:48,background:APP.surface,borderBottom:`1px solid ${APP.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:10,zIndex:1000,boxShadow:APP.shadow,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:4}}>
          <div style={{width:26,height:26,borderRadius:6,background:`linear-gradient(135deg,${APP.accent},#1d4ed8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900}}>⬡</div>
          <div><div style={{fontSize:11,fontWeight:800,color:APP.text,lineHeight:1.1}}>PBI Designer</div><div style={{fontSize:7,color:APP.textLight,fontFamily:"monospace",letterSpacing:0.8}}>v1.3 · AI-POWERED</div></div>
        </div>
        <div style={{width:1,height:22,background:APP.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:8,color:APP.textMuted,fontFamily:"monospace",flexShrink:0}}>CANVAS</span>
          {CT.map((t,i)=>(<div key={i} onClick={()=>setCtIdx(i)} title={t.name} style={{width:14,height:14,borderRadius:3,background:t.accent,cursor:"pointer",border:`2px solid ${i===ctIdx?APP.text:APP.border}`,transform:i===ctIdx?"scale(1.3)":"scale(1)",transition:"all 0.15s"}}/>))}
          <span style={{fontSize:8,color:APP.accent,fontFamily:"monospace",background:APP.accentBg,padding:"2px 6px",borderRadius:4,border:`1px solid ${APP.accentLight}`,whiteSpace:"nowrap"}}>{ct.name}</span>
        </div>
        <div style={{width:1,height:22,background:APP.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <button onClick={()=>setZoom(z=>+(Math.max(0.3,z-0.1)).toFixed(1))} style={B({width:22,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14})}>−</button>
          <span style={{fontSize:9,color:APP.textMuted,fontFamily:"monospace",width:34,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>+(Math.min(2,z+0.1)).toFixed(1))} style={B({width:22,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14})}>+</button>
          <button onClick={()=>setZoom(0.82)} style={B({fontSize:8,padding:"0 6px",height:22})}>FIT</button>
        </div>
        <div style={{width:1,height:22,background:APP.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          {[["⊡",showGrid,"Grid",()=>setShowGrid(x=>!x)],["⊞",snapGrid,"Snap",()=>setSnapGrid(x=>!x)]].map(([ic,on,tip,fn])=>(
            <button key={tip} onClick={fn} title={tip} style={B({width:26,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,background:on?APP.accentBg:"transparent",borderColor:on?APP.accentLight:APP.border2,color:on?APP.accent:APP.textLight})}>{ic}</button>
          ))}
        </div>
        <div style={{width:1,height:22,background:APP.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <button onClick={undo} disabled={histIdx===0} title="Undo (Ctrl+Z)" style={B({width:24,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:histIdx===0?0.35:1})}>↩</button>
          <button onClick={redo} disabled={histIdx>=history.length-1} title="Redo (Ctrl+Y)" style={B({width:24,height:22,padding:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:histIdx>=history.length-1?0.35:1})}>↪</button>
        </div>
        <span style={{fontSize:8,color:APP.textLight,fontFamily:"monospace"}}>{els.length} elem</span>
        {dragStatus&&<span style={{fontSize:8,color:APP.accent,fontFamily:"monospace",background:APP.accentBg,padding:"2px 7px",borderRadius:4,border:`1px solid ${APP.accentLight}`}}>x:{dragStatus.x} y:{dragStatus.y} {dragStatus.w?`| w:${dragStatus.w} h:${dragStatus.h}`:""}</span>}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
          {sel&&<button onClick={()=>{setEls(a=>{const n=a.filter(e=>e.id!==sel);pushHistory(n);return n;});setSel(null);}} style={B({color:APP.danger,borderColor:"#fecaca",background:"#fff5f5",fontSize:9})}>🗑 Delete</button>}
          <button onClick={()=>setAiOpen(o=>!o)} style={B({color:APP.accent,borderColor:APP.accentLight,background:APP.accentBg})}>{aiOpen?"▶ Ocultar IA":"◀ Chat IA"}</button>
          <button 
            onClick={() => {
              if (typeof analyzeDesign === 'function') {
                analyzeDesign();
              } else {
                console.error('analyzeDesign no está definida');
              }
            }} 
            disabled={suggestionsLoading || els.length === 0}
            style={{
              padding: "5px 11px",
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              color: "#2563eb",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 9,
              fontFamily: "'Segoe UI',sans-serif",
              marginRight: 4,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            title="Analizar diseño y sugerir mejoras"
          >
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ fontSize: 9 }}>Sugerencias</span>
            {suggestionsLoading && <span style={{ fontSize: 9, marginLeft: 4 }}>...</span>}
          </button>
          <button onClick={()=>setExportModal(true)} style={PB({boxShadow:`0 3px 10px ${APP.accent}35`})}>↗ Exportar a Power BI</button>
        </div>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{width:162,background:APP.surface,borderRight:`1px solid ${APP.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{display:"flex",borderBottom:`1px solid ${APP.border}`,flexShrink:0}}>
            {[["elements","⊞"],["properties","⚙"],["presets","⬡"]].map(([t,ic])=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px 0",background:tab===t?APP.accentBg:"transparent",border:"none",color:tab===t?APP.accent:APP.textMuted,fontSize:12,cursor:"pointer",borderBottom:tab===t?`2px solid ${APP.accent}`:"2px solid transparent",transition:"all 0.15s"}}>{ic}</button>
            ))}
          </div>
          {tab==="elements"&&(
            <div style={{flex:1,overflowY:"auto",padding:"7px 6px"}}>
              <div style={{fontSize:7,color:APP.textLight,fontFamily:"monospace",letterSpacing:1.1,padding:"3px 6px 6px",textTransform:"uppercase"}}>Arrastra al canvas</div>
              {PALETTE.map(p=>(
                <div key={p.type} draggable onDragStart={e=>e.dataTransfer.setData("elementType",p.type)}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:5,background:APP.bg,border:`1px solid ${APP.border}`,cursor:"grab",marginBottom:3,transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${p.color}10`;e.currentTarget.style.borderColor=`${p.color}45`;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=APP.bg;e.currentTarget.style.borderColor=APP.border;}}>
                  <span style={{fontSize:12,width:16,textAlign:"center",flexShrink:0}}>{p.icon}</span>
                  <span style={{fontSize:9,color:APP.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</span>
                </div>
              ))}
              <div style={{padding:"8px 6px 2px",borderTop:`1px dashed ${APP.border}`,marginTop:4}}>
                <div style={{fontSize:7,color:APP.textLight,fontFamily:"monospace",letterSpacing:0.8,marginBottom:4}}>SHORTCUTS</div>
                {[["Del/⌫","Eliminar selec."],["Ctrl+Z","Deshacer"],["Ctrl+Y","Rehacer"],["↑↓←→","Mover 1px"],["⇧+↑↓","Mover 8px"],["Esc","Deseleccionar"]].map(([k,d])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:7,fontFamily:"monospace",color:APP.accent,background:APP.accentBg,padding:"1px 4px",borderRadius:3}}>{k}</span>
                    <span style={{fontSize:7,color:APP.textMuted}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="properties"&&(
            <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
              {!selEl?(
                <div style={{fontSize:9,color:APP.textLight,textAlign:"center",padding:"24px 8px",lineHeight:2}}>Selecciona un elemento<br/>para editar sus<br/>propiedades</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{fontSize:8,color:APP.accent,fontFamily:"monospace",letterSpacing:1,textTransform:"uppercase",padding:"3px 4px",background:APP.accentBg,borderRadius:4,textAlign:"center"}}>{selEl.type} #{selEl.id}</div>
                  {[["Label","label","text",selEl.label],["X px","x","number",selEl.x],["Y px","y","number",selEl.y],["Ancho","w","number",selEl.w],["Alto","h","number",selEl.h]].map(([l,f,t,v])=>(
                    <div key={f}>
                      <label style={LS}>{l}</label>
                      <input type={t} value={v} onChange={e=>updateEl(selEl.id,{[f]:f==="label"?e.target.value:Math.max(f==="x"||f==="y"?0:MIN_W,parseInt(e.target.value)||0)})}
                        onBlur={e=>commitEl(selEl.id,{[f]:f==="label"?e.target.value:Math.max(f==="x"||f==="y"?0:MIN_W,parseInt(e.target.value)||0)})}
                        style={IS}/>
                    </div>
                  ))}
                  {selEl.type==="nav"&&(
                    <div style={{padding:"8px",background:APP.bg,borderRadius:6,border:`1px solid ${APP.border}`}}>
                      <div style={{fontSize:8,color:APP.accent,fontFamily:"monospace",marginBottom:6}}>NAV CONFIG</div>
                      <label style={LS}>Posición</label>
                      <select value={navCfg.position} onChange={e=>setNavCfg(n=>({...n,position:e.target.value}))} style={{...IS,marginBottom:6}}>
                        <option value="left">Izquierda</option><option value="right">Derecha</option><option value="top">Superior</option><option value="none">Ninguno</option>
                      </select>
                      <label style={LS}>Estilo</label>
                      <select value={navCfg.style} onChange={e=>setNavCfg(n=>({...n,style:e.target.value}))} style={{...IS,marginBottom:7}}>
                        <option value="static">Estático</option><option value="collapsible">Colapsable</option><option value="floating">Flotante</option>
                      </select>
                      <label style={{...LS,display:"flex",alignItems:"center",gap:5,textTransform:"none",letterSpacing:0,cursor:"pointer"}}>
                        <input type="checkbox" checked={navCfg.exportSeparate} onChange={e=>setNavCfg(n=>({...n,exportSeparate:e.target.checked}))} style={{accentColor:APP.accent}}/>
                        <span>Exportar nav separado</span>
                      </label>
                    </div>
                  )}
                  {selEl.type==="header"&&(
                    <div style={{padding:"8px",background:APP.bg,borderRadius:6,border:`1px solid ${APP.border}`}}>
                      <div style={{fontSize:8,color:APP.accent,fontFamily:"monospace",marginBottom:6}}>HEADER CONFIG</div>
                      {[["Título","title",hdrCfg.title],["Subtítulo","subtitle",hdrCfg.subtitle]].map(([l,f,v])=>(
                        <div key={f} style={{marginBottom:5}}>
                          <label style={LS}>{l}</label>
                          <input value={v} onChange={e=>setHdrCfg(h=>({...h,[f]:e.target.value}))} style={IS}/>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={()=>{setEls(a=>{const n=a.filter(e=>e.id!==sel);pushHistory(n);return n;});setSel(null);}} style={B({color:APP.danger,borderColor:"#fecaca",background:"#fff5f5",width:"100%",marginTop:2})}>🗑 Eliminar</button>
                </div>
              )}
            </div>
          )}
          {tab==="presets"&&(
            <div style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
              <div style={{fontSize:7,color:APP.textLight,fontFamily:"monospace",letterSpacing:1,padding:"3px 6px 7px",textTransform:"uppercase"}}>Plantillas completas</div>
              {[{k:"sales",i:"📊",l:"Ventas",c:"#2563eb"},{k:"finance",i:"💰",l:"Finanzas",c:"#7c3aed"},{k:"hr",i:"👥",l:"RRHH",c:"#db2777"},{k:"marketing",i:"📢",l:"Marketing",c:"#ea580c"}].map(p=>(
                <div key={p.k} onClick={()=>loadPreset(p.k)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 9px",borderRadius:6,background:APP.bg,border:`1px solid ${APP.border}`,cursor:"pointer",marginBottom:4,transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${p.c}10`;e.currentTarget.style.borderColor=`${p.c}40`;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=APP.bg;e.currentTarget.style.borderColor=APP.border;}}>
                  <span style={{fontSize:14}}>{p.i}</span>
                  <div><div style={{fontSize:9,color:APP.text,fontWeight:600}}>{p.l}</div><div style={{fontSize:8,color:APP.textMuted}}>Layout + nav + tema</div></div>
                </div>
              ))}
              <div style={{padding:"9px",borderRadius:6,background:APP.accentBg,border:`1px dashed ${APP.accentLight}`,fontSize:8,color:APP.textMuted,lineHeight:1.7,textAlign:"center",marginTop:4}}>
                O describe tu reporte<br/>en el chat IA 💬
              </div>
            </div>
          )}
        </div>
        <div style={{flex:1,overflow:"auto",background:showGrid?"repeating-linear-gradient(0deg,transparent,transparent 31px,#e2e8f0 31px,#e2e8f0 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,#e2e8f0 31px,#e2e8f0 32px),#e8edf2":"#e8edf2"}}
          onClick={()=>setSel(null)} onDrop={handleDrop} onDragOver={e=>e.preventDefault()}>
          <div style={{padding:40,minWidth:"100%",minHeight:"100%",display:"inline-block"}}>
            <div ref={canvasRef}
              style={{position:"relative",width:960,height:580,background:ct.canvas,borderRadius:12,
                boxShadow:"0 8px 40px rgba(0,0,0,0.16),0 0 0 1px rgba(0,0,0,0.05)",
                transform:`scale(${zoom})`,transformOrigin:"top left",
                marginRight:`${(zoom-1)*960}px`,marginBottom:`${(zoom-1)*580}px`,
                overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:26,background:ct.id==="clean"?"rgba(0,0,0,0.025)":"rgba(0,0,0,0.25)",borderBottom:`1px solid ${ct.cardBorder}`,borderRadius:"12px 12px 0 0",display:"flex",alignItems:"center",padding:"0 10px",gap:4,zIndex:0,pointerEvents:"none",flexShrink:0}}>
                {["#ef4444","#f59e0b","#10b981"].map((c,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:c,opacity:0.5}}/>)}
                <span style={{fontSize:8,color:ct.textMuted,marginLeft:7,fontFamily:"monospace",opacity:0.7}}>Report Canvas — 960×580px</span>
                <span style={{marginLeft:"auto",fontSize:8,color:ct.textMuted,fontFamily:"monospace",opacity:0.5}}>{ct.name}</span>
              </div>
              <div style={{position:"absolute",inset:0,top:26,overflow:"hidden"}}>
                {els.length===0&&(
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,pointerEvents:"none",opacity:0.45}}>
                    <div style={{fontSize:28}}>⬡</div>
                    <div style={{fontSize:11,color:ct.textSub,textAlign:"center",lineHeight:1.8}}>Describe tu reporte en el chat IA<br/>o arrastra un elemento desde el panel</div>
                  </div>
                )}
                {els.map(el=>(
                  <CanvasEl key={el.id} el={el} ct={ct} selected={sel===el.id}
                    zoom={zoom}
                    onSelect={id=>{setSel(id);}}
                    onUpdate={(id,patch)=>{
                      updateEl(id,patch);
                      const target=els.find(e=>e.id===id);
                      if(target)setDragStatus({x:patch.x??target.x,y:patch.y??target.y,w:patch.w,h:patch.h});
                    }}
                    onDragStart={()=>{}}
                    onDragEnd={()=>{
                      setDragStatus(null);
                      setEls(curr=>{pushHistory([...curr]);return curr;});
                    }}
                    snapGrid={snapGrid} navCfg={navCfg} hdrCfg={hdrCfg}/>
                ))}
              </div>
            </div>
          </div>
        </div>
        {aiOpen&&(
          <div style={{width:288,background:APP.surface,borderLeft:`1px solid ${APP.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"9px 14px",borderBottom:`1px solid ${APP.border}`,display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:loading?"#f59e0b":APP.success,boxShadow:`0 0 5px ${loading?"#f59e0b":APP.success}`,transition:"all 0.3s"}}/>
              <span style={{fontSize:11,fontWeight:700,color:APP.text}}>AI Design Assistant</span>
              {loading&&<span style={{fontSize:8,color:APP.textMuted,marginLeft:"auto",fontFamily:"monospace"}}>generando…</span>}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
              {msgs.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:6}}>
                  {m.role==="ai"&&<div style={{width:20,height:20,borderRadius:"50%",background:APP.accentBg,border:`1px solid ${APP.accentLight}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0,marginTop:2}}>⬡</div>}
                  <div style={{maxWidth:"87%",padding:"7px 10px",borderRadius:m.role==="user"?"10px 10px 3px 10px":"3px 10px 10px 10px",
                    background:m.role==="user"?APP.accentBg:APP.bg,
                    border:`1px solid ${m.role==="user"?APP.accentLight:APP.border}`,
                    fontSize:10,color:APP.text,lineHeight:1.55,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                    {m.atts?.length>0&&<div style={{marginBottom:5,display:"flex",flexWrap:"wrap",gap:3}}>{m.atts.map((a,ai)=>(<span key={ai} style={{fontSize:8,padding:"2px 5px",background:APP.accentLight,borderRadius:4,color:APP.accent,fontFamily:"monospace"}}>{fileIcon(a.name)} {a.name.slice(0,16)}</span>))}</div>}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading&&(
                <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:APP.accentBg,border:`1px solid ${APP.accentLight}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>⬡</div>
                  <div style={{padding:"8px 14px",borderRadius:"3px 10px 10px 10px",background:APP.bg,border:`1px solid ${APP.border}`,fontSize:13,color:APP.textLight,letterSpacing:4}}>···</div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:"5px 10px",borderTop:`1px solid ${APP.border}`,display:"flex",flexWrap:"wrap",gap:3,flexShrink:0}}>
              {["Dashboard de ventas","Finanzas oscuro","Header corporativo","Menú derecho flotante","HR minimalista"].map(p=>(
                <button key={p} onClick={()=>setInput(p)} style={{fontSize:8,padding:"3px 6px",background:APP.bg,border:`1px solid ${APP.border}`,color:APP.textMuted,borderRadius:4,cursor:"pointer",fontFamily:"monospace",transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=APP.accent;e.currentTarget.style.color=APP.accent;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=APP.border;e.currentTarget.style.color=APP.textMuted;}}>{p}</button>
              ))}
            </div>
            {atts.length>0&&(
              <div style={{padding:"5px 10px",borderTop:`1px solid ${APP.border}`,display:"flex",flexWrap:"wrap",gap:3,flexShrink:0}}>
                {atts.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px",background:APP.accentBg,borderRadius:5,border:`1px solid ${APP.accentLight}`}}>
                    <span style={{fontSize:8,color:APP.accent,fontFamily:"monospace"}}>{fileIcon(a.name)} {a.name.slice(0,14)}</span>
                    <span onClick={()=>setAtts(a=>a.filter((_,j)=>j!==i))} style={{fontSize:11,color:APP.danger,cursor:"pointer",lineHeight:1}}>×</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{padding:"9px 12px",borderTop:`1px solid ${APP.border}`,flexShrink:0}}>
              <button onClick={()=>fileRef.current?.click()}
                style={{...B({width:"100%",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"5px"}),transition:"all 0.12s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=APP.accent;e.currentTarget.style.color=APP.accent;e.currentTarget.style.background=APP.accentBg;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=APP.border2;e.currentTarget.style.color=APP.textMuted;e.currentTarget.style.background=APP.surface;}}>
                📎 Adjuntar archivo (imagen, JSON, PDF, Excel…)
              </button>
              <input ref={fileRef} type="file" multiple accept="*/*" style={{display:"none"}} onChange={e=>{handleFiles(Array.from(e.target.files));e.target.value="";}}/>
              <div style={{display:"flex",gap:5,alignItems:"flex-end"}}>
                <textarea value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                  onPaste={handlePaste}
                  placeholder="Describe tu reporte… (Enter para enviar, Ctrl+V para pegar imagen)"
                  style={{flex:1,background:APP.bg,border:`1px solid ${loading?"#fbbf24":APP.border2}`,color:APP.text,borderRadius:7,padding:"7px 9px",fontSize:10,resize:"none",outline:"none",height:54,fontFamily:"'Segoe UI',sans-serif",transition:"border-color 0.2s",lineHeight:1.5}}/>
                <button onClick={sendMsg} disabled={loading||(!input.trim()&&atts.length===0)}
                  style={{width:30,height:30,borderRadius:7,background:(loading||(!input.trim()&&atts.length===0))?"#e2e8f0":APP.accent,border:"none",color:(loading||(!input.trim()&&atts.length===0))?APP.textLight:"#fff",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>↑</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{height:22,background:APP.surface,borderTop:`1px solid ${APP.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:12,flexShrink:0}}>
        {[
          [`Canvas: 960×580px`,APP.textLight],
          [`Tema: ${ct.name}`,APP.textLight],
          [`Elementos: ${els.length}`,APP.textLight],
          [snapGrid?"⊞ Snap ON":"⊟ Snap OFF",snapGrid?APP.accent:APP.textLight],
          [selEl?`Sel: ${selEl.type} [${selEl.x},${selEl.y}] ${selEl.w}×${selEl.h}px`:"Ningún elemento seleccionado",selEl?APP.text:APP.textLight],
          [`Ctrl+Z deshacer · Del eliminar · ↑↓←→ mover`,APP.textLight],
        ].map(([t,c],i)=><span key={i} style={{fontSize:8,color:c,fontFamily:"monospace",whiteSpace:"nowrap"}}>{t}</span>)}
      </div>
      {exportModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)"}} onClick={e=>{if(e.target===e.currentTarget)setExportModal(false);}}>
          <div style={{background:APP.surface,border:`1px solid ${APP.border}`,borderRadius:14,padding:"22px 26px",width:440,boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{fontSize:15,fontWeight:800,color:APP.text}}>Exportar a Power BI</div>
              <button onClick={()=>setExportModal(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:APP.textMuted}}>×</button>
            </div>
            <div style={{fontSize:10,color:APP.textMuted,marginBottom:16}}>Un clic por archivo · se guardan en tu carpeta de Descargas</div>
            <div style={{background:APP.accentBg,border:`1px solid ${APP.accentLight}`,borderRadius:8,padding:"9px 14px",marginBottom:16,display:"flex",gap:16,flexWrap:"wrap"}}>
              {[["🎨","Tema",ct.name],["📊","Elementos",els.length],["☰","Nav",navCfg.position+"/"+navCfg.style]].map(([ic,l,v])=>(
                <div key={l} style={{fontSize:9}}><span style={{color:APP.accent,fontWeight:700}}>{ic} {l}: </span><span style={{color:APP.text}}>{v}</span></div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18}}>
              {[
                {n:"pbi-theme.json",ic:"🎨",d:"Power BI: View → Themes → Browse for themes",fn:()=>dlDataUri("pbi-theme.json",JSON.stringify(buildThemeJson(ct),null,2),"application/json")},
                {n:"pbi-layout.json",ic:"📐",d:"Referencia de posiciones y configuración de visuals",fn:()=>dlDataUri("pbi-layout.json",JSON.stringify(buildLayoutJson(els,ct,navCfg,hdrCfg),null,2),"application/json")},
                ...(navCfg.exportSeparate?[{n:"pbi-nav.json",ic:"☰",d:"Configuración de navegación separada",fn:()=>dlDataUri("pbi-nav.json",JSON.stringify({navigation:{...navCfg,accent:ct.accent}},null,2),"application/json")}]:[]),
                {n:"README.txt",ic:"📋",d:"Instrucciones paso a paso de importación",fn:()=>dlDataUri("README.txt",buildReadme(els,ct,navCfg),"text/plain")},
              ].map(f=>(
                <div key={f.n} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:7,background:APP.bg,border:`1px solid ${APP.border}`,transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=APP.accent;e.currentTarget.style.background=APP.accentBg;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=APP.border;e.currentTarget.style.background=APP.bg;}}>
                  <span style={{fontSize:16,flexShrink:0}}>{f.ic}</span>
                  <div style={{flex:1,overflow:"hidden"}}><div style={{fontSize:10,fontWeight:700,color:APP.text,fontFamily:"monospace"}}>{f.n}</div><div style={{fontSize:8,color:APP.textMuted}}>{f.d}</div></div>
                  <button onClick={f.fn} style={PB({padding:"5px 12px",fontSize:9,flexShrink:0})}>↓</button>
                </div>
              ))}
            </div>
            <button onClick={downloadAll} style={PB({width:"100%",padding:"11px",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 14px ${APP.accent}35`})}>
              ↓ Descargar todos de una vez
            </button>
          </div>
        </div>
      )}
    </div>
  );
}