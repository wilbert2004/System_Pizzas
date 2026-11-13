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
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const opciones = [
  { nombre: "Tablero", ruta: "/tablero", icono: LayoutDashboard },
  { nombre: "Punto de venta", ruta: "/punto-venta", icono: ShoppingCart },
  { nombre: "Pedidos", ruta: "/pedidos", icono: ClipboardList },
  { nombre: "Cocina", ruta: "/cocina", icono: ChefHat },
  { nombre: "Clientes", ruta: "/clientes", icono: Users },
  { nombre: "Productos", ruta: "/productos", icono: Pizza },
  { nombre: "Publicidad", ruta: "/publicidad", icono: MonitorPlay },
  { nombre: "Caja", ruta: "/caja", icono: Wallet },
  { nombre: "Reportes", ruta: "/reportes", icono: ChartNoAxesCombined },
  { nombre: "Usuarios", ruta: "/usuarios", icono: UserCog },
  { nombre: "Configuración", ruta: "/configuracion", icono: Settings },
];

function BarraLateral() {
  return (
    <aside className="flex h-full w-64 min-w-64 flex-col bg-slate-950 text-white">
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-wide">PIZZERÍA</h1>
          <p className="text-xs text-slate-400">Sistema de gestión</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {opciones.map((opcion) => {
          const Icono = opcion.icono;

          return (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              end={opcion.ruta === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icono size={19} />
              <span>{opcion.nombre}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 text-sm text-slate-400 hover:text-white">
          <LogOut size={19} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default BarraLateral;
