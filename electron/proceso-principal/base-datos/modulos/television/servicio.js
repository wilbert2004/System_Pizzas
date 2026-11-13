export function crearServicioTelevision(db) {
  function normalizarRuta(ruta) {
    const valor = String(ruta || "");

    if (valor.startsWith("pizzeria-media://")) return valor;

    if (valor.startsWith("file://")) {
      const rutaLocal = decodeURIComponent(
        valor.replace(/^file:\/\//, "").replace(/^\/([A-Za-z]:)/, "$1"),
      );

      return `pizzeria-media://archivo?ruta=${encodeURIComponent(rutaLocal)}`;
    }

    return valor.replace(/^file:\/\/(?!\/)([A-Za-z]:\/)/, "file:///$1");
  }

  function listarMultimedia() {
    const elementos = db
      .prepare(
        `
        SELECT
          id,
          nombre,
          ruta_archivo AS ruta,
          tipo,
          duracion_segundos,
          orden,
          activo,
          fecha_creacion,
          fecha_actualizacion
        FROM multimedia
        ORDER BY orden ASC, id ASC
      `,
      )
      .all();

    return elementos.map((elemento) => ({
      ...elemento,
      ruta: normalizarRuta(elemento.ruta),
    }));
  }

  function crearMultimedia(datos) {
    const nombre = String(datos?.nombre || "").trim();
    const ruta = String(datos?.ruta || datos?.ruta_archivo || "").trim();
    const tipo = String(datos?.tipo || "");
    const duracion = Number(datos?.duracion_segundos || 10);
    const orden = Number(datos?.orden || 0);

    if (!nombre || !ruta || !["imagen", "video"].includes(tipo)) {
      throw new Error("Los datos de la publicidad no son válidos.");
    }

    if (!Number.isInteger(duracion) || duracion < 3 || duracion > 300) {
      throw new Error("La duración debe estar entre 3 y 300 segundos.");
    }

    return db
      .prepare(
        `
        INSERT INTO multimedia (nombre, ruta_archivo, tipo, duracion_segundos, orden)
        VALUES (?, ?, ?, ?, ?)
      `,
      )
      .run(nombre, ruta, tipo, duracion, Number.isInteger(orden) ? orden : 0);
  }

  function actualizarMultimedia(id, datos) {
    const multimediaId = Number(id);
    const nombre = String(datos?.nombre || "").trim();
    const duracion = Number(datos?.duracion_segundos || 10);

    if (!Number.isSafeInteger(multimediaId) || multimediaId <= 0 || !nombre) {
      throw new Error("La publicidad no es válida.");
    }

    db.prepare(
      `
      UPDATE multimedia
      SET nombre = ?, duracion_segundos = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(nombre, duracion, multimediaId);
  }

  function cambiarEstadoMultimedia(id, activo) {
    db.prepare(
      `
      UPDATE multimedia
      SET activo = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(activo ? 1 : 0, Number(id));
  }

  function eliminarMultimedia(id) {
    db.prepare("DELETE FROM multimedia WHERE id = ?").run(Number(id));
  }

  return {
    listarMultimedia,
    crearMultimedia,
    actualizarMultimedia,
    cambiarEstadoMultimedia,
    eliminarMultimedia,
  };
}
