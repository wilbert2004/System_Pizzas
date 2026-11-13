import { useEffect } from "react";

import { usePedidosTV } from "../hooks/usePedidosTV";
import { usePublicidadTV } from "../hooks/usePublicidadTV";
import { useEstadoTV } from "../estado/EstadoTV";

import EncabezadoTV from "../componentes/EncabezadoTV";
import ListaPedidosTV from "../componentes/ListaPedidosTV";
import PanelPublicidad from "../componentes/PanelPublicidad";

export default function PaginaTV() {
  const { pedidosPreparando, pedidosListos } = usePedidosTV();
  const publicidad = usePublicidadTV();

  const cargarPublicidad = useEstadoTV((estado) => estado.cargarPublicidad);

  useEffect(() => {
    cargarPublicidad();
  }, [cargarPublicidad]);

  useEffect(() => {
    document.documentElement.classList.add("tv-mode");
    document.body.classList.add("tv-mode");

    return () => {
      document.documentElement.classList.remove("tv-mode");
      document.body.classList.remove("tv-mode");
    };
  }, []);

  return (
    <main className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#0b0b14] text-white">
      <EncabezadoTV />

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] divide-x divide-white/10">
        <div className="min-h-0 overflow-hidden">
          <ListaPedidosTV
            pedidosPreparando={pedidosPreparando}
            pedidosListos={pedidosListos}
          />
        </div>

        <div className="min-h-0">
          <PanelPublicidad elementos={publicidad} />
        </div>
      </div>

      <footer className="flex items-center justify-center border-t border-white/10 px-5 py-2 text-[11px] text-white/35">
        Gracias por elegirnos · Tu pizza estará lista muy pronto
      </footer>
    </main>
  );
}
