import { useEffect, useState } from "react";
import PedidoListoTV from "./PedidoListoTV";
import ResumenProductosTV from "./ResumenProductosTV";

function Columna({ pedidos, listos = false, titulo, eyebrow, tono }) {
  const [pagina, setPagina] = useState(0);
  const paginas = Math.max(1, Math.ceil(pedidos.length / 4));
  useEffect(() => { setPagina(0); }, [pedidos.length]);
  useEffect(() => {
    if (paginas < 2) return undefined;
    const timer = setInterval(() => setPagina((actual) => (actual + 1) % paginas), 7000);
    return () => clearInterval(timer);
  }, [paginas]);
  const visibles = pedidos.slice(pagina * 4, pagina * 4 + 4);
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div className="mb-2 flex shrink-0 items-center justify-between gap-3 sm:mb-3"><div><p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${tono}`}>{eyebrow}</p><h2 className="mt-0.5 text-base font-black tracking-tight sm:text-xl">{titulo}</h2></div><span className={`flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-sm font-black ${listos ? "bg-emerald-400/15 text-emerald-200" : "bg-violet-400/15 text-violet-200"}`}>{pedidos.length}</span></div>
    <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-hidden sm:grid-cols-2">
      {visibles.map((pedido) => listos ? <PedidoListoTV key={pedido.id} pedido={pedido} /> : <article key={pedido.id} className="flex min-w-0 flex-col justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#171a28] to-[#11141e] px-3 py-2.5 shadow-lg"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-base font-black tracking-tight sm:text-lg">{pedido.cliente_nombre || "Pedido de mostrador"}</h3><p className="truncate text-[9px] text-white/45 sm:text-[10px]">{pedido.folio || `#${pedido.id}`}</p></div><span className="shrink-0 rounded-full bg-violet-400/15 px-2 py-1 text-[9px] font-bold text-violet-200">{pedido.estado}</span></div><p className="mt-1 text-[10px] text-white/55 sm:text-xs">{pedido.estado === "En horno" ? "En el horno" : "En preparación"}</p><div className="mt-1.5"><ResumenProductosTV productos={pedido.productosTV} /></div></article>)}
      {!pedidos.length && <p className="col-span-full flex items-center justify-center rounded-xl border border-dashed border-white/10 text-center text-xs text-white/40">{listos ? "Aún no hay pedidos listos" : "No hay pedidos en preparación"}</p>}
    </div>
    {pedidos.length > 4 && <p className="mt-1.5 shrink-0 text-right text-[10px] text-white/40">Vista {pagina + 1} de {paginas} · cambia automáticamente</p>}
  </div>;
}

export default function ListaPedidosTV({ pedidosPreparando, pedidosListos }) {
  return <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-5 lg:p-6"><Columna pedidos={pedidosPreparando} titulo="En preparación" eyebrow="Cocina" tono="text-violet-300/70" /><div className="shrink-0 border-t border-white/[0.08]" /><Columna pedidos={pedidosListos} listos titulo="Pedidos listos" eyebrow="Para recoger o recibir" tono="text-emerald-300/70" /></section>;
}
