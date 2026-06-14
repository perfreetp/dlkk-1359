import type { SensitiveWord } from '../types';

interface SensitiveWordEntry {
  word: string;
  level: 'warning' | 'danger';
  suggestion: string;
}

export const sensitiveWordList: SensitiveWordEntry[] = [
  { word: '全网最低价', level: 'danger', suggestion: '建议替换为"限时特惠"或"超值价"' },
  { word: '最低价', level: 'danger', suggestion: '建议替换为"优惠价"或"特惠价"' },
  { word: '最好', level: 'danger', suggestion: '建议替换为"优秀"或"出色"' },
  { word: '最佳', level: 'danger', suggestion: '建议替换为"优质"或"精选"' },
  { word: '第一', level: 'danger', suggestion: '建议删除或具体说明排名来源' },
  { word: '顶级', level: 'danger', suggestion: '建议替换为"高端"或"优质"' },
  { word: '国家级', level: 'danger', suggestion: '建议删除或提供有效证明' },
  { word: '世界级', level: 'danger', suggestion: '建议删除或提供有效证明' },
  { word: '全球领先', level: 'danger', suggestion: '建议删除或提供数据支撑' },
  { word: '绝对', level: 'danger', suggestion: '建议替换为"相对"或删除' },
  { word: '100%', level: 'warning', suggestion: '建议提供检测报告或改为"几乎"' },
  { word: '纯天然', level: 'warning', suggestion: '建议提供成分证明' },
  { word: '无毒', level: 'warning', suggestion: '建议提供检测报告' },
  { word: '秒杀', level: 'warning', suggestion: '可保留，建议配合具体活动说明' },
  { word: '抢疯了', level: 'warning', suggestion: '可保留，建议适度使用' },
  { word: '手慢无', level: 'warning', suggestion: '可保留，建议配合库存说明' },
  { word: '仙女', level: 'warning', suggestion: '可保留，建议搭配具体描述' },
  { word: '告别', level: 'warning', suggestion: '可替换为"有效缓解"或"改善"' },
  { word: '性价比之王', level: 'danger', suggestion: '建议改为"高性价比"' },
  { word: '王炸', level: 'danger', suggestion: '建议删除或改为"重磅"' },
  { word: '史无前例', level: 'danger', suggestion: '建议改为"年度首次"或"限时"' },
  { word: '永久', level: 'danger', suggestion: '建议改为"长期"或"持久"' },
  { word: '万能', level: 'danger', suggestion: '建议改为"多功能"或具体说明用途' },
  { word: '最高级', level: 'danger', suggestion: '建议删除或提供依据' },
  { word: '最先进', level: 'danger', suggestion: '建议提供技术认证或改为"先进"' },
];

export function detectSensitiveWords(content: string): SensitiveWord[] {
  const results: SensitiveWord[] = [];
  
  for (const entry of sensitiveWordList) {
    let position = content.indexOf(entry.word);
    while (position !== -1) {
      results.push({
        word: entry.word,
        position,
        level: entry.level,
        suggestion: entry.suggestion,
      });
      position = content.indexOf(entry.word, position + 1);
    }
  }
  
  return results.sort((a, b) => a.position - b.position);
}

export function highlightSensitiveWords(content: string, sensitiveWords: SensitiveWord[]): string {
  if (sensitiveWords.length === 0) return content;
  
  let result = content;
  const sortedWords = [...sensitiveWords].sort((a, b) => b.position - a.position);
  
  for (const sw of sortedWords) {
    const before = result.slice(0, sw.position);
    const word = result.slice(sw.position, sw.position + sw.word.length);
    const after = result.slice(sw.position + sw.word.length);
    const className = sw.level === 'danger' ? 'sensitive-danger' : 'sensitive-warning';
    result = `${before}<span class="${className}" data-tip="${sw.suggestion}">${word}</span>${after}`;
  }
  
  return result;
}
