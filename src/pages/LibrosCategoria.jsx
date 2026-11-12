import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router'
import EstadoCarga from '../components/EstadoCarga.jsx'
import { useCarga } from '../hooks/useCarga.js'

export default function LibrosCategoria() {
  const { id } = useParams()
  const catalogo = useOutletContext()
  const estado = useCarga(catalogo.categorias)
  const categoria = estado.datos?.find((dato) => dato.id === id)

  return (
    <section aria-labelledby="titulo-libros">
      <Link to="/categorias">Volver a categorías</Link>
      <h1 id="titulo-libros">{categoria?.nombre ?? 'Libros por categoría'}</h1>
      <EstadoCarga
        estado={estado}
        reintentar={catalogo.categorias.cargar}
        inexistente="No se encontró el listado de categorías."
      >
        {() =>
          categoria ? (
            <ListaLibros key={id} id={id} catalogo={catalogo} />
          ) : (
            <p role="alert">No se encontró la categoría.</p>
          )
        }
      </EstadoCarga>
    </section>
  )
}

function ListaLibros({ id, catalogo }) {
  const [carga] = useState(() => catalogo.librosPorCategoria(id))
  const estado = useCarga(carga)

  return (
    <EstadoCarga
      estado={estado}
      reintentar={carga.cargar}
      inexistente="No se encontró la categoría."
    >
      {(libros) =>
        libros.length === 0 ? (
          <p role="status">Esta categoría aún no tiene libros.</p>
        ) : (
          <ul className="catalogo">
            {libros.map(({ id, titulo, autor }) => (
              <li key={id}>
                <h2>
                  <Link to={`/libros/${encodeURIComponent(id)}`}>{titulo}</Link>
                </h2>
                <p>{autor}</p>
              </li>
            ))}
          </ul>
        )
      }
    </EstadoCarga>
  )
}
