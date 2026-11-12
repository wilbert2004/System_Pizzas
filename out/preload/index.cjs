let electron = require("electron");
// electron/precarga/index.js
electron.contextBridge.exposeInMainWorld("sistema", { obtenerVersion: () => electron.ipcRenderer.invoke("aplicacion:obtener-version") });
