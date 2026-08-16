import React from 'react';
import { StorageService } from '../services/storage';
import { DollarSign, Shield, Shirt, AlertCircle, TrendingUp, Award, Clock } from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const arriendos = StorageService.getArriendos();
  const disfraces = StorageService.getDisfraces();
  const hoyStr = new Date().toISOString().split('T')[0];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const arriendosDelMes = arriendos.filter(a => {
    const d = new Date(a.fechaRetiro);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const ingresosNetosMes = arriendosDelMes.reduce((sum, a) => sum + a.montoArriendo, 0);

  const arriendosConGarantiaActiva = arriendos.filter(a => (a.estado === 'Activo' || a.estado === 'Atrasado') && a.aplicaGarantia);
  const garantiasEnCustodia = arriendosConGarantiaActiva.reduce((sum, a) => sum + a.montoGarantia, 0);

  const arrendadosCount = disfraces.filter(d => d.estado === 'Arrendado').length;
  const disponiblesCount = disfraces.filter(d => d.estado === 'Disponible').length;
  const mantencionCount = disfraces.filter(d => d.estado === 'Mantencion').length;

  const retrasosCount = arriendos.filter(a => (a.estado === 'Activo' && a.fechaPactada < hoyStr) || a.estado === 'Atrasado').length;

  const seasonalData = [
    { mes: 'Ene', arriendos: 0 },
    { mes: 'Feb', arriendos: 0 },
    { mes: 'Mar', arriendos: 0 },
    { mes: 'Abr (Día Libro)', arriendos: 0, peak: true },
    { mes: 'May', arriendos: 0 },
    { mes: 'Jun', arriendos: 0 },
    { mes: 'Jul', arriendos: 0 },
    { mes: 'Ago', arriendos: 0 },
    { mes: 'Sep (F. Patrias)', arriendos: 0, peak: true },
    { mes: 'Oct (Halloween)', arriendos: 0, peak: true },
    { mes: 'Nov', arriendos: 0 },
    { mes: 'Dic', arriendos: 0 },
  ];

  // Calcular totales reales por mes del año actual si existen arriendos
  arriendos.forEach(a => {
    const d = new Date(a.fechaRetiro);
    if (d.getFullYear() === currentYear) {
      const idx = d.getMonth();
      if (seasonalData[idx]) {
        seasonalData[idx].arriendos += 1;
      }
    }
  });

  const rankingDisfraces = disfraces.map(d => {
    const historial = arriendos.filter(a => a.disfrazId === d.id);
    const ingresos = historial.reduce((sum, a) => sum + a.montoArriendo, 0);
    return {
      disfraz: d,
      conteoArriendos: historial.length,
      ingresosTotales: ingresos,
    };
  }).sort((a, b) => b.conteoArriendos - a.conteoArriendos);

  const disfracesSinMovimiento = disfraces.filter(d => {
    const historial = arriendos.filter(a => a.disfrazId === d.id);
    return historial.length === 0;
  });

  const maxVal = Math.max(...seasonalData.map(d => d.arriendos), 1);

  return (
    <div>
      <div className="module-header">
        <h1 className="module-title">Dashboard y Analítica de Negocio</h1>
        <p className="module-desc">Resumen ejecutivo de ingresos reales, garantías en custodia y comportamiento de arriendos.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>INGRESOS DEL MES</span>
            <DollarSign size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            ${ingresosNetosMes.toLocaleString('es-CL')} CLP
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {arriendosDelMes.length} arriendos este mes
          </div>
        </div>

        <div className="card" style={{ borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>GARANTÍAS EN CUSTODIA</span>
            <Shield size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857' }}>
            ${garantiasEnCustodia.toLocaleString('es-CL')} CLP
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {arriendosConGarantiaActiva.length} garantías activas por devolver
          </div>
        </div>

        <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>DISFRACES EN ARRIENDO</span>
            <Shirt size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            {arrendadosCount} / {disfraces.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {disponiblesCount} disponibles | {mantencionCount} mantención
          </div>
        </div>

        <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>ALERTAS DE RETRASO</span>
            <AlertCircle size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: retrasosCount > 0 ? '#b91c1c' : 'var(--color-text-main)' }}>
            {retrasosCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {retrasosCount === 0 ? 'Sin entregas atrasadas' : 'Requiere contacto vía WhatsApp'}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--color-primary)" />
            <span>Tendencia Mensual de Arriendos</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Registro real de arriendos por mes durante el año {currentYear}.
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '180px', paddingTop: '1rem' }}>
            {seasonalData.map((d, index) => {
              const heightPct = (d.arriendos / maxVal) * 100;
              return (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{d.arriendos}</div>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      backgroundColor: d.arriendos > 0 ? '#2563eb' : 'var(--bg-subtle)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                  <div style={{ fontSize: '0.65rem', color: d.peak ? '#1d4ed8' : 'var(--color-text-muted)', fontWeight: d.peak ? 800 : 500, marginTop: '0.35rem', textAlign: 'center' }}>
                    {d.mes}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--color-primary)" />
            <span>Top Disfraces por Rotación y Rentabilidad</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Prendas con mayor frecuencia de arriendo acumulado.
          </p>

          {rankingDisfraces.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No hay disfraces registrados en el catálogo aún.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rankingDisfraces.slice(0, 4).map((item, idx) => (
                <div
                  key={item.disfraz.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#fef08a' : '#e2e8f0',
                      color: idx === 0 ? '#854d0e' : 'var(--color-text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.disfraz.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.disfraz.talla} — {item.disfraz.categoria}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary-hover)' }}>
                      ${item.ingresosTotales.toLocaleString('es-CL')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {item.conteoArriendos} arriendos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="#f59e0b" />
          <span>Disfraces con Baja Rotación (Sugerencias de Promoción)</span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Prendas sin movimiento en los últimos 60 días recomendadas para liquidar o promocionar.
        </p>

        {disfracesSinMovimiento.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {disfraces.length === 0 ? 'Agrega disfraces al catálogo para monitorear su nivel de rotación.' : '¡Excelente! Todos los disfraces del catálogo registran movimiento recurrente.'}
          </div>
        ) : (
          <div className="grid-3">
            {disfracesSinMovimiento.map(d => (
              <div key={d.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.nombre}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{d.talla} — {d.categoria}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>
                  Recomendación: Aplicar 20% dscto.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
