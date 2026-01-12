export const qaList = [
  {
    id: 'who',
    question: "你是谁？",
    type: 'profile',
    name: 'YouthY',
    role: 'Frontend Developer & UI Enthusiast',
    answer: "目前还是一条咸鱼，希望有一天......",
    detail: {
      intro: "热衷于探索前沿前端技术，喜欢折腾各种新奇的 UI 效果。不仅仅是写代码，更想创造令人愉悦的交互体验。",
      experiences: [
        { year: '2025', event: '开始接触 Vue 3 生态' },
        { year: '2025-12', event: '独立开发个人博客' },
        { year: 'Now', event: '正在寻找更多可能性' }
      ]
    }
  },
  {
    id: 'words',
    question: "如果用三个词形容你？",
    answer: "保持好奇、长期主义、生活家",
    type: 'text',
    detail: {
      text: "好奇心驱动我不断学习新技术；长期主义让我不畏惧当下的困难，专注于长远的价值；而作为一个生活家，我坚信代码之外，生活本身才是最大的艺术。"
    }
  },
  {
    id: 'stack',
    question: "你的技术栈？",
    type: 'skills',
    skills: ['Vue 3', 'JavaScript', 'TypeScript', 'HTML5/CSS3', 'Node.js', 'Git', 'Vite'],
    detail: {
      main: [
        { name: 'Vue 3 / Nuxt', level: 90 },
        { name: 'JavaScript / TS', level: 85 },
        { name: 'CSS / SCSS', level: 88 },
        { name: 'Node.js', level: 60 }
      ],
      tools: ['Git', 'Vite', 'Webpack', 'VS Code', 'Figma']
    }
  },
  {
    id: 'location',
    question: "坐标在哪里？",
    answer: "中国 · 武汉",
    type: 'text',
    detail: {
      text: "目前生活在武汉，这座城市有着热干面的香气和长江的波涛。如果你也在这里，欢迎面基！☕️"
    }
  },
  // {
  //   id: 'hobbies',
  //   question: "平时喜欢做什么？",
  //   answer: "敲代码、阅读、听音乐、发呆。",
  //   type: 'text',
  //   detail: {
  //     list: [
  //       { icon: '💻', name: 'Coding', desc: '创造数字世界' },
  //       { icon: '📚', name: 'Reading', desc: '科幻、技术、哲学' },
  //       { icon: '🎵', name: 'Music', desc: 'Post-Rock, Indie' },
  //       { icon: '🎮', name: 'Gaming', desc: '塞尔达传说、空洞骑士' }
  //     ]
  //   }
  // },
  // {
  //   id: 'contact',
  //   question: "怎么联系你？",
  //   type: 'social',
  //   detail: {
  //     text: "你可以通过以下任意方式找到我。通常我会并在 24 小时内回复邮件。"
  //   }
  // },
  {
    id: 'quote',
    question: "最喜欢的一句话？",
    answer: "劝君莫惜金缕衣，劝君惜取少年时。",
    subAnswer: "—— 《金缕衣》",
    type: 'quote',
    detail: {
      text: "时光易逝，不仅仅是珍惜时间，更要珍惜每一个当下的感受和体验。Don't count the days, make the days count."
    }
  },
  // {
  //   id: 'goal',
  //   question: "未来的目标？",
  //   answer: "成为一名全栈开发者，创造出有趣的产品。",
  //   type: 'text',
  //   detail: {
  //     text: "希望能够独立开发出一款受人喜爱的产品，无论是工具类还是游戏。同时也希望能为开源社区贡献自己的力量。"
  //   }
  // }
]
