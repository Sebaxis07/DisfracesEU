import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { IncidenteDano } from '../types';
import { DollarSign, Shield, TrendingUp, Award, Calendar, AlertCircle, CheckCircle, Wrench, AlertTriangle, Clock } from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const arriendos = StorageService.getArriendos();
  const disfraces = StorageService.getDisfraces();
  const clientes = StorageService.getClientes();
  const [incidentes, setIncidentes] = useState<IncidenteDano[]>([]);

  const [periodoFiltro, setPeriodoFiltro] = useState<'mes' | 'trimestre' | 'ano' | 'todos'>('mes');

  useEffect(() => {
    const loadIncidentes = async () => {
      const data = await StorageService.fetchIncidentesAsync();
      setIncidentes(data);
    };
    loadIncidentes();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const arriendosFiltrados = arriendos.filter(a => {
    const d = new Date(a.fechaRetiro);
    if (periodoFiltro === 'mes') {
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
    if (periodoFiltro === 'trimestre') {
      const diffMs = now.getTime() - d.getTime();
      return diffMs <= 90 * 24 * 60 * 60 * 1000;
    }
    if (periodoFiltro === 'ano') {
      return d.getFullYear() === currentYear;
    }
    return true;
  });

  // 1. KPIs Financieros
  const ingresosNetos = arriendosFiltrados.reduce((sum, a) => sum + a.montoArriendo, 0);

  const arriendosActivosGarantia = arriendos.filter(a => (a.estado === 'Activo' || a.estado === 'Atrasado') && a.aplicaGarantia);
  const garantiasEnCustodia = arriendosActivosGarantia.reduce((sum, a) => sum + a.montoGarantia, 0);

  const arriendosDevueltos = arriendosFiltrados.filter(a => a.estado === 'Devuelto' || a.estado === 'Dañado');
  const aTiempoCount = arriendosDevueltos.filter(a => a.fechaDevolucionReal && a.fechaDevolucionReal <= a.fechaPactada).length;
  const tasaPuntualidad = arriendosDevueltos.length > 0 ? Math.round((aTiempoCount / arriendosDevueltos.length) * 100) : 100;

  // KPIs de Incidentes y Garantías Retenidas
  const totalGarantiasRetenidas = arriendosFiltrados.reduce((sum, a) => sum + (a.montoGarantiaRetenida || 0), 0);
  const totalGastosReparacion = incidentes.reduce((sum, i) => sum + i.costoReparacionEstimado, 0);
  const balanceIncidentesNeto = totalGarantiasRetenidas - totalGastosReparacion;

  // 2. Ranking de Disfraces Más Rentables
  const rankingDisfraces = disfraces.map(d => {
    const historial = arriendos.filter(a => a.disfrazId === d.id);
    const totalRecaudado = historial.reduce((sum, a) => sum + a.montoArriendo, 0);
    return {
      disfraz: d,
      cantidadArriendos: historial.length,
      totalRecaudado,
    };
  }).sort((a, b) => b.totalRecaudado - a.totalRecaudado);

  const maxRecaudado = rankingDisfraces[0]?.totalRecaudado || 1;

  // 3. Disfraces Dormidos
  const disfracesDormidos = disfraces.filter(d => {
    const historial = arriendos.filter(a => a.disfrazId === d.id);
    return historial.length === 0;
  });

  // 4. Clientes VIP
  const rankingClientes = clientes.map(c => {
    const historial = arriendos.filter(a => a.clienteId === c.id);
    const totalGastado = historial.reduce((sum, a) => sum + a.montoArriendo, 0);
    return {
      cliente: c,
      cantidadArriendos: historial.length,
      totalGastado,
    };
  }).filter(item => item.cantidadArriendos > 0).sort((a, b) => b.totalGastado - a.totalGastado);

  // Datos Estacionales Chile
  const seasonalData = [
    { mes: 'Ene', arriendos: 12 },
    { mes: 'Feb', arriendos: 8 },
    { mes: 'Mar', arriendos: 15 },
    { mes: 'Abr (Día Libro)', arriendos: 48, peak: true },
    { mes: 'May', arriendos: 14 },
    { mes: 'Jun', arriendos: 10 },
    { mes: 'Jul', arriendos: 18 },
    { mes: 'Ago', arriendos: 22 },
    { mes: 'Sep (F. Patrias)', arriendos: 65, peak: true },
    { mes: 'Oct (Halloween)', arriendos: 82, peak: true },
    { mes: 'Nov', arriendos: 20 },
    { mes: 'Dic', arriendos: 35 },
  ];

  return (
    <div>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="module-title">Dashboard Ejecutivo & Rendimiento</h1>
          <p className="module-desc">Analítica financiera, incidentes por daño e inteligencia de temporadas clave en Chile.</p>
        </div>

        <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <button
            className={`btn ${periodoFiltro === 'mes' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setPeriodoFiltro('mes')}
          >
            Este Mes
          </button>
          <button
            className={`btn ${periodoFiltro === 'trimestre' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setPeriodoFiltro('trimestre')}
          >
            Últimos 90 Días
          </button>
          <button
            className={`btn ${periodoFiltro === 'ano' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setPeriodoFiltro('ano')}
          >
            Este Año
          </button>
          <button
            className={`btn ${periodoFiltro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setPeriodoFiltro('todos')}
          >
            Histórico
          </button>
        </div>
      </div>

      {/* 1. TARJETAS DE KPIs FINANCIEROS Y OPERATIVOS */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ingresos Netos
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-hover)' }}>
            ${ingresosNetos.toLocaleString('es-CL')} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>CLP</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingUp size={14} color="#16a34a" />
            <span>Cobrado en el período</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Garantías Custodiadas
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#ecfdf5', color: '#047857' }}>
              <Shield size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857' }}>
            ${garantiasEnCustodia.toLocaleString('es-CL')} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>CLP</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Dinero en custodia a devolver
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Garantías Retenidas (Daños)
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>
            ${totalGarantiasRetenidas.toLocaleString('es-CL')} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>CLP</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Cobrado por daños / incidentes
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Puntualidad Retorno
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d4ed8' }}>
            {tasaPuntualidad}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Entregas devueltas sin retraso
          </div>
        </div>
      </div>

      {/* 2. REGISTRO OFICIAL DE INCIDENTES Y BALANCETE DE DAÑOS */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} color="#dc2626" />
            <span>Balancete de Incidentes, Lavandería & Reparaciones</span>
          </h3>

          <div style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.4rem 0.85rem', backgroundColor: balanceIncidentesNeto >= 0 ? '#ecfdf5' : '#fef2f2', color: balanceIncidentesNeto >= 0 ? '#047857' : '#991b1b', borderRadius: 'var(--radius-md)', border: '1px solid currentColor' }}>
            Balance Neto Daños: ${balanceIncidentesNeto.toLocaleString('es-CL')} CLP
          </div>
        </div>

        {incidentes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No hay incidentes de prendas dañadas registrados. Todas las devoluciones han sido impecables.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
            {incidentes.map(inc => {
              const disfraz = disfraces.find(d => d.id === inc.disfrazId);
              const cliente = clientes.find(c => c.id === inc.clienteId);

              let badgeIcon = '🧼';
              if (inc.tipoIncidente === 'Ruptura') badgeIcon = '🪡';
              if (inc.tipoIncidente === 'Accesorio_Faltante') badgeIcon = '🗡️';
              if (inc.tipoIncidente === 'Perdida_Total') badgeIcon = '❌';

              return (
                <div
                  key={inc.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#991b1b' }}>
                      {badgeIcon} {inc.tipoIncidente.replace('_', ' ')} — {disfraz?.nombre || 'Disfraz'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.2rem' }}>
                      Cliente: <strong>{cliente?.nombre || 'Cliente'}</strong> | Detalle: {inc.descripcion}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div style={{ color: '#b91c1c', fontWeight: 800 }}>Retenido: +${inc.montoGarantiaRetenida.toLocaleString('es-CL')} CLP</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Est. Reparación: -${inc.costoReparacionEstimado.toLocaleString('es-CL')} CLP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SECCIÓN DE RENTABILIDAD DEL CATÁLOGO & INVENTARIO DORMIDO */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--color-primary)" />
            <span>Prendas Estrella (Más Rentables)</span>
          </h3>

          {rankingDisfraces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No hay suficientes datos registrados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rankingDisfraces.slice(0, 5).map((item, idx) => {
                const percentage = Math.round((item.totalRecaudado / maxRecaudado) * 100);
                return (
                  <div key={item.disfraz.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? '#fef08a' : 'var(--bg-subtle)',
                          color: idx === 0 ? '#854d0e' : 'var(--color-text-main)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          #{idx + 1}
                        </span>
                        <strong style={{ fontSize: '0.9rem' }}>{item.disfraz.nombre}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({item.disfraz.talla})</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary-hover)' }}>
                        ${item.totalRecaudado.toLocaleString('es-CL')}
                      </div>
                    </div>

                    <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(percentage, 5)}%`,
                        backgroundColor: idx === 0 ? '#eab308' : 'var(--color-primary)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', textAlign: 'right' }}>
                      {item.cantidadArriendos} arriendo(s) realizados
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="#eab308" />
            <span>Alerta de Inventario Dormido ({disfracesDormidos.length})</span>
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Prendas con 0 arriendos acumulados. Se sugiere promocionarlas o revisar su precio sugerido.
          </p>

          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {disfracesDormidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#16a34a', fontSize: '0.9rem', fontWeight: 600 }}>
                ¡Excelente! Todas las prendas del catálogo registran rotación.
              </div>
            ) : (
              disfracesDormidos.map(d => (
                <div
                  key={d.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{d.talla} — {d.categoria}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>${d.precioSugerido.toLocaleString('es-CL')}</div>
                    <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Sin rotación</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. INTELIGENCIA DE TEMPORADAS ALTAS EN CHILE */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--color-primary)" />
          <span>Inteligencia de Demanda y Estacionalidad en Chile</span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Visualización de picos históricos y recomendación de preparación de stock previo a cada evento masivo.
        </p>

        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#166534' }}>📚 Abril: Día del Libro</div>
            <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.25rem' }}>
              Pico de demanda escolar. Aumentar stock de cuentos, fábulas y personajes literarios infantiles.
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#991b1b' }}>🇨🇱 Septiembre: Fiestas Patrias</div>
            <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.25rem' }}>
              Máxima demanda del año. Tener disponibles y lavados trajes de Huaso, China y pascuenses.
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#fffbebfb', border: '1px solid #fef08a', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#854d0e' }}>🎃 Octubre: Halloween</div>
            <div style={{ fontSize: '0.8rem', color: '#a16207', marginTop: '0.25rem' }}>
              Fiebre de disfraces para adultos y niños. Preparar catálogo de terror, superhéroes y villanos.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', height: '160px', gap: '0.5rem', paddingTop: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          {seasonalData.map((item, i) => {
            const heightPercent = Math.round((item.arriendos / 90) * 100);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                {item.peak && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: item.mes.includes('Sep') ? '#dc2626' : item.mes.includes('Oct') ? '#d97706' : '#16a34a', marginBottom: '2px' }}>
                    PEAK
                  </span>
                )}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${heightPercent}%`,
                    backgroundColor: item.peak ? (item.mes.includes('Sep') ? '#dc2626' : item.mes.includes('Oct') ? '#d97706' : '#16a34a') : 'var(--color-primary)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                  title={`${item.mes}: ${item.arriendos} arriendos proyectados`}
                />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '0.4rem', color: item.peak ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                  {item.mes.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. RANKING DE CLIENTES VIP */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--color-primary)" />
          <span>Ranking de Clientes Recurrentes (Fidelización)</span>
        </h3>

        {rankingClientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No hay suficientes registros de arriendos por cliente.
          </div>
        ) : (
          <div className="grid-3">
            {rankingClientes.slice(0, 3).map((item, idx) => (
              <div
                key={item.cliente.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.cliente.nombre}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                    VIP #{idx + 1}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📱 {item.cliente.telefono}</div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                  {item.cantidadArriendos} arriendos | Total: ${item.totalGastado.toLocaleString('es-CL')} CLP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
