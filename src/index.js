// ============================================================================
// SPEC GESTIONALE - Backend Main Entry Point
// ============================================================================

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Database
import { initializeDatabase, closeDatabase } from './config/database.js';

// Routes
import contattiRoutes from './routes/contatti.js';
import iscrizioniRoutes from './routes/iscrizioni.js';
import iscrizioniStoricheRoutes from './routes/iscrizioni-storiche.js';
import avanzamentoRoutes from './routes/avanzamento.js';
import fattureRoutes from './routes/fatture.js';
import pagamentiRicevutiRoutes from './routes/pagamenti-ricevuti.js';

// Carica variabili di ambiente
dotenv.config();

// Setup directory per ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURAZIONE BASE
// ============================================================================

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE GLOBALI
// ============================================================================

// CORS - permetti richieste dal frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// ============================================================================
// ROOT ENDPOINT
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    name: 'SPEC Gestionale API',
    version: '1.0.0',
    description: 'Backend API per gestione corsi di formazione',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      contatti: '/api/contatti',
      iscrizioni_attive: '/api/iscrizioni-attive',
      iscrizioni_storiche: '/api/iscrizioni-storiche',
      avanzamento: '/api/avanzamento',
      fatture: '/api/fatture',
      pagamenti_ricevuti: '/api/pagamenti-ricevuti',
      pagamenti_fornitori: '/api/pagamenti-fornitori'
    }
  });
});

// ============================================================================
// ROUTES API (IMPLEMENTATE)
// ============================================================================

// Contatti (Corsisti) - REGOLA 1: auto-genera codice corsista
app.use('/api/contatti', contattiRoutes);

// Iscrizioni Attive - REGOLA 2-4: auto-compila dati, calcola pagamenti
app.use('/api/iscrizioni-attive', iscrizioniRoutes);

// Iscrizioni Storiche - REGOLA 5-6: sincronizzazione e archiviazione
app.use('/api/iscrizioni-storiche', iscrizioniStoricheRoutes);

// Avanzamento Percorso - REGOLA 7: calcolo tappe
app.use('/api/avanzamento', avanzamentoRoutes);

// Fatture Fornitori - REGOLA 8-9: pool referente e aggiornamento fatture
app.use('/api/fatture', fattureRoutes);

// Pagamenti Ricevuti - registra incassi corsisti (ricalcola REGOLA 3-4)
app.use('/api/pagamenti-ricevuti', pagamentiRicevutiRoutes);

// ============================================================================
// 404 NOT FOUND
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trovato',
    path: req.path,
    method: req.method
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// SERVER START
// ============================================================================

let server;

async function startServer() {
  try {
    // Inizializza database
    console.log('📡 Inizializzazione database...');
    await initializeDatabase();

    // Avvia server
    server = app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║          SPEC GESTIONALE - Backend Server             ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✓ Server avviato su http://localhost:${PORT}`);
      console.log(`✓ Environment: ${NODE_ENV}`);
      console.log(`✓ Timestamp: ${new Date().toISOString()}`);
      console.log('');
      console.log('📍 API Endpoints Implementati:');
      console.log('');
      console.log('REGOLE 1-4 (Iscrizioni Base):');
      console.log(`   - GET  /api/contatti              (lista corsisti)`);
      console.log(`   - POST /api/contatti              (crea corsista con REGOLA 1)`);
      console.log(`   - GET  /api/iscrizioni-attive     (lista iscrizioni)`);
      console.log(`   - POST /api/iscrizioni-attive     (crea iscrizione con REGOLA 2-4)`);
      console.log('');
      console.log('REGOLE 5-6 (Dashboard Storico):');
      console.log(`   - GET  /api/iscrizioni-storiche   (lista archivio)`);
      console.log(`   - POST /api/iscrizioni-storiche/archive (archivia iscrizione)`);
      console.log(`   - GET  /api/iscrizioni-storiche/dashboard/summary (statistiche)`);
      console.log('');
      console.log('REGOLA 7 (Avanzamento Percorso):');
      console.log(`   - GET  /api/avanzamento           (lista avanzamenti)`);
      console.log(`   - GET  /api/avanzamento/top       (top 10 corsisti)`);
      console.log(`   - POST /api/avanzamento/calculate (calcola avanzamento)`);
      console.log(`   - GET  /api/avanzamento/:id/tappe (dettaglio tappe)`);
      console.log('');
      console.log('REGOLE 8-9 (Fatture Fornitori):');
      console.log(`   - GET  /api/fatture               (lista fatture)`);
      console.log(`   - POST /api/fatture               (crea fattura)`);
      console.log(`   - POST /api/fatture/pagamento/registra (pagamento, aggiorna fattura)`);
      console.log(`   - GET  /api/fatture/pool/:referente (pool referente)`);
      console.log('');
      console.log('Pagamenti Ricevuti (Corsisti):');
      console.log(`   - GET  /api/pagamenti-ricevuti    (lista pagamenti)`);
      console.log(`   - POST /api/pagamenti-ricevuti    (registra pagamento, ricalcola REGOLA 3-4)`);
      console.log('');
    });
  } catch (error) {
    console.error('✗ Errore avvio server:', error);
    process.exit(1);
  }
}

// Avvia server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM ricevuto. Chiusura server...');
  if (server) {
    server.close(async () => {
      await closeDatabase();
      console.log('✓ Server chiuso');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT ricevuto. Chiusura server...');
  if (server) {
    server.close(async () => {
      await closeDatabase();
      console.log('✓ Server chiuso');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;