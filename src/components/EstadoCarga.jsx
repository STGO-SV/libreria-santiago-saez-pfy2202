export default function EstadoCarga({
  estado,
  reintentar,
  inexistente,
  children,
}) {
  if (estado.fase === 'error') {
    const { error } = estado
    if (error.status === 404) return <p role="alert">{inexistente}</p>

    let mensaje = 'El servicio no pudo completar la solicitud.'
    if (error.tipo === 'red') mensaje = 'No se pudo conectar con el servicio.'
    if (error.tipo === 'json')
      mensaje = 'El servicio devolvió una respuesta inválida.'

    return (
      <>
        <p role="alert">{mensaje}</p>
        <button className="accion" type="button" onClick={reintentar}>
          Reintentar
        </button>
      </>
    )
  }

  if (estado.fase === 'lista') return children(estado.datos)
  return <p role="status">Cargando…</p>
}
