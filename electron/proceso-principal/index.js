import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
//agreagremos las iompoprtaciones de la bd
import { inicializarBaseDatos } from "./base-datos/inicializacion.js";

import { cerrarConexion } from "./base-datos/conexion.js";

function crearVentanaPrincipal() {
  const ventana = new BrowserWindow({
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

  ventana.once("ready-to-show", () => {
    ventana.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    ventana.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    ventana.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.handle("aplicacion:obtener-version", () => {
  return app.getVersion();
});

app.whenReady().then(() => {
  // Inicializamos la base de datos\
  inicializarBaseDatos();
  crearVentanaPrincipal();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      crearVentanaPrincipal();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
