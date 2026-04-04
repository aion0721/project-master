import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'medium' | 'small'

interface SharedProps {
  children: ReactNode
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

type ButtonAsButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never
  }

type ButtonAsLinkProps = SharedProps &
  Omit<LinkProps, 'className'> & {
    to: string
  }

function getClassName(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return [styles.base, styles[variant], styles[size], className].filter(Boolean).join(' ')
}

export function Button(props: ButtonAsButtonProps | ButtonAsLinkProps) {
  const variant = props.variant ?? 'primary'
  const size = props.size ?? 'medium'
  const className = getClassName(variant, size, props.className)

  if ('to' in props && props.to) {
    const { children, to, className: _ignoredClassName, size: _ignoredSize, variant: _ignoredVariant, ...rest } =
      props
    void _ignoredClassName
    void _ignoredSize
    void _ignoredVariant

    return (
      <Link className={className} to={to} {...rest}>
        {children}
      </Link>
    )
  }

  const { children, className: _ignoredClassName, size: _ignoredSize, variant: _ignoredVariant, ...rest } =
    props as ButtonAsButtonProps
  void _ignoredClassName
  void _ignoredSize
  void _ignoredVariant

  return (
    <button className={className} type={rest.type ?? 'button'} {...rest}>
      {children}
    </button>
  )
}
