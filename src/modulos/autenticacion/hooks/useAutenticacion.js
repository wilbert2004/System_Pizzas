import { useEstadoAutenticacion } from "../estado/EstadoAutenticacion.js";

export function useAutenticacion() {
  const usuario = useEstadoAutenticacion((estado) => estado.usuario);
  const cargando = useEstadoAutenticacion((estado) => estado.cargando);
  const iniciarSesion = useEstadoAutenticacion(
    (estado) => estado.iniciarSesion,
  );
  const cerrarSesion = useEstadoAutenticacion((estado) => estado.cerrarSesion);

  return {
    usuario,
    cargando,
    autenticado: Boolean(usuario),
    esAdministrador: usuario?.rol === "administrador",
    esEmpleado: usuario?.rol === "empleado",
    iniciarSesion,
    cerrarSesion,
  };
}
