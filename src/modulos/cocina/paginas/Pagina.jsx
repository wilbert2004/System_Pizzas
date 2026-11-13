import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { useEstadoCocina } from "../estado/EstadoCocina";
import { servicioCocina } from "../servicios/cocina";
import { useAlarmasCocina } from "../hooks/useAlarmasCocina";

import ColumnaPedidos from "../componentes/ColumnaPedidos";
import DetalleProductos from "../componentes/DetalleProductos";
import AlertaRetraso from "../componentes/AlertaRetraso";

const COLUMNAS = [
  {
    estado: "Nuevo",
    titulo: "Pedidos nuevos",
    color: "bg-blue-100 text-blue-900",
  },
  {
    estado: "Preparando",
    titulo: "En preparación",
    color: "bg-violet-100 text-violet-900",
  },
  {
    estado: "En horno",
    titulo: "En horno",
    color: "bg-orange-100 text-orange-900",
  },
  {
    estado: "Listo",
    titulo: "Pedidos listos",
    color: "bg-emerald-100 text-emerald-900",
  },
];

function leerTemporizadores() {
  try {
    return JSON.parse(localStorage.getItem("cocina-temporizadores") || "{}");
  } catch {
    return {};
  }
}

function obtenerMinutosRestantes(iniciadoEn, minutos) {
  const estimado = Number(minutos) || 1;
  if (!iniciadoEn) return estimado;
  const restante = Math.ceil((new Date(iniciadoEn).getTime() + estimado * 60000 - Date.now()) / 60000);
  return Number.isFinite(restante) ? Math.max(1, restante) : estimado;
}

export default function PaginaCocina() {
  const pedidos = useEstadoCocina((estado) => estado.pedidos);
  const cargando = useEstadoCocina((estado) => estado.cargando);
  const error = useEstadoCocina((estado) => estado.error);
  const ultimaActualizacion = useEstadoCocina(
    (estado) => estado.ultimaActualizacion,
  );

  const cargarPedidos = useEstadoCocina((estado) => estado.cargarPedidos);
  const avanzarPedido = useEstadoCocina((estado) => estado.avanzarPedido);
  const limpiarError = useEstadoCocina((estado) => estado.limpiarError);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [temporizadores, setTemporizadores] = useState(leerTemporizadores);
  const [temporizadorPendiente, setTemporizadorPendiente] = useState(null);
  const [pedidoConfirmacion, setPedidoConfirmacion] = useState(null);
  const [modoOperacion, setModoOperacion] = useState(() =>
    localStorage.getItem("cocina-modo-operacion") === "automatico" ? "automatico" : "manual",
  );
  const [ahora, setAhora] = useState(Date.now());
  const avancesAutomaticos = useRef(new Set());

  const {
    pedidosRetrasados,
    cantidadRetrasados,
    sonidoActivo,
    activarSonido,
    notificarPedidoListo,
  } = useAlarmasCocina(pedidos, temporizadores);

  useEffect(() => {
    localStorage.setItem("cocina-temporizadores", JSON.stringify(temporizadores));
  }, [temporizadores]);

  useEffect(() => {
    localStorage.setItem("cocina-modo-operacion", modoOperacion);
  }, [modoOperacion]);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos(true);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [cargarPedidos]);

  const pedidosPorEstado = useMemo(() => {
    return COLUMNAS.map((columna) => ({
      ...columna,
      pedidos: pedidos.filter((pedido) => pedido.estado === columna.estado),
    }));
  }, [pedidos]);

  const abrirDetalle = useCallback(async (pedido) => {
    try {
      const detalle = await servicioCocina.obtenerPedido(pedido.id);
      setPedidoSeleccionado(detalle || pedido);
    } catch (error) {
      console.error("No se pudo obtener el detalle:", error);
      setPedidoSeleccionado(pedido);
    }
  }, []);

  const cambiarEstado = async (pedido, nuevoEstado) => {
    const temporizadorPedido = temporizadores[pedido.id];
    if (
      modoOperacion === "automatico" &&
      ((pedido.estado === "Preparando" && temporizadorPedido?.preparacion?.automatico) ||
        (pedido.estado === "En horno" && temporizadorPedido?.automatico))
    ) {
      await avanzarEtapaAutomatica(pedido);
      return;
    }

    if (nuevoEstado === "Listo") {
      setPedidoConfirmacion(pedido);
      return;
    }

    if (["Preparando", "En horno"].includes(nuevoEstado)) {
      const etapa = nuevoEstado === "En horno" ? "horno" : "preparacion";
      setTemporizadorPendiente({
        pedido,
        etapa,
        modo: pedido.estado === "Nuevo" && modoOperacion === "automatico"
          ? "iniciar-automatico"
          : "cambiar-estado",
        minutos: String(
          etapa === "horno"
            ? temporizadores[pedido.id]?.minutos || 15
            : pedido.tiempo_estimado_minutos || 20,
        ),
        minutosHorno: String(temporizadores[pedido.id]?.minutosHorno || 12),
      });
      return;
    }

    setProcesandoId(pedido.id);
    limpiarError();

    const resultado = await avanzarPedido(pedido, nuevoEstado);

    setProcesandoId(null);

    if (!resultado.correcto) {
      useEstadoCocina.setState({ error: resultado.error || "No se pudo actualizar el pedido." });
      return;
    }
    if (pedidoSeleccionado?.id === pedido.id) {
      setPedidoSeleccionado(null);
    }
  };

  const avanzarEtapaAutomatica = useCallback(async (pedido) => {
    if (avancesAutomaticos.current.has(pedido.id)) return;
    avancesAutomaticos.current.add(pedido.id);
    setProcesandoId(pedido.id);
    limpiarError();

    const temporizadorPedido = temporizadores[pedido.id] || {};
    let resultado;
    if (pedido.estado === "Preparando") {
      resultado = await avanzarPedido(pedido, "En horno");
      if (resultado.correcto) {
        const marcaTiempo = {
          minutos: temporizadorPedido.preparacion?.minutosHorno || temporizadorPedido.minutosHorno || 12,
          iniciadoEn: new Date().toISOString(),
          automatico: true,
          minutosHorno: temporizadorPedido.preparacion?.minutosHorno || temporizadorPedido.minutosHorno || 12,
        };
        setTemporizadores((actuales) => ({
          ...actuales,
          [pedido.id]: { ...actuales[pedido.id], ...marcaTiempo },
        }));
      }
    } else if (pedido.estado === "En horno") {
      resultado = await avanzarPedido(pedido, "Listo");
      if (resultado.correcto) notificarPedidoListo();
    }

    setProcesandoId(null);
    avancesAutomaticos.current.delete(pedido.id);
    if (resultado && !resultado.correcto) {
      useEstadoCocina.setState({ error: resultado.error || "No se pudo avanzar el pedido automáticamente." });
    }
  }, [avanzarPedido, limpiarError, notificarPedidoListo, temporizadores]);

  useEffect(() => {
    if (modoOperacion !== "automatico") return;
    for (const pedido of pedidos) {
      const temporizador = temporizadores[pedido.id];
      const fase = pedido.estado === "Preparando"
        ? temporizador?.preparacion
        : pedido.estado === "En horno"
          ? temporizador
          : null;
      if (!fase?.automatico || !fase.iniciadoEn || !fase.minutos) continue;
      const venceEn = new Date(fase.iniciadoEn).getTime() + Number(fase.minutos) * 60000;
      if (ahora >= venceEn) void avanzarEtapaAutomatica(pedido);
    }
  }, [ahora, pedidos, temporizadores, avanzarEtapaAutomatica, modoOperacion]);

  const confirmarPedidoListo = async () => {
    if (!pedidoConfirmacion) return;
    const pedido = pedidoConfirmacion;
    setProcesandoId(pedido.id);
    limpiarError();
    const resultado = await avanzarPedido(pedido, "Listo");
    setProcesandoId(null);

    if (!resultado.correcto) {
      useEstadoCocina.setState({ error: resultado.error || "No se pudo marcar el pedido como listo." });
      return;
    }

    setPedidoConfirmacion(null);
    if (pedidoSeleccionado?.id === pedido.id) setPedidoSeleccionado(null);
    notificarPedidoListo();
  };

  const ajustarTiempo = (pedido) => {
    const etapa = pedido.estado === "En horno" ? "horno" : "preparacion";
    const temporizador = temporizadores[pedido.id];
    setTemporizadorPendiente({
      pedido,
      etapa,
      modo: "ajustar",
      minutos: String(
        obtenerMinutosRestantes(
          etapa === "horno"
            ? temporizador?.iniciadoEn || pedido.fecha_entrada_horno
            : temporizador?.preparacion?.iniciadoEn || pedido.fecha_inicio_preparacion,
          etapa === "horno"
            ? temporizador?.minutos || pedido.tiempo_estimado_minutos || 15
            : temporizador?.preparacion?.minutos || pedido.tiempo_estimado_minutos || 20,
        ),
      ),
    });
  };

  const confirmarTemporizador = async () => {
    const minutos = Number(temporizadorPendiente?.minutos);

    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 600) return;

    const { pedido } = temporizadorPendiente;
    const { etapa, modo } = temporizadorPendiente;

    if (modo === "cambiar-estado" || modo === "iniciar-automatico") {
      setProcesandoId(pedido.id);
      limpiarError();
      const estadoSiguiente = etapa === "horno" ? "En horno" : "Preparando";
      const resultado = await avanzarPedido(
        pedido,
        estadoSiguiente,
        etapa === "preparacion" ? minutos : null,
      );
      setProcesandoId(null);
      if (!resultado.correcto) return;
    }

    const marcaTiempo = { minutos, iniciadoEn: new Date().toISOString() };
    setTemporizadores((actuales) => {
      const temporizadorActual = actuales[pedido.id] || {};
      if (modo === "iniciar-automatico") {
        const minutosHorno = Number(temporizadorPendiente.minutosHorno);
        return {
          ...actuales,
          [pedido.id]: {
            ...temporizadorActual,
            preparacion: { ...marcaTiempo, automatico: true, minutosHorno },
            minutosHorno,
          },
        };
      }
      const temporizadorNuevo = etapa === "horno"
        ? {
            ...temporizadorActual,
            ...marcaTiempo,
            automatico: modo === "ajustar" ? Boolean(temporizadorActual.automatico) : false,
          }
        : {
            ...temporizadorActual,
            preparacion: {
              ...marcaTiempo,
              automatico: modo === "ajustar"
                ? Boolean(temporizadorActual.preparacion?.automatico)
                : false,
              minutosHorno: temporizadorActual.preparacion?.minutosHorno || temporizadorActual.minutosHorno || Number(temporizadorPendiente.minutosHorno) || 12,
            },
            minutosHorno: temporizadorActual.minutosHorno || Number(temporizadorPendiente.minutosHorno) || 12,
          };
      return { ...actuales, [pedido.id]: temporizadorNuevo };
    });

    setTemporizadorPendiente(null);
  };

  const alternarPantallaCompleta = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setPantallaCompleta(true);
      } else {
        await document.exitFullscreen();
        setPantallaCompleta(false);
      }
    } catch (error) {
      console.error("No se pudo cambiar a pantalla completa:", error);
    }
  };

  useEffect(() => {
    const actualizarPantalla = () => {
      setPantallaCompleta(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", actualizarPantalla);

    return () => {
      document.removeEventListener("fullscreenchange", actualizarPantalla);
    };
  }, []);

  const totalActivos = pedidos.length;

  return (
    <main className="min-h-screen space-y-5 bg-slate-50 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-2xl text-white">
              🍕
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Cocina</h1>
              <p className="text-sm text-slate-500">
                Control de preparación de pedidos
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Modo de operación de cocina">
            <button type="button" aria-pressed={modoOperacion === "manual"} onClick={() => setModoOperacion("manual")} className={`rounded-lg px-3 py-2 text-xs font-bold ${modoOperacion === "manual" ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Modo Manual</button>
            <button type="button" aria-pressed={modoOperacion === "automatico"} onClick={() => setModoOperacion("automatico")} className={`rounded-lg px-3 py-2 text-xs font-bold ${modoOperacion === "automatico" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Automático por tiempos</button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
            <p className="text-xs text-slate-500">Pedidos activos</p>
            <p className="text-xl font-extrabold text-slate-900">
              {totalActivos}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
            <p className="text-xs text-slate-500">Retrasados</p>
            <p className="text-xl font-extrabold text-red-600">
              {cantidadRetrasados}
            </p>
          </div>

          <button
            type="button"
            onClick={() => cargarPedidos()}
            disabled={cargando}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {cargando ? "Cargando..." : "↻ Actualizar"}
          </button>

          <button
            type="button"
            onClick={() => activarSonido().catch(() => {})}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
              sonidoActivo
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-white text-red-700 hover:bg-red-50"
            }`}
          >
            {sonidoActivo ? <Volume2 size={17} /> : <VolumeX size={17} />}
            {sonidoActivo ? "Sonido activo" : "Activar sonido"}
          </button>

          <button
            type="button"
            onClick={alternarPantallaCompleta}
            className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700"
          >
            {pantallaCompleta
              ? "Salir de pantalla completa"
              : "Pantalla completa"}
          </button>
        </div>
      </header>

      <AlertaRetraso cantidad={cantidadRetrasados} />

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={limpiarError} className="font-bold">
            Cerrar
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Actualización automática cada 5 segundos</span>

        <span>
          Última actualización:{" "}
          {ultimaActualizacion
            ? ultimaActualizacion.toLocaleTimeString("es-MX")
            : "Pendiente"}
        </span>
      </div>

      {cargando && pedidos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando pedidos de cocina...
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pedidosPorEstado.map((columna) => (
            <ColumnaPedidos
              key={columna.estado}
              titulo={columna.titulo}
              pedidos={columna.pedidos}
              retrasados={pedidosRetrasados}
              color={columna.color}
              onSeleccionar={abrirDetalle}
              onAvanzar={cambiarEstado}
              onAjustarTiempo={ajustarTiempo}
              procesandoId={procesandoId}
              temporizadores={temporizadores}
              modoAutomatico={modoOperacion === "automatico"}
            />
          ))}
        </div>
      )}

      {pedidoSeleccionado && (
        <DetalleProductos
          pedido={pedidoSeleccionado}
          onCerrar={() => setPedidoSeleccionado(null)}
        />
      )}

      {temporizadorPendiente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">
              {temporizadorPendiente.modo === "iniciar-automatico"
                ? "Configurar tiempos por fase"
                : temporizadorPendiente.etapa === "horno"
                  ? "Tiempo de horno"
                  : "Tiempo de preparación"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {temporizadorPendiente.modo === "ajustar"
                ? `Ajusta el tiempo restante del pedido ${temporizadorPendiente.pedido.folio}. El estado no cambiará.`
                : temporizadorPendiente.modo === "iniciar-automatico"
                  ? `Configura ambas fases del pedido ${temporizadorPendiente.pedido.folio}. Avanzará automáticamente al terminar cada tiempo.`
                : temporizadorPendiente.etapa === "horno"
                  ? `Define cuánto tiempo estará en el horno el pedido ${temporizadorPendiente.pedido.folio}.`
                  : `Define el tiempo de preparación del pedido ${temporizadorPendiente.pedido.folio}.`}
            </p>
            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">
                {temporizadorPendiente.modo === "iniciar-automatico" ? "Minutos en preparación" : "Minutos"}
              </span>
              <input
                type="number"
                min="1"
                max="600"
                step="1"
                value={temporizadorPendiente.minutos}
                onChange={(evento) =>
                  setTemporizadorPendiente((actual) => ({
                    ...actual,
                    minutos: evento.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                autoFocus
              />
            </label>
            {temporizadorPendiente.modo === "iniciar-automatico" && (
              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">Minutos en horno</span>
                <input type="number" min="1" max="600" step="1" value={temporizadorPendiente.minutosHorno} onChange={(evento) => setTemporizadorPendiente((actual) => ({ ...actual, minutosHorno: evento.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
              </label>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setTemporizadorPendiente(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarTemporizador}
                disabled={
                  procesandoId === temporizadorPendiente.pedido.id ||
                  !Number.isInteger(Number(temporizadorPendiente.minutos)) ||
                  Number(temporizadorPendiente.minutos) < 1 ||
                  Number(temporizadorPendiente.minutos) > 600 ||
                  (temporizadorPendiente.modo === "iniciar-automatico" && (!Number.isInteger(Number(temporizadorPendiente.minutosHorno)) || Number(temporizadorPendiente.minutosHorno) < 1 || Number(temporizadorPendiente.minutosHorno) > 600))
                }
                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {temporizadorPendiente.modo === "ajustar"
                  ? "Guardar tiempo"
                  : temporizadorPendiente.modo === "iniciar-automatico"
                    ? "Confirmar e iniciar"
                  : temporizadorPendiente.etapa === "horno"
                    ? "Enviar al horno"
                    : "Iniciar preparación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pedidoConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirmar-listo-titulo" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="confirmar-listo-titulo" className="text-lg font-bold text-slate-800">¿Marcar pedido como listo?</h2>
            <p className="mt-2 text-sm text-slate-600">El pedido {pedidoConfirmacion.folio} terminó su paso por cocina y pasará a pedidos listos.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setPedidoConfirmacion(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Seguir en horno</button>
              <button type="button" onClick={confirmarPedidoListo} disabled={procesandoId === pedidoConfirmacion.id} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{procesandoId === pedidoConfirmacion.id ? "Actualizando..." : "Sí, está listo"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
