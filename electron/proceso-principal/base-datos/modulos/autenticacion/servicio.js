import bcrypt from "bcryptjs";

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
    obtenerSesion,
    listarUsuarios,
    crearUsuario,
    actualizarUsuario,
    cambiarContrasena,
    cambiarEstado,
  };
}
