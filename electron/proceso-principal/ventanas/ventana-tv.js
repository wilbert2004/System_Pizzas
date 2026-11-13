/* global __dirname */
import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import process from "node:process";

let ventanaTV = null;

function obtenerPantallaSecundaria(displayId) {
  const principal = screen.getPrimaryDisplay();

  if (displayId) {
    return screen.getAllDisplays().find(
      (pantalla) => String(pantalla.id) === String(displayId),
    );
  }

  return screen
    .getAllDisplays()
    .find((pantalla) => pantalla.id !== principal.id);
}

function cargarPantallaTV(ventana) {
  if (process.env.ELECTRON_RENDERER_URL) {
    return ventana.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/pantalla-tv`);
  } else {
    return ventana.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: "/pantalla-tv",
    });
  }
}

export function listarPantallas() {
  const principal = screen.getPrimaryDisplay();

  return screen.getAllDisplays().map((pantalla, indice) => ({
    id: String(pantalla.id),
    nombre: pantalla.id === principal.id
      ? "Pantalla principal"
      : `Pantalla externa ${indice}`,
    principal: pantalla.id === principal.id,
    ancho: pantalla.bounds.width,
    alto: pantalla.bounds.height,
  }));
}

export async function crearVentanaTV(displayId) {
  if (ventanaTV && !ventanaTV.isDestroyed()) {
    const pantalla = obtenerPantallaSecundaria(displayId);

    if (pantalla) {
      ventanaTV.setBounds(pantalla.bounds);
      ventanaTV.setFullScreen(true);
    }

    ventanaTV.show();
    ventanaTV.focus();
    return ventanaTV;
  }

  const pantalla = obtenerPantallaSecundaria(displayId);

  if (!pantalla) {
    throw new Error(
      "No se detectó una pantalla externa. Conecta HDMI o usa Win + K para conectar la TV.",
    );
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
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  ventanaTV.webContents.on("did-fail-load", (_evento, codigo, descripcion) => {
    console.error(`No se pudo cargar la pantalla TV (${codigo}): ${descripcion}`);
  });

  ventanaTV.webContents.on("console-message", (_evento, nivel, mensaje) => {
    console.log(`[TV] ${mensaje}`);
  });

  ventanaTV.once("ready-to-show", () => {
    ventanaTV.show();
  });

  await cargarPantallaTV(ventanaTV);
  ventanaTV.setBounds(pantalla.bounds);
  ventanaTV.setFullScreen(true);
  ventanaTV.show();

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
