export const version = 5;
export const descripcion = "Indicar si los productos requieren preparación";
export const sql = `
  ALTER TABLE productos ADD COLUMN requiere_preparacion INTEGER NOT NULL DEFAULT 1
    CHECK (requiere_preparacion IN (0, 1));

  ALTER TABLE pedido_detalles ADD COLUMN requiere_preparacion INTEGER NOT NULL DEFAULT 1
    CHECK (requiere_preparacion IN (0, 1));
`;
