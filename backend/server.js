// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const supabase = require('./supabase');
const jwt = require('jsonwebtoken');

const authMiddleware = require('./middleware/auth');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: permite el frontend (dev = localhost, prod = FRONTEND_URL env var)
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------------
// RATE LIMITING
// -------------------------------------------------------------------
// Límite general: 200 req/15 min por IP (protege contra scraping/bots)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.' },
});
app.use(generalLimiter);

// Límite estricto para endpoints de IA: 12 req/min por IP
// (Gemini free tier: 15 RPM — dejamos margen de 3 para latencia)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de IA alcanzado (12 por minuto). Espera un momento.' },
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: options.message.error,
      retryAfter,
      limit: options.max,
    });
  },
});

// Límite para auth: 10 intentos/15 min (protege contra brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Espera 15 minutos.' },
});

// Rutas de autenticación
app.use('/api/auth', authLimiter, authRoutes);

// -------------------------------------------------------------------
// Prompt del sistema (definido ANTES de usarlo)
// -------------------------------------------------------------------
const AI_SYS = `Eres un arquitecto de dashboards de Power BI. Genera layouts con las siguientes reglas:

1. Usa ÚNICAMENTE los siguientes tipos: kpi, bar, line, pie, table, slicer, nav, header, card, button, image.
2. Para KPIs, usa SOLO estos labels: "Total Revenue", "Units Sold", "Avg. Deal", "Win Rate %", "Net Revenue", "EBITDA", "Net Margin", "Cash Flow", "Headcount", "Attrition %", "Impressions", "CTR %", "Conversions", "CAC", "ROAS", "Deliveries", "On-Time %".
3. Disposición típica: header en y=0, nav izquierdo en x=0, luego KPIs en fila (y=70, x comenzando desde 200, cada uno con ancho 180, alto 90, separación 8px).
4. Gráficos debajo de KPIs (y=170, ancho ~350, alto 200).
5. Tablas o slicers en la parte inferior (y=380).
6. Todas las coordenadas deben ser múltiplos de 8 y respetar el canvas de 960x580.

Ejemplo de layout correcto:
<LAYOUT>{"canvasThemeId":"clean","header":
{"show":true,"title":"Dashboard","subtitle":"Ventas","height":58,"bgColor":""},
"navConfig":{"position":"left","style":"static","width":190},
"elements":[{"id":1,"type":"kpi","x":198,"y":66,"w":180,"h":88,"label":"Total Revenue"},
{"id":2,"type":"kpi","x":386,"y":66,"w":180,"h":88,"label":"Units Sold"},
{"id":3,"type":"bar","x":198,"y":162,"w":370,"h":210,"label":"Ventas por Región"},
{"id":4,"type":"line","x":576,"y":162,"w":376,"h":210,"label":"Tendencia Mensual"}]}
</LAYOUT>`;

const SUGGEST_SYS = 'Eres un experto en diseño de dashboards de Power BI. Responde siempre en español con sugerencias concretas y accionables, usando viñetas (•). Sé directo y específico.';

// -------------------------------------------------------------------
// Endpoint simple de login (por si authRoutes no lo tiene aún)
// -------------------------------------------------------------------
app.post('/api/auth/simple-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });
  const userId = '93fa7701-f2cd-4eb3-ae8a-3a174f3cbbe2';
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: userId, email: 'dev@example.com', credits: 100000 }
  });
});

// -------------------------------------------------------------------
// Endpoint de desarrollo: recargar créditos (solo dev/local)
// -------------------------------------------------------------------
app.post('/api/dev/add-credits', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });
  next();
}, async (req, res) => {
  const DEV_USER_ID = '93fa7701-f2cd-4eb3-ae8a-3a174f3cbbe2';
  const rawAmount = Number(req.body?.amount) || 500000;
  const amount = Math.max(1, Math.min(rawAmount, 10_000_000));
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('profiles').select('credits').eq('id', DEV_USER_ID).single();
    if (fetchErr) throw fetchErr;
    const { data, error } = await supabase
      .from('profiles')
      .update({ credits: (current.credits || 0) + amount })
      .eq('id', DEV_USER_ID)
      .select('id, credits')
      .single();
    if (error) throw error;
    res.json({ success: true, credits: data.credits, message: `+${amount} créditos → total ${data.credits}` });
  } catch (err) {
    console.error('❌ Error recargando créditos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// -------------------------------------------------------------------
// Función auxiliar para normalizar un layout (convierte formatos alternativos)
// -------------------------------------------------------------------
function normalizeLayout(layout) {
  if (!layout) return null;

  // Normalizar elementos: convertir width->w, height->h, displayName->label, etc.
  if (layout.elements && Array.isArray(layout.elements)) {
    layout.elements = layout.elements.map(el => {
      // Mapeo de tipos no estándar
      const typeMap = {
        "lineChart": "line",
        "areaChart": "line",
        "splineChart": "line",
        "waterfall": "bar",
        "columnChart": "bar",
        "barChart": "bar",
        "clusteredBar": "bar",
        "ribbon": "line",
        "map": "image",
        "filledMap": "image",
        "funnel": "bar",
        "donut": "pie",
        "donutChart": "pie",
        "pieChart": "pie",
        "doughnut": "pie",
        "kpiCard": "kpi",
        "card": "kpi",
        "multiRowCard": "kpi",
        "scatterChart": "scatter",
        "bubbleChart": "scatter",
        "matrixVisual": "matrix",
        "tableEx": "table",
        "pivotTable": "matrix",
        "treemapChart": "treemap",
        "gauge": "gauge",
        "radialGauge": "gauge",
        "shape": "card",
        "textbox": "card",
        "slicer": "slicer",
      };
      return {
        id: el.id || Math.floor(Math.random() * 10000),
        type: typeMap[el.type] || el.type || "kpi",
        x: el.x || 0,
        y: el.y || 0,
        w: el.w || el.width || 160,
        h: el.h || el.height || 90,
        label: el.label || el.displayName || el.fields?.value || "Elemento"
      };
    });
  }

  // Normalizar header
  if (layout.header) {
    layout.header = {
      show: layout.header.show !== undefined ? layout.header.show : true,
      title: layout.header.title || layout.header.displayName || "Dashboard",
      subtitle: layout.header.subtitle || "",
      height: layout.header.height || 58,
      bgColor: layout.header.bgColor || ""
    };
  }

  // Normalizar navConfig
  if (layout.navConfig) {
    layout.navConfig = {
      position: layout.navConfig.position || "left",
      style: layout.navConfig.style || "static",
      width: layout.navConfig.width || 190
    };
  }

  return layout;
}

// -------------------------------------------------------------------
// ENDPOINT: Generar diseños con IA (PROTEGIDO)
// -------------------------------------------------------------------
app.post('/api/generate', aiLimiter, authMiddleware, async (req, res) => {
  const { messages, system } = req.body;
  const userId = req.user.id;

  // Validar estructura del body antes de procesar
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'El campo "messages" debe ser un array no vacío.' });
  }
  if (messages.length > 30) {
    return res.status(400).json({ error: 'Demasiados mensajes en la conversación (máx. 30).' });
  }

  try {
    // 1. Verificar créditos suficientes (mínimo 50 para intentar la operación)
    if (req.user.credits < 50) {
      return res.status(402).json({
        error: 'Créditos insuficientes',
        creditsBalance: req.user.credits
      });
    }

    // 2. Construir la lista de mensajes para Gemini
    // Aceptar system del cliente solo si es un prompt sustancial (>500 chars) — evita inyecciones triviales
    const effectiveSystem = (system && typeof system === 'string' && system.length > 500) ? system : AI_SYS;
    const groqMessages = [
      { role: 'system', content: effectiveSystem },
      ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
    ];

    console.log('📤 Enviando a Gemini...');

    // 3. Llamar a Gemini — con fallback automático si el modelo principal falla
    const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    let response, data, usedModel;
    for (const model of GEMINI_MODELS) {
      console.log(`📤 Intentando con modelo: ${model}`);
      try {
        response = await fetch(GEMINI_URL, {
          method: 'POST',
          signal: AbortSignal.timeout(30000),
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` },
          body: JSON.stringify({ model, messages: groqMessages, temperature: 0.3, max_tokens: 4000 })
        });
      } catch (fetchErr) {
        console.warn(`⚠️ ${model} error de red (${fetchErr.name}), probando siguiente...`);
        continue;
      }
      data = await response.json();
      const geminiErr = Array.isArray(data) ? data[0]?.error : data?.error;
      if (response.ok) { usedModel = model; break; }
      // 503 (sobrecarga) o 404 (modelo no disponible) → intentar siguiente
      if (response.status === 503 || response.status === 404 ||
          geminiErr?.code === 503 || geminiErr?.status === 'UNAVAILABLE') {
        console.warn(`⚠️ ${model} no disponible (${response.status}), probando siguiente modelo...`);
        continue;
      }
      if (response.status === 429) {
        return res.status(429).json({ error: '⏳ Límite de Gemini alcanzado. Espera 1 minuto e intenta de nuevo.', retryAfter: 60, limit: 15 });
      }
      // Otro error no recuperable
      console.error('❌ Error Gemini inesperado:', data);
      throw new Error(geminiErr?.message || `Error Gemini HTTP ${response.status}`);
    }

    if (!response.ok) {
      return res.status(503).json({ error: '⏳ Todos los modelos de Gemini están con alta demanda. Espera unos segundos e intenta de nuevo.' });
    }
    console.log(`✅ Usando modelo: ${usedModel}`);

    // 4. Extraer texto de la respuesta
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) {
      console.error('❌ Respuesta vacía de Gemini:', JSON.stringify(data).substring(0, 200));
      return res.status(503).json({ error: '⏳ El modelo devolvió una respuesta vacía. Intenta de nuevo.' });
    }
    console.log('📝 Respuesta de Gemini (primeros 300 chars):', rawText.substring(0, 300));

    // 5. Calcular tokens usados (Groq devuelve usage.total_tokens)
    const tokensUsed = data.usage?.total_tokens || Math.ceil((JSON.stringify(groqMessages).length + rawText.length) / 4);

    // 6. Descontar créditos en Supabase
    // .gte('credits', tokensUsed) actúa como guardia atómica contra race conditions
    const newCredits = Math.max(0, req.user.credits - tokensUsed);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId)
      .gte('credits', tokensUsed);

    if (updateError) {
      console.error('❌ Error actualizando créditos:', updateError);
      // No interrumpimos el flujo — la respuesta ya fue generada
    }

    // 7. Registrar consumo (opcional)
    try {
      await supabase
        .from('credit_usage')
        .insert([{
          user_id: userId,
          tokens_used: tokensUsed,
          request_id: data.id || 'unknown'
        }]);
    } catch (usageError) {
      console.log('⚠️ No se pudo registrar consumo (tabla credit_usage puede no existir)');
    }

    // 8. Extraer el layout: primero buscar <LAYOUT>, sino intentar parsear todo el texto como JSON
    let layout = null;
    let cleanText = rawText;

    // Sanitiza un string JSON: reemplaza saltos de línea/tab literales dentro
    // de valores string por sus secuencias de escape válidas en JSON.
    // Gemini suele meter \n literales en strings, lo que rompe JSON.parse.
    function sanitizeJson(str) {
      // Reemplaza newlines y tabs literales en una sola pasada eficiente
      return str.replace(/\r\n|\r|\n|\t/g, m =>
        m === '\t' ? '\\t' : '\\n'
      );
    }

    // Intento 1: buscar etiqueta <LAYOUT>
    const layoutMatch = rawText.match(/<LAYOUT>([\s\S]*?)<\/LAYOUT>/);
    if (layoutMatch) {
      // Siempre quitar el bloque <LAYOUT> del texto visible, aunque falle el parse
      cleanText = rawText.replace(/<LAYOUT>[\s\S]*?<\/LAYOUT>/, '').trim();
      const jsonStr = sanitizeJson(layoutMatch[1].trim());
      try {
        layout = JSON.parse(jsonStr);
        console.log('✅ Layout extraído mediante <LAYOUT>');
      } catch (e) {
        console.error('❌ Error parseando JSON dentro de <LAYOUT>:', e.message);
        // Intento de reparación: recortar al último } balanceado
        let cut = jsonStr.lastIndexOf('}');
        let attempts = 0;
        while (cut > 0 && attempts < 30) {
          const frag = jsonStr.slice(0, cut + 1);
          const oB = (frag.match(/{/g)||[]).length - (frag.match(/}/g)||[]).length;
          const oA = (frag.match(/\[/g)||[]).length - (frag.match(/]/g)||[]).length;
          const repaired = frag + ']'.repeat(Math.max(0,oA)) + '}'.repeat(Math.max(0,oB));
          try { layout = JSON.parse(repaired); console.log('✅ Layout reparado'); break; } catch(e2){}
          cut = jsonStr.lastIndexOf('}', cut - 1);
          attempts++;
        }
      }
    } else {
      // Intento 2: intentar parsear todo el texto como JSON directo
      const trimmed = sanitizeJson(rawText.trim());
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          layout = JSON.parse(trimmed);
          cleanText = '';
          console.log('✅ Layout extraído como JSON directo');
        } catch (e) {
          console.error('❌ Error parseando JSON directo:', e.message);
        }
      }
    }

    // Si se encontró un layout, normalizarlo (mapear tipos y atributos)
    if (layout) {
      layout = normalizeLayout(layout);
      console.log('🎨 Layout normalizado:', JSON.stringify(layout).substring(0, 200));
    } else {
      console.log('⚠️ No se pudo extraer ningún layout de la respuesta');
    }

    // 9. Devolver respuesta
    res.json({
      text: cleanText || (layout ? '✅ Layout aplicado.' : 'No se pudo generar el layout. Intenta de nuevo.'),
      layout,
      creditsUsed: tokensUsed,
      creditsRemaining: req.user.credits - tokensUsed
    });

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: '⏳ Gemini tardó demasiado en responder. Intenta de nuevo.' });
    }
    console.error('❌ Error en /api/generate:', error);
    res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo.' });
  }
});

// -------------------------------------------------------------------
// ENDPOINT: Sugerencias de mejora (PROTEGIDO)
// -------------------------------------------------------------------
app.post('/api/suggest', aiLimiter, authMiddleware, async (req, res) => {
  const { design, theme } = req.body;

  if (!design || !Array.isArray(design.elements)) {
    return res.status(400).json({ error: 'Se requiere "design.elements" como array.' });
  }

  if (req.user.credits < 50) {
    return res.status(402).json({ error: 'Créditos insuficientes', creditsBalance: req.user.credits });
  }

  try {
    const prompt = `Analiza este layout de dashboard de Power BI y sugiere 3-5 mejoras específicas.

TEMA ACTUAL: ${theme?.name || 'PBI Designer'} (${theme?.accent || '#2563eb'})

ELEMENTOS:
${design.elements.map(e =>
      `- ${(e.type||'').toUpperCase()} "${e.label}": en (${e.position?.x||e.x||0},${e.position?.y||e.y||0}) de ${e.size?.w||e.w||0}x${e.size?.h||e.h||0}px`
    ).join('\n')}

Proporciona sugerencias concretas sobre disposición, elementos faltantes, colores, jerarquía visual y flujo de lectura. Solo texto en español, con viñetas claras.`;

    const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    let response, data;
    for (const model of GEMINI_MODELS) {
      try {
        response = await fetch(GEMINI_URL, {
          method: 'POST',
          signal: AbortSignal.timeout(20000),
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SUGGEST_SYS },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });
      } catch (fetchErr) {
        console.warn(`⚠️ ${model} error de red (${fetchErr.name}), probando siguiente...`);
        continue;
      }
      data = await response.json();
      const geminiErr = Array.isArray(data) ? data[0]?.error : data?.error;
      if (response.ok) break;
      if (response.status === 503 || response.status === 404 ||
          geminiErr?.code === 503 || geminiErr?.status === 'UNAVAILABLE') continue;
      throw new Error(geminiErr?.message || `Error Gemini HTTP ${response.status}`);
    }

    if (!response.ok) {
      return res.status(503).json({ error: '⏳ Todos los modelos de Gemini están con alta demanda. Espera unos segundos.' });
    }

    const suggestions = data.choices?.[0]?.message?.content;
    if (!suggestions) {
      return res.status(503).json({ error: '⏳ El modelo devolvió una respuesta vacía. Intenta de nuevo.' });
    }

    const tokensUsed = data.usage?.total_tokens || Math.ceil((prompt.length + suggestions.length) / 4);
    const newCredits = Math.max(0, req.user.credits - tokensUsed);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', req.user.id)
      .gte('credits', tokensUsed);
    if (updateError) console.error('❌ Error actualizando créditos (suggest):', updateError);

    res.json({ suggestions, creditsUsed: tokensUsed, creditsRemaining: newCredits });

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: '⏳ Tiempo de espera agotado. Intenta de nuevo.' });
    }
    console.error('❌ Error en /api/suggest:', error);
    res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo.' });
  }
});

// -------------------------------------------------------------------
// ENDPOINT: Obtener diseños anteriores (PROTEGIDO)
// -------------------------------------------------------------------
app.get('/api/user-designs', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: designs, error } = await supabase
      .from('user_designs')
      .select('layout, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json({ designs });
  } catch (error) {
    console.error('❌ Error al obtener diseños:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// -------------------------------------------------------------------
// ENDPOINT: Guardar diseño (PROTEGIDO)
// -------------------------------------------------------------------
app.post('/api/save-design', authMiddleware, async (req, res) => {
  const { name, layout } = req.body;
  if (!layout || typeof layout !== 'object') {
    return res.status(400).json({ error: 'Layout inválido.' });
  }
  if (JSON.stringify(layout).length > 200 * 1024) {
    return res.status(400).json({ error: 'Layout demasiado grande (máx. 200KB).' });
  }
  try {
    const { data, error } = await supabase
      .from('user_designs')
      .insert([{ user_id: req.user.id, name: name || `Diseño ${new Date().toLocaleString()}`, layout }])
      .select();

    if (error) throw error;
    res.json({ success: true, design: data[0] });
  } catch (error) {
    console.error('❌ Error al guardar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});