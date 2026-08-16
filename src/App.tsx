import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RegistroArriendoModule } from './modules/RegistroArriendoModule';
import { ArriendosActivosModule } from './modules/ArriendosActivosModule';
import { InventarioModule } from './modules/InventarioModule';
import { DashboardModule } from './modules/DashboardModule';
import { NotificacionesModule } from './modules/NotificacionesModule';
import { StorageService } from './services/storage';
import { useTheme } from './services/theme';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('registro');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { themeMode, setThemeMode } = useTheme();

  const handleStateChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const syncDatabase = async () => {
      await Promise.all([
        StorageService.fetchClientesAsync(),
        StorageService.fetchDisfracesAsync(),
        StorageService.fetchArriendosAsync(),
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

        {activeTab === 'inventario' && (
          <InventarioModule
            onStateChanged={handleStateChanged}
          />
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
    </div>
  );
};

export default App;
