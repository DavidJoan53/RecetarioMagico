'use client'

import {useTranslations} from 'next-intl'
import {useId, useState} from 'react'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import type {RecipeIngredient} from '@/db/recipes/queries'
import {unitEnum} from '@/db/schema'
import {IngredientCombobox} from './ingredient-combobox'

type Row = {
  /** Keyed by counter, not index: reusing indexes misplaces values on removal. */
  key: number
  /** What is submitted. Empty until something is picked. */
  ingredientId: string
  /** Seeds the picker when an existing recipe is being edited. */
  initialName: string
  chosen: IngredientWithPantry | null
  quantity: string
  unit: string
}

function rowsFrom(ingredients: readonly RecipeIngredient[]): Row[] {
  return ingredients.map((item, index) => ({
    key: index,
    ingredientId: item.ingredientId,
    initialName: item.name,
    chosen: null,
    quantity: String(item.quantity),
    unit: item.unit,
  }))
}

/**
 * The ingredients of a recipe, as rows of picker + amount. Three fields share
 * each name — `ingredientId`, `ingredientQuantity`, `ingredientUnit` — so
 * FormData.getAll returns three aligned arrays.
 *
 * Every row submits all three, even empty: a row that left one out would
 * shift every later row's amount onto the wrong ingredient.
 */
export function RecipeIngredientFields({
  initial = [],
}: {
  initial?: readonly RecipeIngredient[]
}) {
  const t = useTranslations('recipeForm')
  const base = useId()
  const [rows, setRows] = useState<Row[]>(() => rowsFrom(initial))
  const [next, setNext] = useState(initial.length)

  const update = (key: number, change: Partial<Row>) =>
    setRows(current =>
      current.map(row => (row.key === key ? {...row, ...change} : row)),
    )

  const chosenIds = rows.map(row => row.ingredientId).filter(Boolean)

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-semibold text-secondary-foreground text-xs uppercase tracking-wider">
        {t('ingredients')}
      </legend>

      {rows.length === 0 && (
        <p className="text-secondary-foreground text-sm">
          {t('noIngredients')}
        </p>
      )}

      {rows.map((row, index) => {
        /* What this row is about, for the controls that have to name it. A
           row with nothing picked yet has only its position to go on. */
        const subject =
          row.chosen?.name ||
          row.initialName ||
          t('ingredientN', {n: index + 1})
        const quantityId = `${base}-quantity-${row.key}`
        const unitId = `${base}-unit-${row.key}`
        /* Only once there is something to measure: an untouched row is
           dropped on submit, and a required field would block it instead. */
        const amountRequired = Boolean(row.ingredientId)

        return (
          <div
            key={row.key}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-light p-2"
          >
            <input type="hidden" name="ingredientId" value={row.ingredientId} />

            <div className="min-w-48 flex-1">
              <IngredientCombobox
                label={t('ingredientN', {n: index + 1})}
                value={row.chosen}
                initialLabel={row.initialName}
                onChange={ingredient =>
                  update(row.key, {
                    chosen: ingredient,
                    ingredientId: ingredient?.id ?? '',
                  })
                }
                /* Its own row's choice is not a clash with itself. */
                usedIds={chosenIds.filter(id => id !== row.ingredientId)}
                usedNote={t('alreadyInRecipe')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm" htmlFor={quantityId}>
                {t('quantity')}
              </label>
              <input
                id={quantityId}
                name="ingredientQuantity"
                /* The name carries the row's subject, so a column of them is
                   not all called "Cantidad". It wins over the visible label
                   outright rather than adding to it — Chrome reads out both
                   halves of a label it is told to hide half of. The visible
                   word is still contained in it, so the two agree. */
                aria-label={t('quantityOf', {name: subject})}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                required={amountRequired}
                value={row.quantity}
                onChange={event =>
                  update(row.key, {quantity: event.target.value})
                }
                className="w-24 rounded-lg border border-secondary-foreground bg-background px-3 py-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm" htmlFor={unitId}>
                {t('unit')}
              </label>
              <select
                id={unitId}
                name="ingredientUnit"
                aria-label={t('unitOf', {name: subject})}
                required={amountRequired}
                value={row.unit}
                onChange={event => update(row.key, {unit: event.target.value})}
                className="rounded-lg border border-secondary-foreground bg-background px-3 py-2"
              >
                {/* Empty and disabled: a placeholder, not a choosable answer
                    — an amount needs both halves to mean anything. */}
                <option value="" disabled>
                  {t('chooseUnit')}
                </option>
                {unitEnum.enumValues.map(value => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              aria-label={t('removeIngredient', {name: subject})}
              onClick={() =>
                setRows(current => current.filter(r => r.key !== row.key))
              }
              className="rounded-lg border border-secondary-foreground px-3 py-2 text-sm"
            >
              −
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => {
          setRows(current => [
            ...current,
            {
              key: next,
              ingredientId: '',
              initialName: '',
              chosen: null,
              quantity: '',
              unit: '',
            },
          ])
          setNext(n => n + 1)
        }}
        className="self-start font-semibold text-primary-strong text-sm"
      >
        + {t('addIngredient')}
      </button>
    </fieldset>
  )
}
