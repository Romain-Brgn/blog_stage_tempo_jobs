const jwt = require("jsonwebtoken");

/**
 * Middleware d'authentification par JWT.
 * - Attend un header: Authorization: Bearer <token>
 * - Si OK: place le payload décodé dans req.user et appelle next()
 * - Sinon: renvoie 401
 */
function authenticateJWT(req, res, next) {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) {
      return res
        .status(401)
        .json({
          message:
            "Token manquant ou invalide (ou header Authorization absent)",
        });
    }

    // Format attendu: "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      return res
        .status(401)
        .json({ message: "Token manquant ou invalide (format Bearer requis)" });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    // Vérification + décodage
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Ex: { sub, role_id, status_id, iat, exp }
    req.user = payload;

    return next();
  } catch (err) {
    // jwt.verify peut lever: TokenExpiredError, JsonWebTokenError, etc.
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = { authenticateJWT };
