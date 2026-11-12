import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("sistema", {
  obtenerVersion: () => ipcRenderer.invoke("aplicacion:obtener-version"),
});
