import {Select, Stack, TextInput} from '@sanity/ui'
import {useState, type ChangeEvent} from 'react'
import {PatchEvent, set, unset, useFormCallbacks, type StringInputProps} from 'sanity'

import {
  AUTHOR_PRESETS,
  OTHER_AUTHOR as OTHER,
  buildAuthorPatchSpecs,
  findAuthorPreset,
  resolveAuthorSelection,
} from '../schemaTypes/authorNamePresets'

// A dropdown of the usual authors with an "Other" option for a one-off name.
// Choosing a preset writes both authorName and authorType in a single patch event;
// for a custom name the editor picks the type with the Author Type field below.
// The stored authorName stays a plain string, so the public site and queries are unaffected.
export function AuthorNameInput(props: StringInputProps) {
  const {value, onChange, readOnly, elementProps, path} = props
  // A field's own onChange can only patch itself, so sibling writes go through the form callbacks.
  const {onChange: onFormChange} = useFormCallbacks()
  const [otherSelected, setOtherSelected] = useState(false)

  const isPreset = !!findAuthorPreset(value)
  const showCustom = otherSelected || (!!value && !isPreset)
  const selectValue = showCustom ? OTHER : (value ?? '')

  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value

    setOtherSelected(next === OTHER)

    // Nothing to change when moving from a custom name to "Other".
    if (next === OTHER && !isPreset) return

    const specs = buildAuthorPatchSpecs(path.slice(0, -1), resolveAuthorSelection(next))
    onFormChange(
      PatchEvent.from(
        specs.map((spec) => (spec.op === 'set' ? set(spec.value, spec.path) : unset(spec.path))),
      ),
    )
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
        {AUTHOR_PRESETS.map(({name}) => (
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
