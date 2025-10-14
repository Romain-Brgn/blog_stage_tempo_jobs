const rateLimit = require("express-rate-limit");

// 10 tentatives max par IP sur 10 minutes
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10, // 10 req / fenêtre / IP
  standardHeaders: true, // renvoie les headers RateLimit-*
  legacyHeaders: false, // désactive X-RateLimit-*
  message: { message: "Trop de tentatives, réessayez plus tard." },
});

module.exports = { loginLimiter };
