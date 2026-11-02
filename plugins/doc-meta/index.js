/**
 * @fileoverview Docusaurus remark 插件 —— 文档元信息（上传/更新日期）注入。
 *
 * 通过 git 历史计算每个 Markdown 文件的首次提交日期（上传日期）与最近提交日期（更新日期），
 * 写入 frontMatter 的 createdAt / updatedAt 字段，供 DocItem 展示。
 *
 * 说明：
 * - 首次提交日期：git log --follow --diff-filter=A，即该文件被"新增"的那次提交；
 * - 最近提交日期：git log 最新一条。
 * - 日期格式使用 %cs（YYYY-MM-DD），即提交者本地时区的日期。
 * - git 不可用 / 文件未提交时静默跳过，不打断构建。
 *
 * 由于 remark 插件运行在 MDX 编译阶段，而 frontMatter 会在编译后统一序列化导出，
 * 直接修改 file.data.frontMatter 即可让日期出现在 useDoc().frontMatter 中。
 */

const {execFileSync} = require('child_process');

/**
 * 获取指定文件在 git 历史中的某次提交日期。
 * @param {string} filePath - 文件的绝对路径
 * @param {boolean} oldest - true 取首次提交（上传），false 取最近提交（更新）
 * @returns {string | null} "YYYY-MM-DD" 格式日期，失败返回 null
 */
function gitCommitDate(filePath, oldest) {
  const args = [
    '-c',
    'log.showSignature=false',
    'log',
    // 首次提交：跟随重命名 + 只保留"新增"（A）的那次提交
    ...(oldest ? ['--follow', '--diff-filter=A'] : []),
    '--format=%cs',
    '-1',
    '--',
    filePath,
  ];

  try {
    const output = execFileSync('git', args, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return output || null;
  } catch (error) {
    return null;
  }
}

module.exports = function docMetaPlugin() {
  return (tree, file) => {
    const frontMatter = file && file.data && file.data.frontMatter;
    if (!frontMatter || typeof frontMatter !== 'object') return;
    const filePath = file.path;
    if (!filePath) return;

    const createdAt = gitCommitDate(filePath, true);
    const updatedAt = gitCommitDate(filePath, false);

    if (createdAt) frontMatter.createdAt = createdAt;
    if (updatedAt) frontMatter.updatedAt = updatedAt;
  };
};
