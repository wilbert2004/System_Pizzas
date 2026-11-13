let electron = require("electron");
// electron/precarga/index.js
electron.contextBridge.exposeInMainWorld("sistema", {
	obtenerVersion: () => electron.ipcRenderer.invoke("aplicacion:obtener-version"),
	aplicacion: {
		onSolicitarCierre: (callback) => {
			const listener = () => callback();
			electron.ipcRenderer.on("aplicacion:solicitar-cierre", listener);
			return () => electron.ipcRenderer.removeListener("aplicacion:solicitar-cierre", listener);
		},
		finalizarCierre: () => electron.ipcRenderer.send("aplicacion:finalizar-cierre"),
		cancelarCierre: () => electron.ipcRenderer.send("aplicacion:cancelar-cierre")
	},
	licencias: {
		estado: () => electron.ipcRenderer.invoke("licencias:estado"),
		activar: (datos) => electron.ipcRenderer.invoke("licencias:activar", datos)
	},
	verificarBaseDatos: () => electron.ipcRenderer.invoke("base-datos:verificar"),
	autenticacion: {
		estadoInicial: () => electron.ipcRenderer.invoke("autenticacion:estado-inicial"),
		crearAdministrador: (datos) => electron.ipcRenderer.invoke("autenticacion:crear-administrador", datos),
		iniciarSesion: (datos) => electron.ipcRenderer.invoke("autenticacion:iniciar-sesion", datos),
		cerrarSesion: () => electron.ipcRenderer.invoke("autenticacion:cerrar-sesion"),
		obtenerSesion: () => electron.ipcRenderer.invoke("autenticacion:obtener-sesion"),
		actualizarPerfil: (datos) => electron.ipcRenderer.invoke("autenticacion:actualizar-perfil", datos),
		cambiarContrasenaPropia: (datos) => electron.ipcRenderer.invoke("autenticacion:cambiar-contrasena-propia", datos),
		solicitarTokenRecuperacion: (datos) => electron.ipcRenderer.invoke("autenticacion:solicitar-token-recuperacion", datos),
		restablecerConToken: (datos) => electron.ipcRenderer.invoke("autenticacion:restablecer-con-token", datos)
	},
	usuarios: {
		listar: () => electron.ipcRenderer.invoke("usuarios:listar"),
		crear: (datos) => electron.ipcRenderer.invoke("usuarios:crear", datos),
		actualizar: (datos) => electron.ipcRenderer.invoke("usuarios:actualizar", datos),
		cambiarContrasena: (datos) => electron.ipcRenderer.invoke("usuarios:cambiar-contrasena", datos),
		cambiarEstado: (datos) => electron.ipcRenderer.invoke("usuarios:cambiar-estado", datos)
	},
	productos: {
		categorias: {
			listar: () => electron.ipcRenderer.invoke("productos:categorias:listar"),
			listarTodas: () => electron.ipcRenderer.invoke("productos:categorias:listar-todas"),
			crear: (datos) => electron.ipcRenderer.invoke("productos:categorias:crear", datos),
			actualizar: (datos) => electron.ipcRenderer.invoke("productos:categorias:actualizar", datos),
			cambiarEstado: (datos) => electron.ipcRenderer.invoke("productos:categorias:estado", datos)
		},
		listar: () => electron.ipcRenderer.invoke("productos:listar"),
		listarTodos: () => electron.ipcRenderer.invoke("productos:listar-todos"),
		obtener: (id) => electron.ipcRenderer.invoke("productos:obtener", id),
		crear: (datos) => electron.ipcRenderer.invoke("productos:crear", datos),
		actualizar: (datos) => electron.ipcRenderer.invoke("productos:actualizar", datos),
		cambiarEstado: (datos) => electron.ipcRenderer.invoke("productos:estado", datos),
		presentaciones: {
			listar: (id) => electron.ipcRenderer.invoke("productos:presentaciones:listar", id),
			crear: (datos) => electron.ipcRenderer.invoke("productos:presentaciones:crear", datos),
			actualizar: (datos) => electron.ipcRenderer.invoke("productos:presentaciones:actualizar", datos),
			cambiarEstado: (datos) => electron.ipcRenderer.invoke("productos:presentaciones:estado", datos)
		},
		adicionales: {
			listar: () => electron.ipcRenderer.invoke("productos:adicionales:listar"),
			listarTodos: () => electron.ipcRenderer.invoke("productos:adicionales:listar-todos"),
			crear: (datos) => electron.ipcRenderer.invoke("productos:adicionales:crear", datos),
			actualizar: (datos) => electron.ipcRenderer.invoke("productos:adicionales:actualizar", datos),
			cambiarEstado: (datos) => electron.ipcRenderer.invoke("productos:adicionales:estado", datos),
			asignar: (datos) => electron.ipcRenderer.invoke("productos:adicionales:asignar", datos)
		}
	},
	clientes: {
		listar: (filtros) => electron.ipcRenderer.invoke("clientes:listar", filtros),
		obtener: (id) => electron.ipcRenderer.invoke("clientes:obtener", id),
		crear: (datos) => electron.ipcRenderer.invoke("clientes:crear", datos),
		actualizar: (id, datos) => electron.ipcRenderer.invoke("clientes:actualizar", id, datos),
		cambiarEstado: (id, activo) => electron.ipcRenderer.invoke("clientes:cambiar-estado", id, activo),
		obtenerHistorial: (id) => electron.ipcRenderer.invoke("clientes:historial", id)
	},
	puntoVenta: {
		obtenerCatalogo: () => electron.ipcRenderer.invoke("punto-venta:catalogo"),
		buscarClientes: (busqueda) => electron.ipcRenderer.invoke("punto-venta:buscar-clientes", busqueda),
		crearPedido: (datos) => electron.ipcRenderer.invoke("punto-venta:crear-pedido", datos)
	},
	pedidos: {
		listar: (filtros) => electron.ipcRenderer.invoke("pedidos:listar", filtros),
		obtener: (id) => electron.ipcRenderer.invoke("pedidos:obtener", id),
		cambiarEstado: (id, estado, motivo, tiempoEstimadoMinutos) => electron.ipcRenderer.invoke("pedidos:cambiar-estado", id, estado, motivo, tiempoEstimadoMinutos),
		resumen: () => electron.ipcRenderer.invoke("pedidos:resumen")
	},
	caja: {
		estado: () => electron.ipcRenderer.invoke("caja:estado"),
		validarCierre: () => electron.ipcRenderer.invoke("caja:validar-cierre"),
		abrir: (datos) => electron.ipcRenderer.invoke("caja:abrir", datos),
		registrarPago: (datos) => electron.ipcRenderer.invoke("caja:registrar-pago", datos),
		registrarMovimiento: (datos) => electron.ipcRenderer.invoke("caja:registrar-movimiento", datos),
		cerrar: (datos) => electron.ipcRenderer.invoke("caja:cerrar", datos)
	},
	reportes: { resumen: (filtros) => electron.ipcRenderer.invoke("reportes:resumen", filtros) },
	configuracion: {
		listar: () => electron.ipcRenderer.invoke("configuracion:listar"),
		publica: () => electron.ipcRenderer.invoke("configuracion:publica"),
		seleccionarLogotipo: () => electron.ipcRenderer.invoke("configuracion:seleccionar-logotipo"),
		operativa: () => electron.ipcRenderer.invoke("configuracion:operativa"),
		guardar: (datos) => electron.ipcRenderer.invoke("configuracion:guardar", datos)
	},
	respaldos: {
		listar: () => electron.ipcRenderer.invoke("respaldos:listar"),
		configurar: (datos) => electron.ipcRenderer.invoke("respaldos:configurar", datos),
		crear: () => electron.ipcRenderer.invoke("respaldos:crear"),
		seleccionarCarpeta: () => electron.ipcRenderer.invoke("respaldos:seleccionar-carpeta")
	},
	television: {
		importarArchivo: (archivo) => electron.ipcRenderer.invoke("television:importar-archivo", archivo),
		listarMultimedia: () => electron.ipcRenderer.invoke("television:listar-multimedia"),
		crearMultimedia: (datos) => electron.ipcRenderer.invoke("television:crear-multimedia", datos),
		actualizarMultimedia: (id, datos) => electron.ipcRenderer.invoke("television:actualizar-multimedia", id, datos),
		cambiarEstadoMultimedia: (id, activo) => electron.ipcRenderer.invoke("television:cambiar-estado", id, activo),
		eliminarMultimedia: (id) => electron.ipcRenderer.invoke("television:eliminar-multimedia", id),
		obtenerMusica: () => electron.ipcRenderer.invoke("television:obtener-musica"),
		guardarVolumenMusica: (volumen) => electron.ipcRenderer.invoke("television:guardar-volumen-musica", volumen),
		guardarMusica: (archivo) => electron.ipcRenderer.invoke("television:guardar-musica", archivo),
		quitarMusica: () => electron.ipcRenderer.invoke("television:quitar-musica"),
		listarPantallas: () => electron.ipcRenderer.invoke("television:listar-pantallas"),
		abrirVentana: (displayId) => electron.ipcRenderer.invoke("television:abrir-ventana", displayId),
		cerrarVentana: () => electron.ipcRenderer.invoke("television:cerrar-ventana"),
		abrirProduccion: (displayId) => electron.ipcRenderer.invoke("produccion:abrir-ventana", displayId),
		cerrarProduccion: () => electron.ipcRenderer.invoke("produccion:cerrar-ventana")
	}
});
