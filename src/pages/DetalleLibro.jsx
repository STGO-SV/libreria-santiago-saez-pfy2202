import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router'
import EstadoCarga from '../components/EstadoCarga.jsx'
import { useCarga } from '../hooks/useCarga.js'

export default function DetalleLibro() {
  const { id } = useParams()
  const catalogo = useOutletContext()
  return <Ficha key={id} id={id} catalogo={catalogo} />
}

function Ficha({ id, catalogo }) {
  const [carga] = useState(() => catalogo.libro(id))
  const estado = useCarga(carga)
  const libro = estado.datos

  return (
    <section aria-labelledby="titulo-libro">
      <Link
        to={
          libro
            ? `/categorias/${encodeURIComponent(libro.categoriaId)}`
            : '/categorias'
        }
      >
        {libro ? 'Volver a los libros de la categoría' : 'Volver a categorías'}
      </Link>
      <h1 id="titulo-libro">{libro?.titulo ?? 'Detalle del libro'}</h1>
      <EstadoCarga
        estado={estado}
        reintentar={carga.cargar}
        inexistente="No se encontró el libro."
      >
        {({ autor, descripcion, categoriaId }) => (
          <>
            <p>Autor: {autor}</p>
            {descripcion && <p>{descripcion}</p>}
            <CategoriaLibro carga={catalogo.categorias} id={categoriaId} />
          </>
        )}
      </EstadoCarga>
    </section>
  )
}

function CategoriaLibro({ carga, id }) {
  const estado = useCarga(carga)
  return (
    <EstadoCarga
      estado={estado}
      reintentar={carga.cargar}
      inexistente="No se pudo identificar la categoría."
    >
      {(categorias) => {
        const categoria = categorias.find((dato) => dato.id === id)
        return categoria ? (
          <p>Categoría: {categoria.nombre}</p>
        ) : (
          <p role="alert">No se encontró la categoría.</p>
        )
      }}
    </EstadoCarga>
  )
}
