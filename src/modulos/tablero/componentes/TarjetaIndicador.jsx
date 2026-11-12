function TarjetaIndicador({
  titulo,
  valor = "—",
  descripcion,
  icono: Icono,
  color = "morado",
}) {
  const estilos = {
    morado: "bg-morado-50 text-morado-700",
    azul: "bg-blue-50 text-blue-700",
    naranja: "bg-orange-50 text-orange-700",
    rojo: "bg-red-50 text-red-700",
  };

  return (
    <article className="bg-white border border-borde rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-texto-secundario">{titulo}</p>

          <h3 className="text-3xl font-bold text-texto mt-3">{valor}</h3>
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${estilos[color]}`}
        >
          {Icono && <Icono size={23} />}
        </div>
      </div>

      <p className="text-xs text-texto-secundario mt-4">{descripcion}</p>
    </article>
  );
}

export default TarjetaIndicador;
