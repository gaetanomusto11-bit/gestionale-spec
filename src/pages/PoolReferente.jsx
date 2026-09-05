import { useEffect, useState } from 'react';
import { getFatture, getPoolReferente } from '../services/api';

export default function PoolReferente() {
  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [poolData, setPoolData] = useState(null);
  const [selectedReferente, setSelectedReferente] = useState('');

  useEffect(() => {
    fetchFatture();
  }, []);

  const fetchFatture = async () => {
    try {
      const data = await getFatture();
      setFatture(data.data);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReferente = async (referente) => {
    setSelectedReferente(referente);
    try {
      const data = await getPoolReferente(referente);
      setPoolData(data.data);
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  if (loading) return <div className="text-center">Caricamento...</div>;

  const referenti = [...new Set(fatture.filter(f => f.referente).map(f => f.referente))];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">🤝 Pool Referente - Compensazione</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Lista Referenti */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Referenti</h2>
            <div className="space-y-2">
              {referenti.length > 0 ? (
                referenti.map((ref) => (
                  <button
                    key={ref}
                    onClick={() => handleSelectReferente(ref)}
                    className={`w-full p-3 rounded text-left transition ${
                      selectedReferente === ref
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">{ref}</div>
                  </button>
                ))
              ) : (
                <p className="text-gray-600 text-sm">Nessun referente trovato</p>
              )}
            </div>
          </div>
        </div>

        {/* Dettaglio Pool */}
        <div className="col-span-2">
          {poolData ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">{poolData.referente}</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Pagamenti Ricevuti</div>
                  <div className="text-3xl font-bold text-blue-600">
                    €{poolData.pagamenti_totali.toFixed(2)}
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded border border-orange-200">
                  <div className="text-sm text-gray-600 mb-1">Fatture Dovute</div>
                  <div className="text-3xl font-bold text-orange-600">
                    €{poolData.fatture_totali.toFixed(2)}
                  </div>
                </div>

                <div className={`${poolData.saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} p-4 rounded border`}>
                  <div className="text-sm text-gray-600 mb-1">Saldo</div>
                  <div className={`text-3xl font-bold ${poolData.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{poolData.saldo.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-bold mb-2">Analisi:</h3>
                {poolData.saldo > 0 && (
                  <p className="text-green-600 text-sm">
                    ✓ Il referente ha un saldo positivo di €{poolData.saldo.toFixed(2)}. 
                    I pagamenti ricevuti superano le fatture dovute.
                  </p>
                )}
                {poolData.saldo === 0 && (
                  <p className="text-blue-600 text-sm">
                    = Il referente è in pareggio. Pagamenti e fatture sono uguali.
                  </p>
                )}
                {poolData.saldo < 0 && (
                  <p className="text-red-600 text-sm">
                    ⚠️ Il referente ha un saldo negativo di €{Math.abs(poolData.saldo).toFixed(2)}. 
                    Le fatture superano i pagamenti ricevuti.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              Seleziona un referente per visualizzare il pool
            </div>
          )}
        </div>
      </div>
    </div>
  );
}