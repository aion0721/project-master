import type { ProjectLink } from '../types/project'

const uncPathPattern = /^\\\\[^\\/:*?"<>|\r\n]+\\[^\\/:*?"<>|\r\n]+(?:\\[^\\/:*?"<>|\r\n]+)*\\?$/

export function isNetworkPath(value: string) {
  return uncPathPattern.test(value)
}

export function isValidProjectLinkTarget(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return isNetworkPath(value)
  }
}

export function normalizeProjectLinks(links: ProjectLink[]) {
  return links
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => link.label || link.url)
}

export function validateProjectLinks(links: ProjectLink[]) {
  const normalizedLinks = normalizeProjectLinks(links)

  for (const link of normalizedLinks) {
    if (!link.label || !link.url) {
      return {
        links: normalizedLinks,
        error: '案件リンクは名称と URL またはネットワークパスを両方入力してください。',
      }
    }

    if (!isValidProjectLinkTarget(link.url)) {
      return {
        links: normalizedLinks,
        error: '案件リンクは有効な URL またはネットワークパスを入力してください。',
      }
    }
  }

  return {
    links: normalizedLinks,
    error: null,
  }
}

export function createEmptyProjectLink(): ProjectLink {
  return {
    label: '',
    url: '',
  }
}
