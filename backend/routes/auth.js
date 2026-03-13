const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Crear perfil en la tabla profiles con créditos iniciales
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { id: authData.user.id, email, credits: 100000 }
      ]);

    if (profileError) throw profileError;

    // Generar token JWT propio
    const token = jwt.sign(
      { userId: authData.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: authData.user.id, email, credits: 100000 } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // Obtener créditos del perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    const token = jwt.sign(
      { userId: authData.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: authData.user.id,
        email,
        credits: profile.credits
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

module.exports = router;