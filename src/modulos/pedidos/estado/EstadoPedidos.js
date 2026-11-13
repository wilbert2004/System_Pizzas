
import { create } from "zustand";
import { servicioPedidos } from "../servicios/pedidos.js";

const resumenInicial = {
  Nuevo: 0,
  Preparando: 0,
  "En horno": 0,
  Listo: 0,
  "En reparto": 0,
  Entregado: 0,
  Cancelado: 0
};

export const useEstadoPedidos = create((set, get) => ({
  pedidos: [],
  pedidoSeleccionado: null,
  resumen: resumenInicial,

  filtros: {
    busqueda: "",
    estado: "todos",
    tipo: "todos",
    fechaDesde: "",
    fechaHasta: "",
    limite: 200
  },

  cargando: false,
  guardando: false,
  error: null,

  establecerFiltro: (campo, valor) =>
    set((estado) => ({
      filtros: {
        ...estado.filtros,
        [campo]: valor
      }
    })),

  limpiarFiltros: () =>
    set({
      filtros: {
        busqueda: "",
        estado: "todos",
        tipo: "todos",
        fechaDesde: "",
        fechaHasta: "",
        limite: 200
      }
    }),

  cargarPedidos: async () => {
    set({ cargando: true, error: null });

    try {
      const [pedidos, resumen] = await Promise.all([
        servicioPedidos.listar(get().filtros),
        servicioPedidos.resumen()
      ]);

      set({
        pedidos,
        resumen,
        cargando: false
      });

      return pedidos;
    } catch (error) {
      set({
        cargando: false,
        error: error.message || "No se pudieron cargar los pedidos."
      });

      throw error;
    }
  },

  seleccionarPedido: async (id) => {
    set({ error: null });

    try {
      const pedido = await servicioPedidos.obtener(id);

      set({ pedidoSeleccionado: pedido });

      return pedido;
    } catch (error) {
      set({
        error: error.message || "No se pudo consultar el pedido."
      });

      throw error;
    }
  },

  cerrarDetalle: () => set({ pedidoSeleccionado: null }),

  cambiarEstadoPedido: async (id, nuevoEstado, motivo = "") => {
    set({ guardando: true, error: null });

    try {
      const pedido = await servicioPedidos.cambiarEstado(
        id,
        nuevoEstado,
        motivo
      );

      set({
        pedidoSeleccionado: pedido,
        guardando: false
      });

      await get().cargarPedidos();

      return pedido;
    } catch (error) {
      set({
        guardando: false,
        error: error.message || "No se pudo cambiar el estado."
      });

      throw error;
    }
  },

  limpiarError: () => set({ error: null })
}));
