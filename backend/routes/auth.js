// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const router = express.Router();

// Registro de nuevo usuario
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Crear perfil en tabla profiles (con créditos iniciales)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, email, credits: 100000 }]);

    if (profileError) throw profileError;

    // 3. Generar token JWT propio
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: userId, email, credits: 100000 }
    });
  } catch (error) {
    console.error('Registro error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Autenticar con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    const userId = authData.user.id;

    // Obtener créditos del perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: userId, email, credits: profile.credits }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Verificar token (para pruebas)
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('id', decoded.userId)
      .single();
    if (error || !user) throw new Error('Usuario no encontrado');
    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;