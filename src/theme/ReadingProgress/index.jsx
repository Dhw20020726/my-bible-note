/**
 * @fileoverview 阅读进度绿环组件。
 * 悬浮于文档页右下角，以圆环显示当前阅读进度（0~100%）。
 * 滚动到底部时，切换为「回到顶部」按钮（百分比淡出、上箭头淡入），点击平滑回顶。
 * 同时：
 * - 滚动时把进度比例写入 localStorage（节流保存）；
 * - 首次进入某篇文档时，恢复到上次保存的滚动位置。
 *
 * 流畅性：在 requestAnimationFrame 里通过 ref 直接更新 SVG 的 stroke-dashoffset
 * 与百分比文本，避免每次滚动都 setState 触发 React 重渲染；描边本身不用 CSS
 * transition（那会让圆环始终滞后约 0.1s），只有「到底→回顶」切换时才对颜色/箭头
 * 做短过渡。
 */

import React, {useEffect, useRef} from 'react';
import {useLocation} from '@docusaurus/router';
import {loadProgress, saveProgress} from '../../utils/readingProgress';
import styles from './styles.module.css';

const RADIUS = 26; // 圆环半径（viewBox 64 内的 32 中心）
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DONE_THRESHOLD = 0.99; // 滚动比例超过该值视为「到底」，切换为回到顶部按钮

/** 读取当前文档的滚动比例（0~1） */
function getScrollRatio() {
  const doc = document.scrollingElement || document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const current = window.scrollY ?? doc.scrollTop ?? 0;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, current / max));
}

/** 直接把进度写入 DOM（圆环描边偏移 + 百分比文本），避免 React 重渲染 */
function paintProgress(ring, label, ratio) {
  if (ring) ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - ratio));
  if (label) label.textContent = `${Math.round(ratio * 100)}%`;
}

/** 切换「到底 → 回到顶部按钮」状态（增删 CSS Module 的 done 类） */
function toggleDone(container, done) {
  if (!container) return;
  container.classList.toggle(styles.done, done);
}

export default function ReadingProgress() {
  const {pathname} = useLocation();
  const containerRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastRatioRef = useRef(0);
  const tickingRef = useRef(false);

  // 进入文档时恢复上次阅读位置（在 Docusaurus 的 scrollTo(0,0) 之后执行）
  useEffect(() => {
    const saved = loadProgress(pathname);
    lastRatioRef.current = saved ?? 0;
    const willRestore = saved != null && saved > 0.005 && saved < 0.995;
    if (willRestore) {
      paintProgress(ringRef.current, labelRef.current, saved);
      toggleDone(containerRef.current, false);
      const frame = requestAnimationFrame(() => {
        const doc = document.scrollingElement || document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        if (max > 0) {
          window.scrollTo(0, saved * max);
        }
      });
      return () => cancelAnimationFrame(frame);
    }
    paintProgress(ringRef.current, labelRef.current, 0);
    toggleDone(containerRef.current, false);
  }, [pathname]);

  // 跟踪滚动：rAF 节流 + 直接写 DOM，并节流保存进度
  useEffect(() => {
    const update = () => {
      tickingRef.current = false;
      const r = getScrollRatio();
      lastRatioRef.current = r;
      paintProgress(ringRef.current, labelRef.current, r);
      toggleDone(containerRef.current, r >= DONE_THRESHOLD);
      // 节流保存，避免每次 scroll 都写 localStorage 造成卡顿
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveProgress(pathname, r), 300);
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // 用最后一次滚动比例落盘，避免读到已复位为 0 的当前滚动位置
      saveProgress(pathname, lastRatioRef.current);
    };
  }, [pathname]);

  // 到底后点击回到顶部（未到底时点击无动作）
  const scrollToTop = () => {
    if (!containerRef.current || !containerRef.current.classList.contains(styles.done)) {
      return;
    }
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
      ref={containerRef}
      type="button"
      className={styles.readingProgress}
      aria-label="回到顶部"
      onClick={scrollToTop}>
      <svg className={styles.ring} viewBox="0 0 64 64">
        <circle className={styles.track} cx="32" cy="32" r={RADIUS} />
        <circle
          ref={ringRef}
          className={styles.progress}
          cx="32"
          cy="32"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>
      <span ref={labelRef} className={styles.label}>
        0%
      </span>
      <svg
        className={styles.arrow}
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
