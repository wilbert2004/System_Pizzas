function obtenerAPI() {
  if (!window.sistema?.pedidos) {
    throw new Error("El servicio de pedidos no está disponible.");
  }

  return window.sistema.pedidos;
}

export const servicioPedidos = {
  listar: (filtros = {}) => obtenerAPI().listar(filtros),

  obtener: (id) => obtenerAPI().obtener(id),

  cambiarEstado: (id, estado, motivo = "") =>
    obtenerAPI().cambiarEstado(id, estado, motivo),

  resumen: () => obtenerAPI().resumen(),
};
