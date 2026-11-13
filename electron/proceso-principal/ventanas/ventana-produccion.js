/* global __dirname */
import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import process from "node:process";

let ventanaProduccion = null;

function obtenerPantalla(displayId) {
  const principal = screen.getPrimaryDisplay();
  if (displayId) {
    return screen.getAllDisplays().find((pantalla) => String(pantalla.id) === String(displayId));
  }
  return screen.getAllDisplays().find((pantalla) => pantalla.id !== principal.id);
}

function cargarPantalla(ventana) {
  if (process.env.ELECTRON_RENDERER_URL) {
    return ventana.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/pantalla-produccion`);
  }
  return ventana.loadFile(join(__dirname, "../../renderer/index.html"), { hash: "/pantalla-produccion" });
}

export async function abrirVentanaProduccion(displayId) {
  const pantalla = obtenerPantalla(displayId);
  if (!pantalla) {
    throw new Error("Conecta una segunda pantalla para proyectar producción.");
  }

  if (ventanaProduccion && !ventanaProduccion.isDestroyed()) {
    ventanaProduccion.setBounds(pantalla.bounds);
    ventanaProduccion.setFullScreen(true);
    ventanaProduccion.show();
    ventanaProduccion.focus();
    return ventanaProduccion;
  }

  ventanaProduccion = new BrowserWindow({
    ...pantalla.bounds,
    show: false,
    frame: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: "#080b12",
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  ventanaProduccion.once("ready-to-show", () => ventanaProduccion?.show());
  ventanaProduccion.on("closed", () => { ventanaProduccion = null; });
  await cargarPantalla(ventanaProduccion);
  ventanaProduccion.setBounds(pantalla.bounds);
  ventanaProduccion.setFullScreen(true);
  ventanaProduccion.show();
  return ventanaProduccion;
}

export function cerrarVentanaProduccion() {
  if (ventanaProduccion && !ventanaProduccion.isDestroyed()) ventanaProduccion.close();
}
