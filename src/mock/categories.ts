import type { Category } from '../types';

export const mockCategories: Category[] = [
  {
    id: 'cat-001',
    name: '服饰鞋包',
    level: 1,
    children: [
      {
        id: 'cat-001-01',
        name: '女装',
        level: 2,
        parentId: 'cat-001',
        children: [
          { id: 'cat-001-01-01', name: '连衣裙', level: 3, parentId: 'cat-001-01' },
          { id: 'cat-001-01-02', name: 'T恤', level: 3, parentId: 'cat-001-01' },
          { id: 'cat-001-01-03', name: '衬衫', level: 3, parentId: 'cat-001-01' },
          { id: 'cat-001-01-04', name: '外套', level: 3, parentId: 'cat-001-01' },
        ],
      },
      {
        id: 'cat-001-02',
        name: '男装',
        level: 2,
        parentId: 'cat-001',
        children: [
          { id: 'cat-001-02-01', name: 'T恤', level: 3, parentId: 'cat-001-02' },
          { id: 'cat-001-02-02', name: '衬衫', level: 3, parentId: 'cat-001-02' },
          { id: 'cat-001-02-03', name: '西装', level: 3, parentId: 'cat-001-02' },
        ],
      },
      {
        id: 'cat-001-03',
        name: '鞋靴',
        level: 2,
        parentId: 'cat-001',
        children: [
          { id: 'cat-001-03-01', name: '运动鞋', level: 3, parentId: 'cat-001-03' },
          { id: 'cat-001-03-02', name: '休闲鞋', level: 3, parentId: 'cat-001-03' },
          { id: 'cat-001-03-03', name: '高跟鞋', level: 3, parentId: 'cat-001-03' },
        ],
      },
    ],
  },
  {
    id: 'cat-002',
    name: '数码家电',
    level: 1,
    children: [
      {
        id: 'cat-002-01',
        name: '手机通讯',
        level: 2,
        parentId: 'cat-002',
        children: [
          { id: 'cat-002-01-01', name: '智能手机', level: 3, parentId: 'cat-002-01' },
          { id: 'cat-002-01-02', name: '手机配件', level: 3, parentId: 'cat-002-01' },
        ],
      },
      {
        id: 'cat-002-02',
        name: '电脑办公',
        level: 2,
        parentId: 'cat-002',
        children: [
          { id: 'cat-002-02-01', name: '笔记本电脑', level: 3, parentId: 'cat-002-02' },
          { id: 'cat-002-02-02', name: '台式电脑', level: 3, parentId: 'cat-002-02' },
          { id: 'cat-002-02-03', name: '平板电脑', level: 3, parentId: 'cat-002-02' },
        ],
      },
      {
        id: 'cat-002-03',
        name: '家用电器',
        level: 2,
        parentId: 'cat-002',
        children: [
          { id: 'cat-002-03-01', name: '电视', level: 3, parentId: 'cat-002-03' },
          { id: 'cat-002-03-02', name: '冰箱', level: 3, parentId: 'cat-002-03' },
          { id: 'cat-002-03-03', name: '洗衣机', level: 3, parentId: 'cat-002-03' },
        ],
      },
    ],
  },
  {
    id: 'cat-003',
    name: '美妆个护',
    level: 1,
    children: [
      {
        id: 'cat-003-01',
        name: '护肤',
        level: 2,
        parentId: 'cat-003',
        children: [
          { id: 'cat-003-01-01', name: '面部护肤', level: 3, parentId: 'cat-003-01' },
          { id: 'cat-003-01-02', name: '身体护理', level: 3, parentId: 'cat-003-01' },
        ],
      },
      {
        id: 'cat-003-02',
        name: '彩妆',
        level: 2,
        parentId: 'cat-003',
        children: [
          { id: 'cat-003-02-01', name: '口红唇彩', level: 3, parentId: 'cat-003-02' },
          { id: 'cat-003-02-02', name: '粉底', level: 3, parentId: 'cat-003-02' },
          { id: 'cat-003-02-03', name: '眼影', level: 3, parentId: 'cat-003-02' },
        ],
      },
    ],
  },
  {
    id: 'cat-004',
    name: '食品生鲜',
    level: 1,
    children: [
      {
        id: 'cat-004-01',
        name: '休闲零食',
        level: 2,
        parentId: 'cat-004',
        children: [
          { id: 'cat-004-01-01', name: '坚果炒货', level: 3, parentId: 'cat-004-01' },
          { id: 'cat-004-01-02', name: '饼干糕点', level: 3, parentId: 'cat-004-01' },
        ],
      },
      {
        id: 'cat-004-02',
        name: '饮料冲调',
        level: 2,
        parentId: 'cat-004',
        children: [
          { id: 'cat-004-02-01', name: '咖啡', level: 3, parentId: 'cat-004-02' },
          { id: 'cat-004-02-02', name: '茶饮', level: 3, parentId: 'cat-004-02' },
        ],
      },
    ],
  },
];
