'use client'

import {useTranslations} from 'next-intl'
import {useId, useRef, useState} from 'react'
import {RecipeCombobox} from '@/components/recipe-combobox'
import type {Recipe} from '@/db/recipes/queries'
import {timeZone} from '@/i18n/time-zone'
import {type DinnerRecipe, fromDateTimeLocal} from '@/lib/dinners'

type Props = {
  /** The wall clock the input speaks — see lib/dinners. */
  eatenAt: string
  onEatenAt: (value: string) => void
  notes: string
  onNotes: (value: string) => void
  chosen: DinnerRecipe[]
  onAdd: (recipe: DinnerRecipe) => void
  onRemove: (id: string) => void
  whenRef?: React.Ref<HTMLInputElement>
  /** Set when a message is on screen, so the field points at it. */
  errorId?: string
}

const field =
  'rounded-lg border border-secondary-foreground bg-background px-3 py-2'

export function DinnerFields({
  eatenAt,
  onEatenAt,
  notes,
  onNotes,
  chosen,
  onAdd,
  onRemove,
  whenRef,
  errorId,
}: Props) {
  const t = useTranslations('dinners')
  const whenId = useId()
  const notesId = useId()
  const [message, setMessage] = useState('')
  const list = useRef<HTMLUListElement>(null)

  /* The instant, worked out here where the zone is known. The visible field
     carries no name: what the server reads is this. */
  const instant = fromDateTimeLocal(eatenAt, timeZone)

  function add(recipe: Recipe | null) {
    if (!recipe) return
    if (chosen.some(one => one.id === recipe.id)) {
      setMessage(t('recipeRepeated', {name: recipe.name}))
      return
    }
    onAdd({id: recipe.id, name: recipe.name, imageUrl: recipe.imageUrl})
    setMessage(t('recipeAdded', {name: recipe.name}))
  }

  function remove(recipe: DinnerRecipe) {
    onRemove(recipe.id)
    setMessage(t('recipeRemoved', {name: recipe.name}))
    /* The button it was pressed on is gone; without this focus falls to the
       body and the form loses its place. */
    list.current?.focus()
  }

  return (
    <>
      <input
        type="hidden"
        name="eatenAt"
        value={instant?.toISOString() ?? ''}
      />

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={whenId}>
          {t('when')}
        </label>
        <input
          ref={whenRef}
          id={whenId}
          type="datetime-local"
          required
          value={eatenAt}
          onChange={event => onEatenAt(event.target.value)}
          aria-describedby={errorId}
          aria-invalid={errorId ? true : undefined}
          className={field}
        />
      </div>

      <RecipeCombobox
        onChange={add}
        isChosen={recipe => chosen.some(one => one.id === recipe.id)}
      />

      {chosen.length === 0 ? (
        <p className="text-secondary-foreground text-sm">{t('noneChosen')}</p>
      ) : (
        <ul
          ref={list}
          tabIndex={-1}
          aria-label={t('chosen')}
          className="flex flex-wrap gap-2"
        >
          {chosen.map(recipe => (
            <li key={recipe.id}>
              <input type="hidden" name="recipeIds" value={recipe.id} />
              <span className="flex items-center gap-2 rounded-full border border-light bg-background px-3 py-1 text-sm">
                {recipe.name}
                {/* Named per recipe: a row of buttons all reading "Quitar"
                    says nothing about which one is which. */}
                <button
                  type="button"
                  onClick={() => remove(recipe)}
                  aria-label={t('removeRecipe', {name: recipe.name})}
                  className="font-bold text-primary-strong"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Adding and removing are both silent otherwise: the chip appears or
          goes somewhere other than where the typing was. */}
      <p role="status" className="sr-only">
        {message}
      </p>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={notesId}>
          {t('notes')}
        </label>
        <textarea
          id={notesId}
          name="notes"
          rows={2}
          maxLength={500}
          value={notes}
          onChange={event => onNotes(event.target.value)}
          placeholder={t('notesPlaceholder')}
          className={field}
        />
      </div>
    </>
  )
}
