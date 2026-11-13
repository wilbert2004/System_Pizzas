export const version = 4;
export const descripcion = "Duración automática o manual para anuncios de televisión";
export const sql = `
  ALTER TABLE multimedia ADD COLUMN duracion_modo TEXT NOT NULL DEFAULT 'manual'
    CHECK (duracion_modo IN ('automatico', 'manual'));
`;
