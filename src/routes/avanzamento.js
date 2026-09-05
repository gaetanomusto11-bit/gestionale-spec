import express from 'express';
import {
  getAvanzamentiPercorso,
  getAvanzamentoCorsista,
  calculateAvanzamento,
  getTopCorsisti,
  getTappeDettaglio
} from '../controllers/avanzamentoController.js';

const router = express.Router();

// GET lista avanzamenti tutti corsisti
router.get('/', getAvanzamentiPercorso);

// GET top 10 corsisti per avanzamento
router.get('/top', getTopCorsisti);

// GET avanzamento singolo corsista
router.get('/:idCorsista', getAvanzamentoCorsista);

// GET dettaglio tappe per corsista
router.get('/:idCorsista/tappe', getTappeDettaglio);

// POST calcola/aggiorna avanzamento corsista (REGOLA 7)
router.post('/calculate', calculateAvanzamento);

export default router;