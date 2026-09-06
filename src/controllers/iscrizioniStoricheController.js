import { queryOne, queryAll, execute } from '../config/database.js';
import { archiveIscrizione } from '../services/rulesEngine.js';

export async function getIscrizioniStoriche(req, res) {
  try {
    const { corsista, corso, stato } = req.query;

    let sql = `SELECT * FROM iscrizioni_storiche WHERE 1=1`;
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
      sql += ` AND stato_pagamento_finale = ?`;
      params.push(stato);
    }

    sql += ` ORDER BY data_frequenza_confermata DESC`;

    const iscrizioni = await queryAll(sql, params);

    // NON ricalcolare lo stato! Mantieni ESATTAMENTE quello nel database
    // Lo stato_pagamento_finale è già salvato correttamente quando l'iscrizione è stata archiviata

    res.json({
      success: true,
      data: iscrizioni,
      count: iscrizioni.length,
      filters: { corsista, corso, stato }
    });
  } catch (error) {
    console.error('Errore getIscrizioniStoriche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero iscrizioni storiche',
      message: error.message
    });
  }
}

export async function getIscrizioneStorica(req, res) {
  try {
    const { id } = req.params;

    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_storiche WHERE id_iscrizione_storica = ?`,
      [id]
    );

    if (!iscrizione) {
      return res.status(404).json({
        success: false,
        error: 'Iscrizione storica non trovata'
      });
    }

    res.json({
      success: true,
      data: iscrizione
    });
  } catch (error) {
    console.error('Errore getIscrizioneStorica:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero iscrizione storica',
      message: error.message
    });
  }
}

export async function archiveIscrizioneFromActive(req, res) {
  try {
    const { idIscrizione } = req.body;

    if (!idIscrizione) {
      return res.status(400).json({
        success: false,
        error: 'ID iscrizione è obbligatorio'
      });
    }

    // Verifica che iscrizione esista
    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [idIscrizione]
    );

    if (!iscrizione) {
      return res.status(404).json({
        success: false,
        error: 'Iscrizione attiva non trovata'
      });
    }

    // Applica archiviazione (Regola 6)
    await archiveIscrizione(idIscrizione);

    res.json({
      success: true,
      message: `✓ Iscrizione archiviata: ${iscrizione.nome} ${iscrizione.cognome} - ${iscrizione.nome_corso}`,
      data: {
        id_iscrizione_archiviata: idIscrizione,
        corsista: `${iscrizione.nome} ${iscrizione.cognome}`,
        corso: iscrizione.nome_corso
      }
    });
  } catch (error) {
    console.error('Errore archiveIscrizioneFromActive:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'archiviazione iscrizione',
      message: error.message
    });
  }
}

export async function getDashboardSummary(req, res) {
  try {
    // Corsisti totali
    const totaleCorsisti = await queryOne(
      `SELECT COUNT(*) as totale FROM contatti WHERE attivo = 1`
    );

    // Iscrizioni attive
    const totaleIscrizioni = await queryOne(
      `SELECT COUNT(*) as totale FROM iscrizioni_attive`
    );

    // Iscrizioni completate
    const iscrzioniCompletate = await queryOne(
      `SELECT COUNT(*) as totale FROM iscrizioni_storiche`
    );

    // Importo totale incassato
    const importoTotale = await queryOne(
      `SELECT COALESCE(SUM(importo), 0) as totale FROM pagamenti_ricevuti`
    );

    // Importo residuo da riscuotere
    const importoResiduo = await queryOne(
      `SELECT COALESCE(SUM(importo_residuo), 0) as totale FROM iscrizioni_attive`
    );

    // Corsi con più iscritti
    const corsiPopulari = await queryAll(
      `SELECT nome_corso, COUNT(*) as totale_iscritti 
       FROM iscrizioni_storiche 
       GROUP BY nome_corso 
       ORDER BY totale_iscritti DESC 
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        corsisti_totali: totaleCorsisti.totale,
        iscrizioni_attive: totaleIscrizioni.totale,
        iscrizioni_completate: iscrzioniCompletate.totale,
        importo_incassato: importoTotale.totale,
        importo_residuo_da_riscuotere: importoResiduo.totale,
        corsi_piu_seguiti: corsiPopulari
      }
    });
  } catch (error) {
    console.error('Errore getDashboardSummary:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo dashboard',
      message: error.message
    });
  }
}

export default {
  getIscrizioniStoriche,
  getIscrizioneStorica,
  archiveIscrizioneFromActive,
  getDashboardSummary
};
