import { create } from "zustand";
import { servicioAutenticacion } from "../servicios/autenticacion.js";

export const useEstadoAutenticacion = create((set) => ({
  usuario: null,
  cargando: true,
  necesitaAdministrador: false,

  inicializar: async () => {
    try {
      const estado = await servicioAutenticacion.obtenerEstadoInicial();

      set({
        usuario: estado.sesion,
        necesitaAdministrador: estado.necesitaAdministrador,
        cargando: false,
      });
    } catch (error) {
      set({ cargando: false });
      throw error;
    }
  },

  iniciarSesion: async (datos) => {
    const usuario = await servicioAutenticacion.iniciarSesion(datos);
    set({ usuario, cargando: false });
    return usuario;
  },

  cerrarSesion: async () => {
    await servicioAutenticacion.cerrarSesion();
    set({ usuario: null, cargando: false });
  },
}));
