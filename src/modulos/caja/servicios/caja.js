function obtenerAPI() {
  if (!window.sistema?.caja) throw new Error("El servicio de caja no está disponible.");
  return window.sistema.caja;
}

export const servicioCaja = {
  estado: () => obtenerAPI().estado(),
  validarCierre: () => obtenerAPI().validarCierre(),
  abrir: (datos) => obtenerAPI().abrir(datos),
  registrarPago: (datos) => obtenerAPI().registrarPago(datos),
  registrarMovimiento: (datos) => obtenerAPI().registrarMovimiento(datos),
  cerrar: (datos) => obtenerAPI().cerrar(datos),
};
