import { Link } from 'react-router'

export default function NoEncontrada() {
  return (
    <section aria-labelledby="titulo-404">
      <h1 id="titulo-404">Página no encontrada</h1>
      <p>La dirección solicitada no corresponde a una página de la librería.</p>
      <Link className="accion" to="/">
        Volver al inicio
      </Link>
    </section>
  )
}
