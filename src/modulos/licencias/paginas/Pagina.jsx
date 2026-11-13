import { useEffect, useState } from "react";
import { CheckCircle2, Copy, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEstadoAutenticacion } from "../../autenticacion/estado/EstadoAutenticacion.js";

export default function PaginaLicencias({ activacion = false, onActivada }) {
  const usuario = useEstadoAutenticacion((estado) => estado.usuario);
  const [estado, setEstado] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let vigente = true;
    window.sistema.licencias.estado().then((resultado) => { if (vigente) setEstado(resultado); }).catch((e) => setError(e.message || "No se pudo obtener el ID del equipo."));
    return () => { vigente = false; };
  }, []);

  async function activar(e) {
    e.preventDefault(); setCargando(true); setError(""); setAviso("");
    try { await window.sistema.licencias.activar({ licencia: codigo.trim() }); setAviso("Equipo activado correctamente."); const resultado = await window.sistema.licencias.estado(); setEstado(resultado); setCodigo(""); await onActivada?.(); }
    catch (e) { setError(e.message || "El código no corresponde a este equipo."); }
    finally { setCargando(false); }
  }

  if (!activacion && usuario?.rol !== "administrador") return <main className="m-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Solo un administrador puede consultar las licencias.</main>;

  return <main className="mx-auto flex min-h-full max-w-4xl flex-col justify-center space-y-6 p-5 md:p-8">
    <header><p className="text-sm font-bold uppercase tracking-wide text-violet-600">Activación del sistema</p><h1 className="mt-1 text-3xl font-black text-slate-900">Licencia de este equipo</h1><p className="mt-2 text-slate-500">Copia el ID de hardware y envíaselo al dueño del sistema. Después pega aquí el código que te genere.</p></header>
    {activacion && estado?.expirado && <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-red-600">Demo finalizada</p><h2 className="mt-1 text-xl font-black text-slate-900">El sistema está bloqueado</h2><p className="mt-2 text-sm text-slate-600">El periodo de prueba de 10 días terminó. Actívalo con el código del dueño para continuar.</p></div>}
    {!activacion && estado?.demo && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Demo activa</p><p className="mt-1 text-lg font-black text-slate-900">Quedan {estado.diasRestantes} {estado.diasRestantes === 1 ? "día" : "días"}</p></div><p className="max-w-md text-sm text-slate-600">Envía el ID de hardware al dueño para recibir el código de activación.</p></div>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}{aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{aviso}</p>}
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><ShieldCheck size={24} /></span><div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-900">Tu ID de hardware</h2><p className="mt-1 text-sm text-slate-500">Este ID identifica esta computadora para generar su activación.</p><code className="mt-4 block break-all rounded-2xl border border-violet-100 bg-violet-50/60 p-4 font-mono text-sm font-black tracking-wider text-violet-900 sm:text-base">{estado?.hardwareId || "Leyendo ID…"}</code><button type="button" disabled={!estado?.hardwareId} onClick={() => navigator.clipboard?.writeText(estado.hardwareId)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Copy size={16} /> Copiar ID</button></div></div>
      <form onSubmit={activar} className="mt-7 space-y-4 border-t border-slate-100 pt-6"><div className="flex items-center gap-2"><KeyRound size={18} className="text-violet-700" /><h3 className="font-bold text-slate-900">Pegar código de activación</h3></div><textarea required value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Pega aquí el código que generó el dueño" className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"/><button disabled={cargando || !codigo.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60 sm:w-auto">{cargando ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}Activar equipo</button></form>
    </section>
    {estado?.activa && !estado.demo && <p className="text-center text-sm font-semibold text-emerald-700">Este equipo ya está activado{estado.cliente ? ` para ${estado.cliente}` : ""}.</p>}
  </main>;
}
