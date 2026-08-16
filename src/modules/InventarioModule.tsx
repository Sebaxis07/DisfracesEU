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
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="module-title">Inventario y Catálogo Central</h1>
          <p className="module-desc">Gestión completa del catálogo de disfraces conectado en tiempo real con Supabase PostgreSQL.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Nuevo Disfraz</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              className="form-select"
              style={{ padding: '0.5rem 0.85rem' }}
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>Cat: {cat}</option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ padding: '0.5rem 0.85rem' }}
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
            const ingresosTotales = historialArriendos.reduce((sum, a) => sum + a.montoArriendo, 0);

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
                    <strong style={{ color: 'var(--color-primary-hover)' }}>${disfraz.precioSugerido.toLocaleString('es-CL')}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>{historialArriendos.length} arriendos realizados</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>Total: ${ingresosTotales.toLocaleString('es-CL')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDisfraz && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Ficha de Detalle del Disfraz</h3>
              <button className="modal-close" onClick={() => setSelectedDisfraz(null)}>&times;</button>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'center' }}>
              {selectedDisfraz.fotoUrl ? (
                <img
                  src={selectedDisfraz.fotoUrl}
                  alt={selectedDisfraz.nombre}
                  style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
              ) : (
                <div style={{ width: '96px', height: '96px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shirt size={40} style={{ opacity: 0.3 }} />
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedDisfraz.nombre}</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  Categoría: {selectedDisfraz.categoria} | Talla: {selectedDisfraz.talla}
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Estado Actual:</span>
                  <span className={`badge ${selectedDisfraz.estado === 'Disponible' ? 'badge-disponible' : selectedDisfraz.estado === 'Arrendado' ? 'badge-arrendado' : 'badge-mantencion'}`}>
                    {selectedDisfraz.estado}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cambiar Estado Manual:</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleCambiarEstado(selectedDisfraz.id, 'Disponible')}
                  disabled={selectedDisfraz.estado === 'Disponible'}
                >
                  <CheckCircle size={14} /> Marcar Disponible
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleCambiarEstado(selectedDisfraz.id, 'Mantencion')}
                  disabled={selectedDisfraz.estado === 'Mantencion'}
                >
                  <Wrench size={14} /> Enviar a Mantención / Lavandería
                </button>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={18} color="var(--color-primary)" />
              <span>Historial Acumulado de Arriendos</span>
            </h4>

            {arriendos.filter(a => a.disfrazId === selectedDisfraz.id).length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Este disfraz aún no registra arriendos.
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
                      ${a.montoArriendo.toLocaleString('es-CL')} CLP
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nuevo Disfraz a Supabase</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateDisfraz}>
              <div className="form-group">
                <label className="form-label">Nombre del Disfraz *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Princesa Bella"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
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

                <div className="form-group">
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

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Precio Sugerido ($ CLP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newPrecio}
                    onChange={(e) => setNewPrecio(Number(e.target.value))}
                    step="1000"
                  />
                </div>

                <div className="form-group">
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

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSaving}>
                  {isSaving ? 'Guardando en Supabase...' : 'Guardar Disfraz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
