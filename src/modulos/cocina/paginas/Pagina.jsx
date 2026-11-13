import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [pedidoConfirmacion, setPedidoConfirmacion] = useState(null);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [temporizadores, setTemporizadores] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cocina-temporizadores") || "{}");
    } catch {
      return {};
    }
  });
  const [temporizadorPendiente, setTemporizadorPendiente] = useState(null);

  const {
    pedidosRetrasados,
    cantidadRetrasados,
    sonidoActivo,
    activarSonido,
  } = useAlarmasCocina(
    pedidos,
    temporizadores,
  );

  useEffect(() => {
    localStorage.setItem(
      "cocina-temporizadores",
      JSON.stringify(temporizadores),
    );
  }, [temporizadores]);

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
    if (nuevoEstado === "En horno") {
      setTemporizadorPendiente({
        pedido,
        minutos: String(pedido.tiempo_estimado_minutos || 15),
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
    setPedidoConfirmacion(null);

    if (pedidoSeleccionado?.id === pedido.id) {
      setPedidoSeleccionado(null);
    }
  };

  const confirmarTemporizadorHorno = async () => {
    const minutos = Number(temporizadorPendiente?.minutos);

    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 600) return;

    const { pedido } = temporizadorPendiente;
    setProcesandoId(pedido.id);
    limpiarError();

    const resultado = await avanzarPedido(pedido, "En horno");

    setProcesandoId(null);

    if (!resultado.correcto) return;

    setTemporizadores((actuales) => ({
      ...actuales,
      [pedido.id]: {
        minutos,
        iniciadoEn: new Date().toISOString(),
      },
    }));
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
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-4">
          {pedidosPorEstado.map((columna) => (
            <ColumnaPedidos
              key={columna.estado}
              titulo={columna.titulo}
              pedidos={columna.pedidos}
              retrasados={pedidosRetrasados}
              color={columna.color}
              onSeleccionar={abrirDetalle}
              onAvanzar={(pedido, estado) => { if (estado === "En horno") cambiarEstado(pedido, estado); else setPedidoConfirmacion({ pedido, estado }); }}
              procesandoId={procesandoId}
              temporizadores={temporizadores}
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
              Temporizador del horno
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define cuánto tiempo debe hornearse {temporizadorPendiente.pedido.folio}.
            </p>
            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">
                Minutos
              </span>
              <input
                type="number"
                min="1"
                max="600"
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
                onClick={confirmarTemporizadorHorno}
                disabled={procesandoId === temporizadorPendiente.pedido.id}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Iniciar horno
              </button>
            </div>
          </div>
        </div>
      )}
      {pedidoConfirmacion && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Actualizar pedido</h2><p className="mt-2 text-sm text-slate-600">¿Cambiar el pedido {pedidoConfirmacion.pedido.folio || pedidoConfirmacion.pedido.id} a “{pedidoConfirmacion.estado}”?</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPedidoConfirmacion(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Cancelar</button><button type="button" onClick={() => cambiarEstado(pedidoConfirmacion.pedido, pedidoConfirmacion.estado)} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">Confirmar</button></div></section></div>}
    </main>
  );
}
