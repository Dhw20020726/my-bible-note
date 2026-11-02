/**
 * @fileoverview 文档正文内容组件（覆盖 Docusaurus 默认实现）。
 *
 * 在默认的"合成标题 + MDX 正文"基础上，于标题下方插入一行元信息
 * （上传日期 / 更新日期），日期来自 doc-meta 插件写入 frontMatter 的
 * createdAt / updatedAt 字段。
 */

import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';

/**
 * 与默认实现一致：若 frontmatter 未隐藏标题、且正文本身没有顶层 h1，
 * 则渲染一个由 metadata.title 生成的"合成标题"。
 */
function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

/** 渲染"上传日期 / 更新日期"元信息行；两个日期都没有时返回 null */
function DocDates({createdAt, updatedAt}) {
  if (!createdAt && !updatedAt) {
    return null;
  }
  return (
    <div className="doc-dates">
      {createdAt && (
        <span className="doc-dates__item">
          <span className="doc-dates__label">上传日期</span>
          <span className="doc-dates__value">{createdAt}</span>
        </span>
      )}
      {updatedAt && (
        <span className="doc-dates__item">
          <span className="doc-dates__label">更新日期</span>
          <span className="doc-dates__value">{updatedAt}</span>
        </span>
      )}
    </div>
  );
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  const {frontMatter} = useDoc();

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      <DocDates
        createdAt={frontMatter.createdAt}
        updatedAt={frontMatter.updatedAt}
      />
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
