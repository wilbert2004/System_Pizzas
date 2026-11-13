import { useEffect, useState } from "react";

export default function ReproductorMultimedia({ elementos = [] }) {
  const [indice, setIndice] = useState(0);

  const indiceSeguro = elementos.length ? indice % elementos.length : 0;
  const elemento = elementos[indiceSeguro];

  useEffect(() => {
    if (!elemento) return;

    if (elemento.tipo === "video") return;

    const duracion = Math.max(3, Number(elemento.duracion_segundos || 10));

    const intervalo = setTimeout(() => {
      setIndice((actual) =>
        elementos.length ? (actual + 1) % elementos.length : 0,
      );
    }, duracion * 1000);

    return () => clearTimeout(intervalo);
  }, [elemento, elementos]);

  const siguiente = () => {
    setIndice((actual) =>
      elementos.length ? (actual + 1) % elementos.length : 0,
    );
  };

  if (!elemento) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 text-center">
        <div>
          <div className="mb-4 text-6xl">🍕</div>
          <p className="text-xl font-bold">STARMY PIZZERÍA</p>
          <p className="mt-2 text-sm text-white/50">
            Próximamente promociones especiales
          </p>
        </div>
      </div>
    );
  }

  const ruta = elemento.url || elemento.ruta;

  if (!ruta) {
    return (
      <div className="flex h-full items-center justify-center text-white/60">
        Archivo multimedia sin ruta
      </div>
    );
  }

  if (elemento.tipo === "video") {
    return (
      <video
        key={`${elemento.id || ruta}-${indiceSeguro}`}
        src={ruta}
        autoPlay
        loop={elementos.length === 1}
        muted
        playsInline
        onEnded={siguiente}
        onError={siguiente}
        onLoadedData={(evento) => evento.currentTarget.play().catch(() => {})}
        className="h-full w-full rounded-2xl bg-black object-contain"
      />
    );
  }

  return (
    <img
      key={elemento.id || ruta}
      src={ruta}
      alt="Promoción"
      onError={siguiente}
      className="h-full w-full rounded-2xl object-cover"
    />
  );
}
