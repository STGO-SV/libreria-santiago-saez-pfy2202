import { http, HttpResponse } from 'msw/http'
import { categorias, libros } from '../data/catalogo.js'

export const handlersCatalogo = [
  http.get('*/api/categorias', () => HttpResponse.json(categorias)),
  http.get('*/api/libros', ({ request }) => {
    const categoriaId = new URL(request.url).searchParams.get('categoriaId')
    if (categoriaId === null) return HttpResponse.json(libros)
    if (!categorias.some(({ id }) => id === categoriaId)) {
      return HttpResponse.json(
        { error: 'Categoría inexistente' },
        { status: 404 },
      )
    }
    return HttpResponse.json(
      libros.filter((libro) => libro.categoriaId === categoriaId),
    )
  }),
  http.get('*/api/libros/:id', ({ params }) => {
    const libro = libros.find(({ id }) => id === params.id)
    return libro
      ? HttpResponse.json(libro)
      : HttpResponse.json({ error: 'Libro inexistente' }, { status: 404 })
  }),
]
