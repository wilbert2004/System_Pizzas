export function validarProducto(datos) {
  const errores = {};

  if (!datos.nombre?.trim()) {
    errores.nombre = "El nombre es obligatorio.";
  }

  if (!datos.categoria_id) {
    errores.categoria_id = "Selecciona una categoría.";
  }

  if (!datos.presentaciones?.length) {
    errores.presentaciones = "Agrega al menos una presentación.";
  }

  for (const presentacion of datos.presentaciones || []) {
    if (!presentacion.nombre?.trim()) {
      errores.presentaciones = "Todas las presentaciones necesitan un nombre.";
      break;
    }

    const precio = Number(presentacion.precio_centavos);

    if (!Number.isSafeInteger(precio) || precio < 0) {
      errores.presentaciones = "Hay un precio no válido.";
      break;
    }
  }

  if (!datos.requiere_presentacion && datos.presentaciones?.length !== 1) {
    errores.presentaciones =
      "Un producto de presentación única necesita exactamente una presentación.";
  }

  return errores;
}

export function validarAdicional(datos) {
  const errores = {};

  if (!datos.nombre?.trim()) {
    errores.nombre = "El nombre es obligatorio.";
  }

  const precio = Number(datos.precio_centavos);

  if (!Number.isSafeInteger(precio) || precio < 0) {
    errores.precio_centavos = "El precio no es válido.";
  }

  return errores;
}
