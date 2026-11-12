import { ipcMain } from "electron";
import { obtenerConexion } from "../../base-datos/conexion.js";

export function registrarCanalesBaseDatos() {
  ipcMain.handle("base-datos:verificar", () => {
    const db = obtenerConexion();

    const resultado = db
      .prepare(
        `
      SELECT sqlite_version() AS version
    `,
      )
      .get();

    const migraciones = db
      .prepare(
        `
      SELECT COUNT(*) AS total
      FROM migraciones_aplicadas
    `,
      )
      .get();

    return {
      conectada: true,
      versionSQLite: resultado.version,
      migracionesAplicadas: migraciones.total,
    };
  });
}
