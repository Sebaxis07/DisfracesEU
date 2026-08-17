import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { Arriendo, Reserva, Cliente, Disfraz, ComprobanteData } from '../types';
import { ComprobanteModal } from '../components/ComprobanteModal';
import { Search, Printer, FileText, Filter } from 'lucide-react';

export const ComprobantesModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Arriendo' | 'Reserva'>('Todos');
  const [selectedComprobante, setSelectedComprobante] = useState<ComprobanteData | null>(null);

  const [arriendos, setArriendos] = useState<Arriendo[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [disfraces, setDisfraces] = useState<Disfraz[]>([]);

  useEffect(() => {
    setArriendos(StorageService.getArriendos());
    setReservas(StorageService.getReservas());
    setClientes(StorageService.getClientes());
    setDisfraces(StorageService.getDisfraces());
  }, []);

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const listaComprobantes: ComprobanteData[] = [];

  arriendos.forEach(arr => {
    const cliente = clientes.find(c => c.id === arr.clienteId);
    const disfraz = disfraces.find(d => d.id === arr.disfrazId);

    listaComprobantes.push({
      tipo: arr.estado === 'Devuelto' ? 'Devolucion' : 'Arriendo',
      folio: arr.id.toUpperCase().slice(-8),
      fechaEmision: arr.fechaRetiro,
      clienteNombre: cliente ? cliente.nombre : 'Cliente General',
      clienteTelefono: cliente ? cliente.telefono : '',
      clienteDireccion: cliente ? cliente.direccion : '',
      disfrazNombre: disfraz ? disfraz.nombre : 'Disfraz General',
      disfrazTalla: disfraz ? disfraz.talla : 'S/I',
      disfrazCategoria: disfraz ? disfraz.categoria : 'General',
      fechaInicio: arr.fechaRetiro,
      fechaFin: arr.fechaPactada,
      montoArriendo: arr.montoArriendo,
      montoGarantia: arr.montoGarantia,
      observaciones: arr.observaciones,
    });
  });

  reservas.forEach(res => {
    const cliente = clientes.find(c => c.id === res.clienteId);
    const disfraz = disfraces.find(d => d.id === res.disfrazId);

    listaComprobantes.push({
      tipo: 'Reserva',
      folio: res.id.toUpperCase().slice(-8),
      fechaEmision: res.fechaCreacion ? res.fechaCreacion.split('T')[0] : res.fechaInicio,
      clienteNombre: cliente ? cliente.nombre : 'Cliente General',
      clienteTelefono: cliente ? cliente.telefono : '',
      clienteDireccion: cliente ? cliente.direccion : '',
      disfrazNombre: disfraz ? disfraz.nombre : 'Disfraz General',
      disfrazTalla: disfraz ? disfraz.talla : 'S/I',
      disfrazCategoria: disfraz ? disfraz.categoria : 'General',
      fechaInicio: res.fechaInicio,
      fechaFin: res.fechaFin,
      montoArriendo: res.montoArriendo,
      montoAbono: res.montoAbono,
      montoGarantia: disfraz ? disfraz.garantiaSugerida : 10000,
      saldoPendiente: res.saldoPendiente,
      observaciones: res.observaciones,
    });
  });

  const comprobantesFiltrados = listaComprobantes.filter(c => {
    const matchesSearch =
      c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.disfrazNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.folio.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterTipo === 'Todos') return matchesSearch;
    if (filterTipo === 'Arriendo') return matchesSearch && (c.tipo === 'Arriendo' || c.tipo === 'Devolucion');
    if (filterTipo === 'Reserva') return matchesSearch && c.tipo === 'Reserva';
    return matchesSearch;
  });

  return (
    <div>
      <div className="module-header" style={{ marginBottom: '1.25rem' }}>
        <h1 className="module-title">Gestor de Comprobantes & Contratos</h1>
        <p className="module-desc">
          Consulta, imprime tickets térmicos o genera contratos legales PDF con firma digital para arriendos y reservas.
        </p>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem' }}>
            <Search size={18} color="var(--color-text-muted)" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: '0.2rem 0', minHeight: 'auto' }}
              placeholder="Buscar por cliente, disfraz o folio..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={16} color="var(--color-text-muted)" />
            <button
              type="button"
              className={`btn ${filterTipo === 'Todos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
              onClick={() => setFilterTipo('Todos')}
            >
              Todos ({listaComprobantes.length})
            </button>
            <button
              type="button"
              className={`btn ${filterTipo === 'Arriendo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
              onClick={() => setFilterTipo('Arriendo')}
            >
              Arriendos ({listaComprobantes.filter(c => c.tipo !== 'Reserva').length})
            </button>
            <button
              type="button"
              className={`btn ${filterTipo === 'Reserva' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
              onClick={() => setFilterTipo('Reserva')}
            >
              Reservas ({listaComprobantes.filter(c => c.tipo === 'Reserva').length})
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE COMPROBANTES */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {comprobantesFiltrados.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No se encontraron comprobantes emitidos.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Folio</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha Emisión</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cliente</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Disfraz</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Periodo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Monto</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {comprobantesFiltrados.map((comp, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '0.95rem' }}>#{comp.folio}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${comp.tipo === 'Reserva' ? 'badge-arrendado' : comp.tipo === 'Devolucion' ? 'badge-disponible' : 'badge-mantencion'}`}>
                        {comp.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{comp.fechaEmision}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong>{comp.clienteNombre}</strong>
                      {comp.clienteTelefono && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{comp.clienteTelefono}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>{comp.disfrazNombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Talla {comp.disfrazTalla}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{comp.fechaInicio} ➔ {comp.fechaFin}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong>{formatCLP(comp.montoArriendo)}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', minHeight: '34px', display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}
                        onClick={() => setSelectedComprobante(comp)}
                      >
                        <Printer size={14} />
                        <span>Ver Ticket / Contrato</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE RE-IMPRESIÓN */}
      {selectedComprobante && (
        <ComprobanteModal
          comprobante={selectedComprobante}
          onClose={() => setSelectedComprobante(null)}
        />
      )}
    </div>
  );
};
