import TarjetaPedido from "./TarjetaPedido";

export default function ColumnaPedidos({
  titulo,
  pedidos,
  retrasados,
  onSeleccionar,
  onAvanzar,
  procesandoId,
  color,
  temporizadores,
}) {
  return (
    <section className="flex min-w-[290px] flex-1 flex-col">
      <header
        className={`mb-3 flex items-center justify-between rounded-xl px-4 py-3 ${color}`}
      >
        <h2 className="font-bold">{titulo}</h2>
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold">
          {pedidos.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {pedidos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            No hay pedidos en esta sección
          </div>
        ) : (
          pedidos.map((pedido) => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              retrasado={retrasados.some((item) => item.id === pedido.id)}
              onSeleccionar={onSeleccionar}
              onAvanzar={onAvanzar}
              procesando={procesandoId === pedido.id}
              temporizador={temporizadores[pedido.id]}
            />
          ))
        )}
      </div>
    </section>
  );
}
