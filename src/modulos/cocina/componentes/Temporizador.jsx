import { useEffect, useState } from "react";

function calcularTiempo(fechaInicio, ahora) {
  if (!fechaInicio) return 0;

  const inicio = new Date(fechaInicio).getTime();

  if (Number.isNaN(inicio)) return 0;

  return Math.max(0, Math.floor((ahora - inicio) / 1000));
}

export default function Temporizador({ fechaInicio, minutosEstimados = 0 }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const segundos = calcularTiempo(fechaInicio, ahora);
  const estimadoSegundos = Math.max(0, Number(minutosEstimados || 0) * 60);
  const progreso =
    estimadoSegundos > 0
      ? Math.min(100, (segundos / estimadoSegundos) * 100)
      : 0;
  const tiempoCumplido =
    estimadoSegundos > 0 && segundos >= estimadoSegundos;

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const restantes = segundos % 60;

  const formato =
    horas > 0
      ? `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(restantes).padStart(2, "0")}`
      : `${String(minutos).padStart(2, "0")}:${String(restantes).padStart(2, "0")}`;

  return (
    <div className="min-w-40">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-mono font-bold tabular-nums ${
            tiempoCumplido ? "text-red-600" : ""
          }`}
        >
          {formato}
        </span>
        {estimadoSegundos > 0 && (
          <span className="text-[11px] font-medium text-slate-400">
            / {minutosEstimados} min
          </span>
        )}
      </div>
      {estimadoSegundos > 0 && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-[width] ${
              tiempoCumplido ? "bg-red-500" : "bg-violet-500"
            }`}
            style={{ width: `${progreso}%` }}
          />
        </div>
      )}
      {tiempoCumplido && (
        <p className="mt-1 text-[11px] font-semibold text-red-600">
          Tiempo cumplido
        </p>
      )}
    </div>
  );
}
