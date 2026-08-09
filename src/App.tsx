import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ClientsPage } from './pages/ClientsPage';
import { SettingsPage } from './pages/SettingsPage';
import { InvoiceFormModal } from './pages/InvoiceFormModal';
import { VerifactuGuideModal } from './components/VerifactuGuideModal';
import { Invoice, Settings } from './types';
import { getSettings, initDatabase } from './services/database';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'clients' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dbReady, setDbReady] = useState(false);

  // Theme state: dark by default (extra pitch dark) or light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const [invoicesRefreshTrigger, setInvoicesRefreshTrigger] = useState(0);

  const reloadSettings = async () => {
    try {
      const stts = await getSettings();
      setSettings(stts);
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  };

  const handleInvoiceSaved = () => {
    reloadSettings();
    setInvoicesRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    async function init() {
      try {
        // Wait for Neutralino native API WebSocket handshake to complete if running in Neutralino runtime
        if (window.Neutralino && window.NL_TOKEN) {
          await new Promise<void>((resolve) => {
            let readyFired = false;
            const fallbackTimer = setTimeout(() => {
              if (!readyFired) {
                readyFired = true;
                resolve();
              }
            }, 300);

            window.Neutralino?.events?.on('ready', () => {
              if (!readyFired) {
                readyFired = true;
                clearTimeout(fallbackTimer);
                resolve();
              }
            });
          });
        }

        await initDatabase();
        setDbReady(true);
        await reloadSettings();
      } catch (err) {
        console.error('Error inicializando la base de datos:', err);
      }
    }
    init();
  }, []);

  const handleOpenNewInvoice = () => {
    setEditingInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Panel Principal';
      case 'invoices':
        return 'Facturas e IGIC / IVA';
      case 'clients':
        return 'Gestión de Clientes';
      case 'settings':
        return 'Configuración y Verifactu';
    }
  };

  const isDark = theme === 'dark';

  if (!dbReady) {
    return (
      <div
        className={`h-screen flex flex-col items-center justify-center space-y-4 font-['Plus_Jakarta_Sans',sans-serif] ${
          isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0055ff] to-cyan-400 flex items-center justify-center animate-bounce text-xl font-bold shadow-lg shadow-blue-500/40 text-white">
          ⚡
        </div>
        <div className="text-lg font-bold tracking-wide">Cargando Verifactu Gratuito Taratic...</div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Cargando motor SQLite WASM y sistema de archivos local
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200 ${
        isDark ? 'bg-[#131314] text-zinc-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        verifactuEnabled={Boolean(settings?.verifactu_enabled)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        theme={theme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={getHeaderTitle()}
          verifactuEnabled={Boolean(settings?.verifactu_enabled)}
          onNewInvoice={handleOpenNewInvoice}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNewInvoice={handleOpenNewInvoice}
              onViewInvoice={handleOpenEditInvoice}
              onNavigateToInvoices={() => setActiveTab('invoices')}
              onNavigateToClients={() => setActiveTab('clients')}
              onNavigateToSettings={() => setActiveTab('settings')}
              onOpenGuide={() => setIsGuideModalOpen(true)}
              refreshTrigger={invoicesRefreshTrigger}
              theme={theme}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesPage
              onNewInvoice={handleOpenNewInvoice}
              onEditInvoice={handleOpenEditInvoice}
              refreshTrigger={invoicesRefreshTrigger}
              onInvoiceSaved={handleInvoiceSaved}
              theme={theme}
            />
          )}

          {activeTab === 'clients' && <ClientsPage theme={theme} />}

          {activeTab === 'settings' && (
            <SettingsPage
              onOpenGuide={() => setIsGuideModalOpen(true)}
              onSettingsUpdated={reloadSettings}
              theme={theme}
            />
          )}
        </main>
      </div>

      {/* Invoice Form / Editor Modal */}
      <InvoiceFormModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        initialInvoice={editingInvoice}
        onInvoiceSaved={handleInvoiceSaved}
        theme={theme}
      />

      {/* Integrated Verifactu Guide Modal */}
      <VerifactuGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        theme={theme}
      />
    </div>
  );
};

export default App;
