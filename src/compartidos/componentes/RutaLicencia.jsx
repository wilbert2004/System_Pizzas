import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

export default function RutaLicencia() {
  const navigate = useNavigate();
  const [activa, setActiva] = useState(null);

  useEffect(() => {
    let vigente = true;
    const revisar = async () => {
      try {
        const estado = await window.sistema.licencias.estado();
        if (!vigente) return;
        setActiva(estado.activa);
        if (!estado.activa) navigate("/", { replace: true });
      } catch { if (vigente) setActiva(false); }
    };
    void revisar();
    const intervalo = setInterval(revisar, 30_000);
    return () => { vigente = false; clearInterval(intervalo); };
  }, [navigate]);

  if (activa === null) return <div className="flex min-h-screen items-center justify-center text-sm font-medium text-slate-500">Comprobando licencia…</div>;
  if (!activa) return <Navigate to="/" replace />;
  return <Outlet />;
}
