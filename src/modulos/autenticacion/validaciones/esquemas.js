export function validarCredenciales(datos) {
  const errores = {};

  if (!datos.usuario?.trim()) {
    errores.usuario = "Ingresa tu usuario.";
  }

  if (!datos.contrasena) {
    errores.contrasena = "Ingresa tu contraseña.";
  }

  return errores;
}

export function validarAdministrador(datos) {
  const errores = {};

  if (!datos.nombre?.trim()) {
    errores.nombre = "El nombre es obligatorio.";
  }

  if (!datos.usuario?.trim()) {
    errores.usuario = "El usuario es obligatorio.";
  }

  if (!datos.contrasena || datos.contrasena.length < 8) {
    errores.contrasena = "Utiliza al menos 8 caracteres.";
  }

  if (datos.contrasena !== datos.confirmarContrasena) {
    errores.confirmarContrasena = "Las contraseñas no coinciden.";
  }

  return errores;
}
