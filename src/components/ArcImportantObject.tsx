import type { ReactNode, HTMLAttributes } from 'react'

export function ArcImportantObject({
  important = false,
  className = '',
  children,
  ...rest
}: {
  important?: boolean
  className?: string
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>) {
  const classes = [
    'arc-important-object',
    important ? 'arc-important-object--marked' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <div className={classes} data-important={important ? 'true' : 'false'} {...rest}>
      {children}
    </div>
  )
}
