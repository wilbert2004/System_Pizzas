import RelojTV from "./RelojTV";

export default function EncabezadoTV() {
  return (
    <header className="flex min-w-0 items-center justify-between gap-4 border-b border-white/10 bg-[#11111d] px-5 py-3 sm:px-8 sm:py-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl shadow-lg shadow-violet-900/30 sm:h-12 sm:w-12 sm:text-2xl">
          🍕
        </div>

        <div>
          <h1 className="truncate text-xl font-black tracking-tight sm:text-3xl">
            ¡Gracias por tu preferencia!
          </h1>

          <p className="truncate text-[11px] text-white/50 sm:text-sm">
            Estamos preparando algo delicioso para ti
          </p>
        </div>
      </div>

      <RelojTV />
    </header>
  );
}
