import { useEffect, useState } from "react";
import {
  Image,
  Cable,
  Music2,
  MonitorPlay,
  Power,
  PowerOff,
  RefreshCw,
  Trash2,
  UploadCloud,
  Video,
  Volume2,
  Wifi,
} from "lucide-react";
import { useEstadoTV } from "../estado/EstadoTV";
import { servicioTelevision } from "../servicios/television";
import { useEstadoAutenticacion } from "../../autenticacion/estado/EstadoAutenticacion.js";

export default function PaginaPublicidad() {
  const esAdministrador = useEstadoAutenticacion((estado) => estado.usuario?.rol === "administrador");
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
  const [pendienteEliminar, setPendienteEliminar] = useState(null);
  const [musica, setMusica] = useState(null);
  const [guardandoMusica, setGuardandoMusica] = useState(false);
  const [volumenMusica, setVolumenMusica] = useState(35);
  const [volumenGuardado, setVolumenGuardado] = useState(35);
  const [guardandoVolumen, setGuardandoVolumen] = useState(false);
  const [avisoMusica, setAvisoMusica] = useState("");

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
    servicioTelevision.obtenerMusica().then((datos) => {
      setMusica(datos);
      setVolumenMusica(datos?.volumen ?? 35);
      setVolumenGuardado(datos?.volumen ?? 35);
    }).catch(() => {});
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
    try {
      await eliminarPublicidad(elemento.id);
      setPendienteEliminar(null);
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

  const agregarMusica = async (evento) => {
    const seleccion = evento.target.files?.[0];
    if (!seleccion) return;
    const extension = seleccion.name.split(".").pop().toLowerCase();
    if (!["mp3", "wav", "ogg", "m4a"].includes(extension)) {
      setError("Elige un archivo MP3, WAV, OGG o M4A.");
      evento.target.value = "";
      return;
    }
    if (seleccion.size > 40 * 1024 * 1024) {
      setError("La música no puede superar 40 MB.");
      evento.target.value = "";
      return;
    }
    setGuardandoMusica(true);
    setError("");
    try {
      const datos = await seleccion.arrayBuffer();
      const pista = await servicioTelevision.guardarMusica({ nombre: seleccion.name, datos });
      setMusica(pista);
      setVolumenMusica(pista.volumen ?? volumenMusica);
      setVolumenGuardado(pista.volumen ?? volumenMusica);
    } catch (error) {
      setError(error.message || "No se pudo guardar la música.");
    } finally {
      setGuardandoMusica(false);
      evento.target.value = "";
    }
  };

  const quitarMusica = async () => {
    setGuardandoMusica(true);
    setError("");
    try {
      await servicioTelevision.quitarMusica();
      setMusica(await servicioTelevision.obtenerMusica());
    } catch (error) {
      setError(error.message || "No se pudo quitar la música.");
    } finally {
      setGuardandoMusica(false);
    }
  };

  const guardarVolumen = async () => {
    setGuardandoVolumen(true);
    setError("");
    setAvisoMusica("");
    try {
      const actualizado = await servicioTelevision.guardarVolumenMusica(volumenMusica);
      setMusica(actualizado);
      setVolumenGuardado(actualizado.volumen);
      setAvisoMusica("Volumen guardado. Se aplicará en la TV de promociones.");
    } catch (error) {
      setError(error.message || "No se pudo guardar el volumen.");
    } finally {
      setGuardandoVolumen(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <MonitorPlay size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Publicidad de televisión
              </h1>
              <p className="text-sm text-slate-500">
                Diseña lo que tus clientes verán mientras esperan su pedido.
              </p>
            </div>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-violet-100 bg-white px-3.5 py-2 text-xs font-bold text-violet-700 shadow-sm sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {publicidad.filter((elemento) => elemento.activo).length} activos
        </span>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><Music2 size={21} /></span>
            <div className="min-w-0"><h2 className="font-bold text-slate-900">Música ambiental</h2><p className="mt-0.5 text-sm text-slate-600">{musica?.ruta ? `${musica.nombre} · se reproduce en ciclo en la TV` : "Agrega una pista para acompañar las promociones."}</p></div>
          </div>
          {esAdministrador && <div className="flex shrink-0 items-center gap-2">
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-800 ${guardandoMusica ? "pointer-events-none opacity-60" : ""}`}>
              <UploadCloud size={16} /> {guardandoMusica ? "Guardando…" : musica?.ruta ? "Cambiar música" : "Agregar música"}
              <input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a" onChange={agregarMusica} className="sr-only" disabled={guardandoMusica} />
            </label>
            {musica?.ruta && <button type="button" onClick={quitarMusica} disabled={guardandoMusica} className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-amber-50 disabled:opacity-50">Quitar</button>}
          </div>}
        </div>
        {esAdministrador && <div className="mt-5 grid gap-3 rounded-xl border border-amber-100 bg-white/70 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="block min-w-0" htmlFor="volumen-musica-tv"><span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><Volume2 size={16} className="text-amber-700" />Volumen de la música en la TV</span><span className="font-mono tabular-nums text-amber-800">{volumenMusica}%</span></span><input id="volumen-musica-tv" type="range" min="0" max="100" step="5" value={volumenMusica} onChange={(evento) => setVolumenMusica(Number(evento.target.value))} className="mt-3 w-full accent-amber-700" /><span className="mt-1 flex justify-between text-[10px] text-slate-400"><span>Silencio</span><span>Máximo</span></span></label>
          <button type="button" onClick={guardarVolumen} disabled={guardandoVolumen || volumenMusica === volumenGuardado} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45">{guardandoVolumen ? "Guardando…" : "Guardar volumen"}</button>
          {avisoMusica && <p role="status" className="text-xs font-medium text-emerald-700 sm:col-span-2">{avisoMusica}</p>}
        </div>}
      </section>

      <section className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-sm sm:p-6">
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
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              <Cable size={17} className="text-sky-600" />
              Opción 1: HDMI
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Conecta el cable HDMI. Windows la detectará automáticamente.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
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
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
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
            className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-sky-900/10 transition hover:-translate-y-0.5 hover:from-sky-700 hover:to-blue-700 disabled:translate-y-0 disabled:opacity-50"
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
        className="grid gap-4 rounded-2xl border border-violet-100/80 bg-gradient-to-br from-white via-white to-violet-50/60 p-5 shadow-sm sm:p-6 md:grid-cols-2"
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

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-violet-300 bg-white px-4 py-4 text-sm font-medium text-violet-700 transition hover:border-violet-500 hover:bg-violet-50">
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
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
          <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#11131c]">
            {elemento.tipo === "video" ? (
              <video src={elemento.ruta} muted className="h-full w-full object-contain" />
            ) : (
              <img src={elemento.ruta} alt="" className="h-full w-full object-contain" />
            )}
            </div>
          <div className="space-y-3 p-5">
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
                onClick={() => setPendienteEliminar(elemento)}
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
      {pendienteEliminar && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Eliminar publicidad</h2><p className="mt-2 text-sm text-slate-600">¿Deseas eliminar “{pendienteEliminar.nombre}” de la pantalla de TV?</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPendienteEliminar(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button><button type="button" onClick={() => eliminar(pendienteEliminar)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Eliminar</button></div></section></div>}
    </div>
  );
}
