export function crearServicioTelevision(db, obtenerSesion = () => null) {
  function exigirSesion(esAdministrador = false) {
    const sesion = obtenerSesion();
    if (!sesion?.id) throw new Error("Debes iniciar sesión.");
    if (esAdministrador && sesion.rol !== "administrador") {
      throw new Error("Solo un administrador puede cambiar la música de la TV.");
    }
  }

  function normalizarRuta(ruta) {
    const valor = String(ruta || "");

    if (valor.startsWith("pizzeria-media://")) return valor;

    if (/^[A-Za-z]:[\\/]/.test(valor) || valor.startsWith("/")) {
      return `pizzeria-media://archivo?ruta=${encodeURIComponent(valor)}`;
    }

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
          duracion_modo,
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
    const duracionModo = datos?.duracion_modo === "manual" ? "manual" : "automatico";
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
        INSERT INTO multimedia (nombre, ruta_archivo, tipo, duracion_segundos, duracion_modo, orden)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(nombre, ruta, tipo, duracion, duracionModo, Number.isInteger(orden) ? orden : 0);
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

  function obtenerMusica() {
    exigirSesion();
    const valores = db.prepare(`SELECT clave, valor FROM configuracion
      WHERE clave IN ('television_musica_ruta', 'television_musica_nombre', 'television_musica_volumen')`).all();
    const datos = Object.fromEntries(valores.map(({ clave, valor }) => [clave, valor]));
    return {
      nombre: datos.television_musica_nombre || "",
      ruta: datos.television_musica_ruta ? normalizarRuta(datos.television_musica_ruta) : "",
      volumen: Number(datos.television_musica_volumen ?? 35),
    };
  }

  function guardarVolumenMusica(valor) {
    exigirSesion(true);
    const volumen = Number(valor);
    if (!Number.isInteger(volumen) || volumen < 0 || volumen > 100) {
      throw new Error("El volumen debe estar entre 0 y 100.");
    }
    db.prepare(`INSERT INTO configuracion (clave, valor, descripcion)
      VALUES ('television_musica_volumen', ?, 'Volumen de la música de la TV de promociones')
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor,
      descripcion = excluded.descripcion, actualizado_en = CURRENT_TIMESTAMP`).run(String(volumen));
    return obtenerMusica();
  }

  function guardarMusica({ ruta, nombre }) {
    exigirSesion(true);
    const rutaValida = String(ruta || "").trim();
    const nombreValido = String(nombre || "").trim();
    if (!rutaValida || !nombreValido || nombreValido.length > 180) {
      throw new Error("El archivo de música no es válido.");
    }
    const guardar = db.prepare(`INSERT INTO configuracion (clave, valor, descripcion)
      VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor,
      descripcion = excluded.descripcion, actualizado_en = CURRENT_TIMESTAMP`);
    const transaccion = db.transaction(() => {
      guardar.run("television_musica_ruta", rutaValida, "Archivo de música ambiental para la pantalla de TV");
      guardar.run("television_musica_nombre", nombreValido, "Nombre del archivo de música ambiental para la TV");
    });
    transaccion();
    return obtenerMusica();
  }

  function quitarMusica() {
    exigirSesion(true);
    db.prepare("DELETE FROM configuracion WHERE clave IN ('television_musica_ruta', 'television_musica_nombre')").run();
  }

  return {
    listarMultimedia,
    crearMultimedia,
    actualizarMultimedia,
    cambiarEstadoMultimedia,
    eliminarMultimedia,
    obtenerMusica,
    guardarMusica,
    guardarVolumenMusica,
    quitarMusica,
  };
}
