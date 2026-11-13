import { create } from "zustand";
import { servicioClientes } from "../servicios/clientes.js";

export const useEstadoClientes = create((set, get) => ({
  clientes: [],
  clienteSeleccionado: null,
  historial: null,
  cargando: false,
  error: null,
  busqueda: "",
  incluirInactivos: false,

  establecerBusqueda: (busqueda) => set({ busqueda }),

  establecerIncluirInactivos: (incluirInactivos) => set({ incluirInactivos }),

  cargarClientes: async () => {
    set({ cargando: true, error: null });

    try {
      const { busqueda, incluirInactivos } = get();

      const clientes = await servicioClientes.listar({
        busqueda,
        incluirInactivos,
      });

      set({ clientes, cargando: false });
      return clientes;
    } catch (error) {
      set({
        error: error.message || "No se pudieron cargar los clientes.",
        cargando: false,
      });

      throw error;
    }
  },

  crearCliente: async (datos) => {
    const cliente = await servicioClientes.crear(datos);

    set((estado) => ({
      clientes: [...estado.clientes, cliente].sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      ),
    }));

    return cliente;
  },

  actualizarCliente: async (id, datos) => {
    const cliente = await servicioClientes.actualizar(id, datos);

    set((estado) => ({
      clientes: estado.clientes.map((item) =>
        item.id === id ? cliente : item,
      ),
      clienteSeleccionado:
        estado.clienteSeleccionado?.id === id
          ? cliente
          : estado.clienteSeleccionado,
    }));

    return cliente;
  },

  cambiarEstadoCliente: async (id, activo) => {
    const cliente = await servicioClientes.cambiarEstado(id, activo);

    await get().cargarClientes();

    return cliente;
  },

  seleccionarCliente: async (id) => {
    set({
      cargando: true,
      error: null,
      historial: null,
    });

    try {
      const historial = await servicioClientes.obtenerHistorial(id);

      set({
        clienteSeleccionado: historial.cliente,
        historial,
        cargando: false,
      });

      return historial;
    } catch (error) {
      set({
        error: error.message || "No se pudo consultar el historial.",
        cargando: false,
      });

      throw error;
    }
  },

  limpiarSeleccion: () =>
    set({
      clienteSeleccionado: null,
      historial: null,
    }),

  limpiarError: () => set({ error: null }),
}));
