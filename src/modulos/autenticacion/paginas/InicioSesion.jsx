import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormularioInicioSesion from "../componentes/FormularioInicioSesion.jsx";
import ConfiguracionInicial from "./ConfiguracionInicial.jsx";
import { useEstadoAutenticacion } from "../estado/EstadoAutenticacion.js";

export default function InicioSesion() {
  const navigate = useNavigate();

  const [inicializado, setInicializado] = useState(false);
  const [necesitaAdministrador, setNecesitaAdministrador] = useState(false);
  const [error, setError] = useState("");

  const iniciarSesion = useEstadoAutenticacion(
    (estado) => estado.iniciarSesion,
  );

  async function comprobarEstado() {
    try {
      const estado = await window.sistema.autenticacion.estadoInicial();
      setNecesitaAdministrador(estado.necesitaAdministrador);

      useEstadoAutenticacion.setState({
        usuario: estado.sesion,
        necesitaAdministrador: estado.necesitaAdministrador,
        cargando: false,
      });

      if (estado.sesion) {
        navigate("/tablero", { replace: true });
      }
    } catch (error) {
      setError(error.message);
      useEstadoAutenticacion.setState({ cargando: false });
    } finally {
      setInicializado(true);
    }
  }

  useEffect(() => {
    comprobarEstado();
  }, []);

  async function ingresar(datos) {
    await iniciarSesion(datos);
    navigate("/tablero", { replace: true });
  }

  if (!inicializado) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Comprobando sistema...
      </div>
    );
  }

  if (necesitaAdministrador) {
    return (
      <ConfiguracionInicial
        onTerminar={async () => {
          setNecesitaAdministrador(false);
        }}
      />
    );
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="hidden items-center justify-center bg-gradient-to-br from-violet-800 to-violet-950 p-12 text-white lg:flex">
        <div className="max-w-md">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
            SG
          </div>

          <h1 className="text-4xl font-bold">Sistema de Gestión</h1>

          <p className="mt-4 text-lg text-violet-100">
            Administra tus pedidos, productos, clientes y operaciones desde un
            solo lugar.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-slate-900">Bienvenido</h2>

          <p className="mb-8 mt-2 text-slate-500">
            Ingresa tus credenciales para continuar.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <FormularioInicioSesion onIngresar={ingresar} />
        </div>
      </section>
    </main>
  );
}
