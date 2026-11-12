import { Route, Routes } from 'react-router'
import LayoutPrincipal from './layouts/LayoutPrincipal.jsx'
import Categorias from './pages/Categorias.jsx'
import DetalleLibro from './pages/DetalleLibro.jsx'
import LibrosCategoria from './pages/LibrosCategoria.jsx'
import Inicio from './pages/Inicio.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutPrincipal />}>
        <Route index element={<Inicio />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="categorias/:id" element={<LibrosCategoria />} />
        <Route path="libros/:id" element={<DetalleLibro />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
