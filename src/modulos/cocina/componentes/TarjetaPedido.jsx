import Temporizador from "./Temporizador";

const ACCIONES = {
  Nuevo: {
    siguiente: "Preparando",
    texto: "Iniciar preparación",
  },
  Preparando: {
    siguiente: "En horno",
    texto: "Enviar al horno",
  },
  "En horno": {
    siguiente: "Listo",
    texto: "Marcar como listo",
  },
};

function obtenerHora(fecha) {
  if (!fecha) return "--:--";

  return new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TarjetaPedido({
  pedido,
  retrasado,
  onSeleccionar,
  onAvanzar,
  procesando,
  temporizador,
}) {
  const accion = ACCIONES[pedido.estado];

  const detalles =
    pedido.detalles || pedido.productos || pedido.pedido_detalles || [];
  const estaEnHorno = pedido.estado === "En horno";
  const fechaTemporizador = estaEnHorno
    ? temporizador?.iniciadoEn || pedido.fecha_entrada_horno
    : pedido.fecha_inicio_preparacion;
  const minutosEstimados = estaEnHorno
    ? temporizador?.minutos || pedido.tiempo_estimado_minutos
    : pedido.tiempo_estimado_minutos;

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        retrasado ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            {pedido.folio || `Pedido #${pedido.id}`}
          </h3>

          <p className="text-xs text-slate-500">
            {obtenerHora(pedido.fecha_creacion)}
          </p>
        </div>

        {retrasado && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            ¡Retrasado!
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
          {pedido.tipo === "domicilio" ? "Domicilio" : "Recoger"}
        </span>

        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {pedido.canal || "Mostrador"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {detalles.slice(0, 4).map((detalle, indice) => (
          <div
            key={detalle.id || indice}
            className="flex justify-between gap-3 text-sm"
          >
            <span className="font-semibold text-slate-800">
              {detalle.cantidad} × {detalle.nombre_producto || detalle.producto}
            </span>

            <span className="text-slate-500">
              {detalle.nombre_presentacion || detalle.presentacion || ""}
            </span>
          </div>
        ))}

        {detalles.length > 4 && (
          <p className="text-xs text-slate-500">
            +{detalles.length - 4} productos más
          </p>
        )}
      </div>

      {pedido.notas && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Notas:</strong> {pedido.notas}
        </div>
      )}

      {["Preparando", "En horno"].includes(pedido.estado) && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <span className="text-xs font-semibold text-slate-500">
            {estaEnHorno ? "Tiempo en horno" : "Tiempo de preparación"}
          </span>

          <span className={retrasado ? "text-red-600" : "text-violet-700"}>
            <Temporizador
              fechaInicio={fechaTemporizador}
              minutosEstimados={minutosEstimados}
            />
          </span>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onSeleccionar(pedido)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Ver detalles
        </button>

        {accion && (
          <button
            type="button"
            disabled={procesando}
            onClick={() => onAvanzar(pedido, accion.siguiente)}
            className="flex-1 rounded-xl bg-violet-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? "Actualizando..." : accion.texto}
          </button>
        )}
      </div>
    </article>
  );
}
