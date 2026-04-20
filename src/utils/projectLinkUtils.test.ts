import { describe, expect, it } from 'vitest'
import {
  isNetworkPath,
  isValidProjectLinkTarget,
  validateProjectLinks,
} from './projectLinkUtils'

describe('projectLinkUtils', () => {
  it('UNC のネットワークパスを有効な案件リンクとして扱う', () => {
    expect(isNetworkPath('\\\\sample-server\\sss')).toBe(true)
    expect(isValidProjectLinkTarget('\\\\sample-server\\sss\\folder')).toBe(true)
  })

  it('URL とネットワークパス以外はエラーにする', () => {
    expect(
      validateProjectLinks([
        {
          label: '共有フォルダ',
          url: 'sample-server/sss',
        },
      ]),
    ).toEqual({
      links: [
        {
          label: '共有フォルダ',
          url: 'sample-server/sss',
        },
      ],
      error: '案件リンクは有効な URL またはネットワークパスを入力してください。',
    })
  })
})
