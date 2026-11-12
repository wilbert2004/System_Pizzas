import { ipcMain } from "electron";

import { registrarCanalesAplicacion } from "./modulos/aplicacion.js";
import { registrarCanalesBaseDatos } from "./modulos/base-datos.js";
import { registrarControladoresAutenticacion } from "./modulos/autenticacion/controlador.js";
import { obtenerConexion } from "../base-datos/conexion.js";

export function registrarCanalesIPC() {
  registrarCanalesAplicacion();
  registrarCanalesBaseDatos();
  registrarControladoresAutenticacion(ipcMain, obtenerConexion());

  console.log("Canales IPC registrados correctamente");
}
