import { obtenerConexion } from "./conexion.js";
import * as migracion001 from "./migraciones/001-base.js";
import * as migracion002 from "./migraciones/002-estructura-principal.js";

const migraciones = [migracion001, migracion002];

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
      console.log(`Migracion ${migracion.version} ya aplicada`);
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

  // VERIFICACION DE LA BASE DE DATOS

  const tablas = db
    .prepare(
      `
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`,
    )
    .all();

  const migracionesAplicadas = db
    .prepare(
      `
  SELECT version, descripcion, aplicada_en
  FROM migraciones_aplicadas
  ORDER BY version
`,
    )
    .all();

  const integridad = db.pragma("integrity_check");

  const clavesForaneas = db.pragma("foreign_key_check");

  console.log("========== VERIFICACION SQLITE ==========");

  console.log("Tablas encontradas:", tablas.length);
  console.table(tablas);

  console.log("Migraciones aplicadas:");
  console.table(migracionesAplicadas);

  console.log("Integridad:", integridad);
  console.log("Errores de claves foraneas:", clavesForaneas);

  console.log("=========================================");

  return db;
}
