/**
 * @fileoverview Docusaurus remark 插件 —— 正文开头整段经文插入。
 *
 * 依据 frontmatter 的 title（通常是经文引用，如 "马太福音 9:2-13"），
 * 在正文最前面（引言等其它标题之前）插入整段经文 <blockquote>。
 *
 * 与 auto-bible 的区别：
 * - auto-bible 按每个 H2 标题逐段插入对应经文；
 * - 本插件只插入一次"整篇的核心经文"，让读者一开头就看到全文。
 *
 * 非经文标题（如 "从亚伯拉罕到大卫"）解析失败时静默跳过，不插入任何内容。
 */

const path = require('path');
const {renderPassage, DEFAULT_VERSION} = require('../bible-embed');
const {parsePassage} = require('../../lib/bible-parser');

module.exports = function passageIntroPlugin(userOptions = {}) {
  const baseDir = userOptions.baseDir || path.join(process.cwd(), 'static', 'bible');
  const version = userOptions.version || DEFAULT_VERSION;

  return (tree, file) => {
    const title = file && file.data && file.data.frontMatter && file.data.frontMatter.title;
    if (!title) return;

    const passage = String(title).trim();
    if (!passage) return;

    // 只有能解析为经文引用的标题才插入整段经文，其它标题（如主题讲道标题）跳过
    let refs;
    try {
      refs = parsePassage(passage);
    } catch (error) {
      return;
    }
    if (!refs || refs.length === 0) return;

    const passageNode = renderPassage({baseDir, version, passage});
    tree.children.unshift(passageNode);
  };
};
