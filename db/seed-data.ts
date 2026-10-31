/** Colours are asserted readable in __tests__/seed-data. */
export const DEFAULT_LABEL_GROUPS = [
  {
    name: 'Momento',
    labels: [
      {name: 'Desayuno', color: '#ffd166'},
      {name: 'Almuerzo', color: '#06d6a0'},
      {name: 'Cena', color: '#118ab2'},
      {name: 'Refrigerio', color: '#ef476f'},
    ],
  },
  {
    name: 'Herramienta',
    labels: [
      {name: 'Horno', color: '#e07a5f'},
      {name: 'Licuadora', color: '#81b29a'},
      {name: 'Olla', color: '#9a8c98'},
    ],
  },
  {
    name: 'Favoritos',
    labels: [{name: 'Favorito', color: '#db3642'}],
  },
] as const
