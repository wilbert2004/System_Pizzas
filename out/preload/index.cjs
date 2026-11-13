let electron = require("electron");
// electron/precarga/index.js
electron.contextBridge.exposeInMainWorld("sistema", {
	obtenerVersion: () => electron.ipcRenderer.invoke("aplicacion:obtener-version"),
	verificarBaseDatos: () => electron.ipcRenderer.invoke("base-datos:verificar"),
	autenticacion: {
		estadoInicial: () => electron.ipcRenderer.invoke("autenticacion:estado-inicial"),
		crearAdministrador: (datos) => electron.ipcRenderer.invoke("autenticacion:crear-administrador", datos),
		iniciarSesion: (datos) => electron.ipcRenderer.invoke("autenticacion:iniciar-sesion", datos),
		cerrarSesion: () => electron.ipcRenderer.invoke("autenticacion:cerrar-sesion"),
		obtenerSesion: () => electron.ipcRenderer.invoke("autenticacion:obtener-sesion")
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
	}
});
