const obtenerAPI = () => {
  if (!window.sistema?.puntoVenta) {
    throw new Error("El servicio de punto de venta no está disponible.");
  }

  return window.sistema.puntoVenta;
};

export const servicioPuntoVenta = {
  obtenerCatalogo: () => obtenerAPI().obtenerCatalogo(),

  buscarClientes: (busqueda) => obtenerAPI().buscarClientes(busqueda),

  crearPedido: (datos) => obtenerAPI().crearPedido(datos),
};
