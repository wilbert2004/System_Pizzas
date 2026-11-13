import { crearServicioPuntoVenta } from "../../../base-datos/modulos/punto-venta/servicio.js";

export function registrarControladoresPuntoVenta(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioPuntoVenta(db, obtenerSesion);

  ipcMain.handle("punto-venta:catalogo", () => {
    return servicio.obtenerCatalogo();
  });

  ipcMain.handle("punto-venta:buscar-clientes", (_evento, busqueda) => {
    return servicio.buscarClientes(busqueda);
  });

  ipcMain.handle("punto-venta:crear-pedido", (_evento, datos) => {
    return servicio.crearPedido(datos);
  });

  return servicio;
}
