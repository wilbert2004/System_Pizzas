const obtenerAPI = () => {
  if (!window.sistema) {
    throw new Error("La API del sistema no está disponible.");
  }

  return window.sistema;
};

export const servicioTelevision = {
  async listarPedidos() {
    const pedidos = await obtenerAPI().pedidos.listar({
      limite: 200,
    });

    if (!Array.isArray(pedidos)) return [];

    return pedidos.filter((pedido) =>
      ["Preparando", "En horno", "Listo"].includes(pedido.estado),
    );
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
