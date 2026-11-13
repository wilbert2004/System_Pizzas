import { crearServicioCaja } from "../../../base-datos/modulos/caja/servicio.js";

export function registrarControladoresCaja(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioCaja(db, obtenerSesion);
  ipcMain.handle("caja:estado", () => servicio.obtenerEstado());
  ipcMain.handle("caja:validar-cierre", () => servicio.obtenerBloqueosCierre());
  ipcMain.handle("caja:abrir", (_evento, datos) => servicio.abrir(datos));
  ipcMain.handle("caja:registrar-pago", (_evento, datos) => servicio.registrarPago(datos));
  ipcMain.handle("caja:registrar-movimiento", (_evento, datos) => servicio.registrarMovimiento(datos));
  ipcMain.handle("caja:cerrar", (_evento, datos) => servicio.cerrar(datos));
}
