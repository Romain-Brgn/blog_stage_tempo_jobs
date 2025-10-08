const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const UserRepository = require("../Repository/UserRepository");

module.exports = {
  register: async (req, res) => {
    try {
      const { email, pseudonyme, password, status } = req.body; // status: "professionnel" | "candidat" | "curieux"

      // unicité
      const existing = await UserRepository.findByEmailOrPseudonyme(
        email,
        pseudonyme
      );
      if (existing)
        return res
          .status(409)
          .json({ message: "Email ou pseudonyme déjà utilisé." });

      // IDs référentiels
      const roleId = await UserRepository.getRoleIdByName("user"); // seeds -> id = 2
      const statusId = await UserRepository.getStatusIdByName(status); // par nom, issu du body JSON saisie par le client

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

      return res
        .status(201)
        .json({ message: "Compte créé. Vérifie tes emails pour confirmer." });
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
};
