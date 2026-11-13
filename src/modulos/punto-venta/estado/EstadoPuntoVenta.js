import { create } from "zustand";
import { servicioPuntoVenta } from "../servicios/puntoVenta.js";

export const useEstadoPuntoVenta = create((set, get) => ({
  catalogo: [],
  categorias: [],
  carrito: [],
  categoriaSeleccionada: "todos",
  busquedaProducto: "",
  cliente: null,
  tipo: "recoger",
  canal: "mostrador",
  costoEnvioCentavos: 0,
  descuentoCentavos: 0,
  motivoDescuento: "",
  direccionEntrega: "",
  referenciasEntrega: "",
  notas: "",
  tiempoEstimadoMinutos: "",
  cargando: false,
  guardando: false,
  error: null,

  cargarCatalogo: async () => {
    set({ cargando: true, error: null });

    try {
      const resultado = await servicioPuntoVenta.obtenerCatalogo();

      set({
        categorias: resultado.categorias,
        catalogo: resultado.productos,
        cargando: false,
      });

      return resultado;
    } catch (error) {
      set({
        cargando: false,
        error: error.message || "No se pudo cargar el catálogo.",
      });

      throw error;
    }
  },

  establecerCategoria: (categoriaSeleccionada) =>
    set({ categoriaSeleccionada }),

  establecerBusquedaProducto: (busquedaProducto) => set({ busquedaProducto }),

  agregarProducto: (producto, presentacion, adicionales = []) => {
    const cantidadAdicionales = adicionales.reduce(
      (total, item) => total + item.precio_centavos * item.cantidad,
      0,
    );

    const precioUnitario = presentacion.precio_centavos + cantidadAdicionales;

    const carrito = get().carrito;

    set({
      carrito: [
        ...carrito,
        {
          clave: `${Date.now()}-${Math.random()}`,
          productoId: producto.id,
          presentacionId: presentacion.id,
          nombreProducto: producto.nombre,
          nombrePresentacion: presentacion.nombre,
          precioPresentacionCentavos: presentacion.precio_centavos,
          cantidad: 1,
          adicionales: adicionales.map((item) => ({ ...item })),
          precioUnitarioCentavos: precioUnitario,
          notas: "",
        },
      ],
    });
  },

  cambiarCantidad: (clave, cantidad) => {
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) return;

    set((estado) => ({
      carrito: estado.carrito.map((item) =>
        item.clave === clave ? { ...item, cantidad } : item,
      ),
    }));
  },

  cambiarNotasProducto: (clave, notas) =>
    set((estado) => ({
      carrito: estado.carrito.map((item) =>
        item.clave === clave ? { ...item, notas } : item,
      ),
    })),

  eliminarProducto: (clave) =>
    set((estado) => ({
      carrito: estado.carrito.filter((item) => item.clave !== clave),
    })),

  limpiarCarrito: () => set({ carrito: [] }),

  establecerCliente: (cliente) => set({ cliente }),

  establecerTipo: (tipo) =>
    set({
      tipo,
      costoEnvioCentavos: tipo === "recoger" ? 0 : get().costoEnvioCentavos,
      direccionEntrega:
        tipo === "domicilio"
          ? get().direccionEntrega || get().cliente?.direccion || ""
          : "",
      referenciasEntrega:
        tipo === "domicilio"
          ? get().referenciasEntrega || get().cliente?.referencias || ""
          : "",
    }),

  establecerCanal: (canal) => set({ canal }),

  establecerCostoEnvio: (costoEnvioCentavos) => set({ costoEnvioCentavos }),

  establecerDescuento: (descuentoCentavos, motivoDescuento) =>
    set({ descuentoCentavos, motivoDescuento }),

  establecerDireccion: (direccionEntrega) => set({ direccionEntrega }),

  establecerReferencias: (referenciasEntrega) => set({ referenciasEntrega }),

  establecerNotas: (notas) => set({ notas }),

  establecerTiempoEstimado: (tiempoEstimadoMinutos) =>
    set({ tiempoEstimadoMinutos }),

  obtenerSubtotal: () =>
    get().carrito.reduce(
      (total, item) => total + item.precioUnitarioCentavos * item.cantidad,
      0,
    ),

  obtenerTotal: () => {
    const estado = get();

    return (
      estado.obtenerSubtotal() -
      estado.descuentoCentavos +
      estado.costoEnvioCentavos
    );
  },

  confirmarPedido: async () => {
    const estado = get();

    if (estado.carrito.length === 0) {
      throw new Error("Agrega productos al pedido.");
    }

    set({ guardando: true, error: null });

    try {
      const resultado = await servicioPuntoVenta.crearPedido({
        productos: estado.carrito.map((item) => ({
          productoId: item.productoId,
          presentacionId: item.presentacionId,
          cantidad: item.cantidad,
          notas: item.notas,
          adicionales: item.adicionales.map((extra) => ({
            id: extra.id,
            cantidad: extra.cantidad,
          })),
        })),
        clienteId: estado.cliente?.id || null,
        canal: estado.canal,
        tipo: estado.tipo,
        costoEnvioCentavos:
          estado.tipo === "recoger" ? 0 : estado.costoEnvioCentavos,
        descuentoCentavos: estado.descuentoCentavos,
        motivoDescuento: estado.motivoDescuento,
        direccionEntrega: estado.direccionEntrega,
        referenciasEntrega: estado.referenciasEntrega,
        notas: estado.notas,
        tiempoEstimadoMinutos: estado.tiempoEstimadoMinutos
          ? Number(estado.tiempoEstimadoMinutos)
          : null,
      });

      set({
        carrito: [],
        cliente: null,
        tipo: "recoger",
        canal: "mostrador",
        costoEnvioCentavos: 0,
        descuentoCentavos: 0,
        motivoDescuento: "",
        direccionEntrega: "",
        referenciasEntrega: "",
        notas: "",
        tiempoEstimadoMinutos: "",
        guardando: false,
      });

      return resultado;
    } catch (error) {
      set({
        guardando: false,
        error: error.message || "No se pudo registrar el pedido.",
      });

      throw error;
    }
  },
}));
