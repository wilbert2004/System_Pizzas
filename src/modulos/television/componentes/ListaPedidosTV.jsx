import PedidoListoTV from "./PedidoListoTV";

export default function ListaPedidosTV({ pedidosPreparando, pedidosListos }) {
  return (
    <section className="flex h-full min-h-0 flex-col gap-5 overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="min-h-0 shrink-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">En preparación</h2>

          <span className="rounded-full bg-violet-500/20 px-4 py-1 text-sm font-bold text-violet-200 ring-1 ring-violet-400/30">
            {pedidosPreparando.length}
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {pedidosPreparando.map((pedido) => (
            <article
              key={pedido.id}
              className="rounded-2xl border border-white/10 bg-[#151522] p-4 shadow-lg shadow-black/10"
            >
              <p className="mb-2 truncate text-xs font-semibold text-white/55">
                {pedido.cliente_nombre?.trim() || "Cliente de mostrador"}
              </p>
              <div className="flex items-center justify-between gap-2">
                <h3 className="break-all text-xl font-black">
                  {pedido.folio || `#${pedido.id}`}
                </h3>

                <span                 className="rounded-full bg-violet-500/15 px-3 py-1 text-[10px] font-bold text-violet-200">
                  {pedido.estado}
                </span>
              </div>

              <p className="mt-2 text-sm text-white/60">
                {pedido.estado === "En horno"
                  ? "Tu pedido está en el horno"
                  : "Estamos preparando tu pedido"}
              </p>
            </article>
          ))}
        </div>

        {pedidosPreparando.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/40">
            No hay pedidos en preparación
          </p>
        )}
      </div>

      <div className="min-h-0 shrink-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">Pedidos listos</h2>

          <span className="rounded-full bg-emerald-500/20 px-4 py-1 text-sm font-bold text-emerald-300 ring-1 ring-emerald-400/30">
            {pedidosListos.length}
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {pedidosListos.map((pedido) => (
            <PedidoListoTV key={pedido.id} pedido={pedido} />
          ))}
        </div>

        {pedidosListos.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/40">
            Aún no hay pedidos listos
          </p>
        )}
      </div>
    </section>
  );
}
