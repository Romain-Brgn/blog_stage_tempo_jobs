const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const UserRepository = require("../Repository/UserRepository");
const jwt = require("jsonwebtoken");

module.exports = {
  register: async (req, res) => {
    try {
      const { email, pseudonyme, password, status } = req.body;

      // unicité mail et pseudo
      const existingEmail = await UserRepository.findByEmail(email);

      if (existingEmail)
        return res.status(409).json({ message: "Email déjà utilisé." });

      const existingPseudonyme = await UserRepository.findByPseudonyme(
        pseudonyme
      );

      if (existingPseudonyme) {
        return res.status(409).json({ message: "Pseudonyme déjà utilisé." });
      }
      // IDs référentiels
      const roleId = await UserRepository.getRoleIdByName("user"); // j'attribue la valeur user par défaut
      const statusId = await UserRepository.getStatusIdByName(status); // par nom (pro, candidat ou curieux), issu du body JSON saisie par le client

      if (!roleId || !statusId) {
        return res
          .status(500)
          .json({ message: "Référentiels (role/status) non initialisés." });
      }

      const hash = await bcrypt.hash(password, 12);
      const confirm_token = crypto.randomBytes(32).toString("hex");

      await UserRepository.insert({
        id: crypto.randomUUID(), // CHAR(50) -> ok
        role_id: roleId,
        status_id: statusId,
        email,
        pseudonyme,
        hash,
        confirm_token,
      });

      return res.status(201).json({
        message: "Compte créé. Vous avez reçu un email de confirmation.",
      });
    } catch (e) {
      console.error("REGISTER_ERROR:", {
        code: e.code,
        errno: e.errno,
        sqlState: e.sqlState,
        sqlMessage: e.sqlMessage,
        message: e.message,
      });
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  confirm: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token manquant" });
      }
      const user = await UserRepository.findByToken(token);
      if (!user) {
        return res.status(400).json({
          message: "Token invalide, aucun utilisateur ne correspond !",
        });
      }
      const expired =
        !user.confirm_token_expires_at ||
        new Date(user.confirm_token_expires_at) < new Date();
      if (expired) {
        return res.status(400).json({
          message: "Token expiré, demander un nouveau mail de confirmation.",
        });
      }

      const accountIsConfirmed = await UserRepository.tokenConfirmation(
        user.id
      );

      if (!accountIsConfirmed) {
        return res.status(500).json({
          message: "Confirmation non appliquée, aucun compte n'a été validé.",
        });
      }

      return res.status(200).json({ message: "Compte validé avec succès!" });
    } catch (e) {
      console.error("CONFIRM_ERROR:", {
        code: e.code,
        errno: e.errno,
        sqlState: e.sqlState,
        sqlMessage: e.sqlMessage,
        message: e.message,
      });
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  resendConfirmation: async (req, res) => {
    try {
      // etape 1 on récupère l'email fourni par le client (le validator as déja vérifier son intégrité)
      const { email } = req.body;

      //etape 2 on va chercher en db l'email et verifier qu'il n'est pas deja confirmé,
      // si c'est le cas on dis quand meme qu'on envoi si l'email existe pour préserver la confidentialité
      const user = await UserRepository.findByEmailDetailed(email);
      if (!user || user.confirmed_at != null) {
        return res.status(200).json({
          message:
            "Si un compte correspond à cet email, un message a été envoyé.",
        });
      }
      //etape 3 on est la si l'email existe, et qu'il n'est pas confirmé 'confirmed_at == null
      // on génère un nouveau token et on update le expire a now+24h
      const newToken = crypto.randomBytes(32).toString("hex");
      await UserRepository.refreshConfirmToken(user.id, newToken);
      //ici on enverra l'email avec le lien .../auth/confirm?token=<newToken>

      return res.status(200).json({
        message:
          "Si un compte correspond à cet email, un message a été envoyé.",
      });
    } catch (e) {
      console.error("CONFIRM_ERROR:", {
        code: e.code,
        errno: e.errno,
        sqlState: e.sqlState,
        sqlMessage: e.sqlMessage,
        message: e.message,
      });
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;

      // 1) Lookup par email ou pseudo
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const user = isEmail
        ? await UserRepository.findForLoginByEmail(identifier)
        : await UserRepository.findForLoginByPseudonyme(identifier);

      // 2) Messages génériques pour éviter l’énumération
      if (!user) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      // 3) Compte confirmé ?
      if (!user.confirmed_at) {
        return res.status(403).json({
          message:
            "Compte non confirmé. Vérifiez vos emails ou demandez une nouvelle confirmation.",
        });
      }

      // 4) Vérif mot de passe
      const isPasswordCorrect = await bcrypt.compare(password, user.hash);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      // 5) Access token (JWT court)
      const payload = {
        sub: user.id,
        role_id: user.role_id,
        status_id: user.status_id,
      };
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // 6) Refresh token (brut + hash) + stockage DB
      const refreshToken = crypto.randomBytes(32).toString("hex"); // BRUT (à renvoyer)
      const refreshHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex"); // HASH (à stocker)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours

      await UserRepository.createRefreshToken({
        user_id: user.id,
        token_hash: refreshHash,
        expires_at: expiresAt,
        user_agent: req.headers["user-agent"] ?? null,
        ip: req.ip ?? null, // si tu es derrière un proxy: app.set("trust proxy", 1)
      });
      // Pose le refresh token BRUT en cookie httpOnly
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true uniquement en HTTPS
        sameSite: "lax", // "strict" si ton UX le permet
        path: "/auth", // le cookie ne part que vers /auth/*
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
      });

      // 7) Best effort: last_login
      try {
        await UserRepository.setLastLogin(user.id);
      } catch (e) {
        console.warn("setLastLogin failed:", e.code || e.message);
      }

      // 8) Réponse
      return res.status(200).json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600, // seconds for access token (1h)
      });
    } catch (e) {
      console.error("LOGIN_ERROR:", {
        code: e.code,
        errno: e.errno,
        sqlState: e.sqlState,
        sqlMessage: e.sqlMessage,
        message: e.message,
      });
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  refresh: async (req, res) => {
    try {
      const { refresh_token } = req.body;
      if (typeof refresh_token !== "string" || refresh_token.trim() === "") {
        return res.status(400).json({ message: "Refresh token manquant." });
      }

      // 1) Vérif de l'ancien RT (hash)
      const oldHash = crypto
        .createHash("sha256")
        .update(refresh_token)
        .digest("hex");
      const rt = await UserRepository.findValidRefreshToken(oldHash);
      if (!rt) {
        return res.status(401).json({ message: "Refresh token invalide" });
      }

      // 2) Révocation de l'ancien RT (rotation)
      await UserRepository.revokeRefreshToken(oldHash);

      // 3) Charger l'utilisateur pour signer les claims
      const user = await UserRepository.findByIdForClaims(rt.user_id);
      if (!user) {
        return res.status(401).json({ message: "Session invalide." });
      }

      // 4) Générer un NOUVEAU refresh token (brut + hash) + expiration
      const newRefreshToken = crypto.randomBytes(32).toString("hex"); // BRUT (à renvoyer au client)
      const newHash = crypto
        .createHash("sha256")
        .update(newRefreshToken)
        .digest("hex"); // HASH (à stocker)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours

      await UserRepository.createRefreshToken({
        user_id: user.id,
        token_hash: newHash,
        expires_at: expiresAt,
        user_agent: req.headers["user-agent"] ?? null,
        ip: req.ip ?? null, // pense à app.set("trust proxy", 1) si tu es derrière un proxy
      });

      // 5) Nouveau access token
      const accessToken = jwt.sign(
        { sub: user.id, role_id: user.role_id, status_id: user.status_id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // 6) Réponse
      return res.status(200).json({
        access_token: accessToken,
        refresh_token: newRefreshToken, // le token BRUT pour le client
        token_type: "Bearer",
        expires_in: 3600,
      });
    } catch (e) {
      console.error("REFRESH_ERROR:", {
        code: e.code,
        errno: e.errno,
        sqlState: e.sqlState,
        sqlMessage: e.sqlMessage,
        message: e.message,
      });
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },
};
