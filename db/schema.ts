import {sql} from 'drizzle-orm'
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

/** uuid v7 is time-ordered, so `ORDER BY id` is chronological. */
const primaryId = () => uuid('id').primaryKey().default(sql`uuidv7()`)

const createdAt = () =>
  timestamp('created_at', {withTimezone: true}).notNull().defaultNow()

/** Entered through a select, so this is the only set the column can hold. */
export const unitEnum = pgEnum('unit', [
  'g',
  'ml',
  'unidad',
  'cucharada',
  'cucharadita',
  'taza',
  'pizca',
])

/** `boundary` marks a context reset; the send query reads back only to it. */
export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'boundary',
])

export const recipes = pgTable('recipes', {
  id: primaryId(),
  name: text('name').notNull().unique(),
  /** Minutes, so the list can sort and filter on it. */
  prepTimeMinutes: integer('prep_time_minutes'),
  /** Read and written whole; no query touches a single step. */
  instructions: text('instructions').array().notNull().default([]),
  links: text('links').array().notNull().default([]),
  /** Always a URL. The app stores no image files. */
  imageUrl: text('image_url'),
  createdAt: createdAt(),
})

export const labelGroups = pgTable('label_groups', {
  id: primaryId(),
  name: text('name').notNull().unique(),
})

export const labels = pgTable(
  'labels',
  {
    id: primaryId(),
    name: text('name').notNull().unique(),
    /** Free hex. Chip text colour is computed from it — see lib/color. */
    color: text('color').notNull(),
    labelGroupId: uuid('label_group_id')
      .notNull()
      .references(() => labelGroups.id, {onDelete: 'cascade'}),
  },
  t => [index('labels_group_idx').on(t.labelGroupId)],
)

export const recipeLabels = pgTable(
  'recipe_labels',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {onDelete: 'cascade'}),
    labelId: uuid('label_id')
      .notNull()
      .references(() => labels.id, {onDelete: 'cascade'}),
  },
  t => [
    primaryKey({columns: [t.recipeId, t.labelId]}),
    /** The primary key covers recipe → labels; filters go the other way. */
    index('recipe_labels_label_idx').on(t.labelId),
  ],
)

export const ingredients = pgTable('ingredients', {
  id: primaryId(),
  name: text('name').notNull().unique(),
  photoUrl: text('photo_url'),
})

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: primaryId(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {onDelete: 'cascade'}),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, {onDelete: 'restrict'}),
    unit: unitEnum('unit').notNull(),
    /** Nullable: "sal, al gusto" has no number. */
    quantity: numeric('quantity', {precision: 10, scale: 2, mode: 'number'}),
  },
  t => [index('recipe_ingredients_recipe_idx').on(t.recipeId)],
)

export const dinners = pgTable(
  'dinners',
  {
    id: primaryId(),
    /** Can precede created_at, so id order is not chronological here. */
    eatenAt: timestamp('eaten_at', {withTimezone: true}).notNull().defaultNow(),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  t => [index('dinners_eaten_at_idx').on(t.eatenAt.desc())],
)

export const dinnerRecipes = pgTable(
  'dinner_recipes',
  {
    dinnerId: uuid('dinner_id')
      .notNull()
      .references(() => dinners.id, {onDelete: 'cascade'}),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {onDelete: 'cascade'}),
  },
  t => [
    primaryKey({columns: [t.dinnerId, t.recipeId]}),
    /** "When did we last eat this?" from a recipe. */
    index('dinner_recipes_recipe_idx').on(t.recipeId),
  ],
)

/** Keyed by ingredient: an ingredient is in the pantry or it is not. */
export const pantry = pgTable('pantry', {
  ingredientId: uuid('ingredient_id')
    .primaryKey()
    .references(() => ingredients.id, {onDelete: 'cascade'}),
  quantity: numeric('quantity', {precision: 10, scale: 2, mode: 'number'}),
  unit: unitEnum('unit'),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow(),
})

export const messages = pgTable('messages', {
  id: primaryId(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: createdAt(),
})

export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
export type Label = typeof labels.$inferSelect
export type LabelGroup = typeof labelGroups.$inferSelect
export type Ingredient = typeof ingredients.$inferSelect
export type Dinner = typeof dinners.$inferSelect
export type PantryEntry = typeof pantry.$inferSelect
export type Message = typeof messages.$inferSelect
export type Unit = (typeof unitEnum.enumValues)[number]
export type MessageRole = (typeof messageRoleEnum.enumValues)[number]
