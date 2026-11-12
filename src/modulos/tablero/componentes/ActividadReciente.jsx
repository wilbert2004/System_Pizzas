import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

function ActividadReciente() {
  return (
    <section className="bg-white border border-borde rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-texto">Actividad reciente</h2>

          <p className="text-sm text-texto-secundario mt-1">
            Últimos pedidos registrados
          </p>
        </div>

        <Link
          to="/pedidos"
          className="text-sm text-morado-700 font-semibold hover:text-morado-900"
        >
          Ver pedidos
        </Link>
      </div>

      <div className="py-12 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-morado-50 text-morado-700 flex items-center justify-center">
          <ClipboardList size={26} />
        </div>

        <h3 className="font-semibold text-texto mt-4">
          Sin actividad registrada
        </h3>

        <p className="text-sm text-texto-secundario mt-2 max-w-xs">
          Cuando se registren pedidos, aparecerán aquí sus movimientos más
          recientes.
        </p>
      </div>
    </section>
  );
}

export default ActividadReciente;
