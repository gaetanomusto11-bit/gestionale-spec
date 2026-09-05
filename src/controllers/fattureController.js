import { queryOne, queryAll, execute } from '../config/database.js';
import { updateFattureFromPagamenti, poolReferenteCompensazione } from '../services/rulesEngine.js';

export async function getFatture(req, res) {
  try {
    const { stato, referente } = req.query;

    let sql = `SELECT * FROM fatture_fornitori WHERE 1=1`;
    const params = [];

    if (stato) {
      sql += ` AND stato_pagamento = ?`;
      params.push(stato);
    }

    if (referente) {
      sql += ` AND referente = ?`;
      params.push(referente);
    }

    sql += ` ORDER BY data_fattura DESC`;

    const fatture = await queryAll(sql, params);

    res.json({
      success: true,
      data: fatture,
      count: fatture.length,
      filters: { stato, referente }
    });
  } catch (error) {
    console.error('Errore getFatture:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero fatture',
      message: error.message
    });
  }
}

export async function getFattura(req, res) {
  try {
    const { numeroFattura } = req.params;

    const fattura = await queryOne(
      `SELECT * FROM fatture_fornitori WHERE numero_fattura = ?`,
      [numeroFattura]
    );

    if (!fattura) {
      return res.status(404).json({
        success: false,
        error: 'Fattura non trovata'
      });
    }

    // Recupera pagamenti collegati
    const pagamenti = await queryAll(
      `SELECT * FROM pagamenti_fornitori WHERE numero_fattura_collegata = ? ORDER BY data_pagamento DESC`,
      [numeroFattura]
    );

    res.json({
      success: true,
      data: {
        fattura,
        pagamenti,
        totale_pagamenti: pagamenti.length
      }
    });
  } catch (error) {
    console.error('Errore getFattura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero fattura',
      message: error.message
    });
  }
}

export async function createFattura(req, res) {
  try {
    const { numero_fattura, data_fattura, fornitore, importo_lordo, iva, referente, note } = req.body;

    if (!numero_fattura || !data_fattura || !fornitore || !importo_lordo) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: numero_fattura, data_fattura, fornitore, importo_lordo'
      });
    }

    const idFattura = generateUUID();
    const ivaCalcolata = iva || (importo_lordo * 0.22);
    const importoTotale = importo_lordo + ivaCalcolata;

    const result = await execute(
      `INSERT INTO fatture_fornitori (
        id_fattura, numero_fattura, data_fattura, fornitore, importo_lordo, iva, importo_totale, referente, note, stato_pagamento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFattura,
        numero_fattura,
        data_fattura,
        fornitore,
        importo_lordo,
        ivaCalcolata,
        importoTotale,
        referente || null,
        note || null,
        'Porta Acconto'
      ]
    );

    if (!result.success) {
      throw new Error('Inserimento fattura fallito');
    }

    const fattura = await queryOne(
      `SELECT * FROM fatture_fornitori WHERE id_fattura = ?`,
      [idFattura]
    );

    res.status(201).json({
      success: true,
      message: `✓ Fattura creata: ${numero_fattura}`,
      data: fattura
    });
  } catch (error) {
    console.error('Errore createFattura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione fattura',
      message: error.message
    });
  }
}

export async function registraPagamentoFornitore(req, res) {
  try {
    const { numero_fattura, data_pagamento, importo, metodo_pagamento, note } = req.body;

    if (!numero_fattura || !data_pagamento || !importo) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: numero_fattura, data_pagamento, importo'
      });
    }

    // Verifica fattura esista
    const fattura = await queryOne(
      `SELECT * FROM fatture_fornitori WHERE numero_fattura = ?`,
      [numero_fattura]
    );

    if (!fattura) {
      return res.status(404).json({
        success: false,
        error: 'Fattura non trovata'
      });
    }

    const idPagamento = generateUUID();

    const result = await execute(
      `INSERT INTO pagamenti_fornitori (
        id_pagamento_fornitore, numero_fattura_collegata, data_fattura_collegata, data_pagamento, importo, metodo_pagamento, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idPagamento,
        numero_fattura,
        fattura.data_fattura,
        data_pagamento,
        importo,
        metodo_pagamento || 'Bonifico',
        note || null
      ]
    );

    if (!result.success) {
      throw new Error('Registrazione pagamento fallita');
    }

    // Aggiorna stato fattura (Regola 9)
    await updateFattureFromPagamenti(numero_fattura);

    // Recupera fattura aggiornata
    const fatturaAggiornata = await queryOne(
      `SELECT * FROM fatture_fornitori WHERE numero_fattura = ?`,
      [numero_fattura]
    );

    res.status(201).json({
      success: true,
      message: `✓ Pagamento registrato per fattura ${numero_fattura}`,
      data: {
        pagamento_id: idPagamento,
        fattura_aggiornata: fatturaAggiornata
      }
    });
  } catch (error) {
    console.error('Errore registraPagamentoFornitore:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella registrazione pagamento',
      message: error.message
    });
  }
}

export async function getPoolReferente(req, res) {
  try {
    const { referente } = req.params;

    if (!referente) {
      return res.status(400).json({
        success: false,
        error: 'Referente è obbligatorio'
      });
    }

    // Calcola pool (Regola 8)
    const pool = await poolReferenteCompensazione(referente);

    res.json({
      success: true,
      message: `Pool Referente ${referente} calcolato`,
      data: pool
    });
  } catch (error) {
    console.error('Errore getPoolReferente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo pool referente',
      message: error.message
    });
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default {
  getFatture,
  getFattura,
  createFattura,
  registraPagamentoFornitore,
  getPoolReferente
};