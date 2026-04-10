import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchSelect } from './SearchSelect'

const options = [
  {
    value: 'm1',
    label: 'm1 / 田中',
    keywords: ['PMO', 'PM'],
  },
  {
    value: 'm8',
    label: 'm8 / 木村',
    keywords: ['会計', 'TL'],
  },
  {
    value: 'm10',
    label: 'm10 / 伊藤',
    keywords: ['営業', 'Mgr'],
  },
]

describe('SearchSelect', () => {
  it('部分一致で候補を絞り込める', () => {
    const handleChange = vi.fn()

    render(
      <SearchSelect
        ariaLabel="担当者"
        onChange={handleChange}
        options={options}
        placeholder="メンバーを検索"
        value=""
      />,
    )

    const input = screen.getByRole('combobox', { name: '担当者' })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '木村' } })

    expect(screen.getByRole('option', { name: 'm8 / 木村' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'm1 / 田中' })).not.toBeInTheDocument()
  })

  it('キーボードで候補を選択できる', () => {
    const handleChange = vi.fn()

    render(
      <SearchSelect
        ariaLabel="担当者"
        onChange={handleChange}
        options={options}
        placeholder="メンバーを検索"
        value=""
      />,
    )

    const input = screen.getByRole('combobox', { name: '担当者' })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '木' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleChange).toHaveBeenLastCalledWith('m8')
  })
})
