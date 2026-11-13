export default function DetalleProductos({ pedido, onCerrar }) {
  if (!pedido) return null;

  const detalles =
    pedido.detalles || pedido.productos || pedido.pedido_detalles || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {pedido.folio || `Pedido #${pedido.id}`}
            </h2>
            <p className="text-sm text-slate-500">
              Detalle completo del pedido
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </header>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Estado</p>
              <p className="font-bold">{pedido.estado}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Tipo</p>
              <p className="font-bold">{pedido.tipo}</p>
            </div>
          </div>

          {pedido.cliente_nombre && (
            <div>
              <h3 className="mb-1 font-bold">Cliente</h3>
              <p className="text-sm text-slate-600">{pedido.cliente_nombre}</p>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-bold">Productos</h3>

            <div className="space-y-3">
              {detalles.map((detalle, indice) => {
                const adicionales =
                  detalle.adicionales ||
                  detalle.pedido_detalle_adicionales ||
                  [];

                return (
                  <div
                    key={detalle.id || indice}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          {detalle.cantidad} ×{" "}
                          {detalle.nombre_producto || detalle.producto}
                        </p>

                        <p className="text-sm text-slate-500">
                          {detalle.nombre_presentacion ||
                            detalle.presentacion ||
                            ""}
                        </p>
                      </div>
                    </div>

                    {adicionales.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Adicionales
                        </p>

                        {adicionales.map((adicional, i) => (
                          <p
                            key={adicional.id || i}
                            className="text-sm text-slate-700"
                          >
                            • {adicional.cantidad || 1} ×{" "}
                            {adicional.nombre_adicional || adicional.nombre}
                          </p>
                        ))}
                      </div>
                    )}

                    {detalle.notas && (
                      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                        <strong>Indicaciones:</strong> {detalle.notas}
                      </p>
                    )}
                  </div>
                );
              })}

              {detalles.length === 0 && (
                <p className="text-sm text-slate-500">
                  No se encontraron detalles de productos.
                </p>
              )}
            </div>
          </div>

          {pedido.notas && (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Notas generales:</strong> {pedido.notas}
            </div>
          )}

          {pedido.tipo === "domicilio" && (
            <div>
              <h3 className="mb-1 font-bold">Entrega a domicilio</h3>
              <p className="text-sm text-slate-700">
                {pedido.direccion_entrega || "Sin dirección registrada"}
              </p>
              {pedido.referencias_entrega && (
                <p className="mt-1 text-sm text-slate-500">
                  Referencias: {pedido.referencias_entrega}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
