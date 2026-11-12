import { BrowserWindow, screen } from "electron";
import { join } from "node:path";

let ventanaTV = null;

function obtenerPantallaSecundaria() {
  const principal = screen.getPrimaryDisplay();

  return screen
    .getAllDisplays()
    .find((pantalla) => pantalla.id !== principal.id);
}

function cargarPantallaTV(ventana) {
  if (process.env.ELECTRON_RENDERER_URL) {
    ventana.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/pantalla-tv`);
  } else {
    ventana.loadFile(join(__dirname, "../../renderer/index.html"), {
      hash: "/pantalla-tv",
    });
  }
}

export function crearVentanaTV() {
  if (ventanaTV && !ventanaTV.isDestroyed()) {
    return ventanaTV;
  }

  const pantalla = obtenerPantallaSecundaria();

  if (!pantalla) {
    console.log("No se detectó una segunda pantalla.");
    return null;
  }

  const { x, y, width, height } = pantalla.bounds;

  ventanaTV = new BrowserWindow({
    x,
    y,
    width,
    height,
    show: false,
    frame: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: "#020617",

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  cargarPantallaTV(ventanaTV);

  ventanaTV.once("ready-to-show", () => {
    ventanaTV.show();
  });

  ventanaTV.on("closed", () => {
    ventanaTV = null;
  });

  console.log("Ventana de TV creada correctamente.");

  return ventanaTV;
}

export function cerrarVentanaTV() {
  if (ventanaTV && !ventanaTV.isDestroyed()) {
    ventanaTV.close();
  }
}

export function obtenerVentanaTV() {
  return ventanaTV;
}
