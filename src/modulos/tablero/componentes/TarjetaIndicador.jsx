function TarjetaIndicador({
  titulo,
  valor = "—",
  descripcion,
  icono: Icono,
  color = "morado",
}) {
  const estilos = {
    morado: "bg-violet-50 text-violet-700 ring-violet-100",
    azul: "bg-blue-50 text-blue-700 ring-blue-100",
    naranja: "bg-orange-50 text-orange-700 ring-orange-100",
    rojo: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{valor}</h3>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${estilos[color]}`}>
          {Icono && <Icono size={21} strokeWidth={2.1} />}
        </span>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{descripcion}</p>
    </article>
  );
}

export default TarjetaIndicador;
