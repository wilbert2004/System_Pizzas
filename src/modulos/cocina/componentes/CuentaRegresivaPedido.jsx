import { useEffect, useState } from "react";
import { calcularTiemposPedido, formatearCuenta } from "../servicios/tiemposPedido";

export default function CuentaRegresivaPedido({ pedido, temporizador }) {
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const tiempos = calcularTiemposPedido(pedido, temporizador, ahora);
  const vencida = tiempos.faseRestante !== null && tiempos.faseRestante < 0;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-500">{tiempos.fase}</p>
        <p className={`font-mono text-lg font-black tabular-nums ${vencida ? "text-red-600" : "text-violet-700"}`}>
          {formatearCuenta(tiempos.faseRestante)}
        </p>
      </div>
      <div className="min-w-0 border-l border-slate-200 pl-3">
        <p className="text-[11px] font-semibold text-slate-500">Total restante</p>
        <p className="font-mono text-lg font-black tabular-nums text-slate-800">
          {formatearCuenta(tiempos.totalRestante)}
        </p>
      </div>
    </div>
  );
}
