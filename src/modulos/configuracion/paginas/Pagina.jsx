import { useCallback, useEffect, useState } from "react";
import { FolderOpen, ImagePlus, LoaderCircle, Save, Settings2, Store, Trash2 } from "lucide-react";
import { useEstadoAutenticacion } from "../../autenticacion/estado/EstadoAutenticacion.js";

const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";
const valoresIniciales = { nombre_negocio: "Pizzería", telefono_negocio: "", direccion_negocio: "", horario_negocio: "", logotipo_ruta: "", moneda: "MXN", tiempo_preparacion_minutos: "20", volumen_notificaciones: "70" };

export default function PaginaConfiguracion() {
  const rol = useEstadoAutenticacion((estado) => estado.usuario?.rol);
  const [datos, setDatos] = useState(valoresIniciales);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try { setDatos({ ...valoresIniciales, ...await window.sistema.configuracion.listar() }); }
    catch (e) { setError(e.message || "No se pudo cargar la configuración."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { queueMicrotask(() => { void cargar(); }); }, [cargar]);

  async function guardar(e) {
    e.preventDefault(); setGuardando(true); setError(""); setAviso("");
    try { const guardados = await window.sistema.configuracion.guardar(datos); setDatos(guardados); window.dispatchEvent(new CustomEvent("configuracion:actualizada", { detail: { nombre_negocio: guardados.nombre_negocio, telefono_negocio: guardados.telefono_negocio, logotipo_ruta: guardados.logotipo_ruta } })); setAviso("La configuración del negocio quedó guardada."); }
    catch (err) { setError(err.message || "No se pudo guardar la configuración."); }
    finally { setGuardando(false); }
  }

  async function seleccionarLogotipo() {
    setError("");
    try {
      const archivo = await window.sistema.configuracion.seleccionarLogotipo();
      if (archivo) setDatos((actual) => ({ ...actual, logotipo_ruta: archivo.ruta }));
    } catch (err) { setError(err.message || "No se pudo abrir el selector de imágenes."); }
  }

  if (rol !== "administrador") return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-bold text-amber-900">Acceso restringido</h1><p className="mt-2 text-sm text-amber-800">Solo un administrador puede cambiar la configuración.</p></div>;
  if (cargando) return <div className="flex items-center gap-3 rounded-xl bg-white p-8 text-slate-600"><LoaderCircle className="animate-spin" /> Cargando configuración…</div>;

  return <div className="mx-auto max-w-5xl space-y-6"><header><p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Administración</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Configuración</h1><p className="mt-1 text-slate-500">Datos del negocio y preferencias de operación.</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{aviso}</p>}
    <form onSubmit={guardar} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-200 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Store size={20} /></span><div><h2 className="font-bold text-slate-900">Datos del negocio</h2><p className="text-sm text-slate-500">Información para identificar la sucursal.</p></div></div><div className="grid gap-5 p-5 md:grid-cols-2"><Campo etiqueta="Nombre comercial"><input className={input} maxLength={100} value={datos.nombre_negocio} onChange={(e) => setDatos({ ...datos, nombre_negocio: e.target.value })} required /></Campo><Campo etiqueta="Teléfono"><input className={input} maxLength={30} value={datos.telefono_negocio} onChange={(e) => setDatos({ ...datos, telefono_negocio: e.target.value })} placeholder="Número de contacto" /></Campo><Campo etiqueta="Dirección"><input className={input} maxLength={250} value={datos.direccion_negocio} onChange={(e) => setDatos({ ...datos, direccion_negocio: e.target.value })} placeholder="Dirección de la sucursal" /></Campo><Campo etiqueta="Horario de atención"><input className={input} maxLength={250} value={datos.horario_negocio} onChange={(e) => setDatos({ ...datos, horario_negocio: e.target.value })} placeholder="Ej. Lun–Dom 13:00–22:00" /></Campo><div className="md:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Logotipo de la empresa</span><div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">{datos.logotipo_ruta ? <img src={`pizzeria-media://archivo?ruta=${encodeURIComponent(datos.logotipo_ruta)}`} alt="Vista previa del logotipo" className="h-20 w-20 rounded-xl border border-slate-200 bg-white object-contain p-2" /> : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><ImagePlus size={28} /></div>}<div className="flex-1"><p className="text-sm font-semibold text-slate-800">Elige una imagen desde tu computadora</p><p className="mt-1 text-xs text-slate-500">PNG, JPG o WebP. No necesitas copiar ni escribir una ruta.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={seleccionarLogotipo} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"><FolderOpen size={16} /> Abrir carpeta y elegir imagen</button>{datos.logotipo_ruta && <button type="button" onClick={() => setDatos({ ...datos, logotipo_ruta: "" })} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><Trash2 size={15} /> Quitar logotipo</button>}</div></div></div></div></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-200 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Settings2 size={20} /></span><div><h2 className="font-bold text-slate-900">Preferencias operativas</h2><p className="text-sm text-slate-500">Valores iniciales para la operación diaria.</p></div></div><div className="grid gap-5 p-5 md:grid-cols-3"><Campo etiqueta="Moneda"><select className={input} value={datos.moneda} onChange={(e) => setDatos({ ...datos, moneda: e.target.value })}><option value="MXN">Peso mexicano (MXN)</option></select><span className="block text-xs font-normal text-slate-500">Los importes del sistema se manejan en MXN.</span></Campo><Campo etiqueta="Preparación predeterminada (minutos)"><input className={input} type="number" min="1" max="600" value={datos.tiempo_preparacion_minutos} onChange={(e) => setDatos({ ...datos, tiempo_preparacion_minutos: e.target.value })} required /></Campo><Campo etiqueta="Volumen de notificaciones (%)"><input className={input} type="number" min="0" max="100" value={datos.volumen_notificaciones} onChange={(e) => setDatos({ ...datos, volumen_notificaciones: e.target.value })} required /></Campo></div></section>
      <div className="flex justify-end"><button disabled={guardando} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{guardando ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />} Guardar configuración</button></div>
    </form>
  </div>;
}

function Campo({ etiqueta, children }) { return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{etiqueta}</span>{children}</label>; }
