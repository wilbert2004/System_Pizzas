import { crearServicioReportes } from "../../../base-datos/modulos/reportes/servicio.js";

export function registrarControladoresReportes(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioReportes(db, obtenerSesion);
  ipcMain.handle("reportes:resumen", (_evento, filtros) => servicio.obtenerResumen(filtros));
}
