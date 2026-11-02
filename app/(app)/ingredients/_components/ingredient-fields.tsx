'use client'

import {useTranslations} from 'next-intl'
import {useId} from 'react'

type Props = {
  name: string
  photoUrl: string
  onName: (value: string) => void
  onPhotoUrl: (value: string) => void
  nameRef?: React.Ref<HTMLInputElement>
  /** Set when a message is on screen, so the field points at it. */
  errorId?: string
}

const field =
  'rounded-lg border border-secondary-foreground bg-background px-3 py-2'

export function IngredientFields({
  name,
  photoUrl,
  onName,
  onPhotoUrl,
  nameRef,
  errorId,
}: Props) {
  const t = useTranslations('ingredients')
  const nameId = useId()
  const photoId = useId()

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={nameId}>
          {t('name')}
        </label>
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          required
          maxLength={120}
          value={name}
          onChange={e => onName(e.target.value)}
          placeholder={t('namePlaceholder')}
          aria-describedby={errorId}
          aria-invalid={errorId ? true : undefined}
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={photoId}>
          {t('photoUrl')}
        </label>
        <input
          id={photoId}
          name="photoUrl"
          type="url"
          value={photoUrl}
          onChange={e => onPhotoUrl(e.target.value)}
          placeholder={t('photoPlaceholder')}
          className={field}
        />
      </div>
    </>
  )
}
