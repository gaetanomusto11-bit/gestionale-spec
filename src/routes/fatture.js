import express from 'express';
import {
  getFatture,
  getFattura,
  createFattura,
  registraPagamentoFornitore,
  getPoolReferente
} from '../controllers/fattureController.js';

const router = express.Router();

// GET lista fatture
router.get('/', getFatture);

// GET dettagli singola fattura + pagamenti collegati
router.get('/:numeroFattura', getFattura);

// POST crea nuova fattura
router.post('/', createFattura);

// POST registra pagamento fornitore (REGOLA 9: aggiorna fattura)
router.post('/pagamento/registra', registraPagamentoFornitore);

// GET pool referente (REGOLA 8: compensazione)
router.get('/pool/:referente', getPoolReferente);

export default router;