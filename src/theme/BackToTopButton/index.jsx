/**
 * @fileoverview 停用 Docusaurus 默认的「回到顶部」悬浮按钮。
 *
 * 阅读进度绿环（ReadingProgress）在滚动到底部时会自动切换成「回到顶部」按钮，
 * 与默认按钮功能重复，因此这里返回 null，避免右下角同时出现两个悬浮物。
 */

export default function BackToTopButton() {
  return null;
}
