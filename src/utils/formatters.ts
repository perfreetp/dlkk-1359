export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    product: '商品文案',
    service: '客服话术',
    image: '图片处理',
    title: '标题生成',
    sellingPoint: '卖点改写',
    badReview: '差评回复',
    sms: '活动短信',
    competitor: '竞品分析',
    background: '背景替换',
    crop: '智能裁剪',
  };
  return labels[type] || type;
}

export function getTaskTypeColor(type: string): string {
  const colors: Record<string, string> = {
    product: 'bg-blue-100 text-blue-800',
    service: 'bg-green-100 text-green-800',
    image: 'bg-purple-100 text-purple-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '处理中',
    completed: '已完成',
    marked: '已标记',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    marked: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getToneLabel(tone: string): string {
  const labels: Record<string, string> = {
    professional: '专业商务',
    friendly: '亲切友好',
    luxury: '奢华高端',
    playful: '活泼有趣',
  };
  return labels[tone] || tone;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        resolve(true);
      } catch {
        resolve(false);
      }
      document.body.removeChild(textarea);
    }
  });
}

export function downloadCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
