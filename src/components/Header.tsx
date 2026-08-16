import React from 'react';
import { PlusCircle, Clock, Shirt, BarChart3, Bell, Sun, Moon, Laptop } from 'lucide-react';
import type { ThemeMode } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  themeMode,
  setThemeMode,
}) => {
  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <div className="logo-area">
            <div className="logo-icon">EU</div>
            <div>
              <div className="logo-title">Disfraces EU</div>
              <div className="logo-subtitle">Gestión Rápida</div>
            </div>
          </div>

          {/* Navegación Desktop / Tablet */}
          <nav className="desktop-nav">
            <button
              className={`nav-tab ${activeTab === 'registro' ? 'active' : ''}`}
              onClick={() => setActiveTab('registro')}
            >
              <PlusCircle size={18} />
              <span>Nuevo Arriendo</span>
            </button>

            <button
              className={`nav-tab ${activeTab === 'activos' ? 'active' : ''}`}
              onClick={() => setActiveTab('activos')}
            >
              <Clock size={18} />
              <span>Arriendos Activos</span>
            </button>

            <button
              className={`nav-tab ${activeTab === 'inventario' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventario')}
            >
              <Shirt size={18} />
              <span>Inventario</span>
            </button>

            <button
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </button>

            <button
              className={`nav-tab ${activeTab === 'notificaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('notificaciones')}
            >
              <Bell size={18} />
              <span>Alertas</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
          </nav>

          {/* Selector de Tema: Claro / Oscuro / Sistema */}
          <div className="theme-selector">
            <button
              className={`theme-btn ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
              title="Modo Claro"
            >
              <Sun size={15} />
              <span>Claro</span>
            </button>

            <button
              className={`theme-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
              title="Modo Oscuro"
            >
              <Moon size={15} />
              <span>Oscuro</span>
            </button>

            <button
              className={`theme-btn ${themeMode === 'system' ? 'active' : ''}`}
              onClick={() => setThemeMode('system')}
              title="Modo Sistema"
            >
              <Laptop size={15} />
              <span>Sistema</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegación Inferior para Celular (Mobile Bottom Nav Bar) */}
      <div className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === 'registro' ? 'active' : ''}`}
          onClick={() => setActiveTab('registro')}
        >
          <PlusCircle size={20} />
          <span>Nuevo</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'activos' ? 'active' : ''}`}
          onClick={() => setActiveTab('activos')}
        >
          <Clock size={20} />
          <span>Activos</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'inventario' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventario')}
        >
          <Shirt size={20} />
          <span>Catálogo</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={20} />
          <span>Métricas</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'notificaciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('notificaciones')}
        >
          <Bell size={20} />
          <span>Alertas</span>
          {unreadCount > 0 && <span className="mobile-nav-badge">{unreadCount}</span>}
        </button>
      </div>
    </>
  );
};
