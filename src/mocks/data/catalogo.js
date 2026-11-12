export const categorias = [
  { id: 'ficcion', nombre: 'Ficción', descripcion: 'Novelas y relatos.' },
  {
    id: 'ciencia-ficcion',
    nombre: 'Ciencia Ficción',
    descripcion: 'Futuros posibles y mundos imaginados.',
  },
  {
    id: 'historia',
    nombre: 'Historia',
    descripcion: 'Personas y acontecimientos del pasado.',
  },
  {
    id: 'divulgacion',
    nombre: 'Divulgación Científica',
    descripcion: 'Ciencia para lectores curiosos.',
  },
  {
    id: 'infantil',
    nombre: 'Literatura Infantil',
    descripcion: 'Historias para primeros lectores.',
  },
  { id: 'poesia', nombre: 'Poesía' },
]

export const libros = [
  {
    id: 'casa-de-los-espiritus',
    titulo: 'La casa de los espíritus',
    autor: 'Isabel Allende',
    categoriaId: 'ficcion',
    descripcion: 'La historia de varias generaciones de la familia Trueba.',
  },
  {
    id: 'dune',
    titulo: 'Dune',
    autor: 'Frank Herbert',
    categoriaId: 'ciencia-ficcion',
    descripcion:
      'Una disputa por el control de Arrakis transforma el destino de Paul Atreides.',
  },
  {
    id: 'fahrenheit-451',
    titulo: 'Fahrenheit 451',
    autor: 'Ray Bradbury',
    categoriaId: 'ciencia-ficcion',
    descripcion:
      'Un bombero cuestiona su oficio en una sociedad que quema libros.',
  },
  {
    id: 'los-canos-de-agosto',
    titulo: 'Los cañones de agosto',
    autor: 'Barbara W. Tuchman',
    categoriaId: 'historia',
    descripcion:
      'Una crónica de las primeras semanas de la Primera Guerra Mundial.',
  },
  {
    id: 'cosmos',
    titulo: 'Cosmos',
    autor: 'Carl Sagan',
    categoriaId: 'divulgacion',
    descripcion:
      'Un recorrido por el universo y la historia de su exploración.',
  },
  {
    id: 'papelucho',
    titulo: 'Papelucho',
    autor: 'Marcela Paz',
    categoriaId: 'infantil',
    descripcion: 'El diario de un niño que cuenta sus aventuras cotidianas.',
  },
]
