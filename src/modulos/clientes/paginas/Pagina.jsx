import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Users,
  Phone,
  MapPin,
  Pencil,
  X,
  Save,
  History,
  UserRound,
  ShoppingBag,
  RefreshCw,
  UserX,
  UserCheck,
  ArrowLeft,
} from "lucide-react";

import { useEstadoClientes } from "../estado/EstadoClientes.js";
import { useEstadoAutenticacion } from "../../autenticacion/estado/EstadoAutenticacion.js";
import { esquemaCliente } from "../validaciones/esquemas.js";

const dinero = (centavos = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format((centavos || 0) / 100);

const fecha = (valor) => {
  if (!valor) return "Sin fecha";

  const normalizada = valor.includes("T") ? valor : valor.replace(" ", "T");

  const resultado = new Date(normalizada);

  if (Number.isNaN(resultado.getTime())) return valor;

  return resultado.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formularioVacio = {
  nombre: "",
  telefono: "",
  direccion: "",
  referencias: "",
};

function Campo({ etiqueta, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      {children}
    </label>
  );
}

function Entrada(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    />
  );
}

function AreaTexto(props) {
  return (
    <textarea
      {...props}
      className={`w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    />
  );
}

function FormularioCliente({ cliente, onGuardar, onCancelar, guardando }) {
  const [datos, setDatos] = useState(
    cliente
      ? {
          nombre: cliente.nombre || "",
          telefono: cliente.telefono || "",
          direccion: cliente.direccion || "",
          referencias: cliente.referencias || "",
        }
      : formularioVacio,
  );

  const [error, setError] = useState("");

  const cambiar = (campo, valor) => {
    setDatos((actuales) => ({
      ...actuales,
      [campo]: valor,
    }));
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");

    const validacion = esquemaCliente.safeParse(datos);

    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message || "Revisa los datos.");
      return;
    }

    try {
      await onGuardar(validacion.data);
    } catch (err) {
      setError(err.message || "No se pudo guardar el cliente.");
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre completo *">
          <Entrada
            value={datos.nombre}
            onChange={(e) => cambiar("nombre", e.target.value)}
            placeholder="Nombre del cliente"
            maxLength={100}
            autoFocus
          />
        </Campo>

        <Campo etiqueta="Teléfono *">
          <Entrada
            value={datos.telefono}
            onChange={(e) => cambiar("telefono", e.target.value)}
            placeholder="Ej. 985 123 4567"
            maxLength={20}
            inputMode="tel"
          />
        </Campo>
      </div>

      <Campo etiqueta="Dirección">
        <Entrada
          value={datos.direccion}
          onChange={(e) => cambiar("direccion", e.target.value)}
          placeholder="Calle, número, colonia..."
          maxLength={300}
        />
      </Campo>

      <Campo etiqueta="Referencias de domicilio">
        <AreaTexto
          value={datos.referencias}
          onChange={(e) => cambiar("referencias", e.target.value)}
          placeholder="Color de la casa, entre calles, referencias..."
          rows={3}
          maxLength={500}
        />
      </Campo>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          <Save size={17} />
          {guardando ? "Guardando..." : "Guardar cliente"}
        </button>
      </div>
    </form>
  );
}

function Modal({ titulo, onCerrar, children, ancho = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        className={`max-h-[90vh] w-full ${ancho} overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="font-semibold text-slate-800">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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

function FichaCliente({ historial, onVolver, onEditar }) {
  const { cliente, resumen, pedidos } = historial;

  return (
    <div className="space-y-6">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700"
      >
        <ArrowLeft size={17} />
        Volver a clientes
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <UserRound size={27} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {cliente.nombre}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cliente #{cliente.id}
              </p>
            </div>
          </div>

          <button
            onClick={() => onEditar(cliente)}
            disabled={!cliente.activo}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Pencil size={16} />
            Editar
          </button>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Phone size={18} className="mt-0.5 text-violet-500" />
            <div>
              <p className="text-xs text-slate-400">Teléfono</p>
              <p className="text-sm font-medium text-slate-700">
                {cliente.telefono}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 text-violet-500" />
            <div>
              <p className="text-xs text-slate-400">Dirección</p>
              <p className="text-sm font-medium text-slate-700">
                {cliente.direccion || "Sin dirección registrada"}
              </p>
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs text-slate-400">Referencias</p>
            <p className="mt-1 text-sm text-slate-700">
              {cliente.referencias || "Sin referencias"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <ShoppingBag size={18} />
            <span className="text-sm">Pedidos registrados</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {resumen.totalPedidos}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Pedidos pagados</div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {resumen.pedidosPagados}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Total comprado</div>
          <p className="mt-3 text-2xl font-bold text-violet-700">
            {dinero(resumen.totalCompradoCentavos)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <History size={18} className="text-violet-600" />
          <h3 className="font-semibold text-slate-800">Historial de pedidos</h3>
        </div>

        {pedidos.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-600">
              Este cliente todavía no tiene pedidos.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Los pedidos aparecerán aquí cuando se registren desde el punto de
              venta.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Folio</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Pago</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      {pedido.folio || `#${pedido.id}`}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {fecha(pedido.fecha_creacion)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{pedido.tipo}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {pedido.estado}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {pedido.metodo_pago || "Pendiente"}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">
                      {dinero(pedido.total_centavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaginaClientes() {
  const clientes = useEstadoClientes((estado) => estado.clientes);
  const cargando = useEstadoClientes((estado) => estado.cargando);
  const error = useEstadoClientes((estado) => estado.error);
  const busqueda = useEstadoClientes((estado) => estado.busqueda);
  const incluirInactivos = useEstadoClientes(
    (estado) => estado.incluirInactivos,
  );
  const historial = useEstadoClientes((estado) => estado.historial);

  const cargarClientes = useEstadoClientes((estado) => estado.cargarClientes);
  const establecerBusqueda = useEstadoClientes(
    (estado) => estado.establecerBusqueda,
  );
  const establecerIncluirInactivos = useEstadoClientes(
    (estado) => estado.establecerIncluirInactivos,
  );
  const crearCliente = useEstadoClientes((estado) => estado.crearCliente);
  const actualizarCliente = useEstadoClientes(
    (estado) => estado.actualizarCliente,
  );
  const cambiarEstadoCliente = useEstadoClientes(
    (estado) => estado.cambiarEstadoCliente,
  );
  const seleccionarCliente = useEstadoClientes(
    (estado) => estado.seleccionarCliente,
  );
  const limpiarSeleccion = useEstadoClientes(
    (estado) => estado.limpiarSeleccion,
  );

  const rol = useEstadoAutenticacion(
    (estado) => estado.usuario?.rol || estado.sesion?.rol || null,
  );

  const esAdministrador = rol === "administrador";

  const [modal, setModal] = useState(null);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarClientes().catch(() => {});
  }, [cargarClientes]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarClientes().catch(() => {});
    }, 250);

    return () => clearTimeout(temporizador);
  }, [busqueda, incluirInactivos, cargarClientes]);

  const abrirNuevo = () => {
    setClienteEditando(null);
    setModal("nuevo");
  };

  const abrirEdicion = (cliente) => {
    setClienteEditando(cliente);
    setModal("editar");
  };

  const guardar = async (datos) => {
    setGuardando(true);

    try {
      if (modal === "editar" && clienteEditando) {
        await actualizarCliente(clienteEditando.id, datos);
      } else {
        await crearCliente(datos);
      }

      setModal(null);
      setClienteEditando(null);
      await cargarClientes();
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (cliente) => {
    const nuevoEstado = !cliente.activo;

    const confirmado = window.confirm(
      nuevoEstado
        ? `¿Deseas reactivar a ${cliente.nombre}?`
        : `¿Deseas desactivar a ${cliente.nombre}?`,
    );

    if (!confirmado) return;

    try {
      await cambiarEstadoCliente(cliente.id, nuevoEstado);
    } catch (err) {
      window.alert(err.message || "No se pudo cambiar el estado.");
    }
  };

  if (historial) {
    return (
      <div className="space-y-5">
        <FichaCliente
          historial={historial}
          onVolver={limpiarSeleccion}
          onEditar={(cliente) => abrirEdicion(cliente)}
        />

        {modal === "editar" && (
          <Modal titulo="Editar cliente" onCerrar={() => setModal(null)}>
            <FormularioCliente
              cliente={clienteEditando}
              onGuardar={guardar}
              onCancelar={() => setModal(null)}
              guardando={guardando}
            />
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 md:p-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra la información y el historial de tus clientes.
          </p>
        </div>

        <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700">
          {clientes.length} clientes {incluirInactivos ? "en total" : "activos"}
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <h2 className="text-lg font-semibold text-slate-800">
              Clientes registrados
            </h2>
            <div className="relative w-full sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={busqueda}
                onChange={(e) => establecerBusqueda(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            {esAdministrador ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={incluirInactivos}
                  onChange={(e) => establecerIncluirInactivos(e.target.checked)}
                  className="h-4 w-4 accent-violet-600"
                />
                Mostrar inactivos
              </label>
            ) : (
              <span />
            )}
            <button
              onClick={() => cargarClientes().catch(() => {})}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          {cargando ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Cargando clientes...
            </div>
          ) : clientes.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-600">
                No se encontraron clientes.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Registra un cliente nuevo o modifica tu búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Teléfono</th>
                    <th className="px-5 py-3">Dirección</th>
                    <th className="px-5 py-3">Pedidos</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            seleccionarCliente(cliente.id).catch((err) =>
                              window.alert(err.message),
                            )
                          }
                          className="font-semibold text-slate-800 hover:text-violet-700"
                        >
                          {cliente.nombre}
                        </button>
                        <p className="mt-1 text-xs text-slate-400">
                          Cliente #{cliente.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {cliente.telefono}
                      </td>

                      <td className="max-w-xs truncate px-5 py-4 text-slate-500">
                        {cliente.direccion || "Sin dirección"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {cliente.total_pedidos || 0}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            cliente.activo
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {cliente.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() =>
                              seleccionarCliente(cliente.id).catch((err) =>
                                window.alert(err.message),
                              )
                            }
                            title="Ver ficha e historial"
                            className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                          >
                            <History size={17} />
                          </button>

                          {cliente.activo && (
                            <button
                              onClick={() => abrirEdicion(cliente)}
                              title="Editar"
                              className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                            >
                              <Pencil size={17} />
                            </button>
                          )}

                          {esAdministrador && (
                            <button
                              onClick={() => cambiarEstado(cliente)}
                              title={
                                cliente.activo ? "Desactivar" : "Reactivar"
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            >
                              {cliente.activo ? (
                                <UserX size={17} />
                              ) : (
                                <UserCheck size={17} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={abrirNuevo}
          className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-6 text-center transition hover:border-violet-400 hover:bg-violet-50"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <Plus size={28} />
          </span>
          <span className="text-lg font-bold text-slate-800">
            Registrar cliente
          </span>
          <span className="mt-1 text-sm text-slate-500">
            Agrega sus datos de contacto y domicilio
          </span>
        </button>
      </div>

      {modal && (
        <Modal
          titulo={modal === "editar" ? "Editar cliente" : "Registrar cliente"}
          onCerrar={() => setModal(null)}
        >
          <FormularioCliente
            cliente={clienteEditando}
            onGuardar={guardar}
            onCancelar={() => setModal(null)}
            guardando={guardando}
          />
        </Modal>
      )}
    </div>
  );
}
