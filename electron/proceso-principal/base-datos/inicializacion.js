import { obtenerConexion } from "./conexion.js";
import * as migracion001 from "./migraciones/001-base.js";

const migraciones = [migracion001];

export function inicializarBaseDatos() {
  const db = obtenerConexion();

  db.exec(`
    CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
      version INTEGER PRIMARY KEY,
      descripcion TEXT NOT NULL,
      aplicada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const migracion of migraciones) {
    const aplicada = db
      .prepare(
        `
      SELECT version
      FROM migraciones_aplicadas
      WHERE version = ?
    `,
      )
      .get(migracion.version);

    if (aplicada) {
      continue;
    }

    const ejecutarMigracion = db.transaction(() => {
      db.exec(migracion.sql);

      db.prepare(
        `
        INSERT INTO migraciones_aplicadas
        (version, descripcion)
        VALUES (?, ?)
      `,
      ).run(migracion.version, migracion.descripcion);
    });

    ejecutarMigracion();

    console.log(`Migracion ${migracion.version} aplicada correctamente`);
  }

  console.log("Base de datos inicializada correctamente");

  return db;
}
