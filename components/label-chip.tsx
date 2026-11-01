import type {Label} from '@/db/schema'
import {textColorFor} from '@/lib/color'

/**
 * The colour is picked freely, so the text colour is derived from it rather
 * than chosen — black or white, whichever reads. See lib/color.
 */
export function LabelChip({label}: {label: Label}) {
  return (
    <span
      style={{backgroundColor: label.color, color: textColorFor(label.color)}}
      className="inline-block rounded-full px-3 py-1 font-semibold text-sm"
    >
      {label.name}
    </span>
  )
}
