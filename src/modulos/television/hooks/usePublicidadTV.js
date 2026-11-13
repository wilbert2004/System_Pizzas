import { useEffect } from "react";
import { useEstadoTV } from "../estado/EstadoTV";

export function usePublicidadTV() {
  const publicidad = useEstadoTV((estado) => estado.publicidad);
  const cargarPublicidad = useEstadoTV((estado) => estado.cargarPublicidad);

  useEffect(() => {
    cargarPublicidad();

    const intervalo = setInterval(cargarPublicidad, 30000);

    return () => clearInterval(intervalo);
  }, [cargarPublicidad]);

  return publicidad
    .filter((elemento) => Boolean(elemento.activo))
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}
