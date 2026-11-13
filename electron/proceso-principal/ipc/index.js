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
import { registrarControladoresCaja } from "./modulos/caja/controlador.js";
import { registrarControladoresReportes } from "./modulos/reportes/controlador.js";
import { registrarControladoresConfiguracion } from "./modulos/configuracion/controlador.js";
import { registrarControladoresLicencias } from "./modulos/licencias/controlador.js";
import { registrarControladoresRespaldos } from "./modulos/respaldos/controlador.js";

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
  registrarControladoresTelevision(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresCaja(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresReportes(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresConfiguracion(ipcMain, db, () =>
    servicioAutenticacion.obtenerSesion(),
  );
  registrarControladoresLicencias(ipcMain, () => servicioAutenticacion.obtenerSesion());
  const servicioRespaldos = registrarControladoresRespaldos(ipcMain, db, () => servicioAutenticacion.obtenerSesion());

  console.log("Canales IPC registrados correctamente");
  return servicioRespaldos;
}
