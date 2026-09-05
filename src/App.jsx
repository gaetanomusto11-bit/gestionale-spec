import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import GestioneCorsisti from './pages/GestioneCorsisti';
import GestioneIscrizioni from './pages/GestioneIscrizioni';
import RegistraPagamenti from './pages/RegistraPagamenti';
import DashboardStorico from './pages/DashboardStorico';
import AvanzamentoPercorso from './pages/AvanzamentoPercorso';
import GestioneFatture from './pages/GestioneFatture';
import PoolReferente from './pages/PoolReferente';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="corsisti" element={<GestioneCorsisti />} />
          <Route path="iscrizioni" element={<GestioneIscrizioni />} />
          <Route path="pagamenti" element={<RegistraPagamenti />} />
          <Route path="storico" element={<DashboardStorico />} />
          <Route path="avanzamento" element={<AvanzamentoPercorso />} />
          <Route path="fatture" element={<GestioneFatture />} />
          <Route path="pool-referente" element={<PoolReferente />} />
        </Route>
      </Routes>
    </Router>
  );
}