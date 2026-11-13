import { useEffect, useRef, useState } from "react";

import { usePedidosTV } from "../hooks/usePedidosTV";
import { usePublicidadTV } from "../hooks/usePublicidadTV";
import { useEstadoTV } from "../estado/EstadoTV";

import EncabezadoTV from "../componentes/EncabezadoTV";
import ListaPedidosTV from "../componentes/ListaPedidosTV";
import PanelPublicidad from "../componentes/PanelPublicidad";

export default function PaginaTV() {
  const { pedidosPreparando, pedidosListos, avisosListos } = usePedidosTV();
  const publicidad = usePublicidadTV();
  const [empresa, setEmpresa] = useState({ nombre_negocio: "Pizzería", telefono_negocio: "", logotipo_ruta: "" });
  const [musica, setMusica] = useState(null);
  const audioRef = useRef(null);

  const cargarPublicidad = useEstadoTV((estado) => estado.cargarPublicidad);

  useEffect(() => {
    cargarPublicidad();
  }, [cargarPublicidad]);

  useEffect(() => {
    let vigente = true;
    const cargarIdentidad = async () => {
      try {
        const datosEmpresa = await window.sistema.configuracion.publica();
        if (vigente) setEmpresa(datosEmpresa);
      } catch (error) {
        console.error("No se pudo cargar la identidad de la TV:", error);
      }
    };
    cargarIdentidad();
    const intervalo = setInterval(cargarIdentidad, 30000);
    return () => { vigente = false; clearInterval(intervalo); };
  }, []);

  useEffect(() => {
    let vigente = true;
    const cargarMusica = async () => {
      try {
        const pista = await window.sistema.television.obtenerMusica();
        if (vigente) setMusica(pista);
      } catch (error) {
        console.error("No se pudo actualizar la música de promociones:", error);
      }
    };
    cargarMusica();
    const intervalo = setInterval(cargarMusica, 2500);
    return () => { vigente = false; clearInterval(intervalo); };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const volumen = Number(musica?.volumen ?? 35);
      audioRef.current.volume = Math.min(1, Math.max(0, volumen / 100));
    }
  }, [musica?.ruta, musica?.volumen]);

  useEffect(() => {
    document.documentElement.classList.add("tv-mode");
    document.body.classList.add("tv-mode");

    return () => {
      document.documentElement.classList.remove("tv-mode");
      document.body.classList.remove("tv-mode");
    };
  }, []);

  return (
    <main className="relative flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#090c14] text-white selection:bg-amber-300 selection:text-slate-950">
      <EncabezadoTV empresa={empresa} />
      {musica?.ruta && <audio ref={audioRef} key={musica.ruta} src={musica.ruta} autoPlay loop style={{ display: "none" }} onCanPlay={(evento) => { evento.currentTarget.volume = Math.min(1, Math.max(0, Number(musica.volumen ?? 35) / 100)); evento.currentTarget.play().catch((error) => console.warn("No se pudo iniciar la música ambiental:", error)); }} />}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] divide-x divide-white/[0.08]">
        <div className="min-h-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.12),transparent_45%)]">
          <ListaPedidosTV
            pedidosPreparando={pedidosPreparando}
            pedidosListos={pedidosListos}
          />
        </div>

        <div className="min-h-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.08),transparent_48%)]">
          <PanelPublicidad elementos={publicidad} nombreNegocio={empresa.nombre_negocio} />
        </div>
      </div>

      {avisosListos.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4" aria-live="assertive">
          <div className="w-full max-w-2xl animate-[fade-in_250ms_ease-out] rounded-2xl border border-emerald-200/30 bg-emerald-950/95 px-5 py-4 text-center shadow-2xl shadow-emerald-950/50 ring-1 ring-emerald-100/10 backdrop-blur-xl sm:px-8 sm:py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">¡Recién salido de cocina!</p>
            {avisosListos.map((pedido) => (
              <p key={pedido.id} className="mt-1 text-lg font-black text-white sm:text-2xl">
                {pedido.cliente_nombre || "Pedido rápido"} · orden {pedido.folio || `#${pedido.id}`}
              </p>
            ))}
            {avisosListos.map((pedido) => (
              <p key={`mensaje-${pedido.id}`} className="mt-1 text-xs font-semibold text-emerald-100/80 sm:text-sm">
                {pedido.tipo === "domicilio" ? "Tu pedido está listo para salir a reparto." : "Tu pedido está listo; puedes pasar a recogerlo."}
              </p>
            ))}
          </div>
        </div>
      )}

      <footer className="flex items-center justify-center gap-2 border-t border-white/[0.08] bg-[#080a10] px-5 py-2.5 text-center text-[11px] font-medium tracking-wide text-white/40 sm:text-xs">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" /> Disfruta nuestras promociones mientras preparamos algo delicioso para ti
      </footer>
    </main>
  );
}
