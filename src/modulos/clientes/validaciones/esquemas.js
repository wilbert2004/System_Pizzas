import { z } from "zod";

export const esquemaCliente = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del cliente.")
    .max(100, "El nombre es demasiado largo."),

  telefono: z
    .string()
    .trim()
    .regex(/^[0-9+\s()-]{7,20}$/, "Ingresa un teléfono válido."),

  direccion: z
    .string()
    .trim()
    .max(300, "La dirección es demasiado larga.")
    .optional()
    .default(""),

  referencias: z
    .string()
    .trim()
    .max(500, "Las referencias son demasiado largas.")
    .optional()
    .default(""),
});
