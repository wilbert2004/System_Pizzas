import { ipcMain } from "electron";

import { registrarCanalesAplicacion } from "./modulos/aplicacion.js";
import { registrarCanalesBaseDatos } from "./modulos/base-datos.js";
import { registrarControladoresAutenticacion } from "./modulos/autenticacion/controlador.js";
import { obtenerConexion } from "../base-datos/conexion.js";
//importamos los registros de productos
import { registrarControladoresProductos } from "./modulos/productos/controlador.js";

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

  console.log("Canales IPC registrados correctamente");
}
