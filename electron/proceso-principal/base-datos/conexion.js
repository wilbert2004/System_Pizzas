import Database from "better-sqlite3";
import { app } from "electron";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

let conexion = null;

export function obtenerConexion() {
  if (conexion) {
    return conexion;
  }

  const carpetaDatos = join(app.getPath("userData"), "datos");

  mkdirSync(carpetaDatos, { recursive: true });

  const rutaBaseDatos = join(carpetaDatos, "pizzeria.sqlite");

  conexion = new Database(rutaBaseDatos);

  conexion.pragma("foreign_keys = ON");
  conexion.pragma("journal_mode = WAL");
  conexion.pragma("synchronous = NORMAL");
  conexion.pragma("busy_timeout = 5000");

  return conexion;
}

export function cerrarConexion() {
  if (conexion) {
    conexion.close();
    conexion = null;
  }
}
