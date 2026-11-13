/* global __dirname */
import { app, BrowserWindow, net, protocol } from "electron";
import { join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { inicializarBaseDatos } from "./base-datos/inicializacion.js";

import { cerrarConexion } from "./base-datos/conexion.js";

import { registrarCanalesIPC } from "./ipc/index.js";

import { cerrarVentanaTV } from "./ventanas/ventana-tv.js";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "pizzeria-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let ventanaPrincipal = null;

function crearVentanaPrincipal() {
  ventanaPrincipal = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1100,
    minHeight: 700,
    show: false,

    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
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
  protocol.handle("pizzeria-media", (solicitud) => {
    const ruta = new URL(solicitud.url).searchParams.get("ruta");

    if (!ruta) {
      return new Response("Archivo multimedia no especificado.", {
        status: 400,
      });
    }

    return net.fetch(pathToFileURL(ruta).href);
  });

  inicializarBaseDatos();

  registrarCanalesIPC();

  crearVentanaPrincipal();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      crearVentanaPrincipal();
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
