import express from 'express';
import { getPagamenti, createPagamento, updatePagamento, deletePagamento } from '../controllers/pagamentiRicevutiController.js';

const router = express.Router();

// GET lista pagamenti ricevuti (filtri opzionali: corsista, corso, edizione)
router.get('/', getPagamenti);

// POST registra nuovo pagamento (ricalcola REGOLA 3-4 sull'iscrizione collegata)
router.post('/', createPagamento);

// PUT aggiorna pagamento esistente (ricalcola REGOLA 3-4)
router.put('/:id', updatePagamento);

// DELETE elimina pagamento (ricalcola REGOLA 3-4)
router.delete('/:id', deletePagamento);

export default router;