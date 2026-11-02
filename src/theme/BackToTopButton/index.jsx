/**
 * @fileoverview 回到顶部按钮（覆盖 Docusaurus 默认实现）。
 *
 * 默认实现使用自研的 requestAnimationFrame 平滑滚动 polyfill，在部分手机浏览器上
 * 会被地址栏收起/展开打断，出现"只往上跳一段"就停下的问题。
 * 这里改为直接使用浏览器原生的 document.scrollingElement.scrollTo({behavior:'smooth'})，
 * 原生平滑滚动由浏览器合成器处理，对移动端更可靠；不支持时回退为瞬时跳转。
 */

import React, {useEffect, useState} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import {ThemeClassNames} from '@docusaurus/theme-common';
import styles from './styles.module.css';

export default function BackToTopButton() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY ?? window.pageYOffset ?? 0;
      const nearBottom =
        scrollY + window.innerHeight < document.documentElement.scrollHeight;
      setShown(scrollY > 300 && nearBottom);
    };
    update();
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollToTop = () => {
    const scroller = document.scrollingElement || document.documentElement;
    if (scroller && typeof scroller.scrollTo === 'function') {
      try {
        scroller.scrollTo({top: 0, behavior: 'smooth'});
        return;
      } catch (error) {
        // 某些环境不支持 options 参数，回退到瞬时跳转
      }
    }
    window.scrollTo(0, 0);
  };

  return (
    <button
      aria-label={translate({
        id: 'theme.BackToTopButton.buttonAriaLabel',
        message: 'Scroll back to top',
        description: 'The ARIA label for the back to top button',
      })}
      className={clsx(
        'clean-btn',
        ThemeClassNames.common.backToTopButton,
        styles.backToTopButton,
        shown && styles.backToTopButtonShow,
      )}
      type="button"
      onClick={scrollToTop}
    />
  );
}
