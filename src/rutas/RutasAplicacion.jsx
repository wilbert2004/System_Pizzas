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
import RutaLicencia from "../compartidos/componentes/RutaLicencia.jsx";
import PaginaProductos from "../modulos/productos/paginas/Pagina.jsx";
import PaginaClientes from "../modulos/clientes/paginas/Pagina.jsx";
import PaginaPuntoVenta from "../modulos/punto-venta/paginas/Pagina.jsx";
import PaginaCocina from "../modulos/cocina/paginas/Pagina";
import PaginaTV from "../modulos/television/paginas/PaginaTV";
import PaginaPublicidad from "../modulos/television/paginas/PaginaPublicidad";
import PaginaLicencias from "../modulos/licencias/paginas/Pagina.jsx";
import PaginaRespaldos from "../modulos/respaldos/paginas/Pagina.jsx";
import PaginaProduccion from "../modulos/produccion/paginas/Pagina.jsx";
import PaginaProyeccionProduccion from "../modulos/produccion/paginas/PaginaProyeccion.jsx";
import DialogoCierreSistema from "../compartidos/componentes/DialogoCierreSistema.jsx";
import MotorCocinaGlobal from "../modulos/cocina/componentes/MotorCocinaGlobal.jsx";

function RutasAplicacion() {
  return (
    <HashRouter>
      <MotorCocinaGlobal />
      <DialogoCierreSistema />
      <Routes>
        <Route path="/" element={<InicioSesion />} />
        <Route element={<RutaLicencia />}>
          <Route path="/pantalla-tv" element={<PaginaTV />} />
          <Route path="/pantalla-produccion" element={<PaginaProyeccionProduccion />} />
          <Route element={<RutaProtegida />}>
            <Route element={<DisenoPrincipal />}>
              <Route path="/tablero" element={<Tablero />} />
              <Route path="/punto-venta" element={<PaginaPuntoVenta />} />
              <Route path="/pedidos" element={<PaginaPedidos />} />
              <Route path="/cocina" element={<PaginaCocina />} />
              <Route path="/produccion" element={<PaginaProduccion />} />
              <Route path="/clientes" element={<PaginaClientes />} />
              <Route path="/productos" element={<PaginaProductos />} />
              <Route path="/publicidad" element={<PaginaPublicidad />} />
              <Route path="/caja" element={<Caja />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/licencias" element={<PaginaLicencias />} />
              <Route path="/respaldos" element={<PaginaRespaldos />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default RutasAplicacion;
