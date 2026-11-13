import { useEffect, useMemo, useRef, useState } from "react";

export function useAlarmasCocina(pedidos, temporizadores = {}) {
  const audioRef = useRef(null);
  const volumenNotificacionesRef = useRef(0.7);
  const [ahora, setAhora] = useState(() => Date.now());
  const [sonidoActivo, setSonidoActivo] = useState(false);

  useEffect(() => {
    let vigente = true;
    window.sistema?.configuracion?.operativa?.()
      .then((configuracion) => {
        if (vigente) volumenNotificacionesRef.current = configuracion.volumenNotificaciones / 100;
      })
      .catch(() => {});
    return () => { vigente = false; };
  }, []);

  const reproducirTono = (audio) => {
    const inicio = audio.currentTime;

    [880, 660, 880].forEach((frecuencia, indice) => {
      const oscilador = audio.createOscillator();
      const volumen = audio.createGain();
      const momento = inicio + indice * 0.3;

      oscilador.type = "sine";
      oscilador.frequency.value = frecuencia;
      volumen.gain.setValueAtTime(0.0001, momento);
      volumen.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, 0.15 * volumenNotificacionesRef.current),
        momento + 0.03,
      );
      volumen.gain.exponentialRampToValueAtTime(0.0001, momento + 0.22);
      oscilador.connect(volumen);
      volumen.connect(audio.destination);
      oscilador.start(momento);
      oscilador.stop(momento + 0.25);
    });
  };

  const activarSonido = async () => {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Este equipo no admite sonido de alarmas.");
    }

    if (!audioRef.current) {
      audioRef.current = new AudioContextClass();
    }

    await audioRef.current.resume();
    reproducirTono(audioRef.current);
    setSonidoActivo(true);
  };

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);

    return () => clearInterval(intervalo);
  }, []);

  const pedidosRetrasados = pedidos.filter((pedido) => {
    if (!["Preparando", "En horno"].includes(pedido.estado)) {
      return false;
    }

    const temporizador = temporizadores[pedido.id];
    const fechaInicio =
      pedido.estado === "En horno"
        ? temporizador?.iniciadoEn || pedido.fecha_entrada_horno
        : pedido.fecha_inicio_preparacion;

    if (!fechaInicio) {
      return false;
    }

    const inicio = new Date(fechaInicio).getTime();

    const estimado =
      Number(
        pedido.estado === "En horno"
          ? temporizador?.minutos || pedido.tiempo_estimado_minutos
          : pedido.tiempo_estimado_minutos,
      ) || 20;

    const minutosTranscurridos = (ahora - inicio) / 60000;

    return minutosTranscurridos > estimado;
  });

  const cantidadRetrasados = pedidosRetrasados.length;
  const pedidosParaAvisar = useMemo(
    () =>
      pedidos.filter((pedido) => {
        if (!["Preparando", "En horno"].includes(pedido.estado)) return false;

        const temporizador = temporizadores[pedido.id];
        const fechaInicio =
          pedido.estado === "En horno"
            ? temporizador?.iniciadoEn || pedido.fecha_entrada_horno
            : pedido.fecha_inicio_preparacion;
        const inicio = fechaInicio ? new Date(fechaInicio).getTime() : NaN;
        const estimado = Number(
          pedido.estado === "En horno"
            ? temporizador?.minutos || pedido.tiempo_estimado_minutos
            : pedido.tiempo_estimado_minutos,
        );

        return (
          Number.isFinite(inicio) &&
          Number.isFinite(estimado) &&
          estimado > 0 &&
          ahora - inicio >= estimado * 60000
        );
      }),
    [pedidos, ahora, temporizadores],
  );
  const identificadorAvisos = pedidosParaAvisar
    .map((pedido) => {
      const etapa = pedido.estado === "En horno" ? "horno" : "preparacion";
      return `${pedido.id}-${etapa}`;
    })
    .sort()
    .join(",");

  useEffect(() => {
    if (!sonidoActivo || pedidosParaAvisar.length === 0) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      const audio = audioRef.current || new AudioContextClass();
      audioRef.current = audio;
      reproducirTono(audio);

      audio.resume().catch(() => {});

      const intervalo = setInterval(() => {
        reproducirTono(audio);
      }, 3000);

      return () => clearInterval(intervalo);
    } catch (error) {
      console.warn("No se pudo reproducir la alarma:", error);
    }

  }, [identificadorAvisos, pedidosParaAvisar.length, sonidoActivo]);

  useEffect(() => {
    return () => {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
    };
  }, []);

  return {
    pedidosRetrasados,
    cantidadRetrasados,
    sonidoActivo,
    activarSonido,
  };
}
