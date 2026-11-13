import { create } from "zustand";
import { servicioCocina } from "../servicios/cocina";

export const useEstadoCocina = create((set, get) => ({
  pedidos: [],
  pedidoSeleccionado: null,
  cargando: false,
  actualizando: false,
  error: null,
  ultimaActualizacion: null,

  cargarPedidos: async (silencioso = false) => {
    try {
      if (silencioso) {
        set({ actualizando: true });
      } else {
        set({ cargando: true });
      }

      const pedidos = await servicioCocina.listarPedidos();

      set({
        pedidos,
        ultimaActualizacion: new Date(),
        error: null,
      });

      const seleccionado = get().pedidoSeleccionado;

      if (seleccionado) {
        const actualizado = pedidos.find(
          (pedido) => pedido.id === seleccionado.id,
        );

        set({
          pedidoSeleccionado: actualizado || null,
        });
      }

      return pedidos;
    } catch (error) {
      console.error("Error al cargar pedidos de cocina:", error);

      set({
        error: error.message || "No se pudieron cargar los pedidos.",
      });

      return [];
    } finally {
      set({
        cargando: false,
        actualizando: false,
      });
    }
  },

  seleccionarPedido: (pedido) => {
    set({ pedidoSeleccionado: pedido });
  },

  cerrarDetalle: () => {
    set({ pedidoSeleccionado: null });
  },

  avanzarPedido: async (pedido, nuevoEstado, tiempoEstimadoMinutos = null) => {
    try {
      await servicioCocina.cambiarEstado(
        pedido.id,
        nuevoEstado,
        null,
        tiempoEstimadoMinutos,
      );

      await get().cargarPedidos(true);

      return { correcto: true };
    } catch (error) {
      console.error("Error al cambiar estado del pedido:", error);

      set({
        error: error.message || "No se pudo actualizar el pedido.",
      });

      return {
        correcto: false,
        error: error.message,
      };
    }
  },

  limpiarError: () => set({ error: null }),
}));
