import { crearServicioLicencias } from "../../../licencias/servicio.js";

export function registrarControladoresLicencias(ipcMain, obtenerSesion) {
  const servicio = crearServicioLicencias(obtenerSesion);
  ipcMain.handle("licencias:estado", () => servicio.estado());
  ipcMain.handle("licencias:activar", (_evento, datos) => servicio.activar(datos));
  return servicio;
}
