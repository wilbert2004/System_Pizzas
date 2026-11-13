import { create } from "zustand";
import { servicioProductos } from "../servicios/productos.js";

export const useEstadoProductos = create((set) => ({
  productos: [],
  categorias: [],
  adicionales: [],
  cargando: false,
  error: null,

  cargarCatalogo: async () => {
    set({ cargando: true, error: null });

    try {
      const [productos, categorias, adicionales] = await Promise.all([
        servicioProductos.listar(),
        servicioProductos.listarCategorias(),
        servicioProductos.listarAdicionales(),
      ]);

      set({
        productos,
        categorias,
        adicionales,
        cargando: false,
      });
    } catch (error) {
      set({
        error: error.message,
        cargando: false,
      });

      throw error;
    }
  },
}));
