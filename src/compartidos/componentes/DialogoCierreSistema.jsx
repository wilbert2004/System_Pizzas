import { useEffect, useState } from "react";
import { AlertTriangle, DoorClosed, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { servicioCaja } from "../../modulos/caja/servicios/caja.js";

const dinero = (centavos = 0) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN",
}).format((Number(centavos) || 0) / 100);

export default function DialogoCierreSistema() {
  const [abierto, setAbierto] = useState(false);
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [contado, setContado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [reglasVerificadas, setReglasVerificadas] = useState(false);

  useEffect(() => window.sistema.aplicacion.onSolicitarCierre(async () => {
    setAbierto(true);
    setError("");
    setEstadoCaja(null);
    setContado("");
    setReglasVerificadas(false);
    setRevisando(true);
    try {
      const [bloqueos, caja] = await Promise.all([
        servicioCaja.validarCierre(),
        servicioCaja.estado().catch(() => ({ sesion: null })),
      ]);
      setEstadoCaja({ ...caja, ...bloqueos });
      setReglasVerificadas(true);
    } catch (e) {
      setError(e.message || "No se pudieron verificar los pedidos antes de salir.");
    } finally {
      setRevisando(false);
    }
  }), []);

  const pedidosEnProceso = estadoCaja?.pedidosEnProcesoCantidad || 0;
  const pedidosSinPagar = estadoCaja?.pedidosSinPagar || 0;

  async function salirSinCorte() {
    if (!reglasVerificadas) {
      setError("Espera a que termine la revisión de pedidos.");
      return;
    }
    setRevisando(true);
    setError("");
    try {
      const bloqueos = await servicioCaja.validarCierre();
      setEstadoCaja((actual) => ({ ...actual, ...bloqueos }));
      if (bloqueos.pedidosEnProcesoCantidad > 0) {
        setError("No puedes salir: termina o cancela los pedidos que siguen en cocina.");
        return;
      }
    } catch (e) {
      setError(e.message || "No se pudieron verificar los pedidos antes de salir.");
      return;
    } finally {
      setRevisando(false);
    }
    window.sistema.aplicacion.finalizarCierre();
  }

  function seguirTrabajando() {
    setAbierto(false);
    window.sistema.aplicacion.cancelarCierre();
  }

  async function hacerCorte() {
    if (pedidosEnProceso > 0) {
      setError("No puedes hacer el corte mientras haya pedidos en cocina.");
      return;
    }
    if (pedidosSinPagar > 0) {
      setError(`No puedes hacer el corte: quedan ${pedidosSinPagar} pedidos sin pagar.`);
      return;
    }
    const numero = Number(contado);
    if (!Number.isFinite(numero) || numero < 0) {
      setError("Escribe el efectivo contado para realizar el corte.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await servicioCaja.cerrar({
        efectivoContadoCentavos: Math.round(numero * 100),
        observaciones: observaciones.trim(),
      });
      salirSinCorte();
    } catch (e) {
      setError(e.message || "No se pudo cerrar la caja.");
    } finally {
      setCargando(false);
    }
  }

  if (!abierto) return null;
  const sesion = estadoCaja?.sesion;
  const hayBloqueoCocina = pedidosEnProceso > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section role="alertdialog" aria-modal="true" aria-labelledby="dialogo-cierre-titulo" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><DoorClosed size={23} /></span>
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Antes de salir</p><h2 id="dialogo-cierre-titulo" className="mt-1 text-xl font-black text-slate-900">¿Deseas hacer el corte de caja?</h2><p className="mt-2 text-sm leading-6 text-slate-600">El sistema revisa que cocina no tenga pedidos activos antes de cerrar.</p></div>
          <button onClick={seguirTrabajando} aria-label="Seguir trabajando" className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        {sesion && <div className="mt-5 space-y-4 rounded-2xl bg-slate-50 p-4"><div className="flex justify-between text-sm"><span className="text-slate-500">Efectivo esperado</span><strong className="text-slate-900">{dinero(sesion.efectivo_esperado_centavos)}</strong></div><label className="block space-y-1.5 text-sm font-semibold text-slate-700"><span>Efectivo contado (MXN)</span><input type="number" min="0" step="0.01" value={contado} onChange={(e) => setContado(e.target.value)} placeholder="Escribe cuánto hay en caja" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label><label className="block space-y-1.5 text-sm font-semibold text-slate-700"><span>Observaciones (opcional)</span><textarea rows={2} maxLength={500} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label></div>}

        {revisando && <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" /> Revisando caja y pedidos…</div>}
        {reglasVerificadas && !sesion && !hayBloqueoCocina && <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No hay una caja abierta ni pedidos en cocina. Puedes salir.</p>}
        {hayBloqueoCocina && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"><p className="flex items-center gap-2 font-bold text-red-900"><AlertTriangle size={18} />No se puede cerrar la aplicación</p><p className="mt-1 text-sm leading-5 text-red-800">Hay {pedidosEnProceso} {pedidosEnProceso === 1 ? "pedido activo" : "pedidos activos"} en cocina. Termínalos o cancélalos y vuelve a cerrar.</p><ul className="mt-2 space-y-1 text-xs font-semibold text-red-800">{estadoCaja.pedidosEnProceso.slice(0, 5).map((pedido) => <li key={pedido.id}>{pedido.folio || `Pedido #${pedido.id}`} · {pedido.estado.replaceAll("_", " ")}</li>)}</ul></div>}
        {!hayBloqueoCocina && pedidosSinPagar > 0 && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Hay {pedidosSinPagar} pedidos sin pagar. No se hará el corte; puedes continuar trabajando para cobrarlos.</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button disabled={revisando || cargando} onClick={seguirTrabajando} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">Seguir trabajando</button>
          <button disabled={revisando || cargando || !reglasVerificadas || hayBloqueoCocina} onClick={salirSinCorte} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Salir sin corte</button>
          {sesion && <button disabled={revisando || cargando || !reglasVerificadas || hayBloqueoCocina || pedidosSinPagar > 0 || !contado} onClick={hacerCorte} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{cargando ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}Hacer corte y salir</button>}
        </div>
      </section>
    </div>
  );
}
