import { Link, useOutletContext } from 'react-router'
import EstadoCarga from '../components/EstadoCarga.jsx'
import { useCarga } from '../hooks/useCarga.js'

export default function Categorias() {
  const { categorias } = useOutletContext()
  const estado = useCarga(categorias)

  return (
    <section aria-labelledby="titulo-categorias">
      <h1 id="titulo-categorias">Categorías</h1>
      <EstadoCarga
        estado={estado}
        reintentar={categorias.cargar}
        inexistente="El listado de categorías no está disponible."
      >
        {(datos) =>
          datos.length === 0 ? (
            <p role="status">No hay categorías disponibles.</p>
          ) : (
            <ul className="catalogo">
              {datos.map(({ id, nombre, descripcion }) => (
                <li key={id}>
                  <h2>
                    <Link to={id}>{nombre}</Link>
                  </h2>
                  {descripcion && <p>{descripcion}</p>}
                </li>
              ))}
            </ul>
          )
        }
      </EstadoCarga>
    </section>
  )
}
