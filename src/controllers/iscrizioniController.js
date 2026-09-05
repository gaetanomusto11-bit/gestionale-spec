import { queryOne, queryAll, execute } from '../config/database.js';
import {
  applyRule2_AutoCompileNomeCognome,
  applyRule3_4_CalculatePaymentStatus,
  refreshIscrizionePaymentStatus,
  calculateImportoPagato,
  calculatePagamentoStatus
} from '../services/rulesEngine.js';
import {
  validateIscrizione,
  isValidUUID
} from '../utils/validators.js';

export async function getIscrizioniAttive(req, res) {
  try {
    const { corsista, corso, stato } = req.query;

    let sql = `SELECT * FROM iscrizioni_attive WHERE 1=1`;
    const params = [];

    if (corsista) {
      sql += ` AND id_corsista = ?`;
      params.push(corsista);
    }

    if (corso) {
      sql += ` AND nome_corso LIKE ?`;
      params.push(`%${corso}%`);
    }

    if (stato) {
      sql += ` AND stato_pagamento = ?`;
      params.push(stato);
    }

    sql += ` ORDER BY data_iscrizione DESC`;

    const iscrizioni = await queryAll(sql, params);

    res.json({
      success: true,
      data: iscrizioni,
      count: iscrizioni.length,
      filters: { corsista, corso, stato }
    });
  } catch (error) {
    console.error('Errore getIscrizioniAttive:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero iscrizioni',
      message: error.message
    });
  }
}

export async function getIscrizione(req, res) {
  try {
    const { id } = req.params;

    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [id]
    );

    if (!iscrizione) {
      return res.status(404).json({
        success: false,
        error: 'Iscrizione non trovata'
      });
    }

    res.json({
      success: true,
      data: iscrizione
    });
  } catch (error) {
    console.error('Errore getIscrizione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero iscrizione',
      message: error.message
    });
  }
}

export async function createIscrizione(req, res) {
  try {
    const {
      id_corsista,
      nome_corso,
      edizione_corso,
      importo_da_versare,
      data_iscrizione,
      frequenza,
      note_iscrizione
    } = req.body;

    const validation = validateIscrizione({
      id_corsista,
      nome_corso,
      edizione_corso,
      importo_da_versare,
      data_iscrizione,
      frequenza,
      note_iscrizione
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validazione fallita',
        errors: validation.errors
      });
    }

    let data = validation.data;

    try {
      data = await applyRule2_AutoCompileNomeCognome(data);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'ID corsista non trovato',
        message: error.message
      });
    }

    try {
      data = await applyRule3_4_CalculatePaymentStatus(data);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Errore calcolo pagamenti',
        message: error.message
      });
    }

    const idIscrizione = generateUUID();

    const result = await execute(
      `INSERT INTO iscrizioni_attive (
        id_iscrizione, id_corsista, codice_corsista, nome, cognome,
        nome_corso, edizione_corso, importo_da_versare,
        importo_pagato_calcolato, importo_residuo,
        stato_pagamento, data_iscrizione, frequenza, note_iscrizione
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idIscrizione,
        data.id_corsista,
        data.codice_corsista,
        data.nome,
        data.cognome,
        data.nome_corso,
        data.edizione_corso,
        data.importo_da_versare,
        data.importo_pagato_calcolato || 0,
        data.importo_residuo || data.importo_da_versare,
        data.stato_pagamento || 'Porta Acconto',
        data.data_iscrizione,
        data.frequenza || '',
        data.note_iscrizione
      ]
    );

    if (!result.success) {
      throw new Error('Inserimento nel database fallito');
    }

    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [idIscrizione]
    );

    res.status(201).json({
      success: true,
      message: `✓ Iscrizione creata per ${data.nome} ${data.cognome} a "${data.nome_corso}"`,
      data: iscrizione
    });
  } catch (error) {
    console.error('Errore createIscrizione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione iscrizione',
      message: error.message
    });
  }
}

export async function updateIscrizione(req, res) {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const existing = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Iscrizione non trovata'
      });
    }

    let data = {
      ...existing,
      ...updateFields
    };

    const validation = validateIscrizione({
      id_corsista: data.id_corsista,
      nome_corso: data.nome_corso,
      edizione_corso: data.edizione_corso,
      importo_da_versare: data.importo_da_versare,
      data_iscrizione: data.data_iscrizione,
      frequenza: data.frequenza,
      note_iscrizione: data.note_iscrizione
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validazione fallita',
        errors: validation.errors
      });
    }

    data = validation.data;

    if (updateFields.id_corsista && updateFields.id_corsista !== existing.id_corsista) {
      try {
        data = await applyRule2_AutoCompileNomeCognome(data);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'ID corsista non trovato',
          message: error.message
        });
      }
    }

    try {
      data = await applyRule3_4_CalculatePaymentStatus(data);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Errore calcolo pagamenti',
        message: error.message
      });
    }

    await execute(
      `UPDATE iscrizioni_attive SET
        id_corsista = ?, codice_corsista = ?, nome = ?, cognome = ?,
        nome_corso = ?, edizione_corso = ?, importo_da_versare = ?,
        importo_pagato_calcolato = ?, importo_residuo = ?,
        stato_pagamento = ?, data_iscrizione = ?, frequenza = ?,
        note_iscrizione = ?, data_modifica = CURRENT_TIMESTAMP
       WHERE id_iscrizione = ?`,
      [
        data.id_corsista,
        data.codice_corsista,
        data.nome,
        data.cognome,
        data.nome_corso,
        data.edizione_corso,
        data.importo_da_versare,
        data.importo_pagato_calcolato || 0,
        data.importo_residuo || data.importo_da_versare,
        data.stato_pagamento || 'Porta Acconto',
        data.data_iscrizione,
        data.frequenza || '',
        data.note_iscrizione,
        id
      ]
    );

    const updated = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '✓ Iscrizione aggiornata',
      data: updated
    });
  } catch (error) {
    console.error('Errore updateIscrizione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento iscrizione',
      message: error.message
    });
  }
}

export async function deleteIscrizione(req, res) {
  try {
    const { id } = req.params;

    const existing = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Iscrizione non trovata'
      });
    }

    await execute(
      `DELETE FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '✓ Iscrizione eliminata'
    });
  } catch (error) {
    console.error('Errore deleteIscrizione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione iscrizione',
      message: error.message
    });
  }
}

export async function refreshPagamenti(req, res) {
  try {
    const { id } = req.params;

    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [id]
    );

    if (!iscrizione) {
      return res.status(404).json({
        success: false,
        error: 'Iscrizione non trovata'
      });
    }

    const importoPagato = await calculateImportoPagato(
      iscrizione.id_corsista,
      iscrizione.nome_corso,
      iscrizione.edizione_corso
    );

    const statusData = calculatePagamentoStatus(
      iscrizione.importo_da_versare,
      importoPagato
    );

    await execute(
      `UPDATE iscrizioni_attive SET
        importo_pagato_calcolato = ?, importo_residuo = ?,
        stato_pagamento = ?, data_modifica = CURRENT_TIMESTAMP
       WHERE id_iscrizione = ?`,
      [
        importoPagato,
        statusData.importoResiduo,
        statusData.statoPagamento,
        id
      ]
    );

    const updated = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '✓ Stato pagamenti ricalcolato',
      data: updated,
      calculation: {
        importoPagato,
        ...statusData
      }
    });
  } catch (error) {
    console.error('Errore refreshPagamenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel ricalcolo pagamenti',
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
  getIscrizioniAttive,
  getIscrizione,
  createIscrizione,
  updateIscrizione,
  deleteIscrizione,
  refreshPagamenti
};