import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import styles from './SearchSelect.module.css'

const DEFAULT_VISIBLE_OPTION_COUNT = 20

export interface SearchSelectOption {
  value: string
  label: string
  keywords?: string[]
}

interface SearchSelectProps {
  allowFreeText?: boolean
  ariaLabel: string
  className?: string
  dataTestId?: string
  disabled?: boolean
  emptyMessage?: string
  maxVisibleOptions?: number
  options: SearchSelectOption[]
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('ja')
}

function buildSearchText(option: SearchSelectOption) {
  return normalizeText([option.value, option.label, ...(option.keywords ?? [])].join(' '))
}

export function SearchSelect({
  allowFreeText = false,
  ariaLabel,
  className,
  dataTestId,
  disabled = false,
  emptyMessage = '候補がありません',
  maxVisibleOptions = DEFAULT_VISIBLE_OPTION_COUNT,
  options,
  placeholder,
  value,
  onChange,
}: SearchSelectProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const displayValue = isOpen ? query : selectedOption?.label ?? ''

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    const matchedOptions = normalizedQuery
      ? options.filter((option) => buildSearchText(option).includes(normalizedQuery))
      : options

    return matchedOptions.slice(0, maxVisibleOptions)
  }, [maxVisibleOptions, options, query])

  const exactMatchedOption = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    if (!normalizedQuery) {
      return undefined
    }

    return options.find((option) => {
      return (
        normalizeText(option.value) === normalizedQuery ||
        normalizeText(option.label) === normalizedQuery
      )
    })
  }, [options, query])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery(selectedOption?.label ?? '')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, selectedOption])

  function openMenu() {
    if (disabled) {
      return
    }

    setIsOpen(true)
    setQuery(selectedOption?.label ?? '')
    setActiveIndex(0)
  }

  function closeMenu() {
    setIsOpen(false)
    setQuery(selectedOption?.label ?? '')
    setActiveIndex(0)
  }

  function selectOption(option: SearchSelectOption) {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
    setActiveIndex(0)
  }

  function handleChange(nextValue: string) {
    setQuery(nextValue)
    setIsOpen(true)
    setActiveIndex(0)

    if (!nextValue.trim()) {
      onChange('')
      return
    }

    const matchedOption = options.find((option) => normalizeText(option.value) === normalizeText(nextValue))
    if (matchedOption) {
      onChange(matchedOption.value)
      return
    }

    if (allowFreeText) {
      onChange(nextValue)
    }
  }

  function commitCurrentValue() {
    if (!query.trim()) {
      onChange('')
      closeMenu()
      return
    }

    if (exactMatchedOption) {
      selectOption(exactMatchedOption)
      return
    }

    if (allowFreeText) {
      onChange(query)
      setIsOpen(false)
      setActiveIndex(0)
      return
    }

    closeMenu()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()

      if (!isOpen) {
        setIsOpen(true)
        return
      }

      setActiveIndex((current) => {
        if (!filteredOptions.length) {
          return 0
        }

        return Math.min(current + 1, filteredOptions.length - 1)
      })
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      if (!isOpen) {
        setIsOpen(true)
        return
      }

      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      if (!isOpen) {
        commitCurrentValue()
        return
      }

      event.preventDefault()

      const activeOption = filteredOptions[activeIndex]
      if (activeOption) {
        selectOption(activeOption)
        return
      }

      commitCurrentValue()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
    }
  }

  function handleOptionMouseDown(event: MouseEvent<HTMLButtonElement>, option: SearchSelectOption) {
    event.preventDefault()
    selectOption(option)
    inputRef.current?.focus()
  }

  const activeOptionId =
    isOpen && filteredOptions[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        ref={inputRef}
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        autoComplete="off"
        className={className ?? styles.input}
        data-testid={dataTestId}
        disabled={disabled}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
            commitCurrentValue()
          }
        }}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={openMenu}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        type="text"
        value={displayValue}
      />

      {isOpen ? (
        <div className={styles.menu} id={listboxId} role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const isActive = index === activeIndex
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  className={`${styles.option} ${isActive ? styles.optionActive : ''} ${
                    isSelected ? styles.optionSelected : ''
                  }`.trim()}
                  id={`${listboxId}-option-${index}`}
                  onMouseDown={(event) => handleOptionMouseDown(event, option)}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  {option.label}
                </button>
              )
            })
          ) : (
            <div className={styles.empty}>{emptyMessage}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
