/**
 * @fileoverview 阅读进度持久化工具。
 * 以文档 permalink 为键，把"阅读进度比例"（0~1）存到 localStorage，
 * 供绿环进度指示与"重新进入自动跳转到上次阅读位置"使用。
 */

const KEY_PREFIX = 'reading-progress:';

/** 生成某篇文档的进度存储键 */
export function getProgressKey(path) {
  return `${KEY_PREFIX}${path || ''}`;
}

/**
 * 保存某篇文档的阅读进度比例。
 * @param {string} path - 文档 permalink
 * @param {number} ratio - 0~1 之间的进度比例
 */
export function saveProgress(path, ratio) {
  if (typeof window === 'undefined' || !path) return;
  const value = typeof ratio === 'number' ? Math.min(1, Math.max(0, ratio)) : 0;
  try {
    window.localStorage.setItem(
      getProgressKey(path),
      JSON.stringify({ratio: value, updatedAt: Date.now()}),
    );
  } catch (error) {
    // localStorage 不可用（隐私模式等）时静默失败
  }
}

/**
 * 读取某篇文档已保存的阅读进度比例。
 * @param {string} path - 文档 permalink
 * @returns {number | null} 0~1 比例；无记录或读取失败返回 null
 */
export function loadProgress(path) {
  if (typeof window === 'undefined' || !path) return null;
  try {
    const raw = window.localStorage.getItem(getProgressKey(path));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return typeof data.ratio === 'number' ? data.ratio : null;
  } catch (error) {
    return null;
  }
}
