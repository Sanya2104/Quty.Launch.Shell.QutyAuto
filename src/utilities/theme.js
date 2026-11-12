// src/utilities/theme.js — применение темы и цветовой схемы к CSS.
// Вызывается из stores/appTheme.js после получения данных из GetAppState.

import { devConsole } from './devConsole'

/* Дефолтная схема teal (ColorSchemeModel.getDefaultScheme) */
const DEFAULT_PRIMARY = '#009688'
const DEFAULT_ACCENT = '#4CAF50'

/* Преобразование HEX → RGBA */
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0,0,0,${alpha})`
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) || 0
  const g = parseInt(clean.substring(2, 4), 16) || 0
  const b = parseInt(clean.substring(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${alpha})`
}

/* Luminance → цвет текста на фоне (black/white) */
function getOnColor(hex) {
  if (!hex) return '#fff'
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) || 0
  const g = parseInt(clean.substring(2, 4), 16) || 0
  const b = parseInt(clean.substring(4, 6), 16) || 0
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#171a1e' : '#ffffff'
}

/* Валидация HEX */
function isValidHex(hex) {
  return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex)
}

/**
 * Применяет тему и цветовую схему ядра к CSS-переменным и атрибутам HTML.
 * @param {object} appState — объект из GetAppState (или mockAppState)
 */
export function applyAppTheme(appState) {
  const root = document.documentElement
  if (!root) return

  /* Тема: dark по умолчанию */
  const theme = appState?.theme === 'light' ? 'light' : 'dark'
  root.dataset.theme = theme

  /* Режим темы */
  root.dataset.themeMode = appState?.themeMode || 'system'

  /* Цветовая схема */
  const primary = isValidHex(appState?.colorScheme?.primary)
    ? appState.colorScheme.primary
    : DEFAULT_PRIMARY
  const accent = isValidHex(appState?.colorScheme?.accent)
    ? appState.colorScheme.accent
    : DEFAULT_ACCENT
  const onAccent = getOnColor(accent)

  root.style.setProperty('--scheme-primary', primary)
  root.style.setProperty('--scheme-accent', accent)
  root.style.setProperty('--scheme-on-accent', onAccent)

  /* Прозрачные вариации primary */
  root.style.setProperty('--scheme-primary-012', hexToRgba(primary, 0.12))
  root.style.setProperty('--scheme-primary-020', hexToRgba(primary, 0.2))
  root.style.setProperty('--scheme-primary-035', hexToRgba(primary, 0.35))

  /* Прозрачные вариации accent */
  root.style.setProperty('--scheme-accent-012', hexToRgba(accent, 0.12))
  root.style.setProperty('--scheme-accent-016', hexToRgba(accent, 0.16))
  root.style.setProperty('--scheme-accent-020', hexToRgba(accent, 0.2))
  root.style.setProperty('--scheme-accent-035', hexToRgba(accent, 0.35))

  devConsole.info(
    `🎨 Тема: ${theme}, схема: ${appState?.colorScheme?.id || '—'}, primary: ${primary}, accent: ${accent}`
  )
}
