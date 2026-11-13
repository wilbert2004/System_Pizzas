import RelojTV from "./RelojTV";

export default function EncabezadoTV({ empresa }) {
  const logo = empresa.logotipo_ruta
    ? `pizzeria-media://archivo?ruta=${encodeURIComponent(empresa.logotipo_ruta)}`
    : "";

  return (
    <header className="relative flex min-w-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0e111b] px-5 py-3.5 sm:px-9 sm:py-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {logo
          ? <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-2xl bg-white object-contain p-1.5 shadow-lg sm:h-14 sm:w-14" />
          : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-2xl font-black tracking-tighter text-[#211340] shadow-lg shadow-orange-950/30 ring-1 ring-white/15 sm:h-14 sm:w-14 sm:text-3xl">{(empresa.nombre_negocio || "P").trim().slice(0, 1).toUpperCase()}</div>}

        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-tight sm:text-3xl">{empresa.nombre_negocio || "Pizzería"}</h1>
          <p className="mt-0.5 truncate text-[11px] text-white/65 sm:text-sm">
            {empresa.telefono_negocio ? `Pedidos y contacto: ${empresa.telefono_negocio}` : "Gracias por visitarnos"}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 sm:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
        <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">En vivo</p><RelojTV /></div>
      </div>
      <div className="sm:hidden"><RelojTV /></div>
    </header>
  );
}
