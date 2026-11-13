import { BrowserWindow, app, ipcMain } from "electron";
import { join } from "node:path";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import bcrypt from "bcryptjs";
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
	descripcion: () => descripcion$1,
	sql: () => sql$1,
	version: () => 1
});
var descripcion$1 = "Preparacion inicial de la base de datos";
var sql$1 = `
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
	descripcion: () => descripcion,
	sql: () => sql,
	version: () => 2
});
var descripcion = "Creacion de la estructura principal del sistema";
var sql = `
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
// electron/proceso-principal/base-datos/inicializacion.js
var migraciones = [_001_base_exports, _002_estructura_principal_exports];
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
	function contarUsuarios() {
		return db.prepare(`
      SELECT COUNT(*) AS total FROM usuarios
    `).get().total;
	}
	function obtenerEstadoInicial() {
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
		registrarActividad(db, registro.id, "INICIO_SESION", "El usuario inició sesión.");
		return sesionActual;
	}
	function cerrarSesion() {
		if (sesionActual) registrarActividad(db, sesionActual.id, "CIERRE_SESION", "El usuario cerró sesión.");
		sesionActual = null;
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
// electron/proceso-principal/ipc/index.js
function registrarCanalesIPC() {
	const db = obtenerConexion();
	const servicioAutenticacion = registrarControladoresAutenticacion(ipcMain, db);
	registrarCanalesAplicacion();
	registrarCanalesBaseDatos();
	registrarControladoresProductos(ipcMain, db, () => servicioAutenticacion.obtenerSesion());
	console.log("Canales IPC registrados correctamente");
}
// electron/proceso-principal/ventanas/ventana-tv.js
var ventanaTV = null;
function cerrarVentanaTV() {
	if (ventanaTV && !ventanaTV.isDestroyed()) ventanaTV.close();
}
// electron/proceso-principal/index.js
var ventanaPrincipal = null;
function crearVentanaPrincipal() {
	ventanaPrincipal = new BrowserWindow({
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
	ventanaPrincipal.once("ready-to-show", () => {
		ventanaPrincipal.show();
	});
	if (process.env.ELECTRON_RENDERER_URL) ventanaPrincipal.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/`);
	else ventanaPrincipal.loadFile(join(__dirname, "../renderer/index.html"), { hash: "/" });
	ventanaPrincipal.on("closed", () => {
		ventanaPrincipal = null;
		cerrarVentanaTV();
	});
}
app.whenReady().then(() => {
	inicializarBaseDatos();
	registrarCanalesIPC();
	crearVentanaPrincipal();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) crearVentanaPrincipal();
	});
});
app.on("before-quit", () => {
	cerrarVentanaTV();
	cerrarConexion();
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
export {};
