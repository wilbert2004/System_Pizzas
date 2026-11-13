import { Banknote, ArrowLeftRight } from "lucide-react";

function dinero(centavos = 0) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format((Number(centavos) || 0) / 100); }

function ResumenPagos({ resumen, cargando }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Resumen de pagos</h2>

          <p className="mt-1 text-sm text-slate-500">Cobros registrados durante el día</p>
        </div>
        <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">Hoy</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between gap-2 text-emerald-800">
            <span className="flex items-center gap-2"><Banknote size={18} /><span className="text-sm font-semibold">Efectivo</span></span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>

          <p className="mt-4 break-words text-2xl font-black tracking-tight text-slate-900">{cargando ? "…" : dinero(resumen?.efectivo)}</p>
          <p className="mt-1 text-xs text-slate-500">Total cobrado</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-center justify-between gap-2 text-blue-800">
            <span className="flex items-center gap-2"><ArrowLeftRight size={18} /><span className="text-sm font-semibold">Transferencias</span></span>
            <span className="h-2 w-2 rounded-full bg-blue-400" />
          </div>

          <p className="mt-4 break-words text-2xl font-black tracking-tight text-slate-900">{cargando ? "…" : dinero(resumen?.transferencias)}</p>
          <p className="mt-1 text-xs text-slate-500">Total recibido</p>
        </div>
      </div>
    </section>
  );
}

export default ResumenPagos;
