const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const authMiddleware = async (req, res, next) => {
  console.log('\n========== AUTH MIDDLEWARE ==========');
  
  try {
    // 1. Verificar header
    const authHeader = req.headers.authorization;
    console.log('1. Headers completos:', req.headers);
    console.log('2. Auth header:', authHeader);

    if (!authHeader) {
      console.log('❌ 3. No hay auth header');
      return res.status(401).json({ error: 'No autorizado - Sin header' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ 4. Header no empieza con Bearer');
      return res.status(401).json({ error: 'No autorizado - Formato incorrecto' });
    }

    const token = authHeader.split(' ')[1];
    console.log('5. Token extraído (primeros 20):', token.substring(0, 20) + '...');

    // 2. Verificar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.log('❌ 6. JWT_SECRET no está definido');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }
    console.log('6. JWT_SECRET existe');

    // 3. Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('7. Token decodificado:', decoded);
    } catch (jwtError) {
      console.log('❌ 7. Error al verificar token:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }

    // 4. Buscar usuario en Supabase
    console.log('8. Buscando usuario con ID:', decoded.userId);
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error) {
      console.log('❌ 9. Error en Supabase:', error.message);
      
      // Intentar crear el usuario automáticamente
      console.log('10. Intentando crear usuario automáticamente...');
      const { data: newUser, error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          id: decoded.userId, 
          email: 'usuario_' + Date.now() + '@temp.com', 
          credits: 100000 
        }])
        .select()
        .single();

      if (insertError) {
        console.log('❌ 11. No se pudo crear usuario:', insertError.message);
        return res.status(401).json({ error: 'Usuario no encontrado y no se pudo crear' });
      }

      console.log('✅ 11. Usuario creado automáticamente:', newUser.id);
      req.user = newUser;
      return next();
    }

    if (!user) {
      console.log('❌ 9. Usuario no encontrado en BD');
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ 9. Usuario encontrado:', user.email, 'Créditos:', user.credits);
    req.user = user;
    next();

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return res.status(401).json({ error: 'Error de autenticación' });
  }
};

module.exports = authMiddleware;