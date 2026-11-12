export function crearCarga(solicitar) {
  let estado = { fase: 'inicial' }
  let activa
  const observadores = new Set()

  function notificar() {
    for (const observador of observadores) observador()
  }

  function observar(observador) {
    observadores.add(observador)
    if (estado.fase === 'inicial') void cargar()

    return () => {
      observadores.delete(observador)
      // Una nueva suscripción en el mismo ciclo conserva la solicitud activa (StrictMode).
      queueMicrotask(() => {
        if (observadores.size === 0) cancelar()
      })
    }
  }

  function cargar() {
    if (activa) return activa.promesa
    if (estado.fase === 'lista') return Promise.resolve(estado)

    const operacion = { controlador: new AbortController() }
    const { signal } = operacion.controlador
    estado = { fase: 'cargando' }
    activa = operacion

    operacion.promesa = Promise.resolve()
      .then(() => {
        signal.throwIfAborted()
        return solicitar(signal)
      })
      .then(
        (datos) => finalizar({ fase: 'lista', datos }),
        (error) => finalizar({ fase: 'error', error }),
      )

    function finalizar(resultado) {
      if (activa !== operacion) return { fase: 'cancelada' }

      activa = undefined
      estado = resultado
      notificar()
      return estado
    }

    notificar()
    return operacion.promesa
  }

  function cancelar() {
    if (!activa) return
    const { controlador } = activa
    activa = undefined
    estado = { fase: 'inicial' }
    controlador.abort()
    notificar()
  }

  return { cargar, cancelar, observar, obtenerEstado: () => estado }
}
