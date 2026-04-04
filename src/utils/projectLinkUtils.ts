import type { ProjectLink } from '../types/project'

export function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
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
        error: '案件リンクは名称と URL を両方入力してください。',
      }
    }

    if (!isValidUrl(link.url)) {
      return {
        links: normalizedLinks,
        error: '案件リンクは有効な URL を入力してください。',
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
