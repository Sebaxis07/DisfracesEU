import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { Arriendo, Disfraz, Cliente, Reserva, IncidenteDano } from '../types';
import { DollarSign, Shield, TrendingUp, Award, Calendar, AlertCircle, CheckCircle, Wrench, AlertTriangle, Star } from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const [arriendos, setArriendos] = useState<Arriendo[]>([]);
  const [disfraces, setDisfraces] = useState<Disfraz[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [incidentes, setIncidentes] = useState<IncidenteDano[]>([]);

  const [periodoFiltro, setPeriodoFiltro] = useState<'mes' | 'trimestre' | 'ano' | 'todos'>('todos');

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const loadAllData = async () => {
    setArriendos(StorageService.getArriendos());
    setDisfraces(StorageService.getDisfraces());
    setClientes(StorageService.getClientes());
    setReservas(StorageService.getReservas());
    const incs = await StorageService.fetchIncidentesAsync();
    setIncidentes(incs);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Helper para validar si una fecha YYYY-MM-DD cae dentro del período seleccionado
  const isInPeriod = (fechaStr?: string) => {
    if (!fechaStr) return false;
    if (periodoFiltro === 'todos') return true;

    const [yyyy, mm] = fechaStr.split('-');
    if (!yyyy || !mm) return true;

    if (periodoFiltro === 'mes') {
      return `${yyyy}-${mm}` === currentMonthStr;
    }

    if (periodoFiltro === 'ano') {
      return Number(yyyy) === currentYear;
    }

    if (periodoFiltro === 'trimestre') {
      const itemDate = new Date(fechaStr).getTime();
      const diffDays = (now.getTime() - itemDate) / (1000 * 3600 * 24);
      return diffDays >= -30 && diffDays <= 90;
    }

    return true;
  };

  // 1. Filtrado de Transacciones
  const arriendosFiltrados = arriendos.filter(a => isInPeriod(a.fechaRetiro));
  const reservasFiltradas = reservas.filter(r => isInPeriod(r.fechaInicio) && r.estado !== 'Cancelada');

  // KPIs Financieros (Arriendos + Abonos de Reservas)
  const ingresosArriendos = arriendosFiltrados.reduce((sum, a) => sum + a.montoArriendo, 0);
  const ingresosAbonosReservas = reservasFiltradas.reduce((sum, r) => sum + r.montoAbono, 0);
  const ingresosNetos = ingresosArriendos + ingresosAbonosReservas;

  // Garantías en custodia (Arriendos activos + Reservas confirmadas)
  const arriendosActivosGarantia = arriendos.filter(a => (a.estado === 'Activo' || a.estado === 'Atrasado') && a.aplicaGarantia);
  const garantiasEnCustodia = arriendosActivosGarantia.reduce((sum, a) => sum + a.montoGarantia, 0);

  // Tasa de Puntualidad
  const arriendosDevueltos = arriendosFiltrados.filter(a => a.estado === 'Devuelto' || a.estado === 'Dañado');
  const aTiempoCount = arriendosDevueltos.filter(a => a.fechaDevolucionReal && a.fechaDevolucionReal <= a.fechaPactada).length;
  const tasaPuntualidad = arriendosDevueltos.length > 0 ? Math.round((aTiempoCount / arriendosDevueltos.length) * 100) : 100;

  // Garantías retenidas por daños
  const totalGarantiasRetenidas = arriendosFiltrados.reduce((sum, a) => sum + (a.montoGarantiaRetenida || 0), 0);
  const totalGastosReparacion = incidentes.reduce((sum, i) => sum + i.costoReparacionEstimado, 0);
  const balanceIncidentesNeto = totalGarantiasRetenidas - totalGastosReparacion;

  // 2. Ranking de Disfraces Más Rentables (Arriendos + Reservas)
  const rankingDisfraces = disfraces.map(d => {
    const arrs = arriendos.filter(a => a.disfrazId === d.id);
    const resvs = reservas.filter(r => r.disfrazId === d.id && r.estado !== 'Cancelada');

    const recArriendos = arrs.reduce((sum, a) => sum + a.montoArriendo, 0);
    const recReservas = resvs.reduce((sum, r) => sum + r.montoAbono, 0);
    const totalRecaudado = recArriendos + recReservas;
    const cantidadTotal = arrs.length + resvs.length;

    return {
      disfraz: d,
      cantidadArriendos: cantidadTotal,
      totalRecaudado,
    };
  }).sort((a, b) => b.totalRecaudado - a.totalRecaudado);

  const maxRecaudado = rankingDisfraces[0]?.totalRecaudado || 1;

  // 3. Disfraces Dormidos (0 arriendos y 0 reservas)
  const disfracesDormidos = disfraces.filter(d => {
    const arrs = arriendos.filter(a => a.disfrazId === d.id);
    const resvs = reservas.filter(r => r.disfrazId === d.id && r.estado !== 'Cancelada');
    return arrs.length === 0 && resvs.length === 0;
  });

  // 4. Ranking de Clientes Recurrentes / VIP (Arriendos + Reservas)
  const rankingClientes = clientes.map(c => {
    const arrs = arriendos.filter(a => a.clienteId === c.id);
    const resvs = reservas.filter(r => r.clienteId === c.id && r.estado !== 'Cancelada');

    const totalGastadoArriendo = arrs.reduce((sum, a) => sum + a.montoArriendo, 0);
    const totalGastadoReserva = resvs.reduce((sum, r) => sum + r.montoAbono, 0);
    const totalGastado = totalGastadoArriendo + totalGastadoReserva;
    const totalOperaciones = arrs.length + resvs.length;

    return {
      cliente: c,
      cantidadOperaciones: totalOperaciones,
      totalGastado,
    };
  }).filter(item => item.cantidadOperaciones > 0).sort((a, b) => {
    if (b.cantidadOperaciones !== a.cantidadOperaciones) {
      return b.cantidadOperaciones - a.cantidadOperaciones;
    }
    return b.totalGastado - a.totalGastado;
  });

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
      {/* CABECERA Y FILTRO DE PERÍODO */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="module-title">Dashboard Ejecutivo & Rendimiento</h1>
          <p className="module-desc">Analítica financiera, incidentes por daño e inteligencia de temporadas clave en Chile.</p>
        </div>

        <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '0.25rem' }}>
          <button
            className={`btn ${periodoFiltro === 'mes' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none', minHeight: '36px' }}
            onClick={() => setPeriodoFiltro('mes')}
          >
            Este Mes
          </button>
          <button
            className={`btn ${periodoFiltro === 'trimestre' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none', minHeight: '36px' }}
            onClick={() => setPeriodoFiltro('trimestre')}
          >
            Últimos 90 Días
          </button>
          <button
            className={`btn ${periodoFiltro === 'ano' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none', minHeight: '36px' }}
            onClick={() => setPeriodoFiltro('ano')}
          >
            Este Año
          </button>
          <button
            className={`btn ${periodoFiltro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', border: 'none', minHeight: '36px' }}
            onClick={() => setPeriodoFiltro('todos')}
          >
            Histórico Total
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
            <span>Arriendos ({formatCLP(ingresosArriendos)}) + Abonos ({formatCLP(ingresosAbonosReservas)})</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Garantías Custodiadas
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-disponible-bg)', color: 'var(--status-disponible)' }}>
              <Shield size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-disponible)' }}>
            ${garantiasEnCustodia.toLocaleString('es-CL')} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>CLP</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Dinero en custodia a devolver al cliente
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Garantías Retenidas (Daños)
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-atrasado-bg)', color: 'var(--status-atrasado)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-atrasado)' }}>
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
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
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

          <div style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.4rem 0.85rem', backgroundColor: balanceIncidentesNeto >= 0 ? 'var(--status-disponible-bg)' : 'var(--status-atrasado-bg)', color: balanceIncidentesNeto >= 0 ? 'var(--status-disponible)' : 'var(--status-atrasado)', borderRadius: 'var(--radius-md)', border: '1px solid currentColor' }}>
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
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ef4444' }}>
                      {badgeIcon} {inc.tipoIncidente.replace('_', ' ')} — {disfraz?.nombre || 'Disfraz'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      Cliente: <strong>{cliente?.nombre || 'Cliente'}</strong> | Detalle: {inc.descripcion}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div style={{ color: '#ef4444', fontWeight: 800 }}>Retenido: +${inc.montoGarantiaRetenida.toLocaleString('es-CL')} CLP</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Est. Reparación: -${inc.costoReparacionEstimado.toLocaleString('es-CL')} CLP</div>
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
                      {item.cantidadArriendos} operacion(es) realizada(s)
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
            Prendas con 0 arriendos o reservas acumuladas. Se sugiere promocionarlas o ajustar precio.
          </p>

          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {disfracesDormidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-disponible)', fontSize: '0.9rem', fontWeight: 600 }}>
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
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)' }}>📚 Abril: Día del Libro</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Pico de demanda escolar. Aumentar stock de cuentos, fábulas y personajes literarios infantiles.
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ef4444' }}>🇨🇱 Septiembre: Fiestas Patrias</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Máxima demanda del año. Tener disponibles y lavados trajes de Huaso, China y pascuenses.
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f59e0b' }}>🎃 Octubre: Halloween</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
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
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: item.mes.includes('Sep') ? '#ef4444' : item.mes.includes('Oct') ? '#f59e0b' : 'var(--status-disponible)', marginBottom: '2px' }}>
                    PEAK
                  </span>
                )}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${heightPercent}%`,
                    backgroundColor: item.peak ? (item.mes.includes('Sep') ? '#ef4444' : item.mes.includes('Oct') ? '#f59e0b' : 'var(--status-disponible)') : 'var(--color-primary)',
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

      {/* 5. RANKING DE CLIENTES RECURRENTES */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={20} color="var(--color-primary)" />
          <span>Ranking de Clientes Recurrentes (Fidelización & VIP)</span>
        </h3>

        {rankingClientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No hay registros de operaciones asociadas a clientes en este filtro.
          </div>
        ) : (
          <div className="grid-3">
            {rankingClientes.slice(0, 6).map((item, idx) => (
              <div
                key={item.cliente.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{item.cliente.nombre}</strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                    VIP #{idx + 1}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📱 {item.cliente.telefono}</div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                  {item.cantidadOperaciones} operacion(es) | Total: ${item.totalGastado.toLocaleString('es-CL')} CLP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
