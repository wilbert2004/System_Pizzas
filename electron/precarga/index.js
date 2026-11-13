import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("sistema", {
  obtenerVersion: () => ipcRenderer.invoke("aplicacion:obtener-version"),
  aplicacion: {
    onSolicitarCierre: (callback) => {
      const listener = () => callback();
      ipcRenderer.on("aplicacion:solicitar-cierre", listener);
      return () => ipcRenderer.removeListener("aplicacion:solicitar-cierre", listener);
    },
    finalizarCierre: () => ipcRenderer.send("aplicacion:finalizar-cierre"),
    cancelarCierre: () => ipcRenderer.send("aplicacion:cancelar-cierre"),
  },
  licencias: {
    estado: () => ipcRenderer.invoke("licencias:estado"),
    activar: (datos) => ipcRenderer.invoke("licencias:activar", datos),
  },

  verificarBaseDatos: () => ipcRenderer.invoke("base-datos:verificar"),
  autenticacion: {
    estadoInicial: () => ipcRenderer.invoke("autenticacion:estado-inicial"),

    crearAdministrador: (datos) =>
      ipcRenderer.invoke("autenticacion:crear-administrador", datos),

    iniciarSesion: (datos) =>
      ipcRenderer.invoke("autenticacion:iniciar-sesion", datos),

    cerrarSesion: () => ipcRenderer.invoke("autenticacion:cerrar-sesion"),

    obtenerSesion: () => ipcRenderer.invoke("autenticacion:obtener-sesion"),

    actualizarPerfil: (datos) =>
      ipcRenderer.invoke("autenticacion:actualizar-perfil", datos),

    cambiarContrasenaPropia: (datos) =>
      ipcRenderer.invoke("autenticacion:cambiar-contrasena-propia", datos),
    solicitarTokenRecuperacion: (datos) => ipcRenderer.invoke("autenticacion:solicitar-token-recuperacion", datos),
    restablecerConToken: (datos) => ipcRenderer.invoke("autenticacion:restablecer-con-token", datos),
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
  caja: {
    estado: () => ipcRenderer.invoke("caja:estado"),
    validarCierre: () => ipcRenderer.invoke("caja:validar-cierre"),
    abrir: (datos) => ipcRenderer.invoke("caja:abrir", datos),
    registrarPago: (datos) => ipcRenderer.invoke("caja:registrar-pago", datos),
    registrarMovimiento: (datos) => ipcRenderer.invoke("caja:registrar-movimiento", datos),
    cerrar: (datos) => ipcRenderer.invoke("caja:cerrar", datos),
  },
  reportes: {
    resumen: (filtros) => ipcRenderer.invoke("reportes:resumen", filtros),
  },
  configuracion: {
    listar: () => ipcRenderer.invoke("configuracion:listar"),
    publica: () => ipcRenderer.invoke("configuracion:publica"),
    seleccionarLogotipo: () => ipcRenderer.invoke("configuracion:seleccionar-logotipo"),
    operativa: () => ipcRenderer.invoke("configuracion:operativa"),
    guardar: (datos) => ipcRenderer.invoke("configuracion:guardar", datos),
  },
  respaldos: {
    listar: () => ipcRenderer.invoke("respaldos:listar"),
    configurar: (datos) => ipcRenderer.invoke("respaldos:configurar", datos),
    crear: () => ipcRenderer.invoke("respaldos:crear"),
    seleccionarCarpeta: () => ipcRenderer.invoke("respaldos:seleccionar-carpeta"),
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
    obtenerMusica: () => ipcRenderer.invoke("television:obtener-musica"),
    guardarVolumenMusica: (volumen) => ipcRenderer.invoke("television:guardar-volumen-musica", volumen),
    guardarMusica: (archivo) =>
      ipcRenderer.invoke("television:guardar-musica", archivo),
    quitarMusica: () => ipcRenderer.invoke("television:quitar-musica"),
    listarPantallas: () => ipcRenderer.invoke("television:listar-pantallas"),
    abrirVentana: (displayId) =>
      ipcRenderer.invoke("television:abrir-ventana", displayId),
    cerrarVentana: () => ipcRenderer.invoke("television:cerrar-ventana"),
    abrirProduccion: (displayId) =>
      ipcRenderer.invoke("produccion:abrir-ventana", displayId),
    cerrarProduccion: () => ipcRenderer.invoke("produccion:cerrar-ventana"),
  },
});
