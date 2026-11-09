import {set, type StringInputProps} from 'sanity'
import {trimSearchKeyword} from '../schemaTypes/searchKeywordValidation'

export function SearchKeywordInput(props: StringInputProps) {
  return props.renderDefault({
    ...props,
    elementProps: {
      ...props.elementProps,
      onBlur: (event) => {
        if (!props.readOnly && typeof props.value === 'string') {
          const trimmed = trimSearchKeyword(props.value)
          if (trimmed !== props.value) props.onChange(set(trimmed))
        }
        props.elementProps.onBlur(event)
      },
    },
  })
}
