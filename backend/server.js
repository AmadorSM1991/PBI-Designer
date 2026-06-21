// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');
const jwt = require('jsonwebtoken');

const authMiddleware = require('./middleware/auth');
console.log('✅ authMiddleware tipo:', typeof authMiddleware);

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: permite el frontend de Vite
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Rutas de autenticación
app.use('/api/auth', authRoutes);

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
// -------------------------------------------------------------------
// Endpoint simple de login (por si authRoutes no lo tiene aún)
// -------------------------------------------------------------------
app.post('/api/auth/simple-login', (req, res) => {
  const userId = '93fa7701-f2cd-4eb3-ae8a-3a174f3cbbe2';
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: userId, email: 'dev@example.com', credits: 100000 }
  });
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
        "waterfall": "bar",
        "ribbon": "line",
        "map": "image",
        "funnel": "bar",
        "donut": "pie",
        "donutChart": "pie",
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
app.post('/api/generate', authMiddleware, async (req, res) => {
  const { messages, system } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verificar créditos suficientes
    if (req.user.credits <= 0) {
      return res.status(402).json({
        error: 'Créditos insuficientes',
        creditsBalance: req.user.credits
      });
    }

    // 2. Construir la lista de mensajes para Groq
    const effectiveSystem = system || AI_SYS;
    const groqMessages = [
      { role: 'system', content: effectiveSystem },
      ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
    ];

    console.log('📤 Enviando a Groq...');
    console.log('System prompt usado:', effectiveSystem.substring(0, 200));

    // 3. Llamar a Groq (sin forzar response_format para permitir <LAYOUT>)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2500
        // NOTA: se eliminó response_format para que la IA pueda incluir la etiqueta <LAYOUT>
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error Groq:', data);
      throw new Error(data.error?.message || 'Error en el servicio Groq');
    }

    // 4. Extraer texto de la respuesta
    const rawText = data.choices[0].message.content;
    console.log('📝 Respuesta de Groq (primeros 300 chars):', rawText.substring(0, 300));

    // 5. Calcular tokens usados (Groq devuelve usage.total_tokens)
    const tokensUsed = data.usage?.total_tokens || Math.ceil((JSON.stringify(groqMessages).length + rawText.length) / 4);

    // 6. Descontar créditos en Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: req.user.credits - tokensUsed })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error actualizando créditos:', updateError);
      // No interrumpimos el flujo
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

    // Intento 1: buscar etiqueta <LAYOUT>
    const layoutMatch = rawText.match(/<LAYOUT>([\s\S]*?)<\/LAYOUT>/);
    if (layoutMatch) {
      const jsonStr = layoutMatch[1].trim();
      try {
        layout = JSON.parse(jsonStr);
        cleanText = rawText.replace(/<LAYOUT>[\s\S]*?<\/LAYOUT>/, '').trim();
        console.log('✅ Layout extraído mediante <LAYOUT>');
      } catch (e) {
        console.error('❌ Error parseando JSON dentro de <LAYOUT>:', e.message);
      }
    } else {
      // Intento 2: intentar parsear todo el texto como JSON (válido)
      const trimmed = rawText.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          layout = JSON.parse(trimmed);
          cleanText = ''; // el texto completo era el layout
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
    console.error('❌ Error en /api/generate:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------------
// ENDPOINT: Sugerencias de mejora (PROTEGIDO)
// -------------------------------------------------------------------
app.post('/api/suggest', authMiddleware, async (req, res) => {
  const { design, theme } = req.body;

  try {
    const prompt = `Como experto en diseño de dashboards de Power BI, analiza este layout y sugiere 3-5 mejoras específicas.

TEMA ACTUAL: ${theme.name} (${theme.accent})

ELEMENTOS:
${design.elements.map(e =>
    `- ${e.type.toUpperCase()} "${e.label}": en (${e.position.x},${e.position.y}) de ${e.size.w}x${e.size.h}px`
  ).join('\n')}

Por favor, proporciona sugerencias concretas sobre:
1. Mejoras en la disposición (alineación, agrupación, espaciado)
2. Elementos faltantes que mejorarían el dashboard
3. Optimización de colores y contraste
4. Jerarquía visual y flujo de lectura
5. Cualquier otra recomendación profesional

Formato de respuesta: Solo texto en español, con viñetas o párrafos claros.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en Groq');
    }

    const suggestions = data.choices[0].message.content;
    res.json({ suggestions });

  } catch (error) {
    console.error('❌ Error en /api/suggest:', error);
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------------
// ENDPOINT: Guardar diseño (PROTEGIDO)
// -------------------------------------------------------------------
app.post('/api/save-design', authMiddleware, async (req, res) => {
  const { name, layout } = req.body;
  try {
    const { data, error } = await supabase
      .from('user_designs')
      .insert([{ user_id: req.user.id, name: name || `Diseño ${new Date().toLocaleString()}`, layout }])
      .select();

    if (error) throw error;
    res.json({ success: true, design: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------------
// Endpoint de depuración (genera token)
// -------------------------------------------------------------------
app.get('/api/debug-token/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});