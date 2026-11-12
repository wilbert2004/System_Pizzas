import { useEffect, useState } from "react";

function Aplicacion() {
  const [version, setVersion] = useState("Consultando...");
  const [error, setError] = useState(
    window.sistema?.obtenerVersion
      ? ""
      : "No se pudo cargar la comunicación con Electron",
  );

  useEffect(() => {
    const obtenerVersion = window.sistema?.obtenerVersion;

    if (!obtenerVersion) {
      return;
    }

    obtenerVersion()
      .then(setVersion)
      .catch(() => {
        setError("No se pudo comunicar con Electron");
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <section className="bg-white rounded-2xl shadow-lg p-10 max-w-xl w-full text-center">
        <h1 className="text-3xl font-bold text-slate-800">
          Sistema de Gestión
        </h1>

        <p className="mt-3 text-slate-500">
          Aplicación de escritorio para pizzería
        </p>

        <div className="mt-8 rounded-xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Comunicación con Electron</p>

          <p className="mt-2 font-semibold text-green-700">
            {error || "Conexión establecida"}
          </p>

          <p className="mt-2 text-sm text-slate-600">Versión: {version}</p>
        </div>
      </section>
    </main>
  );
}

export default Aplicacion;
