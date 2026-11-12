DOCUMENTO DE ESPECIFICACIÓN DEL SISTEMA
Sistema local de gestión para pizzería
Documento: Especificación funcional y técnica
Versión: 1.0
Estado: Fase 1 completada
Plataforma objetivo: Windows 10 y Windows 11 de 64 bits
Base de datos: SQLite
Moneda: Peso mexicano (MXN)

1. Descripción general
   Se desarrollará una aplicación de escritorio para administrar las operaciones de una pizzería desde una sola computadora con dos pantallas.
   El monitor principal será utilizado por los empleados para registrar pedidos, administrar clientes, controlar la cocina y consultar información administrativa.
   El televisor funcionará como pantalla pública, mostrando pedidos y contenido publicitario.
   El sistema deberá funcionar localmente sin depender de una conexión a internet.
2. Tecnologías propuestas
   Electron: aplicación de escritorio.
   React: interfaz gráfica.
   Vite: entorno de desarrollo.
   Node.js: lógica de funcionamiento.
   better-sqlite3: conexión con SQLite.
   SQLite: almacenamiento de información.
   Git: control de versiones.
3. Módulos del sistema
   3.1 Inicio de sesión
   Acceso mediante usuario y contraseña.
   Perfiles Administrador y Empleado.
   Validación de permisos por rol.
   Inicio de sesión obligatorio al abrir el programa.
   Sin bloqueo automático por inactividad.
   3.2 Clientes
   Registro de nombre y teléfono.
   Una dirección por cliente.
   Referencias del domicilio.
   Búsqueda por número telefónico.
   Recuperación automática de información.
   Historial de pedidos.
   3.3 Punto de venta
   Pedidos por teléfono, mostrador y WhatsApp.
   Pedidos para recoger o a domicilio.
   Generación automática de folios.
   Selección de productos y cantidades.
   Personalización de pizzas.
   Registro de observaciones.
   Cálculo automático de importes.
   Sin impresión de tickets en la primera versión.
   3.4 Productos
   Categorías:
   Pizzas.
   Bebidas.
   Extras.
   Complementos.
   Otros.
   Características:
   Tamaños pequeño, mediano y grande.
   Precio independiente por tamaño.
   Ingredientes adicionales con costo.
   Notas y modificaciones.
   Alta, edición y desactivación por administrador.
   3.5 Cocina
   Estados:
   Nuevo.
   Preparando.
   En horno.
   Listo.
   En reparto.
   Entregado.
   Cancelado.
   El cronómetro comenzará cuando el empleado presione Iniciar preparación.
   El tiempo será establecido manualmente por el empleado.
   Al superar el tiempo estimado:
   Se marcará como retrasado.
   Se reproducirá una alarma sonora.
   El estado original se conservará.
   El empleado podrá reconocer la alarma.
   El pedido seguirá marcado como retrasado hasta completarse.
   La confirmación de pedido listo siempre será manual.
   Las cancelaciones exigirán un motivo y quedarán registradas.
   3.6 Entregas
   Recoger en sucursal.
   Entrega a domicilio.
   Registro manual de salida a reparto.
   Confirmación de entrega.
   Sin administración individual de repartidores en la primera versión.
   3.7 Pantalla pública
   Se abrirá en el televisor conectado como segunda pantalla de Windows.
   Distribución:
   Izquierda: pedidos para recoger y avisos de domicilio.
   Derecha: imágenes y videos promocionales.
   Funciones:
   Actualización automática.
   Notificaciones visuales y sonoras.
   Reproducción de publicidad.
   Cambio de imágenes cada 15 segundos.
   Videos reproducidos hasta terminar.
   Sonido configurable por administrador.
   Ocultar pedidos entregados.
   No mostrar datos privados de clientes.
   3.8 Pagos y caja
   Métodos:
   Efectivo.
   Transferencia.
   Reglas:
   Pago completo, sin abonos.
   El cliente puede pagar al recoger o recibir el pedido.
   El pago se registra cuando se confirma su recepción.
   Caja:
   Apertura con monto inicial.
   Cierre de caja.
   Registro de gastos.
   Registro de retiros.
   Cálculo de saldo esperado.
   Separación de efectivo y transferencias.
   3.9 Reportes
   Ventas diarias.
   Ventas mensuales.
   Productos más vendidos.
   Métodos de pago.
   Clientes frecuentes.
   Pedidos cancelados.
   Motivos de cancelación.
   Tiempos de preparación.
   Pedidos retrasados.
   Movimientos de caja.
   Exportación:
   Excel.
   PDF.
   Periodos:
   Diarios.
   Semanales.
   Mensuales.
   No se requieren estadísticas de rendimiento por empleado.
   3.10 Publicidad
   Administración de imágenes y videos.
   Agregar contenido.
   Eliminar contenido.
   Ordenar contenido.
   Reproducción automática.
   Configuración de sonido.
   Almacenamiento local.
   3.11 Respaldos
   Respaldo automático al cerrar correctamente el programa.
   Conservar los últimos siete respaldos locales.
   Respaldo manual desde administración.
   Copias en computadora y USB.
   Verificación de integridad antes de restaurar.
   Recuperación de información.
   3.12 Configuración
   El administrador podrá modificar:
   Nombre comercial.
   Logotipo.
   Dirección.
   Teléfono.
   Horarios.
   Moneda.
   Tiempo predeterminado.
   Configuración del televisor.
   Volumen de notificaciones.
   Preferencias de publicidad.
4. Base de datos preliminar
   Tablas previstas:
   usuarios
   clientes
   direcciones
   categorias
   productos
   tamanos
   ingredientes
   producto_ingredientes
   pedidos
   detalle_pedidos
   detalle_extras
   historial_estados
   pagos
   cajas
   movimientos_caja
   multimedia
   configuracion
   La estructura definitiva se diseñará durante la Fase 4.
   Los importes se almacenarán en centavos enteros para evitar errores de precisión monetaria.
   Los pedidos conservarán una copia de los nombres y precios de los productos vendidos.
5. Seguridad
   Contraseñas protegidas mediante hash.
   Acceso según perfil.
   Validación de permisos en las operaciones internas.
   Registro de operaciones importantes.
   Protección de datos de clientes.
   Respaldo y recuperación de la base de datos.
6. Arquitectura
   Una computadora Windows ejecutará la aplicación.
   Ventana principal:
   Caja.
   Pedidos.
   Clientes.
   Productos.
   Cocina.
   Administración.
   Ventana secundaria:
   Pantalla pública de pedidos.
   Publicidad.
   Ambas ventanas compartirán la información mediante comunicación interna de Electron y una base de datos SQLite local.
