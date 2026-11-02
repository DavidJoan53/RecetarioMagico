'use client'

import {useId, useState} from 'react'

type Props = {
  name: 'instructions' | 'links'
  legend: string
  itemLabel: (n: number) => string
  removeLabel: (n: number) => string
  addLabel: string
  placeholder?: string
  /** What the rows start as, when an existing recipe is being edited. */
  initialValues?: readonly string[]
  /** Shows each row's position. For a sequence, where it is the content. */
  numbered?: boolean
}

/**
 * Repeated inputs sharing one field name, so FormData.getAll returns them in
 * order. Rows are keyed by a counter, not by index — reusing indexes leaves
 * React focusing the wrong input after a removal.
 */
export function FieldList({
  name,
  legend,
  itemLabel,
  removeLabel,
  addLabel,
  placeholder,
  initialValues,
  numbered = false,
}: Props) {
  const base = useId()
  /* One empty row when there is nothing to edit, so the field is never a
     legend with no input under it. */
  const [rows, setRows] = useState(() =>
    (initialValues?.length ? initialValues : ['']).map((value, index) => ({
      key: index,
      value,
    })),
  )
  const [next, setNext] = useState(rows.length)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-secondary-foreground text-xs uppercase tracking-wider">
        {legend}
      </legend>

      {rows.map((row, index) => (
        <div key={row.key} className="flex items-center gap-2">
          {/* aria-hidden: itemLabel already names the input "Paso 3", so a
              reader told the number here would hear it twice. */}
          {numbered && (
            <span
              aria-hidden="true"
              className="w-6 shrink-0 text-right font-semibold text-secondary-foreground text-sm tabular-nums"
            >
              {index + 1}
            </span>
          )}
          <label className="sr-only" htmlFor={`${base}-${row.key}`}>
            {itemLabel(index + 1)}
          </label>
          <input
            id={`${base}-${row.key}`}
            name={name}
            placeholder={placeholder}
            defaultValue={row.value}
            className="min-w-0 flex-1 rounded-lg border border-secondary-foreground bg-background px-3 py-2 text-sm"
          />
          {rows.length > 1 && (
            <button
              type="button"
              aria-label={removeLabel(index + 1)}
              onClick={() => setRows(r => r.filter(x => x.key !== row.key))}
              className="rounded-lg border border-secondary-foreground px-3 py-2 text-sm"
            >
              −
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          setRows(r => [...r, {key: next, value: ''}])
          setNext(n => n + 1)
        }}
        className="self-start font-semibold text-primary-strong text-sm"
      >
        + {addLabel}
      </button>
    </fieldset>
  )
}
