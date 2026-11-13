import { useCallback, useEffect, useState } from "react";
import { Archive, CheckCircle2, Clock3, FolderOpen, HardDriveDownload, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";

function formatoTamano(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PaginaRespaldos() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try { setDatos(await window.sistema.respaldos.listar()); }
    catch (e) { setError(e.message || "No se pudo cargar el módulo de respaldos."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  async function guardarPreferencias(cambios) {
    setGuardando(true); setError(""); setAviso("");
    try { await window.sistema.respaldos.configurar({ carpeta: datos.carpeta, alCerrar: datos.alCerrar, ...cambios }); await cargar(); setAviso("Preferencias guardadas."); }
    catch (e) { setError(e.message || "No se pudieron guardar las preferencias."); }
    finally { setGuardando(false); }
  }

  async function seleccionarCarpeta() {
    try {
      const carpeta = await window.sistema.respaldos.seleccionarCarpeta();
      if (carpeta) await guardarPreferencias({ carpeta });
    } catch (e) { setError(e.message || "No se pudo seleccionar la carpeta."); }
  }

  async function crearRespaldo() {
    setGuardando(true); setError(""); setAviso("");
    try { const resultado = await window.sistema.respaldos.crear(); await cargar(); setAviso(`Respaldo creado y verificado: ${resultado.nombre}`); }
    catch (e) { setError(e.message || "No se pudo crear el respaldo."); }
    finally { setGuardando(false); }
  }

  if (cargando) return <div className="flex items-center gap-3 p-8 text-slate-500"><LoaderCircle className="animate-spin" /> Cargando respaldos…</div>;

  return <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-violet-600">Seguridad de los datos</p><h1 className="mt-1 text-3xl font-black text-slate-900">Respaldos</h1><p className="mt-2 text-slate-500">Crea copias verificadas y configura el respaldo automático al salir.</p></div><button onClick={() => void cargar()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} /> Actualizar</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}{aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{aviso}</p>}
    {datos?.requiereAviso && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5"><div className="flex items-start gap-3"><span className="rounded-xl bg-amber-100 p-2 text-amber-700"><Clock3 size={20} /></span><div><h2 className="font-bold text-amber-950">Toca hacer un respaldo</h2><p className="mt-1 text-sm text-amber-800">No hay una copia reciente. Hazla ahora o el sistema la creará al cerrar.</p></div></div><button disabled={guardando} onClick={crearRespaldo} className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-60"><HardDriveDownload size={17} /> Respaldar ahora</button></section>}
    <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-violet-100 p-2.5 text-violet-700"><FolderOpen size={21} /></span><div><h2 className="font-bold text-slate-900">Carpeta de destino</h2><p className="text-sm text-slate-500">Elige dónde guardar las copias de la base de datos.</p></div></div><div className="mt-5 rounded-xl bg-slate-50 p-4"><code className="break-all text-sm text-slate-700">{datos?.carpeta}</code></div><button disabled={guardando} onClick={seleccionarCarpeta} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><FolderOpen size={16} /> Elegir carpeta</button></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><Archive size={21} /></span><div><h2 className="font-bold text-slate-900">Respaldo al cerrar</h2><p className="text-sm text-slate-500">Copia automática al salir del sistema.</p></div></div><label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-100 p-4"><span><span className="block text-sm font-semibold text-slate-800">Crear respaldo automáticamente</span><span className="mt-1 block text-xs text-slate-500">Se verifica la integridad antes de cerrar.</span></span><input type="checkbox" checked={Boolean(datos?.alCerrar)} disabled={guardando} onChange={(e) => guardarPreferencias({ alCerrar: e.target.checked })} className="h-5 w-5 accent-violet-600" /></label><button disabled={guardando} onClick={crearRespaldo} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60">{guardando ? <LoaderCircle size={17} className="animate-spin" /> : <HardDriveDownload size={17} />} Crear respaldo ahora</button></article>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Historial de respaldos</h2><p className="mt-1 text-sm text-slate-500">{datos?.historial?.length || 0} copias recientes</p></div><ShieldCheck className="text-emerald-600" /></div>{!datos?.historial?.length ? <p className="p-10 text-center text-sm text-slate-500">Todavía no hay respaldos. Crea el primero con el botón anterior.</p> : <div className="divide-y divide-slate-100">{datos.historial.map((respaldo) => <article key={respaldo.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><Archive size={17} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{respaldo.nombre_archivo}</p><p className="mt-1 truncate text-xs text-slate-500">{respaldo.fecha_creacion} · {respaldo.tipo === "automatico" ? "Automático al cerrar" : "Manual"} · {formatoTamano(respaldo.tamano_bytes)}</p></div></div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${respaldo.integridad_verificada ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{respaldo.integridad_verificada ? <CheckCircle2 size={14} /> : null}{respaldo.integridad_verificada ? "Verificado" : "Revisar"}</span></article>)}</div>}</section>
  </div>;
}
