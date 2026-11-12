import { Banknote, ArrowLeftRight } from "lucide-react";

function ResumenPagos() {
  return (
    <section className="bg-white border border-borde rounded-2xl p-6">
      <h2 className="text-lg font-bold text-texto">Resumen de pagos</h2>

      <p className="text-sm text-texto-secundario mt-1">
        Cobros registrados durante el día
      </p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-texto-secundario">
            <Banknote size={19} />
            <span className="text-sm">Efectivo</span>
          </div>

          <p className="text-xl font-bold mt-3">—</p>
          <p className="text-xs text-texto-secundario">Pendiente de datos</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-texto-secundario">
            <ArrowLeftRight size={19} />
            <span className="text-sm">Transferencias</span>
          </div>

          <p className="text-xl font-bold mt-3">—</p>
          <p className="text-xs text-texto-secundario">Pendiente de datos</p>
        </div>
      </div>
    </section>
  );
}

export default ResumenPagos;
