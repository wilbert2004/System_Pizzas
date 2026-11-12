import { Navigate, Outlet } from "react-router-dom";
import { useEstadoAutenticacion } from "../../modulos/autenticacion/estado/EstadoAutenticacion.js";

export default function RutaProtegida({ roles }) {
  const usuario = useEstadoAutenticacion((estado) => estado.usuario);
  const cargando = useEstadoAutenticacion((estado) => estado.cargando);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando sesión...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/tablero" replace />;
  }

  return <Outlet />;
}
