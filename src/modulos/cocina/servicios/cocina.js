const API = () => {
  if (!window.sistema?.pedidos) {
    throw new Error("El servicio de Pedidos no está disponible.");
  }

  return window.sistema.pedidos;
};

const ESTADOS_COCINA = ["Nuevo", "Preparando", "En horno", "Listo"];

export const servicioCocina = {
  async listarPedidos() {
    const api = API();
    const pedidos = await api.listar({ limite: 200 });

    if (!Array.isArray(pedidos)) {
      return [];
    }

    const pedidosCocina = pedidos
      .filter((pedido) => ESTADOS_COCINA.includes(pedido.estado))
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_creacion || 0).getTime();
        const fechaB = new Date(b.fecha_creacion || 0).getTime();
        return fechaA - fechaB;
      });

    const detallesPedidos = await Promise.all(
      pedidosCocina.map(async (pedido) => {
        const detalle = await api.obtener(pedido.id);
        if (!detalle) return null;
        const productosPreparados = (detalle.detalles || []).filter(
          (producto) =>
            producto.requiere_preparacion !== 0 &&
            producto.requiere_preparacion !== false,
        );
        if (productosPreparados.length === 0) return null;
        return { ...detalle, detalles: productosPreparados };
      }),
    );

    return detallesPedidos.filter(Boolean);
  },

  async obtenerPedido(id) {
    const pedido = await API().obtener(id);
    if (!pedido) return pedido;

    const productosPreparados = (pedido.detalles || []).filter(
      (producto) =>
        producto.requiere_preparacion !== 0 &&
        producto.requiere_preparacion !== false,
    );

    return { ...pedido, detalles: productosPreparados };
  },

  async cambiarEstado(id, estado, motivo = null, tiempoEstimadoMinutos = null) {
    return API().cambiarEstado(id, estado, motivo, tiempoEstimadoMinutos);
  },

  async obtenerResumen() {
    return API().resumen();
  },
};
