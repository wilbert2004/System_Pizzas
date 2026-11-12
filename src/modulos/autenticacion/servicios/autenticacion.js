const api = window.sistema;
export const servicioAutenticacion = {
  obtenerEstadoInicial() {
    return api.autenticacion.estadoInicial();
  },

  crearAdministrador(datos) {
    return api.autenticacion.crearAdministrador(datos);
  },

  iniciarSesion(datos) {
    return api.autenticacion.iniciarSesion(datos);
  },

  cerrarSesion() {
    return api.autenticacion.cerrarSesion();
  },

  obtenerSesion() {
    return api.autenticacion.obtenerSesion();
  },
};

export const servicioUsuarios = {
  listar() {
    return api.usuarios.listar();
  },

  crear(datos) {
    return api.usuarios.crear(datos);
  },

  actualizar(datos) {
    return api.usuarios.actualizar(datos);
  },

  cambiarContrasena(datos) {
    return api.usuarios.cambiarContrasena(datos);
  },

  cambiarEstado(datos) {
    return api.usuarios.cambiarEstado(datos);
  },
};
