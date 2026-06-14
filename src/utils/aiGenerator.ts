import type { TaskOutput, Category } from '../types';
import { detectSensitiveWords } from './sensitiveWords';

function generateId(): string {
  return 'output-' + Math.random().toString(36).substring(2, 11);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const titleTemplates = [
  '{year}新款{season}{category}女{style1}{material}{fit}{keyword}',
  '{keyword} {category}女{season}新款{style1}{fit}{material}',
  '【{brandStyle}】{season}{category}女{keyword}{style1}{material}{fit}',
  '{category} {year}夏季新款 {keyword} {style1} {material} {fit}',
  '{style1} {keyword} {category} {season}新款女 {material} {fit}',
];

const sellingPointTemplates = [
  '1. 【{point1}科技】采用{material}材质，{benefit1}\n2. 【{point2}设计】{data}，{benefit2}\n3. 【{point3}体验】{feature}，{benefit3}\n4. 【{point4}造型】{style}，{benefit4}',
  '1. {point1}：{material}材质，{benefit1}\n2. {point2}：{data}，{benefit2}\n3. {point3}：{feature}，{benefit3}\n4. {point4}：{style}，{benefit4}',
  '【{point1}】{material}，{benefit1}\n【{point2}】{data}，{benefit2}\n【{point3}】{feature}，{benefit3}\n【{point4}】{style}，{benefit4}',
];

const badReviewTemplates = [
  '非常抱歉给您带来了不好的体验！{issue}确实是我们的问题，我们已{action}。关于{detail}，您方便说一下具体哪里不满意吗？我们可以为您提供{solution}。再次向您表示诚挚的歉意！',
  '亲，非常抱歉让您失望了！{issue}我们已经在{action}。{detail}您可以直接{solution}，费用我们承担。给您添麻烦了，送您一张{coupon}优惠券，希望能弥补这次不愉快的购物体验~',
  '您好，首先感谢您的反馈！对于{issue}我们深表歉意。我们已经{action}来避免类似问题再次发生。关于{detail}，我们可以为您{solution}，请您私信我们您的订单号，我们会尽快为您处理。',
];

const smsTemplates = [
  '【{brand}】{activity}火热进行中！全场{discount}，前{time}再享{extra}！戳 {link} 立即抢购，{deadline}截止，手慢无！退订回T',
  '【{brand}】亲爱的会员，{activity}福利来啦！全场商品{discount}，叠加{coupon}优惠券，错过再等一年！点击 {link} 选购，活动截止{deadline}。退订回T',
  '【{brand}】{activity}倒计时！{discount}，{gift}，仅限{time}！立即点击 {link} 参与，{deadline}结束不等人~ 退订回T',
];

const competitorTemplates = [
  '【竞品核心卖点】\n1. 主打功效：{features}\n2. 产品优势：{advantages}\n3. 营销手段：{marketing}\n4. 差异化机会：{opportunities}',
  '【竞品分析报告】\n■ 核心卖点：{features}\n■ 用户评价：{reviews}\n■ 价格策略：{price}\n■ 差异化建议：{opportunities}',
];

const toneModifiers: Record<string, { prefix: string[]; suffix: string[] }> = {
  professional: {
    prefix: ['专业级', '高品质', '精选', '高端'],
    suffix: ['品质之选', '值得信赖', '匠心之作'],
  },
  friendly: {
    prefix: ['亲测好用', '超爱的', '推荐', '人手必备'],
    suffix: ['超赞~', '你值得拥有', '快来pick'],
  },
  luxury: {
    prefix: ['奢享', '臻选', '典藏', '高端定制'],
    suffix: ['尊贵体验', '品质生活', '彰显品味'],
  },
  playful: {
    prefix: ['可爱到爆', '绝绝子', '神仙', 'yyds'],
    suffix: ['冲冲冲！', '爱了爱了~', '必入款！'],
  },
};

export async function generateTitle(
  productName: string,
  category: Category,
  tone: string,
  count: number = 3
): Promise<TaskOutput[]> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const year = '2026';
  const season = '夏季';
  const modifier = toneModifiers[tone] || toneModifiers.friendly;
  const brandStyle = modifier.prefix[Math.floor(Math.random() * modifier.prefix.length)];
  
  const outputs: TaskOutput[] = [];
  const usedTemplates = shuffle(titleTemplates).slice(0, count);
  const keywords = productName.split(/[,，\s]/).filter(s => s.trim());
  const shuffledKeywords = shuffle(keywords.length > 0 ? keywords : ['新品', '热销']);
  
  for (let i = 0; i < count; i++) {
    const template = usedTemplates[i % usedTemplates.length];
    const keyword = shuffledKeywords[i % shuffledKeywords.length];
    const style1 = shuffledKeywords[(i + 1) % shuffledKeywords.length];
    const material = shuffledKeywords[(i + 2) % shuffledKeywords.length] || '舒适';
    const fit = shuffledKeywords[(i + 3) % shuffledKeywords.length] || '修身';
    
    let content = template
      .replace(/{year}/g, year)
      .replace(/{season}/g, season)
      .replace(/{category}/g, category.name)
      .replace(/{keyword}/g, keyword)
      .replace(/{style1}/g, style1)
      .replace(/{material}/g, material)
      .replace(/{fit}/g, fit)
      .replace(/{brandStyle}/g, brandStyle);
    
    content = content.replace(/\s+/g, ' ').trim();
    
    outputs.push({
      id: generateId(),
      content,
      sensitiveWords: detectSensitiveWords(content),
      isMarked: false,
      createdAt: new Date().toISOString(),
      version: 1,
    });
  }
  
  return outputs;
}

export async function generateSellingPoints(
  productName: string,
  originalPoints: string[],
  tone: string,
  count: number = 2
): Promise<TaskOutput[]> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const outputs: TaskOutput[] = [];
  const usedTemplates = shuffle(sellingPointTemplates).slice(0, count);
  
  const benefits = ['舒适透气', '持久耐穿', '时尚百搭', '性价比高', '品质保证'];
  const materials = ['优质面料', '环保材质', '进口原料', '高端工艺'];
  const datas = ['经过300+测试', '好评率98%', '销量突破10万+', '30天无理由退换'];
  const features = ['人性化设计', '细节处理到位', '匠心工艺', '专业团队研发'];
  const styles = ['简约时尚', '潮流设计', '经典款式', 'ins风'];
  
  for (let i = 0; i < count; i++) {
    const template = usedTemplates[i % usedTemplates.length];
    
    let content = template;
    originalPoints.forEach((point, idx) => {
      const keys = ['point1', 'point2', 'point3', 'point4'];
      const key = keys[idx] || `point${idx + 1}`;
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), point);
    });
    
    content = content
      .replace(/{material}/g, materials[i % materials.length])
      .replace(/{data}/g, datas[i % datas.length])
      .replace(/{feature}/g, features[i % features.length])
      .replace(/{style}/g, styles[i % styles.length])
      .replace(/{benefit1}/g, benefits[0])
      .replace(/{benefit2}/g, benefits[1])
      .replace(/{benefit3}/g, benefits[2])
      .replace(/{benefit4}/g, benefits[3]);
    
    outputs.push({
      id: generateId(),
      content,
      sensitiveWords: detectSensitiveWords(content),
      isMarked: false,
      createdAt: new Date().toISOString(),
      version: 1,
    });
  }
  
  return outputs;
}

export async function generateBadReviewReply(
  review: string,
  tone: string,
  count: number = 2
): Promise<TaskOutput[]> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const outputs: TaskOutput[] = [];
  const usedTemplates = shuffle(badReviewTemplates).slice(0, count);
  
  const issues = [
    '物流延误问题',
    '商品质量问题',
    '尺码不合适',
    '色差问题',
    '客服响应慢',
  ];
  const actions = [
    '联系快递公司优化配送路线',
    '加强品控检查',
    '完善尺码对照表',
    '校准显示器色彩',
    '增加客服人员',
  ];
  const solutions = [
    '退换货服务',
    '全额退款',
    '补发正确商品',
    '发送优惠券补偿',
    '专属客服跟进',
  ];
  const coupons = ['5元', '10元', '20元', '30元无门槛'];
  
  for (let i = 0; i < count; i++) {
    const template = usedTemplates[i % usedTemplates.length];
    
    let content = template
      .replace(/{issue}/g, issues[i % issues.length])
      .replace(/{action}/g, actions[i % actions.length])
      .replace(/{detail}/g, '您提到的问题')
      .replace(/{solution}/g, solutions[i % solutions.length])
      .replace(/{coupon}/g, coupons[i % coupons.length]);
    
    outputs.push({
      id: generateId(),
      content,
      sensitiveWords: detectSensitiveWords(content),
      isMarked: false,
      createdAt: new Date().toISOString(),
      version: 1,
    });
  }
  
  return outputs;
}

export async function generateSms(
  activity: string,
  discount: string,
  deadline: string,
  tone: string,
  count: number = 2
): Promise<TaskOutput[]> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const outputs: TaskOutput[] = [];
  const usedTemplates = shuffle(smsTemplates).slice(0, count);
  
  const brands = ['XX旗舰店', 'XX官方', 'XX优品'];
  const times = ['1小时', '1000名', '3天', '限时'];
  const extras = ['8折优惠', '满减50', '赠品一份', '免运费'];
  const coupons = ['满300减50', '满200减30', '无门槛20元'];
  const gifts = ['买一送一', '赠送精美礼品', '前500名送小样'];
  const links = ['xxx.com', 't.cn/xxx', '点击查看'];
  
  for (let i = 0; i < count; i++) {
    const template = usedTemplates[i % usedTemplates.length];
    
    let content = template
      .replace(/{brand}/g, brands[i % brands.length])
      .replace(/{activity}/g, activity)
      .replace(/{discount}/g, discount)
      .replace(/{deadline}/g, deadline)
      .replace(/{time}/g, times[i % times.length])
      .replace(/{extra}/g, extras[i % extras.length])
      .replace(/{coupon}/g, coupons[i % coupons.length])
      .replace(/{gift}/g, gifts[i % gifts.length])
      .replace(/{link}/g, links[i % links.length]);
    
    outputs.push({
      id: generateId(),
      content,
      sensitiveWords: detectSensitiveWords(content),
      isMarked: false,
      createdAt: new Date().toISOString(),
      version: 1,
    });
  }
  
  return outputs;
}

export async function generateCompetitorAnalysis(
  competitorContent: string,
  count: number = 1
): Promise<TaskOutput[]> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const outputs: TaskOutput[] = [];
  const usedTemplates = shuffle(competitorTemplates).slice(0, count);
  
  const featuresList = [
    '持久显色、滋润不拔干',
    '轻便舒适、性能强劲',
    '材质优良、做工精细',
    '功能齐全、操作简单',
  ];
  const advantagesList = [
    '色号选择丰富、性价比高',
    '续航时间长、充电速度快',
    '品牌知名度高、售后服务好',
    '包装精美、送礼首选',
  ];
  const marketingList = [
    '头部主播推荐、明星代言',
    'KOL种草、社媒投放',
    '限时促销、满减活动',
    '会员专享、积分兑换',
  ];
  const reviewsList = [
    '好评如潮、回购率高',
    '用户口碑好、推荐指数高',
    '评价两极分化、有待改进',
    '整体满意、细节可优化',
  ];
  const priceList = [
    '中高端定价、物有所值',
    '亲民价位、性价比高',
    '高端路线、品质保证',
    '促销活动多、入手划算',
  ];
  const opportunitiesList = [
    '可强调成分天然、可咬唇妆效、便携设计等卖点',
    '可突出轻量化设计、更高配置、更好散热',
    '可在包装、香味、使用体验上做差异化',
    '可增加智能功能、APP互联、生态联动',
  ];
  
  for (let i = 0; i < count; i++) {
    const template = usedTemplates[i % usedTemplates.length];
    
    let content = template
      .replace(/{features}/g, featuresList[i % featuresList.length])
      .replace(/{advantages}/g, advantagesList[i % advantagesList.length])
      .replace(/{marketing}/g, marketingList[i % marketingList.length])
      .replace(/{reviews}/g, reviewsList[i % reviewsList.length])
      .replace(/{price}/g, priceList[i % priceList.length])
      .replace(/{opportunities}/g, opportunitiesList[i % opportunitiesList.length]);
    
    outputs.push({
      id: generateId(),
      content,
      sensitiveWords: detectSensitiveWords(content),
      isMarked: false,
      createdAt: new Date().toISOString(),
      version: 1,
    });
  }
  
  return outputs;
}

export async function generateImageProcessing(
  imageType: string,
  options: Record<string, string>
): Promise<TaskOutput[]> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const backgrounds: Record<string, string> = {
    studio: '纯色摄影棚背景',
    lifestyle: '生活场景背景',
    nature: '自然风景背景',
    gradient: '渐变色彩背景',
  };
  
  const platforms: Record<string, string> = {
    taobao: '淘宝主图尺寸800x800px',
    jd: '京东主图尺寸800x800px',
    douyin: '抖音商品图尺寸750x1000px',
    xiaohongshu: '小红书笔记图尺寸1080x1440px',
  };
  
  const bgName = backgrounds[options.background] || options.background;
  const platformName = platforms[options.platform] || options.platform;
  
  const content = `已完成${imageType}：${bgName}，适配${platformName}`;
  
  return [{
    id: generateId(),
    content,
    sensitiveWords: [],
    isMarked: true,
    createdAt: new Date().toISOString(),
    version: 1,
  }];
}
