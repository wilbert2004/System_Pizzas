function obtenerRestante(iniciadoEn, minutos, ahora) {
  const estimado = Number(minutos);
  const inicio = iniciadoEn ? new Date(iniciadoEn).getTime() : NaN;
  if (!Number.isFinite(inicio) || !Number.isFinite(estimado) || estimado <= 0) return null;
  return Math.ceil((inicio + estimado * 60000 - ahora) / 1000);
}

export function formatearCuenta(segundos) {
  if (segundos === null || !Number.isFinite(segundos)) return "—";
  const retrasado = segundos < 0;
  const valor = Math.abs(segundos);
  const horas = Math.floor(valor / 3600);
  const minutos = Math.floor((valor % 3600) / 60);
  const resto = valor % 60;
  const texto = horas > 0
    ? `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`
    : `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
  return retrasado ? `+${texto}` : texto;
}

export function calcularTiemposPedido(pedido, temporizador = {}, ahora = Date.now()) {
  if (pedido.estado === "Nuevo") {
    return { fase: "Preparación", faseRestante: null, totalRestante: null };
  }
  if (pedido.estado === "Listo") {
    return { fase: "Listo", faseRestante: 0, totalRestante: 0 };
  }

  const enHorno = pedido.estado === "En horno";
  const timerFase = enHorno ? temporizador : temporizador.preparacion;
  const inicio = enHorno
    ? temporizador.iniciadoEn || pedido.fecha_entrada_horno
    : temporizador.preparacion?.iniciadoEn || pedido.fecha_inicio_preparacion;
  const minutosFase = enHorno
    ? temporizador.minutos || pedido.tiempo_estimado_minutos
    : temporizador.preparacion?.minutos || pedido.tiempo_estimado_minutos;
  const faseRestante = obtenerRestante(inicio, minutosFase, ahora);
  const minutosHornoSiguiente = enHorno
    ? 0
    : Number(temporizador.preparacion?.minutosHorno || temporizador.minutosHorno || 12);
  const totalRestante = faseRestante === null
    ? null
    : Math.max(0, faseRestante) + minutosHornoSiguiente * 60;

  return {
    fase: enHorno ? "Horno" : "Preparación",
    faseRestante,
    totalRestante,
  };
}
