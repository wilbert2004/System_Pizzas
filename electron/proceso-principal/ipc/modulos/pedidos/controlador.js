import { crearServicioPedidos } from "../../../base-datos/modulos/pedidos/servicio.js";

export function registrarControladoresPedidos(ipcMain, db, obtenerSesion) {
  const servicio = crearServicioPedidos(db, obtenerSesion);

  ipcMain.handle("pedidos:listar", (_evento, filtros) => {
    return servicio.listarPedidos(filtros);
  });

  ipcMain.handle("pedidos:obtener", (_evento, id) => {
    return servicio.obtenerPedido(id);
  });

  ipcMain.handle("pedidos:cambiar-estado", (_evento, id, estado, motivo, tiempoEstimadoMinutos) => {
    return servicio.cambiarEstado(id, estado, motivo, tiempoEstimadoMinutos);
  });

  ipcMain.handle("pedidos:resumen", () => {
    return servicio.obtenerResumen();
  });

  return servicio;
}
