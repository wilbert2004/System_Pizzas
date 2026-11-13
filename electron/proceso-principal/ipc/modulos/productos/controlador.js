import { crearServicioProductos } from "../../../base-datos/modulos/productos/servicio.js";

export function registrarControladoresProductos(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioProductos(db, obtenerSesion);

  // Categorías
  ipcMain.handle("productos:categorias:listar", () =>
    servicio.listarCategorias(),
  );

  ipcMain.handle("productos:categorias:listar-todas", () =>
    servicio.listarTodasCategorias(),
  );

  ipcMain.handle("productos:categorias:crear", (_, datos) =>
    servicio.crearCategoria(datos),
  );

  ipcMain.handle("productos:categorias:actualizar", (_, datos) =>
    servicio.actualizarCategoria(datos),
  );

  ipcMain.handle("productos:categorias:estado", (_, datos) =>
    servicio.cambiarEstadoCategoria(datos),
  );

  // Productos
  ipcMain.handle("productos:listar", () => servicio.listarProductos());

  ipcMain.handle("productos:listar-todos", () =>
    servicio.listarTodosProductos(),
  );

  ipcMain.handle("productos:obtener", (_, id) => servicio.obtenerProducto(id));

  ipcMain.handle("productos:crear", (_, datos) =>
    servicio.crearProducto(datos),
  );

  ipcMain.handle("productos:actualizar", (_, datos) =>
    servicio.actualizarProducto(datos),
  );

  ipcMain.handle("productos:estado", (_, datos) =>
    servicio.cambiarEstadoProducto(datos),
  );

  // Presentaciones
  ipcMain.handle("productos:presentaciones:listar", (_, id) =>
    servicio.listarPresentaciones(id),
  );

  ipcMain.handle("productos:presentaciones:crear", (_, datos) =>
    servicio.crearPresentacion(datos),
  );

  ipcMain.handle("productos:presentaciones:actualizar", (_, datos) =>
    servicio.actualizarPresentacion(datos),
  );

  ipcMain.handle("productos:presentaciones:estado", (_, datos) =>
    servicio.cambiarEstadoPresentacion(datos),
  );

  // Adicionales
  ipcMain.handle("productos:adicionales:listar", () =>
    servicio.listarAdicionales(),
  );

  ipcMain.handle("productos:adicionales:listar-todos", () =>
    servicio.listarTodosAdicionales(),
  );

  ipcMain.handle("productos:adicionales:crear", (_, datos) =>
    servicio.crearAdicional(datos),
  );

  ipcMain.handle("productos:adicionales:actualizar", (_, datos) =>
    servicio.actualizarAdicional(datos),
  );

  ipcMain.handle("productos:adicionales:estado", (_, datos) =>
    servicio.cambiarEstadoAdicional(datos),
  );

  ipcMain.handle("productos:adicionales:asignar", (_, datos) =>
    servicio.actualizarAdicionalesProducto(datos),
  );

  return servicio;
}
