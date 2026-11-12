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
	}
});
