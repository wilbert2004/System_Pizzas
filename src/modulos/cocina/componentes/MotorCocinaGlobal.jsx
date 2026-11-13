import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useEstadoCocina } from "../estado/EstadoCocina";
import { calcularTiemposPedido } from "../servicios/tiemposPedido";

function leerTemporizadores() {
  try {
    return JSON.parse(localStorage.getItem("cocina-temporizadores") || "{}");
  } catch {
    return {};
  }
}

function guardarTemporizadores(temporizadores) {
  localStorage.setItem("cocina-temporizadores", JSON.stringify(temporizadores));
  window.dispatchEvent(new CustomEvent("cocina:temporizadores-actualizados"));
}

export default function MotorCocinaGlobal() {
  const { pathname } = useLocation();
  const estaEnPantallaSecundaria = ["/", "/pantalla-tv", "/pantalla-produccion"].includes(pathname);
  const procesando = useRef(new Set());
  const estadosConocidos = useRef(null);

  useEffect(() => {
    if (estaEnPantallaSecundaria) return undefined;

    let vigente = true;
    const canal = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("pizzeria-cocina")
      : null;

    const sincronizar = async () => {
      if (!vigente) return;
      const apiPedidos = window.sistema?.pedidos;
      if (!apiPedidos?.listar || !apiPedidos?.cambiarEstado) return;

      try {
        const pedidos = await apiPedidos.listar({ limite: 200 });
        const estadosActuales = new Map((pedidos || []).map((pedido) => [pedido.id, pedido.estado]));
        let huboCambios = false;
        if (estadosConocidos.current) {
          for (const pedido of pedidos || []) {
            const estadoAnterior = estadosConocidos.current.get(pedido.id);
            if (estadoAnterior !== pedido.estado) {
              canal?.postMessage({ tipo: "pedido-actualizado", pedidoId: pedido.id, estado: pedido.estado });
              huboCambios = true;
            }
          }
        }
        estadosConocidos.current = estadosActuales;

        if (localStorage.getItem("cocina-modo-operacion") !== "automatico") {
          if (huboCambios) await useEstadoCocina.getState().cargarPedidos(true);
          return;
        }

        const temporizadores = leerTemporizadores();

        for (const pedido of pedidos || []) {
          if (!["Preparando", "En horno"].includes(pedido.estado) || procesando.current.has(pedido.id)) continue;
          const temporizador = temporizadores[pedido.id] || {};
          const fase = pedido.estado === "Preparando" ? temporizador.preparacion : temporizador;
          if (!fase?.automatico || !fase.iniciadoEn || !fase.minutos) continue;

          const { faseRestante } = calcularTiemposPedido(pedido, temporizador, Date.now());
          if (faseRestante === null || faseRestante > 0) continue;

          procesando.current.add(pedido.id);
          try {
            if (pedido.estado === "Preparando") {
              const minutosHorno = Number(fase.minutosHorno || temporizador.minutosHorno || 12);
              await apiPedidos.cambiarEstado(pedido.id, "En horno", null, null);
              const nuevoTemporizador = {
                ...temporizador,
                minutos: minutosHorno,
                iniciadoEn: new Date().toISOString(),
                automatico: true,
                minutosHorno,
              };
              temporizadores[pedido.id] = nuevoTemporizador;
              guardarTemporizadores(temporizadores);
              canal?.postMessage({ tipo: "pedido-actualizado", pedidoId: pedido.id, estado: "En horno" });
              estadosConocidos.current.set(pedido.id, "En horno");
            } else {
              await apiPedidos.cambiarEstado(pedido.id, "Listo", null, null);
              canal?.postMessage({ tipo: "pedido-actualizado", pedidoId: pedido.id, estado: "Listo" });
              estadosConocidos.current.set(pedido.id, "Listo");
            }
            huboCambios = true;
          } catch (error) {
            console.warn(`No se pudo avanzar automáticamente el pedido ${pedido.folio || pedido.id}:`, error);
          } finally {
            procesando.current.delete(pedido.id);
          }
        }

        if (huboCambios) {
          await useEstadoCocina.getState().cargarPedidos(true);
        }
      } catch (error) {
        if (vigente) console.warn("No se pudo sincronizar el motor global de cocina:", error);
      }
    };

    void sincronizar();
    const intervalo = setInterval(() => void sincronizar(), 1000);
    return () => {
      vigente = false;
      clearInterval(intervalo);
      canal?.close();
    };
  }, [estaEnPantallaSecundaria]);

  return null;
}
