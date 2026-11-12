import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { createServer } from 'vite'

let vite
let App
let vistas

before(async () => {
  vite = await createServer({ server: { middlewareMode: true } })
  const modulo = await vite.ssrLoadModule('/src/App.jsx')
  App = modulo.default
  vistas = await Promise.all(
    [
      ['categorias', 'Categorias'],
      ['categorias/:id', 'LibrosCategoria'],
      ['libros/:id', 'DetalleLibro'],
    ].map(async ([ruta, pagina]) => [
      ruta,
      (await vite.ssrLoadModule(`/src/pages/${pagina}.jsx`)).default,
    ]),
  )
})

after(async () => {
  await vite?.close()
})

function renderizar(ruta) {
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [ruta] }, createElement(App)),
  )
}

test('inicio presenta navegación activa y un acceso a categorías', () => {
  const html = renderizar('/')
  assert.match(html, /<h1 id="titulo-inicio">Librería<\/h1>/)
  assert.match(html, /<a aria-current="page"[^>]*href="\/"[^>]*>Inicio<\/a>/)
  assert.match(html, /href="\/categorias"[^>]*>Ir a categorías<\/a>/)
})

test('categorías marca el enlace activo y presenta su estado inicial de carga', () => {
  const html = renderizar('/categorias')
  assert.match(html, /<h1 id="titulo-categorias">Categorías<\/h1>/)
  assert.match(
    html,
    /aria-current="page"[^>]*href="\/categorias"[^>]*>Categorías/,
  )
  assert.match(html, /role="status">Cargando/)
})

test('una ruta desconocida ofrece regresar al inicio', () => {
  const html = renderizar('/ruta-desconocida')
  assert.match(html, /<h1 id="titulo-404">Página no encontrada<\/h1>/)
  assert.match(html, /href="\/"[^>]*>Volver al inicio/)
  assert.doesNotMatch(html, /aria-current="page"/)
})

test('todas las rutas comparten navegación, salto y destino enfocable', () => {
  for (const ruta of [
    '/',
    '/categorias',
    '/categorias/ficcion',
    '/libros/dune',
    '/ruta-desconocida',
  ]) {
    const html = renderizar(ruta)
    assert.match(html, /<header\b/)
    assert.match(html, /<nav aria-label="Navegación principal">/)
    assert.match(html, /href="#contenido-principal">Saltar al contenido/)
    assert.match(html, /<main[^>]*id="contenido-principal"[^>]*tabindex="-1"/)
  }
})

test('Vite transforma el punto de entrada de la aplicación en desarrollo', async () => {
  const modulo = await vite.transformRequest('/src/main.jsx')
  assert.ok(modulo?.code)
})

function renderizarCatalogo(ruta, contexto) {
  const layout = createElement(Outlet, { context: contexto })
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [ruta] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          { element: layout },
          ...vistas.map(([path, Vista]) =>
            createElement(Route, {
              key: path,
              path,
              element: createElement(Vista),
            }),
          ),
        ),
      ),
    ),
  )
}

const cargaEstatica = (estado) => ({
  obtenerEstado: () => estado,
  observar: () => () => {},
  cargar: () => {},
})

test('las vistas enlazan categorías, libros y detalle con los datos de las cargas', () => {
  const categoria = { id: 'ficcion', nombre: 'Ficción' }
  const libro = {
    id: 'ejemplo',
    titulo: 'Título de prueba',
    autor: 'Autora de prueba',
    categoriaId: 'ficcion',
    descripcion: 'Reseña breve',
  }
  const contexto = {
    categorias: cargaEstatica({ fase: 'lista', datos: [categoria] }),
    librosPorCategoria: (id) => {
      assert.equal(id, categoria.id)
      return cargaEstatica({ fase: 'lista', datos: [libro] })
    },
    libro: (id) => {
      assert.equal(id, libro.id)
      return cargaEstatica({ fase: 'lista', datos: libro })
    },
  }

  assert.match(
    renderizarCatalogo('/categorias', contexto),
    /href="\/categorias\/ficcion"[^>]*>Ficción/,
  )
  assert.match(
    renderizarCatalogo('/categorias/ficcion', contexto),
    /href="\/libros\/ejemplo"[^>]*>Título de prueba/,
  )
  const ficha = renderizarCatalogo('/libros/ejemplo', contexto)
  assert.match(ficha, /<h1 id="titulo-libro">Título de prueba<\/h1>/)
  assert.match(ficha, /Autor: Autora de prueba/)
  assert.match(ficha, /Categoría: Ficción/)
  assert.match(ficha, /Reseña breve/)
})

test('las vistas distinguen vacíos, recursos inexistentes y errores recuperables', () => {
  const vacio = cargaEstatica({ fase: 'lista', datos: [] })
  const categorias = cargaEstatica({
    fase: 'lista',
    datos: [{ id: 'poesia', nombre: 'Poesía' }],
  })
  const contexto = {
    categorias,
    librosPorCategoria: () => vacio,
    libro: () => cargaEstatica({ fase: 'error', error: { status: 404 } }),
  }
  assert.match(
    renderizarCatalogo('/categorias', { categorias: vacio }),
    /role="status">No hay categorías/,
  )
  assert.match(
    renderizarCatalogo('/categorias/poesia', contexto),
    /role="status">Esta categoría aún no tiene libros/,
  )
  assert.match(
    renderizarCatalogo('/categorias/inexistente', contexto),
    /role="alert">No se encontró la categoría/,
  )
  const inexistente = renderizarCatalogo('/libros/inexistente', contexto)
  assert.match(inexistente, /role="alert">No se encontró el libro/)
  assert.doesNotMatch(inexistente, /Reintentar/)
  const fallo = cargaEstatica({
    fase: 'error',
    error: { tipo: 'http', status: 503 },
  })
  const recuperable = renderizarCatalogo('/categorias', { categorias: fallo })
  assert.match(
    recuperable,
    /role="alert">El servicio no pudo completar la solicitud/,
  )
  assert.match(recuperable, /<button[^>]*>Reintentar<\/button>/)
})
