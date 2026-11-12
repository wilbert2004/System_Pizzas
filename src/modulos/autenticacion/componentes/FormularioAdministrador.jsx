import { useState } from "react";
import CampoContrasena from "./CampoContrasena.jsx";
import { validarAdministrador } from "../validaciones/esquemas.js";

export default function FormularioAdministrador({ onCrear }) {
  const [datos, setDatos] = useState({
    nombre: "",
    usuario: "",
    contrasena: "",
    confirmarContrasena: "",
  });

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();

    const validaciones = validarAdministrador(datos);
    setErrores(validaciones);
    setErrorGeneral("");

    if (Object.keys(validaciones).length) return;

    try {
      setCargando(true);
      await onCrear(datos);
    } catch (error) {
      setErrorGeneral(error.message || "No se pudo crear el administrador.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Nombre completo
        </label>
        <input
          value={datos.nombre}
          onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          placeholder="Nombre del administrador"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
        />
        {errores.nombre && (
          <p className="text-sm text-red-500">{errores.nombre}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Usuario</label>
        <input
          value={datos.usuario}
          onChange={(e) => setDatos({ ...datos, usuario: e.target.value })}
          placeholder="Nombre de usuario"
          autoComplete="username"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
        />
        {errores.usuario && (
          <p className="text-sm text-red-500">{errores.usuario}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Contraseña</label>
        <CampoContrasena
          value={datos.contrasena}
          onChange={(contrasena) => setDatos({ ...datos, contrasena })}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        {errores.contrasena && (
          <p className="text-sm text-red-500">{errores.contrasena}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Confirmar contraseña
        </label>
        <CampoContrasena
          value={datos.confirmarContrasena}
          onChange={(confirmarContrasena) =>
            setDatos({ ...datos, confirmarContrasena })
          }
          placeholder="Repite la contraseña"
          autoComplete="new-password"
        />
        {errores.confirmarContrasena && (
          <p className="text-sm text-red-500">{errores.confirmarContrasena}</p>
        )}
      </div>

      {errorGeneral && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errorGeneral}
        </div>
      )}

      <button
        disabled={cargando}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {cargando ? "Creando cuenta..." : "Crear administrador"}
      </button>
    </form>
  );
}
