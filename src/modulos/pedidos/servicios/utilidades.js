export function formatearDinero(centavos = 0) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(centavos || 0) / 100);
}

export function convertirFecha(valor) {
  if (!valor) return null;

  if (valor instanceof Date) return valor;

  // SQLite almacena las fechas locales como YYYY-MM-DD HH:mm:ss.
  const texto = String(valor);
  const fecha = new Date(texto.replace(" ", "T"));

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatearFecha(valor) {
  const fecha = convertirFecha(valor);

  if (!fecha) return "Sin fecha";

  return fecha.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function obtenerTiempoPreparacion(pedido, ahora = Date.now()) {
  const inicio = convertirFecha(pedido.fecha_inicio_preparacion);

  if (!inicio) {
    return {
      iniciado: false,
      minutos: 0,
      segundos: 0,
      retrasado: false,
      texto: "Sin iniciar",
    };
  }

  const fin = ["Listo", "En reparto", "Entregado"].includes(pedido.estado)
    ? convertirFecha(pedido.fecha_listo)
    : pedido.estado === "Cancelado"
      ? convertirFecha(pedido.fecha_cancelacion)
      : null;

  const finMilisegundos = fin ? fin.getTime() : ahora;
  const transcurridos = Math.max(
    0,
    Math.floor((finMilisegundos - inicio.getTime()) / 1000),
  );

  const minutos = Math.floor(transcurridos / 60);
  const segundos = transcurridos % 60;

  const estimado = Number(pedido.tiempo_estimado_minutos || 0);

  const retrasado =
    estimado > 0 &&
    transcurridos > estimado * 60 &&
    !["Listo", "En reparto", "Entregado", "Cancelado"].includes(pedido.estado);

  return {
    iniciado: true,
    minutos,
    segundos,
    retrasado,
    texto: `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`,
  };
}

export const COLORES_ESTADO = {
  Nuevo: "bg-blue-100 text-blue-700",
  Preparando: "bg-violet-100 text-violet-700",
  "En horno": "bg-orange-100 text-orange-700",
  Listo: "bg-emerald-100 text-emerald-700",
  "En reparto": "bg-indigo-100 text-indigo-700",
  Entregado: "bg-slate-100 text-slate-600",
  Cancelado: "bg-red-100 text-red-700",
};

export function obtenerAccionesPedido(pedido) {
  switch (pedido.estado) {
    case "Nuevo":
      return [{ estado: "Preparando", etiqueta: "Iniciar preparación" }];

    case "Preparando":
      return [
        { estado: "En horno", etiqueta: "Enviar al horno" },
        { estado: "Listo", etiqueta: "Marcar listo" },
      ];

    case "En horno":
      return [{ estado: "Listo", etiqueta: "Marcar listo" }];

    case "Listo":
      return pedido.tipo === "domicilio"
        ? [{ estado: "En reparto", etiqueta: "Salir a reparto" }]
        : [];

    case "En reparto":
      return [];

    default:
      return [];
  }
}
