import { crearServicioConfiguracion } from "../../../base-datos/modulos/configuracion/servicio.js";
import { BrowserWindow, dialog } from "electron";
import { copyFile, mkdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { app } from "electron";

export function registrarControladoresConfiguracion(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioConfiguracion(db, obtenerSesion);
  ipcMain.handle("configuracion:listar", () => servicio.listar());
  ipcMain.handle("configuracion:publica", () => servicio.publica());
  ipcMain.handle("configuracion:seleccionar-logotipo", async (evento) => {
    if (obtenerSesion()?.rol !== "administrador") throw new Error("Solo un administrador puede cambiar el logotipo.");
    const ventana = BrowserWindow.fromWebContents(evento.sender);
    const opciones = { title: "Seleccionar logotipo del negocio", properties: ["openFile"], filters: [{ name: "Imágenes", extensions: ["png", "jpg", "jpeg", "webp"] }] };
    const { canceled, filePaths } = ventana ? await dialog.showOpenDialog(ventana, opciones) : await dialog.showOpenDialog(opciones);
    if (canceled || !filePaths[0]) return null;
    const origen = filePaths[0];
    const extension = extname(origen).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) throw new Error("Elige una imagen PNG, JPG o WebP.");
    const carpeta = join(app.getPath("userData"), "marca");
    await mkdir(carpeta, { recursive: true });
    const ruta = join(carpeta, `${randomUUID()}-${basename(origen).replace(/[^\w.-]/g, "_")}`);
    await copyFile(origen, ruta);
    return { ruta, url: `pizzeria-media://archivo?ruta=${encodeURIComponent(ruta)}` };
  });
  ipcMain.handle("configuracion:operativa", () => servicio.operativa());
  ipcMain.handle("configuracion:guardar", (_evento, datos) => servicio.guardar(datos));
}
