import { crearServicioTelevision } from "../../../base-datos/modulos/television/servicio.js";
import {
  cerrarVentanaTV,
  crearVentanaTV,
  listarPantallas,
} from "../../../ventanas/ventana-tv.js";
import { abrirVentanaProduccion, cerrarVentanaProduccion } from "../../../ventanas/ventana-produccion.js";
import { app } from "electron";
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

export function registrarControladoresTelevision(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioTelevision(db, obtenerSesion);

  ipcMain.handle("television:importar-archivo", async (_evento, archivo) => {
    const nombre = basename(String(archivo?.nombre || "archivo"));
    const extension = extname(nombre).toLowerCase();
    const extensionesPermitidas = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".mp4",
      ".webm",
      ".mov",
    ];

    if (!archivo?.datos || !extensionesPermitidas.includes(extension)) {
      throw new Error("Selecciona una imagen o video compatible.");
    }

    const carpeta = join(app.getPath("userData"), "publicidad");
    await mkdir(carpeta, { recursive: true });

    const nombreSeguro = `${Date.now()}-${nombre.replace(/[^\w.-]/g, "_")}`;
    const destino = join(carpeta, nombreSeguro);
    await writeFile(destino, Buffer.from(archivo.datos));

    return {
      ruta: `pizzeria-media://archivo?ruta=${encodeURIComponent(destino)}`,
    };
  });

  ipcMain.handle("television:listar-multimedia", () =>
    servicio.listarMultimedia(),
  );
  ipcMain.handle("television:crear-multimedia", (_evento, datos) =>
    servicio.crearMultimedia(datos),
  );
  ipcMain.handle("television:actualizar-multimedia", (_evento, id, datos) =>
    servicio.actualizarMultimedia(id, datos),
  );
  ipcMain.handle("television:cambiar-estado", (_evento, id, activo) =>
    servicio.cambiarEstadoMultimedia(id, activo),
  );
  ipcMain.handle("television:eliminar-multimedia", (_evento, id) =>
    servicio.eliminarMultimedia(id),
  );
  ipcMain.handle("television:obtener-musica", () => servicio.obtenerMusica());
  ipcMain.handle("television:guardar-volumen-musica", (_evento, volumen) => servicio.guardarVolumenMusica(volumen));
  ipcMain.handle("television:guardar-musica", async (_evento, archivo) => {
    if (obtenerSesion()?.rol !== "administrador") throw new Error("Solo un administrador puede agregar música a la TV.");
    const nombre = basename(String(archivo?.nombre || "musica"));
    const extension = extname(nombre).toLowerCase();
    const permitidas = [".mp3", ".wav", ".ogg", ".m4a"];
    const datos = archivo?.datos;
    if (!datos || !permitidas.includes(extension)) {
      throw new Error("Selecciona música MP3, WAV, OGG o M4A.");
    }
    const buffer = Buffer.from(datos);
    if (buffer.length > 40 * 1024 * 1024) throw new Error("La música no puede superar 40 MB.");
    const carpeta = join(app.getPath("userData"), "publicidad", "musica");
    await mkdir(carpeta, { recursive: true });
    const nombreSeguro = `${Date.now()}-${nombre.replace(/[^\w.-]/g, "_")}`;
    const destino = join(carpeta, nombreSeguro);
    await writeFile(destino, buffer);
    return servicio.guardarMusica({ ruta: destino, nombre });
  });
  ipcMain.handle("television:quitar-musica", () => servicio.quitarMusica());
  ipcMain.handle("television:listar-pantallas", () => listarPantallas());
  ipcMain.handle("television:abrir-ventana", async (_evento, displayId) => {
    await crearVentanaTV(displayId);
    return true;
  });
  ipcMain.handle("television:cerrar-ventana", () => {
    cerrarVentanaTV();
    return true;
  });
  ipcMain.handle("produccion:abrir-ventana", async (_evento, displayId) => {
    if (!obtenerSesion()?.id) throw new Error("Debes iniciar sesión para proyectar producción.");
    await abrirVentanaProduccion(displayId);
    return true;
  });
  ipcMain.handle("produccion:cerrar-ventana", () => {
    cerrarVentanaProduccion();
    return true;
  });
}
