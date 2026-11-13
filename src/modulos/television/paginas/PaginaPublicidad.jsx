import { useEffect, useState } from "react";
import {
  Image,
  Cable,
  MonitorPlay,
  Power,
  PowerOff,
  RefreshCw,
  Trash2,
  UploadCloud,
  Video,
  Wifi,
} from "lucide-react";
import { useEstadoTV } from "../estado/EstadoTV";
import { servicioTelevision } from "../servicios/television";

export default function PaginaPublicidad() {
  const publicidad = useEstadoTV((estado) => estado.publicidad);
  const cargarPublicidad = useEstadoTV((estado) => estado.cargarPublicidad);
  const agregarPublicidad = useEstadoTV((estado) => estado.agregarPublicidad);
  const cambiarEstadoPublicidad = useEstadoTV(
    (estado) => estado.cambiarEstadoPublicidad,
  );
  const eliminarPublicidad = useEstadoTV((estado) => estado.eliminarPublicidad);

  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState(10);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [pantallas, setPantallas] = useState([]);
  const [pantallaSeleccionada, setPantallaSeleccionada] = useState("");
  const [buscandoPantallas, setBuscandoPantallas] = useState(false);
  const [proyectando, setProyectando] = useState(false);

  const buscarPantallas = async () => {
    setBuscandoPantallas(true);

    try {
      const resultado = await servicioTelevision.listarPantallas();
      const detectadas = Array.isArray(resultado) ? resultado : [];
      setPantallas(detectadas);
      const externa = detectadas.find((pantalla) => !pantalla.principal);
      setPantallaSeleccionada(externa?.id || detectadas[0]?.id || "");
    } catch (error) {
      setError(error.message || "No se pudieron detectar las pantallas.");
    } finally {
      setBuscandoPantallas(false);
    }
  };

  const proyectarPantalla = async () => {
    if (!pantallaSeleccionada) {
      setError("Primero conecta o selecciona una pantalla.");
      return;
    }

    setProyectando(true);
    setError("");

    try {
      await servicioTelevision.abrirVentanaTV(pantallaSeleccionada);
    } catch (error) {
      setError(error.message || "No se pudo abrir la pantalla TV.");
    } finally {
      setProyectando(false);
    }
  };

  useEffect(() => {
    cargarPublicidad();
  }, [cargarPublicidad]);

  useEffect(() => {
    let montado = true;

    servicioTelevision
      .listarPantallas()
      .then((resultado) => {
        if (!montado) return;

        const detectadas = Array.isArray(resultado) ? resultado : [];
        setPantallas(detectadas);
        const externa = detectadas.find((pantalla) => !pantalla.principal);
        setPantallaSeleccionada(externa?.id || detectadas[0]?.id || "");
      })
      .catch(() => {
        if (montado) setError("No se pudieron detectar las pantallas.");
      });

    return () => {
      montado = false;
    };
  }, []);

  const seleccionarArchivo = (evento) => {
    const seleccionado = evento.target.files?.[0];

    if (!seleccionado) return;

    const extension = seleccionado.name.split(".").pop().toLowerCase();

    const tipo = ["mp4", "webm", "mov"].includes(extension)
      ? "video"
      : ["jpg", "jpeg", "png", "webp"].includes(extension)
        ? "imagen"
        : null;

    if (!tipo) {
      setError("Selecciona una imagen o video compatible.");
      setArchivo(null);
      return;
    }

    setError("");
    setArchivo({
      nombre: seleccionado.name,
      tipo,
      archivo: seleccionado,
    });
  };

  const guardar = async (evento) => {
    evento.preventDefault();

    if (!nombre.trim() || !archivo) {
      setError("Escribe un nombre y selecciona un archivo.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const datos = await archivo.archivo.arrayBuffer();
      const importado = await window.sistema.television.importarArchivo({
        nombre: archivo.nombre,
        datos,
      });

      await agregarPublicidad({
        nombre: nombre.trim(),
        ruta: importado.ruta,
        tipo: archivo.tipo,
        duracion_segundos: Number(duracion),
        orden: publicidad.length + 1,
        activo: 1,
      });

      setNombre("");
      setDuracion(10);
      setArchivo(null);

      evento.target.reset();
    } catch (error) {
      setError(error.message || "No se pudo guardar la publicidad.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (elemento) => {
    if (!window.confirm(`¿Eliminar "${elemento.nombre}"?`)) return;

    try {
      await eliminarPublicidad(elemento.id);
    } catch (error) {
      setError(error.message || "No se pudo eliminar el anuncio.");
    }
  };

  const cambiarActivo = async (elemento) => {
    try {
      await cambiarEstadoPublicidad(elemento.id, !elemento.activo);
    } catch (error) {
      setError(error.message || "No se pudo actualizar el anuncio.");
    }
  };

  return (
    <main className="space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <MonitorPlay size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Publicidad de televisión
              </h1>
              <p className="text-sm text-slate-500">
                Diseña lo que tus clientes verán mientras esperan su pedido.
              </p>
            </div>
          </div>
        </div>
        <span className="hidden rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 sm:inline-flex">
          {publicidad.filter((elemento) => elemento.activo).length} activos
        </span>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MonitorPlay size={20} className="text-sky-600" />
              Mostrar la TV en otra pantalla
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              La aplicación abrirá la pantalla TV completa en el monitor que elijas.
            </p>
            <p className="mt-2 text-xs font-medium text-amber-700">
              Si la TV permanece azul, cambia su entrada a HDMI y verifica que Windows
              esté usando “Extender estas pantallas”.
            </p>
          </div>
          <button
            type="button"
            onClick={buscarPantallas}
            disabled={buscandoPantallas}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={buscandoPantallas ? "animate-spin" : ""} />
            Buscar pantallas
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              <Cable size={17} className="text-sky-600" />
              Opción 1: HDMI
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Conecta el cable HDMI. Windows la detectará automáticamente.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              <Wifi size={17} className="text-emerald-600" />
              Opción 2: inalámbrica
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Presiona <strong>Win + K</strong>, conecta la TV y luego pulsa
              “Buscar pantallas”.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            value={pantallaSeleccionada}
            onChange={(evento) => setPantallaSeleccionada(evento.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500"
          >
            <option value="">3. Selecciona dónde mostrar la TV</option>
            {pantallas.map((pantalla) => (
              <option key={pantalla.id} value={pantalla.id}>
                {pantalla.nombre} ({pantalla.ancho} x {pantalla.alto})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={proyectarPantalla}
            disabled={proyectando || !pantallaSeleccionada}
            className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {proyectando ? "Abriendo TV..." : "4. Mostrar pantalla TV"}
          </button>
        </div>

        {pantallas.length <= 1 && (
          <p className="mt-3 text-xs text-amber-700">
            No se detecta una pantalla externa. Conecta HDMI o completa la conexión inalámbrica
            de Windows y vuelve a buscar.
          </p>
        )}
      </section>

      <form
        onSubmit={guardar}
        className="grid gap-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/60 p-5 shadow-sm md:grid-cols-2"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Nombre de la publicidad
          </label>

          <input
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Ej. Promoción familiar"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Duración de imagen (segundos)
          </label>

          <input
            type="number"
            min="3"
            max="300"
            value={duracion}
            onChange={(evento) => setDuracion(evento.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Archivo multimedia
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-violet-300 bg-white px-4 py-4 text-sm text-violet-700 transition hover:bg-violet-50">
            <UploadCloud size={20} />
            <span className="min-w-0 flex-1 truncate">
              {archivo ? archivo.nombre : "Selecciona una imagen o video"}
            </span>
            <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={seleccionarArchivo}
            className="sr-only"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-50 md:col-span-2"
        >
          {guardando ? "Guardando..." : "Agregar publicidad"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">
          Contenido registrado ({publicidad.length})
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {publicidad.map((elemento) => (
          <article
            key={elemento.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
          <div className="flex h-36 items-center justify-center bg-slate-900">
            {elemento.tipo === "video" ? (
              <video src={elemento.ruta} muted className="h-full w-full object-cover" />
            ) : (
              <img src={elemento.ruta} alt="" className="h-full w-full object-cover" />
            )}
            </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{elemento.nombre}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  {elemento.tipo === "video" ? <Video size={13} /> : <Image size={13} />}
                  {elemento.tipo} · {elemento.duracion_segundos || 10}s
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                elemento.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}>
                {elemento.activo ? "Activo" : "Pausado"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cambiarActivo(elemento)}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
              {elemento.activo ? <PowerOff size={14} /> : <Power size={14} />}
              {elemento.activo ? "Pausar" : "Activar"}
              </button>

              <button
                type="button"
                onClick={() => eliminar(elemento)}
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
              <Trash2 size={14} />
                Eliminar
              </button>
            </div>
            </div>
          </article>
        ))}
        </div>

        {publicidad.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Todavía no has agregado publicidad.
          </p>
        )}
      </section>
    </main>
  );
}
