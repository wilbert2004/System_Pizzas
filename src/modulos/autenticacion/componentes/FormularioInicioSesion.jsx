import { useState } from "react";
import CampoContrasena from "./CampoContrasena.jsx";
import { validarCredenciales } from "../validaciones/esquemas.js";

export default function FormularioInicioSesion({ onIngresar }) {
  const [datos, setDatos] = useState({
    usuario: "",
    contrasena: "",
  });

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();

    const validaciones = validarCredenciales(datos);
    setErrores(validaciones);
    setErrorGeneral("");

    if (Object.keys(validaciones).length) return;

    try {
      setCargando(true);
      await onIngresar(datos);
    } catch (error) {
      setErrorGeneral(error.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Usuario
        </label>

        <input
          value={datos.usuario}
          onChange={(e) => setDatos({ ...datos, usuario: e.target.value })}
          autoComplete="username"
          placeholder="Tu nombre de usuario"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />

        {errores.usuario && (
          <p className="mt-1 text-sm text-red-500">{errores.usuario}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Contraseña
        </label>

        <CampoContrasena
          value={datos.contrasena}
          onChange={(contrasena) => setDatos({ ...datos, contrasena })}
        />

        {errores.contrasena && (
          <p className="mt-1 text-sm text-red-500">{errores.contrasena}</p>
        )}
      </div>

      {errorGeneral && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errorGeneral}
        </div>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
      >
        {cargando ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
