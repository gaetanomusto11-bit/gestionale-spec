import express from 'express';
import {
  getIscrizioniStoriche,
  getIscrizioneStorica,
  archiveIscrizioneFromActive,
  getDashboardSummary
} from '../controllers/iscrizioniStoricheController.js';

const router = express.Router();

// GET lista iscrizioni storiche
router.get('/', getIscrizioniStoriche);

// GET dettagli singola iscrizione storica
router.get('/:id', getIscrizioneStorica);

// POST archivia iscrizione da attive a storiche (REGOLA 6)
router.post('/archive', archiveIscrizioneFromActive);

// GET dashboard summary (statistiche)
router.get('/dashboard/summary', getDashboardSummary);

export default router;