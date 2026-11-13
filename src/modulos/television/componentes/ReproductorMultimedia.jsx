import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const duracionManual = (elemento) => Math.max(3, Number(elemento?.duracion_segundos || 10));
const duracionImagen = (elemento) => Math.max(3, Number(elemento?.duracion_segundos || 10));

export default function ReproductorMultimedia({ elementos = [] }) {
  const [indice, setIndice] = useState(0);
  const [fallidos, setFallidos] = useState(() => new Set());
  const timer = useRef(null);
  const watchdog = useRef(null);
  const ultimoTiempo = useRef(0);
  const sinProgresoDesde = useRef(0);
  const videoRef = useRef(null);
  const elementosValidos = useMemo(
    () => elementos.filter((elemento) => elemento?.url || elemento?.ruta),
    [elementos],
  );
  const firma = elementosValidos.map((elemento) => `${elemento.id}:${elemento.url || elemento.ruta}`).join("|");
  const indiceActual = elementosValidos.length ? indice % elementosValidos.length : 0;
  const elemento = elementosValidos[indiceActual];
  const elementoId = elemento?.id;
  const rutaElemento = elemento?.url || elemento?.ruta;
  const tipoElemento = elemento?.tipo;
  const modoElemento = elemento?.duracion_modo;
  const duracionElemento = elemento?.duracion_segundos;

  const avanzar = useCallback((desde = indiceActual) => {
    clearTimeout(timer.current);
    clearInterval(watchdog.current);
    setIndice((actual) => {
      const base = desde === actual ? actual : desde;
      if (!elementosValidos.length) return 0;
      for (let paso = 1; paso <= elementosValidos.length; paso += 1) {
        const candidato = (base + paso) % elementosValidos.length;
        if (!fallidos.has(candidato)) return candidato;
      }
      return base;
    });
  }, [elementosValidos.length, fallidos, indiceActual]);

  const marcarFallido = useCallback((actual) => {
    setFallidos((anteriores) => new Set(anteriores).add(actual));
    avanzar(actual);
  }, [avanzar]);

  useEffect(() => {
    setIndice(0);
    setFallidos(new Set());
  }, [firma]);

  useEffect(() => () => {
    clearTimeout(timer.current);
    clearInterval(watchdog.current);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    clearInterval(watchdog.current);
    if (!elemento) return undefined;

    const manual = elemento.duracion_modo !== "automatico";
    const segundos = duracionManual(elemento);
    ultimoTiempo.current = 0;
    sinProgresoDesde.current = Date.now();

    if (elemento.tipo !== "video" || manual) {
      timer.current = setTimeout(() => avanzar(indiceActual), segundos * 1000);
      return () => clearTimeout(timer.current);
    }

    // El video automático avanza al terminar. Este plazo rescata archivos cuyo
    // decodificador nunca entrega metadatos o se queda bloqueado.
    timer.current = setTimeout(() => marcarFallido(indiceActual), 30000);
    watchdog.current = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      if (video.currentTime > ultimoTiempo.current + 0.15) {
        ultimoTiempo.current = video.currentTime;
        sinProgresoDesde.current = Date.now();
        return;
      }
      if (video.ended) return avanzar(indiceActual);
      if (Date.now() - sinProgresoDesde.current > 18000) {
        marcarFallido(indiceActual);
      }
    }, 3000);
    return () => {
      clearTimeout(timer.current);
      clearInterval(watchdog.current);
    };
  }, [elementoId, rutaElemento, tipoElemento, modoElemento, duracionElemento, indiceActual, avanzar, marcarFallido]);

  if (!elemento || fallidos.size >= elementosValidos.length) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-[22px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.18),transparent_58%),linear-gradient(145deg,#191326,#0d1018_70%)] px-6 text-center">
        <div className="max-w-sm">
          <span className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-amber-300/10 text-4xl text-amber-200 ring-1 ring-amber-200/15">✦</span>
          <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">Gracias por visitarnos</p>
          <p className="mt-4 text-sm leading-6 text-white/55 sm:text-base">Las promociones de la casa aparecerán aquí.</p>
        </div>
      </div>
    );
  }

  const ruta = elemento.url || elemento.ruta;
  const modoAutomatico = elemento.duracion_modo === "automatico";

  if (elemento.tipo === "video") {
    return (
      <video
        ref={videoRef}
        key={`${elemento.id || ruta}-${indiceActual}`}
        src={ruta}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => avanzar(indiceActual)}
        onError={() => marcarFallido(indiceActual)}
        onCanPlay={(evento) => {
          sinProgresoDesde.current = Date.now();
          evento.currentTarget.play().catch(() => marcarFallido(indiceActual));
        }}
        onTimeUpdate={(evento) => {
          ultimoTiempo.current = evento.currentTarget.currentTime;
          sinProgresoDesde.current = Date.now();
        }}
        onLoadedMetadata={(evento) => {
          const video = evento.currentTarget;
          if (modoAutomatico && Number.isFinite(video.duration) && video.duration > 0) {
            clearTimeout(timer.current);
            // Respaldo extra por si el evento ended no llega en la TV.
            timer.current = setTimeout(() => avanzar(indiceActual), (video.duration + 12) * 1000);
          }
          video.play().catch(() => marcarFallido(indiceActual));
        }}
        onStalled={() => { sinProgresoDesde.current = Date.now(); }}
        className="h-full w-full rounded-[22px] bg-[#080a10] object-contain"
      />
    );
  }

  return (
    <img
      key={elemento.id || ruta}
      src={ruta}
      alt={elemento.nombre || "Promoción"}
      onError={() => marcarFallido(indiceActual)}
      className="h-full w-full rounded-[22px] bg-[#080a10] object-contain"
    />
  );
}
