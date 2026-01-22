
export const SCHEMAS = {
  'friendList.js': [
    { key: 'name', label: '昵称' },
    { key: 'desc', label: '个性签名' },
    { key: 'link', label: '博客链接' },
    { key: 'avatar', label: '头像', type: 'image' }
  ],
  'photos.js': [
    { key: 'title', label: '照片标题' },
    { key: 'date', label: '拍摄日期', type: 'date' },
    { key: 'category', label: '分类' },
    { key: 'description', label: '背后的故事', type: 'textarea' },
    { key: 'url', label: '照片文件', type: 'image' }
  ],
  'quotes.js': [
    { key: 'content', label: '语录内容', type: 'textarea' },
    { key: 'author', label: '作者/出处' },
    { key: 'source', label: '来源' },
    { key: 'date', label: '记录日期', type: 'date' }
  ],
  'thoughts.js': [
    { key: 'content', label: '此刻的想法...', type: 'textarea' },
    { key: 'date', label: '发布日期', type: 'date' },
    { key: 'comments', label: '初始评论', type: 'number' },
    { key: 'likes', label: '初始点赞', type: 'number' }
  ]
}

export const VIEW_TITLES = {
  article: '撰写新文章',
  article_list: '文章管理',
  'friendList.js': '友情',
  'photos.js': '照片',
  'quotes.js': '语录收藏',
  'thoughts.js': '动态',
  'aboutData.js': '关于我 (配置)',
  media_manager: '媒体库管理',
  taxonomy_manager: '分类标签管理',
  knowledge_graph: '知识图谱',
  system_manager: '系统维护'
}

export const aboutTypeOptions = [
  { value: 'profile', label: '个人介绍' },
  { value: 'text', label: '文本卡片' },
  { value: 'skills', label: '技能卡片' },
  { value: 'quote', label: '引用卡片' },
  { value: 'social', label: '社交卡片' },
  { value: 'hobbies', label: '爱好卡片' }
]
