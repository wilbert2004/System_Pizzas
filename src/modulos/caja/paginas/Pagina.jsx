import { useCallback, useEffect, useState } from "react";
import { Banknote, Clock3, CreditCard, DoorOpen, DoorClosed, LoaderCircle, Plus, RefreshCw, Wallet } from "lucide-react";
import { servicioCaja } from "../servicios/caja.js";

const moneda = (centavos = 0) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN",
}).format((Number(centavos) || 0) / 100);

function convertirCentavos(valor, permitirCero = false) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0 || (!permitirCero && numero === 0)) {
    throw new Error("Escribe un importe válido en pesos.");
  }
  const centavos = Math.round(numero * 100);
  if (!Number.isSafeInteger(centavos)) throw new Error("El importe es demasiado grande.");
  return centavos;
}

function Campo({ etiqueta, children }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{etiqueta}</span>{children}</label>;
}

const claseInput = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export default function PaginaCaja() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [montoInicial, setMontoInicial] = useState("0");
  const [pedidoPago, setPedidoPago] = useState(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("gasto");
  const [metodoMovimiento, setMetodoMovimiento] = useState("efectivo");
  const [concepto, setConcepto] = useState("");
  const [montoMovimiento, setMontoMovimiento] = useState("");
  const [efectivoContado, setEfectivoContado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try { setEstado(await servicioCaja.estado()); }
    catch (e) { setError(e.message || "No se pudo cargar la caja."); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => void cargar(), 5000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  async function ejecutar(accion, mensaje) {
    setGuardando(true); setError(""); setAviso("");
    try {
      const resultado = await accion();
      setAviso(typeof mensaje === "function" ? mensaje(resultado) : mensaje);
      await cargar();
      return true;
    }
    catch (e) { setError(e.message || "No se pudo completar la operación."); return false; }
    finally { setGuardando(false); }
  }

  const sesion = estado?.sesion;
  const resumen = sesion?.efectivo_esperado_centavos;
  const pedidosSinPagar = estado?.pedidosSinPagar ?? estado?.pendientes?.length ?? 0;
  const pedidosEnProceso = estado?.pedidosEnProcesoCantidad ?? estado?.pedidosEnProceso?.length ?? 0;

  if (cargando && !estado) return <div className="flex items-center gap-3 rounded-xl bg-white p-8 text-slate-600"><LoaderCircle className="animate-spin" /> Cargando caja…</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Operación diaria</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Caja</h1><p className="mt-1 text-slate-500">Apertura, cobros y movimientos de efectivo.</p></div>
        <button onClick={cargar} disabled={cargando} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={cargando ? "animate-spin" : ""} /> Actualizar</button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {aviso && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{aviso}</div>}

      {!sesion ? (
        <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_1.2fr] md:p-8">
          <div className="flex flex-col justify-center"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><DoorOpen /></span><h2 className="text-xl font-bold text-slate-900">Abrir turno de caja</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Registra el efectivo inicial disponible. Solo puede haber una caja abierta a la vez.</p></div>
          <form className="flex flex-col justify-end gap-4 rounded-xl bg-slate-50 p-5" onSubmit={(e) => { e.preventDefault(); ejecutar(() => servicioCaja.abrir({ montoInicialCentavos: convertirCentavos(montoInicial, true) }), "Caja abierta."); }}>
            <Campo etiqueta="Efectivo inicial (MXN)"><input className={claseInput} type="number" min="0" step="0.01" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} required /></Campo>
            <button disabled={guardando} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{guardando ? <LoaderCircle className="animate-spin" size={17} /> : <DoorOpen size={17} />} Abrir caja</button>
          </form>
        </section>
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 p-5 text-white shadow-sm md:p-6">
            <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><Wallet /></span><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">Caja abierta</h2><span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">En curso</span></div><p className="mt-1 text-sm text-slate-300">Abierta {sesion.fecha_apertura} · Sesión #{sesion.id}</p></div></div>
            <div className="text-left sm:text-right"><p className="text-sm text-slate-300">Efectivo esperado en cajón</p><p className="text-3xl font-bold">{moneda(resumen)}</p></div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Fondo inicial", sesion.monto_inicial_centavos, Wallet, "text-slate-700 bg-slate-100"],
              ["Cobros en efectivo", sesion.pagos_efectivo_centavos, Banknote, "text-emerald-700 bg-emerald-100"],
              ["Transferencias netas", sesion.transferencias_centavos, CreditCard, "text-blue-700 bg-blue-100"],
              ["Pedidos por cobrar", pedidosSinPagar, Clock3, "text-amber-700 bg-amber-100", true],
            ].map(([titulo, valor, Icono, color, esCantidad]) => <article key={titulo} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{titulo}</span><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icono size={18} /></span></div><p className="mt-3 text-2xl font-bold text-slate-900">{esCantidad ? valor : moneda(valor)}</p></article>)}
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">Pedidos pendientes de pago</h2><p className="mt-1 text-sm text-slate-500">Se cobra el total una sola vez. Al confirmar el cobro, el pedido queda entregado.</p><p className="mt-1 text-xs text-slate-500">Recoger: cobra cuando está listo. Domicilio: cobra cuando ya salió a reparto.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">{estado.pendientes.length}</span></div>
              {estado.pendientes.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No hay pedidos pendientes de cobro.</p> : <div className="max-h-[28rem] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Pedido</th><th className="px-5 py-3">Cliente / tipo</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{estado.pendientes.map((pedido) => { const listo = pedido.estado === "entregado" || (pedido.tipo === "domicilio" ? pedido.estado === "en_reparto" : pedido.estado === "listo"); return <tr key={pedido.id}><td className="px-5 py-4"><span className="font-semibold text-slate-900">{pedido.folio}</span><span className="mt-1 block text-xs capitalize text-slate-500">{pedido.estado.replaceAll("_", " ")}</span></td><td className="px-5 py-4 text-slate-600">{pedido.cliente_nombre || "Sin cliente"}<span className="mt-1 block text-xs capitalize text-slate-400">{pedido.tipo}</span></td><td className="px-5 py-4 text-right font-semibold text-slate-900">{moneda(pedido.total_centavos)}</td><td className="px-5 py-4 text-right"><button disabled={!listo} title={listo ? "Registrar cobro y confirmar entrega" : "Disponible cuando esté listo para entregar"} onClick={() => { setPedidoPago(pedido); setReferencia(""); setMontoRecibido(""); }} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">{listo ? "Cobrar y entregar" : "Cobrar"}</button></td></tr>; })}</tbody></table></div>}
            </div>

            <div className="space-y-6">
              <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(e) => { e.preventDefault(); ejecutar(() => servicioCaja.registrarMovimiento({ tipo: tipoMovimiento, metodo: metodoMovimiento, concepto, montoCentavos: convertirCentavos(montoMovimiento) }), "Movimiento registrado.").then(() => { setConcepto(""); setMontoMovimiento(""); }); }}>
                <div><h2 className="font-bold text-slate-900">Registrar movimiento</h2><p className="mt-1 text-sm text-slate-500">Gasto, retiro o ingreso extraordinario.</p></div>
                <div className="grid grid-cols-2 gap-3"><Campo etiqueta="Tipo"><select className={claseInput} value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)}><option value="gasto">Gasto</option><option value="retiro">Retiro</option><option value="ingreso">Ingreso</option></select></Campo><Campo etiqueta="Método"><select className={claseInput} value={metodoMovimiento} onChange={(e) => setMetodoMovimiento(e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></Campo></div>
                <Campo etiqueta="Concepto"><input className={claseInput} maxLength={200} value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. compra de ingredientes" required /></Campo>
                <Campo etiqueta="Importe (MXN)"><input className={claseInput} type="number" min="0.01" step="0.01" value={montoMovimiento} onChange={(e) => setMontoMovimiento(e.target.value)} required /></Campo>
                <button disabled={guardando} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-60"><Plus size={16} /> Registrar movimiento</button>
              </form>

              <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(e) => { e.preventDefault(); ejecutar(() => servicioCaja.cerrar({ efectivoContadoCentavos: convertirCentavos(efectivoContado, true), observaciones }), (resultado) => `Caja cerrada. Esperado: ${moneda(resultado.cierre.efectivoEsperadoCentavos)} · contado: ${moneda(resultado.cierre.efectivoContadoCentavos)} · diferencia: ${resultado.cierre.diferenciaCentavos >= 0 ? "+" : "−"}${moneda(Math.abs(resultado.cierre.diferenciaCentavos))}.`); }}>
                <div><h2 className="font-bold text-slate-900">Cerrar caja</h2><p className="mt-1 text-sm text-slate-500">Cuenta el efectivo y compara con el esperado de {moneda(resumen)}.</p></div>
                {pedidosSinPagar > 0 && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">No se puede cerrar la caja: hay {pedidosSinPagar} {pedidosSinPagar === 1 ? "pedido pendiente de pago" : "pedidos pendientes de pago"}. Cobra o cancela esos pedidos antes del corte.</p>}
                {pedidosEnProceso > 0 && <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-5 text-sky-900">Hay {pedidosEnProceso} {pedidosEnProceso === 1 ? "pedido en cocina" : "pedidos en cocina"}{estado.pedidosEnProceso?.length ? ` (${estado.pedidosEnProceso.slice(0, 3).map((pedido) => pedido.folio).join(", ")}${pedidosEnProceso > 3 ? "…" : ""})` : ""}. Termínalos antes de cerrar la aplicación.</p>}
                <Campo etiqueta="Efectivo contado (MXN)"><input className={claseInput} type="number" min="0" step="0.01" value={efectivoContado} onChange={(e) => setEfectivoContado(e.target.value)} required /></Campo>
                <Campo etiqueta="Observaciones (opcional)"><textarea className={claseInput} rows={2} maxLength={500} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></Campo>
                <button disabled={guardando || pedidosSinPagar > 0 || pedidosEnProceso > 0} title={pedidosEnProceso > 0 ? "Primero termina los pedidos de cocina." : pedidosSinPagar > 0 ? "Primero cobra o cancela los pedidos sin pagar." : "Cerrar turno de caja"} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"><DoorClosed size={16} />{pedidosEnProceso > 0 ? "Termina pedidos de cocina" : pedidosSinPagar > 0 ? "Cobra los pedidos pendientes" : "Cerrar turno"}</button>
              </form>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Lista titulo="Pagos recientes" vacio="Aún no hay pagos registrados." items={estado.pagos} render={(p) => <><div><span className="font-semibold text-slate-800">{p.folio}</span><span className="ml-2 text-xs capitalize text-slate-500">{p.metodo}</span><span className="mt-1 block text-xs text-slate-500">Recibido {moneda(p.monto_recibido_centavos ?? p.monto_centavos)} · Cambio {moneda(p.cambio_centavos || 0)}</span><span className="mt-1 block text-xs text-slate-400">{p.fecha_pago}</span></div><span className="font-semibold text-emerald-700">{moneda(p.monto_centavos)}</span></>} />
            <Lista titulo="Movimientos recientes" vacio="Aún no hay movimientos." items={estado.movimientos} render={(m) => <><div><span className="font-semibold capitalize text-slate-800">{m.tipo}</span><span className="ml-2 text-xs capitalize text-slate-500">{m.metodo}</span><span className="mt-1 block text-xs text-slate-500">{m.concepto}</span><span className="mt-1 block text-xs text-slate-400">{m.fecha} · {m.usuario_nombre || "Usuario"}</span></div><span className={`font-semibold ${m.tipo === "ingreso" ? "text-emerald-700" : "text-slate-700"}`}>{m.tipo === "ingreso" ? "+" : "−"}{moneda(m.monto_centavos)}</span></>} />
          </section>
        </>
      )}

      {pedidoPago && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation"><form role="dialog" aria-modal="true" aria-labelledby="titulo-cobro" className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(e) => { e.preventDefault(); ejecutar(() => servicioCaja.registrarPago({ pedidoId: pedidoPago.id, metodo: metodoPago, referencia, montoRecibidoCentavos: metodoPago === "efectivo" ? Math.round(Number(montoRecibido) * 100) : pedidoPago.total_centavos }), `Pago del pedido ${pedidoPago.folio} registrado.`).then((ok) => { if (ok) setPedidoPago(null); }); }}><div><h2 id="titulo-cobro" className="text-xl font-bold text-slate-900">Cobrar y confirmar entrega</h2><p className="mt-1 text-sm text-slate-500">{pedidoPago.folio} · {pedidoPago.cliente_nombre || "Sin cliente"}</p></div>{error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Total a cobrar</p><p className="mt-1 text-2xl font-bold text-slate-900">{moneda(pedidoPago.total_centavos)}</p></div><Campo etiqueta="Método de pago"><select className={claseInput} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></Campo>{metodoPago === "efectivo" && <><Campo etiqueta="¿Cuánto va a dar? (MXN)"><input className={claseInput} type="number" min={(pedidoPago.total_centavos / 100).toFixed(2)} step="0.01" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} placeholder={`Mínimo ${moneda(pedidoPago.total_centavos)}`} required /></Campo><div className={`rounded-xl p-4 ${Math.round(Number(montoRecibido || 0) * 100) >= pedidoPago.total_centavos ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}><p className="text-sm font-medium">{Math.round(Number(montoRecibido || 0) * 100) >= pedidoPago.total_centavos ? "Cambio" : "Falta por pagar"}</p><p className="mt-1 text-2xl font-black">{moneda(Math.abs(Math.round(Number(montoRecibido || 0) * 100) - pedidoPago.total_centavos))}</p><p className="mt-1 text-xs">{Math.round(Number(montoRecibido || 0) * 100) >= pedidoPago.total_centavos ? "Se registrará el efectivo recibido y el cambio." : "El pago no se activará hasta cubrir el total."}</p></div></>}{metodoPago === "transferencia" && <Campo etiqueta="Referencia (opcional)"><input className={claseInput} maxLength={100} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Folio o referencia bancaria" /></Campo>}<div className="flex gap-3"><button type="button" onClick={() => setPedidoPago(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button><button disabled={guardando || (metodoPago === "efectivo" && (!montoRecibido || Math.round(Number(montoRecibido) * 100) < pedidoPago.total_centavos))} className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{guardando ? "Registrando…" : "Confirmar pago"}</button></div></form></div>}
    </div>
  );
}

function Lista({ titulo, vacio, items, render }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="font-bold text-slate-900">{titulo}</h2></div>{items.length === 0 ? <p className="p-6 text-sm text-slate-500">{vacio}</p> : <ul className="divide-y divide-slate-100">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">{render(item)}</li>)}</ul>}</section>;
}
