export function crearServicioClientes(db, obtenerSesion) {
  function exigirSesion() {
    const sesion = obtenerSesion();

    if (!sesion?.id) {
      throw new Error("Debes iniciar sesión para realizar esta operación.");
    }

    return sesion;
  }

  function exigirAdministrador() {
    const sesion = exigirSesion();

    if (sesion.rol !== "administrador") {
      throw new Error("No tienes permisos para realizar esta operación.");
    }

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

    if (nombre.length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres.");
    }

    if (!/^[0-9+\s()-]{7,20}$/.test(telefono)) {
      throw new Error("Ingresa un número de teléfono válido.");
    }

    if (direccion.length > 300) {
      throw new Error("La dirección no puede superar 300 caracteres.");
    }

    if (referencias.length > 500) {
      throw new Error("Las referencias no pueden superar 500 caracteres.");
    }

    return { nombre, telefono, direccion, referencias };
  }

  function registrarActividad(sesion, accion, descripcion, entidadId) {
    db.prepare(
      `
      INSERT INTO registro_actividad
        (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
      VALUES (?, ?, 'clientes', ?, 'cliente', ?, datetime('now', 'localtime'))
    `,
    ).run(sesion.id, accion, descripcion, entidadId ?? null);
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

    if (!incluirInactivos) {
      sql += " AND c.activo = 1";
    }

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

    const cliente = db
      .prepare(
        `
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
    `,
      )
      .get(id);

    if (!cliente) {
      throw new Error("El cliente no existe.");
    }

    return cliente;
  }

  function crear(datos) {
    const sesion = exigirSesion();
    const cliente = validarDatos(datos);

    const resultado = db
      .prepare(
        `
      INSERT INTO clientes (
        nombre,
        telefono,
        direccion,
        referencias,
        activo
      )
      VALUES (?, ?, ?, ?, 1)
    `,
      )
      .run(
        cliente.nombre,
        cliente.telefono,
        cliente.direccion || null,
        cliente.referencias || null,
      );

    registrarActividad(
      sesion,
      "crear",
      `Registró al cliente ${cliente.nombre}.`,
      resultado.lastInsertRowid,
    );

    return obtenerPorId(resultado.lastInsertRowid);
  }

  function actualizar(id, datos) {
    const sesion = exigirSesion();
    const cliente = validarDatos(datos);

    const existente = obtenerPorId(id);

    if (!existente.activo) {
      throw new Error("No puedes editar un cliente inactivo.");
    }

    db.prepare(
      `
      UPDATE clientes
      SET
        nombre = ?,
        telefono = ?,
        direccion = ?,
        referencias = ?,
        fecha_actualizacion = datetime('now', 'localtime')
      WHERE id = ?
    `,
    ).run(
      cliente.nombre,
      cliente.telefono,
      cliente.direccion || null,
      cliente.referencias || null,
      id,
    );

    registrarActividad(
      sesion,
      "actualizar",
      `Actualizó los datos del cliente ${cliente.nombre}.`,
      id,
    );

    return obtenerPorId(id);
  }

  function cambiarEstado(id, activo) {
    const sesion = exigirAdministrador();

    if (typeof activo !== "boolean") {
      throw new Error("El estado indicado no es válido.");
    }

    const cliente = obtenerPorId(id);

    db.prepare(
      `
      UPDATE clientes
      SET activo = ?,
          fecha_actualizacion = datetime('now', 'localtime')
      WHERE id = ?
    `,
    ).run(activo ? 1 : 0, id);

    registrarActividad(
      sesion,
      activo ? "reactivar" : "desactivar",
      `${activo ? "Reactivó" : "Desactivó"} al cliente ${cliente.nombre}.`,
      id,
    );

    return obtenerPorId(id);
  }

  function obtenerHistorial(id) {
    exigirSesion();

    const cliente = obtenerPorId(id);

    const pedidos = db
      .prepare(
        `
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
    `,
      )
      .all(id);

    const resumen = db
      .prepare(
        `
      SELECT
        COUNT(*) AS total_pedidos,
        SUM(CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END) AS pedidos_pagados,
        COALESCE(SUM(CASE WHEN pa.id IS NOT NULL THEN pa.monto ELSE 0 END), 0)
          AS total_comprado_centavos
      FROM pedidos p
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE p.cliente_id = ?
        AND p.estado != 'Cancelado'
    `,
      )
      .get(id);

    return {
      cliente,
      resumen: {
        totalPedidos: resumen.total_pedidos ?? 0,
        pedidosPagados: resumen.pedidos_pagados ?? 0,
        totalCompradoCentavos: resumen.total_comprado_centavos ?? 0,
      },
      pedidos,
    };
  }

  return {
    listar,
    obtenerPorId,
    crear,
    actualizar,
    cambiarEstado,
    obtenerHistorial,
  };
}
