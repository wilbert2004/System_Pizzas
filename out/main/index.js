import { BrowserWindow, app, dialog, ipcMain, net, protocol, screen } from "electron";
import { basename, dirname, extname, join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import Database from "better-sqlite3";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID, verify } from "node:crypto";
import { Buffer as Buffer$1 } from "node:buffer";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { arch, cpus, hostname, networkInterfaces, platform } from "node:os";
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
function cerrarConexion() {
	if (conexion) {
		conexion.close();
		conexion = null;
	}
}
// electron/proceso-principal/base-datos/migraciones/001-base.js
var _001_base_exports = /* @__PURE__ */ __exportAll({
	descripcion: () => descripcion$2,
	sql: () => sql$2,
	version: () => 1
});
var descripcion$2 = "Preparacion inicial de la base de datos";
var sql$2 = `
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
// electron/proceso-principal/base-datos/migraciones/002-estructura-principal.js
var _002_estructura_principal_exports = /* @__PURE__ */ __exportAll({
	descripcion: () => descripcion$1,
	sql: () => sql$1,
	version: () => 2
});
var descripcion$1 = "Creacion de la estructura principal del sistema";
var sql$1 = `
  -- =====================================================
  -- ACTUALIZAR CONFIGURACION EXISTENTE
  -- =====================================================

  ALTER TABLE configuracion
  ADD COLUMN descripcion TEXT;

  -- =====================================================
  -- USUARIOS Y SEGURIDAD
  -- =====================================================

  CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'empleado')),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE registro_actividad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    accion TEXT NOT NULL,
    modulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    entidad TEXT,
    entidad_id INTEGER,
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE SET NULL
  );

  -- =====================================================
  -- CLIENTES
  -- =====================================================

  CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT,
    referencias TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- =====================================================
  -- CATEGORIAS Y PRODUCTOS
  -- =====================================================

  CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    requiere_presentacion INTEGER NOT NULL DEFAULT 0
      CHECK (requiere_presentacion IN (0, 1)),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    orden INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (categoria_id)
      REFERENCES categorias(id)
      ON DELETE RESTRICT
  );

  CREATE TABLE presentaciones_producto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    precio_centavos INTEGER NOT NULL CHECK (precio_centavos >= 0),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    orden INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (producto_id, nombre),

    FOREIGN KEY (producto_id)
      REFERENCES productos(id)
      ON DELETE RESTRICT
  );

  CREATE TABLE adicionales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    precio_centavos INTEGER NOT NULL CHECK (precio_centavos >= 0),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE producto_adicionales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    adicional_id INTEGER NOT NULL,

    UNIQUE (producto_id, adicional_id),

    FOREIGN KEY (producto_id)
      REFERENCES productos(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (adicional_id)
      REFERENCES adicionales(id)
      ON DELETE RESTRICT
  );

  -- =====================================================
  -- PEDIDOS
  -- =====================================================

  CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT NOT NULL UNIQUE,
    cliente_id INTEGER,
    usuario_id INTEGER NOT NULL,

    canal TEXT NOT NULL
      CHECK (canal IN ('mostrador', 'telefono', 'whatsapp')),

    tipo TEXT NOT NULL
      CHECK (tipo IN ('recoger', 'domicilio')),

    estado TEXT NOT NULL DEFAULT 'nuevo'
      CHECK (
        estado IN (
          'nuevo',
          'preparando',
          'en_horno',
          'listo',
          'en_reparto',
          'entregado',
          'cancelado'
        )
      ),

    subtotal_centavos INTEGER NOT NULL
      CHECK (subtotal_centavos >= 0),

    descuento_centavos INTEGER NOT NULL DEFAULT 0
      CHECK (
        descuento_centavos >= 0
        AND descuento_centavos <= subtotal_centavos
      ),

    motivo_descuento TEXT,
    usuario_descuento_id INTEGER,

    costo_envio_centavos INTEGER NOT NULL DEFAULT 0
      CHECK (costo_envio_centavos >= 0),

    total_centavos INTEGER NOT NULL
      CHECK (
        total_centavos >= 0
        AND total_centavos =
          subtotal_centavos - descuento_centavos + costo_envio_centavos
      ),

    notas TEXT,
    direccion_entrega TEXT,
    referencias_entrega TEXT,

    tiempo_estimado_minutos INTEGER
      CHECK (
        tiempo_estimado_minutos IS NULL
        OR tiempo_estimado_minutos > 0
      ),

    inicio_preparacion TEXT,
    entrada_horno TEXT,
    fecha_listo TEXT,
    salida_reparto TEXT,
    fecha_entregado TEXT,
    fecha_cancelado TEXT,

    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
      tipo != 'recoger'
      OR costo_envio_centavos = 0
    ),

    CHECK (
      descuento_centavos = 0
      OR (
        motivo_descuento IS NOT NULL
        AND LENGTH(TRIM(motivo_descuento)) > 0
        AND usuario_descuento_id IS NOT NULL
      )
    ),

    FOREIGN KEY (cliente_id)
      REFERENCES clientes(id)
      ON DELETE SET NULL,

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (usuario_descuento_id)
      REFERENCES usuarios(id)
      ON DELETE RESTRICT
  );

  CREATE TABLE pedido_detalles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER,
    presentacion_id INTEGER,

    nombre_producto TEXT NOT NULL,
    nombre_presentacion TEXT,

    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    precio_unitario_centavos INTEGER NOT NULL
      CHECK (precio_unitario_centavos >= 0),

    subtotal_centavos INTEGER NOT NULL
      CHECK (subtotal_centavos >= 0),

    notas TEXT,

    FOREIGN KEY (pedido_id)
      REFERENCES pedidos(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (producto_id)
      REFERENCES productos(id)
      ON DELETE SET NULL,

    FOREIGN KEY (presentacion_id)
      REFERENCES presentaciones_producto(id)
      ON DELETE SET NULL
  );

  CREATE TABLE pedido_detalle_adicionales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_detalle_id INTEGER NOT NULL,
    adicional_id INTEGER,
    nombre_adicional TEXT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    precio_unitario_centavos INTEGER NOT NULL
      CHECK (precio_unitario_centavos >= 0),

    subtotal_centavos INTEGER NOT NULL
      CHECK (subtotal_centavos >= 0),

    FOREIGN KEY (pedido_detalle_id)
      REFERENCES pedido_detalles(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (adicional_id)
      REFERENCES adicionales(id)
      ON DELETE SET NULL
  );

  CREATE TABLE historial_estados_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    usuario_id INTEGER,
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL,
    motivo TEXT,
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
      estado_anterior IS NULL
      OR estado_anterior IN (
        'nuevo',
        'preparando',
        'en_horno',
        'listo',
        'en_reparto',
        'entregado',
        'cancelado'
      )
    ),

    CHECK (
      estado_nuevo IN (
        'nuevo',
        'preparando',
        'en_horno',
        'listo',
        'en_reparto',
        'entregado',
        'cancelado'
      )
    ),

    CHECK (
      estado_nuevo != 'cancelado'
      OR (
        motivo IS NOT NULL
        AND LENGTH(TRIM(motivo)) > 0
      )
    ),

    FOREIGN KEY (pedido_id)
      REFERENCES pedidos(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE SET NULL
  );

  -- =====================================================
  -- CAJA
  -- =====================================================

  CREATE TABLE sesiones_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_apertura_id INTEGER NOT NULL,
    usuario_cierre_id INTEGER,

    fecha_apertura TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TEXT,

    monto_inicial_centavos INTEGER NOT NULL
      CHECK (monto_inicial_centavos >= 0),

    efectivo_esperado_centavos INTEGER NOT NULL DEFAULT 0
      CHECK (efectivo_esperado_centavos >= 0),

    transferencias_centavos INTEGER NOT NULL DEFAULT 0
      CHECK (transferencias_centavos >= 0),

    efectivo_contado_centavos INTEGER
      CHECK (
        efectivo_contado_centavos IS NULL
        OR efectivo_contado_centavos >= 0
      ),

    diferencia_centavos INTEGER,

    estado TEXT NOT NULL DEFAULT 'abierta'
      CHECK (estado IN ('abierta', 'cerrada')),

    observaciones TEXT,

    CHECK (
      (estado = 'abierta' AND fecha_cierre IS NULL)
      OR
      (estado = 'cerrada' AND fecha_cierre IS NOT NULL)
    ),

    FOREIGN KEY (usuario_apertura_id)
      REFERENCES usuarios(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (usuario_cierre_id)
      REFERENCES usuarios(id)
      ON DELETE RESTRICT
  );

  CREATE UNIQUE INDEX idx_una_sola_caja_abierta
    ON sesiones_caja(estado)
    WHERE estado = 'abierta';

  CREATE TABLE pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL UNIQUE,
    sesion_caja_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,

    metodo TEXT NOT NULL
      CHECK (metodo IN ('efectivo', 'transferencia')),

    monto_centavos INTEGER NOT NULL CHECK (monto_centavos > 0),
    referencia TEXT,
    fecha_pago TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pedido_id)
      REFERENCES pedidos(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (sesion_caja_id)
      REFERENCES sesiones_caja(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE RESTRICT
  );

  CREATE TABLE movimientos_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion_caja_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,

    tipo TEXT NOT NULL
      CHECK (tipo IN ('gasto', 'retiro', 'ingreso')),

    metodo TEXT NOT NULL
      CHECK (metodo IN ('efectivo', 'transferencia')),

    concepto TEXT NOT NULL,
    monto_centavos INTEGER NOT NULL CHECK (monto_centavos > 0),
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sesion_caja_id)
      REFERENCES sesiones_caja(id)
      ON DELETE RESTRICT,

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE RESTRICT
  );

  -- =====================================================
  -- PUBLICIDAD Y MULTIMEDIA
  -- =====================================================

  CREATE TABLE multimedia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('imagen', 'video')),

    duracion_segundos INTEGER
      CHECK (
        duracion_segundos IS NULL
        OR duracion_segundos > 0
      ),

    orden INTEGER NOT NULL DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- =====================================================
  -- RESPALDOS
  -- =====================================================

  CREATE TABLE historial_respaldos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_archivo TEXT NOT NULL,
    ruta_archivo TEXT NOT NULL,

    tipo TEXT NOT NULL
      CHECK (tipo IN ('automatico', 'manual')),

    tamano_bytes INTEGER
      CHECK (
        tamano_bytes IS NULL
        OR tamano_bytes >= 0
      ),

    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    integridad_verificada INTEGER NOT NULL DEFAULT 0
      CHECK (integridad_verificada IN (0, 1)),

    observaciones TEXT
  );

  -- =====================================================
  -- INDICES
  -- =====================================================

  CREATE INDEX idx_clientes_telefono
    ON clientes(telefono);

  CREATE INDEX idx_productos_categoria
    ON productos(categoria_id);

  CREATE INDEX idx_presentaciones_producto
    ON presentaciones_producto(producto_id);

  CREATE INDEX idx_producto_adicionales_producto
    ON producto_adicionales(producto_id);

  CREATE INDEX idx_producto_adicionales_adicional
    ON producto_adicionales(adicional_id);

  CREATE INDEX idx_pedidos_estado
    ON pedidos(estado);

  CREATE INDEX idx_pedidos_fecha_creacion
    ON pedidos(fecha_creacion);

  CREATE INDEX idx_pedidos_cliente
    ON pedidos(cliente_id);

  CREATE INDEX idx_pedidos_usuario
    ON pedidos(usuario_id);

  CREATE INDEX idx_pedido_detalles_pedido
    ON pedido_detalles(pedido_id);

  CREATE INDEX idx_pedido_detalle_adicionales_detalle
    ON pedido_detalle_adicionales(pedido_detalle_id);

  CREATE INDEX idx_historial_pedido_fecha
    ON historial_estados_pedido(pedido_id, fecha);

  CREATE INDEX idx_pagos_fecha
    ON pagos(fecha_pago);

  CREATE INDEX idx_pagos_sesion
    ON pagos(sesion_caja_id);

  CREATE INDEX idx_movimientos_sesion
    ON movimientos_caja(sesion_caja_id);

  CREATE INDEX idx_registro_actividad_fecha
    ON registro_actividad(fecha);

  CREATE INDEX idx_multimedia_activo_orden
    ON multimedia(activo, orden);
`;
// electron/proceso-principal/base-datos/migraciones/003-pagos-efectivo.js
var _003_pagos_efectivo_exports = /* @__PURE__ */ __exportAll({
	descripcion: () => descripcion,
	sql: () => sql,
	version: () => 3
});
var descripcion = "Registro del efectivo recibido y el cambio de los pagos";
var sql = `
  ALTER TABLE pagos ADD COLUMN monto_recibido_centavos INTEGER NOT NULL DEFAULT 0 CHECK (monto_recibido_centavos >= 0);
  ALTER TABLE pagos ADD COLUMN cambio_centavos INTEGER NOT NULL DEFAULT 0 CHECK (cambio_centavos >= 0);
  UPDATE pagos SET monto_recibido_centavos = monto_centavos WHERE monto_recibido_centavos = 0;
`;
// electron/proceso-principal/base-datos/inicializacion.js
var migraciones = [
	_001_base_exports,
	_002_estructura_principal_exports,
	_003_pagos_efectivo_exports
];
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
      `).get(migracion.version)) {
			console.log(`Migracion ${migracion.version} ya aplicada`);
			continue;
		}
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
	const columnasPago = new Set(db.pragma("table_info(pagos)").map((columna) => columna.name));
	if (!columnasPago.has("monto_recibido_centavos")) {
		db.exec("ALTER TABLE pagos ADD COLUMN monto_recibido_centavos INTEGER NOT NULL DEFAULT 0 CHECK (monto_recibido_centavos >= 0)");
		db.exec("UPDATE pagos SET monto_recibido_centavos = monto_centavos WHERE monto_recibido_centavos = 0");
	}
	if (!columnasPago.has("cambio_centavos")) db.exec("ALTER TABLE pagos ADD COLUMN cambio_centavos INTEGER NOT NULL DEFAULT 0 CHECK (cambio_centavos >= 0)");
	console.log("Base de datos inicializada correctamente");
	const tablas = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();
	const migracionesAplicadas = db.prepare(`
  SELECT version, descripcion, aplicada_en
  FROM migraciones_aplicadas
  ORDER BY version
`).all();
	const integridad = db.pragma("integrity_check");
	const clavesForaneas = db.pragma("foreign_key_check");
	console.log("========== VERIFICACION SQLITE ==========");
	console.log("Tablas encontradas:", tablas.length);
	console.table(tablas);
	console.log("Migraciones aplicadas:");
	console.table(migracionesAplicadas);
	console.log("Integridad:", integridad);
	console.log("Errores de claves foraneas:", clavesForaneas);
	console.log("=========================================");
	return db;
}
// electron/proceso-principal/ipc/modulos/aplicacion.js
function registrarCanalesAplicacion() {
	ipcMain.handle("aplicacion:obtener-version", () => {
		return app.getVersion();
	});
}
// electron/proceso-principal/ipc/modulos/base-datos.js
function registrarCanalesBaseDatos() {
	ipcMain.handle("base-datos:verificar", () => {
		const db = obtenerConexion();
		const resultado = db.prepare(`
      SELECT sqlite_version() AS version
    `).get();
		const migraciones = db.prepare(`
      SELECT COUNT(*) AS total
      FROM migraciones_aplicadas
    `).get();
		return {
			conectada: true,
			versionSQLite: resultado.version,
			migracionesAplicadas: migraciones.total
		};
	});
}
// electron/proceso-principal/base-datos/modulos/autenticacion/servicio.js
var sesionActual = null;
function normalizarUsuario(usuario) {
	return usuario.trim().toLowerCase();
}
function validarContrasena(contrasena) {
	if (typeof contrasena !== "string" || contrasena.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
}
function registrarActividad(db, usuarioId, accion, descripcion) {
	db.prepare(`
    INSERT INTO registro_actividad
      (usuario_id, accion, modulo, descripcion, fecha)
    VALUES (?, ?, 'autenticacion', ?, CURRENT_TIMESTAMP)
  `).run(usuarioId ?? null, accion, descripcion);
}
function crearServicioAutenticacion(db) {
	const tokensRecuperacion = /* @__PURE__ */ new Map();
	function guardarSesionPersistente(usuarioId) {
		db.prepare(`INSERT INTO configuracion (clave, valor, descripcion) VALUES ('sesion_persistente_usuario_id', ?, 'Usuario para restaurar sesión si queda una caja abierta') ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor, descripcion=excluded.descripcion`).run(String(usuarioId));
	}
	function limpiarSesionPersistente() {
		db.prepare("DELETE FROM configuracion WHERE clave = 'sesion_persistente_usuario_id'").run();
	}
	function restaurarSesionSiCajaSigueAbierta() {
		if (sesionActual) return sesionActual;
		const idGuardado = db.prepare("SELECT valor FROM configuracion WHERE clave = 'sesion_persistente_usuario_id'").get()?.valor;
		if (!idGuardado) return null;
		const cajaAbierta = db.prepare("SELECT id FROM sesiones_caja WHERE estado = 'abierta' LIMIT 1").get();
		const usuario = db.prepare("SELECT id, nombre, usuario, rol, activo FROM usuarios WHERE id = ?").get(Number(idGuardado));
		if (!cajaAbierta || !usuario?.activo) {
			limpiarSesionPersistente();
			return null;
		}
		sesionActual = {
			id: usuario.id,
			nombre: usuario.nombre,
			usuario: usuario.usuario,
			rol: usuario.rol
		};
		return sesionActual;
	}
	function contarUsuarios() {
		return db.prepare(`
      SELECT COUNT(*) AS total FROM usuarios
    `).get().total;
	}
	function obtenerEstadoInicial() {
		restaurarSesionSiCajaSigueAbierta();
		return {
			necesitaAdministrador: contarUsuarios() === 0,
			sesion: sesionActual
		};
	}
	function crearAdministradorInicial(datos) {
		if (contarUsuarios() !== 0) throw new Error("La configuración inicial ya fue realizada.");
		const nombre = datos.nombre?.trim();
		const usuario = normalizarUsuario(datos.usuario || "");
		const contrasena = datos.contrasena;
		if (!nombre || !usuario) throw new Error("Completa todos los campos.");
		validarContrasena(contrasena);
		const hash = bcrypt.hashSync(contrasena, 12);
		return db.transaction(() => {
			if (contarUsuarios() !== 0) throw new Error("Ya existe una cuenta registrada.");
			const resultado = db.prepare(`
        INSERT INTO usuarios (
          nombre,
          usuario,
          contrasena_hash,
          rol
        )
        VALUES (?, ?, ?, 'administrador')
      `).run(nombre, usuario, hash);
			registrarActividad(db, resultado.lastInsertRowid, "CREAR_ADMINISTRADOR", "Se creó el administrador inicial.");
			return resultado.lastInsertRowid;
		})();
	}
	function iniciarSesion(datos) {
		const usuario = normalizarUsuario(datos.usuario || "");
		const contrasena = datos.contrasena || "";
		if (!usuario || !contrasena) throw new Error("Ingresa usuario y contraseña.");
		const registro = db.prepare(`
      SELECT *
      FROM usuarios
      WHERE usuario = ?
      LIMIT 1
    `).get(usuario);
		if (!registro || !bcrypt.compareSync(contrasena, registro.contrasena_hash)) throw new Error("Usuario o contraseña incorrectos.");
		if (!registro.activo) throw new Error("Esta cuenta se encuentra desactivada.");
		sesionActual = {
			id: registro.id,
			nombre: registro.nombre,
			usuario: registro.usuario,
			rol: registro.rol
		};
		guardarSesionPersistente(registro.id);
		registrarActividad(db, registro.id, "INICIO_SESION", "El usuario inició sesión.");
		return sesionActual;
	}
	function cerrarSesion() {
		if (sesionActual) registrarActividad(db, sesionActual.id, "CIERRE_SESION", "El usuario cerró sesión.");
		sesionActual = null;
		limpiarSesionPersistente();
		return true;
	}
	function actualizarPerfil(datos) {
		const sesion = obtenerSesion();
		if (!sesion) throw new Error("Debes iniciar sesión.");
		const nombre = String(datos?.nombre || "").trim();
		const usuario = normalizarUsuario(String(datos?.usuario || ""));
		if (!nombre || nombre.length > 100 || !usuario || usuario.length > 50) throw new Error("El nombre y usuario son obligatorios y deben respetar el largo máximo.");
		db.prepare(`UPDATE usuarios SET nombre = ?, usuario = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`).run(nombre, usuario, sesion.id);
		registrarActividad(db, sesion.id, "ACTUALIZAR_PERFIL", "El usuario actualizó su perfil.");
		sesionActual = {
			...sesion,
			nombre,
			usuario
		};
		return sesionActual;
	}
	function cambiarContrasenaPropia(datos) {
		const sesion = obtenerSesion();
		if (!sesion) throw new Error("Debes iniciar sesión.");
		const actual = String(datos?.contrasenaActual || "");
		const nueva = datos?.contrasenaNueva;
		validarContrasena(nueva);
		const registro = db.prepare("SELECT contrasena_hash FROM usuarios WHERE id = ?").get(sesion.id);
		if (!actual || !bcrypt.compareSync(actual, registro.contrasena_hash)) throw new Error("La contraseña actual es incorrecta.");
		if (actual === nueva) throw new Error("La contraseña nueva debe ser diferente.");
		const hash = bcrypt.hashSync(nueva, 12);
		db.prepare("UPDATE usuarios SET contrasena_hash = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?").run(hash, sesion.id);
		registrarActividad(db, sesion.id, "CAMBIAR_CONTRASENA", "El usuario cambió su contraseña desde el perfil.");
		return true;
	}
	function solicitarTokenRecuperacion(datos) {
		const usuarioAdministrador = normalizarUsuario(String(datos?.usuarioAdministrador || ""));
		const passwordAdministrador = String(datos?.contrasenaAdministrador || "");
		const nombreBuscado = String(datos?.nombre || "").trim();
		if (!nombreBuscado || !usuarioAdministrador || !passwordAdministrador) throw new Error("Completa el nombre de la cuenta y las credenciales del administrador.");
		const administrador = db.prepare("SELECT id, contrasena_hash, activo, rol FROM usuarios WHERE usuario = ?").get(usuarioAdministrador);
		if (!administrador || !administrador.activo || administrador.rol !== "administrador" || !bcrypt.compareSync(passwordAdministrador, administrador.contrasena_hash)) throw new Error("No se pudo autorizar la recuperación con esas credenciales de administrador.");
		const encontrados = db.prepare("SELECT id, nombre, usuario FROM usuarios WHERE activo = 1 AND (lower(usuario) = lower(?) OR lower(trim(nombre)) = lower(trim(?)))").all(nombreBuscado, nombreBuscado);
		if (encontrados.length !== 1) throw new Error(encontrados.length ? "Hay varias cuentas con ese nombre. Escribe el usuario exacto." : "No se encontró una cuenta activa con ese usuario o nombre.");
		const objetivo = encontrados[0];
		const token = randomBytes(8).toString("hex").toUpperCase();
		const hash = createHash("sha256").update(token).digest("hex");
		tokensRecuperacion.set(hash, {
			usuarioId: objetivo.id,
			vence: Date.now() + 6e5
		});
		registrarActividad(db, administrador.id, "AUTORIZAR_RECUPERACION", `Autorizó un token de recuperación para ${objetivo.usuario}.`);
		return {
			token,
			nombre: objetivo.nombre,
			venceEnMinutos: 10
		};
	}
	function restablecerConToken(datos) {
		const token = String(datos?.token || "").replace(/\s/g, "").toUpperCase();
		const hash = createHash("sha256").update(token).digest("hex");
		const autorizado = tokensRecuperacion.get(hash);
		if (!autorizado || autorizado.vence < Date.now()) {
			tokensRecuperacion.delete(hash);
			throw new Error("El token no es válido o ya venció. Solicita uno nuevo al administrador.");
		}
		validarContrasena(datos?.contrasenaNueva);
		db.transaction(() => {
			db.prepare("UPDATE usuarios SET contrasena_hash = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?").run(bcrypt.hashSync(datos.contrasenaNueva, 12), autorizado.usuarioId);
			registrarActividad(db, autorizado.usuarioId, "RESTABLECER_CONTRASENA", "Se cambió la contraseña con un token autorizado por administrador.");
		})();
		tokensRecuperacion.delete(hash);
		return true;
	}
	function obtenerSesion() {
		if (!sesionActual) return null;
		const usuario = db.prepare(`
      SELECT id, nombre, usuario, rol, activo
      FROM usuarios
      WHERE id = ?
    `).get(sesionActual.id);
		if (!usuario || !usuario.activo) {
			sesionActual = null;
			return null;
		}
		sesionActual = {
			id: usuario.id,
			nombre: usuario.nombre,
			usuario: usuario.usuario,
			rol: usuario.rol
		};
		return sesionActual;
	}
	function exigirAdministrador() {
		const sesion = obtenerSesion();
		if (!sesion || sesion.rol !== "administrador") throw new Error("No tienes permisos para realizar esta operación.");
		return sesion;
	}
	function listarUsuarios() {
		exigirAdministrador();
		return db.prepare(`
      SELECT
        id,
        nombre,
        usuario,
        rol,
        activo,
        fecha_creacion
      FROM usuarios
      ORDER BY nombre
    `).all();
	}
	function crearUsuario(datos) {
		const administrador = exigirAdministrador();
		const nombre = datos.nombre?.trim();
		const usuario = normalizarUsuario(datos.usuario || "");
		const contrasena = datos.contrasena;
		const rol = datos.rol;
		if (!nombre || !usuario) throw new Error("Completa los datos del usuario.");
		if (!["administrador", "empleado"].includes(rol)) throw new Error("Rol no válido.");
		validarContrasena(contrasena);
		const hash = bcrypt.hashSync(contrasena, 12);
		const resultado = db.prepare(`
      INSERT INTO usuarios (
        nombre,
        usuario,
        contrasena_hash,
        rol
      )
      VALUES (?, ?, ?, ?)
    `).run(nombre, usuario, hash, rol);
		registrarActividad(db, administrador.id, "CREAR_USUARIO", `Se creó el usuario ${usuario}.`);
		return resultado.lastInsertRowid;
	}
	function actualizarUsuario(datos) {
		const administrador = exigirAdministrador();
		const nombre = datos.nombre?.trim();
		const usuario = normalizarUsuario(datos.usuario || "");
		const rol = datos.rol;
		if (!datos.id || !nombre || !usuario) throw new Error("Datos de usuario incompletos.");
		if (!["administrador", "empleado"].includes(rol)) throw new Error("Rol no válido.");
		const existente = db.prepare(`
      SELECT id, rol, activo
      FROM usuarios
      WHERE id = ?
    `).get(datos.id);
		if (!existente) throw new Error("El usuario no existe.");
		if (existente.rol === "administrador" && rol === "empleado" && existente.activo) {
			if (db.prepare(`
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE rol = 'administrador' AND activo = 1
      `).get().total <= 1) throw new Error("No puedes quitar el último administrador activo.");
		}
		db.prepare(`
      UPDATE usuarios
      SET nombre = ?,
          usuario = ?,
          rol = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nombre, usuario, rol, datos.id);
		registrarActividad(db, administrador.id, "ACTUALIZAR_USUARIO", `Se actualizó el usuario ${usuario}.`);
		return true;
	}
	function cambiarContrasena(datos) {
		exigirAdministrador();
		validarContrasena(datos.contrasena);
		const hash = bcrypt.hashSync(datos.contrasena, 12);
		if (!db.prepare(`
      UPDATE usuarios
      SET contrasena_hash = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hash, datos.id).changes) throw new Error("No se encontró el usuario.");
		registrarActividad(db, sesionActual.id, "CAMBIAR_CONTRASENA", `Se cambió la contraseña del usuario ${datos.id}.`);
		return true;
	}
	function cambiarEstado(datos) {
		const administrador = exigirAdministrador();
		if (datos.id === administrador.id && !datos.activo) throw new Error("No puedes desactivar tu propia cuenta.");
		const usuario = db.prepare(`
      SELECT id, rol, activo
      FROM usuarios
      WHERE id = ?
    `).get(datos.id);
		if (!usuario) throw new Error("Usuario no encontrado.");
		if (usuario.rol === "administrador" && usuario.activo && !datos.activo) {
			if (db.prepare(`
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE rol = 'administrador' AND activo = 1
      `).get().total <= 1) throw new Error("Debe existir al menos un administrador activo.");
		}
		db.prepare(`
      UPDATE usuarios
      SET activo = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(datos.activo ? 1 : 0, datos.id);
		registrarActividad(db, administrador.id, "CAMBIAR_ESTADO_USUARIO", `Se cambió el estado del usuario ${datos.id}.`);
		return true;
	}
	return {
		contarUsuarios,
		obtenerEstadoInicial,
		crearAdministradorInicial,
		iniciarSesion,
		cerrarSesion,
		actualizarPerfil,
		cambiarContrasenaPropia,
		solicitarTokenRecuperacion,
		restablecerConToken,
		obtenerSesion,
		listarUsuarios,
		crearUsuario,
		actualizarUsuario,
		cambiarContrasena,
		cambiarEstado
	};
}
// electron/proceso-principal/ipc/modulos/autenticacion/controlador.js
function registrarControladoresAutenticacion(ipcMain, db) {
	const servicio = crearServicioAutenticacion(db);
	ipcMain.handle("autenticacion:estado-inicial", () => {
		return servicio.obtenerEstadoInicial();
	});
	ipcMain.handle("autenticacion:crear-administrador", (_, datos) => {
		return servicio.crearAdministradorInicial(datos);
	});
	ipcMain.handle("autenticacion:iniciar-sesion", (_, datos) => {
		return servicio.iniciarSesion(datos);
	});
	ipcMain.handle("autenticacion:cerrar-sesion", () => {
		return servicio.cerrarSesion();
	});
	ipcMain.handle("autenticacion:obtener-sesion", () => {
		return servicio.obtenerSesion();
	});
	ipcMain.handle("autenticacion:actualizar-perfil", (_evento, datos) => servicio.actualizarPerfil(datos));
	ipcMain.handle("autenticacion:cambiar-contrasena-propia", (_evento, datos) => servicio.cambiarContrasenaPropia(datos));
	ipcMain.handle("autenticacion:solicitar-token-recuperacion", (_evento, datos) => servicio.solicitarTokenRecuperacion(datos));
	ipcMain.handle("autenticacion:restablecer-con-token", (_evento, datos) => servicio.restablecerConToken(datos));
	ipcMain.handle("usuarios:listar", () => {
		return servicio.listarUsuarios();
	});
	ipcMain.handle("usuarios:crear", (_, datos) => {
		return servicio.crearUsuario(datos);
	});
	ipcMain.handle("usuarios:actualizar", (_, datos) => {
		return servicio.actualizarUsuario(datos);
	});
	ipcMain.handle("usuarios:cambiar-contrasena", (_, datos) => {
		return servicio.cambiarContrasena(datos);
	});
	ipcMain.handle("usuarios:cambiar-estado", (_, datos) => {
		return servicio.cambiarEstado(datos);
	});
	return servicio;
}
// electron/proceso-principal/base-datos/modulos/productos/servicio.js
function crearServicioProductos(db, obtenerSesion) {
	function exigirSesion() {
		const sesion = obtenerSesion();
		if (!sesion) throw new Error("Debes iniciar sesión.");
		return sesion;
	}
	function exigirAdministrador() {
		const sesion = exigirSesion();
		if (sesion.rol !== "administrador") throw new Error("No tienes permisos para modificar el catálogo.");
		return sesion;
	}
	function validarNombre(nombre) {
		if (typeof nombre !== "string" || !nombre.trim()) throw new Error("El nombre es obligatorio.");
		return nombre.trim();
	}
	function validarPrecio(precio) {
		const valor = Number(precio);
		if (!Number.isSafeInteger(valor) || valor < 0) throw new Error("El precio debe ser un importe válido en centavos.");
		return valor;
	}
	function listarCategorias() {
		exigirSesion();
		return db.prepare(`
      SELECT *
      FROM categorias
      WHERE activo = 1
      ORDER BY orden, nombre
    `).all();
	}
	function listarTodasCategorias() {
		exigirAdministrador();
		return db.prepare(`
      SELECT *
      FROM categorias
      ORDER BY orden, nombre
    `).all();
	}
	function crearCategoria(datos) {
		exigirAdministrador();
		const nombre = validarNombre(datos.nombre);
		return db.prepare(`
      INSERT INTO categorias (nombre, descripcion, orden)
      VALUES (?, ?, ?)
    `).run(nombre, datos.descripcion?.trim() || null, Number(datos.orden) || 0).lastInsertRowid;
	}
	function actualizarCategoria(datos) {
		exigirAdministrador();
		if (!Number.isInteger(Number(datos.id))) throw new Error("Categoría no válida.");
		const nombre = validarNombre(datos.nombre);
		if (!db.prepare(`
      UPDATE categorias
      SET nombre = ?,
          descripcion = ?,
          orden = ?
      WHERE id = ?
    `).run(nombre, datos.descripcion?.trim() || null, Number(datos.orden) || 0, datos.id).changes) throw new Error("La categoría no existe.");
		return true;
	}
	function cambiarEstadoCategoria(datos) {
		exigirAdministrador();
		if (!db.prepare(`
      UPDATE categorias
      SET activo = ?
      WHERE id = ?
    `).run(datos.activo ? 1 : 0, datos.id).changes) throw new Error("La categoría no existe.");
		return true;
	}
	function listarProductos() {
		exigirSesion();
		return db.prepare(`
      SELECT
        p.*,
        c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 1 AND c.activo = 1
      ORDER BY c.orden, p.orden, p.nombre
    `).all();
	}
	function listarTodosProductos() {
		exigirAdministrador();
		return db.prepare(`
      SELECT
        p.*,
        c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      ORDER BY c.orden, p.orden, p.nombre
    `).all();
	}
	function obtenerProducto(id) {
		exigirSesion();
		const producto = db.prepare(`
      SELECT
        p.*,
        c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = ?
    `).get(id);
		if (!producto) throw new Error("Producto no encontrado.");
		producto.presentaciones = db.prepare(`
      SELECT *
      FROM presentaciones_producto
      WHERE producto_id = ?
      ORDER BY orden, id
    `).all(id);
		producto.adicionales = db.prepare(`
      SELECT
        a.id,
        a.nombre,
        a.precio_centavos,
        a.activo
      FROM producto_adicionales pa
      INNER JOIN adicionales a ON a.id = pa.adicional_id
      WHERE pa.producto_id = ?
      ORDER BY a.nombre
    `).all(id);
		return producto;
	}
	function crearProducto(datos) {
		exigirAdministrador();
		const nombre = validarNombre(datos.nombre);
		const categoriaId = Number(datos.categoria_id);
		if (!db.prepare(`
      SELECT id FROM categorias
      WHERE id = ? AND activo = 1
    `).get(categoriaId)) throw new Error("Selecciona una categoría activa.");
		const requierePresentacion = datos.requiere_presentacion ? 1 : 0;
		const presentaciones = Array.isArray(datos.presentaciones) ? datos.presentaciones : [];
		if (!presentaciones.length) throw new Error("Agrega al menos una presentación y su precio.");
		if (!requierePresentacion && presentaciones.length !== 1) throw new Error("Un producto de presentación única debe tener una sola presentación.");
		const adicionales = Array.isArray(datos.adicionales) ? datos.adicionales.map(Number) : [];
		return db.transaction(() => {
			const productoId = db.prepare(`
        INSERT INTO productos (
          categoria_id,
          nombre,
          descripcion,
          imagen_url,
          requiere_presentacion,
          orden
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(categoriaId, nombre, datos.descripcion?.trim() || null, datos.imagen_url?.trim() || null, requierePresentacion, Number(datos.orden) || 0).lastInsertRowid;
			const insertarPresentacion = db.prepare(`
        INSERT INTO presentaciones_producto (
          producto_id,
          nombre,
          precio_centavos,
          orden
        )
        VALUES (?, ?, ?, ?)
      `);
			presentaciones.forEach((presentacion, indice) => {
				insertarPresentacion.run(productoId, validarNombre(presentacion.nombre), validarPrecio(presentacion.precio_centavos), indice);
			});
			const insertarAdicional = db.prepare(`
        INSERT INTO producto_adicionales (producto_id, adicional_id)
        SELECT ?, id FROM adicionales
        WHERE id = ? AND activo = 1
      `);
			adicionales.forEach((adicionalId) => {
				if (!insertarAdicional.run(productoId, adicionalId).changes) throw new Error("Uno de los adicionales seleccionados no existe o está inactivo.");
			});
			return productoId;
		})();
	}
	function actualizarProducto(datos) {
		exigirAdministrador();
		const nombre = validarNombre(datos.nombre);
		const categoriaId = Number(datos.categoria_id);
		if (!db.prepare(`
      SELECT id FROM productos WHERE id = ?
    `).get(datos.id)) throw new Error("El producto no existe.");
		if (!db.prepare(`
      SELECT id FROM categorias
      WHERE id = ? AND activo = 1
    `).get(categoriaId)) throw new Error("La categoría no está disponible.");
		return db.prepare(`
      UPDATE productos
      SET categoria_id = ?,
          nombre = ?,
          descripcion = ?,
          imagen_url = ?,
          requiere_presentacion = ?,
          orden = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(categoriaId, nombre, datos.descripcion?.trim() || null, datos.imagen_url?.trim() || null, datos.requiere_presentacion ? 1 : 0, Number(datos.orden) || 0, datos.id).changes > 0;
	}
	function cambiarEstadoProducto(datos) {
		exigirAdministrador();
		if (!db.prepare(`
      UPDATE productos
      SET activo = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(datos.activo ? 1 : 0, datos.id).changes) throw new Error("El producto no existe.");
		return true;
	}
	function listarPresentaciones(productoId) {
		exigirSesion();
		return db.prepare(`
      SELECT *
      FROM presentaciones_producto
      WHERE producto_id = ?
      ORDER BY orden, id
    `).all(productoId);
	}
	function crearPresentacion(datos) {
		exigirAdministrador();
		const nombre = validarNombre(datos.nombre);
		const precio = validarPrecio(datos.precio_centavos);
		const producto = db.prepare(`
      SELECT id, requiere_presentacion
      FROM productos
      WHERE id = ? AND activo = 1
    `).get(datos.producto_id);
		if (!producto) throw new Error("Producto no disponible.");
		if (!producto.requiere_presentacion) throw new Error("Este producto utiliza una presentación única.");
		return db.prepare(`
      INSERT INTO presentaciones_producto (
        producto_id,
        nombre,
        precio_centavos,
        orden
      )
      VALUES (?, ?, ?, ?)
    `).run(datos.producto_id, nombre, precio, Number(datos.orden) || 0).lastInsertRowid;
	}
	function actualizarPresentacion(datos) {
		exigirAdministrador();
		if (!db.prepare(`
      UPDATE presentaciones_producto
      SET nombre = ?,
          precio_centavos = ?,
          orden = ?
      WHERE id = ? AND producto_id = ?
    `).run(validarNombre(datos.nombre), validarPrecio(datos.precio_centavos), Number(datos.orden) || 0, datos.id, datos.producto_id).changes) throw new Error("No se encontró la presentación.");
		return true;
	}
	function cambiarEstadoPresentacion(datos) {
		exigirAdministrador();
		if (!db.prepare(`
      UPDATE presentaciones_producto
      SET activo = ?
      WHERE id = ? AND producto_id = ?
    `).run(datos.activo ? 1 : 0, datos.id, datos.producto_id).changes) throw new Error("No se encontró la presentación.");
		return true;
	}
	function listarAdicionales() {
		exigirSesion();
		return db.prepare(`
      SELECT *
      FROM adicionales
      WHERE activo = 1
      ORDER BY nombre
    `).all();
	}
	function listarTodosAdicionales() {
		exigirAdministrador();
		return db.prepare(`
      SELECT *
      FROM adicionales
      ORDER BY nombre
    `).all();
	}
	function crearAdicional(datos) {
		exigirAdministrador();
		return db.prepare(`
      INSERT INTO adicionales (
        nombre,
        descripcion,
        precio_centavos
      )
      VALUES (?, ?, ?)
    `).run(validarNombre(datos.nombre), datos.descripcion?.trim() || null, validarPrecio(datos.precio_centavos)).lastInsertRowid;
	}
	function actualizarAdicional(datos) {
		exigirAdministrador();
		if (!db.prepare(`
      UPDATE adicionales
      SET nombre = ?,
          descripcion = ?,
          precio_centavos = ?
      WHERE id = ?
    `).run(validarNombre(datos.nombre), datos.descripcion?.trim() || null, validarPrecio(datos.precio_centavos), datos.id).changes) throw new Error("El adicional no existe.");
		return true;
	}
	function cambiarEstadoAdicional(datos) {
		exigirAdministrador();
		if (!db.prepare(`
      UPDATE adicionales
      SET activo = ?
      WHERE id = ?
    `).run(datos.activo ? 1 : 0, datos.id).changes) throw new Error("El adicional no existe.");
		return true;
	}
	function actualizarAdicionalesProducto(datos) {
		exigirAdministrador();
		if (!db.prepare(`
      SELECT id FROM productos WHERE id = ?
    `).get(datos.producto_id)) throw new Error("Producto no encontrado.");
		const ids = [...new Set((datos.adicionales || []).map(Number))];
		db.transaction(() => {
			db.prepare(`
        DELETE FROM producto_adicionales
        WHERE producto_id = ?
      `).run(datos.producto_id);
			const insertar = db.prepare(`
        INSERT INTO producto_adicionales (producto_id, adicional_id)
        SELECT ?, id FROM adicionales
        WHERE id = ? AND activo = 1
      `);
			ids.forEach((id) => {
				if (!insertar.run(datos.producto_id, id).changes) throw new Error("Uno de los adicionales no está disponible.");
			});
		})();
		return true;
	}
	return {
		listarCategorias,
		listarTodasCategorias,
		crearCategoria,
		actualizarCategoria,
		cambiarEstadoCategoria,
		listarProductos,
		listarTodosProductos,
		obtenerProducto,
		crearProducto,
		actualizarProducto,
		cambiarEstadoProducto,
		listarPresentaciones,
		crearPresentacion,
		actualizarPresentacion,
		cambiarEstadoPresentacion,
		listarAdicionales,
		listarTodosAdicionales,
		crearAdicional,
		actualizarAdicional,
		cambiarEstadoAdicional,
		actualizarAdicionalesProducto
	};
}
// electron/proceso-principal/ipc/modulos/productos/controlador.js
function registrarControladoresProductos(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioProductos(db, obtenerSesion);
	ipcMain.handle("productos:categorias:listar", () => servicio.listarCategorias());
	ipcMain.handle("productos:categorias:listar-todas", () => servicio.listarTodasCategorias());
	ipcMain.handle("productos:categorias:crear", (_, datos) => servicio.crearCategoria(datos));
	ipcMain.handle("productos:categorias:actualizar", (_, datos) => servicio.actualizarCategoria(datos));
	ipcMain.handle("productos:categorias:estado", (_, datos) => servicio.cambiarEstadoCategoria(datos));
	ipcMain.handle("productos:listar", () => servicio.listarProductos());
	ipcMain.handle("productos:listar-todos", () => servicio.listarTodosProductos());
	ipcMain.handle("productos:obtener", (_, id) => servicio.obtenerProducto(id));
	ipcMain.handle("productos:crear", (_, datos) => servicio.crearProducto(datos));
	ipcMain.handle("productos:actualizar", (_, datos) => servicio.actualizarProducto(datos));
	ipcMain.handle("productos:estado", (_, datos) => servicio.cambiarEstadoProducto(datos));
	ipcMain.handle("productos:presentaciones:listar", (_, id) => servicio.listarPresentaciones(id));
	ipcMain.handle("productos:presentaciones:crear", (_, datos) => servicio.crearPresentacion(datos));
	ipcMain.handle("productos:presentaciones:actualizar", (_, datos) => servicio.actualizarPresentacion(datos));
	ipcMain.handle("productos:presentaciones:estado", (_, datos) => servicio.cambiarEstadoPresentacion(datos));
	ipcMain.handle("productos:adicionales:listar", () => servicio.listarAdicionales());
	ipcMain.handle("productos:adicionales:listar-todos", () => servicio.listarTodosAdicionales());
	ipcMain.handle("productos:adicionales:crear", (_, datos) => servicio.crearAdicional(datos));
	ipcMain.handle("productos:adicionales:actualizar", (_, datos) => servicio.actualizarAdicional(datos));
	ipcMain.handle("productos:adicionales:estado", (_, datos) => servicio.cambiarEstadoAdicional(datos));
	ipcMain.handle("productos:adicionales:asignar", (_, datos) => servicio.actualizarAdicionalesProducto(datos));
	return servicio;
}
// electron/proceso-principal/base-datos/modulos/clientes/servicio.js
function crearServicioClientes(db, obtenerSesion) {
	function exigirSesion() {
		const sesion = obtenerSesion();
		if (!sesion?.id) throw new Error("Debes iniciar sesión para realizar esta operación.");
		return sesion;
	}
	function exigirAdministrador() {
		const sesion = exigirSesion();
		if (sesion.rol !== "administrador") throw new Error("No tienes permisos para realizar esta operación.");
		return sesion;
	}
	function normalizarTexto(valor) {
		return typeof valor === "string" ? valor.trim() : "";
	}
	function validarDatos(datos) {
		const nombre = normalizarTexto(datos.nombre);
		const telefono = normalizarTexto(datos.telefono);
		const direccion = normalizarTexto(datos.direccion);
		const referencias = normalizarTexto(datos.referencias);
		if (nombre.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");
		if (!/^[0-9+\s()-]{7,20}$/.test(telefono)) throw new Error("Ingresa un número de teléfono válido.");
		if (direccion.length > 300) throw new Error("La dirección no puede superar 300 caracteres.");
		if (referencias.length > 500) throw new Error("Las referencias no pueden superar 500 caracteres.");
		return {
			nombre,
			telefono,
			direccion,
			referencias
		};
	}
	function registrarActividad(sesion, accion, descripcion, entidadId) {
		db.prepare(`
      INSERT INTO registro_actividad
        (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
      VALUES (?, ?, 'clientes', ?, 'cliente', ?, datetime('now', 'localtime'))
    `).run(sesion.id, accion, descripcion, entidadId ?? null);
	}
	function listar(filtros = {}) {
		exigirSesion();
		const busqueda = normalizarTexto(filtros.busqueda);
		const incluirInactivos = filtros.incluirInactivos === true;
		let sql = `
      SELECT
        c.id,
        c.nombre,
        c.telefono,
        c.direccion,
        c.referencias,
        c.activo,
        c.fecha_creacion,
        c.fecha_actualizacion,
        (
          SELECT COUNT(*)
          FROM pedidos p
          WHERE p.cliente_id = c.id
            AND p.estado != 'Cancelado'
        ) AS total_pedidos
      FROM clientes c
      WHERE 1 = 1
    `;
		const parametros = [];
		if (!incluirInactivos) sql += " AND c.activo = 1";
		if (busqueda) {
			sql += `
        AND (
          c.nombre LIKE ?
          OR c.telefono LIKE ?
          OR c.direccion LIKE ?
        )
      `;
			const termino = `%${busqueda}%`;
			parametros.push(termino, termino, termino);
		}
		sql += " ORDER BY c.nombre COLLATE NOCASE ASC";
		return db.prepare(sql).all(...parametros);
	}
	function obtenerPorId(id) {
		exigirSesion();
		const cliente = db.prepare(`
      SELECT
        id,
        nombre,
        telefono,
        direccion,
        referencias,
        activo,
        fecha_creacion,
        fecha_actualizacion
      FROM clientes
      WHERE id = ?
    `).get(id);
		if (!cliente) throw new Error("El cliente no existe.");
		return cliente;
	}
	function crear(datos) {
		const sesion = exigirSesion();
		const cliente = validarDatos(datos);
		const resultado = db.prepare(`
      INSERT INTO clientes (
        nombre,
        telefono,
        direccion,
        referencias,
        activo
      )
      VALUES (?, ?, ?, ?, 1)
    `).run(cliente.nombre, cliente.telefono, cliente.direccion || null, cliente.referencias || null);
		registrarActividad(sesion, "crear", `Registró al cliente ${cliente.nombre}.`, resultado.lastInsertRowid);
		return obtenerPorId(resultado.lastInsertRowid);
	}
	function actualizar(id, datos) {
		const sesion = exigirSesion();
		const cliente = validarDatos(datos);
		if (!obtenerPorId(id).activo) throw new Error("No puedes editar un cliente inactivo.");
		db.prepare(`
      UPDATE clientes
      SET
        nombre = ?,
        telefono = ?,
        direccion = ?,
        referencias = ?,
        fecha_actualizacion = datetime('now', 'localtime')
      WHERE id = ?
    `).run(cliente.nombre, cliente.telefono, cliente.direccion || null, cliente.referencias || null, id);
		registrarActividad(sesion, "actualizar", `Actualizó los datos del cliente ${cliente.nombre}.`, id);
		return obtenerPorId(id);
	}
	function cambiarEstado(id, activo) {
		const sesion = exigirAdministrador();
		if (typeof activo !== "boolean") throw new Error("El estado indicado no es válido.");
		const cliente = obtenerPorId(id);
		db.prepare(`
      UPDATE clientes
      SET activo = ?,
          fecha_actualizacion = datetime('now', 'localtime')
      WHERE id = ?
    `).run(activo ? 1 : 0, id);
		registrarActividad(sesion, activo ? "reactivar" : "desactivar", `${activo ? "Reactivó" : "Desactivó"} al cliente ${cliente.nombre}.`, id);
		return obtenerPorId(id);
	}
	function obtenerHistorial(id) {
		exigirSesion();
		const cliente = obtenerPorId(id);
		const pedidos = db.prepare(`
      SELECT
        p.id,
        p.folio,
        p.estado,
        p.tipo,
        p.canal,
        p.subtotal_centavos,
        p.descuento_centavos,
        p.costo_envio_centavos,
        p.total_centavos,
        p.fecha_creacion,
        pa.metodo AS metodo_pago,
        pa.monto AS monto_pagado,
        pa.fecha AS fecha_pago
      FROM pedidos p
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE p.cliente_id = ?
      ORDER BY p.fecha_creacion DESC
      LIMIT 100
    `).all(id);
		const resumen = db.prepare(`
      SELECT
        COUNT(*) AS total_pedidos,
        SUM(CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END) AS pedidos_pagados,
        COALESCE(SUM(CASE WHEN pa.id IS NOT NULL THEN pa.monto ELSE 0 END), 0)
          AS total_comprado_centavos
      FROM pedidos p
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE p.cliente_id = ?
        AND p.estado != 'Cancelado'
    `).get(id);
		return {
			cliente,
			resumen: {
				totalPedidos: resumen.total_pedidos ?? 0,
				pedidosPagados: resumen.pedidos_pagados ?? 0,
				totalCompradoCentavos: resumen.total_comprado_centavos ?? 0
			},
			pedidos
		};
	}
	return {
		listar,
		obtenerPorId,
		crear,
		actualizar,
		cambiarEstado,
		obtenerHistorial
	};
}
// electron/proceso-principal/ipc/modulos/clientes/controlador.js
function registrarControladoresClientes(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioClientes(db, obtenerSesion);
	ipcMain.handle("clientes:listar", (_evento, filtros) => {
		return servicio.listar(filtros);
	});
	ipcMain.handle("clientes:obtener", (_evento, id) => {
		return servicio.obtenerPorId(id);
	});
	ipcMain.handle("clientes:crear", (_evento, datos) => {
		return servicio.crear(datos);
	});
	ipcMain.handle("clientes:actualizar", (_evento, id, datos) => {
		return servicio.actualizar(id, datos);
	});
	ipcMain.handle("clientes:cambiar-estado", (_evento, id, activo) => {
		return servicio.cambiarEstado(id, activo);
	});
	ipcMain.handle("clientes:historial", (_evento, id) => {
		return servicio.obtenerHistorial(id);
	});
	return servicio;
}
// electron/proceso-principal/base-datos/modulos/punto-venta/servicio.js
function crearServicioPuntoVenta(db, obtenerSesion) {
	function exigirSesion() {
		const sesion = obtenerSesion();
		if (!sesion?.id) throw new Error("Debes iniciar sesión.");
		return sesion;
	}
	function obtenerCatalogo() {
		exigirSesion();
		const categorias = db.prepare(`
      SELECT id, nombre, descripcion, orden
      FROM categorias
      WHERE activo = 1
      ORDER BY orden ASC, nombre ASC
    `).all();
		const productos = db.prepare(`
      SELECT
        p.id,
        p.categoria_id,
        p.nombre,
        p.descripcion,
        p.imagen_url,
        p.requiere_presentacion,
        p.orden
      FROM productos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 1 AND c.activo = 1
      ORDER BY c.orden ASC, p.orden ASC, p.nombre ASC
    `).all();
		const presentaciones = db.prepare(`
      SELECT
        id,
        producto_id,
        nombre,
        precio_centavos
      FROM presentaciones_producto
      WHERE activo = 1
      ORDER BY orden ASC, nombre ASC
    `).all();
		const adicionales = db.prepare(`
      SELECT
        a.id,
        a.nombre,
        a.descripcion,
        a.precio_centavos,
        pa.producto_id
      FROM adicionales a
      INNER JOIN producto_adicionales pa
        ON pa.adicional_id = a.id
      WHERE a.activo = 1
      ORDER BY a.nombre ASC
    `).all();
		return {
			categorias,
			productos: productos.map((producto) => ({
				...producto,
				requiere_presentacion: Boolean(producto.requiere_presentacion),
				presentaciones: presentaciones.filter((presentacion) => presentacion.producto_id === producto.id),
				adicionales: adicionales.filter((adicional) => adicional.producto_id === producto.id).map((adicional) => {
					const resultado = { ...adicional };
					delete resultado.producto_id;
					return resultado;
				})
			}))
		};
	}
	function buscarClientes(busqueda) {
		exigirSesion();
		const termino = String(busqueda || "").trim();
		if (termino.length < 2) return [];
		return db.prepare(`
      SELECT id, nombre, telefono, direccion, referencias
      FROM clientes
      WHERE activo = 1
        AND (
          nombre LIKE ?
          OR telefono LIKE ?
        )
      ORDER BY nombre COLLATE NOCASE ASC
      LIMIT 20
    `).all(`%${termino}%`, `%${termino}%`);
	}
	function generarFolio() {
		const fecha = /* @__PURE__ */ new Date();
		const prefijo = `P${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, "0")}${String(fecha.getDate()).padStart(2, "0")}`;
		const ultimo = db.prepare(`
      SELECT folio
      FROM pedidos
      WHERE folio LIKE ?
      ORDER BY id DESC
      LIMIT 1
    `).get(`${prefijo}-%`);
		const consecutivo = ultimo ? Number(ultimo.folio.split("-").at(-1)) + 1 : 1;
		return `${prefijo}-${String(consecutivo).padStart(4, "0")}`;
	}
	function numeroCentavos(valor, campo) {
		if (!Number.isSafeInteger(valor) || valor < 0) throw new Error(`El importe de ${campo} no es válido.`);
		return valor;
	}
	function crearPedido(datos) {
		const sesion = exigirSesion();
		if (!datos || !Array.isArray(datos.productos) || datos.productos.length === 0) throw new Error("Agrega al menos un producto al pedido.");
		const canales = [
			"mostrador",
			"telefono",
			"whatsapp"
		];
		const tipos = ["recoger", "domicilio"];
		if (!canales.includes(datos.canal)) throw new Error("Selecciona un canal válido.");
		if (!tipos.includes(datos.tipo)) throw new Error("Selecciona un tipo de pedido válido.");
		if (datos.tipo === "recoger" && datos.costoEnvioCentavos !== 0) throw new Error("Los pedidos para recoger no tienen costo de envío.");
		const costoEnvio = numeroCentavos(datos.costoEnvioCentavos ?? 0, "envío");
		const esAdministrador = sesion.rol === "administrador";
		const descuentoSolicitado = numeroCentavos(datos.descuentoCentavos ?? 0, "descuento");
		if (descuentoSolicitado > 0 && !esAdministrador) throw new Error("Solo un administrador puede aplicar descuentos.");
		if (descuentoSolicitado > 0 && !String(datos.motivoDescuento || "").trim()) throw new Error("Debes indicar el motivo del descuento.");
		if (datos.tipo === "domicilio" && !datos.clienteId) throw new Error("Selecciona un cliente para el pedido a domicilio.");
		if (datos.clienteId) {
			const cliente = db.prepare(`
        SELECT id, nombre, direccion, referencias, activo
        FROM clientes
        WHERE id = ?
      `).get(datos.clienteId);
			if (!cliente || !cliente.activo) throw new Error("El cliente seleccionado no existe o está inactivo.");
		}
		const direccion = String(datos.direccionEntrega || "").trim();
		const referencias = String(datos.referenciasEntrega || "").trim();
		if (datos.tipo === "domicilio" && !direccion) throw new Error("Escribe la dirección de entrega.");
		const configuracionTiempo = db.prepare(`SELECT valor FROM configuracion
      WHERE clave = 'tiempo_preparacion_minutos'`).get()?.valor;
		const tiempoEstimado = datos.tiempoEstimadoMinutos ?? Number(configuracionTiempo || 20);
		if (tiempoEstimado !== null && (!Number.isInteger(tiempoEstimado) || tiempoEstimado < 1 || tiempoEstimado > 600)) throw new Error("El tiempo estimado debe estar entre 1 y 600 minutos.");
		const notasPedido = String(datos.notas || "").trim();
		if (notasPedido.length > 1e3) throw new Error("Las notas generales son demasiado largas.");
		return db.transaction(() => {
			let subtotal = 0;
			const detalles = datos.productos.map((item) => {
				const productoId = Number(item.productoId);
				const presentacionId = Number(item.presentacionId);
				const cantidad = Number(item.cantidad);
				if (!Number.isInteger(productoId) || !Number.isInteger(presentacionId) || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) throw new Error("Hay un producto con datos inválidos.");
				const producto = db.prepare(`
          SELECT id, nombre, activo, requiere_presentacion
          FROM productos
          WHERE id = ?
        `).get(productoId);
				if (!producto || !producto.activo) throw new Error("Uno de los productos ya no está disponible.");
				const presentacion = db.prepare(`
          SELECT id, producto_id, nombre, precio_centavos, activo
          FROM presentaciones_producto
          WHERE id = ? AND producto_id = ?
        `).get(presentacionId, productoId);
				if (!presentacion || !presentacion.activo) throw new Error(`La presentación de ${producto.nombre} no está disponible.`);
				const adicionalesSolicitados = Array.isArray(item.adicionales) ? item.adicionales : [];
				const adicionalesUnicos = /* @__PURE__ */ new Set();
				const adicionales = adicionalesSolicitados.map((extra) => {
					const adicionalId = Number(extra.id);
					const cantidadExtra = Number(extra.cantidad ?? 1);
					if (!Number.isInteger(adicionalId) || !Number.isInteger(cantidadExtra) || cantidadExtra < 1 || cantidadExtra > 20 || adicionalesUnicos.has(adicionalId)) throw new Error("Hay un adicional inválido o repetido.");
					adicionalesUnicos.add(adicionalId);
					const adicional = db.prepare(`
            SELECT a.id, a.nombre, a.precio_centavos
            FROM adicionales a
            INNER JOIN producto_adicionales pa
              ON pa.adicional_id = a.id
            WHERE a.id = ?
              AND pa.producto_id = ?
              AND a.activo = 1
          `).get(adicionalId, productoId);
					if (!adicional) throw new Error(`El adicional seleccionado para ${producto.nombre} no está disponible.`);
					return {
						...adicional,
						cantidad: cantidadExtra
					};
				});
				const precioAdicionales = adicionales.reduce((total, extra) => total + extra.precio_centavos * extra.cantidad, 0);
				const precioUnitario = presentacion.precio_centavos + precioAdicionales;
				const subtotalDetalle = precioUnitario * cantidad;
				if (!Number.isSafeInteger(subtotalDetalle)) throw new Error("El importe del producto es demasiado grande.");
				subtotal += subtotalDetalle;
				return {
					producto,
					presentacion,
					cantidad,
					precioUnitario,
					subtotalDetalle,
					notas: String(item.notas || "").trim(),
					adicionales
				};
			});
			if (!Number.isSafeInteger(subtotal)) throw new Error("El subtotal del pedido no es válido.");
			if (descuentoSolicitado > subtotal) throw new Error("El descuento no puede superar el subtotal.");
			const total = subtotal - descuentoSolicitado + costoEnvio;
			if (!Number.isSafeInteger(total) || total < 0) throw new Error("El total del pedido no es válido.");
			const folio = generarFolio();
			const pedidoId = db.prepare(`
        INSERT INTO pedidos (
          folio,
          cliente_id,
          usuario_id,
          canal,
          tipo,
          estado,
          subtotal_centavos,
          descuento_centavos,
          motivo_descuento,
          usuario_descuento_id,
          costo_envio_centavos,
          total_centavos,
          notas,
          direccion_entrega,
          referencias_entrega,
          tiempo_estimado_minutos,
          fecha_creacion,
          fecha_actualizacion
        )
        VALUES (
          ?, ?, ?, ?, ?, 'nuevo',
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          datetime('now', 'localtime'),
          datetime('now', 'localtime')
        )
      `).run(folio, datos.clienteId || null, sesion.id, datos.canal, datos.tipo, subtotal, descuentoSolicitado, descuentoSolicitado > 0 ? String(datos.motivoDescuento).trim() : null, descuentoSolicitado > 0 ? sesion.id : null, costoEnvio, total, notasPedido || null, datos.tipo === "domicilio" ? direccion : null, datos.tipo === "domicilio" ? referencias || null : null, tiempoEstimado).lastInsertRowid;
			const insertarDetalle = db.prepare(`
        INSERT INTO pedido_detalles (
          pedido_id,
          producto_id,
          presentacion_id,
          nombre_producto,
          nombre_presentacion,
          cantidad,
          precio_unitario_centavos,
          subtotal_centavos,
          notas
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
			const insertarAdicional = db.prepare(`
        INSERT INTO pedido_detalle_adicionales (
          pedido_detalle_id,
          adicional_id,
          nombre_adicional,
          precio_unitario_centavos,
          cantidad,
          subtotal_centavos
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);
			for (const detalle of detalles) {
				const resultado = insertarDetalle.run(pedidoId, detalle.producto.id, detalle.presentacion.id, detalle.producto.nombre, detalle.presentacion.nombre, detalle.cantidad, detalle.precioUnitario, detalle.subtotalDetalle, detalle.notas || null);
				for (const adicional of detalle.adicionales) insertarAdicional.run(resultado.lastInsertRowid, adicional.id, adicional.nombre, adicional.precio_centavos, adicional.cantidad, adicional.precio_centavos * adicional.cantidad);
			}
			db.prepare(`
        INSERT INTO historial_estados_pedido (
          pedido_id,
          estado_anterior,
          estado_nuevo,
          usuario_id,
          fecha
        )
        VALUES (?, NULL, 'nuevo', ?, datetime('now', 'localtime'))
      `).run(pedidoId, sesion.id);
			db.prepare(`
        INSERT INTO registro_actividad (
          usuario_id,
          accion,
          modulo,
          descripcion,
          entidad,
          entidad_id,
          fecha
        )
        VALUES (?, 'crear', 'punto-venta', ?, 'pedido', ?, datetime('now', 'localtime'))
      `).run(sesion.id, `Creó el pedido ${folio}.`, pedidoId);
			return {
				id: pedidoId,
				folio,
				estado: "nuevo",
				subtotalCentavos: subtotal,
				descuentoCentavos: descuentoSolicitado,
				costoEnvioCentavos: costoEnvio,
				totalCentavos: total
			};
		})();
	}
	return {
		obtenerCatalogo,
		buscarClientes,
		crearPedido
	};
}
// electron/proceso-principal/ipc/modulos/punto-venta/controlador.js
function registrarControladoresPuntoVenta(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioPuntoVenta(db, obtenerSesion);
	ipcMain.handle("punto-venta:catalogo", () => {
		return servicio.obtenerCatalogo();
	});
	ipcMain.handle("punto-venta:buscar-clientes", (_evento, busqueda) => {
		return servicio.buscarClientes(busqueda);
	});
	ipcMain.handle("punto-venta:crear-pedido", (_evento, datos) => {
		return servicio.crearPedido(datos);
	});
	return servicio;
}
// electron/proceso-principal/base-datos/modulos/pedidos/servicio.js
var ESTADOS = [
	"Nuevo",
	"Preparando",
	"En horno",
	"Listo",
	"En reparto",
	"Entregado",
	"Cancelado"
];
var TRANSICIONES = {
	Nuevo: ["Preparando", "Cancelado"],
	Preparando: [
		"En horno",
		"Listo",
		"Cancelado"
	],
	"En horno": ["Listo", "Cancelado"],
	Listo: [
		"En reparto",
		"Entregado",
		"Cancelado"
	],
	"En reparto": ["Entregado", "Cancelado"],
	Entregado: [],
	Cancelado: []
};
var ESTADOS_BD = {
	Nuevo: "nuevo",
	Preparando: "preparando",
	"En horno": "en_horno",
	Listo: "listo",
	"En reparto": "en_reparto",
	Entregado: "entregado",
	Cancelado: "cancelado"
};
var ETIQUETAS_ESTADO = Object.fromEntries(Object.entries(ESTADOS_BD).map(([etiqueta, estado]) => [estado, etiqueta]));
function crearServicioPedidos(db, obtenerSesion) {
	function adaptarPedido(pedido) {
		if (!pedido) return pedido;
		return {
			...pedido,
			estado: ETIQUETAS_ESTADO[pedido.estado] || pedido.estado,
			fecha_inicio_preparacion: pedido.inicio_preparacion ?? pedido.fecha_inicio_preparacion ?? null,
			fecha_entrada_horno: pedido.entrada_horno ?? pedido.fecha_entrada_horno ?? null,
			fecha_salida_reparto: pedido.salida_reparto ?? pedido.fecha_salida_reparto ?? null,
			fecha_cancelacion: pedido.fecha_cancelado ?? pedido.fecha_cancelacion ?? null
		};
	}
	function exigirSesion() {
		const sesion = obtenerSesion();
		if (!sesion?.id) throw new Error("Debes iniciar sesión.");
		return sesion;
	}
	function validarId(id) {
		const numero = Number(id);
		if (!Number.isSafeInteger(numero) || numero <= 0) throw new Error("El identificador del pedido no es válido.");
		return numero;
	}
	function registrarActividad(sesion, accion, descripcion, pedidoId) {
		db.prepare(`
      INSERT INTO registro_actividad (
        usuario_id, accion, modulo, descripcion,
        entidad, entidad_id, fecha
      )
      VALUES (
        ?, ?, 'pedidos', ?, 'pedido', ?,
        datetime('now', 'localtime')
      )
    `).run(sesion.id, accion, descripcion, pedidoId);
	}
	function obtenerPedido(id) {
		exigirSesion();
		const pedidoId = validarId(id);
		const pedido = db.prepare(`
      SELECT
        p.*,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        u.nombre AS empleado_nombre,
        pa.metodo AS metodo_pago,
        pa.monto_centavos AS monto_pagado,
        pa.fecha_pago AS fecha_pago
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE p.id = ?
    `).get(pedidoId);
		if (!pedido) throw new Error("El pedido no existe.");
		const detalles = db.prepare(`
      SELECT *
      FROM pedido_detalles
      WHERE pedido_id = ?
      ORDER BY id ASC
    `).all(pedidoId);
		const consultaAdicionales = db.prepare(`
      SELECT *
      FROM pedido_detalle_adicionales
      WHERE pedido_detalle_id = ?
      ORDER BY id ASC
    `);
		const historial = db.prepare(`
      SELECT
        h.*,
        u.nombre AS usuario_nombre
      FROM historial_estados_pedido h
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.pedido_id = ?
      ORDER BY h.id ASC
    `).all(pedidoId);
		return {
			...adaptarPedido(pedido),
			detalles: detalles.map((detalle) => ({
				...detalle,
				adicionales: consultaAdicionales.all(detalle.id)
			})),
			historial
		};
	}
	function listarPedidos(filtros = {}) {
		exigirSesion();
		const { busqueda = "", estado = "todos", tipo = "todos", fechaDesde = "", fechaHasta = "", limite = 200 } = filtros;
		if (estado !== "todos" && !ESTADOS.includes(estado)) throw new Error("El filtro de estado no es válido.");
		if (![
			"todos",
			"recoger",
			"domicilio"
		].includes(tipo)) throw new Error("El filtro de tipo no es válido.");
		const cantidad = Number(limite);
		if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 500) throw new Error("El límite de resultados no es válido.");
		let sql = `
      SELECT
        p.id,
        p.folio,
        p.cliente_id,
        p.usuario_id,
        p.canal,
        p.tipo,
        p.estado,
        p.total_centavos,
        p.tiempo_estimado_minutos,
        p.inicio_preparacion AS fecha_inicio_preparacion,
        p.entrada_horno AS fecha_entrada_horno,
        p.salida_reparto AS fecha_salida_reparto,
        p.fecha_cancelado AS fecha_cancelacion,
        p.fecha_entregado,
        p.fecha_listo,
        p.fecha_creacion,
        p.fecha_actualizacion,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        u.nombre AS empleado_nombre,
        pa.metodo AS metodo_pago
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE 1 = 1
    `;
		const parametros = [];
		if (estado !== "todos") {
			sql += " AND p.estado = ?";
			parametros.push(ESTADOS_BD[estado]);
		}
		if (tipo !== "todos") {
			sql += " AND p.tipo = ?";
			parametros.push(tipo);
		}
		const termino = String(busqueda).trim();
		if (termino) {
			sql += `
        AND (
          p.folio LIKE ?
          OR c.nombre LIKE ?
          OR c.telefono LIKE ?
        )
      `;
			parametros.push(`%${termino}%`, `%${termino}%`, `%${termino}%`);
		}
		if (fechaDesde) {
			sql += " AND date(p.fecha_creacion) >= date(?)";
			parametros.push(fechaDesde);
		}
		if (fechaHasta) {
			sql += " AND date(p.fecha_creacion) <= date(?)";
			parametros.push(fechaHasta);
		}
		sql += `
      ORDER BY p.fecha_creacion DESC, p.id DESC
      LIMIT ?
    `;
		parametros.push(cantidad);
		return db.prepare(sql).all(...parametros).map(adaptarPedido);
	}
	function cambiarEstado(id, nuevoEstado, motivo = "") {
		const sesion = exigirSesion();
		const pedidoId = validarId(id);
		if (!ESTADOS.includes(nuevoEstado)) throw new Error("El estado solicitado no es válido.");
		const motivoLimpio = String(motivo || "").trim();
		if (motivoLimpio.length > 500) throw new Error("El motivo no puede superar 500 caracteres.");
		return db.transaction(() => {
			const pedido = db.prepare(`
        SELECT *
        FROM pedidos
        WHERE id = ?
      `).get(pedidoId);
			if (!pedido) throw new Error("El pedido no existe.");
			const estadoActual = ETIQUETAS_ESTADO[pedido.estado] || pedido.estado;
			if (!(TRANSICIONES[estadoActual] || []).includes(nuevoEstado)) throw new Error(`No se puede cambiar de "${estadoActual}" a "${nuevoEstado}".`);
			if (nuevoEstado === "Cancelado" && !motivoLimpio) throw new Error("Debes indicar el motivo de cancelación.");
			if (nuevoEstado === "En reparto" && pedido.tipo !== "domicilio") throw new Error("Solo los pedidos a domicilio pueden salir a reparto.");
			if (nuevoEstado === "Entregado" && pedido.tipo === "domicilio" && estadoActual !== "En reparto") throw new Error("El pedido a domicilio debe salir a reparto antes de entregarse.");
			if (nuevoEstado === "Entregado" && pedido.tipo === "recoger" && estadoActual !== "Listo") throw new Error("El pedido debe estar listo antes de entregarse.");
			if (nuevoEstado === "Entregado" && !db.prepare("SELECT id FROM pagos WHERE pedido_id = ?").get(pedidoId)) throw new Error("Registra el pago en Caja para confirmar la entrega.");
			const campoFecha = {
				Preparando: "inicio_preparacion",
				"En horno": "entrada_horno",
				Listo: "fecha_listo",
				"En reparto": "salida_reparto",
				Entregado: "fecha_entregado",
				Cancelado: "fecha_cancelado"
			}[nuevoEstado];
			if (campoFecha) db.prepare(`
          UPDATE pedidos
          SET estado = ?,
              ${campoFecha} = COALESCE(
                ${campoFecha},
                datetime('now', 'localtime')
              ),
              fecha_actualizacion = datetime('now', 'localtime')
          WHERE id = ?
        `).run(ESTADOS_BD[nuevoEstado], pedidoId);
			else db.prepare(`
          UPDATE pedidos
          SET estado = ?,
              fecha_actualizacion = datetime('now', 'localtime')
          WHERE id = ?
        `).run(ESTADOS_BD[nuevoEstado], pedidoId);
			db.prepare(`
        INSERT INTO historial_estados_pedido (
          pedido_id,
          estado_anterior,
          estado_nuevo,
          usuario_id,
          motivo,
          fecha
        )
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(pedidoId, pedido.estado, ESTADOS_BD[nuevoEstado], sesion.id, motivoLimpio || null);
			registrarActividad(sesion, nuevoEstado === "Cancelado" ? "cancelar" : "cambiar_estado", nuevoEstado === "Cancelado" ? `Canceló el pedido ${pedido.folio}. Motivo: ${motivoLimpio}` : `Cambió el pedido ${pedido.folio} de ${estadoActual} a ${nuevoEstado}.`, pedidoId);
			return obtenerPedido(pedidoId);
		})();
	}
	function obtenerResumen() {
		exigirSesion();
		const filas = db.prepare(`
      SELECT estado, COUNT(*) AS cantidad
      FROM pedidos
      GROUP BY estado
    `).all();
		const resumen = Object.fromEntries(ESTADOS.map((estado) => [estado, 0]));
		for (const fila of filas) {
			const etiqueta = ETIQUETAS_ESTADO[fila.estado];
			if (etiqueta) resumen[etiqueta] = fila.cantidad;
		}
		return resumen;
	}
	return {
		listarPedidos,
		obtenerPedido,
		cambiarEstado,
		obtenerResumen
	};
}
// electron/proceso-principal/ipc/modulos/pedidos/controlador.js
function registrarControladoresPedidos(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioPedidos(db, obtenerSesion);
	ipcMain.handle("pedidos:listar", (_evento, filtros) => {
		return servicio.listarPedidos(filtros);
	});
	ipcMain.handle("pedidos:obtener", (_evento, id) => {
		return servicio.obtenerPedido(id);
	});
	ipcMain.handle("pedidos:cambiar-estado", (_evento, id, estado, motivo) => {
		return servicio.cambiarEstado(id, estado, motivo);
	});
	ipcMain.handle("pedidos:resumen", () => {
		return servicio.obtenerResumen();
	});
	return servicio;
}
// electron/proceso-principal/base-datos/modulos/television/servicio.js
function crearServicioTelevision(db, obtenerSesion = () => null) {
	function exigirSesion(esAdministrador = false) {
		const sesion = obtenerSesion();
		if (!sesion?.id) throw new Error("Debes iniciar sesión.");
		if (esAdministrador && sesion.rol !== "administrador") throw new Error("Solo un administrador puede cambiar la música de la TV.");
	}
	function normalizarRuta(ruta) {
		const valor = String(ruta || "");
		if (valor.startsWith("pizzeria-media://")) return valor;
		if (/^[A-Za-z]:[\\/]/.test(valor) || valor.startsWith("/")) return `pizzeria-media://archivo?ruta=${encodeURIComponent(valor)}`;
		if (valor.startsWith("file://")) {
			const rutaLocal = decodeURIComponent(valor.replace(/^file:\/\//, "").replace(/^\/([A-Za-z]:)/, "$1"));
			return `pizzeria-media://archivo?ruta=${encodeURIComponent(rutaLocal)}`;
		}
		return valor.replace(/^file:\/\/(?!\/)([A-Za-z]:\/)/, "file:///$1");
	}
	function listarMultimedia() {
		return db.prepare(`
        SELECT
          id,
          nombre,
          ruta_archivo AS ruta,
          tipo,
          duracion_segundos,
          orden,
          activo,
          fecha_creacion,
          fecha_actualizacion
        FROM multimedia
        ORDER BY orden ASC, id ASC
      `).all().map((elemento) => ({
			...elemento,
			ruta: normalizarRuta(elemento.ruta)
		}));
	}
	function crearMultimedia(datos) {
		const nombre = String(datos?.nombre || "").trim();
		const ruta = String(datos?.ruta || datos?.ruta_archivo || "").trim();
		const tipo = String(datos?.tipo || "");
		const duracion = Number(datos?.duracion_segundos || 10);
		const orden = Number(datos?.orden || 0);
		if (!nombre || !ruta || !["imagen", "video"].includes(tipo)) throw new Error("Los datos de la publicidad no son válidos.");
		if (!Number.isInteger(duracion) || duracion < 3 || duracion > 300) throw new Error("La duración debe estar entre 3 y 300 segundos.");
		return db.prepare(`
        INSERT INTO multimedia (nombre, ruta_archivo, tipo, duracion_segundos, orden)
        VALUES (?, ?, ?, ?, ?)
      `).run(nombre, ruta, tipo, duracion, Number.isInteger(orden) ? orden : 0);
	}
	function actualizarMultimedia(id, datos) {
		const multimediaId = Number(id);
		const nombre = String(datos?.nombre || "").trim();
		const duracion = Number(datos?.duracion_segundos || 10);
		if (!Number.isSafeInteger(multimediaId) || multimediaId <= 0 || !nombre) throw new Error("La publicidad no es válida.");
		db.prepare(`
      UPDATE multimedia
      SET nombre = ?, duracion_segundos = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nombre, duracion, multimediaId);
	}
	function cambiarEstadoMultimedia(id, activo) {
		db.prepare(`
      UPDATE multimedia
      SET activo = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(activo ? 1 : 0, Number(id));
	}
	function eliminarMultimedia(id) {
		db.prepare("DELETE FROM multimedia WHERE id = ?").run(Number(id));
	}
	function obtenerMusica() {
		exigirSesion();
		const valores = db.prepare(`SELECT clave, valor FROM configuracion
      WHERE clave IN ('television_musica_ruta', 'television_musica_nombre', 'television_musica_volumen')`).all();
		const datos = Object.fromEntries(valores.map(({ clave, valor }) => [clave, valor]));
		return {
			nombre: datos.television_musica_nombre || "",
			ruta: datos.television_musica_ruta ? normalizarRuta(datos.television_musica_ruta) : "",
			volumen: Number(datos.television_musica_volumen ?? 35)
		};
	}
	function guardarVolumenMusica(valor) {
		exigirSesion(true);
		const volumen = Number(valor);
		if (!Number.isInteger(volumen) || volumen < 0 || volumen > 100) throw new Error("El volumen debe estar entre 0 y 100.");
		db.prepare(`INSERT INTO configuracion (clave, valor, descripcion)
      VALUES ('television_musica_volumen', ?, 'Volumen de la música de la TV de promociones')
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor,
      descripcion = excluded.descripcion, actualizado_en = CURRENT_TIMESTAMP`).run(String(volumen));
		return obtenerMusica();
	}
	function guardarMusica({ ruta, nombre }) {
		exigirSesion(true);
		const rutaValida = String(ruta || "").trim();
		const nombreValido = String(nombre || "").trim();
		if (!rutaValida || !nombreValido || nombreValido.length > 180) throw new Error("El archivo de música no es válido.");
		const guardar = db.prepare(`INSERT INTO configuracion (clave, valor, descripcion)
      VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor,
      descripcion = excluded.descripcion, actualizado_en = CURRENT_TIMESTAMP`);
		db.transaction(() => {
			guardar.run("television_musica_ruta", rutaValida, "Archivo de música ambiental para la pantalla de TV");
			guardar.run("television_musica_nombre", nombreValido, "Nombre del archivo de música ambiental para la TV");
		})();
		return obtenerMusica();
	}
	function quitarMusica() {
		exigirSesion(true);
		db.prepare("DELETE FROM configuracion WHERE clave IN ('television_musica_ruta', 'television_musica_nombre')").run();
	}
	return {
		listarMultimedia,
		crearMultimedia,
		actualizarMultimedia,
		cambiarEstadoMultimedia,
		eliminarMultimedia,
		obtenerMusica,
		guardarMusica,
		guardarVolumenMusica,
		quitarMusica
	};
}
// electron/proceso-principal/ventanas/ventana-tv.js
var ventanaTV = null;
function obtenerPantallaSecundaria(displayId) {
	const principal = screen.getPrimaryDisplay();
	if (displayId) return screen.getAllDisplays().find((pantalla) => String(pantalla.id) === String(displayId));
	return screen.getAllDisplays().find((pantalla) => pantalla.id !== principal.id);
}
function cargarPantallaTV(ventana) {
	if (process.env.ELECTRON_RENDERER_URL) return ventana.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/pantalla-tv`);
	else return ventana.loadFile(join(__dirname, "../../renderer/index.html"), { hash: "/pantalla-tv" });
}
function listarPantallas() {
	const principal = screen.getPrimaryDisplay();
	return screen.getAllDisplays().map((pantalla, indice) => ({
		id: String(pantalla.id),
		nombre: pantalla.id === principal.id ? "Pantalla principal" : `Pantalla externa ${indice}`,
		principal: pantalla.id === principal.id,
		ancho: pantalla.bounds.width,
		alto: pantalla.bounds.height
	}));
}
async function crearVentanaTV(displayId) {
	if (ventanaTV && !ventanaTV.isDestroyed()) {
		const pantalla = obtenerPantallaSecundaria(displayId);
		if (pantalla) {
			ventanaTV.setBounds(pantalla.bounds);
			ventanaTV.setFullScreen(true);
		}
		ventanaTV.show();
		ventanaTV.focus();
		return ventanaTV;
	}
	const pantalla = obtenerPantallaSecundaria(displayId);
	if (!pantalla) throw new Error("No se detectó una pantalla externa. Conecta HDMI o usa Win + K para conectar la TV.");
	const { x, y, width, height } = pantalla.bounds;
	ventanaTV = new BrowserWindow({
		x,
		y,
		width,
		height,
		show: false,
		frame: false,
		fullscreen: true,
		autoHideMenuBar: true,
		backgroundColor: "#020617",
		webPreferences: {
			preload: join(__dirname, "../preload/index.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true
		}
	});
	ventanaTV.webContents.on("did-fail-load", (_evento, codigo, descripcion) => {
		console.error(`No se pudo cargar la pantalla TV (${codigo}): ${descripcion}`);
	});
	ventanaTV.webContents.on("console-message", (_evento, nivel, mensaje) => {
		console.log(`[TV] ${mensaje}`);
	});
	ventanaTV.once("ready-to-show", () => {
		ventanaTV.show();
	});
	await cargarPantallaTV(ventanaTV);
	ventanaTV.setBounds(pantalla.bounds);
	ventanaTV.setFullScreen(true);
	ventanaTV.show();
	ventanaTV.on("closed", () => {
		ventanaTV = null;
	});
	console.log("Ventana de TV creada correctamente.");
	return ventanaTV;
}
function cerrarVentanaTV() {
	if (ventanaTV && !ventanaTV.isDestroyed()) ventanaTV.close();
}
// electron/proceso-principal/ventanas/ventana-produccion.js
var ventanaProduccion = null;
function obtenerPantalla(displayId) {
	const principal = screen.getPrimaryDisplay();
	if (displayId) return screen.getAllDisplays().find((pantalla) => String(pantalla.id) === String(displayId));
	return screen.getAllDisplays().find((pantalla) => pantalla.id !== principal.id);
}
function cargarPantalla(ventana) {
	if (process.env.ELECTRON_RENDERER_URL) return ventana.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/pantalla-produccion`);
	return ventana.loadFile(join(__dirname, "../../renderer/index.html"), { hash: "/pantalla-produccion" });
}
async function abrirVentanaProduccion(displayId) {
	const pantalla = obtenerPantalla(displayId);
	if (!pantalla) throw new Error("Conecta una segunda pantalla para proyectar producción.");
	if (ventanaProduccion && !ventanaProduccion.isDestroyed()) {
		ventanaProduccion.setBounds(pantalla.bounds);
		ventanaProduccion.setFullScreen(true);
		ventanaProduccion.show();
		ventanaProduccion.focus();
		return ventanaProduccion;
	}
	ventanaProduccion = new BrowserWindow({
		...pantalla.bounds,
		show: false,
		frame: false,
		fullscreen: true,
		autoHideMenuBar: true,
		backgroundColor: "#080b12",
		webPreferences: {
			preload: join(__dirname, "../preload/index.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true
		}
	});
	ventanaProduccion.once("ready-to-show", () => ventanaProduccion?.show());
	ventanaProduccion.on("closed", () => {
		ventanaProduccion = null;
	});
	await cargarPantalla(ventanaProduccion);
	ventanaProduccion.setBounds(pantalla.bounds);
	ventanaProduccion.setFullScreen(true);
	ventanaProduccion.show();
	return ventanaProduccion;
}
function cerrarVentanaProduccion() {
	if (ventanaProduccion && !ventanaProduccion.isDestroyed()) ventanaProduccion.close();
}
// electron/proceso-principal/ipc/modulos/television/controlador.js
function registrarControladoresTelevision(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioTelevision(db, obtenerSesion);
	ipcMain.handle("television:importar-archivo", async (_evento, archivo) => {
		const nombre = basename(String(archivo?.nombre || "archivo"));
		const extension = extname(nombre).toLowerCase();
		if (!archivo?.datos || ![
			".jpg",
			".jpeg",
			".png",
			".webp",
			".mp4",
			".webm",
			".mov"
		].includes(extension)) throw new Error("Selecciona una imagen o video compatible.");
		const carpeta = join(app.getPath("userData"), "publicidad");
		await mkdir(carpeta, { recursive: true });
		const nombreSeguro = `${Date.now()}-${nombre.replace(/[^\w.-]/g, "_")}`;
		const destino = join(carpeta, nombreSeguro);
		await writeFile(destino, Buffer$1.from(archivo.datos));
		return { ruta: `pizzeria-media://archivo?ruta=${encodeURIComponent(destino)}` };
	});
	ipcMain.handle("television:listar-multimedia", () => servicio.listarMultimedia());
	ipcMain.handle("television:crear-multimedia", (_evento, datos) => servicio.crearMultimedia(datos));
	ipcMain.handle("television:actualizar-multimedia", (_evento, id, datos) => servicio.actualizarMultimedia(id, datos));
	ipcMain.handle("television:cambiar-estado", (_evento, id, activo) => servicio.cambiarEstadoMultimedia(id, activo));
	ipcMain.handle("television:eliminar-multimedia", (_evento, id) => servicio.eliminarMultimedia(id));
	ipcMain.handle("television:obtener-musica", () => servicio.obtenerMusica());
	ipcMain.handle("television:guardar-volumen-musica", (_evento, volumen) => servicio.guardarVolumenMusica(volumen));
	ipcMain.handle("television:guardar-musica", async (_evento, archivo) => {
		if (obtenerSesion()?.rol !== "administrador") throw new Error("Solo un administrador puede agregar música a la TV.");
		const nombre = basename(String(archivo?.nombre || "musica"));
		const extension = extname(nombre).toLowerCase();
		const permitidas = [
			".mp3",
			".wav",
			".ogg",
			".m4a"
		];
		const datos = archivo?.datos;
		if (!datos || !permitidas.includes(extension)) throw new Error("Selecciona música MP3, WAV, OGG o M4A.");
		const buffer = Buffer$1.from(datos);
		if (buffer.length > 41943040) throw new Error("La música no puede superar 40 MB.");
		const carpeta = join(app.getPath("userData"), "publicidad", "musica");
		await mkdir(carpeta, { recursive: true });
		const nombreSeguro = `${Date.now()}-${nombre.replace(/[^\w.-]/g, "_")}`;
		const destino = join(carpeta, nombreSeguro);
		await writeFile(destino, buffer);
		return servicio.guardarMusica({
			ruta: destino,
			nombre
		});
	});
	ipcMain.handle("television:quitar-musica", () => servicio.quitarMusica());
	ipcMain.handle("television:listar-pantallas", () => listarPantallas());
	ipcMain.handle("television:abrir-ventana", async (_evento, displayId) => {
		await crearVentanaTV(displayId);
		return true;
	});
	ipcMain.handle("television:cerrar-ventana", () => {
		cerrarVentanaTV();
		return true;
	});
	ipcMain.handle("produccion:abrir-ventana", async (_evento, displayId) => {
		if (!obtenerSesion()?.id) throw new Error("Debes iniciar sesión para proyectar producción.");
		await abrirVentanaProduccion(displayId);
		return true;
	});
	ipcMain.handle("produccion:cerrar-ventana", () => {
		cerrarVentanaProduccion();
		return true;
	});
}
// electron/proceso-principal/base-datos/modulos/caja/servicio.js
function crearServicioCaja(db, obtenerSesion) {
	function exigirSesion() {
		const sesion = obtenerSesion();
		if (!sesion?.id) throw new Error("Debes iniciar sesión.");
		return sesion;
	}
	function numeroCentavos(valor, campo, permitirCero = false) {
		const numero = Number(valor);
		if (!Number.isSafeInteger(numero) || (permitirCero ? numero < 0 : numero <= 0)) throw new Error(`El importe de ${campo} no es válido.`);
		return numero;
	}
	function obtenerSesionAbierta() {
		return db.prepare("SELECT * FROM sesiones_caja WHERE estado = 'abierta'").get();
	}
	function obtenerBloqueosCierre() {
		return {
			pedidosSinPagar: db.prepare(`
      SELECT COUNT(*) AS cantidad FROM pedidos p
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE pa.id IS NULL AND p.estado != 'cancelado'
    `).get().cantidad,
			pedidosEnProceso: db.prepare(`
      SELECT p.id, p.folio, p.estado, c.nombre AS cliente_nombre
      FROM pedidos p LEFT JOIN clientes c ON c.id = p.cliente_id
      WHERE p.estado IN ('nuevo', 'preparando', 'en_horno')
      ORDER BY p.fecha_creacion ASC, p.id ASC LIMIT 100
    `).all(),
			pedidosEnProcesoCantidad: db.prepare(`
      SELECT COUNT(*) AS cantidad FROM pedidos
      WHERE estado IN ('nuevo', 'preparando', 'en_horno')
    `).get().cantidad
		};
	}
	function obtenerResumenSesion(sesion) {
		const pagos = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN metodo = 'efectivo' THEN monto_centavos ELSE 0 END), 0) AS pagos_efectivo,
        COALESCE(SUM(CASE WHEN metodo = 'transferencia' THEN monto_centavos ELSE 0 END), 0) AS pagos_transferencia
      FROM pagos WHERE sesion_caja_id = ?
    `).get(sesion.id);
		const movimientos = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN metodo = 'efectivo' AND tipo = 'ingreso' THEN monto_centavos WHEN metodo = 'efectivo' AND tipo IN ('gasto', 'retiro') THEN -monto_centavos ELSE 0 END), 0) AS movimientos_efectivo,
        COALESCE(SUM(CASE WHEN metodo = 'transferencia' AND tipo = 'ingreso' THEN monto_centavos WHEN metodo = 'transferencia' AND tipo IN ('gasto', 'retiro') THEN -monto_centavos ELSE 0 END), 0) AS movimientos_transferencia
      FROM movimientos_caja WHERE sesion_caja_id = ?
    `).get(sesion.id);
		const efectivoEsperado = sesion.monto_inicial_centavos + pagos.pagos_efectivo + movimientos.movimientos_efectivo;
		const transferencias = pagos.pagos_transferencia + movimientos.movimientos_transferencia;
		return {
			...sesion,
			efectivo_esperado_centavos: efectivoEsperado,
			transferencias_centavos: transferencias,
			pagos_efectivo_centavos: pagos.pagos_efectivo,
			movimientos_efectivo_centavos: movimientos.movimientos_efectivo
		};
	}
	function obtenerEstado() {
		exigirSesion();
		const sesion = obtenerSesionAbierta();
		const pendientes = db.prepare(`
      SELECT p.id, p.folio, p.tipo, p.estado, p.total_centavos, p.fecha_creacion,
        c.nombre AS cliente_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE pa.id IS NULL AND p.estado != 'cancelado'
      ORDER BY p.fecha_creacion ASC, p.id ASC
      LIMIT 200
    `).all();
		const movimientos = sesion ? db.prepare(`
      SELECT m.id, m.tipo, m.metodo, m.concepto, m.monto_centavos, m.fecha,
        u.nombre AS usuario_nombre
      FROM movimientos_caja m
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.sesion_caja_id = ?
      ORDER BY m.id DESC LIMIT 50
    `).all(sesion.id) : [];
		const pagos = sesion ? db.prepare(`
      SELECT pa.id, pa.metodo, pa.monto_centavos, pa.monto_recibido_centavos, pa.cambio_centavos, pa.referencia, pa.fecha_pago,
        p.folio, u.nombre AS usuario_nombre
      FROM pagos pa
      INNER JOIN pedidos p ON p.id = pa.pedido_id
      LEFT JOIN usuarios u ON u.id = pa.usuario_id
      WHERE pa.sesion_caja_id = ?
      ORDER BY pa.id DESC LIMIT 50
    `).all(sesion.id) : [];
		const bloqueos = obtenerBloqueosCierre();
		return {
			sesion: sesion ? obtenerResumenSesion(sesion) : null,
			pendientes,
			...bloqueos,
			movimientos,
			pagos
		};
	}
	function abrir(datos) {
		const usuario = exigirSesion();
		const monto = numeroCentavos(datos?.montoInicialCentavos ?? 0, "inicial", true);
		db.transaction(() => {
			if (obtenerSesionAbierta()) throw new Error("Ya existe una caja abierta.");
			const resultado = db.prepare(`
        INSERT INTO sesiones_caja (usuario_apertura_id, monto_inicial_centavos, fecha_apertura)
        VALUES (?, ?, datetime('now', 'localtime'))
      `).run(usuario.id, monto);
			db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, 'abrir', 'caja', ?, 'sesion_caja', ?, datetime('now', 'localtime'))`).run(usuario.id, `Abrió caja con ${monto} centavos.`, resultado.lastInsertRowid);
			return resultado.lastInsertRowid;
		})();
		return obtenerEstado();
	}
	function registrarPago(datos) {
		const usuario = exigirSesion();
		const pedidoId = Number(datos?.pedidoId);
		const metodo = String(datos?.metodo || "");
		const referencia = String(datos?.referencia || "").trim();
		const montoRecibidoEnviado = datos?.montoRecibidoCentavos;
		if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) throw new Error("El pedido no es válido.");
		if (!["efectivo", "transferencia"].includes(metodo)) throw new Error("Selecciona un método de pago válido.");
		if (referencia.length > 100) throw new Error("La referencia no puede superar 100 caracteres.");
		db.transaction(() => {
			const sesion = obtenerSesionAbierta();
			if (!sesion) throw new Error("Abre la caja antes de registrar pagos.");
			const pedido = db.prepare("SELECT id, folio, tipo, total_centavos, estado FROM pedidos WHERE id = ?").get(pedidoId);
			if (!pedido || pedido.estado === "cancelado") throw new Error("El pedido no existe o fue cancelado.");
			const estadoListoParaCobro = pedido.tipo === "domicilio" ? "en_reparto" : "listo";
			if (pedido.estado !== estadoListoParaCobro && pedido.estado !== "entregado") throw new Error(pedido.tipo === "domicilio" ? "El pedido a domicilio debe salir a reparto antes de cobrarlo." : "El pedido debe estar listo antes de cobrarlo.");
			if (db.prepare("SELECT id FROM pagos WHERE pedido_id = ?").get(pedidoId)) throw new Error("Este pedido ya tiene un pago registrado.");
			const recibido = metodo === "efectivo" ? numeroCentavos(montoRecibidoEnviado, "recibido") : pedido.total_centavos;
			if (metodo === "efectivo" && recibido < pedido.total_centavos) throw new Error("El pago no alcanza el total. No se registró ningún cobro.");
			const cambio = metodo === "efectivo" ? recibido - pedido.total_centavos : 0;
			db.prepare(`INSERT INTO pagos (pedido_id, sesion_caja_id, usuario_id, metodo, monto_centavos, referencia, fecha_pago, monto_recibido_centavos, cambio_centavos)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?, ?)`).run(pedidoId, sesion.id, usuario.id, metodo, pedido.total_centavos, referencia || null, recibido, cambio);
			if (pedido.estado !== "entregado") {
				db.prepare(`UPDATE pedidos SET estado = 'entregado', fecha_entregado = datetime('now', 'localtime'),
          fecha_actualizacion = datetime('now', 'localtime') WHERE id = ?`).run(pedidoId);
				db.prepare(`INSERT INTO historial_estados_pedido
          (pedido_id, estado_anterior, estado_nuevo, usuario_id, fecha)
          VALUES (?, ?, 'entregado', ?, datetime('now', 'localtime'))`).run(pedidoId, estadoListoParaCobro, usuario.id);
			}
			db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, 'registrar_pago', 'caja', ?, 'pedido', ?, datetime('now', 'localtime'))`).run(usuario.id, `Registró pago ${metodo} y confirmó la entrega del pedido ${pedido.folio}.`, pedidoId);
		})();
		return obtenerEstado();
	}
	function registrarMovimiento(datos) {
		const usuario = exigirSesion();
		const tipo = String(datos?.tipo || "");
		const metodo = String(datos?.metodo || "");
		const concepto = String(datos?.concepto || "").trim();
		const monto = numeroCentavos(datos?.montoCentavos, "movimiento");
		if (![
			"gasto",
			"retiro",
			"ingreso"
		].includes(tipo)) throw new Error("El tipo de movimiento no es válido.");
		if (!["efectivo", "transferencia"].includes(metodo)) throw new Error("El método del movimiento no es válido.");
		if (!concepto || concepto.length > 200) throw new Error("Escribe un concepto de hasta 200 caracteres.");
		db.transaction(() => {
			const sesion = obtenerSesionAbierta();
			if (!sesion) throw new Error("Abre la caja antes de registrar movimientos.");
			if (tipo !== "ingreso" && metodo === "efectivo") {
				const resumen = obtenerResumenSesion(sesion);
				if (monto > resumen.efectivo_esperado_centavos) throw new Error("El movimiento supera el efectivo disponible en caja.");
			}
			if (tipo !== "ingreso" && metodo === "transferencia") {
				const resumen = obtenerResumenSesion(sesion);
				if (monto > resumen.transferencias_centavos) throw new Error("El movimiento supera el saldo disponible de transferencias.");
			}
			db.prepare(`INSERT INTO movimientos_caja (sesion_caja_id, usuario_id, tipo, metodo, concepto, monto_centavos, fecha)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`).run(sesion.id, usuario.id, tipo, metodo, concepto, monto);
			db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, ?, 'caja', ?, 'sesion_caja', ?, datetime('now', 'localtime'))`).run(usuario.id, tipo, `${tipo} de ${monto} centavos: ${concepto}`, sesion.id);
		})();
		return obtenerEstado();
	}
	function cerrar(datos) {
		const usuario = exigirSesion();
		const contado = numeroCentavos(datos?.efectivoContadoCentavos, "efectivo contado", true);
		const observaciones = String(datos?.observaciones || "").trim();
		if (observaciones.length > 500) throw new Error("Las observaciones no pueden superar 500 caracteres.");
		const ejecutar = db.transaction(() => {
			const sesion = obtenerSesionAbierta();
			if (!sesion) throw new Error("No hay una caja abierta para cerrar.");
			const bloqueos = obtenerBloqueosCierre();
			if (bloqueos.pedidosEnProcesoCantidad > 0) throw new Error(`No puedes cerrar la caja: hay ${bloqueos.pedidosEnProcesoCantidad} ${bloqueos.pedidosEnProcesoCantidad === 1 ? "pedido activo en cocina" : "pedidos activos en cocina"}. Termínalos o cancélalos antes del corte.`);
			if (bloqueos.pedidosSinPagar > 0) throw new Error(`No puedes cerrar la caja: hay ${bloqueos.pedidosSinPagar} ${bloqueos.pedidosSinPagar === 1 ? "pedido sin pagar" : "pedidos sin pagar"}. Cobra los pedidos pendientes antes de hacer el corte.`);
			const resumen = obtenerResumenSesion(sesion);
			const diferencia = contado - resumen.efectivo_esperado_centavos;
			db.prepare(`UPDATE sesiones_caja SET estado = 'cerrada', fecha_cierre = datetime('now', 'localtime'),
        usuario_cierre_id = ?, efectivo_esperado_centavos = ?, transferencias_centavos = ?,
        efectivo_contado_centavos = ?, diferencia_centavos = ?, observaciones = ? WHERE id = ?`).run(usuario.id, resumen.efectivo_esperado_centavos, resumen.transferencias_centavos, contado, diferencia, observaciones || null, sesion.id);
			db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, 'cerrar', 'caja', ?, 'sesion_caja', ?, datetime('now', 'localtime'))`).run(usuario.id, `Cerró caja. Diferencia: ${diferencia} centavos.`, sesion.id);
			return {
				efectivoEsperadoCentavos: resumen.efectivo_esperado_centavos,
				efectivoContadoCentavos: contado,
				transferenciasCentavos: resumen.transferencias_centavos,
				diferenciaCentavos: diferencia
			};
		});
		return {
			...obtenerEstado(),
			cierre: ejecutar()
		};
	}
	return {
		obtenerEstado,
		obtenerBloqueosCierre,
		abrir,
		registrarPago,
		registrarMovimiento,
		cerrar
	};
}
// electron/proceso-principal/ipc/modulos/caja/controlador.js
function registrarControladoresCaja(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioCaja(db, obtenerSesion);
	ipcMain.handle("caja:estado", () => servicio.obtenerEstado());
	ipcMain.handle("caja:validar-cierre", () => servicio.obtenerBloqueosCierre());
	ipcMain.handle("caja:abrir", (_evento, datos) => servicio.abrir(datos));
	ipcMain.handle("caja:registrar-pago", (_evento, datos) => servicio.registrarPago(datos));
	ipcMain.handle("caja:registrar-movimiento", (_evento, datos) => servicio.registrarMovimiento(datos));
	ipcMain.handle("caja:cerrar", (_evento, datos) => servicio.cerrar(datos));
}
// electron/proceso-principal/base-datos/modulos/reportes/servicio.js
function crearServicioReportes(db, obtenerSesion) {
	function exigirSesion() {
		if (!obtenerSesion()?.id) throw new Error("Debes iniciar sesión.");
	}
	function validarFecha(fecha, campo) {
		if (!fecha) return null;
		if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error(`La fecha ${campo} no es válida.`);
		const parsed = /* @__PURE__ */ new Date(`${fecha}T00:00:00Z`);
		if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) throw new Error(`La fecha ${campo} no es válida.`);
		return fecha;
	}
	function obtenerResumen(filtros = {}) {
		exigirSesion();
		const desde = validarFecha(filtros.desde, "inicial");
		const hasta = validarFecha(filtros.hasta, "final");
		if (desde && hasta && desde > hasta) throw new Error("La fecha inicial debe ser anterior a la final.");
		const wherePago = [];
		const paramsPago = [];
		if (desde) {
			wherePago.push("date(pa.fecha_pago) >= date(?)");
			paramsPago.push(desde);
		}
		if (hasta) {
			wherePago.push("date(pa.fecha_pago) <= date(?)");
			paramsPago.push(hasta);
		}
		const wherePedido = [];
		const paramsPedido = [];
		if (desde) {
			wherePedido.push("date(p.fecha_creacion) >= date(?)");
			paramsPedido.push(desde);
		}
		if (hasta) {
			wherePedido.push("date(p.fecha_creacion) <= date(?)");
			paramsPedido.push(hasta);
		}
		const pagoWhere = wherePago.length ? `WHERE ${wherePago.join(" AND ")}` : "";
		const pedidoWhere = wherePedido.length ? `WHERE ${wherePedido.join(" AND ")}` : "";
		const pagos = db.prepare(`
      SELECT COUNT(*) AS cantidad_pagos, COALESCE(SUM(monto_centavos), 0) AS ventas_centavos,
        COALESCE(SUM(CASE WHEN metodo = 'efectivo' THEN monto_centavos ELSE 0 END), 0) AS efectivo_centavos,
        COALESCE(SUM(CASE WHEN metodo = 'transferencia' THEN monto_centavos ELSE 0 END), 0) AS transferencia_centavos
      FROM pagos pa ${pagoWhere}
    `).get(...paramsPago);
		const pedidos = db.prepare(`
      SELECT COUNT(*) AS cantidad,
        SUM(CASE WHEN p.estado = 'cancelado' THEN 1 ELSE 0 END) AS cancelados,
        SUM(CASE WHEN p.estado NOT IN ('cancelado', 'entregado') THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN p.estado IN ('preparando', 'en_horno') THEN 1 ELSE 0 END) AS preparando,
        AVG(CASE WHEN p.inicio_preparacion IS NOT NULL AND p.fecha_listo IS NOT NULL
          THEN (julianday(p.fecha_listo) - julianday(p.inicio_preparacion)) * 1440 END) AS promedio_preparacion_minutos,
        SUM(CASE WHEN p.inicio_preparacion IS NOT NULL AND p.tiempo_estimado_minutos IS NOT NULL
          AND p.estado IN ('listo', 'en_reparto', 'entregado')
          AND (julianday(COALESCE(p.fecha_listo, p.fecha_entregado)) - julianday(p.inicio_preparacion)) * 1440 > p.tiempo_estimado_minutos
          THEN 1 ELSE 0 END) AS retrasados
      FROM pedidos p ${pedidoWhere}
    `).get(...paramsPedido);
		const metodos = db.prepare(`
      SELECT metodo, COUNT(*) AS cantidad, COALESCE(SUM(monto_centavos), 0) AS total_centavos
      FROM pagos pa ${pagoWhere} GROUP BY metodo ORDER BY total_centavos DESC
    `).all(...paramsPago);
		const productos = db.prepare(`
      SELECT d.nombre_producto, SUM(d.cantidad) AS unidades,
        SUM(d.subtotal_centavos) AS ventas_centavos
      FROM pedido_detalles d INNER JOIN pedidos p ON p.id = d.pedido_id
      ${pedidoWhere ? `${pedidoWhere} AND` : "WHERE"} p.estado != 'cancelado'
      GROUP BY d.nombre_producto ORDER BY unidades DESC, ventas_centavos DESC LIMIT 10
    `).all(...paramsPedido);
		const cancelaciones = db.prepare(`
      SELECT h.motivo, COUNT(*) AS cantidad
      FROM historial_estados_pedido h INNER JOIN pedidos p ON p.id = h.pedido_id
      ${pedidoWhere ? `${pedidoWhere} AND` : "WHERE"} h.estado_nuevo = 'cancelado'
      GROUP BY h.motivo ORDER BY cantidad DESC LIMIT 10
    `).all(...paramsPedido);
		const movimientos = db.prepare(`
      SELECT m.tipo, m.metodo, COUNT(*) AS cantidad, COALESCE(SUM(m.monto_centavos), 0) AS total_centavos
      FROM movimientos_caja m INNER JOIN sesiones_caja s ON s.id = m.sesion_caja_id
      WHERE (? IS NULL OR date(m.fecha) >= date(?)) AND (? IS NULL OR date(m.fecha) <= date(?))
      GROUP BY m.tipo, m.metodo ORDER BY m.tipo, m.metodo
    `).all(desde, desde, hasta, hasta);
		const actividad = db.prepare(`
      SELECT a.id, a.accion, a.modulo, a.descripcion, a.fecha, u.nombre AS usuario_nombre
      FROM registro_actividad a LEFT JOIN usuarios u ON u.id = a.usuario_id
      ORDER BY a.id DESC LIMIT 6
    `).all();
		return {
			periodo: {
				desde,
				hasta
			},
			ventas: pagos.ventas_centavos,
			efectivo: pagos.efectivo_centavos,
			transferencias: pagos.transferencia_centavos,
			cantidadPagos: pagos.cantidad_pagos,
			cantidadPedidos: pedidos.cantidad || 0,
			pedidosActivos: pedidos.activos || 0,
			pedidosPreparando: pedidos.preparando || 0,
			pedidosCancelados: pedidos.cancelados || 0,
			pedidosRetrasados: pedidos.retrasados || 0,
			promedioPreparacionMinutos: pedidos.promedio_preparacion_minutos === null ? 0 : Math.round(pedidos.promedio_preparacion_minutos),
			metodos,
			productos,
			cancelaciones,
			movimientos,
			actividad
		};
	}
	return { obtenerResumen };
}
// electron/proceso-principal/ipc/modulos/reportes/controlador.js
function registrarControladoresReportes(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioReportes(db, obtenerSesion);
	ipcMain.handle("reportes:resumen", (_evento, filtros) => servicio.obtenerResumen(filtros));
}
// electron/proceso-principal/base-datos/modulos/configuracion/servicio.js
var VALORES_PREDETERMINADOS = {
	nombre_negocio: "Pizzería",
	telefono_negocio: "",
	direccion_negocio: "",
	horario_negocio: "",
	logotipo_ruta: "",
	moneda: "MXN",
	tiempo_preparacion_minutos: "20",
	volumen_notificaciones: "70"
};
function crearServicioConfiguracion(db, obtenerSesion) {
	function exigirAdministrador() {
		const sesion = obtenerSesion();
		if (!sesion?.id) throw new Error("Debes iniciar sesión.");
		if (sesion.rol !== "administrador") throw new Error("Solo un administrador puede cambiar la configuración.");
		return sesion;
	}
	function listar() {
		exigirAdministrador();
		const guardados = db.prepare("SELECT clave, valor FROM configuracion").all();
		return {
			...VALORES_PREDETERMINADOS,
			...Object.fromEntries(guardados.map(({ clave, valor }) => [clave, valor ?? ""]))
		};
	}
	function publica() {
		if (!obtenerSesion()?.id) throw new Error("Debes iniciar sesión.");
		const filas = db.prepare("SELECT clave, valor FROM configuracion WHERE clave IN ('nombre_negocio', 'telefono_negocio', 'logotipo_ruta')").all();
		return {
			...VALORES_PREDETERMINADOS,
			...Object.fromEntries(filas.map(({ clave, valor }) => [clave, valor ?? ""]))
		};
	}
	function operativa() {
		if (!obtenerSesion()?.id) throw new Error("Debes iniciar sesión.");
		const guardados = db.prepare(`SELECT clave, valor FROM configuracion
      WHERE clave IN ('tiempo_preparacion_minutos', 'volumen_notificaciones')`).all();
		const valores = Object.fromEntries(guardados.map(({ clave, valor }) => [clave, valor]));
		return {
			tiempoPreparacionMinutos: Number(valores.tiempo_preparacion_minutos || VALORES_PREDETERMINADOS.tiempo_preparacion_minutos),
			volumenNotificaciones: Number(valores.volumen_notificaciones || VALORES_PREDETERMINADOS.volumen_notificaciones)
		};
	}
	function guardar(datos) {
		const sesion = exigirAdministrador();
		const valores = { ...VALORES_PREDETERMINADOS };
		for (const clave of Object.keys(valores)) valores[clave] = String(datos?.[clave] ?? "").trim();
		if (!valores.nombre_negocio || valores.nombre_negocio.length > 100) throw new Error("El nombre comercial es obligatorio y debe tener máximo 100 caracteres.");
		if (valores.telefono_negocio.length > 30 || valores.direccion_negocio.length > 250 || valores.horario_negocio.length > 250 || valores.logotipo_ruta.length > 500) throw new Error("Revisa el largo de los datos del negocio.");
		const preparacion = Number(valores.tiempo_preparacion_minutos);
		const volumen = Number(valores.volumen_notificaciones);
		if (!Number.isInteger(preparacion) || preparacion < 1 || preparacion > 600) throw new Error("El tiempo de preparación debe estar entre 1 y 600 minutos.");
		if (!Number.isInteger(volumen) || volumen < 0 || volumen > 100) throw new Error("El volumen debe estar entre 0 y 100.");
		if (valores.moneda !== "MXN") throw new Error("La moneda disponible actualmente es MXN.");
		db.transaction(() => {
			const upsert = db.prepare(`INSERT INTO configuracion (clave, valor, descripcion, actualizado_en)
        VALUES (?, ?, ?, datetime('now', 'localtime'))
        ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, descripcion = excluded.descripcion,
          actualizado_en = excluded.actualizado_en`);
			for (const [clave, valor] of Object.entries(valores)) upsert.run(clave, valor, "Configuración del negocio");
			db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, fecha)
        VALUES (?, 'actualizar', 'configuracion', 'Actualizó la configuración del negocio.', datetime('now', 'localtime'))`).run(sesion.id);
		})();
		return listar();
	}
	return {
		listar,
		publica,
		guardar,
		operativa
	};
}
// electron/proceso-principal/ipc/modulos/configuracion/controlador.js
function registrarControladoresConfiguracion(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioConfiguracion(db, obtenerSesion);
	ipcMain.handle("configuracion:listar", () => servicio.listar());
	ipcMain.handle("configuracion:publica", () => servicio.publica());
	ipcMain.handle("configuracion:seleccionar-logotipo", async (evento) => {
		if (obtenerSesion()?.rol !== "administrador") throw new Error("Solo un administrador puede cambiar el logotipo.");
		const ventana = BrowserWindow.fromWebContents(evento.sender);
		const opciones = {
			title: "Seleccionar logotipo del negocio",
			properties: ["openFile"],
			filters: [{
				name: "Imágenes",
				extensions: [
					"png",
					"jpg",
					"jpeg",
					"webp"
				]
			}]
		};
		const { canceled, filePaths } = ventana ? await dialog.showOpenDialog(ventana, opciones) : await dialog.showOpenDialog(opciones);
		if (canceled || !filePaths[0]) return null;
		const origen = filePaths[0];
		const extension = extname(origen).toLowerCase();
		if (![
			".png",
			".jpg",
			".jpeg",
			".webp"
		].includes(extension)) throw new Error("Elige una imagen PNG, JPG o WebP.");
		const carpeta = join(app.getPath("userData"), "marca");
		await mkdir(carpeta, { recursive: true });
		const ruta = join(carpeta, `${randomUUID()}-${basename(origen).replace(/[^\w.-]/g, "_")}`);
		await copyFile(origen, ruta);
		return {
			ruta,
			url: `pizzeria-media://archivo?ruta=${encodeURIComponent(ruta)}`
		};
	});
	ipcMain.handle("configuracion:operativa", () => servicio.operativa());
	ipcMain.handle("configuracion:guardar", (_evento, datos) => servicio.guardar(datos));
}
// electron/proceso-principal/licencias/servicio.js
function obtenerHuellaHardware() {
	let semilla = "";
	if (platform() === "win32") try {
		semilla = execFileSync("reg", [
			"query",
			"HKLM\\SOFTWARE\\Microsoft\\Cryptography",
			"/v",
			"MachineGuid"
		], {
			encoding: "utf8",
			windowsHide: true
		}).match(/MachineGuid\s+REG_SZ\s+([^\s]+)/i)?.[1] || "";
	} catch {}
	if (!semilla) {
		const macs = Object.values(networkInterfaces()).flat().filter((item) => item && !item.internal && item.mac !== "00:00:00:00:00:00").map((item) => item.mac).sort();
		semilla = [
			hostname(),
			platform(),
			arch(),
			cpus()[0]?.model || "",
			...macs
		].join("|");
	}
	return `ST-${createHash("sha256").update(`starmy-pizzeria:${semilla}`).digest("hex").slice(0, 32).toUpperCase().match(/.{1,4}/g).join("-")}`;
}
function decodificar(licencia) {
	const partes = String(licencia || "").trim().split(".");
	if (partes.length !== 3 || partes[0] !== "STARMY1") throw new Error("La licencia no tiene un formato válido.");
	const contenido = Buffer.from(partes[1], "base64url");
	const firma = Buffer.from(partes[2], "base64url");
	if (!verify(null, contenido, "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAWwAAC0sWABnnlzID01ivRzKocQ6XxKy4wDtAvtmlq5g=\n-----END PUBLIC KEY-----", firma)) throw new Error("La firma de la licencia no es válida.");
	const datos = JSON.parse(contenido.toString("utf8"));
	if (datos.producto !== "starmy-pizzeria" || datos.version !== 1) throw new Error("La licencia no corresponde a este sistema.");
	return datos;
}
function archivoLicencia() {
	return join(app.getPath("userData"), "licencia.json");
}
function archivoDemo() {
	return join(app.getPath("userData"), "demo.json");
}
var DURACION_DEMO_MS = 864e6;
var RUTA_REGISTRO_DEMO = "HKCU\\Software\\STARMY\\Pizzeria";
function leerDemoRegistrado() {
	let archivo = null;
	try {
		archivo = JSON.parse(readFileSync(archivoDemo(), "utf8"));
	} catch {}
	if (platform() !== "win32") return archivo;
	try {
		const salida = execFileSync("reg", ["query", RUTA_REGISTRO_DEMO], {
			encoding: "utf8",
			windowsHide: true
		});
		const inicio = salida.match(/DemoInicio\s+REG_SZ\s+(\S+)/i)?.[1];
		const ultimo = salida.match(/DemoUltimoUso\s+REG_SZ\s+(\S+)/i)?.[1];
		const registro = inicio ? {
			inicio,
			ultimoUso: ultimo || inicio
		} : null;
		if (!archivo) return registro;
		return {
			inicio: [archivo.inicio, registro?.inicio].filter(Boolean).sort((a, b) => Date.parse(a) - Date.parse(b))[0],
			ultimoUso: [archivo.ultimoUso, registro?.ultimoUso].filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0]
		};
	} catch {
		return archivo;
	}
}
function guardarDemo(registro) {
	const ruta = archivoDemo();
	mkdirSync(dirname(ruta), { recursive: true });
	writeFileSync(ruta, JSON.stringify(registro), { mode: 384 });
	if (platform() !== "win32") return;
	try {
		execFileSync("reg", [
			"add",
			RUTA_REGISTRO_DEMO,
			"/v",
			"DemoInicio",
			"/t",
			"REG_SZ",
			"/d",
			registro.inicio,
			"/f"
		], {
			windowsHide: true,
			stdio: "ignore"
		});
		execFileSync("reg", [
			"add",
			RUTA_REGISTRO_DEMO,
			"/v",
			"DemoUltimoUso",
			"/t",
			"REG_SZ",
			"/d",
			registro.ultimoUso,
			"/f"
		], {
			windowsHide: true,
			stdio: "ignore"
		});
	} catch {}
}
function crearServicioLicencias(obtenerSesion) {
	function estado() {
		const hardwareId = obtenerHuellaHardware();
		let guardada = "";
		try {
			guardada = JSON.parse(readFileSync(archivoLicencia(), "utf8")).licencia;
		} catch {}
		if (guardada) try {
			const datos = decodificar(guardada);
			if (datos.hardwareId === hardwareId && datos.tipo === "completa") return {
				hardwareId,
				activa: true,
				demo: false,
				diasRestantes: 0,
				licencia: guardada,
				cliente: datos.cliente || ""
			};
		} catch {}
		const ahora = Date.now();
		let registro = leerDemoRegistrado();
		if (!registro) registro = {
			inicio: new Date(ahora).toISOString(),
			ultimoUso: new Date(ahora).toISOString(),
			hardwareId
		};
		const inicio = Date.parse(registro.inicio);
		const ultimoUso = Date.parse(registro.ultimoUso || registro.inicio);
		const relojAtrasado = ahora + 3e5 < ultimoUso;
		const ultimoUsoSeguro = new Date(Math.max(ahora, ultimoUso)).toISOString();
		registro = {
			...registro,
			inicio: Number.isFinite(inicio) ? new Date(inicio).toISOString() : new Date(ahora).toISOString(),
			ultimoUso: ultimoUsoSeguro
		};
		guardarDemo(registro);
		const transcurrido = Math.max(0, ahora - Date.parse(registro.inicio));
		const diasRestantes = Math.max(0, Math.ceil((DURACION_DEMO_MS - transcurrido) / 864e5));
		const demoVigente = !relojAtrasado && transcurrido < DURACION_DEMO_MS;
		return {
			hardwareId,
			activa: demoVigente,
			demo: demoVigente,
			expirado: !demoVigente,
			diasRestantes,
			licencia: "",
			cliente: ""
		};
	}
	function activar({ licencia }) {
		const actual = estado();
		const datos = decodificar(licencia);
		if (datos.hardwareId !== actual.hardwareId) throw new Error("Esta licencia fue generada para otro equipo.");
		if (datos.tipo !== "completa") throw new Error("La licencia no habilita la versión completa.");
		const ruta = archivoLicencia();
		mkdirSync(dirname(ruta), { recursive: true });
		writeFileSync(ruta, JSON.stringify({ licencia: String(licencia).trim() }), { mode: 384 });
		return {
			activa: true,
			cliente: datos.cliente || ""
		};
	}
	return {
		estado,
		activar
	};
}
// electron/proceso-principal/ipc/modulos/licencias/controlador.js
function registrarControladoresLicencias(ipcMain, obtenerSesion) {
	const servicio = crearServicioLicencias(obtenerSesion);
	ipcMain.handle("licencias:estado", () => servicio.estado());
	ipcMain.handle("licencias:activar", (_evento, datos) => servicio.activar(datos));
	return servicio;
}
// electron/proceso-principal/base-datos/modulos/respaldos/servicio.js
var intervaloAviso = 864e5;
function crearServicioRespaldos(db, obtenerSesion) {
	function exigirAdministrador() {
		const sesion = obtenerSesion();
		if (!sesion?.id || sesion.rol !== "administrador") throw new Error("Solo un administrador puede administrar respaldos.");
		return sesion;
	}
	function preferencias() {
		const filas = db.prepare("SELECT clave, valor FROM configuracion WHERE clave IN ('carpeta_respaldos', 'respaldo_al_cerrar')").all();
		const config = Object.fromEntries(filas.map(({ clave, valor }) => [clave, valor]));
		return {
			carpeta: config.carpeta_respaldos || join(app.getPath("documents"), "STARMY", "Respaldos"),
			alCerrar: config.respaldo_al_cerrar !== "0"
		};
	}
	function listar() {
		exigirAdministrador();
		const historial = db.prepare("SELECT id, nombre_archivo, ruta_archivo, tipo, tamano_bytes, fecha_creacion, integridad_verificada, observaciones FROM historial_respaldos ORDER BY id DESC LIMIT 100").all();
		const ultimo = historial[0];
		const fechaUltimo = ultimo ? Date.parse(ultimo.fecha_creacion.replace(" ", "T") + "Z") : 0;
		return {
			...preferencias(),
			historial,
			requiereAviso: !ultimo || Date.now() - fechaUltimo >= intervaloAviso
		};
	}
	function configurar({ carpeta, alCerrar }) {
		const sesion = exigirAdministrador();
		const directorio = String(carpeta || "").trim();
		if (!directorio) throw new Error("Elige una carpeta para guardar los respaldos.");
		mkdirSync(directorio, { recursive: true });
		db.prepare(`INSERT INTO configuracion (clave, valor, descripcion, actualizado_en) VALUES ('carpeta_respaldos', ?, 'Carpeta para respaldos', datetime('now', 'localtime')) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor, actualizado_en=excluded.actualizado_en`).run(directorio);
		db.prepare(`INSERT INTO configuracion (clave, valor, descripcion, actualizado_en) VALUES ('respaldo_al_cerrar', ?, 'Crear un respaldo automático al cerrar el sistema', datetime('now', 'localtime')) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor, actualizado_en=excluded.actualizado_en`).run(alCerrar ? "1" : "0");
		db.prepare("INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, fecha) VALUES (?, 'actualizar', 'respaldos', 'Actualizó las preferencias de respaldos.', datetime('now', 'localtime'))").run(sesion.id);
		return preferencias();
	}
	async function crear(tipo = "manual") {
		if (tipo === "manual") exigirAdministrador();
		const { carpeta } = preferencias();
		mkdirSync(carpeta, { recursive: true });
		const nombre = `STARMY_respaldo_${(/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}.sqlite`;
		const ruta = join(carpeta, nombre);
		await db.backup(ruta);
		const comprobacion = new Database(ruta, {
			readonly: true,
			fileMustExist: true
		});
		let integridad = false;
		try {
			integridad = comprobacion.pragma("quick_check", { simple: true }) === "ok";
		} finally {
			comprobacion.close();
		}
		const bytes = statSync(ruta).size;
		db.prepare("INSERT INTO historial_respaldos (nombre_archivo, ruta_archivo, tipo, tamano_bytes, integridad_verificada, observaciones) VALUES (?, ?, ?, ?, ?, ?)").run(nombre, ruta, tipo === "automatico" ? "automatico" : "manual", bytes, integridad ? 1 : 0, integridad ? "Verificación SQLite correcta" : "La verificación de integridad falló");
		return {
			nombre,
			ruta,
			bytes,
			integridad
		};
	}
	function preferenciaAlCerrar() {
		return preferencias().alCerrar;
	}
	return {
		listar,
		configurar,
		crear,
		preferenciaAlCerrar
	};
}
// electron/proceso-principal/ipc/modulos/respaldos/controlador.js
function registrarControladoresRespaldos(ipcMain, db, obtenerSesion) {
	const servicio = crearServicioRespaldos(db, obtenerSesion);
	ipcMain.handle("respaldos:listar", () => servicio.listar());
	ipcMain.handle("respaldos:configurar", (_evento, datos) => servicio.configurar(datos));
	ipcMain.handle("respaldos:crear", () => servicio.crear("manual"));
	ipcMain.handle("respaldos:seleccionar-carpeta", async (evento) => {
		if (obtenerSesion()?.rol !== "administrador") throw new Error("Solo un administrador puede elegir la carpeta de respaldos.");
		const opciones = {
			defaultPath: app.getPath("documents"),
			properties: ["openDirectory", "createDirectory"]
		};
		const ventana = BrowserWindow.fromWebContents(evento.sender);
		const { canceled, filePaths } = ventana ? await dialog.showOpenDialog(ventana, opciones) : await dialog.showOpenDialog(opciones);
		return canceled ? null : filePaths[0];
	});
	return servicio;
}
// electron/proceso-principal/ipc/index.js
function registrarCanalesIPC() {
	const db = obtenerConexion();
	const servicioAutenticacion = registrarControladoresAutenticacion(ipcMain, db);
	registrarCanalesAplicacion();
	registrarCanalesBaseDatos();
	registrarControladoresProductos(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresClientes(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresPuntoVenta(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresPedidos(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresTelevision(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresCaja(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresReportes(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresConfiguracion(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	registrarControladoresLicencias(ipcMain, () => servicioAutenticacion.obtenerSesion());
	const servicioRespaldos = registrarControladoresRespaldos(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	console.log("Canales IPC registrados correctamente");
	return servicioRespaldos;
}
// electron/proceso-principal/index.js
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
protocol.registerSchemesAsPrivileged([{
	scheme: "pizzeria-media",
	privileges: {
		standard: true,
		secure: true,
		supportFetchAPI: true,
		corsEnabled: true,
		stream: true
	}
}]);
var ventanaPrincipal = null;
var servicioRespaldos = null;
var esperaRespaldoAntesDeSalir = false;
var cierreListo = false;
var permitirCierreVentana = false;
var solicitudCierreEnviada = false;
function crearVentanaPrincipal() {
	ventanaPrincipal = new BrowserWindow({
		width: 1366,
		height: 850,
		minWidth: 760,
		minHeight: 560,
		show: false,
		webPreferences: {
			preload: join(__dirname, "../preload/index.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true
		}
	});
	ventanaPrincipal.once("ready-to-show", () => {
		ventanaPrincipal.show();
	});
	ventanaPrincipal.on("close", (evento) => {
		if (permitirCierreVentana) {
			permitirCierreVentana = false;
			return;
		}
		evento.preventDefault();
		if (!solicitudCierreEnviada) {
			solicitudCierreEnviada = true;
			ventanaPrincipal.webContents.send("aplicacion:solicitar-cierre");
		}
	});
	if (process.env.ELECTRON_RENDERER_URL) ventanaPrincipal.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/`);
	else ventanaPrincipal.loadFile(join(__dirname, "../renderer/index.html"), { hash: "/" });
	ventanaPrincipal.on("closed", () => {
		ventanaPrincipal = null;
		solicitudCierreEnviada = false;
		cerrarVentanaTV();
		cerrarVentanaProduccion();
	});
}
ipcMain.on("aplicacion:finalizar-cierre", (evento) => {
	const ventana = BrowserWindow.fromWebContents(evento.sender);
	if (!ventana || ventana !== ventanaPrincipal) return;
	solicitudCierreEnviada = false;
	permitirCierreVentana = true;
	ventana.close();
});
ipcMain.on("aplicacion:cancelar-cierre", (evento) => {
	if (BrowserWindow.fromWebContents(evento.sender) === ventanaPrincipal) solicitudCierreEnviada = false;
});
app.whenReady().then(() => {
	protocol.handle("pizzeria-media", (solicitud) => {
		const ruta = new URL(solicitud.url).searchParams.get("ruta");
		if (!ruta) return new Response("Archivo multimedia no especificado.", { status: 400 });
		return net.fetch(pathToFileURL(ruta).href);
	});
	inicializarBaseDatos();
	servicioRespaldos = registrarCanalesIPC();
	crearVentanaPrincipal();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) crearVentanaPrincipal();
	});
});
app.on("before-quit", (evento) => {
	cerrarVentanaTV();
	cerrarVentanaProduccion();
	if (cierreListo) {
		cerrarConexion();
		return;
	}
	if (esperaRespaldoAntesDeSalir) {
		evento.preventDefault();
		return;
	}
	let respaldar = false;
	try {
		respaldar = servicioRespaldos?.preferenciaAlCerrar() ?? false;
	} catch (error) {
		console.error("No se pudo leer la preferencia de respaldos:", error);
	}
	if (!respaldar) {
		cierreListo = true;
		permitirCierreVentana = true;
		cerrarConexion();
		return;
	}
	evento.preventDefault();
	esperaRespaldoAntesDeSalir = true;
	servicioRespaldos.crear("automatico").catch((error) => console.error("No se pudo crear el respaldo automático al cerrar:", error)).finally(() => {
		cierreListo = true;
		permitirCierreVentana = true;
		cerrarConexion();
		app.quit();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
export {};
