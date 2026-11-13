import { create } from "zustand";
import { servicioTelevision } from "../servicios/television";

export const useEstadoTV = create((set, get) => ({
  pedidos: [],
  publicidad: [],
  cargando: false,
  error: null,
  ultimaActualizacion: null,

  cargarPedidos: async () => {
    try {
      const pedidos = await servicioTelevision.listarPedidos();

      set({
        pedidos,
        ultimaActualizacion: new Date(),
      });
    } catch (error) {
      console.error("Error cargando pedidos TV:", error);
      set({ error: error.message });
    }
  },

  cargarPublicidad: async () => {
    try {
      const publicidad = await servicioTelevision.listarPublicidad();

      set({
        publicidad: Array.isArray(publicidad)
          ? publicidad.filter((elemento) => Number(elemento.activo) === 1)
          : [],
      });
    } catch (error) {
      console.error("Error cargando publicidad:", error);
      set({ error: error.message });
    }
  },

  cargarTodo: async () => {
    set({ cargando: true, error: null });

    try {
      await Promise.all([get().cargarPedidos(), get().cargarPublicidad()]);
    } finally {
      set({ cargando: false });
    }
  },

  agregarPublicidad: async (datos) => {
    await servicioTelevision.crearPublicidad(datos);
    await get().cargarPublicidad();
  },

  actualizarPublicidad: async (id, datos) => {
    await servicioTelevision.actualizarPublicidad(id, datos);
    await get().cargarPublicidad();
  },

  cambiarEstadoPublicidad: async (id, activo) => {
    await servicioTelevision.cambiarEstadoPublicidad(id, activo);
    await get().cargarPublicidad();
  },

  eliminarPublicidad: async (id) => {
    await servicioTelevision.eliminarPublicidad(id);
    await get().cargarPublicidad();
  },

  limpiarError: () => set({ error: null }),
}));
