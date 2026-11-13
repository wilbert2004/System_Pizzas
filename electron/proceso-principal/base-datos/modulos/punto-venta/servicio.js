export function crearServicioPuntoVenta(db, obtenerSesion) {
  function exigirSesion() {
    const sesion = obtenerSesion();

    if (!sesion?.id) {
      throw new Error("Debes iniciar sesión.");
    }

    return sesion;
  }

  function obtenerCatalogo() {
    exigirSesion();

    const categorias = db
      .prepare(
        `
      SELECT id, nombre, descripcion, orden
      FROM categorias
      WHERE activo = 1
      ORDER BY orden ASC, nombre ASC
    `,
      )
      .all();

    const productos = db
      .prepare(
        `
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
    `,
      )
      .all();

    const presentaciones = db
      .prepare(
        `
      SELECT
        id,
        producto_id,
        nombre,
        precio_centavos
      FROM presentaciones_producto
      WHERE activo = 1
      ORDER BY orden ASC, nombre ASC
    `,
      )
      .all();

    const adicionales = db
      .prepare(
        `
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
    `,
      )
      .all();

    return {
      categorias,
      productos: productos.map((producto) => ({
        ...producto,
        requiere_presentacion: Boolean(producto.requiere_presentacion),
        presentaciones: presentaciones.filter(
          (presentacion) => presentacion.producto_id === producto.id,
        ),
        adicionales: adicionales
          .filter((adicional) => adicional.producto_id === producto.id)
          .map(({ producto_id, ...adicional }) => adicional),
      })),
    };
  }

  function buscarClientes(busqueda) {
    exigirSesion();

    const termino = String(busqueda || "").trim();

    if (termino.length < 2) return [];

    return db
      .prepare(
        `
      SELECT id, nombre, telefono, direccion, referencias
      FROM clientes
      WHERE activo = 1
        AND (
          nombre LIKE ?
          OR telefono LIKE ?
        )
      ORDER BY nombre COLLATE NOCASE ASC
      LIMIT 20
    `,
      )
      .all(`%${termino}%`, `%${termino}%`);
  }

  function generarFolio() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    const prefijo = `P${anio}${mes}${dia}`;

    const ultimo = db
      .prepare(
        `
      SELECT folio
      FROM pedidos
      WHERE folio LIKE ?
      ORDER BY id DESC
      LIMIT 1
    `,
      )
      .get(`${prefijo}-%`);

    const consecutivo = ultimo ? Number(ultimo.folio.split("-").at(-1)) + 1 : 1;

    return `${prefijo}-${String(consecutivo).padStart(4, "0")}`;
  }

  function numeroCentavos(valor, campo) {
    if (!Number.isSafeInteger(valor) || valor < 0) {
      throw new Error(`El importe de ${campo} no es válido.`);
    }

    return valor;
  }

  function crearPedido(datos) {
    const sesion = exigirSesion();

    if (
      !datos ||
      !Array.isArray(datos.productos) ||
      datos.productos.length === 0
    ) {
      throw new Error("Agrega al menos un producto al pedido.");
    }

    const canales = ["mostrador", "telefono", "whatsapp"];
    const tipos = ["recoger", "domicilio"];

    if (!canales.includes(datos.canal)) {
      throw new Error("Selecciona un canal válido.");
    }

    if (!tipos.includes(datos.tipo)) {
      throw new Error("Selecciona un tipo de pedido válido.");
    }

    if (datos.tipo === "recoger" && datos.costoEnvioCentavos !== 0) {
      throw new Error("Los pedidos para recoger no tienen costo de envío.");
    }

    const costoEnvio = numeroCentavos(datos.costoEnvioCentavos ?? 0, "envío");

    const esAdministrador = sesion.rol === "administrador";
    const descuentoSolicitado = numeroCentavos(
      datos.descuentoCentavos ?? 0,
      "descuento",
    );

    if (descuentoSolicitado > 0 && !esAdministrador) {
      throw new Error("Solo un administrador puede aplicar descuentos.");
    }

    if (
      descuentoSolicitado > 0 &&
      !String(datos.motivoDescuento || "").trim()
    ) {
      throw new Error("Debes indicar el motivo del descuento.");
    }

    if (datos.tipo === "domicilio" && !datos.clienteId) {
      throw new Error("Selecciona un cliente para el pedido a domicilio.");
    }

    if (datos.clienteId) {
      const cliente = db
        .prepare(
          `
        SELECT id, nombre, direccion, referencias, activo
        FROM clientes
        WHERE id = ?
      `,
        )
        .get(datos.clienteId);

      if (!cliente || !cliente.activo) {
        throw new Error("El cliente seleccionado no existe o está inactivo.");
      }
    }

    const direccion = String(datos.direccionEntrega || "").trim();
    const referencias = String(datos.referenciasEntrega || "").trim();

    if (datos.tipo === "domicilio" && !direccion) {
      throw new Error("Escribe la dirección de entrega.");
    }

    const tiempoEstimado = datos.tiempoEstimadoMinutos ?? null;

    if (
      tiempoEstimado !== null &&
      (!Number.isInteger(tiempoEstimado) ||
        tiempoEstimado < 1 ||
        tiempoEstimado > 600)
    ) {
      throw new Error("El tiempo estimado debe estar entre 1 y 600 minutos.");
    }

    const notasPedido = String(datos.notas || "").trim();

    if (notasPedido.length > 1000) {
      throw new Error("Las notas generales son demasiado largas.");
    }

    const crear = db.transaction(() => {
      let subtotal = 0;

      const detalles = datos.productos.map((item) => {
        const productoId = Number(item.productoId);
        const presentacionId = Number(item.presentacionId);
        const cantidad = Number(item.cantidad);

        if (
          !Number.isInteger(productoId) ||
          !Number.isInteger(presentacionId) ||
          !Number.isInteger(cantidad) ||
          cantidad < 1 ||
          cantidad > 99
        ) {
          throw new Error("Hay un producto con datos inválidos.");
        }

        const producto = db
          .prepare(
            `
          SELECT id, nombre, activo, requiere_presentacion
          FROM productos
          WHERE id = ?
        `,
          )
          .get(productoId);

        if (!producto || !producto.activo) {
          throw new Error("Uno de los productos ya no está disponible.");
        }

        const presentacion = db
          .prepare(
            `
          SELECT id, producto_id, nombre, precio_centavos, activo
          FROM presentaciones_producto
          WHERE id = ? AND producto_id = ?
        `,
          )
          .get(presentacionId, productoId);

        if (!presentacion || !presentacion.activo) {
          throw new Error(
            `La presentación de ${producto.nombre} no está disponible.`,
          );
        }

        const adicionalesSolicitados = Array.isArray(item.adicionales)
          ? item.adicionales
          : [];

        const adicionalesUnicos = new Set();

        const adicionales = adicionalesSolicitados.map((extra) => {
          const adicionalId = Number(extra.id);
          const cantidadExtra = Number(extra.cantidad ?? 1);

          if (
            !Number.isInteger(adicionalId) ||
            !Number.isInteger(cantidadExtra) ||
            cantidadExtra < 1 ||
            cantidadExtra > 20 ||
            adicionalesUnicos.has(adicionalId)
          ) {
            throw new Error("Hay un adicional inválido o repetido.");
          }

          adicionalesUnicos.add(adicionalId);

          const adicional = db
            .prepare(
              `
            SELECT a.id, a.nombre, a.precio_centavos
            FROM adicionales a
            INNER JOIN producto_adicionales pa
              ON pa.adicional_id = a.id
            WHERE a.id = ?
              AND pa.producto_id = ?
              AND a.activo = 1
          `,
            )
            .get(adicionalId, productoId);

          if (!adicional) {
            throw new Error(
              `El adicional seleccionado para ${producto.nombre} no está disponible.`,
            );
          }

          return {
            ...adicional,
            cantidad: cantidadExtra,
          };
        });

        const precioAdicionales = adicionales.reduce(
          (total, extra) => total + extra.precio_centavos * extra.cantidad,
          0,
        );

        const precioUnitario = presentacion.precio_centavos + precioAdicionales;
        const subtotalDetalle = precioUnitario * cantidad;

        if (!Number.isSafeInteger(subtotalDetalle)) {
          throw new Error("El importe del producto es demasiado grande.");
        }

        subtotal += subtotalDetalle;

        return {
          producto,
          presentacion,
          cantidad,
          precioUnitario,
          subtotalDetalle,
          notas: String(item.notas || "").trim(),
          adicionales,
        };
      });

      if (!Number.isSafeInteger(subtotal)) {
        throw new Error("El subtotal del pedido no es válido.");
      }

      if (descuentoSolicitado > subtotal) {
        throw new Error("El descuento no puede superar el subtotal.");
      }

      const total = subtotal - descuentoSolicitado + costoEnvio;

      if (!Number.isSafeInteger(total) || total < 0) {
        throw new Error("El total del pedido no es válido.");
      }

      const folio = generarFolio();

      const pedido = db
        .prepare(
          `
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
      `,
        )
        .run(
          folio,
          datos.clienteId || null,
          sesion.id,
          datos.canal,
          datos.tipo,
          subtotal,
          descuentoSolicitado,
          descuentoSolicitado > 0 ? String(datos.motivoDescuento).trim() : null,
          descuentoSolicitado > 0 ? sesion.id : null,
          costoEnvio,
          total,
          notasPedido || null,
          datos.tipo === "domicilio" ? direccion : null,
          datos.tipo === "domicilio" ? referencias || null : null,
          tiempoEstimado,
        );

      const pedidoId = pedido.lastInsertRowid;

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
        const resultado = insertarDetalle.run(
          pedidoId,
          detalle.producto.id,
          detalle.presentacion.id,
          detalle.producto.nombre,
          detalle.presentacion.nombre,
          detalle.cantidad,
          detalle.precioUnitario,
          detalle.subtotalDetalle,
          detalle.notas || null,
        );

        for (const adicional of detalle.adicionales) {
          insertarAdicional.run(
            resultado.lastInsertRowid,
            adicional.id,
            adicional.nombre,
            adicional.precio_centavos,
            adicional.cantidad,
            adicional.precio_centavos * adicional.cantidad,
          );
        }
      }

      db.prepare(
        `
        INSERT INTO historial_estados_pedido (
          pedido_id,
          estado_anterior,
          estado_nuevo,
          usuario_id,
          fecha
        )
        VALUES (?, NULL, 'nuevo', ?, datetime('now', 'localtime'))
      `,
      ).run(pedidoId, sesion.id);

      db.prepare(
        `
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
      `,
      ).run(sesion.id, `Creó el pedido ${folio}.`, pedidoId);

      return {
        id: pedidoId,
        folio,
        estado: "nuevo",
        subtotalCentavos: subtotal,
        descuentoCentavos: descuentoSolicitado,
        costoEnvioCentavos: costoEnvio,
        totalCentavos: total,
      };
    });

    return crear();
  }

  return {
    obtenerCatalogo,
    buscarClientes,
    crearPedido,
  };
}
