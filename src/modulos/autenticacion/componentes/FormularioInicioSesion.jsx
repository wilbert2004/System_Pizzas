import { useState } from "react";
import { KeyRound, LoaderCircle, UserRound } from "lucide-react";
import CampoContrasena from "./CampoContrasena.jsx";
import { validarCredenciales } from "../validaciones/esquemas.js";
import { servicioAutenticacion } from "../servicios/autenticacion.js";

export default function FormularioInicioSesion({ onIngresar }) {
  const [datos, setDatos] = useState({
    usuario: "",
    contrasena: "",
  });

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [etapaRecuperacion, setEtapaRecuperacion] = useState("solicitar");
  const [nombreRecuperacion, setNombreRecuperacion] = useState("");
  const [usuarioAdministrador, setUsuarioAdministrador] = useState("");
  const [contrasenaAdministrador, setContrasenaAdministrador] = useState("");
  const [tokenRecuperacion, setTokenRecuperacion] = useState(null);
  const [tokenIngresado, setTokenIngresado] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [confirmarContrasenaNueva, setConfirmarContrasenaNueva] = useState("");
  const [avisoGeneral, setAvisoGeneral] = useState("");

  async function enviar(e) {
    e.preventDefault();

    const validaciones = validarCredenciales(datos);
    setErrores(validaciones);
    setErrorGeneral("");
    setAvisoGeneral("");

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

  async function solicitarToken() {
    setCargando(true); setErrorGeneral(""); setAvisoGeneral("");
    try {
      const resultado = await servicioAutenticacion.solicitarTokenRecuperacion({ nombre: nombreRecuperacion, usuarioAdministrador, contrasenaAdministrador });
      setTokenRecuperacion(resultado); setEtapaRecuperacion("cambiar"); setContrasenaAdministrador("");
    } catch (error) { setErrorGeneral(error.message || "No se pudo autorizar la recuperación."); }
    finally { setCargando(false); }
  }

  async function cambiarConToken() {
    setErrorGeneral(""); setAvisoGeneral("");
    if (contrasenaNueva.length < 8) return setErrorGeneral("La contraseña debe tener al menos 8 caracteres.");
    if (contrasenaNueva !== confirmarContrasenaNueva) return setErrorGeneral("Las contraseñas no coinciden.");
    setCargando(true);
    try {
      await servicioAutenticacion.restablecerConToken({ token: tokenIngresado, contrasenaNueva });
      setAvisoGeneral("Contraseña actualizada. Ya puedes iniciar sesión."); setMostrarAyuda(false); setEtapaRecuperacion("solicitar"); setTokenRecuperacion(null); setTokenIngresado(""); setContrasenaNueva(""); setConfirmarContrasenaNueva("");
    } catch (error) { setErrorGeneral(error.message || "No se pudo cambiar la contraseña."); }
    finally { setCargando(false); }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
          Usuario
        </label>

        <div className="relative">
          <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={datos.usuario}
            onChange={(e) => setDatos({ ...datos, usuario: e.target.value })}
            autoComplete="username"
            placeholder="Tu nombre de usuario"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100/70"
          />
        </div>

        {errores.usuario && (
          <p className="mt-1 text-sm text-red-500">{errores.usuario}</p>
        )}
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          <KeyRound size={14} className="text-slate-400" />
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
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {errorGeneral}
        </div>
      )}
      {avisoGeneral && <div role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">{avisoGeneral}</div>}

      <button
        type="submit"
        disabled={cargando}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:-translate-y-0.5 hover:from-violet-800 hover:to-violet-700 disabled:translate-y-0 disabled:opacity-60"
      >
        {cargando && <LoaderCircle size={17} className="animate-spin" />}
        {cargando ? "Ingresando…" : "Entrar al sistema"}
      </button>

      <button
        type="button"
        onClick={() => setMostrarAyuda(!mostrarAyuda)}
        className="w-full text-sm font-semibold text-slate-500 transition hover:text-violet-700"
      >
        ¿Olvidaste tu contraseña?
      </button>

      {mostrarAyuda && <section className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/80 p-4">
        {etapaRecuperacion === "solicitar" ? <>
          <p className="text-sm leading-5 text-violet-900">Escribe tu nombre o usuario. Un administrador debe autorizar la recuperación con su cuenta.</p>
          <input value={nombreRecuperacion} onChange={(e) => setNombreRecuperacion(e.target.value)} placeholder="Tu nombre completo o usuario" className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm" />
          <input value={usuarioAdministrador} onChange={(e) => setUsuarioAdministrador(e.target.value)} placeholder="Usuario del administrador" autoComplete="username" className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm" />
          <input value={contrasenaAdministrador} onChange={(e) => setContrasenaAdministrador(e.target.value)} placeholder="Contraseña del administrador" type="password" autoComplete="current-password" className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm" />
          <button type="button" disabled={cargando} onClick={solicitarToken} className="w-full rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{cargando ? "Validando…" : "Autorizar y generar token"}</button>
        </> : <>
          <p className="text-sm leading-5 text-violet-900">El administrador autorizó el cambio de <strong>{tokenRecuperacion?.nombre}</strong>. El token vence en 10 minutos.</p>
          <div className="rounded-lg border border-violet-200 bg-white p-3 text-center"><span className="block text-[10px] font-bold uppercase tracking-wide text-violet-500">Token de un solo uso</span><code className="mt-1 block break-all font-mono text-lg font-black tracking-[0.15em] text-violet-900">{tokenRecuperacion?.token}</code></div>
          <label className="block text-xs font-bold uppercase tracking-wide text-violet-900">Token autorizado<input value={tokenIngresado} onChange={(e) => setTokenIngresado(e.target.value)} placeholder="Pega el token mostrado al autorizar" className="mt-2 w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 font-mono text-sm" /></label>
          <input value={contrasenaNueva} onChange={(e) => setContrasenaNueva(e.target.value)} placeholder="Nueva contraseña (mínimo 8)" type="password" autoComplete="new-password" className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm" />
          <input value={confirmarContrasenaNueva} onChange={(e) => setConfirmarContrasenaNueva(e.target.value)} placeholder="Confirmar contraseña" type="password" autoComplete="new-password" className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm" />
          <button type="button" disabled={cargando} onClick={cambiarConToken} className="w-full rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Cambiar contraseña</button>
        </>}
      </section>}
    </form>
  );
}
