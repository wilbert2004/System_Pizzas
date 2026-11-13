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

  productos: {
    categorias: {
      listar: () => ipcRenderer.invoke("productos:categorias:listar"),

      listarTodas: () =>
        ipcRenderer.invoke("productos:categorias:listar-todas"),

      crear: (datos) => ipcRenderer.invoke("productos:categorias:crear", datos),

      actualizar: (datos) =>
        ipcRenderer.invoke("productos:categorias:actualizar", datos),

      cambiarEstado: (datos) =>
        ipcRenderer.invoke("productos:categorias:estado", datos),
    },

    listar: () => ipcRenderer.invoke("productos:listar"),

    listarTodos: () => ipcRenderer.invoke("productos:listar-todos"),

    obtener: (id) => ipcRenderer.invoke("productos:obtener", id),

    crear: (datos) => ipcRenderer.invoke("productos:crear", datos),

    actualizar: (datos) => ipcRenderer.invoke("productos:actualizar", datos),

    cambiarEstado: (datos) => ipcRenderer.invoke("productos:estado", datos),

    presentaciones: {
      listar: (id) => ipcRenderer.invoke("productos:presentaciones:listar", id),

      crear: (datos) =>
        ipcRenderer.invoke("productos:presentaciones:crear", datos),

      actualizar: (datos) =>
        ipcRenderer.invoke("productos:presentaciones:actualizar", datos),

      cambiarEstado: (datos) =>
        ipcRenderer.invoke("productos:presentaciones:estado", datos),
    },

    adicionales: {
      listar: () => ipcRenderer.invoke("productos:adicionales:listar"),

      listarTodos: () =>
        ipcRenderer.invoke("productos:adicionales:listar-todos"),

      crear: (datos) =>
        ipcRenderer.invoke("productos:adicionales:crear", datos),

      actualizar: (datos) =>
        ipcRenderer.invoke("productos:adicionales:actualizar", datos),

      cambiarEstado: (datos) =>
        ipcRenderer.invoke("productos:adicionales:estado", datos),

      asignar: (datos) =>
        ipcRenderer.invoke("productos:adicionales:asignar", datos),
    },
  },
});
