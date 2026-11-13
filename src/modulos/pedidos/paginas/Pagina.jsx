import { useAlarmaRetrasos } from "../hooks/useAlarmaRetrasos.js";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ClipboardList,
  Clock3,
  ChefHat,
  Flame,
  CheckCircle2,
  Truck,
  PackageCheck,
  Ban,
  X,
  ArrowLeft,
  UserRound,
  MapPin,
  ShoppingBag,
  AlertTriangle,
  History,
  CreditCard,
  Volume2,
  VolumeX
} from "lucide-react";

import { useEstadoPedidos } from "../estado/EstadoPedidos.js";
import {
  formatearDinero,
  formatearFecha,
  obtenerTiempoPreparacion,
  COLORES_ESTADO,
  obtenerAccionesPedido
} from "../servicios/utilidades.js";

import { esquemaCancelacion } from "../validaciones/esquemas.js";

const ICONOS = {
  Nuevo: ClipboardList,
  Preparando: ChefHat,
  "En horno": Flame,
  Listo: CheckCircle2,
  "En reparto": Truck,
  Entregado: PackageCheck,
  Cancelado: Ban
};

const ESTADOS = [
  "Nuevo",
  "Preparando",
  "En horno",
  "Listo",
  "En reparto",
  "Entregado",
  "Cancelado"
];

const claseEntrada =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

function EtiquetaEstado({ estado }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
      COLORES_ESTADO[estado] || "bg-slate-100 text-slate-600"
    }`}>
      {estado}
    </span>
  );
}

function Cronometro({ pedido, ahora }) {
  const tiempo = obtenerTiempoPreparacion(pedido, ahora);

  if (!tiempo.iniciado) {
    return <span className="text-xs text-slate-400">Sin iniciar</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
      tiempo.retrasado ? "text-red-600" : "text-slate-600"
    }`}>
      {tiempo.retrasado
        ? <AlertTriangle size={15} />
        : <Clock3 size={15} />}
      {tiempo.texto}
      {tiempo.retrasado && (
        <span className="text-xs">Retrasado</span>
      )}
    </span>
  );
}

function TarjetaResumen({ estado, cantidad, seleccionada, onClick }) {
  const Icono = ICONOS[estado];

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${
        seleccionada
          ? "border-violet-400 bg-violet-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">
          {estado}
        </span>
        <Icono size={19} className="text-violet-500" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800">
        {cantidad}
      </p>
    </button>
  );
}

function Modal({ titulo, cerrar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">{titulo}</h2>
          <button
            onClick={cerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalCancelacion({ pedido, cerrar, confirmar, guardando }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");

    const resultado = esquemaCancelacion.safeParse({ motivo });

    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message || "Motivo inválido.");
      return;
    }

    try {
      await confirmar(resultado.data.motivo);
    } catch (err) {
      setError(err.message || "No se pudo cancelar el pedido.");
    }
  };

  return (
    <Modal titulo={`Cancelar pedido ${pedido.folio}`} cerrar={cerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={19} />
            <span className="font-semibold">Confirmar cancelación</span>
          </div>
          <p className="mt-2 text-sm text-red-700">
            El pedido permanecerá registrado y la cancelación
            aparecerá en su historial.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Motivo de cancelación *
          </span>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Explica por qué se cancela el pedido..."
            className={claseEntrada}
            autoFocus
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrar}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
          >
            Regresar
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {guardando ? "Cancelando..." : "Cancelar pedido"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DetallePedido({
  pedido,
  ahora,
  volver,
  cambiarEstado,
  abrirCancelacion,
  guardando
}) {
  const acciones = obtenerAccionesPedido(pedido);
  const puedeCancelar = !["Entregado", "Cancelado"].includes(pedido.estado);

  return (
    <div className="space-y-5">
      <button
        onClick={volver}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700"
      >
        <ArrowLeft size={17} />
        Volver a pedidos
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Detalle del pedido</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-800">
              {pedido.folio}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {formatearFecha(pedido.fecha_creacion)}
            </p>
          </div>

          <div className="space-y-2 text-right">
            <EtiquetaEstado estado={pedido.estado} />
            <div>
              <Cronometro pedido={pedido} ahora={ahora} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {acciones.map((accion) => (
            <button
              key={accion.estado}
              disabled={guardando}
              onClick={() => cambiarEstado(accion.estado)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <CheckCircle2 size={17} />
              {accion.etiqueta}
            </button>
          ))}

          {puedeCancelar && (
            <button
              disabled={guardando}
              onClick={abrirCancelacion}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Ban size={17} />
              Cancelar pedido
            </button>
          )}
        </div>
      </div>

      {pedido.metodo_pago
        ? null
        : (pedido.estado === "Listo" || pedido.estado === "En reparto") && (
            <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Falta cobrar y confirmar la entrega</p>
              <p className="mt-1">
                {pedido.estado === "En reparto"
                  ? "Al entregar el pedido, registra el cobro en Caja. El cobro lo marcará como entregado."
                  : pedido.tipo === "domicilio"
                    ? "Cuando salga a reparto, registra el cobro en Caja al entregarlo."
                    : "Cuando el cliente recoja el pedido, registra el cobro en Caja. El cobro lo marcará como entregado."}
              </p>
            </div>
          )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <UserRound size={18} className="text-violet-600" />
              Información del cliente
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Nombre</span>
                <span className="text-right font-medium text-slate-700">
                  {pedido.cliente_nombre || "Pedido rápido"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Teléfono</span>
                <span className="text-right text-slate-700">
                  {pedido.cliente_telefono || "No registrado"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Tipo</span>
                <span className="text-right text-slate-700">
                  {pedido.tipo === "domicilio" ? "Domicilio" : "Recoger"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Canal</span>
                <span className="text-right capitalize text-slate-700">
                  {pedido.canal}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Registrado por</span>
                <span className="text-right text-slate-700">
                  {pedido.empleado_nombre || "Sin información"}
                </span>
              </div>

              {pedido.tipo === "domicilio" && (
                <>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="flex items-center gap-2 text-slate-500">
                      <MapPin size={16} />
                      Dirección de entrega
                    </p>
                    <p className="mt-1 text-slate-700">
                      {pedido.direccion_entrega || "Sin dirección"}
                    </p>
                  </div>

                  {pedido.referencias_entrega && (
                    <div>
                      <p className="text-slate-500">Referencias</p>
                      <p className="mt-1 text-slate-700">
                        {pedido.referencias_entrega}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <Clock3 size={18} className="text-violet-600" />
              Tiempos del pedido
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tiempo estimado</span>
                <span className="font-medium text-slate-700">
                  {pedido.tiempo_estimado_minutos
                    ? `${pedido.tiempo_estimado_minutos} minutos`
                    : "No establecido"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Preparación</span>
                <Cronometro pedido={pedido} ahora={ahora} />
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Inicio</span>
                <span className="text-right text-slate-700">
                  {formatearFecha(pedido.fecha_inicio_preparacion)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Listo</span>
                <span className="text-right text-slate-700">
                  {formatearFecha(pedido.fecha_listo)}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <ShoppingBag size={18} className="text-violet-600" />
              Productos del pedido
            </h3>

            <div className="mt-4 divide-y divide-slate-100">
              {pedido.detalles.map((detalle) => (
                <div key={detalle.id} className="py-4 first:pt-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {detalle.cantidad} × {detalle.nombre_producto}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {detalle.nombre_presentacion}
                      </p>
                    </div>

                    <p className="font-semibold text-slate-800">
                      {formatearDinero(detalle.subtotal_centavos)}
                    </p>
                  </div>

                  {detalle.adicionales.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {detalle.adicionales.map((extra) => (
                        <p key={extra.id} className="text-xs text-slate-500">
                          + {extra.nombre_adicional}
                          {extra.cantidad > 1 ? ` × ${extra.cantidad}` : ""}
                          {" · "}
                          {formatearDinero(
                            extra.precio_unitario_centavos * extra.cantidad
                          )}
                        </p>
                      ))}
                    </div>
                  )}

                  {detalle.notas && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                      Nota: {detalle.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {pedido.notas && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-700">Notas generales</p>
                <p className="mt-1 text-slate-600">{pedido.notas}</p>
              </div>
            )}

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatearDinero(pedido.subtotal_centavos)}</span>
              </div>

              <div className="flex justify-between text-emerald-700">
                <span>Descuento</span>
                <span>-{formatearDinero(pedido.descuento_centavos)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Envío</span>
                <span>{formatearDinero(pedido.costo_envio_centavos)}</span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-bold text-slate-800">
                <span>Total</span>
                <span>{formatearDinero(pedido.total_centavos)}</span>
              </div>

              {pedido.motivo_descuento && (
                <p className="text-xs text-slate-500">
                  Motivo del descuento: {pedido.motivo_descuento}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <CreditCard size={18} />
              {pedido.metodo_pago
                ? `Pagado por ${pedido.metodo_pago}`
                : "Pago pendiente"}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <History size={18} className="text-violet-600" />
              Historial de estados
            </h3>

            <div className="mt-5 space-y-4">
              {pedido.historial.map((evento) => (
                <div key={evento.id} className="flex gap-3">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-violet-500" />
                  <div className="min-w-0 flex-1 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <EtiquetaEstado estado={evento.estado} />
                      <span className="text-xs text-slate-400">
                        {formatearFecha(evento.fecha)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Por: {evento.usuario_nombre || "Usuario no disponible"}
                    </p>

                    {evento.motivo && (
                      <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                        Motivo: {evento.motivo}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {pedido.historial.length === 0 && (
                <p className="text-sm text-slate-400">
                  No hay movimientos registrados.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function PaginaPedidos() {
  const pedidos = useEstadoPedidos((e) => e.pedidos);
  const resumen = useEstadoPedidos((e) => e.resumen);
  const filtros = useEstadoPedidos((e) => e.filtros);
  const pedidoSeleccionado = useEstadoPedidos((e) => e.pedidoSeleccionado);
  const cargando = useEstadoPedidos((e) => e.cargando);
  const guardando = useEstadoPedidos((e) => e.guardando);
  const error = useEstadoPedidos((e) => e.error);

  const cargarPedidos = useEstadoPedidos((e) => e.cargarPedidos);
  const seleccionarPedido = useEstadoPedidos((e) => e.seleccionarPedido);
  const cerrarDetalle = useEstadoPedidos((e) => e.cerrarDetalle);
  const establecerFiltro = useEstadoPedidos((e) => e.establecerFiltro);
  const limpiarFiltros = useEstadoPedidos((e) => e.limpiarFiltros);
  const cambiarEstadoPedido = useEstadoPedidos((e) => e.cambiarEstadoPedido);

  const [ahora, setAhora] = useState(() => Date.now());
  const [cancelando, setCancelando] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");
  const [alarmasSilenciadas, setAlarmasSilenciadas] = useState([]);
  const [alarmasActivas, setAlarmasActivas] = useState(true);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    cargarPedidos().catch(() => {});
  }, [cargarPedidos]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarPedidos().catch(() => {});
    }, 15000);

    return () => clearInterval(intervalo);
  }, [cargarPedidos]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarPedidos().catch(() => {});
    }, 350);

    return () => clearTimeout(temporizador);
  }, [
    filtros.busqueda,
    filtros.estado,
    filtros.tipo,
    filtros.fechaDesde,
    filtros.fechaHasta,
    cargarPedidos
  ]);

  const pedidosRetrasados = useMemo(() => {
    return pedidos.filter((pedido) =>
      obtenerTiempoPreparacion(pedido, ahora).retrasado
    );
  }, [pedidos, ahora]);

  const retrasadosSinReconocer = pedidosRetrasados.filter(
    (pedido) => !alarmasSilenciadas.includes(pedido.id)
  );
  useAlarmaRetrasos(
  alarmasActivas,
  retrasadosSinReconocer.length
);

  const cambiarEstado = async (nuevoEstado) => {
    if (!pedidoSeleccionado) return;

    setErrorLocal("");

    try {
      await cambiarEstadoPedido(pedidoSeleccionado.id, nuevoEstado);
    } catch (err) {
      setErrorLocal(err.message || "No se pudo actualizar el pedido.");
    }
  };

  const confirmarCancelacion = async (motivo) => {
    if (!pedidoSeleccionado) return;

    await cambiarEstadoPedido(
      pedidoSeleccionado.id,
      "Cancelado",
      motivo
    );

    setCancelando(false);
    setErrorLocal("");
  };

  const reconocerRetrasos = () => {
    setAlarmasSilenciadas((actuales) => [
      ...new Set([
        ...actuales,
        ...pedidosRetrasados.map((pedido) => pedido.id)
      ])
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Gestión de pedidos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta y controla los pedidos registrados en el punto de venta.
          </p>
        </div>

        <button
          onClick={() => cargarPedidos().catch(() => {})}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </div>

      {!pedidoSeleccionado && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            {ESTADOS.map((estado) => (
              <TarjetaResumen
                key={estado}
                estado={estado}
                cantidad={resumen[estado] || 0}
                seleccionada={filtros.estado === estado}
                onClick={() =>
                  establecerFiltro(
                    "estado",
                    filtros.estado === estado ? "todos" : estado
                  )
                }
              />
            ))}
          </div>

          {pedidosRetrasados.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={22} className="text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">
                    {pedidosRetrasados.length} pedido(s) retrasado(s)
                  </p>
                  <p className="text-xs text-red-700">
                    {retrasadosSinReconocer.length > 0
                      ? "Hay retrasos pendientes de reconocer."
                      : "Las alertas actuales fueron reconocidas."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <button
                  onClick={reconocerRetrasos}
                  disabled={retrasadosSinReconocer.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <VolumeX size={16} />
                  Reconocer alertas
                </button>
                <button
                  onClick={() => setAlarmasActivas((actual) => !actual)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  {alarmasActivas ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {alarmasActivas ? "Silenciar sonido" : "Activar sonido"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={filtros.busqueda}
                onChange={(e) => establecerFiltro("busqueda", e.target.value)}
                placeholder="Buscar folio, cliente o teléfono..."
                className={`${claseEntrada} pl-9`}
              />
            </div>

            <select
              value={filtros.estado}
              onChange={(e) => establecerFiltro("estado", e.target.value)}
              className={claseEntrada}
            >
              <option value="todos">Todos los estados</option>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>

            <select
              value={filtros.tipo}
              onChange={(e) => establecerFiltro("tipo", e.target.value)}
              className={claseEntrada}
            >
              <option value="todos">Todos los tipos</option>
              <option value="recoger">Recoger</option>
              <option value="domicilio">Domicilio</option>
            </select>

            <button
              onClick={limpiarFiltros}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Limpiar filtros
            </button>

            <label className="space-y-1">
              <span className="text-xs text-slate-500">Desde</span>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => establecerFiltro("fechaDesde", e.target.value)}
                className={claseEntrada}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-500">Hasta</span>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => establecerFiltro("fechaHasta", e.target.value)}
                className={claseEntrada}
              />
            </label>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {errorLocal && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorLocal}
        </div>
      )}

      {pedidoSeleccionado ? (
        <DetallePedido
          pedido={pedidoSeleccionado}
          ahora={ahora}
          volver={() => {
            cerrarDetalle();
            setErrorLocal("");
          }}
          cambiarEstado={cambiarEstado}
          abrirCancelacion={() => setCancelando(true)}
          guardando={guardando}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">
              Listado de pedidos
            </h2>
            <span className="text-xs text-slate-400">
              {pedidos.length} resultado(s)
            </span>
          </div>

          {cargando && pedidos.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Cargando pedidos...
            </div>
          ) : pedidos.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList size={35} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-600">
                No se encontraron pedidos.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Los pedidos creados desde el POS aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Folio</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Tiempo</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            seleccionarPedido(pedido.id).catch(() => {})
                          }
                          className="font-semibold text-violet-700 hover:underline"
                        >
                          {pedido.folio}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {pedido.cliente_nombre || "Pedido rápido"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {pedido.cliente_telefono || ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {pedido.tipo === "domicilio" ? "Domicilio" : "Recoger"}
                      </td>

                      <td className="px-5 py-4">
                        <EtiquetaEstado estado={pedido.estado} />
                      </td>

                      <td className="px-5 py-4">
                        <Cronometro pedido={pedido} ahora={ahora} />
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {formatearDinero(pedido.total_centavos)}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatearFecha(pedido.fecha_creacion)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            seleccionarPedido(pedido.id).catch(() => {})
                          }
                          className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                        >
                          Ver pedido
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {cancelando && pedidoSeleccionado && (
        <ModalCancelacion
          pedido={pedidoSeleccionado}
          cerrar={() => setCancelando(false)}
          confirmar={confirmarCancelacion}
          guardando={guardando}
        />
      )}
    </div>
  );
}
