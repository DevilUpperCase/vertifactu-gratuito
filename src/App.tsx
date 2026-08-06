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

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const reloadSettings = async () => {
    try {
      const stts = await getSettings();
      setSettings(stts);
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  };

  useEffect(() => {
    async function init() {
      // Inicializar SDK de NeutralinoJS si está disponible
      if (window.Neutralino) {
        try {
          window.Neutralino.init();
          console.log('NeutralinoJS inicializado con éxito');
        } catch (e) {
          console.warn('Advertencia al inicializar NeutralinoJS:', e);
        }
      }

      // Inicializar SQLite WASM
      try {
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
        return 'Facturas e IGIC';
      case 'clients':
        return 'Gestión de Clientes';
      case 'settings':
        return 'Configuración y Verifactu';
    }
  };

  if (!dbReady) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center animate-bounce text-xl font-bold shadow-lg shadow-purple-950">
          ⚡
        </div>
        <div className="text-lg font-bold tracking-wide">Cargando Facturalia IGIC...</div>
        <p className="text-xs text-slate-400">Cargando motor SQLite WASM y sistema de archivos local</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        verifactuEnabled={Boolean(settings?.verifactu_enabled)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={getHeaderTitle()}
          verifactuEnabled={Boolean(settings?.verifactu_enabled)}
          onNewInvoice={handleOpenNewInvoice}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNewInvoice={handleOpenNewInvoice}
              onViewInvoice={handleOpenEditInvoice}
              onNavigateToInvoices={() => setActiveTab('invoices')}
              onNavigateToClients={() => setActiveTab('clients')}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesPage
              onNewInvoice={handleOpenNewInvoice}
              onEditInvoice={handleOpenEditInvoice}
            />
          )}

          {activeTab === 'clients' && <ClientsPage />}

          {activeTab === 'settings' && (
            <SettingsPage
              onOpenGuide={() => setIsGuideModalOpen(true)}
              onSettingsUpdated={reloadSettings}
            />
          )}
        </main>
      </div>

      {/* Invoice Form / Editor Modal */}
      <InvoiceFormModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        initialInvoice={editingInvoice}
        onInvoiceSaved={reloadSettings}
      />

      {/* Integrated Verifactu Guide Modal */}
      <VerifactuGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
};

export default App;
