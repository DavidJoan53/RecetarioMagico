'use client'

import {useId, useState} from 'react'

type Props = {
  name: 'instructions' | 'links'
  legend: string
  itemLabel: (n: number) => string
  removeLabel: (n: number) => string
  addLabel: string
  placeholder?: string
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
}: Props) {
  const base = useId()
  const [rows, setRows] = useState([0])
  const [next, setNext] = useState(1)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-secondary-foreground text-xs uppercase tracking-wider">
        {legend}
      </legend>

      {rows.map((row, index) => (
        <div key={row} className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`${base}-${row}`}>
            {itemLabel(index + 1)}
          </label>
          <input
            id={`${base}-${row}`}
            name={name}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-lg border border-secondary-foreground bg-background px-3 py-2 text-sm"
          />
          {rows.length > 1 && (
            <button
              type="button"
              aria-label={removeLabel(index + 1)}
              onClick={() => setRows(r => r.filter(x => x !== row))}
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
          setRows(r => [...r, next])
          setNext(n => n + 1)
        }}
        className="self-start font-semibold text-primary-strong text-sm"
      >
        + {addLabel}
      </button>
    </fieldset>
  )
}
