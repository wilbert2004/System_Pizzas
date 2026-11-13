import Database from "better-sqlite3";
import { app } from "electron";
import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const intervaloAviso = 24 * 60 * 60 * 1000;

export function crearServicioRespaldos(db, obtenerSesion) {
  function exigirAdministrador() {
    const sesion = obtenerSesion();
    if (!sesion?.id || sesion.rol !== "administrador") throw new Error("Solo un administrador puede administrar respaldos.");
    return sesion;
  }

  function preferencias() {
    const filas = db.prepare("SELECT clave, valor FROM configuracion WHERE clave IN ('carpeta_respaldos', 'respaldo_al_cerrar')").all();
    const config = Object.fromEntries(filas.map(({ clave, valor }) => [clave, valor]));
    return {
      carpeta: config.carpeta_respaldos || join(app.getPath("documents"), "STARMY", "Respaldos"),
      alCerrar: config.respaldo_al_cerrar !== "0",
    };
  }

  function listar() {
    exigirAdministrador();
    const historial = db.prepare("SELECT id, nombre_archivo, ruta_archivo, tipo, tamano_bytes, fecha_creacion, integridad_verificada, observaciones FROM historial_respaldos ORDER BY id DESC LIMIT 100").all();
    const ultimo = historial[0];
    const fechaUltimo = ultimo ? Date.parse(ultimo.fecha_creacion.replace(" ", "T") + "Z") : 0;
    return { ...preferencias(), historial, requiereAviso: !ultimo || Date.now() - fechaUltimo >= intervaloAviso };
  }

  function configurar({ carpeta, alCerrar }) {
    const sesion = exigirAdministrador();
    const directorio = String(carpeta || "").trim();
    if (!directorio) throw new Error("Elige una carpeta para guardar los respaldos.");
    mkdirSync(directorio, { recursive: true });
    db.prepare(`INSERT INTO configuracion (clave, valor, descripcion, actualizado_en) VALUES ('carpeta_respaldos', ?, 'Carpeta para respaldos', datetime('now', 'localtime')) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor, actualizado_en=excluded.actualizado_en`).run(directorio);
    db.prepare(`INSERT INTO configuracion (clave, valor, descripcion, actualizado_en) VALUES ('respaldo_al_cerrar', ?, 'Crear un respaldo automático al cerrar el sistema', datetime('now', 'localtime')) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor, actualizado_en=excluded.actualizado_en`).run(alCerrar ? "1" : "0");
    db.prepare("INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, fecha) VALUES (?, 'actualizar', 'respaldos', 'Actualizó las preferencias de respaldos.', datetime('now', 'localtime'))").run(sesion.id);
    return preferencias();
  }

  async function crear(tipo = "manual") {
    if (tipo === "manual") exigirAdministrador();
    const { carpeta } = preferencias();
    mkdirSync(carpeta, { recursive: true });
    const fecha = new Date();
    const sello = fecha.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const nombre = `STARMY_respaldo_${sello}.sqlite`;
    const ruta = join(carpeta, nombre);
    await db.backup(ruta);
    const comprobacion = new Database(ruta, { readonly: true, fileMustExist: true });
    let integridad = false;
    try { integridad = comprobacion.pragma("quick_check", { simple: true }) === "ok"; }
    finally { comprobacion.close(); }
    const bytes = statSync(ruta).size;
    db.prepare("INSERT INTO historial_respaldos (nombre_archivo, ruta_archivo, tipo, tamano_bytes, integridad_verificada, observaciones) VALUES (?, ?, ?, ?, ?, ?)").run(nombre, ruta, tipo === "automatico" ? "automatico" : "manual", bytes, integridad ? 1 : 0, integridad ? "Verificación SQLite correcta" : "La verificación de integridad falló");
    return { nombre, ruta, bytes, integridad };
  }

  function preferenciaAlCerrar() { return preferencias().alCerrar; }
  return { listar, configurar, crear, preferenciaAlCerrar };
}
