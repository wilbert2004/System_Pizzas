import { useEffect, useState } from "react";
import { Cable, ChefHat, MonitorPlay, RefreshCw, Timer, Wifi } from "lucide-react";

export default function PaginaProduccion() {
  const [pantallas, setPantallas] = useState([]);
  const [pantallaId, setPantallaId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState("");

  const cargarPantallas = async () => {
    setCargando(true);
    setError("");
    try {
      const resultado = await window.sistema.television.listarPantallas();
      const disponibles = Array.isArray(resultado) ? resultado : [];
      setPantallas(disponibles);
      setPantallaId((actual) => actual || disponibles.find((pantalla) => !pantalla.principal)?.id || "");
    } catch (e) {
      setError(e.message || "No se pudieron detectar las pantallas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void cargarPantallas(); }, []);

  const abrirProyeccion = async () => {
    if (!pantallaId) {
      setError("Conecta una segunda pantalla para proyectar producción.");
      return;
    }
    setAbriendo(true);
    setError("");
    try {
      await window.sistema.television.abrirProduccion(pantallaId);
    } catch (e) {
      setError(e.message || "No se pudo abrir la pantalla de producción.");
    } finally {
      setAbriendo(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><ChefHat size={27} /></span>
        <div><h1 className="text-3xl font-black text-slate-900">Producción</h1><p className="mt-1 text-slate-500">Proyecta en cocina los pedidos activos y el tiempo que falta para terminarlos.</p></div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_0.9fr] md:p-8">
        <div className="flex flex-col justify-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><MonitorPlay size={23} /></span>
          <h2 className="text-xl font-bold text-slate-900">Pantalla de producción</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Muestra pedidos en preparación y en horno con una cuenta regresiva visible. Se actualiza automáticamente mientras cocina trabaja.</p>
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Timer size={17} className="text-violet-600" /> El tiempo se basa en el estimado de cada pedido.</div>
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm leading-5 text-emerald-800">La proyección queda abierta en su TV aunque cambies a otro módulo. Solo se cierra al cerrar la aplicación o desde el botón de la pantalla proyectada.</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><label htmlFor="pantalla-produccion" className="text-sm font-bold text-slate-800">Pantalla para proyectar</label><button type="button" onClick={() => void cargarPantallas()} disabled={cargando} aria-label="Actualizar pantallas" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><RefreshCw size={16} className={cargando ? "animate-spin" : ""} /></button></div>
          <select id="pantalla-produccion" value={pantallaId} onChange={(evento) => setPantallaId(evento.target.value)} className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
            <option value="">Selecciona una pantalla</option>
            {pantallas.map((pantalla) => <option key={pantalla.id} value={pantalla.id}>{pantalla.nombre} · {pantalla.ancho} × {pantalla.alto}</option>)}
          </select>
          {!cargando && pantallas.length < 2 && <p className="mt-2 text-xs text-amber-700">Conecta otra pantalla o TV para usar la proyección independiente.</p>}
          <button type="button" onClick={() => void abrirProyeccion()} disabled={abriendo || cargando || !pantallaId} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"><MonitorPlay size={17} />{abriendo ? "Abriendo pantalla…" : "Abrir pantalla de producción"}</button>
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2"><MonitorPlay size={20} className="text-sky-600" /><h2 className="text-lg font-bold text-slate-900">Conectar la TV de cocina</h2></div>
        <p className="mt-1 text-sm text-slate-500">Se conecta igual que la pantalla de TV y publicidad.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="flex items-center gap-2 font-semibold text-slate-800"><Cable size={17} className="text-sky-600" />Por HDMI</p><p className="mt-1 text-xs leading-5 text-slate-500">Conecta la TV por HDMI y en Windows presiona <strong>Win + P</strong>; elige <strong>Extender</strong>.</p></article>
          <article className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="flex items-center gap-2 font-semibold text-slate-800"><Wifi size={17} className="text-emerald-600" />Inalámbrica</p><p className="mt-1 text-xs leading-5 text-slate-500">Presiona <strong>Win + K</strong>, selecciona la TV y espera a que Windows termine de conectarla.</p></article>
        </div>
        <ol className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
          <li className="rounded-lg bg-slate-50 p-3"><strong className="text-slate-800">1.</strong> Pulsa el botón de actualizar junto a la lista de pantallas.</li>
          <li className="rounded-lg bg-slate-50 p-3"><strong className="text-slate-800">2.</strong> Selecciona la TV externa donde estará cocina.</li>
          <li className="rounded-lg bg-slate-50 p-3"><strong className="text-slate-800">3.</strong> Pulsa “Abrir pantalla de producción”.</li>
        </ol>
      </section>
    </div>
  );
}
