import { HashRouter, Routes, Route } from "react-router-dom";

import InicioSesion from "../modulos/autenticacion/paginas/InicioSesion";
import DisenoPrincipal from "../disenos/principal/DisenoPrincipal";

import Tablero from "../modulos/tablero/paginas/Pagina";
import PaginaPedidos from "../modulos/pedidos/paginas/Pagina.jsx";
import Caja from "../modulos/caja/paginas/Pagina";
import Reportes from "../modulos/reportes/paginas/Pagina";
import Usuarios from "../modulos/usuarios/paginas/Pagina";
import Configuracion from "../modulos/configuracion/paginas/Pagina";
//importamos rutas protegidas
import RutaProtegida from "../compartidos/componentes/RutaProtegida.jsx";
import PaginaProductos from "../modulos/productos/paginas/Pagina.jsx";
import PaginaClientes from "../modulos/clientes/paginas/Pagina.jsx";
import PaginaPuntoVenta from "../modulos/punto-venta/paginas/Pagina.jsx";
import PaginaCocina from "../modulos/cocina/paginas/Pagina";
import PaginaTV from "../modulos/television/paginas/PaginaTV";
import PaginaPublicidad from "../modulos/television/paginas/PaginaPublicidad";

function RutasAplicacion() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<InicioSesion />} />
        <Route path="/pantalla-tv" element={<PaginaTV />} />
        <Route element={<RutaProtegida />}>
          <Route element={<DisenoPrincipal />}>
            <Route path="/tablero" element={<Tablero />} />
            <Route path="/punto-venta" element={<PaginaPuntoVenta />} />
            <Route path="/pedidos" element={<PaginaPedidos />} />
            <Route path="/cocina" element={<PaginaCocina />} />
            <Route path="/clientes" element={<PaginaClientes />} />
            <Route path="/productos" element={<PaginaProductos />} />
            <Route path="/publicidad" element={<PaginaPublicidad />} />
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
