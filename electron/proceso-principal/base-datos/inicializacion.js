import { obtenerConexion } from "./conexion.js";
import * as migracion001 from "./migraciones/001-base.js";
import * as migracion002 from "./migraciones/002-estructura-principal.js";
import * as migracion003 from "./migraciones/003-pagos-efectivo.js";
import * as migracion004 from "./migraciones/004-duracion-publicidad.js";
import * as migracion005 from "./migraciones/005-productos-preparacion.js";

const migraciones = [migracion001, migracion002, migracion003, migracion004, migracion005];

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

  // Asegura las columnas nuevas aunque una instalación ya hubiera aplicado una
  // versión 3 anterior mientras se estaba definiendo el sistema de licencias.
  const columnasPago = new Set(db.pragma("table_info(pagos)").map((columna) => columna.name));
  if (!columnasPago.has("monto_recibido_centavos")) {
    db.exec("ALTER TABLE pagos ADD COLUMN monto_recibido_centavos INTEGER NOT NULL DEFAULT 0 CHECK (monto_recibido_centavos >= 0)");
    db.exec("UPDATE pagos SET monto_recibido_centavos = monto_centavos WHERE monto_recibido_centavos = 0");
  }
  if (!columnasPago.has("cambio_centavos")) {
    db.exec("ALTER TABLE pagos ADD COLUMN cambio_centavos INTEGER NOT NULL DEFAULT 0 CHECK (cambio_centavos >= 0)");
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
