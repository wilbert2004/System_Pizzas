const obtenerAPI = () => {
  if (!window.sistema) {
    throw new Error("La API del sistema no está disponible.");
  }

  return window.sistema;
};

export const servicioTelevision = {
  async listarPedidos() {
    const api = obtenerAPI();
    const pedidos = await api.pedidos.listar({
      limite: 200,
    });

    if (!Array.isArray(pedidos)) return [];

    const pedidosEnPantalla = pedidos.filter((pedido) =>
      ["Preparando", "En horno", "Listo"].includes(pedido.estado),
    );

    const pedidosConResumen = await Promise.all(
      pedidosEnPantalla.map(async (pedido) => {
        try {
          const detalle = await api.pedidos.obtener(pedido.id);
          if (!detalle) return null;

          const productos = (detalle.detalles || [])
            .filter(
              (producto) =>
                producto.requiere_preparacion !== 0 &&
                producto.requiere_preparacion !== false,
            )
            .map((producto) => ({
              cantidad: producto.cantidad,
              nombre: producto.nombre_producto,
              presentacion: producto.nombre_presentacion,
            }));

          // Los pedidos de solo bebidas o botanas quedan listos inmediatamente
          // y no necesitan ocupar espacio en la pantalla pública.
          if (productos.length === 0) return null;

          return { ...pedido, productosTV: productos };
        } catch {
          return null;
        }
      }),
    );

    return pedidosConResumen.filter(Boolean);
  },

  async listarPublicidad() {
    return obtenerAPI().television?.listarMultimedia?.() || [];
  },

  async crearPublicidad(datos) {
    return obtenerAPI().television.crearMultimedia(datos);
  },

  async actualizarPublicidad(id, datos) {
    return obtenerAPI().television.actualizarMultimedia(id, datos);
  },

  async cambiarEstadoPublicidad(id, activo) {
    return obtenerAPI().television.cambiarEstadoMultimedia(id, activo);
  },

  async eliminarPublicidad(id) {
    return obtenerAPI().television.eliminarMultimedia(id);
  },

  async obtenerMusica() {
    return obtenerAPI().television.obtenerMusica();
  },

  async guardarMusica(archivo) {
    return obtenerAPI().television.guardarMusica(archivo);
  },

  async guardarVolumenMusica(volumen) {
    return obtenerAPI().television.guardarVolumenMusica(volumen);
  },

  async quitarMusica() {
    return obtenerAPI().television.quitarMusica();
  },

  async listarPantallas() {
    return obtenerAPI().television.listarPantallas();
  },

  async abrirVentanaTV(displayId) {
    return obtenerAPI().television.abrirVentana(displayId);
  },

  async cerrarVentanaTV() {
    return obtenerAPI().television.cerrarVentana();
  },
};
