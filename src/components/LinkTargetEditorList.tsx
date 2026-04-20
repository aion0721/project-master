import type { ProjectLink } from '../types/project'
import { Button } from './ui/Button'

interface LinkTargetEditorListProps {
  fieldWrapperClassName?: string
  labelFieldAriaLabel: (index: number) => string
  labelFieldLabel?: (index: number) => string
  labelInputClassName: string
  labelInputPlaceholder: string
  labelTestIdPrefix: string
  links: ProjectLink[]
  listClassName: string
  onChange: (index: number, patch: Partial<ProjectLink>) => void
  onRemove: (index: number) => void
  removeButtonTestIdPrefix: string
  rowClassName: string
  showVisibleLabels?: boolean
  urlFieldAriaLabel: (index: number) => string
  urlFieldLabel?: (index: number) => string
  urlInputClassName: string
  urlInputPlaceholder: string
  urlTestIdPrefix: string
  visuallyHiddenClassName?: string
}

export function LinkTargetEditorList({
  fieldWrapperClassName,
  labelFieldAriaLabel,
  labelFieldLabel,
  labelInputClassName,
  labelInputPlaceholder,
  labelTestIdPrefix,
  links,
  listClassName,
  onChange,
  onRemove,
  removeButtonTestIdPrefix,
  rowClassName,
  showVisibleLabels = false,
  urlFieldAriaLabel,
  urlFieldLabel,
  urlInputClassName,
  urlInputPlaceholder,
  urlTestIdPrefix,
  visuallyHiddenClassName,
}: LinkTargetEditorListProps) {
  return (
    <div className={listClassName}>
      {links.map((link, index) => (
        <div className={rowClassName} key={`${removeButtonTestIdPrefix}-draft-${index}`}>
          <label className={fieldWrapperClassName}>
            {labelFieldLabel ? (
              <span className={showVisibleLabels ? undefined : visuallyHiddenClassName}>
                {labelFieldLabel(index)}
              </span>
            ) : null}
            <input
              aria-label={labelFieldAriaLabel(index)}
              className={labelInputClassName}
              data-testid={`${labelTestIdPrefix}-${index}`}
              onChange={(event) => onChange(index, { label: event.target.value })}
              placeholder={labelInputPlaceholder}
              value={link.label}
            />
          </label>
          <label className={fieldWrapperClassName}>
            {urlFieldLabel ? (
              <span className={showVisibleLabels ? undefined : visuallyHiddenClassName}>
                {urlFieldLabel(index)}
              </span>
            ) : null}
            <input
              aria-label={urlFieldAriaLabel(index)}
              className={urlInputClassName}
              data-testid={`${urlTestIdPrefix}-${index}`}
              onChange={(event) => onChange(index, { url: event.target.value })}
              placeholder={urlInputPlaceholder}
              type="text"
              value={link.url}
            />
          </label>
          <Button
            data-testid={`${removeButtonTestIdPrefix}-${index}`}
            onClick={() => onRemove(index)}
            size="small"
            variant="danger"
          >
            削除
          </Button>
        </div>
      ))}
    </div>
  )
}
