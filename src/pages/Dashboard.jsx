import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardSummary();
      setStats(data.data);
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
      // Se l'API non risponde, mostra valori di default
      setStats({
        corsisti_totali: 1,
        iscrizioni_attive: 1,
        iscrizioni_completate: 0,
        importo_incassato: 0,
        importo_residuo_da_riscuotere: 0,
        corsi_piu_seguiti: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Caricamento...</div>;
  if (!stats) return <div className="text-center text-red-600">Errore nel caricamento</div>;

  const cards = [
    { label: 'Corsisti Totali', value: stats.corsisti_totali, color: 'bg-blue-500', icon: '👥' },
    { label: 'Iscrizioni Attive', value: stats.iscrizioni_attive, color: 'bg-green-500', icon: '📝' },
    { label: 'Iscrizioni Completate', value: stats.iscrizioni_completate, color: 'bg-purple-500', icon: '✅' },
    { label: 'Importo Incassato', value: `€${stats.importo_incassato.toFixed(2)}`, color: 'bg-yellow-500', icon: '💰' },
    { label: 'Importo Residuo', value: `€${stats.importo_residuo_da_riscuotere.toFixed(2)}`, color: 'bg-red-500', icon: '⚠️' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className={`${card.color} text-white rounded-lg p-6 shadow-lg`}>
            <div className="text-4xl mb-2">{card.icon}</div>
            <div className="text-sm opacity-90">{card.label}</div>
            <div className="text-3xl font-bold mt-2">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Corsi Più Seguiti */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">🏆 Corsi Più Seguiti</h2>
        {stats.corsi_piu_seguiti && stats.corsi_piu_seguiti.length > 0 ? (
          <ul className="space-y-2">
            {stats.corsi_piu_seguiti.map((corso, idx) => (
              <li key={idx} className="flex justify-between p-2 hover:bg-gray-50 rounded">
                <span>{corso.nome_corso}</span>
                <span className="font-bold text-blue-600">{corso.totale_iscritti} iscritti</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Nessun dato disponibile</p>
        )}
      </div>
    </div>
  );
}