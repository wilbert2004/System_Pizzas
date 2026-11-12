import {
  Wallet,
  ClipboardList,
  ChefHat,
  AlarmClock,
  Plus,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";

import { Link } from "react-router-dom";

import TarjetaIndicador from "../componentes/TarjetaIndicador";
import ResumenPagos from "../componentes/ResumenPagos";
import ActividadReciente from "../componentes/ActividadReciente";

function Pagina() {
  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <section className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-texto">Tablero principal</h1>

          <p className="text-sm text-texto-secundario mt-1">
            Resumen general de las operaciones de tu pizzería.
          </p>
        </div>

        <Link
          to="/punto-venta"
          className="inline-flex items-center gap-2 bg-morado-700 hover:bg-morado-800 text-white px-5 py-3 rounded-xl font-semibold shadow-sm transition-colors"
        >
          <Plus size={19} />
          Nuevo pedido
        </Link>
      </section>

      {/* Indicadores */}
      <section>
        <div className="grid grid-cols-4 gap-4">
          <TarjetaIndicador
            titulo="Ventas del día"
            valor="—"
            descripcion="Total de cobros registrados"
            icono={Wallet}
            color="morado"
          />

          <TarjetaIndicador
            titulo="Pedidos activos"
            valor="—"
            descripcion="Pedidos pendientes de completar"
            icono={ClipboardList}
            color="azul"
          />

          <TarjetaIndicador
            titulo="En preparación"
            valor="—"
            descripcion="Pedidos actualmente en cocina"
            icono={ChefHat}
            color="naranja"
          />

          <TarjetaIndicador
            titulo="Pedidos retrasados"
            valor="—"
            descripcion="Pedidos que requieren atención"
            icono={AlarmClock}
            color="rojo"
          />
        </div>
      </section>

      {/* Pagos y actividad */}
      <section className="grid grid-cols-5 gap-5">
        <div className="col-span-2">
          <ResumenPagos />
        </div>

        <div className="col-span-3">
          <ActividadReciente />
        </div>
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="text-lg font-bold text-texto mb-4">Accesos rápidos</h2>

        <div className="grid grid-cols-3 gap-4">
          <Link
            to="/punto-venta"
            className="bg-white border border-borde rounded-xl p-5 flex items-center gap-4 hover:border-morado-300 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-morado-50 text-morado-700 flex items-center justify-center">
              <ShoppingCart size={22} />
            </div>

            <div>
              <p className="font-semibold text-texto">Punto de venta</p>
              <p className="text-xs text-texto-secundario mt-1">
                Registrar un pedido
              </p>
            </div>
          </Link>

          <Link
            to="/clientes"
            className="bg-white border border-borde rounded-xl p-5 flex items-center gap-4 hover:border-morado-300 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users size={22} />
            </div>

            <div>
              <p className="font-semibold text-texto">Clientes</p>
              <p className="text-xs text-texto-secundario mt-1">
                Consultar clientes
              </p>
            </div>
          </Link>

          <Link
            to="/productos"
            className="bg-white border border-borde rounded-xl p-5 flex items-center gap-4 hover:border-morado-300 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <Package size={22} />
            </div>

            <div>
              <p className="font-semibold text-texto">Productos</p>
              <p className="text-xs text-texto-secundario mt-1">
                Consultar catálogo
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Pagina;
