import { useEffect, useRef } from "react";

export function useAlarmaRetrasos(activa, cantidadPendiente) {
  const audioRef = useRef(null);
  const ultimaAlarmaRef = useRef(0);
  const volumenNotificacionesRef = useRef(0.7);

  useEffect(() => {
    let vigente = true;
    window.sistema?.configuracion?.operativa?.()
      .then((configuracion) => {
        if (vigente) volumenNotificacionesRef.current = configuracion.volumenNotificaciones / 100;
      })
      .catch(() => {});
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (!activa || cantidadPendiente === 0) {
      ultimaAlarmaRef.current = 0;
      return;
    }

    const reproducir = () => {
      const ahora = Date.now();

      // Repetir como máximo una vez cada 30 segundos.
      if (ahora - ultimaAlarmaRef.current < 30000) return;

      try {
        const AudioContexto = window.AudioContext || window.webkitAudioContext;

        if (!AudioContexto) return;

        if (!audioRef.current) {
          audioRef.current = new AudioContexto();
        }

        const contexto = audioRef.current;

        if (contexto.state === "suspended") {
          contexto.resume().catch(() => {});
        }

        const inicio = contexto.currentTime;

        for (let i = 0; i < 3; i++) {
          const oscilador = contexto.createOscillator();
          const volumen = contexto.createGain();

          oscilador.type = "sine";
          oscilador.frequency.value = 880;

          const momento = inicio + i * 0.35;

          volumen.gain.setValueAtTime(0.0001, momento);
          volumen.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, 0.12 * volumenNotificacionesRef.current),
            momento + 0.02,
          );
          volumen.gain.exponentialRampToValueAtTime(0.0001, momento + 0.22);

          oscilador.connect(volumen);
          volumen.connect(contexto.destination);

          oscilador.start(momento);
          oscilador.stop(momento + 0.24);
        }

        ultimaAlarmaRef.current = ahora;
      } catch (error) {
        console.warn("No se pudo reproducir la alarma:", error);
      }
    };

    reproducir();

    const intervalo = setInterval(reproducir, 5000);

    return () => clearInterval(intervalo);
  }, [activa, cantidadPendiente]);

  useEffect(() => {
    return () => {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
    };
  }, []);
}
