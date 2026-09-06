import { queryOne, queryAll, execute } from '../config/database.js';

export async function generateCodiceCorsista(nome, cognome) {
  try {
    const cognomeBase = cognome.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    const nomeBase = nome.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    const baseCode = cognomeBase + nomeBase;
    const lastRecord = await queryAll(
      `SELECT codice_corsista FROM contatti WHERE attivo = 1 AND codice_corsista LIKE ? ORDER BY codice_corsista DESC LIMIT 1`,
      [`${baseCode}_%`]
    );
    let nextNumber = 1;
    if (lastRecord && lastRecord.length > 0) {
      const lastCode = lastRecord[0].codice_corsista;
      const match = lastCode.match(/_(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const codice = `${baseCode}_${String(nextNumber).padStart(2, '0')}`;
    console.log(`✓ Generato codice corsista: ${codice}`);
    return codice;
  } catch (error) {
    console.error('Errore generazione codice corsista:', error);
    throw error;
  }
}

export async function getNomeAndCognomeFromCorsista(idCorsista) {
  try {
    const corsista = await queryOne(
      `SELECT codice_corsista, nome, cognome FROM contatti WHERE id_corsista = ?`,
      [idCorsista]
    );
    if (!corsista) {
      throw new Error(`Corsista con ID ${idCorsista} non trovato`);
    }
    return {
      codice_corsista: corsista.codice_corsista,
      nome: corsista.nome,
      cognome: corsista.cognome
    };
  } catch (error) {
    console.error('Errore fetch nome/cognome corsista:', error);
    throw error;
  }
}

export async function calculateImportoPagato(idCorsista, nomeCorso, edizioneCorso) {
  try {
    const result = await queryOne(
      `SELECT COALESCE(SUM(importo), 0) as totale FROM pagamenti_ricevuti WHERE id_corsista = ? AND nome_corso = ? AND edizione_corso = ?`,
      [idCorsista, nomeCorso, edizioneCorso]
    );
    return result?.totale || 0;
  } catch (error) {
    console.error('Errore calcolo importo pagato:', error);
    throw error;
  }
}

export function calculatePagamentoStatus(importoDaVersare, importoPagato) {
  try {
    const importoResiduo = Math.max(0, importoDaVersare - importoPagato);
    const percentualePagamento = importoDaVersare > 0 ? (importoPagato / importoDaVersare) * 100 : 0;
    
    let statoPagamento = 'Porta Acconto';
    
    if (percentualePagamento >= 100) {
      statoPagamento = 'Saldato';
    } else if (percentualePagamento > 0 && percentualePagamento < 100) {
      statoPagamento = 'Saldante';
    }
    
    return {
      importoResiduo: Math.round(importoResiduo * 100) / 100,
      statoPagamento,
      percentualePagamento: Math.round(percentualePagamento * 100) / 100
    };
  } catch (error) {
    console.error('Errore calcolo stato pagamento:', error);
    throw error;
  }
}

export async function applyRule1_GenerateCodiceCorsista(contattoData) {
  if (!contattoData.codice_corsista && contattoData.nome && contattoData.cognome) {
    contattoData.codice_corsista = await generateCodiceCorsista(contattoData.nome, contattoData.cognome);
  }
  return contattoData;
}

export async function applyRule2_AutoCompileNomeCognome(iscrizioneData) {
  if (iscrizioneData.id_corsista) {
    const contattoInfo = await getNomeAndCognomeFromCorsista(iscrizioneData.id_corsista);
    iscrizioneData.codice_corsista = contattoInfo.codice_corsista;
    iscrizioneData.nome = contattoInfo.nome;
    iscrizioneData.cognome = contattoInfo.cognome;
  }
  return iscrizioneData;
}

export async function applyRule3_4_CalculatePaymentStatus(iscrizioneData) {
  if (iscrizioneData.id_corsista && iscrizioneData.nome_corso && iscrizioneData.edizione_corso && iscrizioneData.importo_da_versare) {
    const importoPagato = await calculateImportoPagato(iscrizioneData.id_corsista, iscrizioneData.nome_corso, iscrizioneData.edizione_corso);
    const statusData = calculatePagamentoStatus(iscrizioneData.importo_da_versare, importoPagato);
    iscrizioneData.importo_pagato_calcolato = importoPagato;
    iscrizioneData.importo_residuo = statusData.importoResiduo;
    iscrizioneData.stato_pagamento = statusData.statoPagamento;
  }
  return iscrizioneData;
}

export async function applyAllIscrizioneRules(iscrizioneData, isNewCorsista = false) {
  try {
    let data = { ...iscrizioneData };
    if (isNewCorsista) {
      data = await applyRule1_GenerateCodiceCorsista(data);
    }
    data = await applyRule2_AutoCompileNomeCognome(data);
    data = await applyRule3_4_CalculatePaymentStatus(data);
    return data;
  } catch (error) {
    console.error('Errore applicazione regole iscrizione:', error);
    throw error;
  }
}

export async function refreshIscrizionePaymentStatus(idIscrizione) {
  try {
    const iscrizione = await queryOne(
      `SELECT id_iscrizione, id_corsista, nome_corso, edizione_corso, importo_da_versare FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [idIscrizione]
    );
    if (!iscrizione) {
      throw new Error(`Iscrizione ${idIscrizione} non trovata`);
    }
    const importoPagato = await calculateImportoPagato(iscrizione.id_corsista, iscrizione.nome_corso, iscrizione.edizione_corso);
    const statusData = calculatePagamentoStatus(iscrizione.importo_da_versare, importoPagato);
    await execute(
      `UPDATE iscrizioni_attive SET importo_pagato_calcolato = ?, importo_residuo = ?, stato_pagamento = ?, data_modifica = CURRENT_TIMESTAMP WHERE id_iscrizione = ?`,
      [importoPagato, statusData.importoResiduo, statusData.statoPagamento, idIscrizione]
    );
    console.log(`✓ Refreshed payment status per iscrizione ${idIscrizione}`);
  } catch (error) {
    console.error('Errore refresh stato pagamento iscrizione:', error);
    throw error;
  }
}

// ============================================================================
// REGOLA 5-6: SINCRONIZZAZIONE E ARCHIVIAZIONE ISCRIZIONI STORICHE
// ============================================================================

export async function syncToIscrzioniStoriche(iscrizioneData) {
  try {
    const idIscrizioneStorica = generateUUID();
    
    const result = await execute(
      `INSERT INTO iscrizioni_storiche (
        id_iscrizione_storica, id_corsista, codice_corsista, nome, cognome,
        nome_corso, edizione_corso, data_iscrizione, data_frequenza_confermata,
        importo_da_versare, importo_pagato_totale, stato_pagamento_finale, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idIscrizioneStorica,
        iscrizioneData.id_corsista,
        iscrizioneData.codice_corsista,
        iscrizioneData.nome,
        iscrizioneData.cognome,
        iscrizioneData.nome_corso,
        iscrizioneData.edizione_corso,
        iscrizioneData.data_iscrizione,
        new Date().toISOString().split('T')[0],
        iscrizioneData.importo_da_versare,
        iscrizioneData.importo_pagato_calcolato,
        iscrizioneData.stato_pagamento,
        iscrizioneData.note_iscrizione
      ]
    );

    console.log(`✓ Iscrizione archiviata in storico: ${idIscrizioneStorica}`);
    return result;
  } catch (error) {
    console.error('Errore sync iscrizioni storiche:', error);
    throw error;
  }
}

export async function archiveIscrizione(idIscrizione) {
  try {
    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [idIscrizione]
    );

    if (!iscrizione) {
      throw new Error(`Iscrizione ${idIscrizione} non trovata`);
    }

    // Copia l'iscrizione così com'è, mantenendo lo stato_pagamento reale
    const iscrizioneDaArchiviare = {
      ...iscrizione
      // stato_pagamento rimane QUELLO ATTUALE (non ricalcolato)
    };

    await syncToIscrzioniStoriche(iscrizioneDaArchiviare);

    await execute(
      `DELETE FROM iscrizioni_attive WHERE id_iscrizione = ?`,
      [idIscrizione]
    );

    // Calcola automaticamente l'avanzamento percorso
    await calculateAvanzamentoPercorso(iscrizione.id_corsista);

    console.log(`✓ Iscrizione archiviata e rimossa da attive: ${idIscrizione}`);
    console.log(`✓ Stato pagamento mantenuto: ${iscrizioneDaArchiviare.stato_pagamento}`);
    console.log(`✓ Avanzamento percorso calcolato per corsista: ${iscrizione.id_corsista}`);
  } catch (error) {
    console.error('Errore archiviazione iscrizione:', error);
    throw error;
  }
}

// ============================================================================
// REGOLA 7: CALCOLO AVANZAMENTO PERCORSO (11 TAPPE)
// ============================================================================

export async function calculateAvanzamentoPercorso(idCorsista) {
  try {
    const corsista = await queryOne(
      `SELECT * FROM contatti WHERE id_corsista = ?`,
      [idCorsista]
    );

    if (!corsista) {
      throw new Error(`Corsista ${idCorsista} non trovato`);
    }

    const corsiCompletati = await queryAll(
      `SELECT DISTINCT nome_corso FROM iscrizioni_storiche 
       WHERE id_corsista = ? AND data_frequenza_confermata IS NOT NULL`,
      [idCorsista]
    );

    const mappaCorsiTappe = {
      'Presentazione SPEC': 'tappa_1_presentazione_spec',
      'Serate': 'tappa_2_serate',
      'Radici 1': 'tappa_3_radici_1',
      'Radici 2': 'tappa_4_radici_2',
      'Radici 3': 'tappa_5_radici_3',
      'Radici 4': 'tappa_6_radici_4',
      'Rami 1': 'tappa_7_rami_1',
      'Rami 2': 'tappa_8_rami_2',
      'Rami 3': 'tappa_9_rami_3',
      'Rami 4': 'tappa_10_rami_4',
      'Semi 1': 'tappa_11_semi_1',
      'Semi 2': 'tappa_12_semi_2',
      'I Desideri del Cuore': 'tappa_13_i_desideri_del_cuore'
    };

    // Tappe INTRODUTTIVE (non contano nella percentuale)
    const tappeIntroduttive = ['tappa_1_presentazione_spec', 'tappa_2_serate'];
    
    // Tappe CONTEGGIABILI per la percentuale (11 tappe)
    const tappeConteggiabili = [
      'tappa_3_radici_1', 'tappa_4_radici_2', 'tappa_5_radici_3', 'tappa_6_radici_4',
      'tappa_7_rami_1', 'tappa_8_rami_2', 'tappa_9_rami_3', 'tappa_10_rami_4',
      'tappa_11_semi_1', 'tappa_12_semi_2', 'tappa_13_i_desideri_del_cuore'
    ];

    let tappeCompletate = 0;
    const updateData = {};

    for (const corso of corsiCompletati) {
      const nomeCorso = corso.nome_corso;
      const tappa = mappaCorsiTappe[nomeCorso];
      if (tappa) {
        updateData[tappa] = 1;
        // Conta solo se è una tappa conteggiabile (non introduttiva)
        if (tappeConteggiabili.includes(tappa)) {
          tappeCompletate++;
        }
      }
    }

    // Calcolo percentuale su 11 tappe conteggiabili
    const percentuale = (tappeCompletate / 11) * 100;

    const existing = await queryOne(
      `SELECT * FROM avanzamento_percorso WHERE id_corsista = ?`,
      [idCorsista]
    );

    if (existing) {
      // Costruisci il SET clause in modo corretto
      let setClauses = [];
      
      // Aggiungi gli aggiornamenti delle tappe
      if (Object.keys(updateData).length > 0) {
        for (const [tappa, valore] of Object.entries(updateData)) {
          setClauses.push(`${tappa} = 1`);
        }
      }
      
      // Aggiungi sempre il totale e percentuale
      setClauses.push('totale_tappe_completate = ?');
      setClauses.push('percentuale_avanzamento = ?');
      setClauses.push('data_calcolo = CURRENT_TIMESTAMP');
      
      const setClause = setClauses.join(', ');
      
      await execute(
        `UPDATE avanzamento_percorso 
         SET ${setClause}
         WHERE id_corsista = ?`,
        [tappeCompletate, Math.round(percentuale * 100) / 100, idCorsista]
      );
    } else {
      const idAvanzamento = generateUUID();
      const colonne = ['id_avanzamento', 'id_corsista', 'codice_corsista', 'nome', 'cognome', 'totale_tappe_completate', 'percentuale_avanzamento'];
      const valori = [idAvanzamento, idCorsista, corsista.codice_corsista, corsista.nome, corsista.cognome, tappeCompletate, Math.round(percentuale * 100) / 100];

      for (const [tappa, valore] of Object.entries(updateData)) {
        colonne.push(tappa);
        valori.push(valore);
      }

      const placeholder = colonne.map(() => '?').join(', ');
      await execute(
        `INSERT INTO avanzamento_percorso (${colonne.join(', ')}) VALUES (${placeholder})`,
        valori
      );
    }

    console.log(`✓ Calcolato avanzamento per corsista ${idCorsista}: ${tappeCompletate}/11 (${Math.round(percentuale)}%)`);

    return {
      id_corsista: idCorsista,
      tappe_completate: tappeCompletate,
      percentuale_avanzamento: Math.round(percentuale * 100) / 100
    };
  } catch (error) {
    console.error('Errore calcolo avanzamento:', error);
    throw error;
  }
}

// ============================================================================
// REGOLA 8: POOL REFERENTE - COMPENSAZIONE FATTURE
// ============================================================================

export async function poolReferenteCompensazione(referente) {
  try {
    const pagamentiReferente = await queryOne(
      `SELECT COALESCE(SUM(importo), 0) as totale 
       FROM pagamenti_ricevuti 
       WHERE referente = ? AND id_corsista IS NULL`,
      [referente]
    );

    const fattureReferente = await queryOne(
      `SELECT COALESCE(SUM(importo_residuo), 0) as totale 
       FROM fatture_fornitori 
       WHERE referente = ? AND stato_pagamento != 'Saldato'`,
      [referente]
    );

    const differenza = pagamentiReferente.totale - fattureReferente.totale;

    console.log(`Pool Referente ${referente}: Pagamenti=${pagamentiReferente.totale}, Fatture=${fattureReferente.totale}, Differenza=${differenza}`);

    return {
      referente,
      pagamenti_totali: pagamentiReferente.totale,
      fatture_totali: fattureReferente.totale,
      saldo: differenza
    };
  } catch (error) {
    console.error('Errore pool referente:', error);
    throw error;
  }
}

// ============================================================================
// REGOLA 9: AGGIORNAMENTO FATTURE DA PAGAMENTI FORNITORI
// ============================================================================

export async function updateFattureFromPagamenti(numeroFattura) {
  try {
    const pagamenti = await queryOne(
      `SELECT COALESCE(SUM(importo), 0) as totale 
       FROM pagamenti_fornitori 
       WHERE numero_fattura_collegata = ?`,
      [numeroFattura]
    );

    const fattura = await queryOne(
      `SELECT * FROM fatture_fornitori WHERE numero_fattura = ?`,
      [numeroFattura]
    );

    if (!fattura) {
      throw new Error(`Fattura ${numeroFattura} non trovata`);
    }

    const importoPagato = pagamenti.totale;
    const importoResiduo = Math.max(0, fattura.importo_totale - importoPagato);
    
    let statoPagamento = 'Porta Acconto';
    const percentuale = (importoPagato / fattura.importo_totale) * 100;
    
    if (percentuale >= 100) {
      statoPagamento = 'Saldato';
    } else if (percentuale >= 50) {
      statoPagamento = 'Saldante';
    }

    await execute(
      `UPDATE fatture_fornitori 
       SET importo_pagato_calcolato = ?, importo_residuo = ?, stato_pagamento = ?, data_modifica = CURRENT_TIMESTAMP
       WHERE numero_fattura = ?`,
      [importoPagato, importoResiduo, statoPagamento, numeroFattura]
    );

    console.log(`✓ Aggiornata fattura ${numeroFattura}: ${importoPagato}/${fattura.importo_totale} (${Math.round(percentuale)}%)`);

    return {
      numero_fattura: numeroFattura,
      importo_pagato: importoPagato,
      importo_residuo: importoResiduo,
      stato_pagamento: statoPagamento
    };
  } catch (error) {
    console.error('Errore aggiornamento fattura:', error);
    throw error;
  }
}

// ============================================================================
// HELPER: Genera UUID
// ============================================================================

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default {
  generateCodiceCorsista,
  getNomeAndCognomeFromCorsista,
  calculateImportoPagato,
  calculatePagamentoStatus,
  applyRule1_GenerateCodiceCorsista,
  applyRule2_AutoCompileNomeCognome,
  applyRule3_4_CalculatePaymentStatus,
  applyAllIscrizioneRules,
  refreshIscrizionePaymentStatus,
  syncToIscrzioniStoriche,
  archiveIscrizione,
  calculateAvanzamentoPercorso,
  poolReferenteCompensazione,
  updateFattureFromPagamenti
};