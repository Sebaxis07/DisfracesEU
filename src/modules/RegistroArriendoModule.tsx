import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import type { Cliente, Disfraz } from '../types';
import { User, Camera, Upload, Trash2, CheckCircle2, Shirt, PlusCircle } from 'lucide-react';

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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPrendaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  // Referencia de prenda seleccionada
  const selectedDisfrazObj = disfraces.find(d => d.id === selectedDisfrazId);

  return (
    <div>
      <div className="module-header" style={{ marginBottom: '1.25rem' }}>
        <h1 className="module-title">Registro Rápido de Arriendo</h1>
        <p className="module-desc">Registra sobre la marcha una prenda inédita o vincula una existente con respaldo fotográfico real.</p>
      </div>

      {/* INPUTS DE CÁMARA Y ARCHIVOS OCULTOS */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <form onSubmit={handleSubmitArriendo}>
        <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* PASO 1: CLIENTE */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>1</div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Identificación del Cliente</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Busca en la base de datos o crea uno en el instante</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  className={`btn ${!isNewCliente ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }}
                  onClick={() => { setIsNewCliente(false); setSelectedClienteId(''); setSearchClienteTerm(''); }}
                >
                  <User size={16} /> Buscar Existente
                </button>
                <button
                  type="button"
                  className={`btn ${isNewCliente ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }}
                  onClick={() => { setIsNewCliente(true); setSelectedClienteId(''); }}
                >
                  <User size={16} /> + Nuevo Cliente
                </button>
              </div>

              {!isNewCliente ? (
                <div className="form-group" style={{ position: 'relative', margin: 0 }}>
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
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      zIndex: 50,
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {filteredClientes.length === 0 ? (
                        <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          No se encontró ningún cliente registrado.
                        </div>
                      ) : (
                        filteredClientes.map(c => (
                          <div
                            key={c.id}
                            className="search-result-item"
                            style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                            onClick={() => handleClienteSelect(c)}
                          >
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{c.nombre}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📱 {c.telefono}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {selectedClienteId && (
                    <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.85rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} /> Cliente seleccionado correctamente.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
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

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Teléfono (WhatsApp)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+56 9 1234 5678"
                      value={newClienteTelefono}
                      onChange={(e) => setNewClienteTelefono(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Dirección (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Av. Principal 123, Santiago"
                      value={newClienteDireccion}
                      onChange={(e) => setNewClienteDireccion(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PASO 2: SELECCIÓN DE PRENDA */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>2</div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Selección de la Prenda</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Elige del inventario disponible o añade una prenda nueva</span>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Disfraz Disponible *</label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                    onClick={() => setIsNewDisfrazModal(true)}
                  >
                    <PlusCircle size={14} /> + Registrar Prenda Inédita
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

              {selectedDisfrazObj && (
                <div style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '1rem',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shirt size={18} color="var(--color-primary)" />
                    <span>{selectedDisfrazObj.nombre}</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Categoría: <strong>{selectedDisfrazObj.categoria}</strong> | Talla: <strong>{selectedDisfrazObj.talla}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: 'var(--color-primary-hover)', fontWeight: 700 }}>
                    Precio sugerido: ${selectedDisfrazObj.precioSugerido.toLocaleString('es-CL')} CLP | Garantía sugerida: ${selectedDisfrazObj.garantiaSugerida.toLocaleString('es-CL')} CLP
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PASO 3: CONDICIONES, FECHAS Y RESPALDO FOTOGRÁFICO */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}>3</div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Condiciones, Fechas y Respaldo Fotográfico</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Configura montos, plazo pactado y captura fotos reales de entrega</span>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Fecha Pactada de Devolución *</label>
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }} onClick={() => handleQuickDays(1)}>+1 Día</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }} onClick={() => handleQuickDays(2)}>+2 Días</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }} onClick={() => handleQuickDays(3)}>+3 Días</button>
              </div>
              <input
                type="date"
                className="form-input"
                value={fechaPactada}
                onChange={(e) => setFechaPactada(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
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

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Monto Garantía ($ CLP) *</label>
              <input
                type="number"
                className="form-input"
                value={aplicaGarantia ? montoGarantia : 0}
                onChange={(e) => setMontoGarantia(Number(e.target.value))}
                disabled={!aplicaGarantia}
                step="1000"
              />
              <span className="form-hint">Dinero en custodia a devolver al entregar.</span>
            </div>
          </div>

          <div className="switch-container" style={{ margin: '0 0 1.25rem 0', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div className="switch-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Exigir Depósito de Garantía</div>
              <div className="switch-subtext">Custodia contable independiente del arriendo ($10.000 habitual)</div>
            </div>
            <input
              type="checkbox"
              className="switch-input"
              checked={aplicaGarantia}
              onChange={(e) => setAplicaGarantia(e.target.checked)}
            />
          </div>

          <div className="grid-2" style={{ gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Observaciones o Accesorios Incluidos</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ej: Incluye sombrero, capa roja y varita mágica. Entregado sin manchas."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            {/* SECCIÓN RESPALDO FOTOGRÁFICO REAL */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Respaldo Fotográfico de la Prenda</label>
              
              {!fotoPrendaUrl ? (
                <div style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Captura o sube una fotografía del estado inicial de la prenda
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera size={16} /> 📷 Abrir Cámara
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} /> 📁 Subir Imagen
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <img
                    src={fotoPrendaUrl}
                    alt="Respaldo prenda"
                    style={{
                      width: '70px',
                      height: '70px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={16} /> Foto Adjuntada Correctamente
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      Esta imagen quedará guardada en el contrato y comprobante.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setFotoPrendaUrl(undefined)}
                    title="Eliminar foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTÓN FINAL DE CONFIRMACIÓN */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 800, minHeight: '48px' }}
          >
            <CheckCircle2 size={20} />
            <span>{isSubmitting ? 'Procesando Arriendo...' : 'Confirmar y Registrar Arriendo'}</span>
          </button>
        </div>
      </form>

      {/* MODAL REGISTRAR PRENDA INÉDITA */}
      {isNewDisfrazModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Prenda Inédita</h3>
              <button className="modal-close" onClick={() => setIsNewDisfrazModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateFastDisfraz} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nombre del Disfraz / Prenda *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Traje Spiderman Infantil"
                  value={newDisfrazNombre}
                  onChange={(e) => setNewDisfrazNombre(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2" style={{ margin: 0, gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={newDisfrazCategoria}
                    onChange={(e) => setNewDisfrazCategoria(e.target.value)}
                  >
                    <option value="Fiestas Patrias">Fiestas Patrias</option>
                    <option value="Halloween">Halloween</option>
                    <option value="Superhéroes">Superhéroes</option>
                    <option value="Cuentos / Infantiles">Cuentos / Infantiles</option>
                    <option value="Tradicional">Tradicional</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Talla</label>
                  <select
                    className="form-select"
                    value={newDisfrazTalla}
                    onChange={(e) => setNewDisfrazTalla(e.target.value)}
                  >
                    <option value="Talla 4">Talla 4</option>
                    <option value="Talla 6">Talla 6</option>
                    <option value="Talla 8">Talla 8</option>
                    <option value="Talla 10">Talla 10</option>
                    <option value="Talla 12">Talla 12</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ margin: 0, gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Precio Sugerido ($ CLP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newDisfrazPrecio}
                    onChange={(e) => setNewDisfrazPrecio(Number(e.target.value))}
                    step="1000"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
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

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewDisfrazModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar y Seleccionar Prenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
