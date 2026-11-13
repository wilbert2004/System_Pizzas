import ReproductorMultimedia from "./ReproductorMultimedia";

export default function PanelPublicidad({ elementos, nombreNegocio }) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col p-4 sm:p-6 lg:p-7">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4 sm:mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70">Algo rico te espera</p>
          <h2 className="mt-1 truncate text-lg font-black tracking-tight sm:text-2xl">
            Promociones
          </h2>

          <p className="mt-1 text-xs text-white/45 sm:text-sm">Descubre algo delicioso</p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-lg text-amber-200 ring-1 ring-amber-200/10">✦</span>
      </div>

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#080a10] p-1.5 shadow-2xl shadow-black/30 ring-1 ring-white/[0.04] sm:p-2">
        <ReproductorMultimedia elementos={elementos} />
      </div>
      <div className="mt-3 flex shrink-0 items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30 sm:mt-4 sm:text-[11px]"><span className="truncate">{nombreNegocio || "Gracias por visitarnos"}</span><span className="shrink-0">{elementos.length ? `${elementos.length} ${elementos.length === 1 ? "anuncio" : "anuncios"}` : "Bienvenido"}</span></div>
    </section>
  );
}
