import { NewsletterModel } from '../models/newsletterModel.js';

export const NewsletterController = {
  // GET /api/newsletters
  async getAll(req, res) {
    try {
      const campaigns = await NewsletterModel.getAll();
      res.json(campaigns);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // GET /api/newsletters/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const campaign = await NewsletterModel.getById(id);
      if (!campaign) return res.status(404).json({ message: 'Campagne non trouvée' });
      res.json(campaign);
    } catch (err) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // POST /api/newsletters
  async create(req, res) {
    try {
      const data = req.body;
      const newCampaign = await NewsletterModel.create(data);
      res.status(201).json(newCampaign);
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de la création' });
    }
  },

  // PUT /api/newsletters/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await NewsletterModel.update(id, req.body);
      if (!updated) return res.status(404).json({ message: 'Campagne non trouvée' });
      res.json({ message: 'Mise à jour réussie' });
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  },

  // DELETE /api/newsletters/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await NewsletterModel.delete(id);
      if (!deleted) return res.status(404).json({ message: 'Campagne non trouvée' });
      res.json({ message: 'Campagne supprimée' });
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
  },
};
