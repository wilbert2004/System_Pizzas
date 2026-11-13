import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownRight, ChefHat, CircleCheck, Pizza, Sparkles } from "lucide-react";
import FormularioInicioSesion from "../componentes/FormularioInicioSesion.jsx";
import ConfiguracionInicial from "./ConfiguracionInicial.jsx";
import PaginaLicencias from "../../licencias/paginas/Pagina.jsx";
import { useEstadoAutenticacion } from "../estado/EstadoAutenticacion.js";

export default function InicioSesion() {
  const navigate = useNavigate();
  const [inicializado, setInicializado] = useState(false);
  const [necesitaAdministrador, setNecesitaAdministrador] = useState(false);
  const [error, setError] = useState("");
  const [estadoLicencia, setEstadoLicencia] = useState(null);
  const iniciarSesion = useEstadoAutenticacion((estado) => estado.iniciarSesion);

  async function comprobarEstado() {
    try {
      const estado = await window.sistema.autenticacion.estadoInicial();
      const estadoLicencia = await window.sistema.licencias.estado();
      setEstadoLicencia(estadoLicencia);
      setNecesitaAdministrador(estado.necesitaAdministrador);
      useEstadoAutenticacion.setState({
        usuario: estado.sesion,
        necesitaAdministrador: estado.necesitaAdministrador,
        cargando: false,
      });
      if (estado.sesion && estadoLicencia.activa) navigate("/tablero", { replace: true });
    } catch (error) {
      setError(error.message);
      useEstadoAutenticacion.setState({ cargando: false });
    } finally {
      setInicializado(true);
    }
  }

  useEffect(() => { comprobarEstado(); }, []);

  async function ingresar(datos) {
    await iniciarSesion(datos);
    navigate("/tablero", { replace: true });
  }

  if (!inicializado) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6f4fa] text-sm font-medium text-slate-500">Comprobando sistema…</div>;
  }

  if (!estadoLicencia?.activa) return <PaginaLicencias activacion onActivada={comprobarEstado} />;

  if (necesitaAdministrador) {
    return <ConfiguracionInicial onTerminar={async () => setNecesitaAdministrador(false)} />;
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5f3fa] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative isolate flex min-h-[250px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#211340] via-[#38206c] to-[#562d98] px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-screen lg:px-14 lg:py-12 xl:px-20">
        <div className="pointer-events-none absolute -right-28 top-10 -z-10 h-[34rem] w-[34rem] rounded-full border-[70px] border-white/[0.045]" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-black/20"><Pizza size={25} /></span>
          <span><span className="block text-base font-black tracking-wide">STARMY</span><span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Pizzería · Gestión</span></span>
        </div>

        <div className="relative my-8 max-w-xl lg:my-auto lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-violet-100"><Sparkles size={14} /> Todo listo para el turno</span>
          <h1 className="mt-6 max-w-lg text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">El sabor de un buen día empieza aquí.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-violet-100/75 sm:text-base">Tu operación, tus pedidos y tu equipo. Entra para poner todo en marcha.</p>

          <div className="mt-9 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
            {[[ChefHat, "Cocina"], [CircleCheck, "Pedidos"], [ArrowDownRight, "Ventas"]].map(([Icono, texto]) => <div key={texto} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 backdrop-blur"><Icono size={16} className="shrink-0 text-amber-300" /><span className="text-xs font-semibold text-white/75">{texto}</span></div>)}
          </div>
        </div>

        <p className="hidden text-xs text-white/35 lg:block">Sistema local de gestión para pizzería</p>
      </section>

      <section className="flex min-h-[calc(100dvh-250px)] items-center justify-center px-5 py-10 sm:px-8 lg:min-h-screen lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-7 lg:hidden"><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Acceso al sistema</p></div>
          <div className="rounded-[28px] border border-white bg-white p-6 shadow-[0_24px_70px_-32px_rgba(58,31,105,0.24)] sm:p-9">
            {estadoLicencia?.demo && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">Demo activa · {estadoLicencia.diasRestantes} {estadoLicencia.diasRestantes === 1 ? "día restante" : "días restantes"}</div>}
            <div className="mb-7">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ChefHat size={22} /></span>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Acceso seguro</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Bienvenido</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Ingresa tus credenciales para continuar con la operación.</p>
            </div>

            {error && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>}
            <FormularioInicioSesion onIngresar={ingresar} />
            <div className="mt-6 border-t border-slate-100 pt-5 text-center"><p className="text-xs text-slate-400">¿Necesitas acceso? Consulta al administrador de tu pizzería.</p></div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">Tus datos se administran de forma local en este equipo.</p>
        </div>
      </section>
    </main>
  );
}
