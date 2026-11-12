import { crearServicioAutenticacion } from "../../../base-datos/modulos/autenticacion/servicio.js";

export function registrarControladoresAutenticacion(ipcMain, db) {
  const servicio = crearServicioAutenticacion(db);

  ipcMain.handle("autenticacion:estado-inicial", () => {
    return servicio.obtenerEstadoInicial();
  });

  ipcMain.handle("autenticacion:crear-administrador", (_, datos) => {
    return servicio.crearAdministradorInicial(datos);
  });

  ipcMain.handle("autenticacion:iniciar-sesion", (_, datos) => {
    return servicio.iniciarSesion(datos);
  });

  ipcMain.handle("autenticacion:cerrar-sesion", () => {
    return servicio.cerrarSesion();
  });

  ipcMain.handle("autenticacion:obtener-sesion", () => {
    return servicio.obtenerSesion();
  });

  ipcMain.handle("usuarios:listar", () => {
    return servicio.listarUsuarios();
  });

  ipcMain.handle("usuarios:crear", (_, datos) => {
    return servicio.crearUsuario(datos);
  });

  ipcMain.handle("usuarios:actualizar", (_, datos) => {
    return servicio.actualizarUsuario(datos);
  });

  ipcMain.handle("usuarios:cambiar-contrasena", (_, datos) => {
    return servicio.cambiarContrasena(datos);
  });

  ipcMain.handle("usuarios:cambiar-estado", (_, datos) => {
    return servicio.cambiarEstado(datos);
  });
}
