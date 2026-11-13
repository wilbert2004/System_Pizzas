import { useEffect, useState } from "react";
import { useEstadoProductos } from "../estado/EstadoProductos.js";
import { servicioProductos } from "../servicios/productos.js";
import { validarProducto } from "../validaciones/esquemas.js";
import { useEstadoAutenticacion } from "../../autenticacion/estado/EstadoAutenticacion.js";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";

const dinero = (centavos) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(centavos / 100);

const precioEnCentavos = (pesos) => Math.round(Number(pesos) * 100);

const formularioInicial = {
  nombre: "",
  categoria_id: "",
  descripcion: "",
  imagen_url: "",
  orden: 0,
  requiere_presentacion: true,
  presentaciones: [
    { nombre: "Chica", precio: "" },
    { nombre: "Mediana", precio: "" },
    { nombre: "Grande", precio: "" },
  ],
};

export default function PaginaProductos() {
  const { productos, categorias, adicionales, cargando, cargarCatalogo } =
    useEstadoProductos();

  const usuario = useEstadoAutenticacion((estado) => estado.usuario);

  const [pestana, setPestana] = useState("productos");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [modalAdicionalAbierto, setModalAdicionalAbierto] = useState(false);
  const [modalPresentacionAbierto, setModalPresentacionAbierto] =
    useState(false);

  const [producto, setProducto] = useState(formularioInicial);
  const [categoria, setCategoria] = useState({
    nombre: "",
    descripcion: "",
  });
  const [adicional, setAdicional] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
  });

  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [presentacion, setPresentacion] = useState({
    nombre: "",
    precio: "",
  });
  const [presentacionesProducto, setPresentacionesProducto] = useState([]);

  const [adicionalesSeleccionados, setAdicionalesSeleccionados] = useState([]);

  const esAdministrador = usuario?.rol === "administrador";

  async function cargar() {
    try {
      await cargarCatalogo();
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function limpiarMensajes() {
    setMensaje("");
    setError("");
  }

  async function ejecutar(accion, mensajeExito) {
    limpiarMensajes();

    try {
      await accion();
      await cargar();
      setMensaje(mensajeExito);
    } catch (e) {
      setError(e.message || "Ocurrió un error.");
    }
  }

  async function guardarCategoria(e) {
    e.preventDefault();

    await ejecutar(async () => {
      if (!categoria.nombre.trim()) {
        throw new Error("Escribe el nombre de la categoría.");
      }

      if (categoria.id) {
        await servicioProductos.actualizarCategoria(categoria);
      } else {
        await servicioProductos.crearCategoria(categoria);
      }

      setCategoria({ nombre: "", descripcion: "" });
      setModalCategoriaAbierto(false);
    }, categoria.id
      ? "Categoría actualizada correctamente."
      : "Categoría creada correctamente.");
  }

  async function guardarAdicional(e) {
    e.preventDefault();

    await ejecutar(async () => {
      if (!adicional.nombre.trim()) {
        throw new Error("Escribe el nombre del adicional.");
      }

      const datos = {
        ...adicional,
        precio_centavos: precioEnCentavos(adicional.precio),
      };

      if (adicional.id) {
        await servicioProductos.actualizarAdicional(datos);
      } else {
        await servicioProductos.crearAdicional(datos);
      }

      setAdicional({
        nombre: "",
        descripcion: "",
        precio: "",
      });
      setModalAdicionalAbierto(false);
    }, adicional.id
      ? "Ingrediente actualizado correctamente."
      : "Ingrediente creado correctamente.");
  }

  async function editarCategoria(categoriaSeleccionada) {
    limpiarMensajes();
    setCategoria({
      id: categoriaSeleccionada.id,
      nombre: categoriaSeleccionada.nombre,
      descripcion: categoriaSeleccionada.descripcion || "",
    });
    setModalCategoriaAbierto(true);
  }

  async function eliminarCategoria(id) {
    if (!window.confirm("¿Deseas eliminar esta categoría del catálogo?")) {
      return;
    }

    await ejecutar(async () => {
      await servicioProductos.cambiarEstadoCategoria({ id, activo: false });
    }, "Categoría eliminada del catálogo.");
  }

  function editarAdicional(adicionalSeleccionado) {
    limpiarMensajes();
    setAdicional({
      id: adicionalSeleccionado.id,
      nombre: adicionalSeleccionado.nombre,
      descripcion: adicionalSeleccionado.descripcion || "",
      precio: (adicionalSeleccionado.precio_centavos / 100).toFixed(2),
    });
    setModalAdicionalAbierto(true);
  }

  async function eliminarAdicional(id) {
    if (!window.confirm("¿Deseas eliminar este ingrediente adicional?")) {
      return;
    }

    await ejecutar(async () => {
      await servicioProductos.cambiarEstadoAdicional({ id, activo: false });
    }, "Ingrediente eliminado del catálogo.");
  }

  async function guardarProducto(e) {
    e.preventDefault();

    await ejecutar(async () => {
      const esEdicion = Boolean(producto.id);
      const datos = {
        ...producto,
        categoria_id: Number(producto.categoria_id),
        presentaciones: producto.presentaciones.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio_centavos: precioEnCentavos(p.precio),
        })),
      };

      const errores = validarProducto(datos);

      if (Object.keys(errores).length) {
        throw new Error(Object.values(errores)[0]);
      }

      if (!esEdicion) {
        await servicioProductos.crear(datos);
      } else {
        const productoId = Number(producto.id);
        const presentacionesOriginales = producto.presentaciones.filter(
          (presentacion) => presentacion.id,
        );

        await servicioProductos.actualizar({
          ...datos,
          id: productoId,
        });

        await Promise.all(
          datos.presentaciones.map((presentacion, indice) =>
            presentacion.id
              ? servicioProductos.actualizarPresentacion({
                  ...presentacion,
                  id: presentacion.id,
                  producto_id: productoId,
                  orden: indice,
                })
              : servicioProductos.crearPresentacion({
                  ...presentacion,
                  producto_id: productoId,
                  orden: indice,
                }),
          ),
        );

        const idsActualizados = new Set(
          datos.presentaciones
            .filter((presentacion) => presentacion.id)
            .map((presentacion) => presentacion.id),
        );

        await Promise.all(
          presentacionesOriginales
            .filter(
              (presentacion) => !idsActualizados.has(presentacion.id),
            )
            .map((presentacion) =>
              servicioProductos.cambiarEstadoPresentacion({
                id: presentacion.id,
                producto_id: productoId,
                activo: false,
              }),
            ),
        );
      }

      setProducto(formularioInicial);
      setModalProductoAbierto(false);
    }, producto.id
      ? "Producto actualizado correctamente."
      : "Producto registrado correctamente.");
  }

  async function editarProducto(id) {
    limpiarMensajes();

    try {
      const detalle = await servicioProductos.obtener(id);

      setProducto({
        ...detalle,
        categoria_id: String(detalle.categoria_id),
        requiere_presentacion: Boolean(detalle.requiere_presentacion),
        presentaciones: (detalle.presentaciones || []).map((p) => ({
          ...p,
          precio: (p.precio_centavos / 100).toFixed(2),
        })),
      });
      setModalProductoAbierto(true);
    } catch (e) {
      setError(e.message || "No se pudo cargar el producto.");
    }
  }

  function seleccionarImagen(e) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido.");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      setProducto((actual) => ({
        ...actual,
        imagen_url: String(lector.result),
      }));
      setError("");
    };

    lector.onerror = () => {
      setError("No se pudo leer la imagen seleccionada.");
    };

    lector.readAsDataURL(archivo);
  }

  async function cambiarEstado(id, activo) {
    const confirmar = window.confirm(
      activo
        ? "¿Deseas eliminar este producto del catálogo?"
        : "¿Deseas activar este elemento?",
    );

    if (!confirmar) return;

    await ejecutar(async () => {
      await servicioProductos.cambiarEstado({ id, activo: !activo });
    }, activo
      ? "Producto eliminado del catálogo."
      : "Producto activado correctamente.");
  }

  async function cargarPresentacionesProducto(id) {
    setProductoSeleccionado(String(id));
    const resultado = await servicioProductos.listarPresentaciones(id);
    setPresentacionesProducto(resultado.filter((item) => item.activo));
  }

  async function guardarPresentacion(e) {
    e.preventDefault();

    await ejecutar(async () => {
      if (!productoSeleccionado) {
        throw new Error("Selecciona un producto.");
      }

      const datos = {
        ...presentacion,
        producto_id: Number(productoSeleccionado),
        precio_centavos: precioEnCentavos(presentacion.precio),
      };

      if (presentacion.id) {
        await servicioProductos.actualizarPresentacion(datos);
      } else {
        await servicioProductos.crearPresentacion(datos);
      }

      setPresentacion({ nombre: "", precio: "" });
      setModalPresentacionAbierto(false);
      await cargarPresentacionesProducto(productoSeleccionado);
    }, presentacion.id
      ? "Presentación actualizada correctamente."
      : "Presentación agregada correctamente.");
  }

  function editarPresentacion(presentacionSeleccionada) {
    limpiarMensajes();
    setPresentacion({
      id: presentacionSeleccionada.id,
      nombre: presentacionSeleccionada.nombre,
      precio: (presentacionSeleccionada.precio_centavos / 100).toFixed(2),
    });
    setModalPresentacionAbierto(true);
  }

  async function eliminarPresentacion(presentacionSeleccionada) {
    if (!window.confirm("¿Deseas eliminar esta presentación?")) {
      return;
    }

    await ejecutar(async () => {
      await servicioProductos.cambiarEstadoPresentacion({
        id: presentacionSeleccionada.id,
        producto_id: Number(productoSeleccionado),
        activo: false,
      });
      await cargarPresentacionesProducto(productoSeleccionado);
    }, "Presentación eliminada.");
  }

  async function guardarAsignacion(e) {
    e.preventDefault();

    await ejecutar(async () => {
      if (!productoSeleccionado) {
        throw new Error("Selecciona un producto.");
      }

      await servicioProductos.asignarAdicionales({
        producto_id: Number(productoSeleccionado),
        adicionales: adicionalesSeleccionados,
      });
    }, "Adicionales asignados correctamente.");
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  function actualizarPresentacion(indice, campo, valor) {
    setProducto((actual) => ({
      ...actual,
      presentaciones: actual.presentaciones.map((p, i) =>
        i === indice ? { ...p, [campo]: valor } : p,
      ),
    }));
  }

  function agregarFilaPresentacion() {
    setProducto((actual) => ({
      ...actual,
      presentaciones: [...actual.presentaciones, { nombre: "", precio: "" }],
    }));
  }

  function quitarFilaPresentacion(indice) {
    setProducto((actual) => ({
      ...actual,
      presentaciones: actual.presentaciones.filter((_, i) => i !== indice),
    }));
  }

  function cambiarTipoPresentacion(usaTamanos) {
    setProducto((actual) => ({
      ...actual,
      requiere_presentacion: usaTamanos,
      presentaciones: usaTamanos
        ? [
            { nombre: "Chica", precio: "" },
            { nombre: "Mediana", precio: "" },
            { nombre: "Grande", precio: "" },
          ]
        : [{ nombre: "Única", precio: "" }],
    }));
  }

  const inputClase =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  const botonClase =
    "rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

  return (
    <div className="space-y-6 p-5 md:p-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Productos y catálogo
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra el menú, las presentaciones y los precios.
          </p>
        </div>

        <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700">
          {productos.length} productos activos
        </div>
      </header>

      {mensaje && (
        <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <nav className="flex flex-wrap gap-2">
        {[
          ["productos", "Productos"],
          ["categorias", "Categorías"],
          ["adicionales", "Ingredientes adicionales"],
          ["presentaciones", "Presentaciones"],
        ].map(([id, nombre]) => (
          <button
            key={id}
            onClick={() => {
              setPestana(id);
              limpiarMensajes();
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              pestana === id
                ? "bg-violet-600 text-white"
                : "bg-white text-slate-600 hover:bg-violet-50"
            }`}
          >
            {nombre}
          </button>
        ))}
      </nav>

      {cargando && (
        <p className="text-sm text-slate-500">Cargando catálogo...</p>
      )}

      {pestana === "productos" && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap justify-between gap-3">
              <h2 className="text-lg font-semibold">Catálogo actual</h2>

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto..."
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {productosFiltrados.map((p) => (
                <div
                  key={p.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-400">
                      <ImagePlus size={34} strokeWidth={1.5} />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {p.nombre}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {p.categoria_nombre}
                      </p>
                    </div>

                    {esAdministrador && (
                      <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => editarProducto(p.id)}
                          className="rounded-lg p-2 text-violet-600 hover:bg-violet-50"
                          aria-label={`Editar ${p.nombre}`}
                          title="Editar producto"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => cambiarEstado(p.id, true)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label={`Eliminar ${p.nombre}`}
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!productosFiltrados.length && (
                <p className="py-8 text-center text-sm text-slate-500">
                  No hay productos para mostrar.
                </p>
              )}
            </div>
          </section>

          {esAdministrador && (
            <>
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModalProductoAbierto(true);
                }}
                className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-6 text-center transition hover:border-violet-400 hover:bg-violet-50"
              >
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                  <Plus size={28} />
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {producto.id ? "Editar producto" : "Crear producto"}
                </span>
                <span className="mt-1 text-sm text-slate-500">
                  Agrega nombre, precios e imagen
                </span>
              </button>

              {modalProductoAbierto && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      setModalProductoAbierto(false);
                    }
                  }}
                >
                  <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-violet-600">
                          Nuevo artículo
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">
                        {producto.id ? "Editar producto" : "Crear producto"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Completa la información para publicarlo en tu menú.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalProductoAbierto(false)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Cerrar formulario"
                      >
                        <X size={21} />
                      </button>
                    </div>

                    <form onSubmit={guardarProducto} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    className={inputClase}
                    value={producto.nombre}
                    onChange={(e) =>
                      setProducto({ ...producto, nombre: e.target.value })
                    }
                    placeholder="Ej. Pizza Pepperoni"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Categoría
                  </label>
                  <select
                    className={inputClase}
                    value={producto.categoria_id}
                    onChange={(e) =>
                      setProducto({ ...producto, categoria_id: e.target.value })
                    }
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Descripción
                  </label>
                  <textarea
                    className={inputClase}
                    rows="2"
                    value={producto.descripcion}
                    onChange={(e) =>
                      setProducto({ ...producto, descripcion: e.target.value })
                    }
                  />
                </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Imagen del producto
                        </label>
                        <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 p-3 transition hover:border-violet-400 hover:bg-violet-50/50">
                          {producto.imagen_url ? (
                            <img
                              src={producto.imagen_url}
                              alt="Vista previa"
                              className="h-20 w-20 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                              <ImagePlus size={28} />
                            </span>
                          )}
                          <span>
                            <span className="block font-semibold text-slate-700">
                              Seleccionar imagen
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                              JPG, PNG o WEBP · máximo 5 MB
                            </span>
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={seleccionarImagen}
                          />
                        </label>
                        {producto.imagen_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setProducto({
                                ...producto,
                                imagen_url: "",
                              })
                            }
                            className="mt-2 text-xs font-semibold text-red-600"
                          >
                            Quitar imagen
                          </button>
                        )}
                      </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Tipo de producto
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => cambiarTipoPresentacion(true)}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        producto.requiere_presentacion
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Varios tamaños
                    </button>

                    <button
                      type="button"
                      onClick={() => cambiarTipoPresentacion(false)}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        !producto.requiere_presentacion
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Presentación única
                    </button>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Presentaciones y precios</h3>

                    {producto.requiere_presentacion && (
                      <button
                        type="button"
                        onClick={agregarFilaPresentacion}
                        className="text-sm font-semibold text-violet-700"
                      >
                        + Agregar tamaño
                      </button>
                    )}
                  </div>

                  {producto.presentaciones.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={inputClase}
                        placeholder="Nombre"
                        value={p.nombre}
                        onChange={(e) =>
                          actualizarPresentacion(i, "nombre", e.target.value)
                        }
                      />

                      <input
                        className={inputClase}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio $"
                        value={p.precio}
                        onChange={(e) =>
                          actualizarPresentacion(i, "precio", e.target.value)
                        }
                      />

                      {producto.requiere_presentacion &&
                        producto.presentaciones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => quitarFilaPresentacion(i)}
                            className="rounded-lg px-2 text-red-600"
                            aria-label="Quitar presentación"
                          >
                            ×
                          </button>
                        )}
                    </div>
                  ))}
                </div>

                      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                          type="button"
                          onClick={() => setModalProductoAbierto(false)}
                          className="rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button type="submit" className={botonClase}>
                          {producto.id ? "Actualizar producto" : "Guardar producto"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {pestana === "categorias" && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold text-violet-600">Catálogo</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Categorías activas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Organiza tus productos por tipo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {categorias.map((c) => (
                <div
                  key={c.id}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-violet-200 hover:bg-violet-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{c.nombre}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {c.descripcion || "Sin descripción"}
                      </p>
                    </div>
                    {esAdministrador && (
                      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => editarCategoria(c)}
                          className="rounded-lg p-2 text-violet-600 hover:bg-violet-100"
                          aria-label={`Editar ${c.nombre}`}
                          title="Editar categoría"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => eliminarCategoria(c.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                          aria-label={`Eliminar ${c.nombre}`}
                          title="Eliminar categoría"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {esAdministrador && (
            <>
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setCategoria({ nombre: "", descripcion: "" });
                  setModalCategoriaAbierto(true);
                }}
                className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-6 text-center transition hover:border-violet-400 hover:bg-violet-50"
              >
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                  <Plus size={28} />
                </span>
                <span className="text-lg font-bold text-slate-800">
                  Nueva categoría
                </span>
                <span className="mt-1 text-sm text-slate-500">
                  Crea una sección para tu menú
                </span>
              </button>

              {modalCategoriaAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                  <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-violet-600">
                          Organización del menú
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">
                          {categoria.id ? "Editar categoría" : "Nueva categoría"}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalCategoriaAbierto(false)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                        aria-label="Cerrar formulario"
                      >
                        <X size={21} />
                      </button>
                    </div>
                    <form onSubmit={guardarCategoria} className="space-y-4">
                      <input
                        className={inputClase}
                        placeholder="Nombre de categoría"
                        value={categoria.nombre}
                        onChange={(e) =>
                          setCategoria({ ...categoria, nombre: e.target.value })
                        }
                      />
                      <textarea
                        className={inputClase}
                        rows="3"
                        placeholder="Descripción opcional"
                        value={categoria.descripcion}
                        onChange={(e) =>
                          setCategoria({
                            ...categoria,
                            descripcion: e.target.value,
                          })
                        }
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setModalCategoriaAbierto(false)}
                          className="rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button className={botonClase}>
                          {categoria.id ? "Actualizar categoría" : "Guardar categoría"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {pestana === "adicionales" && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold text-violet-600">Personaliza</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Ingredientes adicionales
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Extras que tus clientes pueden agregar a sus pedidos.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {adicionales.map((a) => (
                <div
                  key={a.id}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-violet-200 hover:bg-violet-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{a.nombre}</p>
                      <p className="mt-1 text-lg font-bold text-violet-700">
                        {dinero(a.precio_centavos)}
                      </p>
                      {a.descripcion && (
                        <p className="mt-1 text-xs text-slate-500">
                          {a.descripcion}
                        </p>
                      )}
                    </div>
                    {esAdministrador && (
                      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => editarAdicional(a)}
                          className="rounded-lg p-2 text-violet-600 hover:bg-violet-100"
                          aria-label={`Editar ${a.nombre}`}
                          title="Editar ingrediente"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => eliminarAdicional(a.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                          aria-label={`Eliminar ${a.nombre}`}
                          title="Eliminar ingrediente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {esAdministrador && (
            <>
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setAdicional({ nombre: "", descripcion: "", precio: "" });
                  setModalAdicionalAbierto(true);
                }}
                className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-6 text-center transition hover:border-violet-400 hover:bg-violet-50"
              >
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                  <Plus size={28} />
                </span>
                <span className="text-lg font-bold text-slate-800">
                  Nuevo ingrediente
                </span>
                <span className="mt-1 text-sm text-slate-500">
                  Define su nombre y precio
                </span>
              </button>

              {modalAdicionalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                  <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-violet-600">
                          Personalización
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">
                          {adicional.id
                            ? "Editar ingrediente"
                            : "Nuevo ingrediente"}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalAdicionalAbierto(false)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                        aria-label="Cerrar formulario"
                      >
                        <X size={21} />
                      </button>
                    </div>
                    <form onSubmit={guardarAdicional} className="space-y-4">
                      <input
                        className={inputClase}
                        placeholder="Ej. Queso extra"
                        value={adicional.nombre}
                        onChange={(e) =>
                          setAdicional({ ...adicional, nombre: e.target.value })
                        }
                      />
                      <textarea
                        className={inputClase}
                        rows="3"
                        placeholder="Descripción opcional"
                        value={adicional.descripcion}
                        onChange={(e) =>
                          setAdicional({
                            ...adicional,
                            descripcion: e.target.value,
                          })
                        }
                      />
                      <input
                        className={inputClase}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio en pesos"
                        value={adicional.precio}
                        onChange={(e) =>
                          setAdicional({ ...adicional, precio: e.target.value })
                        }
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setModalAdicionalAbierto(false)}
                          className="rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button className={botonClase}>
                          {adicional.id
                            ? "Actualizar ingrediente"
                            : "Guardar ingrediente"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {pestana === "presentaciones" && esAdministrador && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold text-violet-600">Precios</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Presentaciones
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Selecciona un producto para administrar sus tamaños y precios.
              </p>
            </div>

            <select
              className={inputClase}
              value={productoSeleccionado}
              onChange={(e) => {
                if (e.target.value) {
                  cargarPresentacionesProducto(e.target.value).catch((e) =>
                    setError(e.message),
                  );
                } else {
                  setProductoSeleccionado("");
                  setPresentacionesProducto([]);
                }
              }}
            >
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <div className="mt-4 space-y-3">
              {presentacionesProducto.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{p.nombre}</p>
                    <p className="mt-1 font-bold text-violet-700">
                      {dinero(p.precio_centavos)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => editarPresentacion(p)}
                      className="rounded-lg p-2 text-violet-600 hover:bg-violet-100"
                      aria-label={`Editar ${p.nombre}`}
                      title="Editar presentación"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => eliminarPresentacion(p)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                      aria-label={`Eliminar ${p.nombre}`}
                      title="Eliminar presentación"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {productoSeleccionado && !presentacionesProducto.length && (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Este producto todavía no tiene presentaciones.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                limpiarMensajes();
                setPresentacion({ nombre: "", precio: "" });
                setModalPresentacionAbierto(true);
              }}
              disabled={!productoSeleccionado}
              className={`${botonClase} mt-5 inline-flex items-center gap-2`}
            >
              <Plus size={18} />
              Nueva presentación
            </button>

            {modalPresentacionAbierto && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-violet-600">
                        Precios del producto
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-900">
                        {presentacion.id
                          ? "Editar presentación"
                          : "Nueva presentación"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalPresentacionAbierto(false)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                      aria-label="Cerrar formulario"
                    >
                      <X size={21} />
                    </button>
                  </div>
                  <form onSubmit={guardarPresentacion} className="space-y-4">
                    <input
                      className={inputClase}
                      placeholder="Ej. Familiar"
                      value={presentacion.nombre}
                      onChange={(e) =>
                        setPresentacion({
                          ...presentacion,
                          nombre: e.target.value,
                        })
                      }
                    />
                    <input
                      className={inputClase}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Precio en pesos"
                      value={presentacion.precio}
                      onChange={(e) =>
                        setPresentacion({
                          ...presentacion,
                          precio: e.target.value,
                        })
                      }
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setModalPresentacionAbierto(false)}
                        className="rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                      <button className={botonClase}>
                        {presentacion.id
                          ? "Actualizar presentación"
                          : "Guardar presentación"}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">
              Asignar ingredientes a un producto
            </h2>

            <form onSubmit={guardarAsignacion} className="space-y-3">
              <select
                className={inputClase}
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              <div className="space-y-2">
                {adicionales.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={adicionalesSeleccionados.includes(a.id)}
                      onChange={(e) => {
                        setAdicionalesSeleccionados((actual) =>
                          e.target.checked
                            ? [...actual, a.id]
                            : actual.filter((id) => id !== a.id),
                        );
                      }}
                    />
                    <span className="flex-1">{a.nombre}</span>
                    <span className="text-sm text-slate-500">
                      {dinero(a.precio_centavos)}
                    </span>
                  </label>
                ))}
              </div>

              <button className={botonClase}>Guardar asignaciones</button>
            </form>
          </section>
        </div>
      )}

      {pestana === "presentaciones" && !esAdministrador && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Solo el administrador puede gestionar presentaciones y precios.
        </div>
      )}
    </div>
  );
}
