const ESTADOS = [
  "Nuevo",
  "Preparando",
  "En horno",
  "Listo",
  "En reparto",
  "Entregado",
  "Cancelado",
];

const TRANSICIONES = {
  Nuevo: ["Preparando", "Cancelado"],
  Preparando: ["En horno", "Listo", "Cancelado"],
  "En horno": ["Listo", "Cancelado"],
  Listo: ["En reparto", "Entregado", "Cancelado"],
  "En reparto": ["Entregado", "Cancelado"],
  Entregado: [],
  Cancelado: [],
};

const ESTADOS_BD = {
  Nuevo: "nuevo",
  Preparando: "preparando",
  "En horno": "en_horno",
  Listo: "listo",
  "En reparto": "en_reparto",
  Entregado: "entregado",
  Cancelado: "cancelado",
};

const ETIQUETAS_ESTADO = Object.fromEntries(
  Object.entries(ESTADOS_BD).map(([etiqueta, estado]) => [estado, etiqueta]),
);

export function crearServicioPedidos(db, obtenerSesion) {
  function adaptarPedido(pedido) {
    if (!pedido) return pedido;

    return {
      ...pedido,
      estado: ETIQUETAS_ESTADO[pedido.estado] || pedido.estado,
      fecha_inicio_preparacion:
        pedido.inicio_preparacion ?? pedido.fecha_inicio_preparacion ?? null,
      fecha_entrada_horno:
        pedido.entrada_horno ?? pedido.fecha_entrada_horno ?? null,
      fecha_salida_reparto:
        pedido.salida_reparto ?? pedido.fecha_salida_reparto ?? null,
      fecha_cancelacion:
        pedido.fecha_cancelado ?? pedido.fecha_cancelacion ?? null,
    };
  }

  function exigirSesion() {
    const sesion = obtenerSesion();

    if (!sesion?.id) {
      throw new Error("Debes iniciar sesión.");
    }

    return sesion;
  }

  function validarId(id) {
    const numero = Number(id);

    if (!Number.isSafeInteger(numero) || numero <= 0) {
      throw new Error("El identificador del pedido no es válido.");
    }

    return numero;
  }

  function registrarActividad(sesion, accion, descripcion, pedidoId) {
    db.prepare(
      `
      INSERT INTO registro_actividad (
        usuario_id, accion, modulo, descripcion,
        entidad, entidad_id, fecha
      )
      VALUES (
        ?, ?, 'pedidos', ?, 'pedido', ?,
        datetime('now', 'localtime')
      )
    `,
    ).run(sesion.id, accion, descripcion, pedidoId);
  }

  function obtenerPedido(id) {
    exigirSesion();

    const pedidoId = validarId(id);

    const pedido = db
      .prepare(
        `
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
    `,
      )
      .get(pedidoId);

    if (!pedido) {
      throw new Error("El pedido no existe.");
    }

    const detalles = db
      .prepare(
        `
      SELECT *
      FROM pedido_detalles
      WHERE pedido_id = ?
      ORDER BY id ASC
    `,
      )
      .all(pedidoId);

    const consultaAdicionales = db.prepare(`
      SELECT *
      FROM pedido_detalle_adicionales
      WHERE pedido_detalle_id = ?
      ORDER BY id ASC
    `);

    const historial = db
      .prepare(
        `
      SELECT
        h.*,
        u.nombre AS usuario_nombre
      FROM historial_estados_pedido h
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.pedido_id = ?
      ORDER BY h.id ASC
    `,
      )
      .all(pedidoId);

    return {
      ...adaptarPedido(pedido),
      detalles: detalles.map((detalle) => ({
        ...detalle,
        adicionales: consultaAdicionales.all(detalle.id),
      })),
      historial,
    };
  }

  function listarPedidos(filtros = {}) {
    exigirSesion();

    const {
      busqueda = "",
      estado = "todos",
      tipo = "todos",
      fechaDesde = "",
      fechaHasta = "",
      limite = 200,
    } = filtros;

    if (estado !== "todos" && !ESTADOS.includes(estado)) {
      throw new Error("El filtro de estado no es válido.");
    }

    if (!["todos", "recoger", "domicilio"].includes(tipo)) {
      throw new Error("El filtro de tipo no es válido.");
    }

    const cantidad = Number(limite);

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 500) {
      throw new Error("El límite de resultados no es válido.");
    }

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

  function cambiarEstado(id, nuevoEstado, motivo = "", tiempoEstimadoMinutos = null) {
    const sesion = exigirSesion();
    const pedidoId = validarId(id);

    if (!ESTADOS.includes(nuevoEstado)) {
      throw new Error("El estado solicitado no es válido.");
    }

    const motivoLimpio = String(motivo || "").trim();

    if (
      nuevoEstado === "Preparando" &&
      tiempoEstimadoMinutos !== null &&
      (!Number.isInteger(tiempoEstimadoMinutos) ||
        tiempoEstimadoMinutos < 1 ||
        tiempoEstimadoMinutos > 600)
    ) {
      throw new Error("El tiempo de preparación debe estar entre 1 y 600 minutos.");
    }

    if (motivoLimpio.length > 500) {
      throw new Error("El motivo no puede superar 500 caracteres.");
    }

    const ejecutar = db.transaction(() => {
      const pedido = db
        .prepare(
          `
        SELECT *
        FROM pedidos
        WHERE id = ?
      `,
        )
        .get(pedidoId);

      if (!pedido) {
        throw new Error("El pedido no existe.");
      }

      const estadoActual = ETIQUETAS_ESTADO[pedido.estado] || pedido.estado;
      const permitidos = TRANSICIONES[estadoActual] || [];

      if (!permitidos.includes(nuevoEstado)) {
        throw new Error(
          `No se puede cambiar de "${estadoActual}" a "${nuevoEstado}".`,
        );
      }

      if (nuevoEstado === "Cancelado" && !motivoLimpio) {
        throw new Error("Debes indicar el motivo de cancelación.");
      }

      if (nuevoEstado === "En reparto" && pedido.tipo !== "domicilio") {
        throw new Error("Solo los pedidos a domicilio pueden salir a reparto.");
      }

      if (
        nuevoEstado === "Entregado" &&
        pedido.tipo === "domicilio" &&
        estadoActual !== "En reparto"
      ) {
        throw new Error(
          "El pedido a domicilio debe salir a reparto antes de entregarse.",
        );
      }

      if (
        nuevoEstado === "Entregado" &&
        pedido.tipo === "recoger" &&
        estadoActual !== "Listo"
      ) {
        throw new Error("El pedido debe estar listo antes de entregarse.");
      }

      if (
        nuevoEstado === "Entregado" &&
        !db.prepare("SELECT id FROM pagos WHERE pedido_id = ?").get(pedidoId)
      ) {
        throw new Error("Registra el pago en Caja para confirmar la entrega.");
      }

      const camposFecha = {
        Preparando: "inicio_preparacion",
        "En horno": "entrada_horno",
        Listo: "fecha_listo",
        "En reparto": "salida_reparto",
        Entregado: "fecha_entregado",
        Cancelado: "fecha_cancelado",
      };

      const campoFecha = camposFecha[nuevoEstado];

      if (campoFecha) {
        // Los nombres de columna provienen de una lista fija,
        // nunca de datos enviados por el usuario.
        db.prepare(
          `
          UPDATE pedidos
          SET estado = ?,
              tiempo_estimado_minutos = CASE
                WHEN ? IS NOT NULL AND ? = 'preparando' THEN ?
                ELSE tiempo_estimado_minutos
              END,
              ${campoFecha} = COALESCE(
                ${campoFecha},
                datetime('now', 'localtime')
              ),
              fecha_actualizacion = datetime('now', 'localtime')
          WHERE id = ?
        `,
        ).run(
          ESTADOS_BD[nuevoEstado],
          tiempoEstimadoMinutos,
          ESTADOS_BD[nuevoEstado],
          tiempoEstimadoMinutos,
          pedidoId,
        );
      } else {
        db.prepare(
          `
          UPDATE pedidos
          SET estado = ?,
              fecha_actualizacion = datetime('now', 'localtime')
          WHERE id = ?
        `,
        ).run(ESTADOS_BD[nuevoEstado], pedidoId);
      }

      db.prepare(
        `
        INSERT INTO historial_estados_pedido (
          pedido_id,
          estado_anterior,
          estado_nuevo,
          usuario_id,
          motivo,
          fecha
        )
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `,
      ).run(
        pedidoId,
        pedido.estado,
        ESTADOS_BD[nuevoEstado],
        sesion.id,
        motivoLimpio || null,
      );

      registrarActividad(
        sesion,
        nuevoEstado === "Cancelado" ? "cancelar" : "cambiar_estado",
        nuevoEstado === "Cancelado"
          ? `Canceló el pedido ${pedido.folio}. Motivo: ${motivoLimpio}`
          : `Cambió el pedido ${pedido.folio} de ${estadoActual} a ${nuevoEstado}.`,
        pedidoId,
      );

      return obtenerPedido(pedidoId);
    });

    return ejecutar();
  }

  function obtenerResumen() {
    exigirSesion();

    const filas = db
      .prepare(
        `
      SELECT estado, COUNT(*) AS cantidad
      FROM pedidos
      GROUP BY estado
    `,
      )
      .all();

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
    obtenerResumen,
  };
}
