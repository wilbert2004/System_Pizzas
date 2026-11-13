import { dialog, BrowserWindow, app } from "electron";
import { crearServicioRespaldos } from "../../../base-datos/modulos/respaldos/servicio.js";

export function registrarControladoresRespaldos(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioRespaldos(db, obtenerSesion);
  ipcMain.handle("respaldos:listar", () => servicio.listar());
  ipcMain.handle("respaldos:configurar", (_evento, datos) => servicio.configurar(datos));
  ipcMain.handle("respaldos:crear", () => servicio.crear("manual"));
  ipcMain.handle("respaldos:seleccionar-carpeta", async (evento) => {
    if (obtenerSesion()?.rol !== "administrador") throw new Error("Solo un administrador puede elegir la carpeta de respaldos.");
    const opciones = { defaultPath: app.getPath("documents"), properties: ["openDirectory", "createDirectory"] };
    const ventana = BrowserWindow.fromWebContents(evento.sender);
    const { canceled, filePaths } = ventana ? await dialog.showOpenDialog(ventana, opciones) : await dialog.showOpenDialog(opciones);
    return canceled ? null : filePaths[0];
  });
  return servicio;
}
