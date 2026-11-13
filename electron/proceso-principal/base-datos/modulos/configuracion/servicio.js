const VALORES_PREDETERMINADOS = {
  nombre_negocio: "Pizzería",
  telefono_negocio: "",
  direccion_negocio: "",
  horario_negocio: "",
  logotipo_ruta: "",
  moneda: "MXN",
  tiempo_preparacion_minutos: "20",
  volumen_notificaciones: "70",
};

export function crearServicioConfiguracion(db, obtenerSesion) {
  function exigirAdministrador() {
    const sesion = obtenerSesion();
    if (!sesion?.id) throw new Error("Debes iniciar sesión.");
    if (sesion.rol !== "administrador") throw new Error("Solo un administrador puede cambiar la configuración.");
    return sesion;
  }

  function listar() {
    exigirAdministrador();
    const guardados = db.prepare("SELECT clave, valor FROM configuracion").all();
    return { ...VALORES_PREDETERMINADOS, ...Object.fromEntries(guardados.map(({ clave, valor }) => [clave, valor ?? ""])) };
  }

  function publica() {
    const sesion = obtenerSesion();
    if (!sesion?.id) throw new Error("Debes iniciar sesión.");
    const filas = db.prepare("SELECT clave, valor FROM configuracion WHERE clave IN ('nombre_negocio', 'telefono_negocio', 'logotipo_ruta')").all();
    return { ...VALORES_PREDETERMINADOS, ...Object.fromEntries(filas.map(({ clave, valor }) => [clave, valor ?? ""])) };
  }

  function operativa() {
    const sesion = obtenerSesion();
    if (!sesion?.id) throw new Error("Debes iniciar sesión.");
    const guardados = db.prepare(`SELECT clave, valor FROM configuracion
      WHERE clave IN ('tiempo_preparacion_minutos', 'volumen_notificaciones')`).all();
    const valores = Object.fromEntries(guardados.map(({ clave, valor }) => [clave, valor]));
    return {
      tiempoPreparacionMinutos: Number(valores.tiempo_preparacion_minutos || VALORES_PREDETERMINADOS.tiempo_preparacion_minutos),
      volumenNotificaciones: Number(valores.volumen_notificaciones || VALORES_PREDETERMINADOS.volumen_notificaciones),
    };
  }

  function guardar(datos) {
    const sesion = exigirAdministrador();
    const valores = { ...VALORES_PREDETERMINADOS };
    for (const clave of Object.keys(valores)) {
      valores[clave] = String(datos?.[clave] ?? "").trim();
    }
    if (!valores.nombre_negocio || valores.nombre_negocio.length > 100) throw new Error("El nombre comercial es obligatorio y debe tener máximo 100 caracteres.");
    if (valores.telefono_negocio.length > 30 || valores.direccion_negocio.length > 250 || valores.horario_negocio.length > 250 || valores.logotipo_ruta.length > 500) throw new Error("Revisa el largo de los datos del negocio.");
    const preparacion = Number(valores.tiempo_preparacion_minutos);
    const volumen = Number(valores.volumen_notificaciones);
    if (!Number.isInteger(preparacion) || preparacion < 1 || preparacion > 600) throw new Error("El tiempo de preparación debe estar entre 1 y 600 minutos.");
    if (!Number.isInteger(volumen) || volumen < 0 || volumen > 100) throw new Error("El volumen debe estar entre 0 y 100.");
    if (valores.moneda !== "MXN") throw new Error("La moneda disponible actualmente es MXN.");
    const guardarCambios = db.transaction(() => {
      const upsert = db.prepare(`INSERT INTO configuracion (clave, valor, descripcion, actualizado_en)
        VALUES (?, ?, ?, datetime('now', 'localtime'))
        ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, descripcion = excluded.descripcion,
          actualizado_en = excluded.actualizado_en`);
      for (const [clave, valor] of Object.entries(valores)) upsert.run(clave, valor, "Configuración del negocio");
      db.prepare(`INSERT INTO registro_actividad (usuario_id, accion, modulo, descripcion, fecha)
        VALUES (?, 'actualizar', 'configuracion', 'Actualizó la configuración del negocio.', datetime('now', 'localtime'))`).run(sesion.id);
    });
    guardarCambios();
    return listar();
  }

  return { listar, publica, guardar, operativa };
}
