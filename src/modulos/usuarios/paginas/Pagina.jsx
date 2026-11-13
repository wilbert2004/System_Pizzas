import { useCallback, useEffect, useState } from "react";
import { KeyRound, LoaderCircle, Pencil, Plus, Search, ShieldCheck, UserRound, UserRoundX } from "lucide-react";
import { servicioUsuarios } from "../../autenticacion/servicios/autenticacion.js";
import { useEstadoAutenticacion } from "../../autenticacion/estado/EstadoAutenticacion.js";

const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export default function PaginaUsuarios() {
  const usuarioActual = useEstadoAutenticacion((estado) => estado.usuario);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formulario, setFormulario] = useState(null);
  const [contrasena, setContrasena] = useState(null);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);


  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try { setUsuarios(await servicioUsuarios.listar()); }
    catch (e) { setError(e.message || "No se pudo cargar la lista de usuarios."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { queueMicrotask(() => { void cargar(); }); }, [cargar]);

  async function guardarUsuario(e) {
    e.preventDefault(); setGuardando(true); setError(""); setAviso("");
    try {
      if (formulario.id) await servicioUsuarios.actualizar(formulario);
      else await servicioUsuarios.crear(formulario);
      setFormulario(null); setAviso(formulario.id ? "Usuario actualizado." : "Usuario creado."); await cargar();
    } catch (err) { setError(err.message || "No se pudo guardar el usuario."); }
    finally { setGuardando(false); }
  }

  async function guardarContrasena(e) {
    e.preventDefault(); setGuardando(true); setError(""); setAviso("");
    try {
      await servicioUsuarios.cambiarContrasena({ id: contrasena.id, contrasena: contrasena.nueva });
      setContrasena(null); setAviso("Contraseña restablecida. Comparte la nueva contraseña directamente con el usuario.");
    } catch (err) { setError(err.message || "No se pudo restablecer la contraseña."); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado(usuario) {
    setError(""); setAviso("");
    try {
      await servicioUsuarios.cambiarEstado({ id: usuario.id, activo: !usuario.activo });
      setAviso(usuario.activo ? "Usuario desactivado." : "Usuario activado."); await cargar();
    } catch (err) { setError(err.message || "No se pudo actualizar el usuario."); }
  }

  const filtrados = usuarios.filter((u) => `${u.nombre} ${u.usuario} ${u.rol}`.toLowerCase().includes(busqueda.toLowerCase()));
  if (usuarioActual?.rol !== "administrador") return <Aviso titulo="Acceso restringido" texto="Solo un administrador puede gestionar usuarios." />;

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Administración</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Usuarios</h1><p className="mt-1 text-slate-500">Administra accesos, perfiles y contraseñas.</p></div><button onClick={() => setFormulario({ nombre: "", usuario: "", rol: "empleado", contrasena: "" })} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"><Plus size={17} /> Nuevo usuario</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{aviso}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">Equipo</h2><p className="mt-1 text-sm text-slate-500">{usuarios.length} cuentas registradas</p></div><label className="relative block w-full sm:w-72"><Search className="absolute left-3 top-2.5 text-slate-400" size={17} /><input className={`${input} pl-9`} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o usuario" /></label></div>
      {cargando ? <div className="flex items-center gap-2 p-8 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Cargando usuarios…</div> : filtrados.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No hay usuarios que coincidan.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Usuario</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Creación</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{filtrados.map((u) => <tr key={u.id}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700"><UserRound size={19} /></span><span><span className="block font-semibold text-slate-900">{u.nombre}{u.id === usuarioActual.id && <span className="ml-2 text-xs font-normal text-violet-600">Tú</span>}</span><span className="text-xs text-slate-500">@{u.usuario}</span></span></div></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">{u.rol === "administrador" && <ShieldCheck size={13} />}{u.rol}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.activo ? "text-emerald-700" : "text-slate-400"}`}><span className={`h-2 w-2 rounded-full ${u.activo ? "bg-emerald-500" : "bg-slate-300"}`} />{u.activo ? "Activo" : "Inactivo"}</span></td><td className="px-5 py-4 text-slate-500">{u.fecha_creacion}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button title="Editar usuario" onClick={() => setFormulario({ id: u.id, nombre: u.nombre, usuario: u.usuario, rol: u.rol })} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Pencil size={16} /></button><button title="Restablecer contraseña" onClick={() => { setContrasena({ id: u.id, nombre: u.nombre, nueva: "" }); setMostrarContrasena(false); }} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><KeyRound size={16} /></button><button title={u.activo ? "Desactivar usuario" : "Activar usuario"} disabled={u.id === usuarioActual.id} onClick={() => cambiarEstado(u)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">{u.activo ? <UserRoundX size={16} /> : <UserRound size={16} />}</button></div></td></tr>)}</tbody></table></div>}
    </section>

    {formulario && <Modal titulo={formulario.id ? "Editar usuario" : "Crear usuario"} cerrar={() => setFormulario(null)}><form onSubmit={guardarUsuario} className="space-y-4">{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Campo etiqueta="Nombre completo"><input className={input} maxLength={100} value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required /></Campo><Campo etiqueta="Usuario"><input className={input} maxLength={50} autoComplete="username" value={formulario.usuario} onChange={(e) => setFormulario({ ...formulario, usuario: e.target.value })} required /></Campo><Campo etiqueta="Rol"><select className={input} value={formulario.rol} onChange={(e) => setFormulario({ ...formulario, rol: e.target.value })}><option value="empleado">Empleado</option><option value="administrador">Administrador</option></select></Campo>{!formulario.id && <Campo etiqueta="Contraseña inicial"><input className={input} type="password" minLength={8} autoComplete="new-password" value={formulario.contrasena} onChange={(e) => setFormulario({ ...formulario, contrasena: e.target.value })} required /><span className="block text-xs font-normal text-slate-500">Mínimo 8 caracteres.</span></Campo>}<Acciones guardando={guardando} cerrar={() => setFormulario(null)} /></form></Modal>}\n    {contrasena && <Modal titulo="Restablecer contraseña" cerrar={() => setContrasena(null)}><form onSubmit={guardarContrasena} className="space-y-4">{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<p className="text-sm text-slate-600">Define una contraseña nueva para <strong>{contrasena.nombre}</strong> y compártela en persona.</p><Campo etiqueta="Nueva contraseña"><input className={input} type={mostrarContrasena ? "text" : "password"} minLength={8} autoComplete="new-password" value={contrasena.nueva} onChange={(e) => setContrasena({ ...contrasena, nueva: e.target.value })} required /><button type="button" onClick={() => setMostrarContrasena(!mostrarContrasena)} className="mt-2 text-xs font-medium text-violet-700">{mostrarContrasena ? "Ocultar" : "Mostrar"} contraseña</button></Campo><Acciones guardando={guardando} cerrar={() => setContrasena(null)} etiqueta="Restablecer" /></form></Modal>}
  </div>;
}

function Campo({ etiqueta, children }) { return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{etiqueta}</span>{children}</label>; }
function Modal({ titulo, cerrar, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{titulo}</h2><button onClick={cerrar} type="button" aria-label="Cerrar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">×</button></div>{children}</section></div>; }
function Acciones({ guardando, cerrar, etiqueta = "Guardar" }) { return <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={cerrar} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button><button disabled={guardando} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{guardando ? "Guardando…" : etiqueta}</button></div>; }
function Aviso({ titulo, texto }) { return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-bold text-amber-900">{titulo}</h1><p className="mt-2 text-sm text-amber-800">{texto}</p></section>; }
