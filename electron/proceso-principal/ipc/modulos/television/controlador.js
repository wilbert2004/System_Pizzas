import { crearServicioTelevision } from "../../../base-datos/modulos/television/servicio.js";
import {
  cerrarVentanaTV,
  crearVentanaTV,
  listarPantallas,
} from "../../../ventanas/ventana-tv.js";
import { app } from "electron";
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

export function registrarControladoresTelevision(ipcMain, db) {
  const servicio = crearServicioTelevision(db);

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
  ipcMain.handle("television:listar-pantallas", () => listarPantallas());
  ipcMain.handle("television:abrir-ventana", async (_evento, displayId) => {
    await crearVentanaTV(displayId);
    return true;
  });
  ipcMain.handle("television:cerrar-ventana", () => {
    cerrarVentanaTV();
    return true;
  });
}
