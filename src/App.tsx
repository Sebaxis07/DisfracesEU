import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RegistroArriendoModule } from './modules/RegistroArriendoModule';
import { ArriendosActivosModule } from './modules/ArriendosActivosModule';
import { InventarioModule } from './modules/InventarioModule';
import { DashboardModule } from './modules/DashboardModule';
import { NotificacionesModule } from './modules/NotificacionesModule';
import { ReservasModule } from './modules/ReservasModule';
import { ComprobantesModule } from './modules/ComprobantesModule';
import { ClientesModule } from './modules/ClientesModule';
import { ReportProblemModal } from './components/ReportProblemModal';
import { StorageService } from './services/storage';
import { useTheme } from './services/theme';
import { errorLogger } from './services/errorLogger';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('registro');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const { themeMode, setThemeMode } = useTheme();

  const handleStateChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    errorLogger.setActiveModule(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const syncDatabase = async () => {
      await Promise.all([
        StorageService.fetchClientesAsync(),
        StorageService.fetchDisfracesAsync(),
        StorageService.fetchArriendosAsync(),
        StorageService.fetchReservasAsync(),
      ]);
      handleStateChanged();
    };
    syncDatabase();
  }, []);

  const notificaciones = StorageService.getNotificaciones();
  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="app-container" key={refreshKey}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onOpenReportModal={() => setShowReportModal(true)}
      />

      <main className="main-content">
        {activeTab === 'registro' && (
          <RegistroArriendoModule
            onArriendoCreated={() => {
              handleStateChanged();
              setActiveTab('activos');
            }}
          />
        )}

        {activeTab === 'activos' && (
          <ArriendosActivosModule
            onStateChanged={handleStateChanged}
          />
        )}

        {activeTab === 'reservas' && (
          <ReservasModule
            onStateChanged={handleStateChanged}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientesModule
            onStateChanged={handleStateChanged}
            onNavigateToNuevoArriendo={() => setActiveTab('registro')}
          />
        )}

        {activeTab === 'inventario' && (
          <InventarioModule
            onStateChanged={handleStateChanged}
          />
        )}

        {activeTab === 'comprobantes' && (
          <ComprobantesModule />
        )}

        {activeTab === 'dashboard' && (
          <DashboardModule />
        )}

        {activeTab === 'notificaciones' && (
          <NotificacionesModule
            onStateChanged={handleStateChanged}
          />
        )}
      </main>

      {showReportModal && (
        <ReportProblemModal
          activeModule={activeTab}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default App;

