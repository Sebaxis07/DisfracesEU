import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { Disfraz } from '../types';
import { Search, Plus, History, Wrench, CheckCircle, Shirt } from 'lucide-react';

interface InventarioModuleProps {
  onStateChanged: () => void;
}

export const InventarioModule: React.FC<InventarioModuleProps> = ({ onStateChanged }) => {
  const [disfraces, setDisfraces] = useState<Disfraz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const arriendos = StorageService.getArriendos();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos');

  const [selectedDisfraz, setSelectedDisfraz] = useState<Disfraz | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newNombre, setNewNombre] = useState<string>('');
  const [newCategoria, setNewCategoria] = useState<string>('Fiestas Patrias');
  const [newTalla, setNewTalla] = useState<string>('Talla 8');
  const [newPrecio, setNewPrecio] = useState<number>(10000);
  const [newGarantia, setNewGarantia] = useState<number>(10000);

  const loadData = async () => {
    setLoading(true);
    const data = await StorageService.fetchDisfracesAsync();
    setDisfraces(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const categorias = ['Todas', ...Array.from(new Set(disfraces.map(d => d.categoria)))];

  const filteredDisfraces = disfraces.filter(d => {
    const textMatch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || d.talla.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = categoriaFiltro === 'Todas' || d.categoria === categoriaFiltro;
    const estMatch = estadoFiltro === 'Todos' || d.estado === estadoFiltro;
    return textMatch && catMatch && estMatch;
  });

  const handleCreateDisfraz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre) return;

    setIsSaving(true);
    await StorageService.saveDisfrazAsync({
      nombre: newNombre,
      categoria: newCategoria,
      talla: newTalla,
      precioSugerido: newPrecio,
      garantiaSugerida: newGarantia,
      estado: 'Disponible',
    });

    setIsSaving(false);
    setIsAddModalOpen(false);
    setNewNombre('');
    await loadData();
    onStateChanged();
  };

  const handleCambiarEstado = async (disfrazId: string, nuevoEstado: Disfraz['estado']) => {
    await StorageService.updateEstadoDisfrazAsync(disfrazId, nuevoEstado);
    if (selectedDisfraz) {
      setSelectedDisfraz({ ...selectedDisfraz, estado: nuevoEstado });
    }
    await loadData();
    onStateChanged();
  };

  return (
    <div>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <h1 className="module-title">Inventario y Catálogo Central</h1>
          <p className="module-desc">Gestión completa del catálogo de disfraces en tiempo real.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Nuevo Disfraz</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--color-text-muted)" />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', padding: '0.5rem 0.85rem' }}
              placeholder="Buscar por nombre o talla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '340px' }}>
            <select
              className="form-select"
              style={{ padding: '0.5rem 0.65rem', flex: 1, fontSize: '0.85rem' }}
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>Cat: {cat}</option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ padding: '0.5rem 0.65rem', flex: 1, fontSize: '0.85rem' }}
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Arrendado">Arrendado</option>
              <option value="Mantencion">En Mantención</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
          Cargando disfraces desde Supabase PostgreSQL...
        </div>
      ) : disfraces.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-muted)' }}>
          <Shirt size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
            El catálogo está totalmente vacío en Supabase
          </h3>
          <p style={{ fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
            No hay disfraces creados aún. Haz clic a continuación para ingresar el primero.
          </p>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>Crear el Primer Disfraz</span>
          </button>
        </div>
      ) : filteredDisfraces.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
          <h3>No se encontraron disfraces con los filtros seleccionados</h3>
        </div>
      ) : (
        <div className="grid-3">
          {filteredDisfraces.map(disfraz => {
            const historialArriendos = arriendos.filter(a => a.disfrazId === disfraz.id);
            const ingresosTotales = historialArriendos.reduce((sum, a) => sum + (a.montoArriendo || 0), 0);

            let badgeClass = 'badge-disponible';
            if (disfraz.estado === 'Arrendado') badgeClass = 'badge-arrendado';
            if (disfraz.estado === 'Mantencion') badgeClass = 'badge-mantencion';

            return (
              <div
                key={disfraz.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onClick={() => setSelectedDisfraz(disfraz)}
              >
                <div>
                  <div style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    height: '140px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {disfraz.fotoUrl ? (
                      <img
                        src={disfraz.fotoUrl}
                        alt={disfraz.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Shirt size={48} style={{ opacity: 0.3, color: 'var(--color-text-muted)' }} />
                    )}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                      <span className={`badge ${badgeClass}`}>{disfraz.estado}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>{disfraz.nombre}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    {disfraz.talla} — {disfraz.categoria}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                  }}>
                    <span>Precio sugerido:</span>
                    <strong style={{ color: 'var(--color-primary-hover)' }}>${Number(disfraz.precioSugerido || 0).toLocaleString('es-CL')}</strong>
                  </div>
                </div>

                <div style={{
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)'
                }}>
                  <span>Historial: {historialArriendos.length} arriendos</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Recaudado: ${Number(ingresosTotales || 0).toLocaleString('es-CL')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer / Modal de Detalle de Disfraz */}
      {selectedDisfraz && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1.1rem', lineHeight: '1.3' }}>{selectedDisfraz.nombre}</h3>
              <button className="modal-close" onClick={() => setSelectedDisfraz(null)}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {selectedDisfraz.fotoUrl ? (
                    <img src={selectedDisfraz.fotoUrl} alt={selectedDisfraz.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Shirt size={40} style={{ opacity: 0.3 }} />
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Categoría: <strong>{selectedDisfraz.categoria}</strong></div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Talla: <strong>{selectedDisfraz.talla}</strong></div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    Estado actual: <strong style={{ color: 'var(--color-primary)' }}>{selectedDisfraz.estado}</strong>
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Precio Sugerido</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-hover)' }}>
                    ${Number(selectedDisfraz.precioSugerido || 0).toLocaleString('es-CL')} CLP
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Garantía Sugerida</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}>
                    ${Number(selectedDisfraz.garantiaSugerida || 0).toLocaleString('es-CL')} CLP
                  </div>
                </div>
              </div>

              {/* Cambiar Estado Rápido */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cambiar Estado de la Prenda:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    className={`btn ${selectedDisfraz.estado === 'Disponible' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', minHeight: '40px' }}
                    onClick={() => handleCambiarEstado(selectedDisfraz.id, 'Disponible')}
                  >
                    <CheckCircle size={14} /> Disponible
                  </button>

                  <button
                    className={`btn ${selectedDisfraz.estado === 'Mantencion' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', minHeight: '40px' }}
                    onClick={() => handleCambiarEstado(selectedDisfraz.id, 'Mantencion')}
                  >
                    <Wrench size={14} /> En Mantención
                  </button>
                </div>
              </div>

              {/* Historial de Arriendos de esta Prenda */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={16} />
                  <span>Historial de Arriendos ({arriendos.filter(a => a.disfrazId === selectedDisfraz.id).length})</span>
                </h4>

                {arriendos.filter(a => a.disfrazId === selectedDisfraz.id).length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>
                    Esta prenda aún no registra arriendos.
                  </div>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    {arriendos.filter(a => a.disfrazId === selectedDisfraz.id).map(a => (
                      <div key={a.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>Retiro: {a.fechaRetiro} | Entrega: {a.fechaPactada}</div>
                          <div style={{ color: 'var(--color-text-muted)' }}>Estado: {a.estado}</div>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--color-primary-hover)' }}>
                          ${Number(a.montoArriendo || 0).toLocaleString('es-CL')} CLP
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Nuevo Disfraz */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Agregar Nuevo Disfraz</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateDisfraz}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Nombre del Disfraz *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Princesa Bella Talla 6"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.88rem' }}
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                  >
                    <option value="Fiestas Patrias">Fiestas Patrias</option>
                    <option value="Halloween">Halloween</option>
                    <option value="Superhéroes">Superhéroes</option>
                    <option value="Princesas y Reyes">Princesas y Reyes</option>
                    <option value="Fantasía">Fantasía</option>
                    <option value="Oficios y Profesiones">Oficios y Profesiones</option>
                    <option value="Personajes Infantiles">Personajes Infantiles</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label">Talla</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Talla 6, M, L"
                    value={newTalla}
                    onChange={(e) => setNewTalla(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label">Precio Sugerido ($ CLP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newPrecio}
                    onChange={(e) => setNewPrecio(Number(e.target.value))}
                    step="1000"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label">Garantía Sugerida ($ CLP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newGarantia}
                    onChange={(e) => setNewGarantia(Number(e.target.value))}
                    step="1000"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar Disfraz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
