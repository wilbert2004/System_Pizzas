/* global __dirname */
import { app, BrowserWindow, net, protocol, ipcMain } from "electron";
import { join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

import { inicializarBaseDatos } from "./base-datos/inicializacion.js";

import { cerrarConexion } from "./base-datos/conexion.js";

import { registrarCanalesIPC } from "./ipc/index.js";

import { cerrarVentanaTV } from "./ventanas/ventana-tv.js";
import { cerrarVentanaProduccion } from "./ventanas/ventana-produccion.js";

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
let servicioRespaldos = null;
let esperaRespaldoAntesDeSalir = false;
let cierreListo = false;
let permitirCierreVentana = false;
let solicitudCierreEnviada = false;

function crearVentanaPrincipal() {
  ventanaPrincipal = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 760,
    minHeight: 560,
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

  ventanaPrincipal.on("close", (evento) => {
    if (permitirCierreVentana) {
      permitirCierreVentana = false;
      return;
    }
    evento.preventDefault();
    if (!solicitudCierreEnviada) {
      solicitudCierreEnviada = true;
      ventanaPrincipal.webContents.send("aplicacion:solicitar-cierre");
    }
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
    solicitudCierreEnviada = false;
    cerrarVentanaTV();
    cerrarVentanaProduccion();
  });
}

ipcMain.on("aplicacion:finalizar-cierre", (evento) => {
  const ventana = BrowserWindow.fromWebContents(evento.sender);
  if (!ventana || ventana !== ventanaPrincipal) return;
  solicitudCierreEnviada = false;
  permitirCierreVentana = true;
  ventana.close();
});

ipcMain.on("aplicacion:cancelar-cierre", (evento) => {
  if (BrowserWindow.fromWebContents(evento.sender) === ventanaPrincipal) solicitudCierreEnviada = false;
});

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

  servicioRespaldos = registrarCanalesIPC();

  crearVentanaPrincipal();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      crearVentanaPrincipal();
    }
  });
});

app.on("before-quit", (evento) => {
  cerrarVentanaTV();
  cerrarVentanaProduccion();
  if (cierreListo) {
    cerrarConexion();
    return;
  }
  if (esperaRespaldoAntesDeSalir) {
    evento.preventDefault();
    return;
  }

  let respaldar = false;
  try { respaldar = servicioRespaldos?.preferenciaAlCerrar() ?? false; }
  catch (error) { console.error("No se pudo leer la preferencia de respaldos:", error); }

  if (!respaldar) {
    cierreListo = true;
    permitirCierreVentana = true;
    cerrarConexion();
    return;
  }

  evento.preventDefault();
  esperaRespaldoAntesDeSalir = true;
  void servicioRespaldos.crear("automatico")
    .catch((error) => console.error("No se pudo crear el respaldo automático al cerrar:", error))
    .finally(() => {
      cierreListo = true;
      permitirCierreVentana = true;
      cerrarConexion();
      app.quit();
    });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
