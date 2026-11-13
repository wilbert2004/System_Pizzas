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

    return Promise.all(
      pedidosCocina.map(async (pedido) => {
        const detalle = await api.obtener(pedido.id);
        return detalle || pedido;
      }),
    );
  },

  async obtenerPedido(id) {
    return API().obtener(id);
  },

  async cambiarEstado(id, estado, motivo = null) {
    return API().cambiarEstado(id, estado, motivo);
  },

  async obtenerResumen() {
    return API().resumen();
  },
};
