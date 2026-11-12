import { app, BrowserWindow, screen } from "electron";
import { join } from "node:path";

import { inicializarBaseDatos } from "./base-datos/inicializacion.js";

import { cerrarConexion } from "./base-datos/conexion.js";

import { registrarCanalesIPC } from "./ipc/index.js";

import { crearVentanaTV, cerrarVentanaTV } from "./ventanas/ventana-tv.js";

let ventanaPrincipal = null;

function crearVentanaPrincipal() {
  ventanaPrincipal = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1100,
    minHeight: 700,
    show: false,

    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  ventanaPrincipal.once("ready-to-show", () => {
    ventanaPrincipal.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    ventanaPrincipal.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/`);
  } else {
    ventanaPrincipal.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: "/",
    });
  }

  ventanaPrincipal.on("closed", () => {
    ventanaPrincipal = null;
    cerrarVentanaTV();
  });
}

app.whenReady().then(() => {
  inicializarBaseDatos();

  registrarCanalesIPC();

  crearVentanaPrincipal();

  crearVentanaTV();

  screen.on("display-added", () => {
    crearVentanaTV();
  });

  screen.on("display-removed", () => {
    cerrarVentanaTV();
    crearVentanaTV();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      crearVentanaPrincipal();
      crearVentanaTV();
    }
  });
});

app.on("before-quit", () => {
  cerrarVentanaTV();
  cerrarConexion();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
