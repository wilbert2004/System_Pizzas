import { ipcMain, app } from "electron";

export function registrarCanalesAplicacion() {
  ipcMain.handle("aplicacion:obtener-version", () => {
    return app.getVersion();
  });
}
