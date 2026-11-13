import { ipcMain } from "electron";

import { registrarCanalesAplicacion } from "./modulos/aplicacion.js";
import { registrarCanalesBaseDatos } from "./modulos/base-datos.js";
import { registrarControladoresAutenticacion } from "./modulos/autenticacion/controlador.js";
import { obtenerConexion } from "../base-datos/conexion.js";
//importamos los registros de productos
import { registrarControladoresProductos } from "./modulos/productos/controlador.js";
import { registrarControladoresClientes } from "./modulos/clientes/controlador.js";
import { registrarControladoresPuntoVenta } from "./modulos/punto-venta/controlador.js";
import { registrarControladoresPedidos } from "./modulos/pedidos/controlador.js";
import { registrarControladoresTelevision } from "./modulos/television/controlador.js";

export function registrarCanalesIPC() {
  const db = obtenerConexion();

  const servicioAutenticacion = registrarControladoresAutenticacion(
    ipcMain,
    db,
  );
  registrarCanalesAplicacion();
  registrarCanalesBaseDatos();
  registrarControladoresProductos(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresClientes(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresPuntoVenta(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresPedidos(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresTelevision(ipcMain, db);

  console.log("Canales IPC registrados correctamente");
}
