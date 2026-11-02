/**
 * @fileoverview 阅读进度绿环组件。
 * 悬浮于文档页右下角（回到顶部按钮上方），以圆环显示当前阅读进度（0~100%）。
 * 同时：
 * - 滚动时把进度比例写入 localStorage（节流保存）；
 * - 首次进入某篇文档时，恢复到上次保存的滚动位置。
 *
 * 流畅性：在 requestAnimationFrame 里通过 ref 直接更新 SVG 的 stroke-dashoffset
 * 与百分比文本，避免每次滚动都 setState 触发 React 重渲染；也不使用 CSS
 * transition（后者会让圆环始终滞后约 0.1s，且在部分 iOS 上不生效）。
 */

import React, {useEffect, useRef} from 'react';
import {useLocation} from '@docusaurus/router';
import {loadProgress, saveProgress} from '../../utils/readingProgress';
import styles from './styles.module.css';

const RADIUS = 26; // 圆环半径（viewBox 64 内的 32 中心）
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

export default function ReadingProgress() {
  const {pathname} = useLocation();
  const ringRef = useRef(null);
  const labelRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastRatioRef = useRef(0);
  const tickingRef = useRef(false);

  // 进入文档时恢复上次阅读位置（在 Docusaurus 的 scrollTo(0,0) 之后执行）
  useEffect(() => {
    const saved = loadProgress(pathname);
    lastRatioRef.current = saved ?? 0;
    if (saved != null && saved > 0.005 && saved < 0.995) {
      paintProgress(ringRef.current, labelRef.current, saved);
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
  }, [pathname]);

  // 跟踪滚动：rAF 节流 + 直接写 DOM，并节流保存进度
  useEffect(() => {
    const update = () => {
      tickingRef.current = false;
      const r = getScrollRatio();
      lastRatioRef.current = r;
      paintProgress(ringRef.current, labelRef.current, r);
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

  return (
    <div className={styles.readingProgress} aria-hidden="true">
      <svg viewBox="0 0 64 64" width="56" height="56">
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
    </div>
  );
}
