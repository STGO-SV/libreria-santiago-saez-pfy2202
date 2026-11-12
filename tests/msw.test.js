import assert from 'node:assert/strict'
import { after, afterEach, before, test } from 'node:test'
import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'
import { handlers, rutaDiagnostico } from '../src/mocks/handlers/index.js'
import { obtenerJson } from '../src/services/http.js'

const url = new URL(rutaDiagnostico, 'https://libreria.example').href
const servidor = setupServer(...handlers)

before(() => servidor.listen({ onUnhandledFrame: 'error' }))
afterEach(() => servidor.resetHandlers())
after(() => servidor.close())

test('MSW intercepta el GET de diagnóstico mediante el handler compartido', async () => {
  assert.deepEqual(await obtenerJson(url), { disponible: true, origen: 'msw' })
})

test('MSW devuelve un error HTTP 503 para el GET de diagnóstico', async () => {
  servidor.use(http.get(url, () => new HttpResponse(null, { status: 503 })))

  await assert.rejects(obtenerJson(url), {
    name: 'ErrorPeticion',
    tipo: 'http',
    status: 503,
  })
})

test('MSW simula un error de red para el GET de diagnóstico', async () => {
  servidor.use(http.get(url, () => HttpResponse.error()))

  await assert.rejects(obtenerJson(url), {
    name: 'ErrorPeticion',
    tipo: 'red',
  })
})

test(
  'se puede cancelar el GET de diagnóstico una vez interceptado',
  { timeout: 3000 },
  async () => {
    const interceptada = Promise.withResolvers()
    const liberarRespuesta = Promise.withResolvers()
    servidor.use(
      http.get(url, async () => {
        interceptada.resolve()
        await liberarRespuesta.promise
        return HttpResponse.json({ disponible: true })
      }),
    )

    const controlador = new AbortController()
    const motivo = new DOMException('Diagnóstico cancelado', 'AbortError')
    const solicitud = obtenerJson(url, { signal: controlador.signal })
    const comprobacion = assert.rejects(solicitud, (error) => error === motivo)

    try {
      await Promise.race([interceptada.promise, solicitud])
      controlador.abort(motivo)
      await comprobacion
    } finally {
      liberarRespuesta.resolve()
    }
  },
)
