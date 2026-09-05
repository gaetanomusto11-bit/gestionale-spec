import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', label: '📊 Dashboard', icon: '📊' },
    { path: '/corsisti', label: '👥 Gestione Corsisti', icon: '👥' },
    { path: '/iscrizioni', label: '📝 Iscrizioni Attive', icon: '📝' },
    { path: '/pagamenti', label: '💰 Registra Pagamenti', icon: '💰' },
    { path: '/storico', label: '📚 Dashboard Storico', icon: '📚' },
    { path: '/avanzamento', label: '📈 Avanzamento Percorso', icon: '📈' },
    { path: '/fatture', label: '📄 Gestione Fatture', icon: '📄' },
    { path: '/pool-referente', label: '🤝 Pool Referente', icon: '🤝' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 shadow-lg`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">SPEC</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-blue-700 rounded"
          >
            {sidebarOpen ? '<<' : '>>'}
          </button>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 transition-all ${
                isActive(item.path)
                  ? 'bg-blue-600 border-r-4 border-yellow-400'
                  : 'hover:bg-blue-700'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {sidebarOpen && <span className="ml-3 text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">SPEC Gestionale</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">🟢 Backend Online</span>
            <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}