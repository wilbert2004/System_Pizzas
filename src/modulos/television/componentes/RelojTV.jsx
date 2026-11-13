import { useEffect, useState } from "react";

export default function RelojTV() {
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(new Date());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="min-w-0 shrink-0 text-right">
      <p className="text-2xl font-extrabold tabular-nums sm:text-3xl">
        {ahora.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <p className="max-w-[9rem] truncate text-[10px] text-white/70 sm:max-w-none sm:text-sm">
        {ahora.toLocaleDateString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
    </div>
  );
}
