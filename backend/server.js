// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');
const jwt = require('jsonwebtoken'); // <-- MOVER AL INICIO

const authMiddleware = require('./middleware/auth');
console.log('✅ authMiddleware tipo:', typeof authMiddleware); // Debe decir "function"

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Rutas de autenticación
app.use('/api/auth', authRoutes);

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

    // 2. Construir el prompt combinado
    const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = system + '\n\n' + conversation;

    console.log('📤 Enviando a Gemini...');

    // 3. Llamar a Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error Gemini:', data);
      throw new Error(data.error?.message || 'Error en el servicio Gemini');
    }

    // 4. Extraer texto
    const text = data.candidates[0].content.parts[0].text;

    // 5. Estimar tokens usados
    const tokensUsed = Math.ceil((fullPrompt.length + text.length) / 4);

    // 6. Descontar créditos en Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: req.user.credits - tokensUsed })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error actualizando créditos:', updateError);
      // No interrumpimos el flujo, solo logueamos
    }

    // 7. Registrar consumo (opcional - comentar si la tabla no existe)
    try {
      await supabase
        .from('credit_usage')
        .insert([{
          user_id: userId,
          tokens_used: tokensUsed,
          request_id: data.candidates[0]?.tokenCount || 'unknown'
        }]);
    } catch (usageError) {
      console.log('⚠️ No se pudo registrar consumo (tabla credit_usage puede no existir)');
    }

    // 8. Extraer el bloque <LAYOUT>
    const layoutMatch = text.match(/<LAYOUT>([\s\S]*?)<\/LAYOUT>/);
    let layout = null;
    if (layoutMatch) {
      try {
        layout = JSON.parse(layoutMatch[1].replace(/```json\n?|```/g, '').trim());
      } catch (e) {
        console.error('❌ Error parseando layout:', e);
      }
    }

    // 9. Validar layout (opcional)
    function validateLayout(elements) {
      if (!elements) return true;
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const a = elements[i], b = elements[j];
          const overlap = !(a.x + a.w <= b.x || b.x + b.w <= a.x ||
            a.y + a.h <= b.y || b.y + b.h <= a.y);
          if (overlap) return false;
        }
      }
      return true;
    }

    // 10. Devolver respuesta
    res.json({
      text: text.replace(/<LAYOUT>[\s\S]*?<\/LAYOUT>/g, '').trim(),
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en Gemini');
    }

    const suggestions = data.candidates[0].content.parts[0].text;
    res.json({ suggestions });

  } catch (error) {
    console.error('❌ Error en /api/suggest:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------------
// ENDPOINT: Obtener diseños anteriores (PROTEGIDO)
// -------------------------------------------------------------------


// Cambia esto:
// app.get('/api/user-designs', authMiddleware, async (req, res) => {

// Por esto (sin autenticación, SOLO PARA PRUEBAS):
/*app.get('/api/user-designs', async (req, res) => {
  // Usuario fijo para pruebas
  const userId = '93fa7701-f2cd-4eb3-ae8a-3a174f3cbbe2';
  
  try {
    const { data: designs, error } = await supabase
      .from('user_designs')
      .select('layout')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;
    res.json({ designs });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
*/

app.get('/api/user-designs', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: designs, error } = await supabase
      .from('user_designs')
      .select('layout')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    res.json({ designs });
  } catch (error) {
    console.error('❌ Error al obtener diseños:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------------
// ENDPOINT: Depuración - Generar token (NO PROTEGIDO, SOLO PRUEBAS)
// -------------------------------------------------------------------
app.get('/api/debug-token/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('❌ Error al generar token:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});