import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChefHat, Clock3, MonitorX, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { calcularTiemposPedido, formatearCuenta } from "../../cocina/servicios/tiemposPedido";

const ESTADOS_EN_PANTALLA = ["Nuevo", "Preparando", "En horno", "Listo"];
const ESTADOS_CON_AVISO = ESTADOS_EN_PANTALLA;

function leerTemporizadores() {
  try { return JSON.parse(localStorage.getItem("cocina-temporizadores") || "{}"); }
  catch { return {}; }
}

function textoAnuncioPedido(pedido) {
  const cliente = pedido.cliente_nombre || "mostrador";
  const productos = (pedido.detalles || [])
    .map((detalle) => {
      const cantidad = Number(detalle.cantidad) || 1;
      const nombre = detalle.nombre_producto || detalle.producto || "producto";
      const presentacion = detalle.nombre_presentacion || detalle.presentacion;
      return `${cantidad} ${nombre}${presentacion ? ` ${presentacion}` : ""}`;
    })
    .join(", ");
  return { cliente, productos };
}

function calcularReloj(pedido, temporizadores, ahora) {
  const temporizador = temporizadores[pedido.id];
  const tiempos = calcularTiemposPedido(pedido, temporizador, ahora);
  if (pedido.estado === "Nuevo") return { texto: "EN COLA", estado: "nuevo", progreso: 0, totalRestante: tiempos.totalRestante };
  if (pedido.estado === "Listo") return { texto: "LISTO", estado: "listo", progreso: 100, totalRestante: tiempos.totalRestante };
  const enHorno = pedido.estado === "En horno";
  const minutos = Number(
    enHorno
      ? temporizador?.minutos || pedido.tiempo_estimado_minutos || 15
      : temporizador?.preparacion?.minutos || pedido.tiempo_estimado_minutos || 20,
  );
  const restante = tiempos.faseRestante;
  if (restante === null || minutos <= 0) return { texto: "SIN ESTIMADO", estado: "sin-estimado", progreso: 0, etapa: enHorno ? "horno" : "preparacion", totalRestante: tiempos.totalRestante };

  const totalSegundos = minutos * 60;
  const progreso = Math.min(100, Math.max(0, ((totalSegundos - restante) / totalSegundos) * 100));
  if (restante < 0) return { texto: formatearCuenta(restante), estado: "retrasado", progreso, etapa: enHorno ? "horno" : "preparacion", totalRestante: tiempos.totalRestante };
  if (restante <= 120) return { texto: formatearCuenta(restante), estado: "por-terminar", progreso, etapa: enHorno ? "horno" : "preparacion", totalRestante: tiempos.totalRestante };
  return { texto: formatearCuenta(restante), estado: "a-tiempo", progreso, etapa: enHorno ? "horno" : "preparacion", totalRestante: tiempos.totalRestante };
}

function TarjetaProduccion({ pedido, reloj }) {
  const detalles = (pedido.detalles || []).filter(
    (detalle) =>
      detalle.requiere_preparacion !== 0 &&
      detalle.requiere_preparacion !== false,
  );
  const tono = {
    nuevo: "border-slate-700 bg-slate-900 text-slate-300",
    "sin-estimado": "border-slate-700 bg-slate-900 text-slate-300",
    "a-tiempo": "border-emerald-400/30 bg-emerald-950/40 text-emerald-300",
    "por-terminar": "border-amber-400/40 bg-amber-950/50 text-amber-200",
    retrasado: "border-red-400/50 bg-red-950/60 text-red-200",
    listo: "border-sky-300/40 bg-sky-950/50 text-sky-200",
  }[reloj.estado];

  return (
    <article className={`flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border p-3 shadow-xl sm:p-4 ${tono}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">{pedido.estado}</p>
          <h2 className="mt-2 truncate text-xl font-black text-white sm:text-2xl">{pedido.cliente_nombre || "Pedido de mostrador"}</h2>
          <p className="mt-1 truncate text-xs text-white/50">{pedido.folio || `Pedido #${pedido.id}`}</p>
        </div>
        <span className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/80">{pedido.tipo === "domicilio" ? "DOMICILIO" : "RECOGER"}</span>
      </div>
      <div className="mt-3 min-h-0 flex-1 border-t border-white/10 pt-2">
        <ul className="space-y-2 text-xs text-white/85 sm:text-sm">
          {detalles.map((detalle, indice) => {
            const adicionales =
              detalle.adicionales || detalle.pedido_detalle_adicionales || [];

            return (
              <li key={detalle.id || indice} className="rounded-xl bg-white/[0.05] p-2.5">
                <p className="font-bold text-white">
                  {detalle.cantidad}× {detalle.nombre_producto || detalle.producto}
                  {(detalle.nombre_presentacion || detalle.presentacion) && (
                    <span className="font-medium text-white/60">
                      {` · ${detalle.nombre_presentacion || detalle.presentacion}`}
                    </span>
                  )}
                </p>
                {adicionales.length > 0 && (
                  <p className="mt-1 leading-5 text-emerald-200">
                    Agregados: {adicionales.map((extra) => `${extra.cantidad || 1}× ${extra.nombre_adicional || extra.nombre}`).join(", ")}
                  </p>
                )}
                {detalle.notas && (
                  <p className="mt-1 rounded-lg bg-amber-300/15 px-2 py-1.5 font-semibold leading-5 text-amber-100">
                    Indicaciones: {detalle.notas}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {pedido.notas && (
          <p className="mt-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-2.5 text-xs font-semibold leading-5 text-amber-100 sm:text-sm">
            Nota del pedido: {pedido.notas}
          </p>
        )}
      </div>
      <div className="mt-auto border-t border-white/10 pt-3">
        <div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] opacity-70 sm:text-[10px]"><Clock3 size={13} />{reloj.estado === "retrasado" ? "Tiempo excedido" : reloj.estado === "nuevo" ? "Siguiente pedido" : reloj.estado === "listo" ? "Preparación terminada" : reloj.etapa === "horno" ? "Tiempo de horno" : "Tiempo de preparación"}</p><span className="text-[10px] font-bold tabular-nums text-white/55">{reloj.estado === "nuevo" || reloj.estado === "sin-estimado" || reloj.estado === "listo" ? "" : `${Math.round(reloj.progreso)}%`}</span></div>
        {reloj.estado !== "nuevo" && reloj.estado !== "sin-estimado" && reloj.estado !== "listo" && <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Tiempo transcurrido" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(reloj.progreso)}><div className={`h-full rounded-full transition-[width] duration-1000 ${reloj.estado === "retrasado" ? "bg-red-400" : reloj.estado === "por-terminar" ? "bg-amber-300" : "bg-emerald-300"}`} style={{ width: `${reloj.progreso}%` }} /></div>}
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="font-mono text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">{reloj.texto}</p>
          <p className="text-right text-[10px] font-semibold text-white/60 sm:text-xs">Total restante<br /><span className="font-mono text-base font-black tabular-nums text-white sm:text-lg">{formatearCuenta(reloj.totalRestante)}</span></p>
        </div>
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
        try {
          const detalle = await window.sistema.pedidos.obtener(pedido.id) || pedido;
          const productosPreparados = (detalle.detalles || []).filter(
            (producto) =>
              producto.requiere_preparacion !== 0 &&
              producto.requiere_preparacion !== false,
          );
          if (productosPreparados.length === 0) return null;
          return { ...detalle, detalles: productosPreparados };
        }
        catch { return null; }
      }));
      setPedidos(pedidosConDetalle.filter(Boolean));
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
      const { cliente, productos } = textoAnuncioPedido(pedido);
      const entrante = !estadosAnteriores.current.has(pedido.id) && pedido.estado === "Nuevo";
      if (vozActiva && (entrante || (estadoAnterior && estadoAnterior !== pedido.estado && pedido.estado === "Nuevo"))) {
        frases.push(`Nuevo pedido de ${cliente}: ${productos || "sin productos detallados"}.`);
      } else if (vozActiva && estadoAnterior && estadoAnterior !== pedido.estado) {
        const contextoPedido = productos ? `${cliente}, ${productos}` : cliente;
        if (pedido.estado === "Preparando") {
          frases.push(`Pedido de ${contextoPedido}, en preparación.`);
        } else if (pedido.estado === "En horno") {
          frases.push(`Pedido de ${contextoPedido}, en horno.`);
        } else if (pedido.estado === "Listo") {
          const avisoListo = `Pedido de ${contextoPedido}, listo.`;
          frases.push(`${avisoListo} ${avisoListo}`);
        }
      }
    }
    if (vozActiva) {
      for (const pedido of pedidosOrdenados) {
        if (retrasosActuales.has(pedido.id) && !retrasosAnteriores.current.has(pedido.id)) {
          const { cliente, productos } = textoAnuncioPedido(pedido);
          frases.push(`Atención. El pedido de ${cliente}${productos ? `, ${productos}` : ""}, superó su tiempo estimado.`);
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
  const renglonesMaximos = Math.max(1, ...pedidosOrdenados.map((pedido) => {
    const renglonesProductos = (pedido.detalles || []).reduce((total, detalle) => {
      const adicionales = detalle.adicionales || detalle.pedido_detalle_adicionales || [];
      return total + 1 + adicionales.length + Math.ceil(String(detalle.notas || "").length / 60);
    }, 0);
    return renglonesProductos + Math.ceil(String(pedido.notas || "").length / 60);
  }));
  const altoFila = Math.max(400, Math.min(Math.round(dimensiones.alto * 0.82), 280 + renglonesMaximos * 30));
  const filas = Math.max(1, Math.min(2, Math.floor((dimensiones.alto - 220) / (altoFila + 16))));
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
        {pedidosOrdenados.length ? <div className="grid min-h-0 flex-1 content-start justify-center gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 520px))`, gridAutoRows: `${altoFila}px` }}>{pedidosVisibles.map((pedido) => <TarjetaProduccion key={pedido.id} pedido={pedido} reloj={calcularReloj(pedido, temporizadores, ahora)} />)}</div> : <div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.04] text-white/30"><ChefHat size={38} /></span><h2 className="mt-5 text-2xl font-black">{actualizando ? "Cargando producción…" : "Cocina lista para recibir pedidos"}</h2><p className="mt-2 max-w-md text-sm text-white/50">Al iniciar la preparación, los pedidos y sus tiempos aparecerán aquí automáticamente.</p></div>}
      </section>
      <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-[#101522] px-5 py-2.5 text-center text-xs font-semibold tracking-wide text-white/40">{paginas > 1 && <span className="text-orange-200">Vista {pagina + 1} de {paginas} · cambio automático</span>}<span>Mantén el ritmo · Un pedido a la vez, recién hecho</span></footer>
    </main>
  );
}
