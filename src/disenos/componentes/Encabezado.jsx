import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleUserRound, Clock3, KeyRound, LogOut, Menu, UserRound } from "lucide-react";
import { useEstadoAutenticacion } from "../../modulos/autenticacion/estado/EstadoAutenticacion.js";

const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export default function Encabezado({ onMenu }) {
  const navigate = useNavigate();
  const usuario = useEstadoAutenticacion((estado) => estado.usuario);
  const cerrarSesion = useEstadoAutenticacion((estado) => estado.cerrarSesion);
  const actualizarPerfil = useEstadoAutenticacion((estado) => estado.actualizarPerfil);
  const cambiarContrasena = useEstadoAutenticacion((estado) => estado.cambiarContrasenaPropia);
  const [abierto, setAbierto] = useState(false);
  const [perfil, setPerfil] = useState(() => ({ nombre: usuario?.nombre || "", usuario: usuario?.usuario || "" }));
  const [clave, setClave] = useState({ actual: "", nueva: "" });
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  async function salir() {
    await cerrarSesion(); setAbierto(false); navigate("/", { replace: true });
  }
  async function guardarPerfil(e) {
    e.preventDefault(); setGuardando(true); setError(""); setAviso("");
    try { await actualizarPerfil(perfil); setAviso("Perfil actualizado."); }
    catch (e) { setError(e.message || "No se pudo guardar el perfil."); }
    finally { setGuardando(false); }
  }
  async function guardarClave(e) {
    e.preventDefault(); setGuardando(true); setError(""); setAviso("");
    try { await cambiarContrasena({ contrasenaActual: clave.actual, contrasenaNueva: clave.nueva }); setClave({ actual: "", nueva: "" }); setAviso("Contraseña cambiada."); }
    catch (e) { setError(e.message || "No se pudo cambiar la contraseña."); }
    finally { setGuardando(false); }
  }

  return <>
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={onMenu} aria-label="Abrir menú" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"><Menu size={20} /></button><div className="min-w-0"><h2 className="text-sm font-semibold text-slate-800">Panel de operación</h2><p className="truncate text-xs text-slate-500">Sistema de gestión para pizzería</p></div></div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3"><span aria-label={`Hora actual ${ahora.toLocaleTimeString("es-MX")}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-2 font-mono text-xs font-bold tabular-nums text-slate-600 sm:px-3 sm:text-sm"><Clock3 size={15} className="text-violet-600" /><time>{ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</time></span><button onClick={() => { setPerfil({ nombre: usuario?.nombre || "", usuario: usuario?.usuario || "" }); setAbierto(true); setError(""); setAviso(""); }} className="flex items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-slate-50 sm:px-3" aria-label="Abrir perfil de usuario"><CircleUserRound size={27} className="text-violet-700" /><span className="hidden sm:block"><span className="block text-sm font-semibold text-slate-800">{usuario?.nombre || "Usuario"}</span><span className="block text-xs capitalize text-slate-500">{usuario?.rol || "Sin sesión"}</span></span></button><button onClick={salir} title="Cerrar sesión" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><LogOut size={19} /></button></div>
    </header>
    {abierto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="titulo-perfil" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><UserRound /></span><div><h2 id="titulo-perfil" className="text-xl font-bold text-slate-900">Mi perfil</h2><p className="text-sm capitalize text-slate-500">{usuario?.rol}</p></div></div><button onClick={() => setAbierto(false)} aria-label="Cerrar perfil" className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100">×</button></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{aviso && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{aviso}</p>}
      <form onSubmit={guardarPerfil} className="space-y-4 rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-slate-900">Datos personales</h3><div className="grid gap-4 sm:grid-cols-2"><Campo etiqueta="Nombre"><input className={input} maxLength={100} value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} required /></Campo><Campo etiqueta="Usuario"><input className={input} maxLength={50} autoComplete="username" value={perfil.usuario} onChange={(e) => setPerfil({ ...perfil, usuario: e.target.value })} required /></Campo></div><div className="flex justify-end"><button disabled={guardando} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Guardar perfil</button></div></form>
      <form onSubmit={guardarClave} className="mt-4 space-y-4 rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2"><KeyRound size={17} className="text-violet-700" /><h3 className="font-semibold text-slate-900">Cambiar contraseña</h3></div><div className="grid gap-4 sm:grid-cols-2"><Campo etiqueta="Contraseña actual"><input className={input} type="password" autoComplete="current-password" value={clave.actual} onChange={(e) => setClave({ ...clave, actual: e.target.value })} required /></Campo><Campo etiqueta="Nueva contraseña"><input className={input} type="password" minLength={8} autoComplete="new-password" value={clave.nueva} onChange={(e) => setClave({ ...clave, nueva: e.target.value })} required /></Campo></div><div className="flex justify-end"><button disabled={guardando} className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 disabled:opacity-60">Actualizar contraseña</button></div></form>
      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4"><button onClick={salir} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut size={16} /> Cerrar sesión</button><button onClick={() => setAbierto(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cerrar</button></div></section></div>}
  </>;
}

function Campo({ etiqueta, children }) { return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{etiqueta}</span>{children}</label>; }
