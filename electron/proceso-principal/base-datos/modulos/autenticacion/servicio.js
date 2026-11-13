import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

let sesionActual = null;

function normalizarUsuario(usuario) {
  return usuario.trim().toLowerCase();
}

function validarContrasena(contrasena) {
  if (typeof contrasena !== "string" || contrasena.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }
}

function registrarActividad(db, usuarioId, accion, descripcion) {
  db.prepare(
    `
    INSERT INTO registro_actividad
      (usuario_id, accion, modulo, descripcion, fecha)
    VALUES (?, ?, 'autenticacion', ?, CURRENT_TIMESTAMP)
  `,
  ).run(usuarioId ?? null, accion, descripcion);
}

export function crearServicioAutenticacion(db) {
  const tokensRecuperacion = new Map();
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
    if (!cajaAbierta || !usuario?.activo) { limpiarSesionPersistente(); return null; }
    sesionActual = { id: usuario.id, nombre: usuario.nombre, usuario: usuario.usuario, rol: usuario.rol };
    return sesionActual;
  }
  function contarUsuarios() {
    return db
      .prepare(
        `
      SELECT COUNT(*) AS total FROM usuarios
    `,
      )
      .get().total;
  }

  function obtenerEstadoInicial() {
    restaurarSesionSiCajaSigueAbierta();
    return {
      necesitaAdministrador: contarUsuarios() === 0,
      sesion: sesionActual,
    };
  }

  function crearAdministradorInicial(datos) {
    if (contarUsuarios() !== 0) {
      throw new Error("La configuración inicial ya fue realizada.");
    }

    const nombre = datos.nombre?.trim();
    const usuario = normalizarUsuario(datos.usuario || "");
    const contrasena = datos.contrasena;

    if (!nombre || !usuario) {
      throw new Error("Completa todos los campos.");
    }

    validarContrasena(contrasena);

    const hash = bcrypt.hashSync(contrasena, 12);

    const crear = db.transaction(() => {
      if (contarUsuarios() !== 0) {
        throw new Error("Ya existe una cuenta registrada.");
      }

      const resultado = db
        .prepare(
          `
        INSERT INTO usuarios (
          nombre,
          usuario,
          contrasena_hash,
          rol
        )
        VALUES (?, ?, ?, 'administrador')
      `,
        )
        .run(nombre, usuario, hash);

      registrarActividad(
        db,
        resultado.lastInsertRowid,
        "CREAR_ADMINISTRADOR",
        "Se creó el administrador inicial.",
      );

      return resultado.lastInsertRowid;
    });

    return crear();
  }

  function iniciarSesion(datos) {
    const usuario = normalizarUsuario(datos.usuario || "");
    const contrasena = datos.contrasena || "";

    if (!usuario || !contrasena) {
      throw new Error("Ingresa usuario y contraseña.");
    }

    const registro = db
      .prepare(
        `
      SELECT *
      FROM usuarios
      WHERE usuario = ?
      LIMIT 1
    `,
      )
      .get(usuario);

    if (
      !registro ||
      !bcrypt.compareSync(contrasena, registro.contrasena_hash)
    ) {
      throw new Error("Usuario o contraseña incorrectos.");
    }

    if (!registro.activo) {
      throw new Error("Esta cuenta se encuentra desactivada.");
    }

    sesionActual = {
      id: registro.id,
      nombre: registro.nombre,
      usuario: registro.usuario,
      rol: registro.rol,
    };
    guardarSesionPersistente(registro.id);

    registrarActividad(
      db,
      registro.id,
      "INICIO_SESION",
      "El usuario inició sesión.",
    );

    return sesionActual;
  }

  function cerrarSesion() {
    if (sesionActual) {
      registrarActividad(
        db,
        sesionActual.id,
        "CIERRE_SESION",
        "El usuario cerró sesión.",
      );
    }

    sesionActual = null;
    limpiarSesionPersistente();

    return true;
  }

  function actualizarPerfil(datos) {
    const sesion = obtenerSesion();
    if (!sesion) throw new Error("Debes iniciar sesión.");
    const nombre = String(datos?.nombre || "").trim();
    const usuario = normalizarUsuario(String(datos?.usuario || ""));
    if (!nombre || nombre.length > 100 || !usuario || usuario.length > 50) {
      throw new Error("El nombre y usuario son obligatorios y deben respetar el largo máximo.");
    }
    db.prepare(`UPDATE usuarios SET nombre = ?, usuario = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(nombre, usuario, sesion.id);
    registrarActividad(db, sesion.id, "ACTUALIZAR_PERFIL", "El usuario actualizó su perfil.");
    sesionActual = { ...sesion, nombre, usuario };
    return sesionActual;
  }

  function cambiarContrasenaPropia(datos) {
    const sesion = obtenerSesion();
    if (!sesion) throw new Error("Debes iniciar sesión.");
    const actual = String(datos?.contrasenaActual || "");
    const nueva = datos?.contrasenaNueva;
    validarContrasena(nueva);
    const registro = db.prepare("SELECT contrasena_hash FROM usuarios WHERE id = ?").get(sesion.id);
    if (!actual || !bcrypt.compareSync(actual, registro.contrasena_hash)) {
      throw new Error("La contraseña actual es incorrecta.");
    }
    if (actual === nueva) throw new Error("La contraseña nueva debe ser diferente.");
    const hash = bcrypt.hashSync(nueva, 12);
    db.prepare("UPDATE usuarios SET contrasena_hash = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?")
      .run(hash, sesion.id);
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
    tokensRecuperacion.set(hash, { usuarioId: objetivo.id, vence: Date.now() + 10 * 60 * 1000 });
    registrarActividad(db, administrador.id, "AUTORIZAR_RECUPERACION", `Autorizó un token de recuperación para ${objetivo.usuario}.`);
    return { token, nombre: objetivo.nombre, venceEnMinutos: 10 };
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
    const cambiar = db.transaction(() => {
      db.prepare("UPDATE usuarios SET contrasena_hash = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?").run(bcrypt.hashSync(datos.contrasenaNueva, 12), autorizado.usuarioId);
      registrarActividad(db, autorizado.usuarioId, "RESTABLECER_CONTRASENA", "Se cambió la contraseña con un token autorizado por administrador.");
    });
    cambiar();
    tokensRecuperacion.delete(hash);
    return true;
  }

  function obtenerSesion() {
    if (!sesionActual) return null;

    const usuario = db
      .prepare(
        `
      SELECT id, nombre, usuario, rol, activo
      FROM usuarios
      WHERE id = ?
    `,
      )
      .get(sesionActual.id);

    if (!usuario || !usuario.activo) {
      sesionActual = null;
      return null;
    }

    sesionActual = {
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      rol: usuario.rol,
    };

    return sesionActual;
  }

  function exigirAdministrador() {
    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "administrador") {
      throw new Error("No tienes permisos para realizar esta operación.");
    }

    return sesion;
  }

  function listarUsuarios() {
    exigirAdministrador();

    return db
      .prepare(
        `
      SELECT
        id,
        nombre,
        usuario,
        rol,
        activo,
        fecha_creacion
      FROM usuarios
      ORDER BY nombre
    `,
      )
      .all();
  }

  function crearUsuario(datos) {
    const administrador = exigirAdministrador();

    const nombre = datos.nombre?.trim();
    const usuario = normalizarUsuario(datos.usuario || "");
    const contrasena = datos.contrasena;
    const rol = datos.rol;

    if (!nombre || !usuario) {
      throw new Error("Completa los datos del usuario.");
    }

    if (!["administrador", "empleado"].includes(rol)) {
      throw new Error("Rol no válido.");
    }

    validarContrasena(contrasena);

    const hash = bcrypt.hashSync(contrasena, 12);

    const resultado = db
      .prepare(
        `
      INSERT INTO usuarios (
        nombre,
        usuario,
        contrasena_hash,
        rol
      )
      VALUES (?, ?, ?, ?)
    `,
      )
      .run(nombre, usuario, hash, rol);

    registrarActividad(
      db,
      administrador.id,
      "CREAR_USUARIO",
      `Se creó el usuario ${usuario}.`,
    );

    return resultado.lastInsertRowid;
  }

  function actualizarUsuario(datos) {
    const administrador = exigirAdministrador();

    const nombre = datos.nombre?.trim();
    const usuario = normalizarUsuario(datos.usuario || "");
    const rol = datos.rol;

    if (!datos.id || !nombre || !usuario) {
      throw new Error("Datos de usuario incompletos.");
    }

    if (!["administrador", "empleado"].includes(rol)) {
      throw new Error("Rol no válido.");
    }

    const existente = db
      .prepare(
        `
      SELECT id, rol, activo
      FROM usuarios
      WHERE id = ?
    `,
      )
      .get(datos.id);

    if (!existente) {
      throw new Error("El usuario no existe.");
    }

    if (
      existente.rol === "administrador" &&
      rol === "empleado" &&
      existente.activo
    ) {
      const administradores = db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE rol = 'administrador' AND activo = 1
      `,
        )
        .get().total;

      if (administradores <= 1) {
        throw new Error("No puedes quitar el último administrador activo.");
      }
    }

    db.prepare(
      `
      UPDATE usuarios
      SET nombre = ?,
          usuario = ?,
          rol = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(nombre, usuario, rol, datos.id);

    registrarActividad(
      db,
      administrador.id,
      "ACTUALIZAR_USUARIO",
      `Se actualizó el usuario ${usuario}.`,
    );

    return true;
  }

  function cambiarContrasena(datos) {
    exigirAdministrador();

    validarContrasena(datos.contrasena);

    const hash = bcrypt.hashSync(datos.contrasena, 12);

    const resultado = db
      .prepare(
        `
      UPDATE usuarios
      SET contrasena_hash = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(hash, datos.id);

    if (!resultado.changes) {
      throw new Error("No se encontró el usuario.");
    }

    registrarActividad(
      db,
      sesionActual.id,
      "CAMBIAR_CONTRASENA",
      `Se cambió la contraseña del usuario ${datos.id}.`,
    );

    return true;
  }

  function cambiarEstado(datos) {
    const administrador = exigirAdministrador();

    if (datos.id === administrador.id && !datos.activo) {
      throw new Error("No puedes desactivar tu propia cuenta.");
    }

    const usuario = db
      .prepare(
        `
      SELECT id, rol, activo
      FROM usuarios
      WHERE id = ?
    `,
      )
      .get(datos.id);

    if (!usuario) {
      throw new Error("Usuario no encontrado.");
    }

    if (usuario.rol === "administrador" && usuario.activo && !datos.activo) {
      const total = db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE rol = 'administrador' AND activo = 1
      `,
        )
        .get().total;

      if (total <= 1) {
        throw new Error("Debe existir al menos un administrador activo.");
      }
    }

    db.prepare(
      `
      UPDATE usuarios
      SET activo = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(datos.activo ? 1 : 0, datos.id);

    registrarActividad(
      db,
      administrador.id,
      "CAMBIAR_ESTADO_USUARIO",
      `Se cambió el estado del usuario ${datos.id}.`,
    );

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
    cambiarEstado,
  };
}
