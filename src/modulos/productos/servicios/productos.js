const api = window.sistema.productos;

export const servicioProductos = {
  listar: () => api.listar(),
  listarTodos: () => api.listarTodos(),
  obtener: (id) => api.obtener(id),
  crear: (datos) => api.crear(datos),
  actualizar: (datos) => api.actualizar(datos),
  cambiarEstado: (datos) => api.cambiarEstado(datos),

  listarCategorias: () => api.categorias.listar(),
  listarTodasCategorias: () => api.categorias.listarTodas(),
  crearCategoria: (datos) => api.categorias.crear(datos),
  actualizarCategoria: (datos) => api.categorias.actualizar(datos),
  cambiarEstadoCategoria: (datos) => api.categorias.cambiarEstado(datos),

  listarPresentaciones: (id) => api.presentaciones.listar(id),
  crearPresentacion: (datos) => api.presentaciones.crear(datos),
  actualizarPresentacion: (datos) => api.presentaciones.actualizar(datos),
  cambiarEstadoPresentacion: (datos) => api.presentaciones.cambiarEstado(datos),

  listarAdicionales: () => api.adicionales.listar(),
  listarTodosAdicionales: () => api.adicionales.listarTodos(),
  crearAdicional: (datos) => api.adicionales.crear(datos),
  actualizarAdicional: (datos) => api.adicionales.actualizar(datos),
  cambiarEstadoAdicional: (datos) => api.adicionales.cambiarEstado(datos),
  asignarAdicionales: (datos) => api.adicionales.asignar(datos),
};
