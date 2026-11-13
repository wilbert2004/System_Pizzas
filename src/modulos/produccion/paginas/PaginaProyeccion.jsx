import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChefHat, Clock3, MonitorX, RefreshCw, Volume2, VolumeX } from "lucide-react";

const ESTADOS_EN_PANTALLA = ["Nuevo", "Preparando", "En horno"];
const ESTADOS_CON_AVISO = [...ESTADOS_EN_PANTALLA, "Listo"];

function leerTemporizadores() {
  try { return JSON.parse(localStorage.getItem("cocina-temporizadores") || "{}"); }
  catch { return {}; }
}

function mostrarTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;
}

function calcularReloj(pedido, temporizadores, ahora) {
  if (pedido.estado === "Nuevo") return { texto: "EN COLA", estado: "nuevo", progreso: 0 };
  const timer = temporizadores[pedido.id];
  const enHorno = pedido.estado === "En horno";
  const inicio = enHorno
    ? timer?.iniciadoEn || pedido.fecha_entrada_horno
    : pedido.fecha_inicio_preparacion;
  const minutos = Number((enHorno ? timer?.minutos : null) || pedido.tiempo_estimado_minutos || 0);
  const inicioMs = inicio ? new Date(inicio).getTime() : NaN;
  if (!Number.isFinite(inicioMs) || minutos <= 0) return { texto: "SIN ESTIMADO", estado: "sin-estimado", progreso: 0 };

  const totalSegundos = minutos * 60;
  const restante = Math.ceil((inicioMs + totalSegundos * 1000 - ahora) / 1000);
  const progreso = Math.min(100, Math.max(0, ((totalSegundos - restante) / totalSegundos) * 100));
  if (restante < 0) return { texto: `+${mostrarTiempo(Math.abs(restante))}`, estado: "retrasado", progreso };
  if (restante <= 120) return { texto: mostrarTiempo(restante), estado: "por-terminar", progreso };
  return { texto: mostrarTiempo(restante), estado: "a-tiempo", progreso };
}

function TarjetaProduccion({ pedido, reloj }) {
  const tono = {
    nuevo: "border-slate-700 bg-slate-900 text-slate-300",
    "sin-estimado": "border-slate-700 bg-slate-900 text-slate-300",
    "a-tiempo": "border-emerald-400/30 bg-emerald-950/40 text-emerald-300",
    "por-terminar": "border-amber-400/40 bg-amber-950/50 text-amber-200",
    retrasado: "border-red-400/50 bg-red-950/60 text-red-200",
  }[reloj.estado];

  return (
    <article className={`flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border p-3 shadow-xl sm:p-4 ${tono}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">{pedido.estado}</p>
          <h2 className="mt-2 truncate text-xl font-black text-white sm:text-2xl">{pedido.folio || `Pedido #${pedido.id}`}</h2>
          <p className="mt-1 truncate text-sm text-white/65">{pedido.cliente_nombre || "Pedido de mostrador"}</p>
        </div>
        <span className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/80">{pedido.tipo === "domicilio" ? "DOMICILIO" : "RECOGER"}</span>
      </div>
      {pedido.detalles?.length > 0 && <ul className="mt-2 space-y-0.5 border-t border-white/10 pt-2 text-xs text-white/80">{pedido.detalles.slice(0, 2).map((detalle, indice) => <li key={detalle.id || indice} className="truncate"><strong>{detalle.cantidad}×</strong> {detalle.nombre_producto || detalle.producto}{detalle.nombre_presentacion || detalle.presentacion ? ` · ${detalle.nombre_presentacion || detalle.presentacion}` : ""}</li>)}{pedido.detalles.length > 2 && <li className="text-[10px] text-white/45">+{pedido.detalles.length - 2} productos más</li>}</ul>}
      <div className="mt-auto border-t border-white/10 pt-3">
        <div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] opacity-70 sm:text-[10px]"><Clock3 size={13} />{reloj.estado === "retrasado" ? "Tiempo excedido" : reloj.estado === "nuevo" ? "Siguiente pedido" : "Tiempo restante"}</p><span className="text-[10px] font-bold tabular-nums text-white/55">{reloj.estado === "nuevo" || reloj.estado === "sin-estimado" ? "" : `${Math.round(reloj.progreso)}%`}</span></div>
        {reloj.estado !== "nuevo" && reloj.estado !== "sin-estimado" && <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Tiempo transcurrido" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(reloj.progreso)}><div className={`h-full rounded-full transition-[width] duration-1000 ${reloj.estado === "retrasado" ? "bg-red-400" : reloj.estado === "por-terminar" ? "bg-amber-300" : "bg-emerald-300"}`} style={{ width: `${reloj.progreso}%` }} /></div>}
        <p className="mt-2 font-mono text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">{reloj.texto}</p>
      </div>
    </article>
  );
}

export default function PaginaProyeccionProduccion() {
  const [pedidos, setPedidos] = useState([]);
  const [ahora, setAhora] = useState(Date.now());
  const [actualizando, setActualizando] = useState(true);
  const [error, setError] = useState("");
  const [vozActiva, setVozActiva] = useState(() => localStorage.getItem("produccion-voz-activa") !== "false");
  const [dimensiones, setDimensiones] = useState({ ancho: window.innerWidth, alto: window.innerHeight });
  const [pagina, setPagina] = useState(0);
  const estadosAnteriores = useRef(null);
  const retrasosAnteriores = useRef(new Set());

  const cargar = useCallback(async () => {
    setError("");
    try {
      const resultado = await window.sistema.pedidos.listar({ limite: 200 });
      const activos = Array.isArray(resultado) ? resultado.filter((pedido) => ESTADOS_CON_AVISO.includes(pedido.estado)) : [];
      const pedidosConDetalle = await Promise.all(activos.map(async (pedido) => {
        try { return await window.sistema.pedidos.obtener(pedido.id) || pedido; }
        catch { return pedido; }
      }));
      setPedidos(pedidosConDetalle);
    } catch (e) {
      setError(e.message || "No se pudieron actualizar los pedidos de producción.");
    } finally {
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const consulta = setInterval(() => void cargar(), 5000);
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    return () => { clearInterval(consulta); clearInterval(reloj); };
  }, [cargar]);

  const temporizadores = leerTemporizadores();
  const pedidosOrdenados = useMemo(() => pedidos.filter((pedido) => ESTADOS_EN_PANTALLA.includes(pedido.estado)).sort((a, b) => new Date(a.fecha_creacion || 0) - new Date(b.fecha_creacion || 0)), [pedidos]);
  const retrasados = pedidosOrdenados.filter((pedido) => calcularReloj(pedido, temporizadores, ahora).estado === "retrasado").length;

  useEffect(() => {
    if (actualizando) return;
    const actuales = new Map(pedidos.map((pedido) => [pedido.id, pedido.estado]));
    const retrasosActuales = new Set(pedidosOrdenados
      .filter((pedido) => calcularReloj(pedido, temporizadores, ahora).estado === "retrasado")
      .map((pedido) => pedido.id));
    if (!estadosAnteriores.current) {
      estadosAnteriores.current = actuales;
      retrasosAnteriores.current = retrasosActuales;
      return;
    }

    const frases = [];
    for (const pedido of pedidos) {
      const estadoAnterior = estadosAnteriores.current.get(pedido.id);
      if (vozActiva && !estadosAnteriores.current.has(pedido.id) && pedido.estado === "Nuevo") {
        frases.push(`Nuevo pedido ${pedido.folio || pedido.id}.`);
      } else if (vozActiva && pedido.estado === "Listo" && estadoAnterior && estadoAnterior !== "Listo") {
        frases.push(`Pedido ${pedido.folio || pedido.id}, listo.`);
      }
    }
    if (vozActiva) {
      for (const pedido of pedidosOrdenados) {
        if (retrasosActuales.has(pedido.id) && !retrasosAnteriores.current.has(pedido.id)) {
          frases.push(`Atención. Pedido ${pedido.folio || pedido.id} superó su tiempo estimado.`);
        }
      }
    }
    estadosAnteriores.current = actuales;
    retrasosAnteriores.current = retrasosActuales;

    if (frases.length && window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const voz = new window.SpeechSynthesisUtterance(frases.join(" "));
      voz.lang = "es-MX";
      voz.rate = 0.95;
      voz.volume = 0.85;
      const voces = window.speechSynthesis.getVoices();
      voz.voice = voces.find((opcion) => opcion.lang?.toLowerCase() === "es-mx")
        || voces.find((opcion) => opcion.lang?.toLowerCase().startsWith("es"))
        || null;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(voz);
    }
  }, [pedidos, pedidosOrdenados, temporizadores, ahora, vozActiva, actualizando]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    const medir = () => setDimensiones({ ancho: window.innerWidth, alto: window.innerHeight });
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  const maxColumnas = Math.max(1, Math.floor((dimensiones.ancho - 64) / 500));
  const columnas = Math.min(maxColumnas, Math.max(1, Math.min(pedidosOrdenados.length, 4)));
  const altoFila = Math.max(270, Math.min(340, Math.round(dimensiones.alto * 0.31)));
  const filas = Math.max(1, Math.min(3, Math.floor((dimensiones.alto - 190) / altoFila)));
  const pedidosPorPagina = columnas * filas;
  const paginas = Math.max(1, Math.ceil(pedidosOrdenados.length / pedidosPorPagina));
  const pedidosVisibles = pedidosOrdenados.slice(pagina * pedidosPorPagina, (pagina + 1) * pedidosPorPagina);

  useEffect(() => { setPagina(0); }, [pedidosPorPagina, pedidosOrdenados.length]);
  useEffect(() => {
    if (paginas < 2) return undefined;
    const timer = setInterval(() => setPagina((actual) => (actual + 1) % paginas), 10000);
    return () => clearInterval(timer);
  }, [paginas]);

  const cambiarVoz = () => {
    const nuevoEstado = !vozActiva;
    setVozActiva(nuevoEstado);
    localStorage.setItem("produccion-voz-activa", String(nuevoEstado));
    if (!nuevoEstado) window.speechSynthesis?.cancel();
    else if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const prueba = new window.SpeechSynthesisUtterance("Avisos de producción activados");
      prueba.lang = "es-MX";
      window.speechSynthesis.speak(prueba);
    }
  };

  return (
    <main className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#080b12] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#101522] px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300"><ChefHat size={25} /></span><div className="min-w-0"><h1 className="truncate text-xl font-black sm:text-2xl">Producción en cocina</h1><p className="mt-0.5 text-xs text-white/50 sm:text-sm">Pedidos activos y cuenta regresiva · Actualiza cada 5 segundos</p></div></div>
        <div className="flex items-center gap-2"><span className={`rounded-full px-3 py-2 text-xs font-bold ${retrasados ? "bg-red-400/15 text-red-200" : "bg-emerald-400/10 text-emerald-200"}`}>{retrasados ? `${retrasados} con retraso` : "Todo al día"}</span><button type="button" onClick={cambiarVoz} aria-pressed={vozActiva} aria-label={vozActiva ? "Desactivar avisos de voz" : "Activar avisos de voz"} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${vozActiva ? "border-sky-300/20 bg-sky-300/10 text-sky-200" : "border-white/10 text-white/50"}`}>{vozActiva ? <Volume2 size={17} /> : <VolumeX size={17} />}Voz {vozActiva ? "activa" : "silenciada"}</button><button type="button" onClick={() => void cargar()} aria-label="Actualizar pedidos" className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:bg-white/10"><RefreshCw size={17} className={actualizando ? "animate-spin" : ""} /></button><button type="button" onClick={() => window.sistema.television.cerrarProduccion()} aria-label="Cerrar proyección" className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:bg-white/10"><MonitorX size={17} /></button></div>
      </header>
      {error && <p role="alert" className="shrink-0 bg-red-950 px-5 py-2 text-center text-sm text-red-200">{error}</p>}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-5 lg:p-6">
        {pedidosOrdenados.length ? <div className="grid min-h-0 flex-1 content-start justify-center gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 520px))`, gridAutoRows: "minmax(250px, 31vh)" }}>{pedidosVisibles.map((pedido) => <TarjetaProduccion key={pedido.id} pedido={pedido} reloj={calcularReloj(pedido, temporizadores, ahora)} />)}</div> : <div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.04] text-white/30"><ChefHat size={38} /></span><h2 className="mt-5 text-2xl font-black">{actualizando ? "Cargando producción…" : "Cocina lista para recibir pedidos"}</h2><p className="mt-2 max-w-md text-sm text-white/50">Al iniciar la preparación, los pedidos y sus tiempos aparecerán aquí automáticamente.</p></div>}
      </section>
      <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-[#101522] px-5 py-2.5 text-center text-xs font-semibold tracking-wide text-white/40">{paginas > 1 && <span className="text-orange-200">Vista {pagina + 1} de {paginas} · cambio automático</span>}<span>Mantén el ritmo · Un pedido a la vez, recién hecho</span></footer>
    </main>
  );
}
