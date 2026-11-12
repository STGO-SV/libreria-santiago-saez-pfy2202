import { Link } from 'react-router'

export default function Inicio() {
  return (
    <section aria-labelledby="titulo-inicio">
      <h1 id="titulo-inicio">BukStor</h1>
      <p>Explora el catálogo de libros por categoría.</p>
      <Link className="accion" to="/categorias">
        Ir a categorías
      </Link>
    </section>
  )
}
