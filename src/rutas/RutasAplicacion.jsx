import { HashRouter, Routes, Route } from "react-router-dom";

import InicioSesion from "../modulos/autenticacion/paginas/InicioSesion";
import DisenoPrincipal from "../disenos/principal/DisenoPrincipal";

import Tablero from "../modulos/tablero/paginas/Pagina";
import PuntoVenta from "../modulos/punto-venta/paginas/Pagina";
import Pedidos from "../modulos/pedidos/paginas/Pagina";
import Cocina from "../modulos/cocina/paginas/Pagina";
import Clientes from "../modulos/clientes/paginas/Pagina";
import Productos from "../modulos/productos/paginas/Pagina";
import Publicidad from "../modulos/publicidad/paginas/Pagina";
import Caja from "../modulos/caja/paginas/Pagina";
import Reportes from "../modulos/reportes/paginas/Pagina";
import Usuarios from "../modulos/usuarios/paginas/Pagina";
import Configuracion from "../modulos/configuracion/paginas/Pagina";
import PantallaTV from "../disenos/pantalla-tv/PantallaTV";
//importamos rutas protegidas
import RutaProtegida from "../compartidos/componentes/RutaProtegida.jsx";

function RutasAplicacion() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<InicioSesion />} />
        <Route element={<RutaProtegida />}>
          <Route path="/pantalla-tv" element={<PantallaTV />} />

          <Route element={<DisenoPrincipal />}>
            <Route path="/tablero" element={<Tablero />} />
            <Route path="/punto-venta" element={<PuntoVenta />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/cocina" element={<Cocina />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/publicidad" element={<Publicidad />} />
            <Route path="/caja" element={<Caja />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default RutasAplicacion;
