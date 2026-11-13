export function crearServicioProductos(db, obtenerSesion) {
  function exigirSesion() {
    const sesion = obtenerSesion();

    if (!sesion) {
      throw new Error("Debes iniciar sesión.");
    }

    return sesion;
  }

  function exigirAdministrador() {
    const sesion = exigirSesion();

    if (sesion.rol !== "administrador") {
      throw new Error("No tienes permisos para modificar el catálogo.");
    }

    return sesion;
  }

  function validarNombre(nombre) {
    if (typeof nombre !== "string" || !nombre.trim()) {
      throw new Error("El nombre es obligatorio.");
    }

    return nombre.trim();
  }

  function validarPrecio(precio) {
    const valor = Number(precio);

    if (!Number.isSafeInteger(valor) || valor < 0) {
      throw new Error("El precio debe ser un importe válido en centavos.");
    }

    return valor;
  }

  // =====================================================
  // CATEGORIAS
  // =====================================================

  function listarCategorias() {
    exigirSesion();

    return db
      .prepare(
        `
      SELECT *
      FROM categorias
      WHERE activo = 1
      ORDER BY orden, nombre
    `,
      )
      .all();
  }

  function listarTodasCategorias() {
    exigirAdministrador();

    return db
      .prepare(
        `
      SELECT *
      FROM categorias
      ORDER BY orden, nombre
    `,
      )
      .all();
  }

  function crearCategoria(datos) {
    const sesion = exigirAdministrador();
    const nombre = validarNombre(datos.nombre);

    const resultado = db
      .prepare(
        `
      INSERT INTO categorias (nombre, descripcion, orden)
      VALUES (?, ?, ?)
    `,
      )
      .run(nombre, datos.descripcion?.trim() || null, Number(datos.orden) || 0);

    return resultado.lastInsertRowid;
  }

  function actualizarCategoria(datos) {
    exigirAdministrador();

    if (!Number.isInteger(Number(datos.id))) {
      throw new Error("Categoría no válida.");
    }

    const nombre = validarNombre(datos.nombre);

    const resultado = db
      .prepare(
        `
      UPDATE categorias
      SET nombre = ?,
          descripcion = ?,
          orden = ?
      WHERE id = ?
    `,
      )
      .run(
        nombre,
        datos.descripcion?.trim() || null,
        Number(datos.orden) || 0,
        datos.id,
      );

    if (!resultado.changes) {
      throw new Error("La categoría no existe.");
    }

    return true;
  }

  function cambiarEstadoCategoria(datos) {
    exigirAdministrador();

    const resultado = db
      .prepare(
        `
      UPDATE categorias
      SET activo = ?
      WHERE id = ?
    `,
      )
      .run(datos.activo ? 1 : 0, datos.id);

    if (!resultado.changes) {
      throw new Error("La categoría no existe.");
    }

    return true;
  }

  // =====================================================
  // PRODUCTOS
  // =====================================================

  function listarProductos() {
    exigirSesion();

    return db
      .prepare(
        `
      SELECT
        p.*,
        c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 1 AND c.activo = 1
      ORDER BY c.orden, p.orden, p.nombre
    `,
      )
      .all();
  }

  function listarTodosProductos() {
    exigirAdministrador();

    return db
      .prepare(
        `
      SELECT
        p.*,
        c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      ORDER BY c.orden, p.orden, p.nombre
    `,
      )
      .all();
  }

  function obtenerProducto(id) {
    exigirSesion();

    const producto = db
      .prepare(
        `
      SELECT
        p.*,
        c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = ?
    `,
      )
      .get(id);

    if (!producto) {
      throw new Error("Producto no encontrado.");
    }

    producto.presentaciones = db
      .prepare(
        `
      SELECT *
      FROM presentaciones_producto
      WHERE producto_id = ?
      ORDER BY orden, id
    `,
      )
      .all(id);

    producto.adicionales = db
      .prepare(
        `
      SELECT
        a.id,
        a.nombre,
        a.precio_centavos,
        a.activo
      FROM producto_adicionales pa
      INNER JOIN adicionales a ON a.id = pa.adicional_id
      WHERE pa.producto_id = ?
      ORDER BY a.nombre
    `,
      )
      .all(id);

    return producto;
  }

  function crearProducto(datos) {
    exigirAdministrador();

    const nombre = validarNombre(datos.nombre);
    const categoriaId = Number(datos.categoria_id);

    const categoria = db
      .prepare(
        `
      SELECT id FROM categorias
      WHERE id = ? AND activo = 1
    `,
      )
      .get(categoriaId);

    if (!categoria) {
      throw new Error("Selecciona una categoría activa.");
    }

    const requierePresentacion = datos.requiere_presentacion ? 1 : 0;
    const presentaciones = Array.isArray(datos.presentaciones)
      ? datos.presentaciones
      : [];

    if (!presentaciones.length) {
      throw new Error("Agrega al menos una presentación y su precio.");
    }

    if (!requierePresentacion && presentaciones.length !== 1) {
      throw new Error(
        "Un producto de presentación única debe tener una sola presentación.",
      );
    }

    const adicionales = Array.isArray(datos.adicionales)
      ? datos.adicionales.map(Number)
      : [];

    const crear = db.transaction(() => {
      const resultado = db
        .prepare(
          `
        INSERT INTO productos (
          categoria_id,
          nombre,
          descripcion,
          imagen_url,
          requiere_presentacion,
          orden
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          categoriaId,
          nombre,
          datos.descripcion?.trim() || null,
          datos.imagen_url?.trim() || null,
          requierePresentacion,
          Number(datos.orden) || 0,
        );

      const productoId = resultado.lastInsertRowid;

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
        insertarPresentacion.run(
          productoId,
          validarNombre(presentacion.nombre),
          validarPrecio(presentacion.precio_centavos),
          indice,
        );
      });

      const insertarAdicional = db.prepare(`
        INSERT INTO producto_adicionales (producto_id, adicional_id)
        SELECT ?, id FROM adicionales
        WHERE id = ? AND activo = 1
      `);

      adicionales.forEach((adicionalId) => {
        const resultadoAdicional = insertarAdicional.run(
          productoId,
          adicionalId,
        );

        if (!resultadoAdicional.changes) {
          throw new Error(
            "Uno de los adicionales seleccionados no existe o está inactivo.",
          );
        }
      });

      return productoId;
    });

    return crear();
  }

  function actualizarProducto(datos) {
    exigirAdministrador();

    const nombre = validarNombre(datos.nombre);
    const categoriaId = Number(datos.categoria_id);

    const producto = db
      .prepare(
        `
      SELECT id FROM productos WHERE id = ?
    `,
      )
      .get(datos.id);

    if (!producto) {
      throw new Error("El producto no existe.");
    }

    const categoria = db
      .prepare(
        `
      SELECT id FROM categorias
      WHERE id = ? AND activo = 1
    `,
      )
      .get(categoriaId);

    if (!categoria) {
      throw new Error("La categoría no está disponible.");
    }

    const resultado = db
      .prepare(
        `
      UPDATE productos
      SET categoria_id = ?,
          nombre = ?,
          descripcion = ?,
          imagen_url = ?,
          requiere_presentacion = ?,
          orden = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(
        categoriaId,
        nombre,
        datos.descripcion?.trim() || null,
        datos.imagen_url?.trim() || null,
        datos.requiere_presentacion ? 1 : 0,
        Number(datos.orden) || 0,
        datos.id,
      );

    return resultado.changes > 0;
  }

  function cambiarEstadoProducto(datos) {
    exigirAdministrador();

    const resultado = db
      .prepare(
        `
      UPDATE productos
      SET activo = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(datos.activo ? 1 : 0, datos.id);

    if (!resultado.changes) {
      throw new Error("El producto no existe.");
    }

    return true;
  }

  // =====================================================
  // PRESENTACIONES Y PRECIOS
  // =====================================================

  function listarPresentaciones(productoId) {
    exigirSesion();

    return db
      .prepare(
        `
      SELECT *
      FROM presentaciones_producto
      WHERE producto_id = ?
      ORDER BY orden, id
    `,
      )
      .all(productoId);
  }

  function crearPresentacion(datos) {
    exigirAdministrador();

    const nombre = validarNombre(datos.nombre);
    const precio = validarPrecio(datos.precio_centavos);

    const producto = db
      .prepare(
        `
      SELECT id, requiere_presentacion
      FROM productos
      WHERE id = ? AND activo = 1
    `,
      )
      .get(datos.producto_id);

    if (!producto) {
      throw new Error("Producto no disponible.");
    }

    if (!producto.requiere_presentacion) {
      throw new Error("Este producto utiliza una presentación única.");
    }

    const resultado = db
      .prepare(
        `
      INSERT INTO presentaciones_producto (
        producto_id,
        nombre,
        precio_centavos,
        orden
      )
      VALUES (?, ?, ?, ?)
    `,
      )
      .run(datos.producto_id, nombre, precio, Number(datos.orden) || 0);

    return resultado.lastInsertRowid;
  }

  function actualizarPresentacion(datos) {
    exigirAdministrador();

    const resultado = db
      .prepare(
        `
      UPDATE presentaciones_producto
      SET nombre = ?,
          precio_centavos = ?,
          orden = ?
      WHERE id = ? AND producto_id = ?
    `,
      )
      .run(
        validarNombre(datos.nombre),
        validarPrecio(datos.precio_centavos),
        Number(datos.orden) || 0,
        datos.id,
        datos.producto_id,
      );

    if (!resultado.changes) {
      throw new Error("No se encontró la presentación.");
    }

    return true;
  }

  function cambiarEstadoPresentacion(datos) {
    exigirAdministrador();

    const resultado = db
      .prepare(
        `
      UPDATE presentaciones_producto
      SET activo = ?
      WHERE id = ? AND producto_id = ?
    `,
      )
      .run(datos.activo ? 1 : 0, datos.id, datos.producto_id);

    if (!resultado.changes) {
      throw new Error("No se encontró la presentación.");
    }

    return true;
  }

  // =====================================================
  // ADICIONALES
  // =====================================================

  function listarAdicionales() {
    exigirSesion();

    return db
      .prepare(
        `
      SELECT *
      FROM adicionales
      WHERE activo = 1
      ORDER BY nombre
    `,
      )
      .all();
  }

  function listarTodosAdicionales() {
    exigirAdministrador();

    return db
      .prepare(
        `
      SELECT *
      FROM adicionales
      ORDER BY nombre
    `,
      )
      .all();
  }

  function crearAdicional(datos) {
    exigirAdministrador();

    const resultado = db
      .prepare(
        `
      INSERT INTO adicionales (
        nombre,
        descripcion,
        precio_centavos
      )
      VALUES (?, ?, ?)
    `,
      )
      .run(
        validarNombre(datos.nombre),
        datos.descripcion?.trim() || null,
        validarPrecio(datos.precio_centavos),
      );

    return resultado.lastInsertRowid;
  }

  function actualizarAdicional(datos) {
    exigirAdministrador();

    const resultado = db
      .prepare(
        `
      UPDATE adicionales
      SET nombre = ?,
          descripcion = ?,
          precio_centavos = ?
      WHERE id = ?
    `,
      )
      .run(
        validarNombre(datos.nombre),
        datos.descripcion?.trim() || null,
        validarPrecio(datos.precio_centavos),
        datos.id,
      );

    if (!resultado.changes) {
      throw new Error("El adicional no existe.");
    }

    return true;
  }

  function cambiarEstadoAdicional(datos) {
    exigirAdministrador();

    const resultado = db
      .prepare(
        `
      UPDATE adicionales
      SET activo = ?
      WHERE id = ?
    `,
      )
      .run(datos.activo ? 1 : 0, datos.id);

    if (!resultado.changes) {
      throw new Error("El adicional no existe.");
    }

    return true;
  }

  function actualizarAdicionalesProducto(datos) {
    exigirAdministrador();

    const producto = db
      .prepare(
        `
      SELECT id FROM productos WHERE id = ?
    `,
      )
      .get(datos.producto_id);

    if (!producto) {
      throw new Error("Producto no encontrado.");
    }

    const ids = [...new Set((datos.adicionales || []).map(Number))];

    const actualizar = db.transaction(() => {
      db.prepare(
        `
        DELETE FROM producto_adicionales
        WHERE producto_id = ?
      `,
      ).run(datos.producto_id);

      const insertar = db.prepare(`
        INSERT INTO producto_adicionales (producto_id, adicional_id)
        SELECT ?, id FROM adicionales
        WHERE id = ? AND activo = 1
      `);

      ids.forEach((id) => {
        const resultado = insertar.run(datos.producto_id, id);

        if (!resultado.changes) {
          throw new Error("Uno de los adicionales no está disponible.");
        }
      });
    });

    actualizar();

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
    actualizarAdicionalesProducto,
  };
}
