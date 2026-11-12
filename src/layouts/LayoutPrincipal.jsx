import { useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { crearCatalogo } from '../services/catalogo.js'

export default function LayoutPrincipal() {
  const contenido = useRef(null)
  const [catalogo] = useState(crearCatalogo)

  function enfocarContenido(evento) {
    if (!contenido.current) return
    evento.preventDefault()
    contenido.current.focus()
  }

  return (
    <>
      <a
        className="salto"
        href="#contenido-principal"
        onClick={enfocarContenido}
      >
        Saltar al contenido
      </a>
      <header className="encabezado">
        <div className="contenedor barra">
          <Link className="marca" to="/" aria-label="Librería, inicio">
            Librería
          </Link>
          <nav aria-label="Navegación principal">
            <ul className="menu">
              <li>
                <NavLink to="/" end>
                  Inicio
                </NavLink>
              </li>
              <li>
                <NavLink to="/categorias">Categorías</NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main
        className="contenedor contenido"
        id="contenido-principal"
        ref={contenido}
        tabIndex={-1}
      >
        <Outlet context={catalogo} />
      </main>
    </>
  )
}
