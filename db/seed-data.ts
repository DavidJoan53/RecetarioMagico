/**
 * The label groups the app starts with, carried over from the React Native
 * app's `defaultGroups` plus "Herramienta" — which is where the old `tool`
 * field (oven, blender) went rather than becoming a column on recipes.
 *
 * Kept separate from the seed runner so a test can assert every colour here
 * is readable. See seed-data.test.ts.
 */
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
