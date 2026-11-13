import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  UserRound,
  Pizza,
  CheckCircle2,
  MapPin,
  Package,
  MessageCircle,
  Phone,
  Store,
  Clock,
  Tag,
} from "lucide-react";

import { useEstadoPuntoVenta } from "../estado/EstadoPuntoVenta.js";
import { useEstadoAutenticacion } from "../../autenticacion/estado/EstadoAutenticacion.js";
import { servicioPuntoVenta } from "../servicios/puntoVenta.js";
import { esquemaPedido } from "../validaciones/esquemas.js";

const dinero = (centavos = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format((centavos || 0) / 100);

function Campo({ titulo, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{titulo}</span>
      {children}
    </label>
  );
}

const claseEntrada =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

function Modal({ titulo, cerrar, children, ancho = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        className={`max-h-[90vh] w-full ${ancho} overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="font-semibold text-slate-800">{titulo}</h2>
          <button
            onClick={cerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SelectorProducto({ producto, cerrar, agregar }) {
  const [presentacion, setPresentacion] = useState(
    producto.presentaciones[0] || null,
  );
  const [seleccionados, setSeleccionados] = useState([]);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");

  const precioAdicionales = seleccionados.reduce(
    (total, extra) => total + extra.precio_centavos * extra.cantidad,
    0,
  );

  const total = (presentacion?.precio_centavos || 0) + precioAdicionales;

  const cambiarAdicional = (adicional, marcado) => {
    setSeleccionados((actuales) => {
      if (marcado) {
        return [...actuales, { ...adicional, cantidad: 1 }];
      }

      return actuales.filter((item) => item.id !== adicional.id);
    });
  };

  const agregarCarrito = () => {
    if (!presentacion) {
      setError("Selecciona una presentación.");
      return;
    }

    agregar(producto, presentacion, seleccionados, notas);
    cerrar();
  };

  return (
    <Modal titulo={producto.nombre} cerrar={cerrar}>
      <div className="space-y-5">
        {producto.descripcion && (
          <p className="text-sm text-slate-500">{producto.descripcion}</p>
        )}

        <Campo titulo="Presentación">
          <div className="grid grid-cols-3 gap-2">
            {producto.presentaciones.map((item) => (
              <button
                key={item.id}
                onClick={() => setPresentacion(item)}
                className={`rounded-xl border p-3 text-center transition ${
                  presentacion?.id === item.id
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold">{item.nombre}</p>
                <p className="mt-1 text-xs">{dinero(item.precio_centavos)}</p>
              </button>
            ))}
          </div>
        </Campo>

        {producto.adicionales.length > 0 && (
          <Campo titulo="Ingredientes y adicionales">
            <div className="space-y-2">
              {producto.adicionales.map((extra) => {
                const seleccionado = seleccionados.some(
                  (item) => item.id === extra.id,
                );

                return (
                  <label
                    key={extra.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={(e) =>
                          cambiarAdicional(extra, e.target.checked)
                        }
                        className="h-4 w-4 accent-violet-600"
                      />
                      <span className="text-sm text-slate-700">
                        {extra.nombre}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      +{dinero(extra.precio_centavos)}
                    </span>
                  </label>
                );
              })}
            </div>
          </Campo>
        )}

        <Campo titulo="Notas del producto">
          <textarea
            className={claseEntrada}
            rows={2}
            maxLength={500}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. Sin cebolla, bien cocida..."
          />
        </Campo>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-400">Precio unitario</p>
            <p className="text-xl font-bold text-slate-800">{dinero(total)}</p>
          </div>

          <button
            onClick={agregarCarrito}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus size={17} />
            Agregar al carrito
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BuscadorCliente({ cliente, establecerCliente }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultados([]);
      return;
    }

    let vigente = true;

    const temporizador = setTimeout(async () => {
      setCargando(true);

      try {
        const resultado = await servicioPuntoVenta.buscarClientes(busqueda);

        if (vigente) setResultados(resultado);
      } catch {
        if (vigente) setResultados([]);
      } finally {
        if (vigente) setCargando(false);
      }
    }, 300);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [busqueda]);

  if (cliente) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-violet-800">{cliente.nombre}</p>
            <p className="mt-1 text-xs text-violet-700">{cliente.telefono}</p>
            {cliente.direccion && (
              <p className="mt-1 text-xs text-violet-700">
                {cliente.direccion}
              </p>
            )}
          </div>
          <button
            onClick={() => establecerCliente(null)}
            className="rounded-lg p-1 text-violet-600 hover:bg-violet-100"
            title="Quitar cliente"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          className={`${claseEntrada} pl-9`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente por nombre o teléfono..."
        />
      </div>

      {cargando && <p className="text-xs text-slate-400">Buscando...</p>}

      {resultados.length > 0 && (
        <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200">
          {resultados.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                establecerCliente(item);
                setBusqueda("");
                setResultados([]);
              }}
              className="block w-full border-b border-slate-100 px-3 py-3 text-left last:border-0 hover:bg-violet-50"
            >
              <p className="text-sm font-semibold text-slate-700">
                {item.nombre}
              </p>
              <p className="text-xs text-slate-500">{item.telefono}</p>
            </button>
          ))}
        </div>
      )}

      {busqueda.length >= 2 && !cargando && resultados.length === 0 && (
        <p className="text-xs text-slate-500">No se encontraron clientes.</p>
      )}

      <p className="text-xs text-slate-400">
        También puedes crear un pedido rápido sin cliente.
      </p>
    </div>
  );
}

function ElementoCarrito({ item, cambiarCantidad, cambiarNotas, eliminar }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{item.nombreProducto}</p>
          <p className="text-xs text-slate-500">{item.nombrePresentacion}</p>

          {item.adicionales.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {item.adicionales.map((extra) => extra.nombre).join(", ")}
            </p>
          )}

          <input
            value={item.notas}
            onChange={(e) => cambiarNotas(item.clave, e.target.value)}
            placeholder="Nota del producto..."
            maxLength={500}
            className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-violet-400"
          />
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-800">
            {dinero(item.precioUnitarioCentavos * item.cantidad)}
          </p>
          <button
            onClick={() => eliminar(item.clave)}
            className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Quitar del pedido"
            aria-label={`Quitar ${item.nombreProducto} del pedido`}
          >
            <X size={14} />
            Quitar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => cambiarCantidad(item.clave, item.cantidad - 1)}
          disabled={item.cantidad <= 1}
          className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-30"
        >
          <Minus size={14} />
        </button>

        <span className="w-7 text-center text-sm font-semibold">
          {item.cantidad}
        </span>

        <button
          onClick={() => cambiarCantidad(item.clave, item.cantidad + 1)}
          disabled={item.cantidad >= 99}
          className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-30"
        >
          <Plus size={14} />
        </button>

        <span className="ml-auto text-xs text-slate-400">
          {dinero(item.precioUnitarioCentavos)} c/u
        </span>
      </div>
    </div>
  );
}

export default function PaginaPuntoVenta() {
  const catalogo = useEstadoPuntoVenta((e) => e.catalogo);
  const categorias = useEstadoPuntoVenta((e) => e.categorias);
  const carrito = useEstadoPuntoVenta((e) => e.carrito);
  const categoriaSeleccionada = useEstadoPuntoVenta(
    (e) => e.categoriaSeleccionada,
  );
  const busquedaProducto = useEstadoPuntoVenta((e) => e.busquedaProducto);
  const cliente = useEstadoPuntoVenta((e) => e.cliente);
  const tipo = useEstadoPuntoVenta((e) => e.tipo);
  const canal = useEstadoPuntoVenta((e) => e.canal);
  const costoEnvioCentavos = useEstadoPuntoVenta((e) => e.costoEnvioCentavos);
  const descuentoCentavos = useEstadoPuntoVenta((e) => e.descuentoCentavos);
  const motivoDescuento = useEstadoPuntoVenta((e) => e.motivoDescuento);
  const direccionEntrega = useEstadoPuntoVenta((e) => e.direccionEntrega);
  const referenciasEntrega = useEstadoPuntoVenta((e) => e.referenciasEntrega);
  const notas = useEstadoPuntoVenta((e) => e.notas);
  const tiempoEstimadoMinutos = useEstadoPuntoVenta(
    (e) => e.tiempoEstimadoMinutos,
  );
  const cargando = useEstadoPuntoVenta((e) => e.cargando);
  const guardando = useEstadoPuntoVenta((e) => e.guardando);
  const error = useEstadoPuntoVenta((e) => e.error);

  const estado = useEstadoPuntoVenta;

  const rol = useEstadoAutenticacion(
    (e) => e.usuario?.rol || e.sesion?.rol || null,
  );

  const esAdministrador = rol === "administrador";

  const [productoModal, setProductoModal] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [pedidoRegistrado, setPedidoRegistrado] = useState(null);
  const [errorLocal, setErrorLocal] = useState("");
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [editandoEnvio, setEditandoEnvio] = useState(false);
  const [costoEnvioInput, setCostoEnvioInput] = useState(
    (costoEnvioCentavos / 100).toFixed(2),
  );

  useEffect(() => {
    estado
      .getState()
      .cargarCatalogo()
      .catch(() => {});
  }, []);

  const productosFiltrados = useMemo(() => {
    return catalogo.filter((producto) => {
      const coincideCategoria =
        categoriaSeleccionada === "todos" ||
        String(producto.categoria_id) === String(categoriaSeleccionada);

      const coincideBusqueda = producto.nombre
        .toLowerCase()
        .includes(busquedaProducto.trim().toLowerCase());

      return coincideCategoria && coincideBusqueda;
    });
  }, [catalogo, categoriaSeleccionada, busquedaProducto]);

  const subtotal = carrito.reduce(
    (total, item) => total + item.precioUnitarioCentavos * item.cantidad,
    0,
  );

  const total = subtotal - descuentoCentavos + costoEnvioCentavos;

  const agregar = (producto, presentacion, adicionales, notasProducto) => {
    estado.getState().agregarProducto(producto, presentacion, adicionales);

    const nuevoCarrito = estado.getState().carrito;
    const ultimo = nuevoCarrito[nuevoCarrito.length - 1];

    if (ultimo && notasProducto) {
      estado.getState().cambiarNotasProducto(ultimo.clave, notasProducto);
    }
  };

  const validarYConfirmar = async () => {
    setErrorLocal("");

    const datos = {
      canal,
      tipo,
      costoEnvioCentavos: tipo === "recoger" ? 0 : costoEnvioCentavos,
      descuentoCentavos,
      motivoDescuento,
      direccionEntrega,
      referenciasEntrega,
      notas,
      productos: carrito.map((item) => ({
        productoId: item.productoId,
        presentacionId: item.presentacionId,
        cantidad: item.cantidad,
        notas: item.notas,
        adicionales: item.adicionales.map((extra) => ({
          id: extra.id,
          cantidad: extra.cantidad,
        })),
      })),
    };

    const validacion = esquemaPedido.safeParse(datos);

    if (!validacion.success) {
      setErrorLocal(validacion.error.issues[0]?.message || "Revisa los datos.");
      return;
    }

    if (tipo === "domicilio" && !cliente) {
      setErrorLocal("Selecciona un cliente para el pedido a domicilio.");
      return;
    }

    if (tipo === "domicilio" && !direccionEntrega.trim()) {
      setErrorLocal("Escribe la dirección de entrega.");
      return;
    }

    if (descuentoCentavos > 0 && !motivoDescuento.trim()) {
      setErrorLocal("Indica el motivo del descuento.");
      return;
    }

    if (descuentoCentavos > subtotal) {
      setErrorLocal("El descuento no puede superar el subtotal.");
      return;
    }

    setConfirmacion({
      subtotal,
      descuento: descuentoCentavos,
      envio: tipo === "recoger" ? 0 : costoEnvioCentavos,
      total,
    });
  };

  const ejecutarConfirmacion = async () => {
    try {
      const resultado = await estado.getState().confirmarPedido();

      setConfirmacion(null);
      setMostrarOpciones(false);
      setErrorLocal("");

      setPedidoRegistrado(resultado);
    } catch (err) {
      setErrorLocal(err.message || "No se pudo registrar el pedido.");
      setConfirmacion(null);
    }
  };

  const cambiarEnvio = (valor) => {
    setCostoEnvioInput(valor);
    if (valor === "") return;
    const pesos = Number(valor);
    if (!Number.isFinite(pesos) || pesos < 0) return;
    const centavos = Math.round(pesos * 100);
    if (!Number.isSafeInteger(centavos)) return;
    estado.getState().establecerCostoEnvio(centavos);
  };

  useEffect(() => {
    if (!editandoEnvio) {
      setCostoEnvioInput((costoEnvioCentavos / 100).toFixed(2));
    }
  }, [costoEnvioCentavos, editandoEnvio]);

  const cambiarDescuento = (valor) => {
    const numero = Math.round(Number(valor || 0) * 100);

    if (!Number.isSafeInteger(numero) || numero < 0) return;

    estado.getState().establecerDescuento(numero, motivoDescuento);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Punto de venta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registra productos y crea pedidos para tu sucursal.
        </p>
      </div>

      <div className="grid min-h-[650px] gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={busquedaProducto}
                onChange={(e) =>
                  estado.getState().establecerBusquedaProducto(e.target.value)
                }
                placeholder="Buscar producto..."
                className={`${claseEntrada} pl-10`}
              />
            </div>

            <button
              onClick={() =>
                estado
                  .getState()
                  .cargarCatalogo()
                  .catch(() => {})
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Actualizar catálogo
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => estado.getState().establecerCategoria("todos")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                categoriaSeleccionada === "todos"
                  ? "bg-violet-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              Todos
            </button>

            {categorias.map((categoria) => (
              <button
                key={categoria.id}
                onClick={() =>
                  estado.getState().establecerCategoria(categoria.id)
                }
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                  String(categoriaSeleccionada) === String(categoria.id)
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>

          {cargando ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Cargando catálogo...
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Pizza size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-600">
                No hay productos disponibles.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Registra productos y presentaciones desde el módulo Productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {productosFiltrados.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => setProductoModal(producto)}
                  disabled={producto.presentaciones.length === 0}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md disabled:opacity-50"
                >
                  <div className="flex h-28 items-center justify-center bg-violet-50">
                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Pizza size={42} className="text-violet-300" />
                    )}
                  </div>

                  <div className="p-4">
                    <p className="font-semibold text-slate-800 group-hover:text-violet-700">
                      {producto.nombre}
                    </p>
                    <p className="mt-1 line-clamp-2 min-h-8 text-xs text-slate-500">
                      {producto.descripcion ||
                        "Selecciona para agregar al pedido."}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {producto.presentaciones.length} presentación(es)
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <Plus size={18} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={19} className="text-violet-600" />
              <h2 className="font-semibold text-slate-800">Pedido actual</h2>
            </div>
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
              {carrito.reduce((total, item) => total + item.cantidad, 0)}{" "}
              artículos
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-3">
              <Campo titulo="Cliente">
                <BuscadorCliente
                  cliente={cliente}
                  establecerCliente={estado.getState().establecerCliente}
                />
              </Campo>

              <Campo titulo="Tipo de pedido">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => estado.getState().establecerTipo("recoger")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm ${
                      tipo === "recoger"
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <Store size={16} />
                    Recoger
                  </button>
                  <button
                    onClick={() =>
                      estado.getState().establecerTipo("domicilio")
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm ${
                      tipo === "domicilio"
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <MapPin size={16} />
                    Domicilio
                  </button>
                </div>
              </Campo>

              <Campo titulo="Canal de recepción">
                <select
                  value={canal}
                  onChange={(e) =>
                    estado.getState().establecerCanal(e.target.value)
                  }
                  className={claseEntrada}
                >
                  <option value="mostrador">Mostrador</option>
                  <option value="telefono">Teléfono</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </Campo>

              {tipo === "domicilio" && (
                <>
                  <Campo titulo="Dirección de entrega">
                    <input
                      className={claseEntrada}
                      value={direccionEntrega}
                      onChange={(e) =>
                        estado.getState().establecerDireccion(e.target.value)
                      }
                      placeholder="Dirección completa"
                      maxLength={300}
                    />
                  </Campo>

                  <Campo titulo="Referencias">
                    <input
                      className={claseEntrada}
                      value={referenciasEntrega}
                      onChange={(e) =>
                        estado.getState().establecerReferencias(e.target.value)
                      }
                      placeholder="Referencias del domicilio"
                      maxLength={500}
                    />
                  </Campo>

                  <Campo titulo="Costo de envío (MXN)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={claseEntrada}
                      value={costoEnvioInput}
                      onFocus={() => setEditandoEnvio(true)}
                      onChange={(e) => cambiarEnvio(e.target.value)}
                      onBlur={() => {
                        setEditandoEnvio(false);
                        if (costoEnvioInput === "") {
                          estado.getState().establecerCostoEnvio(0);
                          setCostoEnvioInput("0.00");
                        } else {
                          setCostoEnvioInput((costoEnvioCentavos / 100).toFixed(2));
                        }
                      }}
                    />
                  </Campo>
                </>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Productos agregados
              </h3>

              {carrito.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-6 text-center">
                  <ShoppingCart size={27} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    El carrito está vacío.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Selecciona productos del catálogo.
                  </p>
                </div>
              ) : (
                carrito.map((item) => (
                  <ElementoCarrito
                    key={item.clave}
                    item={item}
                    cambiarCantidad={estado.getState().cambiarCantidad}
                    cambiarNotas={estado.getState().cambiarNotasProducto}
                    eliminar={estado.getState().eliminarProducto}
                  />
                ))
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={() => setMostrarOpciones(!mostrarOpciones)}
                className="flex w-full items-center justify-between text-sm font-semibold text-slate-600"
              >
                <span>Notas y opciones del pedido</span>
                <Tag size={16} />
              </button>

              {mostrarOpciones && (
                <div className="mt-3 space-y-3">
                  <Campo titulo="Notas generales">
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={notas}
                      onChange={(e) =>
                        estado.getState().establecerNotas(e.target.value)
                      }
                      className={claseEntrada}
                      placeholder="Indicaciones generales..."
                    />
                  </Campo>

                  <Campo titulo="Tiempo estimado (minutos)">
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={tiempoEstimadoMinutos}
                      onChange={(e) =>
                        estado
                          .getState()
                          .establecerTiempoEstimado(e.target.value)
                      }
                      className={claseEntrada}
                      placeholder="Ej. 30"
                    />
                  </Campo>

                  {esAdministrador && (
                    <>
                      <Campo titulo="Descuento (MXN)">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(descuentoCentavos / 100).toFixed(2)}
                          onChange={(e) => cambiarDescuento(e.target.value)}
                          className={claseEntrada}
                        />
                      </Campo>

                      {descuentoCentavos > 0 && (
                        <Campo titulo="Motivo del descuento">
                          <input
                            value={motivoDescuento}
                            onChange={(e) =>
                              estado
                                .getState()
                                .establecerDescuento(
                                  descuentoCentavos,
                                  e.target.value,
                                )
                            }
                            maxLength={300}
                            className={claseEntrada}
                            placeholder="Indica el motivo..."
                          />
                        </Campo>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{dinero(subtotal)}</span>
              </div>

              {descuentoCentavos > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento</span>
                  <span>-{dinero(descuentoCentavos)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Envío</span>
                <span>
                  {dinero(tipo === "recoger" ? 0 : costoEnvioCentavos)}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-800">
                <span>Total</span>
                <span>{dinero(total)}</span>
              </div>
            </div>

            {errorLocal && (
              <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                {errorLocal}
              </p>
            )}

            {error && (
              <p className="mt-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={validarYConfirmar}
              disabled={carrito.length === 0 || guardando}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              Confirmar pedido
            </button>

            <p className="mt-2 text-center text-xs text-slate-400">
              El pago se registrará posteriormente en Caja.
            </p>
          </div>
        </aside>
      </div>

      {productoModal && (
        <SelectorProducto
          producto={productoModal}
          cerrar={() => setProductoModal(null)}
          agregar={agregar}
        />
      )}

      {confirmacion && (
        <Modal titulo="Confirmar pedido" cerrar={() => setConfirmacion(null)}>
          <div className="space-y-4">
            <div className="rounded-xl bg-violet-50 p-4 text-center">
              <CheckCircle2 size={35} className="mx-auto text-violet-600" />
              <p className="mt-2 font-semibold text-violet-800">
                ¿Registrar este pedido?
              </p>
              <p className="mt-1 text-sm text-violet-700">
                Se guardará con estado Nuevo.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{dinero(confirmacion.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descuento</span>
                <span>-{dinero(confirmacion.descuento)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Envío</span>
                <span>{dinero(confirmacion.envio)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{dinero(confirmacion.total)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              El pedido se registrará sin pago. No se realizará ningún
              movimiento de caja.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmacion(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600"
              >
                Regresar
              </button>
              <button
                onClick={ejecutarConfirmacion}
                disabled={guardando}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Sí, registrar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pedidoRegistrado && (
        <Modal
          titulo="Pedido registrado"
          cerrar={() => setPedidoRegistrado(null)}
          ancho="max-w-md"
        >
          <div className="space-y-5">
            <div className="rounded-2xl bg-emerald-50 p-5 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={30} className="text-emerald-600" />
              </span>
              <h3 className="mt-3 text-lg font-bold text-emerald-900">
                Pedido registrado correctamente
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                El pedido quedó listo para continuar su proceso.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-sm text-slate-500">Folio</span>
                <span className="font-semibold text-slate-800">
                  {pedidoRegistrado.folio}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-xl font-bold text-violet-700">
                  {dinero(pedidoRegistrado.totalCentavos)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              El pago queda pendiente de registro en Caja.
            </div>

            <button
              onClick={() => setPedidoRegistrado(null)}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Aceptar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
