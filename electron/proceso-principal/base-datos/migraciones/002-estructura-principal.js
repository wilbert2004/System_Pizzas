export const version = 2;

export const descripcion = "Creacion de la estructura principal del sistema";

export const sql = `
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
