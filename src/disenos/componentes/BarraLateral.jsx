import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Users,
  Pizza,
  MonitorPlay,
  Wallet,
  ChartNoAxesCombined,
  UserCog,
  Settings,
  KeyRound,
  ArchiveRestore,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useEstadoAutenticacion } from "../../modulos/autenticacion/estado/EstadoAutenticacion.js";

const opciones = [
  { nombre: "Tablero", ruta: "/tablero", icono: LayoutDashboard },
  { nombre: "Punto de venta", ruta: "/punto-venta", icono: ShoppingCart },
  { nombre: "Pedidos", ruta: "/pedidos", icono: ClipboardList },
  { nombre: "Cocina", ruta: "/cocina", icono: ChefHat },
  { nombre: "Producción", ruta: "/produccion", icono: MonitorPlay },
  { nombre: "Caja", ruta: "/caja", icono: Wallet },
  { nombre: "Productos", ruta: "/productos", icono: Pizza },
  { nombre: "Clientes", ruta: "/clientes", icono: Users },
  { nombre: "TV y publicidad", ruta: "/publicidad", icono: MonitorPlay },
  { nombre: "Reportes", ruta: "/reportes", icono: ChartNoAxesCombined },
  { nombre: "Usuarios", ruta: "/usuarios", icono: UserCog },
  { nombre: "Configuración", ruta: "/configuracion", icono: Settings },
  { nombre: "Respaldos", ruta: "/respaldos", icono: ArchiveRestore },
  { nombre: "Licencia", ruta: "/licencias", icono: KeyRound },
];

function BarraLateral({ onNavigate }) {
  const navigate = useNavigate();
  const usuario = useEstadoAutenticacion((estado) => estado.usuario);
  const cerrarSesion = useEstadoAutenticacion((estado) => estado.cerrarSesion);
  const [empresa, setEmpresa] = useState({ nombre_negocio: "Pizzería", telefono_negocio: "", logotipo_ruta: "" });

  useEffect(() => {
    let vigente = true;
    const cargar = () => window.sistema.configuracion.publica().then((datos) => { if (vigente) setEmpresa(datos); }).catch(() => {});
    cargar();
    const actualizar = (evento) => setEmpresa((actual) => ({ ...actual, ...evento.detail }));
    window.addEventListener("configuracion:actualizada", actualizar);
    return () => { vigente = false; window.removeEventListener("configuracion:actualizada", actualizar); };
  }, []);

  const logoUrl = empresa.logotipo_ruta
    ? `pizzeria-media://archivo?ruta=${encodeURIComponent(empresa.logotipo_ruta)}`
    : "";
  const opcionesVisibles = opciones.filter((opcion) =>
    usuario?.rol === "administrador" || !["/usuarios", "/configuracion", "/licencias", "/respaldos"].includes(opcion.ruta),
  );

  async function salir() {
    await cerrarSesion();
    navigate("/", { replace: true });
  }

  return (
    <aside className="flex h-full w-64 min-w-64 flex-col bg-slate-950 text-white">
      <div className="flex min-h-20 items-center gap-3 border-b border-slate-800 px-5 py-3">
        {logoUrl ? <img src={logoUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1" /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-lg font-black text-white">{(empresa.nombre_negocio || "P").slice(0, 1).toUpperCase()}</div>}
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-wide" title={empresa.nombre_negocio}>{empresa.nombre_negocio || "Pizzería"}</h1>
          <p className="truncate text-xs text-slate-400">{empresa.telefono_negocio || "Sistema de gestión"}</p>
        </div>
      </div>

      <nav aria-label="Menú principal" className="flex-1 space-y-1 overflow-y-auto p-3">
        {opcionesVisibles.map((opcion) => {
          const Icono = opcion.icono;
          return (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icono className="mt-0.5 shrink-0" size={19} />
              <span>{opcion.nombre}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button onClick={salir} className="flex items-center gap-3 text-sm text-slate-400 hover:text-white">
          <LogOut size={19} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default BarraLateral;
