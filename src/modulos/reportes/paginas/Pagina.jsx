import { useCallback, useEffect, useState } from "react";
import { AlarmClock, Banknote, CalendarDays, ClipboardList, Download, FileDown, LoaderCircle, Printer, RefreshCw } from "lucide-react";

const pesos = (centavos = 0) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format((Number(centavos) || 0) / 100);
const fechaLocal = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
const inicioMes = (fecha) => fechaLocal(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
const input = "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export default function PaginaReportes() {
  const hoy = fechaLocal(new Date());
  const [periodo, setPeriodo] = useState("hoy");
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async (rangoDesde = desde, rangoHasta = hasta) => {
    setCargando(true); setError("");
    try { setDatos(await window.sistema.reportes.resumen({ desde: rangoDesde, hasta: rangoHasta })); }
    catch (e) { setError(e.message || "No se pudieron cargar los reportes."); }
    finally { setCargando(false); }
  }, [desde, hasta]);
  useEffect(() => { queueMicrotask(() => { void cargar(); }); }, [cargar]);

  function cambiarPeriodo(valor) {
    setPeriodo(valor);
    const ahora = new Date();
    const fin = fechaLocal(ahora);
    const inicio = valor === "hoy" ? fin : valor === "semana" ? fechaLocal(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 6)) : inicioMes(ahora);
    setDesde(inicio); setHasta(fin);
    if (valor !== "personalizado") void cargar(inicio, fin);
  }

  function exportarCSV() {
    if (!datos) return;
    const filas = [
      ["Reporte de ventas de pizzería"], ["Desde", datos.periodo.desde], ["Hasta", datos.periodo.hasta], [],
      ["Indicador", "Valor"], ["Ventas cobradas (MXN)", (datos.ventas / 100).toFixed(2)],
      ["Efectivo (MXN)", (datos.efectivo / 100).toFixed(2)], ["Transferencias (MXN)", (datos.transferencias / 100).toFixed(2)],
      ["Pagos", datos.cantidadPagos], ["Pedidos creados", datos.cantidadPedidos], ["Pedidos activos", datos.pedidosActivos],
      ["Pedidos cancelados", datos.pedidosCancelados], ["Pedidos retrasados", datos.pedidosRetrasados],
      ["Promedio de preparación (min)", datos.promedioPreparacionMinutos], [], ["Productos más vendidos"],
      ["Producto", "Unidades", "Ventas (MXN)"], ...datos.productos.map((p) => [p.nombre_producto, p.unidades, (p.ventas_centavos / 100).toFixed(2)]),
      [], ["Métodos de pago"], ["Método", "Pagos", "Total (MXN)"], ...datos.metodos.map((m) => [m.metodo, m.cantidad, (m.total_centavos / 100).toFixed(2)]),
      [], ["Motivos de cancelación"], ["Motivo", "Cantidad"], ...datos.cancelaciones.map((c) => [c.motivo || "Sin motivo", c.cantidad]),
      [], ["Movimientos de caja"], ["Tipo", "Método", "Cantidad", "Total (MXN)"], ...datos.movimientos.map((m) => [m.tipo, m.metodo, m.cantidad, (m.total_centavos / 100).toFixed(2)]),
    ];
    const contenido = filas.map((fila) => fila.map((celda) => `"${String(celda ?? "").replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const archivo = new Blob(["\uFEFF", contenido], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a"); enlace.href = url; enlace.download = `reporte-${datos.periodo.desde}-${datos.periodo.hasta}.csv`; enlace.click(); URL.revokeObjectURL(url);
  }

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Análisis de operación</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Reportes</h1><p className="mt-1 text-slate-500">Ventas cobradas, pedidos y actividad de caja.</p></div><div className="flex gap-2"><button onClick={exportarCSV} disabled={!datos || cargando} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Download size={16} /> Exportar CSV</button><button onClick={() => window.print()} disabled={!datos || cargando} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><Printer size={16} /> Imprimir / PDF</button></div></header>
    <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden"><div className="min-w-48"><label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Periodo</label><select value={periodo} onChange={(e) => cambiarPeriodo(e.target.value)} className={input}><option value="hoy">Hoy</option><option value="semana">Últimos 7 días</option><option value="mes">Este mes</option><option value="personalizado">Personalizado</option></select></div><div><label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Desde</label><input type="date" className={input} value={desde} onChange={(e) => { setPeriodo("personalizado"); setDesde(e.target.value); }} /></div><div><label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Hasta</label><input type="date" className={input} value={hasta} onChange={(e) => { setPeriodo("personalizado"); setHasta(e.target.value); }} /></div><button onClick={() => cargar()} disabled={cargando} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={cargando ? "animate-spin" : ""} /> Aplicar</button><span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-400"><CalendarDays size={15} /> {desde} — {hasta}</span></section>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {cargando && !datos ? <div className="flex items-center gap-3 rounded-xl bg-white p-8 text-slate-600"><LoaderCircle className="animate-spin" /> Preparando reporte…</div> : datos && <div className="space-y-6 print:space-y-3"><div className="hidden print:block"><h2 className="text-xl font-bold">Reporte de operación</h2><p>{datos.periodo.desde} — {datos.periodo.hasta}</p></div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Ventas cobradas", pesos(datos.ventas), Banknote, "text-emerald-700 bg-emerald-100"], ["Pedidos creados", datos.cantidadPedidos, ClipboardList, "text-blue-700 bg-blue-100"], ["Cancelados", datos.pedidosCancelados, FileDown, "text-red-700 bg-red-100"], ["Preparación promedio", `${datos.promedioPreparacionMinutos} min`, AlarmClock, "text-amber-700 bg-amber-100"]].map(([label, valor, Icono, color]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icono size={18} /></span></div><p className="mt-3 text-2xl font-bold text-slate-900">{valor}</p></article>)}</section>
      <section className="grid gap-6 lg:grid-cols-2"><Panel titulo="Ventas por método de pago" vacio="Sin pagos para este periodo.">{datos.metodos.length ? <Tabla columnas={["Método", "Pagos", "Total"]} filas={datos.metodos.map((m) => [m.metodo, m.cantidad, pesos(m.total_centavos)])} /> : null}</Panel><Panel titulo="Productos más vendidos" vacio="Sin productos vendidos en el periodo.">{datos.productos.length ? <Tabla columnas={["Producto", "Unidades", "Ventas"]} filas={datos.productos.map((p) => [p.nombre_producto, p.unidades, pesos(p.ventas_centavos)])} /> : null}</Panel><Panel titulo="Motivos de cancelación" vacio="No hubo pedidos cancelados.">{datos.cancelaciones.length ? <Tabla columnas={["Motivo", "Pedidos"]} filas={datos.cancelaciones.map((c) => [c.motivo || "Sin motivo", c.cantidad])} /> : null}</Panel><Panel titulo="Movimientos de caja" vacio="Sin movimientos en el periodo.">{datos.movimientos.length ? <Tabla columnas={["Tipo", "Método", "Cantidad", "Total"]} filas={datos.movimientos.map((m) => [m.tipo, m.metodo, m.cantidad, pesos(m.total_centavos)])} /> : null}</Panel></section>
      <section className="grid gap-4 sm:grid-cols-3"><Dato label="Efectivo cobrado" valor={pesos(datos.efectivo)} /><Dato label="Transferencias cobradas" valor={pesos(datos.transferencias)} /><Dato label="Pedidos retrasados" valor={datos.pedidosRetrasados} /></section>
    </div>}
  </div>;
}

function Panel({ titulo, vacio, children }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="font-bold text-slate-900">{titulo}</h2></div>{children || <p className="p-6 text-sm text-slate-500">{vacio}</p>}</section>; }
function Tabla({ columnas, filas }) { return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columnas.map((c) => <th key={c} className="px-5 py-3">{c}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filas.map((fila, i) => <tr key={i}>{fila.map((celda, j) => <td key={j} className="px-5 py-3 text-slate-700">{celda}</td>)}</tr>)}</tbody></table></div>; }
function Dato({ label, valor }) { return <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">{valor}</p></div>; }
