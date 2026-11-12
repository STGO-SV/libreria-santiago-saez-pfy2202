import assert from 'node:assert/strict'
import { test } from 'node:test'
import { crearCarga } from '../src/services/carga.js'
import { ErrorPeticion, obtenerJson } from '../src/services/http.js'

test('el cliente HTTP lee JSON mediante fetch', async () => {
  const datos = await obtenerJson('data:application/json,%7B%22ok%22%3Atrue%7D')
  assert.deepEqual(datos, { ok: true })
})

test('el cliente HTTP distingue errores HTTP, JSON, red y aborto', async (t) => {
  const url = 'https://libreria.example/api/prueba'
  const solicitar = t.mock.method(
    globalThis,
    'fetch',
    async (_, { signal }) => {
      signal?.throwIfAborted()
      return new Response('{}', { status: 503 })
    },
  )

  await assert.rejects(obtenerJson(url), {
    name: 'ErrorPeticion',
    tipo: 'http',
    status: 503,
  })
  assert.equal(
    solicitar.mock.calls[0].arguments[1].headers.Accept,
    'application/json',
  )

  solicitar.mock.mockImplementationOnce(async () => new Response('{'))
  await assert.rejects(obtenerJson(url), {
    name: 'ErrorPeticion',
    tipo: 'json',
  })

  solicitar.mock.mockImplementationOnce(async () => {
    throw new TypeError('Conexión de prueba interrumpida')
  })
  await assert.rejects(obtenerJson(url), {
    name: 'ErrorPeticion',
    tipo: 'red',
  })

  const motivo = new DOMException('Solicitud cancelada', 'AbortError')
  await assert.rejects(
    obtenerJson(url, { signal: AbortSignal.abort(motivo) }),
    (error) => error === motivo,
  )
})

test('la carga comparte el intento activo y reutiliza un éxito tras el reintento', async () => {
  let consultas = 0
  const carga = crearCarga(async () => {
    consultas += 1
    if (consultas === 1) throw new ErrorPeticion('http', { status: 503 })
    return []
  })

  assert.equal(carga.obtenerEstado().fase, 'inicial')
  const primerIntento = carga.cargar()
  assert.equal(carga.obtenerEstado().fase, 'cargando')
  assert.strictEqual(carga.cargar(), primerIntento)
  assert.equal((await primerIntento).fase, 'error')
  assert.deepEqual(await carga.cargar(), { fase: 'lista', datos: [] })
  assert.strictEqual(await carga.cargar(), carga.obtenerEstado())
  assert.equal(consultas, 2)
})

test('la cancelación descarta un resultado tardío y permite volver a cargar', async () => {
  const anterior = Promise.withResolvers()
  let primeraSenal
  const carga = crearCarga((signal) => {
    if (primeraSenal) return ['vigente']
    primeraSenal = signal
    return anterior.promise
  })

  const intento = carga.cargar()
  await Promise.resolve()
  carga.cancelar()
  assert.ok(primeraSenal.aborted)
  assert.equal(carga.obtenerEstado().fase, 'inicial')
  assert.deepEqual(await carga.cargar(), { fase: 'lista', datos: ['vigente'] })
  anterior.resolve(['obsoleto'])
  assert.equal((await intento).fase, 'cancelada')
  assert.deepEqual(carga.obtenerEstado().datos, ['vigente'])
})
