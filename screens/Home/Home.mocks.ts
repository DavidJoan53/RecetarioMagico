import {
  faBowlRice,
  faCirclePlus,
  faCookieBite,
  faDrumstickBite,
  faEgg,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import type {FoodCardInterface} from '@/components/FoodCardsCarrousel/FoodCard'

// TODO: replace with data from RecetarioMagicoBackend once the API is defined.

const PLACEHOLDER_IMG =
  'https://fastly.picsum.photos/id/1060/536/354.jpg?blur=2&hmac=0zJLs1ar00sBbW5Ahd_4zA6pgZqCVavwuHToO6VtcYY'

// `id` doubles as the i18n key (groups.<id>); the display name is translated at render time.
export const defaultGroups = [
  {id: 'favorites', icon: faStar},
  {id: 'breakfast', icon: faEgg},
  {id: 'lunch', icon: faBowlRice},
  {id: 'dinner', icon: faDrumstickBite},
  {id: 'snacks', icon: faCookieBite},
  {id: 'newGroup', icon: faCirclePlus},
]

export const breakfastRecipes: FoodCardInterface[] = [
  {
    id: 1,
    title: 'Cafesito meloso',
    img: PLACEHOLDER_IMG,
    tool: 'blender',
    time: 2.25,
  },
  {
    id: 2,
    title: 'Huevos revueltos',
    img: PLACEHOLDER_IMG,
    tool: 'oven',
    time: 10,
  },
  {
    id: 3,
    title: 'Tostadas con aguacate',
    img: PLACEHOLDER_IMG,
    tool: 'oven',
    time: 8,
  },
  {
    id: 4,
    title: 'Batido de fresa',
    img: PLACEHOLDER_IMG,
    tool: 'blender',
    time: 5,
  },
]

export const lunchRecipes: FoodCardInterface[] = [
  {
    id: 5,
    title: 'Arroz con pollo',
    img: PLACEHOLDER_IMG,
    tool: 'oven',
    time: 45,
  },
  {
    id: 6,
    title: 'Ensalada César',
    img: PLACEHOLDER_IMG,
    tool: 'knife',
    time: 15,
  },
  {
    id: 7,
    title: 'Crema de calabaza',
    img: PLACEHOLDER_IMG,
    tool: 'blender',
    time: 30,
  },
  {
    id: 8,
    title: 'Pasta al pesto',
    img: PLACEHOLDER_IMG,
    tool: 'oven',
    time: 25,
  },
]

export const dinnerRecipes: FoodCardInterface[] = [
  {
    id: 9,
    title: 'Salmón al horno',
    img: PLACEHOLDER_IMG,
    tool: 'oven',
    time: 35,
  },
  {
    id: 10,
    title: 'Sopa de verduras',
    img: PLACEHOLDER_IMG,
    tool: 'oven',
    time: 40,
  },
  {
    id: 11,
    title: 'Tortilla española',
    img: PLACEHOLDER_IMG,
    tool: 'oven',
    time: 20,
  },
  {
    id: 12,
    title: 'Smoothie verde',
    img: PLACEHOLDER_IMG,
    tool: 'blender',
    time: 5,
  },
]
