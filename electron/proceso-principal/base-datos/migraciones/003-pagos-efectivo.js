export const version = 3;
export const descripcion = "Registro del efectivo recibido y el cambio de los pagos";
export const sql = `
  ALTER TABLE pagos ADD COLUMN monto_recibido_centavos INTEGER NOT NULL DEFAULT 0 CHECK (monto_recibido_centavos >= 0);
  ALTER TABLE pagos ADD COLUMN cambio_centavos INTEGER NOT NULL DEFAULT 0 CHECK (cambio_centavos >= 0);
  UPDATE pagos SET monto_recibido_centavos = monto_centavos WHERE monto_recibido_centavos = 0;
`;
