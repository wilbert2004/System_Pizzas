import { Timer } from "lucide-react";
import CuentaRegresivaPedido from "./CuentaRegresivaPedido";

const ACCIONES = {
  Nuevo: { siguiente: "Preparando", texto: "Iniciar preparación" },
  Preparando: { siguiente: "En horno", texto: "Enviar al horno" },
  "En horno": { siguiente: "Listo", texto: "Marcar como listo" },
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
  onAjustarTiempo,
  procesando,
  temporizador,
  modoAutomatico,
}) {
  const accionBase = ACCIONES[pedido.estado];
  const detalles = pedido.detalles || pedido.productos || pedido.pedido_detalles || [];
  const estaEnHorno = pedido.estado === "En horno";
  const faseAutomatica = estaEnHorno ? temporizador?.automatico : temporizador?.preparacion?.automatico;
  const accion = accionBase && {
    ...accionBase,
    texto: pedido.estado === "Nuevo" && modoAutomatico
      ? "Iniciar / configurar tiempos"
      : faseAutomatica && modoAutomatico
        ? "Avanzar ahora"
        : pedido.estado === "Preparando"
          ? "Meter al horno"
          : accionBase.texto,
  };
  const puedeAjustarTiempo = ["Preparando", "En horno"].includes(pedido.estado);

  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm ${retrasado ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">{pedido.folio || `Pedido #${pedido.id}`}</h3>
          <p className="text-xs text-slate-500">{obtenerHora(pedido.fecha_creacion)}</p>
        </div>
        {retrasado && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">¡Retrasado!</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">{pedido.tipo === "domicilio" ? "Domicilio" : "Recoger"}</span>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{pedido.canal || "Mostrador"}</span>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{detalles.length} {detalles.length === 1 ? "producto" : "productos"} para preparar</span>
      </div>

      {pedido.cliente_nombre && <p className="mt-3 text-sm text-slate-600">Cliente: <strong className="text-slate-800">{pedido.cliente_nombre}</strong></p>}

      <div className="mt-4 space-y-3">
        {detalles.map((detalle, indice) => {
          const adicionales = detalle.adicionales || detalle.pedido_detalle_adicionales || [];
          return (
            <div key={detalle.id || indice} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-violet-600 px-2 text-sm font-black text-white">{detalle.cantidad}×</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-5 text-slate-900">{detalle.nombre_producto || detalle.producto}</p>
                  {(detalle.nombre_presentacion || detalle.presentacion) && <p className="mt-0.5 text-xs font-semibold text-slate-600">{detalle.nombre_presentacion || detalle.presentacion}</p>}
                </div>
              </div>
              {adicionales.length > 0 && <div className="mt-2 border-t border-slate-200 pt-2"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Agregados</p>{adicionales.map((extra, i) => <p key={extra.id || i} className="text-sm font-medium text-slate-800">+ {extra.cantidad || 1} × {extra.nombre_adicional || extra.nombre}</p>)}</div>}
              {detalle.notas && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-100 p-2 text-sm font-semibold text-amber-950">Indicaciones: {detalle.notas}</p>}
            </div>
          );
        })}
      </div>

      {pedido.notas && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Notas:</strong> {pedido.notas}</div>}

      <CuentaRegresivaPedido pedido={pedido} temporizador={temporizador} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onSeleccionar(pedido)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Ver detalles</button>
        {puedeAjustarTiempo && <button type="button" disabled={procesando} onClick={() => onAjustarTiempo(pedido)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2 py-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"><Timer size={15} />Ajustar tiempo</button>}
        {accion && <button type="button" disabled={procesando} onClick={() => onAvanzar(pedido, accion.siguiente)} className="col-span-2 rounded-xl bg-violet-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{procesando ? "Actualizando..." : accion.texto}</button>}
      </div>
    </article>
  );
}
