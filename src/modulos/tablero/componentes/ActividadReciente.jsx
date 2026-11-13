import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

function ActividadReciente({ actividad = [], cargando = false }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Actividad reciente</h2>

          <p className="mt-1 text-sm text-slate-500">
            Últimos pedidos registrados
          </p>
        </div>

        <Link
          to="/pedidos"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
        >
          Ver pedidos
        </Link>
      </div>

      {cargando ? <div className="space-y-3 py-5">{[0, 1, 2].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div> : actividad.length ? <ul className="mt-4 divide-y divide-slate-100">{actividad.map((item) => <li key={item.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{item.descripcion || `${item.accion} · ${item.modulo}`}</p><p className="mt-1 text-xs text-slate-500">{item.usuario_nombre || "Sistema"} · {item.modulo}</p></div><time className="shrink-0 text-xs text-slate-400">{item.fecha}</time></li>)}</ul> : <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-9 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-slate-200">
          <ClipboardList size={23} />
        </div>

        <h3 className="mt-4 font-semibold text-slate-800">
          Sin actividad registrada
        </h3>

        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
          Cuando se registren pedidos, aparecerán aquí sus movimientos más
          recientes.
        </p>
      </div>}
    </section>
  );
}

export default ActividadReciente;
