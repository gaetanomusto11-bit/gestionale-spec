-- ============================================================================
-- YES! GESTIONALE - Schema Database Completo (SQLite)
-- ============================================================================

-- ============================================================================
-- 1. TABELLA: CONTATTI
-- Anagrafica corsisti
-- ============================================================================
CREATE TABLE IF NOT EXISTS contatti (
    id_corsista TEXT PRIMARY KEY,
    codice_corsista TEXT UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    note TEXT,
    data_iscrizione DATE DEFAULT CURRENT_DATE,
    attivo INTEGER DEFAULT 1,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contatti_codice ON contatti(codice_corsista);
CREATE INDEX IF NOT EXISTS idx_contatti_cognome ON contatti(cognome);
CREATE INDEX IF NOT EXISTS idx_contatti_attivo ON contatti(attivo);

-- ============================================================================
-- 2. TABELLA: ISCRIZIONI_ATTIVE
-- Prenotazioni/iscrizioni "in corso" (non ancora archiviate)
-- ============================================================================
CREATE TABLE IF NOT EXISTS iscrizioni_attive (
    id_iscrizione TEXT PRIMARY KEY,
    id_corsista TEXT NOT NULL,
    codice_corsista TEXT,
    nome VARCHAR(100),
    cognome VARCHAR(100),
    nome_corso VARCHAR(150) NOT NULL,
    edizione_corso VARCHAR(50) NOT NULL,
    importo_da_versare DECIMAL(10,2) NOT NULL,
    importo_pagato_calcolato DECIMAL(10,2) DEFAULT 0,
    importo_residuo DECIMAL(10,2),
    stato_pagamento VARCHAR(50),
    data_iscrizione DATE DEFAULT CURRENT_DATE,
    frequenza VARCHAR(2) DEFAULT '',
    note_iscrizione TEXT,
    data_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_corsista) REFERENCES contatti(id_corsista) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_iscrizioni_active_corsista ON iscrizioni_attive(id_corsista);
CREATE INDEX IF NOT EXISTS idx_iscrizioni_active_corso ON iscrizioni_attive(nome_corso);
CREATE INDEX IF NOT EXISTS idx_iscrizioni_active_stato ON iscrizioni_attive(stato_pagamento);

-- ============================================================================
-- 3. TABELLA: PAGAMENTI_RICEVUTI
-- Cronologia di tutti i pagamenti incassati dai corsisti
-- ============================================================================
CREATE TABLE IF NOT EXISTS pagamenti_ricevuti (
    id_pagamento TEXT PRIMARY KEY,
    id_corsista TEXT,
    codice_corsista VARCHAR(20),
    nome_corso VARCHAR(150),
    edizione_corso VARCHAR(50),
    data_pagamento DATE NOT NULL,
    importo DECIMAL(10,2) NOT NULL,
    metodo_pagamento VARCHAR(50),
    referente VARCHAR(100),
    note TEXT,
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_corsista) REFERENCES contatti(id_corsista) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pagamenti_ricevuti_corsista ON pagamenti_ricevuti(id_corsista);
CREATE INDEX IF NOT EXISTS idx_pagamenti_ricevuti_data ON pagamenti_ricevuti(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamenti_ricevuti_referente ON pagamenti_ricevuti(referente);

-- ============================================================================
-- 4. TABELLA: ISCRIZIONI_STORICHE (DASHBOARD_CORSI)
-- Archivio storico delle iscrizioni completate
-- ============================================================================
CREATE TABLE IF NOT EXISTS iscrizioni_storiche (
    id_iscrizione_storica TEXT PRIMARY KEY,
    id_corsista TEXT NOT NULL,
    codice_corsista VARCHAR(20),
    nome VARCHAR(100),
    cognome VARCHAR(100),
    nome_corso VARCHAR(150),
    edizione_corso VARCHAR(50),
    data_iscrizione DATE,
    data_frequenza_confermata DATE,
    importo_da_versare DECIMAL(10,2),
    importo_pagato_totale DECIMAL(10,2),
    stato_pagamento_finale VARCHAR(50),
    note TEXT,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_corsista) REFERENCES contatti(id_corsista) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_iscrizioni_storiche_corsista ON iscrizioni_storiche(id_corsista);
CREATE INDEX IF NOT EXISTS idx_iscrizioni_storiche_corso ON iscrizioni_storiche(nome_corso);
CREATE INDEX IF NOT EXISTS idx_iscrizioni_storiche_data ON iscrizioni_storiche(data_frequenza_confermata);

-- ============================================================================
-- 5. TABELLA: AVANZAMENTO_PERCORSO
-- Tracciamento del percorso formativo per corsista (13 tappe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS avanzamento_percorso (
    id_avanzamento TEXT PRIMARY KEY,
    id_corsista TEXT UNIQUE NOT NULL,
    codice_corsista VARCHAR(20),
    nome VARCHAR(100),
    cognome VARCHAR(100),
    tappa_1_presentazione_spec INTEGER DEFAULT 0,
    tappa_2_serate INTEGER DEFAULT 0,
    tappa_3_radici_1 INTEGER DEFAULT 0,
    tappa_4_radici_2 INTEGER DEFAULT 0,
    tappa_5_radici_3 INTEGER DEFAULT 0,
    tappa_6_radici_4 INTEGER DEFAULT 0,
    tappa_7_rami_1 INTEGER DEFAULT 0,
    tappa_8_rami_2 INTEGER DEFAULT 0,
    tappa_9_rami_3 INTEGER DEFAULT 0,
    tappa_10_rami_4 INTEGER DEFAULT 0,
    tappa_11_semi_1 INTEGER DEFAULT 0,
    tappa_12_semi_2 INTEGER DEFAULT 0,
    tappa_13_i_desideri_del_cuore INTEGER DEFAULT 0,
    totale_tappe_completate INTEGER DEFAULT 0,
    percentuale_avanzamento DECIMAL(5,2) DEFAULT 0,
    data_calcolo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_corsista) REFERENCES contatti(id_corsista) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_avanzamento_corsista ON avanzamento_percorso(id_corsista);

-- ============================================================================
-- 6. TABELLA: FATTURE_FORNITORI
-- Fatture ricevute dai fornitori
-- ============================================================================
CREATE TABLE IF NOT EXISTS fatture_fornitori (
    id_fattura TEXT PRIMARY KEY,
    numero_fattura VARCHAR(50) NOT NULL UNIQUE,
    data_fattura DATE NOT NULL,
    fornitore VARCHAR(150) NOT NULL,
    importo_lordo DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) DEFAULT 0,
    importo_totale DECIMAL(10,2),
    importo_pagato_calcolato DECIMAL(10,2) DEFAULT 0,
    importo_residuo DECIMAL(10,2),
    referente VARCHAR(100),
    stato_pagamento VARCHAR(50),
    note TEXT,
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fatture_fornitori_numero ON fatture_fornitori(numero_fattura);
CREATE INDEX IF NOT EXISTS idx_fatture_fornitori_fornitore ON fatture_fornitori(fornitore);
CREATE INDEX IF NOT EXISTS idx_fatture_fornitori_referente ON fatture_fornitori(referente);
CREATE INDEX IF NOT EXISTS idx_fatture_fornitori_stato ON fatture_fornitori(stato_pagamento);

-- ============================================================================
-- 7. TABELLA: PAGAMENTI_FORNITORI
-- Cronologia pagamenti ai fornitori
-- ============================================================================
CREATE TABLE IF NOT EXISTS pagamenti_fornitori (
    id_pagamento_fornitore TEXT PRIMARY KEY,
    numero_fattura_collegata VARCHAR(50) NOT NULL,
    data_fattura_collegata DATE NOT NULL,
    data_pagamento DATE NOT NULL,
    importo DECIMAL(10,2) NOT NULL,
    metodo_pagamento VARCHAR(50),
    note TEXT,
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (numero_fattura_collegata) REFERENCES fatture_fornitori(numero_fattura) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pagamenti_fornitori_fattura ON pagamenti_fornitori(numero_fattura_collegata);
CREATE INDEX IF NOT EXISTS idx_pagamenti_fornitori_data ON pagamenti_fornitori(data_pagamento);

-- ============================================================================
-- 8. TABELLA: UTENTI (per autenticazione)
-- Gestione account admin/operatore/ospite
-- ============================================================================
CREATE TABLE IF NOT EXISTS utenti (
    id_utente TEXT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    ruolo VARCHAR(50) DEFAULT 'operatore',
    attivo INTEGER DEFAULT 1,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultimo_login TIMESTAMP,
    data_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_utenti_email ON utenti(email);
CREATE INDEX IF NOT EXISTS idx_utenti_ruolo ON utenti(ruolo);

-- ============================================================================
-- 9. TABELLA: AUDIT_LOG (per tracciamento azioni)
-- Registro di tutte le azioni critiche
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id_log TEXT PRIMARY KEY,
    id_utente TEXT,
    azione VARCHAR(100) NOT NULL,
    tabella VARCHAR(50),
    id_record TEXT,
    dettagli TEXT,
    indirizzo_ip VARCHAR(45),
    data_azione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utente) REFERENCES utenti(id_utente) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_utente ON audit_log(id_utente);
CREATE INDEX IF NOT EXISTS idx_audit_log_data ON audit_log(data_azione);
