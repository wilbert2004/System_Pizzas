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
  clientes: {
    listar: (filtros) => ipcRenderer.invoke("clientes:listar", filtros),

    obtener: (id) => ipcRenderer.invoke("clientes:obtener", id),

    crear: (datos) => ipcRenderer.invoke("clientes:crear", datos),

    actualizar: (id, datos) =>
      ipcRenderer.invoke("clientes:actualizar", id, datos),

    cambiarEstado: (id, activo) =>
      ipcRenderer.invoke("clientes:cambiar-estado", id, activo),

    obtenerHistorial: (id) => ipcRenderer.invoke("clientes:historial", id),
  },
  puntoVenta: {
    obtenerCatalogo: () => ipcRenderer.invoke("punto-venta:catalogo"),

    buscarClientes: (busqueda) =>
      ipcRenderer.invoke("punto-venta:buscar-clientes", busqueda),

    crearPedido: (datos) =>
      ipcRenderer.invoke("punto-venta:crear-pedido", datos),
  },
  pedidos: {
    listar: (filtros) => ipcRenderer.invoke("pedidos:listar", filtros),

    obtener: (id) => ipcRenderer.invoke("pedidos:obtener", id),

    cambiarEstado: (id, estado, motivo) =>
      ipcRenderer.invoke("pedidos:cambiar-estado", id, estado, motivo),

    resumen: () => ipcRenderer.invoke("pedidos:resumen"),
  },
  television: {
    importarArchivo: (archivo) =>
      ipcRenderer.invoke("television:importar-archivo", archivo),
    listarMultimedia: () => ipcRenderer.invoke("television:listar-multimedia"),
    crearMultimedia: (datos) =>
      ipcRenderer.invoke("television:crear-multimedia", datos),
    actualizarMultimedia: (id, datos) =>
      ipcRenderer.invoke("television:actualizar-multimedia", id, datos),
    cambiarEstadoMultimedia: (id, activo) =>
      ipcRenderer.invoke("television:cambiar-estado", id, activo),
    eliminarMultimedia: (id) =>
      ipcRenderer.invoke("television:eliminar-multimedia", id),
    listarPantallas: () => ipcRenderer.invoke("television:listar-pantallas"),
    abrirVentana: (displayId) =>
      ipcRenderer.invoke("television:abrir-ventana", displayId),
    cerrarVentana: () => ipcRenderer.invoke("television:cerrar-ventana"),
  },
});
