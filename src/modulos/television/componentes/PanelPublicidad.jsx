import ReproductorMultimedia from "./ReproductorMultimedia";

export default function PanelPublicidad({ elementos }) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col p-4 sm:p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="truncate text-xl font-extrabold tracking-tight">
            Nuestras promociones
          </h2>

          <p className="text-sm text-white/50">Descubre algo delicioso</p>
        </div>

        <span className="rounded-xl bg-fuchsia-500/15 p-2 text-xl">📢</span>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-[#151522] p-2 shadow-2xl shadow-black/20">
        <ReproductorMultimedia elementos={elementos} />
      </div>
    </section>
  );
}
