import { useEffect, useRef, useState } from "react";
import { useEstadoTV } from "../estado/EstadoTV";

export function usePedidosTV() {
  const pedidos = useEstadoTV((estado) => estado.pedidos);
  const cargarPedidos = useEstadoTV((estado) => estado.cargarPedidos);
  const ultimaActualizacion = useEstadoTV((estado) => estado.ultimaActualizacion);
  const [avisosListos, setAvisosListos] = useState([]);
  const estadosAnteriores = useRef(null);
  const temporizadorAviso = useRef(null);

  useEffect(() => {
    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos();
    }, 5000);

    const canal = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("pizzeria-cocina")
      : null;
    const actualizarPedidos = (evento) => {
      if (evento.data?.tipo === "pedido-actualizado") void cargarPedidos();
    };
    canal?.addEventListener("message", actualizarPedidos);

    return () => {
      clearInterval(intervalo);
      canal?.removeEventListener("message", actualizarPedidos);
      canal?.close();
    };
  }, [cargarPedidos]);

  useEffect(() => {
    if (!ultimaActualizacion) return;
    const actuales = new Map(pedidos.map((pedido) => [pedido.id, pedido.estado]));
    if (estadosAnteriores.current) {
      const nuevos = pedidos.filter((pedido) =>
        pedido.estado === "Listo" && estadosAnteriores.current.get(pedido.id) !== "Listo",
      );
      if (nuevos.length) {
        setAvisosListos(nuevos);
        clearTimeout(temporizadorAviso.current);
        temporizadorAviso.current = setTimeout(() => setAvisosListos([]), 16000);
        estadosAnteriores.current = actuales;
      }
    }
    estadosAnteriores.current = actuales;
  }, [pedidos, ultimaActualizacion]);

  useEffect(() => () => clearTimeout(temporizadorAviso.current), []);

  return {
    pedidosPreparando: pedidos.filter(
      (pedido) =>
        pedido.estado === "Preparando" || pedido.estado === "En horno",
    ),

    pedidosListos: pedidos.filter((pedido) => pedido.estado === "Listo"),
    avisosListos,
  };
}
