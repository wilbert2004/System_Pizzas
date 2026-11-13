export function crearServicioReportes(db, obtenerSesion) {
  function exigirSesion() {
    if (!obtenerSesion()?.id) throw new Error("Debes iniciar sesión.");
  }

  function validarFecha(fecha, campo) {
    if (!fecha) return null;
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error(`La fecha ${campo} no es válida.`);
    }
    const parsed = new Date(`${fecha}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) {
      throw new Error(`La fecha ${campo} no es válida.`);
    }
    return fecha;
  }

  function obtenerResumen(filtros = {}) {
    exigirSesion();
    const desde = validarFecha(filtros.desde, "inicial");
    const hasta = validarFecha(filtros.hasta, "final");
    if (desde && hasta && desde > hasta) throw new Error("La fecha inicial debe ser anterior a la final.");
    const wherePago = [];
    const paramsPago = [];
    if (desde) { wherePago.push("date(pa.fecha_pago) >= date(?)"); paramsPago.push(desde); }
    if (hasta) { wherePago.push("date(pa.fecha_pago) <= date(?)"); paramsPago.push(hasta); }
    const wherePedido = [];
    const paramsPedido = [];
    if (desde) { wherePedido.push("date(p.fecha_creacion) >= date(?)"); paramsPedido.push(desde); }
    if (hasta) { wherePedido.push("date(p.fecha_creacion) <= date(?)"); paramsPedido.push(hasta); }
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
      periodo: { desde, hasta },
      ventas: pagos.ventas_centavos,
      efectivo: pagos.efectivo_centavos,
      transferencias: pagos.transferencia_centavos,
      cantidadPagos: pagos.cantidad_pagos,
      cantidadPedidos: pedidos.cantidad || 0,
      pedidosActivos: pedidos.activos || 0,
      pedidosPreparando: pedidos.preparando || 0,
      pedidosCancelados: pedidos.cancelados || 0,
      pedidosRetrasados: pedidos.retrasados || 0,
      promedioPreparacionMinutos: pedidos.promedio_preparacion_minutos === null
        ? 0 : Math.round(pedidos.promedio_preparacion_minutos),
      metodos,
      productos,
      cancelaciones,
      movimientos,
      actividad,
    };
  }

  return { obtenerResumen };
}
