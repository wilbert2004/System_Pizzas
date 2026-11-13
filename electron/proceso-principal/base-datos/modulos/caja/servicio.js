export function crearServicioCaja(db, obtenerSesion) {
  function exigirSesion() {
    const sesion = obtenerSesion();
    if (!sesion?.id) throw new Error("Debes iniciar sesión.");
    return sesion;
  }

  function numeroCentavos(valor, campo, permitirCero = false) {
    const numero = Number(valor);
    if (
      !Number.isSafeInteger(numero) ||
      (permitirCero ? numero < 0 : numero <= 0)
    ) {
      throw new Error(`El importe de ${campo} no es válido.`);
    }
    return numero;
  }

  function obtenerSesionAbierta() {
    return db.prepare("SELECT * FROM sesiones_caja WHERE estado = 'abierta'").get();
  }

  function obtenerBloqueosCierre() {
    const pedidosSinPagar = db.prepare(`
      SELECT COUNT(*) AS cantidad FROM pedidos p
      LEFT JOIN pagos pa ON pa.pedido_id = p.id
      WHERE pa.id IS NULL AND p.estado != 'cancelado'
    `).get().cantidad;
    const pedidosEnProceso = db.prepare(`
      SELECT p.id, p.folio, p.estado, c.nombre AS cliente_nombre
      FROM pedidos p LEFT JOIN clientes c ON c.id = p.cliente_id
      WHERE p.estado IN ('nuevo', 'preparando', 'en_horno')
      ORDER BY p.fecha_creacion ASC, p.id ASC LIMIT 100
    `).all();
    const pedidosEnProcesoCantidad = db.prepare(`
      SELECT COUNT(*) AS cantidad FROM pedidos
      WHERE estado IN ('nuevo', 'preparando', 'en_horno')
    `).get().cantidad;
    return { pedidosSinPagar, pedidosEnProceso, pedidosEnProcesoCantidad };
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
      movimientos_efectivo_centavos: movimientos.movimientos_efectivo,
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
      pagos,
    };
  }

  function abrir(datos) {
    const usuario = exigirSesion();
    const monto = numeroCentavos(datos?.montoInicialCentavos ?? 0, "inicial", true);
    const crear = db.transaction(() => {
      if (obtenerSesionAbierta()) throw new Error("Ya existe una caja abierta.");
      const resultado = db.prepare(`
        INSERT INTO sesiones_caja (usuario_apertura_id, monto_inicial_centavos, fecha_apertura)
        VALUES (?, ?, datetime('now', 'localtime'))
      `).run(usuario.id, monto);
      db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, 'abrir', 'caja', ?, 'sesion_caja', ?, datetime('now', 'localtime'))`)
        .run(usuario.id, `Abrió caja con ${monto} centavos.`, resultado.lastInsertRowid);
      return resultado.lastInsertRowid;
    });
    crear();
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
    const ejecutar = db.transaction(() => {
      const sesion = obtenerSesionAbierta();
      if (!sesion) throw new Error("Abre la caja antes de registrar pagos.");
      const pedido = db.prepare("SELECT id, folio, tipo, total_centavos, estado FROM pedidos WHERE id = ?").get(pedidoId);
      if (!pedido || pedido.estado === "cancelado") throw new Error("El pedido no existe o fue cancelado.");
      const estadoListoParaCobro = pedido.tipo === "domicilio" ? "en_reparto" : "listo";
      if (pedido.estado !== estadoListoParaCobro && pedido.estado !== "entregado") {
        throw new Error(pedido.tipo === "domicilio"
          ? "El pedido a domicilio debe salir a reparto antes de cobrarlo."
          : "El pedido debe estar listo antes de cobrarlo.");
      }
      if (db.prepare("SELECT id FROM pagos WHERE pedido_id = ?").get(pedidoId)) throw new Error("Este pedido ya tiene un pago registrado.");
      const recibido = metodo === "efectivo"
        ? numeroCentavos(montoRecibidoEnviado, "recibido")
        : pedido.total_centavos;
      if (metodo === "efectivo" && recibido < pedido.total_centavos) throw new Error("El pago no alcanza el total. No se registró ningún cobro.");
      const cambio = metodo === "efectivo" ? recibido - pedido.total_centavos : 0;
      db.prepare(`INSERT INTO pagos (pedido_id, sesion_caja_id, usuario_id, metodo, monto_centavos, referencia, fecha_pago, monto_recibido_centavos, cambio_centavos)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?, ?)`)
        .run(pedidoId, sesion.id, usuario.id, metodo, pedido.total_centavos, referencia || null, recibido, cambio);
      if (pedido.estado !== "entregado") {
        db.prepare(`UPDATE pedidos SET estado = 'entregado', fecha_entregado = datetime('now', 'localtime'),
          fecha_actualizacion = datetime('now', 'localtime') WHERE id = ?`).run(pedidoId);
        db.prepare(`INSERT INTO historial_estados_pedido
          (pedido_id, estado_anterior, estado_nuevo, usuario_id, fecha)
          VALUES (?, ?, 'entregado', ?, datetime('now', 'localtime'))`)
          .run(pedidoId, estadoListoParaCobro, usuario.id);
      }
      db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, 'registrar_pago', 'caja', ?, 'pedido', ?, datetime('now', 'localtime'))`)
        .run(usuario.id, `Registró pago ${metodo} y confirmó la entrega del pedido ${pedido.folio}.`, pedidoId);
    });
    ejecutar();
    return obtenerEstado();
  }

  function registrarMovimiento(datos) {
    const usuario = exigirSesion();
    const tipo = String(datos?.tipo || "");
    const metodo = String(datos?.metodo || "");
    const concepto = String(datos?.concepto || "").trim();
    const monto = numeroCentavos(datos?.montoCentavos, "movimiento");
    if (!["gasto", "retiro", "ingreso"].includes(tipo)) throw new Error("El tipo de movimiento no es válido.");
    if (!["efectivo", "transferencia"].includes(metodo)) throw new Error("El método del movimiento no es válido.");
    if (!concepto || concepto.length > 200) throw new Error("Escribe un concepto de hasta 200 caracteres.");
    const ejecutar = db.transaction(() => {
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
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`)
        .run(sesion.id, usuario.id, tipo, metodo, concepto, monto);
      db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, ?, 'caja', ?, 'sesion_caja', ?, datetime('now', 'localtime'))`)
        .run(usuario.id, tipo, `${tipo} de ${monto} centavos: ${concepto}`, sesion.id);
    });
    ejecutar();
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
      if (bloqueos.pedidosEnProcesoCantidad > 0) {
        throw new Error(`No puedes cerrar la caja: hay ${bloqueos.pedidosEnProcesoCantidad} ${bloqueos.pedidosEnProcesoCantidad === 1 ? "pedido activo en cocina" : "pedidos activos en cocina"}. Termínalos o cancélalos antes del corte.`);
      }
      if (bloqueos.pedidosSinPagar > 0) {
        throw new Error(`No puedes cerrar la caja: hay ${bloqueos.pedidosSinPagar} ${bloqueos.pedidosSinPagar === 1 ? "pedido sin pagar" : "pedidos sin pagar"}. Cobra los pedidos pendientes antes de hacer el corte.`);
      }
      const resumen = obtenerResumenSesion(sesion);
      const diferencia = contado - resumen.efectivo_esperado_centavos;
      db.prepare(`UPDATE sesiones_caja SET estado = 'cerrada', fecha_cierre = datetime('now', 'localtime'),
        usuario_cierre_id = ?, efectivo_esperado_centavos = ?, transferencias_centavos = ?,
        efectivo_contado_centavos = ?, diferencia_centavos = ?, observaciones = ? WHERE id = ?`)
        .run(usuario.id, resumen.efectivo_esperado_centavos, resumen.transferencias_centavos,
          contado, diferencia, observaciones || null, sesion.id);
      db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, entidad, entidad_id, fecha)
        VALUES (?, 'cerrar', 'caja', ?, 'sesion_caja', ?, datetime('now', 'localtime'))`)
        .run(usuario.id, `Cerró caja. Diferencia: ${diferencia} centavos.`, sesion.id);
      return {
        efectivoEsperadoCentavos: resumen.efectivo_esperado_centavos,
        efectivoContadoCentavos: contado,
        transferenciasCentavos: resumen.transferencias_centavos,
        diferenciaCentavos: diferencia,
      };
    });
    return { ...obtenerEstado(), cierre: ejecutar() };
  }

  return { obtenerEstado, obtenerBloqueosCierre, abrir, registrarPago, registrarMovimiento, cerrar };
}
