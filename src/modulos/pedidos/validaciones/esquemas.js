import { z } from "zod";

export const ESTADOS_PEDIDO = [
  "Nuevo",
  "Preparando",
  "En horno",
  "Listo",
  "En reparto",
  "Entregado",
  "Cancelado",
];

export const esquemaCancelacion = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, "Escribe un motivo de al menos 5 caracteres.")
    .max(500, "El motivo no puede superar 500 caracteres."),
});

export const esquemaFiltros = z.object({
  busqueda: z.string().max(100).default(""),
  estado: z.string().default("todos"),
  tipo: z.enum(["todos", "recoger", "domicilio"]).default("todos"),
  fechaDesde: z.string().default(""),
  fechaHasta: z.string().default(""),
});
