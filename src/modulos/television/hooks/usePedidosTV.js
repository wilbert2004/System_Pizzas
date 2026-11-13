import { useEffect } from "react";
import { useEstadoTV } from "../estado/EstadoTV";

export function usePedidosTV() {
  const pedidos = useEstadoTV((estado) => estado.pedidos);
  const cargarPedidos = useEstadoTV((estado) => estado.cargarPedidos);

  useEffect(() => {
    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [cargarPedidos]);

  return {
    pedidosPreparando: pedidos.filter(
      (pedido) =>
        pedido.estado === "Preparando" || pedido.estado === "En horno",
    ),

    pedidosListos: pedidos.filter((pedido) => pedido.estado === "Listo"),
  };
}
