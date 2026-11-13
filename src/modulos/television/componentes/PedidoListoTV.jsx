export default function PedidoListoTV({ pedido }) {
  const nombreCliente = pedido.cliente_nombre?.trim() || "Cliente de mostrador";

  return (
    <article className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-emerald-950/30 p-4 shadow-lg shadow-emerald-950/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            ¡Pedido listo!
          </p>

          <h3 className="mt-1 break-all text-2xl font-black leading-tight text-white">
            {pedido.folio || `#${pedido.id}`}
          </h3>
          <p className="mt-2 max-w-[16rem] truncate text-sm font-semibold text-white/75">
            {nombreCliente}
          </p>
        </div>

        <span className="rounded-xl bg-emerald-300/15 p-2 text-3xl">🔔</span>
      </div>

      <p className="mt-2 text-xs font-semibold text-emerald-100 sm:text-sm">
        {pedido.tipo === "domicilio"
          ? "Listo para salir a reparto"
          : "Puedes pasar a recogerlo"}
      </p>
    </article>
  );
}
