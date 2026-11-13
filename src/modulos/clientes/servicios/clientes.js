const api = () => {
  if (!window.sistema?.clientes) {
    throw new Error("El servicio de clientes no está disponible.");
  }

  return window.sistema.clientes;
};

export const servicioClientes = {
  listar: (filtros = {}) => api().listar(filtros),
  obtener: (id) => api().obtener(id),
  crear: (datos) => api().crear(datos),
  actualizar: (id, datos) => api().actualizar(id, datos),
  cambiarEstado: (id, activo) => api().cambiarEstado(id, activo),
  obtenerHistorial: (id) => api().obtenerHistorial(id),
};
