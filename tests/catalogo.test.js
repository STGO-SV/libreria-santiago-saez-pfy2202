import assert from 'node:assert/strict'
import { after, afterEach, before, test } from 'node:test'
import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'
import { handlers } from '../src/mocks/handlers/index.js'
import { crearCatalogo } from '../src/services/catalogo.js'
import { obtenerJson } from '../src/services/http.js'

const origen = 'https://libreria.example'
const servidor = setupServer(...handlers)

before(() => servidor.listen({ onUnhandledFrame: 'error' }))
afterEach(() => servidor.resetHandlers())
after(() => servidor.close())

function comprobarEntidades(datos, campos) {
  const ids = new Set()
  for (const dato of datos) {
    for (const campo of campos) {
      assert.equal(typeof dato[campo], 'string')
      assert.ok(dato[campo].trim())
    }
    if (dato.descripcion !== undefined)
      assert.equal(typeof dato.descripcion, 'string')
    assert.ok(!ids.has(dato.id), `ID duplicado: ${dato.id}`)
    ids.add(dato.id)
  }
  return ids
}

test('el catálogo responde por HTTP con categorías y libros válidos y relacionados', async () => {
  const respuestas = await Promise.all(
    ['/api/categorias', '/api/libros'].map((ruta) => fetch(origen + ruta)),
  )
  for (const respuesta of respuestas) {
    assert.equal(respuesta.status, 200)
    assert.match(respuesta.headers.get('content-type'), /application\/json/)
  }
  const [categorias, libros] = await Promise.all(
    respuestas.map((respuesta) => respuesta.json()),
  )
  assert.ok(categorias.length >= 5)
  assert.ok(libros.length > 0)
  const ids = comprobarEntidades(categorias, ['id', 'nombre'])
  comprobarEntidades(libros, ['id', 'titulo', 'autor', 'categoriaId'])
  assert.ok(libros.every((libro) => ids.has(libro.categoriaId)))
})

test('las cargas del catálogo reutilizan categorías y listas y consultan el detalle por ID', async () => {
  const rutas = []
  const registrar = ({ request }) => {
    const url = new URL(request.url)
    rutas.push(url.pathname + url.search)
  }
  servidor.events.on('request:start', registrar)

  try {
    const catalogo = crearCatalogo(origen)
    assert.deepEqual(rutas, [])
    const consulta = catalogo.categorias.cargar()
    assert.equal(catalogo.categorias.cargar(), consulta)
    const { datos: categorias } = await consulta
    const categoria = categorias.find(({ id }) => id === 'ciencia-ficcion')
    assert.equal(categoria.nombre, 'Ciencia Ficción')

    const lista = catalogo.librosPorCategoria(categoria.id)
    const { datos: libros } = await lista.cargar()
    assert.ok(
      libros.length > 0 &&
        libros.every(({ categoriaId }) => categoriaId === categoria.id),
    )
    const { datos: libro } = await catalogo.libro(libros[0].id).cargar()
    assert.deepEqual(libro, libros[0])
    await catalogo.categorias.cargar()
    await catalogo.librosPorCategoria(categoria.id).cargar()

    assert.deepEqual(rutas, [
      '/api/categorias',
      '/api/libros?categoriaId=ciencia-ficcion',
      `/api/libros/${libro.id}`,
    ])
  } finally {
    servidor.events.removeListener('request:start', registrar)
  }
})

test('una categoría sin libros devuelve una lista vacía y los IDs desconocidos devuelven 404', async () => {
  const catalogo = crearCatalogo(origen)
  assert.deepEqual(await catalogo.librosPorCategoria('poesia').cargar(), {
    fase: 'lista',
    datos: [],
  })
  for (const ruta of [
    '/api/libros?categoriaId=desconocida',
    '/api/libros/no-existe',
  ]) {
    await assert.rejects(obtenerJson(origen + ruta), {
      tipo: 'http',
      status: 404,
    })
  }
})

test('el reintento explícito recupera una carga de categorías tras fallos HTTP, de red y JSON', async () => {
  const casos = [
    ['http', new HttpResponse(null, { status: 503 })],
    ['red', HttpResponse.error()],
    [
      'json',
      new HttpResponse('{', {
        headers: { 'Content-Type': 'application/json' },
      }),
    ],
  ]

  for (const [tipo, respuesta] of casos) {
    let peticiones = 0
    const contar = ({ request }) => {
      if (request.url === origen + '/api/categorias') peticiones++
    }
    servidor.events.on('request:start', contar)
    servidor.use(http.get(origen + '/api/categorias', () => respuesta))

    const { categorias } = crearCatalogo(origen)
    const fases = []
    const salir = categorias.observar(() =>
      fases.push(categorias.obtenerEstado().fase),
    )
    try {
      const resultado = await categorias.cargar()
      assert.equal(resultado.fase, 'error')
      assert.equal(resultado.error.tipo, tipo)
      if (tipo === 'http') assert.equal(resultado.error.status, 503)
      assert.equal(peticiones, 1)
      servidor.resetHandlers()
      const reintento = categorias.cargar()
      assert.equal(categorias.cargar(), reintento)
      const recuperacion = await reintento
      assert.equal(recuperacion.fase, 'lista')
      assert.ok(recuperacion.datos.length > 0)
      assert.equal(peticiones, 2)
      assert.deepEqual(fases, ['cargando', 'error', 'cargando', 'lista'])
    } finally {
      salir()
      servidor.resetHandlers()
      servidor.events.removeListener('request:start', contar)
    }
  }
})

test(
  'volver a suscribirse en el mismo ciclo evita duplicados y salir cancela la carga anterior',
  { timeout: 4000 },
  async () => {
    const interceptada = Promise.withResolvers()
    const liberar = Promise.withResolvers()
    let intentos = 0
    servidor.use(
      http.get(origen + '/api/libros', async ({ request }) => {
        if (
          new URL(request.url).searchParams.get('categoriaId') !==
          'ciencia-ficcion'
        )
          return
        intentos++
        interceptada.resolve(request.signal)
        await liberar.promise
        return HttpResponse.json([])
      }),
    )

    const catalogo = crearCatalogo(origen)
    const anterior = catalogo.librosPorCategoria('ciencia-ficcion')
    const escuchar = () => {}
    anterior.observar(escuchar)()
    const salir = anterior.observar(escuchar)
    const cargaAnterior = anterior.cargar()
    try {
      const signal = await interceptada.promise
      assert.equal(anterior.obtenerEstado().fase, 'cargando')
      assert.equal(intentos, 1)
      salir()
      const nueva = await catalogo.librosPorCategoria('infantil').cargar()
      assert.ok(
        nueva.datos.every(({ categoriaId }) => categoriaId === 'infantil'),
      )
      assert.ok(nueva.datos.length > 0)
      assert.ok(signal.aborted)
      assert.deepEqual(await cargaAnterior, { fase: 'cancelada' })
      assert.equal(anterior.obtenerEstado().fase, 'inicial')
    } finally {
      salir()
      liberar.resolve()
    }
  },
)

test('el catálogo rechaza JSON válido con forma incorrecta y se recupera con un nuevo GET', async () => {
  const casos = [
    ['/api/categorias', (catalogo) => catalogo.categorias, { categorias: [] }],
    [
      '/api/libros',
      (catalogo) => catalogo.librosPorCategoria('ficcion'),
      [{ id: 'libro', titulo: 'Incompleto', autor: 'Autor' }],
    ],
    ['/api/libros/dune', (catalogo) => catalogo.libro('dune'), null],
  ]

  for (const [ruta, obtenerCarga, cuerpo] of casos) {
    let fallos = 0
    servidor.use(
      http.get(origen + ruta, () => {
        fallos++
        return HttpResponse.json(cuerpo)
      }),
    )
    const carga = obtenerCarga(crearCatalogo(origen))
    const resultado = await carga.cargar()
    assert.equal(resultado.fase, 'error')
    assert.equal(resultado.error.tipo, 'json')
    assert.equal(fallos, 1)
    servidor.resetHandlers()
    assert.equal((await carga.cargar()).fase, 'lista')
  }
})

test(
  'un reintento demorado se comparte y se cancela al abandonar la vista',
  { timeout: 4000 },
  async () => {
    const interceptada = Promise.withResolvers()
    const liberar = Promise.withResolvers()
    const respuestas = []
    const url = origen + '/api/libros'
    servidor.use(
      http.get(url, async ({ request }) => {
        const categoriaId = new URL(request.url).searchParams.get('categoriaId')
        respuestas.push(categoriaId)
        if (categoriaId !== 'ficcion') return
        if (respuestas.length === 1)
          return new HttpResponse(null, { status: 503 })
        interceptada.resolve(request.signal)
        await liberar.promise
        return HttpResponse.json([])
      }),
    )

    const catalogo = crearCatalogo(origen)
    const lista = catalogo.librosPorCategoria('ficcion')
    const fases = []
    const salir = lista.observar(() => fases.push(lista.obtenerEstado().fase))
    try {
      const fallo = await lista.cargar()
      assert.equal(fallo.error.status, 503)
      const reintento = lista.cargar()
      assert.equal(lista.cargar(), reintento)
      const signal = await interceptada.promise
      assert.deepEqual(fases, ['cargando', 'error', 'cargando'])

      salir()
      const vigente = await catalogo.librosPorCategoria('infantil').cargar()
      assert.equal(vigente.fase, 'lista')
      assert.ok(vigente.datos.length > 0)
      assert.ok(
        vigente.datos.every(({ categoriaId }) => categoriaId === 'infantil'),
      )
      assert.ok(signal.aborted)
      liberar.resolve()
      assert.deepEqual(await reintento, { fase: 'cancelada' })
      assert.deepEqual(lista.obtenerEstado(), { fase: 'inicial' })
      assert.deepEqual(fases, ['cargando', 'error', 'cargando'])
      assert.deepEqual(respuestas, ['ficcion', 'ficcion', 'infantil'])
    } finally {
      salir()
      liberar.resolve()
    }
  },
)
