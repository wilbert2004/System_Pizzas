import { crearServicioClientes } from "../../../base-datos/modulos/clientes/servicio.js";

export function registrarControladoresClientes(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioClientes(db, obtenerSesion);

  ipcMain.handle("clientes:listar", (_evento, filtros) => {
    return servicio.listar(filtros);
  });

  ipcMain.handle("clientes:obtener", (_evento, id) => {
    return servicio.obtenerPorId(id);
  });

  ipcMain.handle("clientes:crear", (_evento, datos) => {
    return servicio.crear(datos);
  });

  ipcMain.handle("clientes:actualizar", (_evento, id, datos) => {
    return servicio.actualizar(id, datos);
  });

  ipcMain.handle("clientes:cambiar-estado", (_evento, id, activo) => {
    return servicio.cambiarEstado(id, activo);
  });

  ipcMain.handle("clientes:historial", (_evento, id) => {
    return servicio.obtenerHistorial(id);
  });

  return servicio;
}
