import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("sistema", {
  obtenerVersion: () => ipcRenderer.invoke("aplicacion:obtener-version"),

  verificarBaseDatos: () => ipcRenderer.invoke("base-datos:verificar"),
  autenticacion: {
    estadoInicial: () => ipcRenderer.invoke("autenticacion:estado-inicial"),

    crearAdministrador: (datos) =>
      ipcRenderer.invoke("autenticacion:crear-administrador", datos),

    iniciarSesion: (datos) =>
      ipcRenderer.invoke("autenticacion:iniciar-sesion", datos),

    cerrarSesion: () => ipcRenderer.invoke("autenticacion:cerrar-sesion"),

    obtenerSesion: () => ipcRenderer.invoke("autenticacion:obtener-sesion"),
  },

  usuarios: {
    listar: () => ipcRenderer.invoke("usuarios:listar"),

    crear: (datos) => ipcRenderer.invoke("usuarios:crear", datos),

    actualizar: (datos) => ipcRenderer.invoke("usuarios:actualizar", datos),

    cambiarContrasena: (datos) =>
      ipcRenderer.invoke("usuarios:cambiar-contrasena", datos),

    cambiarEstado: (datos) =>
      ipcRenderer.invoke("usuarios:cambiar-estado", datos),
  },
});
