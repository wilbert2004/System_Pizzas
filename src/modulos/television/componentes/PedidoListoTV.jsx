import ResumenProductosTV from "./ResumenProductosTV";

export default function PedidoListoTV({ pedido }) {
  return (
    <article className="relative flex min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-emerald-300/20 bg-gradient-to-br from-[#123c35] via-[#102d2b] to-[#14201f] px-3 py-2 shadow-lg shadow-emerald-950/15 ring-1 ring-white/[0.04]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[18px] border-emerald-200/[0.06]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.19em] text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.65)]" /> Pedido listo
          </p>

          <h3 className="mt-1 truncate text-lg font-black leading-tight tracking-tight text-white sm:text-xl">
            {pedido.cliente_nombre || "Pedido de mostrador"}
          </h3>
          <p className="truncate text-[9px] text-white/50 sm:text-[10px]">{pedido.folio || `#${pedido.id}`}</p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-lg text-emerald-200 ring-1 ring-emerald-200/10">✓</span>
      </div>

      <p className="relative mt-1.5 border-t border-white/[0.08] pt-1.5 text-[10px] font-semibold text-emerald-100 sm:text-xs">
        {pedido.tipo === "domicilio"
          ? "Listo para salir a reparto"
          : "Puedes pasar a recogerlo"}
      </p>
      <div className="relative mt-1">
        <ResumenProductosTV productos={pedido.productosTV} />
      </div>
    </article>
  );
}
