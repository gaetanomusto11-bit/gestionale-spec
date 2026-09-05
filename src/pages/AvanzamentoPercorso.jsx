import { useEffect, useState } from 'react';
import { getAvanzamenti, getTappeDettaglio } from '../services/api';

export default function AvanzamentoPercorso() {
  const [avanzamenti, setAvanzamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorsista, setSelectedCorsista] = useState(null);
  const [tappeDettaglio, setTappeDettaglio] = useState(null);

  useEffect(() => {
    fetchAvanzamenti();
  }, []);

  const fetchAvanzamenti = async () => {
    try {
      const data = await getAvanzamenti();
      setAvanzamenti(data.data);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCorsista = async (corsista) => {
    setSelectedCorsista(corsista);
    try {
      const data = await getTappeDettaglio(corsista.id_corsista);
      setTappeDettaglio(data.data);
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  if (loading) return <div className="text-center">Caricamento...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📈 Avanzamento Percorso</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Lista Corsisti */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Corsisti</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {avanzamenti.map((av) => (
                <button
                  key={av.id_corsista}
                  onClick={() => handleSelectCorsista(av)}
                  className={`w-full p-3 rounded text-left transition ${
                    selectedCorsista?.id_corsista === av.id_corsista
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold">{av.nome} {av.cognome}</div>
                  <div className="text-xs opacity-75">{av.percentuale_avanzamento}%</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dettaglio Tappe */}
        <div className="col-span-2">
          {selectedCorsista && tappeDettaglio ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-2">{tappeDettaglio.corsista}</h2>
              <p className="text-gray-600 mb-4">Codice: {tappeDettaglio.codice}</p>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Avanzamento</span>
                  <span className="font-bold text-lg text-blue-600">{tappeDettaglio.percentuale_avanzamento}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${tappeDettaglio.percentuale_avanzamento}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-4 text-gray-800">11 Tappe del Percorso</h3>
              <div className="grid grid-cols-1 gap-3">
                {tappeDettaglio.tappe.map((tappa) => (
                  <div
                    key={tappa.numero}
                    className={`p-4 rounded border-l-4 transition ${
                      tappa.completata
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {tappa.completata ? '✅' : '⏳'}
                        </span>
                        <div>
                          <div className="font-semibold">Tappa {tappa.numero}</div>
                          <div className="text-sm text-gray-600">{tappa.nome}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        tappa.completata ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {tappa.completata ? 'Completata' : 'In Corso'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              Seleziona un corsista per visualizzare i dettagli
            </div>
          )}
        </div>
      </div>
    </div>
  );
}