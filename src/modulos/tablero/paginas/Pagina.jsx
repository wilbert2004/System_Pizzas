import { useCallback, useEffect, useState } from "react";
import {
  AlarmClock,
  ArrowUpRight,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import TarjetaIndicador from "../componentes/TarjetaIndicador";
import ResumenPagos from "../componentes/ResumenPagos";
import ActividadReciente from "../componentes/ActividadReciente";

const accesos = [
  { nombre: "Punto de venta", descripcion: "Registrar un pedido", ruta: "/punto-venta", icono: ShoppingCart, color: "violet" },
  { nombre: "Clientes", descripcion: "Consultar y actualizar", ruta: "/clientes", icono: Users, color: "blue" },
  { nombre: "Productos", descripcion: "Administrar el catálogo", ruta: "/productos", icono: Package, color: "orange" },
];

function Pagina() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const cargarResumen = useCallback(async () => {
    setCargando(true); setError("");
    const ahora = new Date();
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
    try { setResumen(await window.sistema.reportes.resumen({ desde: hoy, hasta: hoy })); }
    catch (e) { setError(e.message || "No se pudo cargar la información del tablero."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargarResumen(); const timer = setInterval(cargarResumen, 60_000); return () => clearInterval(timer); }, [cargarResumen]);
  const fecha = new Intl.DateTimeFormat("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-8">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#21134a] via-[#45218a] to-[#6b35bc] px-6 py-7 text-white shadow-xl shadow-violet-950/10 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-28 -z-10 h-80 w-80 rounded-full border-[42px] border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-36 right-1/4 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100 backdrop-blur">
              <Sparkles size={14} /> Centro de operaciones
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Tu pizzería, de un vistazo</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100/80 sm:text-base">
              Pedidos, cocina y ventas reunidos en un solo lugar.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium capitalize text-white/65">
              <CalendarDays size={15} /> {fecha}
            </p>
          </div>
          <Link to="/punto-venta" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-900 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-violet-50">
            <Plus size={18} /> Nuevo pedido
          </Link>
        </div>
      </section>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button onClick={cargarResumen} className="font-bold underline">Reintentar</button></div>}

      <section aria-label="Indicadores principales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador titulo="Ventas del día" valor={cargando ? "…" : formatoDinero(resumen?.ventas)} descripcion="Total de cobros registrados hoy" icono={Wallet} color="morado" />
        <TarjetaIndicador titulo="Pedidos activos" valor={cargando ? "…" : resumen?.pedidosActivos ?? 0} descripcion="Pendientes de completar hoy" icono={ClipboardList} color="azul" />
        <TarjetaIndicador titulo="En preparación" valor={cargando ? "…" : resumen?.pedidosPreparando ?? 0} descripcion="Actualmente en cocina" icono={ChefHat} color="naranja" />
        <TarjetaIndicador titulo="Pedidos retrasados" valor={cargando ? "…" : resumen?.pedidosRetrasados ?? 0} descripcion="Requieren atención" icono={AlarmClock} color="rojo" />
      </section>

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[0.9fr_1.35fr]">
        <ResumenPagos resumen={resumen} cargando={cargando} />
        <ActividadReciente actividad={resumen?.actividad || []} cargando={cargando} />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold text-slate-900">Accesos rápidos</h2><p className="mt-1 text-sm text-slate-500">Lo que más usas durante el turno.</p></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {accesos.map(({ nombre, descripcion, ruta, icono: Icono, color }) => (
            <Link key={ruta} to={ruta} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color === "violet" ? "bg-violet-50 text-violet-700" : color === "blue" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}><Icono size={22} /></span>
              <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">{nombre}</span><span className="mt-1 block text-xs text-slate-500">{descripcion}</span></span>
              <ArrowUpRight size={18} className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatoDinero(centavos = 0) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format((Number(centavos) || 0) / 100); }

export default Pagina;
