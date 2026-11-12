import { BrowserWindow, app, ipcMain } from "electron";
import { join } from "node:path";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
// -- CommonJS Shims --
import __shims_module__ from "node:module";
import.meta.filename;
const __dirname = import.meta.dirname;
__shims_module__.createRequire(import.meta.url);
// \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
// electron/proceso-principal/base-datos/conexion.js
var conexion = null;
function obtenerConexion() {
	if (conexion) return conexion;
	const carpetaDatos = join(app.getPath("userData"), "datos");
	mkdirSync(carpetaDatos, { recursive: true });
	const rutaBaseDatos = join(carpetaDatos, "pizzeria.sqlite");
	conexion = new Database(rutaBaseDatos);
	conexion.pragma("foreign_keys = ON");
	conexion.pragma("journal_mode = WAL");
	conexion.pragma("synchronous = NORMAL");
	conexion.pragma("busy_timeout = 5000");
	return conexion;
}
// electron/proceso-principal/base-datos/migraciones/001-base.js
var _001_base_exports = /* @__PURE__ */ __exportAll({
	descripcion: () => descripcion,
	sql: () => sql,
	version: () => 1
});
var descripcion = "Preparacion inicial de la base de datos";
var sql = `
  CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT NOT NULL UNIQUE,
    valor TEXT,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES
    ('moneda', 'MXN'),
    ('nombre_aplicacion', 'Sistema de Gestión para Pizzería');
`;
// electron/proceso-principal/base-datos/inicializacion.js
var migraciones = [_001_base_exports];
function inicializarBaseDatos() {
	const db = obtenerConexion();
	db.exec(`
    CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
      version INTEGER PRIMARY KEY,
      descripcion TEXT NOT NULL,
      aplicada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
	for (const migracion of migraciones) {
		if (db.prepare(`
      SELECT version
      FROM migraciones_aplicadas
      WHERE version = ?
    `).get(migracion.version)) continue;
		db.transaction(() => {
			db.exec(migracion.sql);
			db.prepare(`
        INSERT INTO migraciones_aplicadas
        (version, descripcion)
        VALUES (?, ?)
      `).run(migracion.version, migracion.descripcion);
		})();
		console.log(`Migracion ${migracion.version} aplicada correctamente`);
	}
	console.log("Base de datos inicializada correctamente");
	return db;
}
// electron/proceso-principal/index.js
function crearVentanaPrincipal() {
	const ventana = new BrowserWindow({
		width: 1366,
		height: 850,
		minWidth: 1100,
		minHeight: 700,
		show: false,
		webPreferences: {
			preload: join(__dirname, "../preload/index.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true
		}
	});
	ventana.once("ready-to-show", () => {
		ventana.show();
	});
	if (process.env.ELECTRON_RENDERER_URL) ventana.loadURL(process.env.ELECTRON_RENDERER_URL);
	else ventana.loadFile(join(__dirname, "../renderer/index.html"));
}
ipcMain.handle("aplicacion:obtener-version", () => {
	return app.getVersion();
});
app.whenReady().then(() => {
	inicializarBaseDatos();
	crearVentanaPrincipal();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) crearVentanaPrincipal();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
export {};
