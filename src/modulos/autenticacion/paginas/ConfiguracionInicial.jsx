import FormularioAdministrador from "../componentes/FormularioAdministrador.jsx";
import { servicioAutenticacion } from "../servicios/autenticacion.js";

export default function ConfiguracionInicial({ onTerminar }) {
  async function crear(datos) {
    await servicioAutenticacion.crearAdministrador(datos);

    // Después de crearlo, regresamos al inicio de sesión.
    await onTerminar();
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <span className="text-xl font-bold">SG</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Configuración inicial
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Crea la cuenta del administrador principal del sistema.
          </p>
        </div>

        <FormularioAdministrador onCrear={crear} />
      </section>
    </main>
  );
}
