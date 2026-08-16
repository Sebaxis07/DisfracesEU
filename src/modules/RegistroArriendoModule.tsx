import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { Cliente, Disfraz } from '../types';
import { User, Camera, CheckCircle2 } from 'lucide-react';

interface RegistroArriendoProps {
  onArriendoCreated: () => void;
}

export const RegistroArriendoModule: React.FC<RegistroArriendoProps> = ({ onArriendoCreated }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [disfraces, setDisfraces] = useState<Disfraz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [searchClienteTerm, setSearchClienteTerm] = useState<string>('');
  const [isNewCliente, setIsNewCliente] = useState<boolean>(false);
  const [newClienteNombre, setNewClienteNombre] = useState<string>('');
  const [newClienteTelefono, setNewClienteTelefono] = useState<string>('');
  const [newClienteDireccion, setNewClienteDireccion] = useState<string>('');

  const [selectedDisfrazId, setSelectedDisfrazId] = useState<string>('');
  const [isNewDisfrazModal, setIsNewDisfrazModal] = useState<boolean>(false);
  const [newDisfrazNombre, setNewDisfrazNombre] = useState<string>('');
  const [newDisfrazCategoria, setNewDisfrazCategoria] = useState<string>('Fiestas Patrias');
  const [newDisfrazTalla, setNewDisfrazTalla] = useState<string>('Talla 8');
  const [newDisfrazPrecio, setNewDisfrazPrecio] = useState<number>(10000);
  const [newDisfrazGarantia, setNewDisfrazGarantia] = useState<number>(10000);

  const [montoArriendo, setMontoArriendo] = useState<number>(10000);
  const [aplicaGarantia, setAplicaGarantia] = useState<boolean>(true);
  const [montoGarantia, setMontoGarantia] = useState<number>(10000);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];
  const [fechaPactada, setFechaPactada] = useState<string>(defaultDateStr);
  const [observaciones, setObservaciones] = useState<string>('');
  const [fotoPrendaUrl, setFotoPrendaUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    const [cData, dData] = await Promise.all([
      StorageService.fetchClientesAsync(),
      StorageService.fetchDisfracesAsync(),
    ]);
    setClientes(cData);
    setDisfraces(dData.filter(d => d.estado === 'Disponible'));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
    c.telefono.includes(searchClienteTerm)
  );

  const handleClienteSelect = (c: Cliente) => {
    setSelectedClienteId(c.id);
    setSearchClienteTerm(c.nombre);
  };

  const handleDisfrazSelect = (disfrazId: string) => {
    setSelectedDisfrazId(disfrazId);
    const d = disfraces.find(item => item.id === disfrazId);
    if (d) {
      setMontoArriendo(d.precioSugerido);
      setMontoGarantia(d.garantiaSugerida);
    }
  };

  const handleQuickDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFechaPactada(d.toISOString().split('T')[0]);
  };

  const handleCreateFastDisfraz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisfrazNombre) return;

    const nuevoD = await StorageService.saveDisfrazAsync({
      nombre: newDisfrazNombre,
      categoria: newDisfrazCategoria,
      talla: newDisfrazTalla,
      precioSugerido: newDisfrazPrecio,
      garantiaSugerida: newDisfrazGarantia,
      estado: 'Disponible',
    });

    await loadData();
    setSelectedDisfrazId(nuevoD.id);
    setMontoArriendo(nuevoD.precioSugerido);
    setMontoGarantia(nuevoD.garantiaSugerida);
    setIsNewDisfrazModal(false);
    setNewDisfrazNombre('');
  };

  const handleSimularCamara = () => {
    setFotoPrendaUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80');
  };

  const handleSubmitArriendo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let clienteFinalId = selectedClienteId;

    if (isNewCliente && newClienteNombre) {
      const nuevoC = await StorageService.saveClienteAsync({
        nombre: newClienteNombre,
        telefono: newClienteTelefono || 'Sin teléfono',
        direccion: newClienteDireccion || '',
        notas: 'Registrado en checkout',
      });
      clienteFinalId = nuevoC.id;
    }

    if (!clienteFinalId || !selectedDisfrazId) {
      alert('Por favor selecciona un cliente y un disfraz.');
      setIsSubmitting(false);
      return;
    }

    const hoyStr = new Date().toISOString().split('T')[0];
    await StorageService.saveArriendoAsync({
      clienteId: clienteFinalId,
      disfrazId: selectedDisfrazId,
      fechaRetiro: hoyStr,
      fechaPactada,
      montoArriendo,
      aplicaGarantia,
      montoGarantia: aplicaGarantia ? montoGarantia : 0,
      estado: 'Activo',
      fotoEntrega: fotoPrendaUrl,
      observaciones,
    });

    setIsSubmitting(false);
    onArriendoCreated();
  };

  return (
    <div>
      <div className="module-header">
        <h1 className="module-title">Registro Rápido de Arriendo</h1>
        <p className="module-desc">Registra sobre la marcha una prenda inédita o vincula una existente con custodia transparente de dinero.</p>
      </div>

      <form onSubmit={handleSubmitArriendo}>
        <div className="grid-2">
          {/* PASO 1: CLIENTE */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}>1</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Identificación del Cliente</h2>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn ${!isNewCliente ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => { setIsNewCliente(false); setSelectedClienteId(''); setSearchClienteTerm(''); }}
              >
                <User size={16} /> Buscar Existente
              </button>
              <button
                type="button"
                className={`btn ${isNewCliente ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => { setIsNewCliente(true); setSelectedClienteId(''); }}
              >
                <User size={16} /> + Nuevo Cliente
              </button>
            </div>

            {!isNewCliente ? (
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Buscar por Nombre o Teléfono</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Escribe para buscar..."
                  value={searchClienteTerm}
                  onChange={(e) => {
                    setSearchClienteTerm(e.target.value);
                    setSelectedClienteId('');
                  }}
                />
                {searchClienteTerm && !selectedClienteId && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    {filteredClientes.length === 0 ? (
                      <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        No se encontró ningún cliente.
                      </div>
                    ) : (
                      filteredClientes.map(c => (
                        <div
                          key={c.id}
                          style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                          onClick={() => handleClienteSelect(c)}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.nombre}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.telefono}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {selectedClienteId && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Cliente seleccionado correctamente.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Ana María Torres"
                    value={newClienteNombre}
                    onChange={(e) => setNewClienteNombre(e.target.value)}
                    required={isNewCliente}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono (WhatsApp)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+56 9 1234 5678"
                    value={newClienteTelefono}
                    onChange={(e) => setNewClienteTelefono(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Av. Principal 123"
                    value={newClienteDireccion}
                    onChange={(e) => setNewClienteDireccion(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* PASO 2: SELECCIÓN DE PRENDA */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}>2</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Selección de la Prenda</h2>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label className="form-label">Disfraz Disponible *</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                  onClick={() => setIsNewDisfrazModal(true)}
                >
                  + Registrar Prenda Inédita
                </button>
              </div>

              <select
                className="form-select"
                value={selectedDisfrazId}
                onChange={(e) => handleDisfrazSelect(e.target.value)}
                required
              >
                <option value="">{loading ? '-- Cargando prendas de Supabase... --' : '-- Seleccionar de inventario disponible --'}</option>
                {disfraces.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.talla} - {d.categoria}) - ${d.precioSugerido.toLocaleString('es-CL')} CLP
                  </option>
                ))}
              </select>
            </div>

            {selectedDisfrazId && (
              <div style={{
                padding: '0.85rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: '1rem',
                border: '1px solid var(--color-border)'
              }}>
                {(() => {
                  const d = disfraces.find(item => item.id === selectedDisfrazId);
                  if (!d) return null;
                  return (
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{d.nombre}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        Categoría: {d.categoria} | Talla: {d.talla}
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: 'var(--color-primary-hover)', fontWeight: 700 }}>
                        Precio sugerido: ${d.precioSugerido.toLocaleString('es-CL')} CLP | Garantía sugerida: ${d.garantiaSugerida.toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* PASO 3: REGISTRO Y GARANTÍA */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>3</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Condiciones, Fechas y Custodia de Garantía</h2>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Fecha Pactada de Devolución *</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem' }} onClick={() => handleQuickDays(1)}>+1 Día</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem' }} onClick={() => handleQuickDays(2)}>+2 Días</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem' }} onClick={() => handleQuickDays(3)}>+3 Días</button>
              </div>
              <input
                type="date"
                className="form-input"
                value={fechaPactada}
                onChange={(e) => setFechaPactada(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monto Arriendo ($ CLP) *</label>
              <input
                type="number"
                className="form-input"
                value={montoArriendo}
                onChange={(e) => setMontoArriendo(Number(e.target.value))}
                required
                step="1000"
              />
              <span className="form-hint">Ingreso genuino del negocio.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Monto Garantía ($ CLP) *</label>
              <input
                type="number"
                className="form-input"
                value={aplicaGarantia ? montoGarantia : 0}
                onChange={(e) => setMontoGarantia(Number(e.target.value))}
                disabled={!aplicaGarantia}
                step="1000"
              />
              <span className="form-hint">Dinero en custodia a devolver.</span>
            </div>
          </div>

          <div className="switch-container" style={{ margin: '1rem 0' }}>
            <div>
              <div className="switch-label">Exigir Depósito de Garantía</div>
              <div className="switch-subtext">Custodia contable independiente del arriendo ($10.000 habitual)</div>
            </div>
            <input
              type="checkbox"
              className="switch-input"
              checked={aplicaGarantia}
              onChange={(e) => setAplicaGarantia(e.target.checked)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Observaciones o Accesorios Inclusos</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Incluye sombrero y varita mágica"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label className="form-label">Respaldo Fotográfico (Estado Prenda)</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 600 }}
                  onClick={handleSimularCamara}
                >
                  <Camera size={14} /> Foto Prenda
                </button>
              </div>
              {fotoPrendaUrl && (
                <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                  ✓ Foto de entrega adjuntada correctamente.
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
              disabled={isSubmitting}
            >
              <CheckCircle2 size={20} />
              <span>{isSubmitting ? 'Registrando en Supabase...' : 'Confirmar y Registrar Arriendo'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Modal Registrar Prenda Inédita */}
      {isNewDisfrazModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Prenda Inédita sobre la Marcha</h3>
              <button className="modal-close" onClick={() => setIsNewDisfrazModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateFastDisfraz}>
              <div className="form-group">
                <label className="form-label">Nombre del Disfraz *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Spiderman de Lujo"
                  value={newDisfrazNombre}
                  onChange={(e) => setNewDisfrazNombre(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={newDisfrazCategoria}
                    onChange={(e) => setNewDisfrazCategoria(e.target.value)}
                  >
                    <option value="Fiestas Patrias">Fiestas Patrias</option>
                    <option value="Halloween">Halloween</option>
                    <option value="Superhéroes">Superhéroes</option>
                    <option value="Princesas y Reyes">Princesas y Reyes</option>
                    <option value="Fantasía">Fantasía</option>
                    <option value="Oficios y Profesiones">Oficios y Profesiones</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Talla</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Talla 8, M, L"
                    value={newDisfrazTalla}
                    onChange={(e) => setNewDisfrazTalla(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Precio Sugerido ($ CLP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newDisfrazPrecio}
                    onChange={(e) => setNewDisfrazPrecio(Number(e.target.value))}
                    step="1000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Garantía Sugerida ($ CLP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newDisfrazGarantia}
                    onChange={(e) => setNewDisfrazGarantia(Number(e.target.value))}
                    step="1000"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsNewDisfrazModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
