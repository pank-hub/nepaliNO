import {Select, Stack, TextInput} from '@sanity/ui'
import {useState, type ChangeEvent} from 'react'
import {set, unset, type StringInputProps} from 'sanity'

import {AUTHOR_NAME_PRESETS} from '../schemaTypes/authorNamePresets'

const OTHER = '__other__'

// A dropdown of the usual author names with an "Other" option for a one-off name.
// The stored value stays a plain string, so the public site and queries are unaffected.
export function AuthorNameInput(props: StringInputProps) {
  const {value, onChange, readOnly, elementProps} = props
  const [otherSelected, setOtherSelected] = useState(false)

  const isPreset = !!value && AUTHOR_NAME_PRESETS.includes(value)
  const showCustom = otherSelected || (!!value && !isPreset)
  const selectValue = showCustom ? OTHER : (value ?? '')

  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value

    if (next === OTHER) {
      setOtherSelected(true)
      if (isPreset) onChange(unset())
      return
    }

    setOtherSelected(false)
    onChange(next ? set(next) : unset())
  }

  return (
    <Stack space={3}>
      <Select
        id={elementProps.id}
        ref={elementProps.ref as React.Ref<HTMLSelectElement>}
        value={selectValue}
        onChange={handleSelect}
        onFocus={elementProps.onFocus}
        onBlur={elementProps.onBlur}
        readOnly={readOnly}
      >
        <option value="">Choose an author…</option>
        {AUTHOR_NAME_PRESETS.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={OTHER}>Other (type a name)…</option>
      </Select>

      {showCustom && (
        <TextInput
          value={value ?? ''}
          placeholder="Author name"
          readOnly={readOnly}
          onChange={(event) => {
            const next = event.currentTarget.value
            onChange(next ? set(next) : unset())
          }}
          onBlur={() => {
            const trimmed = value?.trim()
            if (trimmed !== undefined && trimmed !== value) {
              onChange(trimmed ? set(trimmed) : unset())
            }
          }}
        />
      )}
    </Stack>
  )
}
