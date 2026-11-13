import { z } from "zod";

export const esquemaPedido = z.object({
  canal: z.enum(["mostrador", "telefono", "whatsapp"]),
  tipo: z.enum(["recoger", "domicilio"]),
  costoEnvioCentavos: z.number().int().nonnegative(),
  descuentoCentavos: z.number().int().nonnegative(),
  motivoDescuento: z.string().max(300),
  direccionEntrega: z.string().max(300),
  referenciasEntrega: z.string().max(500),
  notas: z.string().max(1000),
  productos: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        presentacionId: z.number().int().positive(),
        cantidad: z.number().int().min(1).max(99),
        notas: z.string().max(500),
        adicionales: z.array(
          z.object({
            id: z.number().int().positive(),
            cantidad: z.number().int().min(1).max(20),
          }),
        ),
      }),
    )
    .min(1),
});
