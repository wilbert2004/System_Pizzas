import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const duracionDe = (elemento) =>
  Math.max(3, Number(elemento?.duracion_segundos || 10));

export default function ReproductorMultimedia({ elementos = [] }) {
  const [indice, setIndice] = useState(0);
  const [fallidos, setFallidos] = useState(() => new Set());
  const temporizador = useRef(null);
  const elementosValidos = useMemo(
    () => elementos.filter((elemento) => elemento?.url || elemento?.ruta),
    [elementos],
  );
  const firma = elementosValidos.map((elemento) => `${elemento.id}:${elemento.url || elemento.ruta}`).join("|");
  const elemento = elementosValidos.length ? elementosValidos[indice % elementosValidos.length] : null;

  const avanzar = useCallback((indiceActual = indice) => {
    setIndice((actual) => {
      const base = indiceActual === actual ? actual : indiceActual;
      if (!elementosValidos.length) return 0;
      for (let paso = 1; paso <= elementosValidos.length; paso += 1) {
        const candidato = (base + paso) % elementosValidos.length;
        if (!fallidos.has(candidato)) return candidato;
      }
      return base;
    });
  }, [elementosValidos, fallidos, indice]);

  const programarAvance = useCallback((segundos) => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => avanzar(), Math.max(3, segundos) * 1000);
  }, [avanzar]);

  useEffect(() => {
    setIndice(0);
    setFallidos(new Set());
  }, [firma]);

  useEffect(() => {
    if (!elemento) return undefined;
    if (elemento.tipo === "video") {
      // Respaldo para códecs o archivos que no emiten el evento ended en ciertas TVs.
      programarAvance(duracionDe(elemento));
    } else {
      programarAvance(duracionDe(elemento));
    }
    return () => clearTimeout(temporizador.current);
  }, [elemento, indice, programarAvance]);

  const marcarFallido = (indiceActual) => {
    setFallidos((actuales) => new Set(actuales).add(indiceActual));
    avanzar(indiceActual);
  };

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
  const indiceActual = indice % elementosValidos.length;

  if (elemento.tipo === "video") {
    return (
      <video
        key={`${elemento.id || ruta}-${indiceActual}`}
        src={ruta}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => avanzar(indiceActual)}
        onError={() => marcarFallido(indiceActual)}
        onStalled={() => programarAvance(8)}
        onLoadedMetadata={(evento) => {
          const duracion = evento.currentTarget.duration;
          programarAvance(Number.isFinite(duracion) && duracion > 0 ? duracion + 1 : duracionDe(elemento));
          evento.currentTarget.play().catch(() => {});
        }}
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
