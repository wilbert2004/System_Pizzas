# DOCUMENTO DE ESPECIFICACIÓN DEL SISTEMA

## Sistema local de gestión para pizzería

- **Documento:** Especificación funcional y técnica
- **Versión:** 1.0
- **Estado:** Fase 1 completada
- **Plataforma objetivo:** Windows 10 y Windows 11 de 64 bits
- **Base de datos:** SQLite
- **Moneda:** Peso mexicano (MXN)

---

## 1. Descripción general

Se desarrollará una aplicación de escritorio para administrar las operaciones de una pizzería desde una sola computadora con dos pantallas:

- **Monitor principal:** Utilizado por los empleados para registrar pedidos, administrar clientes, controlar la cocina y consultar información administrativa.
- **Televisor (segunda pantalla):** Funcionará como pantalla pública, mostrando el estado de los pedidos y contenido publicitario.

El sistema deberá funcionar de manera **100 % local**, sin depender de una conexión a internet.

---

## 2. Tecnologías propuestas

| Tecnología         | Propósito                                           |
| :----------------- | :-------------------------------------------------- |
| **Electron**       | Contenedor y aplicación de escritorio multi-ventana |
| **React**          | Desarrollo de la interfaz gráfica de usuario        |
| **Vite**           | Entorno de desarrollo y empaquetado                 |
| **Node.js**        | Lógica de funcionamiento y proceso principal        |
| **better-sqlite3** | Conexión síncrona con la base de datos SQLite       |
| **SQLite**         | Almacenamiento local de la información              |
| **Git**            | Control de versiones                                |

---

## 3. Módulos del sistema

### 3.1 Inicio de sesión

- Acceso mediante usuario y contraseña.
- Perfiles de **Administrador** y **Empleado**.
- Validación de permisos por rol.
- Inicio de sesión obligatorio al abrir el programa.
- Sin bloqueo automático por inactividad.

### 3.2 Clientes

- Registro de nombre y teléfono.
- Una dirección por cliente y referencias del domicilio.
- Búsqueda rápida por número telefónico con recuperación automática de información.
- Historial de pedidos por cliente.

### 3.3 Punto de venta

- Canales de pedido: teléfono, mostrador y WhatsApp.
- Modalidades: para recoger o a domicilio.
- Generación automática de folios.
- Selección de productos, cantidades, personalización de pizzas y registro de observaciones.
- Cálculo automático de importes.
- _Nota:_ Sin impresión de tickets en la primera versión.

### 3.4 Productos

- **Categorías:** Pizzas, Bebidas, Extras, Complementos y Otros.
- **Características:**
  - Tamaños pequeño, mediano y grande con precio independiente por tamaño.
  - Cada producto indica si requiere preparación; bebidas y botanas sin preparación se entregan directamente y no aparecen en Cocina.
  - Ingredientes adicionales con costo extra.
  - Notas y modificaciones.
  - Alta, edición y desactivación gestionadas por el administrador.

### 3.5 Cocina

- **Estados del pedido:** `Nuevo` → `Preparando` → `En horno` → `Listo` → `En reparto` → `Entregado` (y `Cancelado`).
- **Control de tiempos:**
  - El cocinero define el tiempo de preparación al iniciar esa etapa y el tiempo de horno al enviar el pedido al horno.
  - Puede ajustar el tiempo de la etapa actual sin cambiar el estado del pedido.
- **Modo Manual:** cada etapa avanza únicamente con el botón de la tarjeta.
- **Modo Automático por tiempos:** antes de iniciar se definen los minutos de preparación y horno; al terminar cada fase, el pedido avanza a la siguiente. Se puede avanzar antes con el botón `Avanzar ahora`.
- **Avisos de tiempo:** cocina y producción indican el tiempo restante o excedido; en modo Manual el fin del cronómetro no cambia el estado.
- En modo Manual, el paso a `Listo` se confirma manualmente y respeta la secuencia de estados.
- Los avisos de voz de producción describen el cliente, productos y estado; al pasar a `Listo`, anuncian el pedido dos veces.
- Los pedidos compuestos solo por productos sin preparación se registran directamente como listos; en pedidos mixtos, Cocina muestra únicamente los productos que requieren preparación.
- Las cancelaciones exigirán un motivo obligatorio y quedarán registradas.

### 3.6 Entregas

- Modalidades de entrega: recoger en sucursal y entrega a domicilio.
- Registro manual de salida a reparto y confirmación de entrega.
- _Nota:_ Sin administración individual de repartidores en la primera versión.

### 3.7 Pantalla pública

Se abrirá automáticamente en el televisor conectado como segunda pantalla de Windows.

- **Distribución visual:**
  - **Izquierda:** Pedidos para recoger y avisos de domicilio.
  - **Derecha:** Imágenes y videos promocionales.
- **Funciones:**
  - Actualización automática en tiempo real.
  - Notificaciones visuales y sonoras.
  - Cambio de imágenes cada 15 segundos y reproducción completa de videos.
  - Sonido configurable por el administrador.
  - Ocultamiento automático de pedidos ya entregados.
  - Protección de privacidad (no mostrar datos privados de clientes).

### 3.8 Pagos y caja

- **Métodos de pago:** Efectivo y Transferencia.
- **Reglas de cobro:** Pago completo (sin abonos); el cliente puede pagar al recoger o recibir el pedido, registrándose el pago al confirmar la recepción.
- **Control de caja:**
  - Apertura con monto inicial y cierre de caja.
  - Registro de gastos y retiros.
  - Cálculo de saldo esperado con separación de efectivo y transferencias.

### 3.9 Reportes

- **Métricas disponibles:** Ventas diarias y mensuales, productos más vendidos, métodos de pago, clientes frecuentes, pedidos cancelados y motivos, tiempos de preparación, pedidos retrasados y movimientos de caja.
- **Periodos:** Diarios, semanales y mensuales.
- **Exportación:** Formatos Excel y PDF.
- _Nota:_ No se requieren estadísticas de rendimiento por empleado.

### 3.10 Publicidad

- Administración de imágenes y videos (agregar, eliminar y ordenar contenido).
- Reproducción automática y configuración de sonido.
- Almacenamiento local de archivos multimedia.

### 3.11 Respaldos

- Respaldo automático al cerrar correctamente el programa (conservando los últimos 7 respaldos locales).
- Respaldo manual desde el panel de administración.
- Soporte para copias en computadora y unidades USB.
- Verificación de integridad antes de restaurar y recuperación de información.

### 3.12 Configuración

El administrador podrá modificar:

- Datos del negocio: nombre comercial, logotipo, dirección, teléfono y horarios.
- Parámetros operativos: moneda, tiempo predeterminado de preparación, configuración del televisor, volumen de notificaciones y preferencias de publicidad.

---

## 4. Base de datos preliminar

> _La estructura definitiva se diseñará durante la Fase 4._

**Tablas previstas:**

- `usuarios`, `clientes`, `direcciones`
- `categorias`, `productos`, `tamanos`, `ingredientes`, `producto_ingredientes`
- `pedidos`, `detalle_pedidos`, `detalle_extras`, `historial_estados`
- `pagos`, `cajas`, `movimientos_caja`
- `multimedia`, `configuracion`

**Reglas de integridad de datos:**

- Los importes se almacenarán en **centavos enteros** (`INTEGER`) para evitar errores de precisión monetaria.
- Los pedidos conservarán una copia histórica de los nombres y precios de los productos vendidos al momento de la transacción.

---

## 5. Seguridad

- Contraseñas protegidas mediante algoritmo de hash.
- Control de acceso según perfil y validación de permisos en operaciones internas.
- Bitácora (registro) de operaciones críticas.
- Protección de datos personales de clientes.
- Respaldo y recuperación verificada de la base de datos.

---

## 6. Arquitectura

Una sola computadora con Windows ejecutará la aplicación dividida en dos ventanas sincronizadas:

1. **Ventana principal (Monitor de trabajo):** Caja, Pedidos, Clientes, Productos, Cocina y Administración.
2. **Ventana secundaria (Televisor):** Pantalla pública de pedidos y publicidad.

Ambas ventanas compartirán la información en tiempo real mediante comunicación interna IPC de Electron y la base de datos SQLite local.
