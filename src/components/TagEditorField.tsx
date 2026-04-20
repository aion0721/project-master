import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { normalizeMemberTags } from '../pages/members/memberFormUtils'
import { Button } from './ui/Button'
import styles from './TagEditorField.module.css'

interface TagEditorFieldProps {
  addButtonLabel?: string
  fieldClassName?: string
  helperText?: string
  inputAriaLabel: string
  inputClassName: string
  inputPlaceholder?: string
  onChange: (tags: string[]) => void
  removeButtonTestIdPrefix?: string
  suggestions: string[]
  tags: string[]
  tagTestIdPrefix?: string
}

export function TagEditorField({
  addButtonLabel = '追加',
  fieldClassName,
  helperText,
  inputAriaLabel,
  inputClassName,
  inputPlaceholder,
  onChange,
  removeButtonTestIdPrefix,
  suggestions,
  tags,
  tagTestIdPrefix,
}: TagEditorFieldProps) {
  const datalistId = useId()
  const [draft, setDraft] = useState('')
  const normalizedSuggestions = useMemo(
    () => normalizeMemberTags(suggestions).filter((tag) => !tags.includes(tag)),
    [suggestions, tags],
  )

  function addTag() {
    const nextTag = draft.trim()

    if (!nextTag) {
      return
    }

    const nextTags = normalizeMemberTags([...tags, nextTag])
    onChange(nextTags)
    setDraft('')
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, currentIndex) => currentIndex !== index))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    addTag()
  }

  return (
    <div className={styles.root}>
      <div className={styles.inputRow}>
        <label className={fieldClassName}>
          <input
            aria-label={inputAriaLabel}
            className={inputClassName}
            list={datalistId}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            type="text"
            value={draft}
          />
          <datalist id={datalistId}>
            {normalizedSuggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </label>
        <Button onClick={addTag} size="small" type="button" variant="secondary">
          {addButtonLabel}
        </Button>
      </div>
      {tags.length > 0 ? (
        <div className={styles.chipList}>
          {tags.map((tag, index) => (
            <span
              className={styles.chip}
              data-testid={tagTestIdPrefix ? `${tagTestIdPrefix}-${index}` : undefined}
              key={`${tag}-${index}`}
            >
              {tag}
              <button
                aria-label={`${tag} を削除`}
                className={styles.chipButton}
                data-testid={removeButtonTestIdPrefix ? `${removeButtonTestIdPrefix}-${index}` : undefined}
                onClick={() => removeTag(index)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {helperText ? <p className={styles.helper}>{helperText}</p> : null}
    </div>
  )
}
