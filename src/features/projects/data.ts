export type ProjectSeed = {
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  summary: string;
  highlights: string[];
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  sourceRepo?: string;
};

export type ToolCategory = { key: string; label: string };
export type ToolItem = {
  name: string;
  summary: string;
  href: string;
  category: string;
  tags: string[];
};

export const GITHUB_PROFILE_URL = "https://github.com/Wanfeng1028";

export const projectSeeds: ProjectSeed[] = [
  {
    order: 1,
    slug: "offshore-sargassum-forecast",
    title: "基于深度学习的夜间大范围海洋叶绿素浓度智能预测",
    subtitle: "LSTM + Transformer 时空预测项目",
    role: "全栈开发",
    period: "2024-03 ~ 2025-06",
    summary:
      "基于多源高分辨率遥感数据构建夜间海洋叶绿素预测系统，包含前端可视化展示、后端推理服务和模型部署。",
    highlights: [
      "建立 LSTM 与 Transformer 联合预测链路，测试集 MAE 约 0.0366，RMSE 约 0.0934",
      "前端基于 Vue3 + Mapbox GL + ECharts，实现时空可视化与动态交互",
      "后端采用 FastAPI + PostGIS + GeoJSON 管线，支持大规模空间数据处理与推理接口"
    ],
    techStack: ["Vue3", "TypeScript", "Mapbox GL", "ECharts", "FastAPI", "PostGIS", "PyTorch", "Docker"],
    githubUrl: GITHUB_PROFILE_URL
  },
  {
    order: 2,
    slug: "parrot-sound-tts",
    title: "Parrot-Sound TTS（文本转语音）AI 语音生成网站",
    subtitle: "中文 TTS 模型训练与前端站点落地",
    role: "前端开发",
    period: "2025-03 ~ 2025-09",
    summary: "围绕 TTS 模型推理链路搭建网站端到端体验，支持文本输入、语音试听、结果下载与任务状态反馈。",
    highlights: [
      "前端采用 Vue3 + TypeScript + Vite + Pinia + Element Plus，交互链路完整",
      "后端通过 FastAPI 暴露推理接口，支持异步任务队列与状态跟踪",
      "针对中文语音合成场景做参数调优，提升语音自然度与响应稳定性"
    ],
    techStack: ["Vue3", "TypeScript", "Vite", "Pinia", "Element Plus", "FastAPI", "CosyVoice"],
    githubUrl: GITHUB_PROFILE_URL
  },
  {
    order: 3,
    slug: "vessel-detection-control-platform",
    title: "海洋目标识别与雷达点云补全系统",
    subtitle: "项目负责人 / 模型训练 / 前端开发",
    role: "项目负责人 & 模型训练 & 前端开发",
    period: "2024-04 ~ 2025-08",
    summary: "面向海洋场景构建目标识别与雷达点云补全一体化平台，支持实时检测、结果追踪和可视化分析。",
    highlights: [
      "基于 YOLOv11 进行目标检测训练，核心指标 mAP 约 0.973",
      "前端使用 Vue3 + Three.js + ECharts 实现三维可视化和数据看板",
      "后端 FastAPI + OpenCV + Docker 化部署，实现稳定的实时推理链路"
    ],
    techStack: ["Vue3", "Three.js", "ECharts", "FastAPI", "OpenCV", "YOLO", "Docker"],
    githubUrl: GITHUB_PROFILE_URL
  },
  {
    order: 4,
    slug: "wanfeng-blog-web",
    title: "Wanfeng Blog Web",
    subtitle: "个人全栈博客系统",
    role: "全栈开发",
    period: "持续迭代",
    summary: "基于 Next.js App Router 的个人博客，包含内容管理、鉴权、评论、搜索、SEO 与部署链路。",
    highlights: [
      "实现前台站点 + 管理后台 + 权限控制，支持文章全流程管理",
      "集成 Prisma + PostgreSQL + Auth.js，具备完整登录安全能力",
      "支持 RSS / Sitemap / OG / 搜索能力，满足上线要求"
    ],
    techStack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL", "Auth.js"],
    githubUrl: GITHUB_PROFILE_URL,
    demoUrl: "/"
  }
];

export const toolCategories: ToolCategory[] = [
  { key: "all", label: "全部" },
  { key: "writing", label: "写作与润色" },
  { key: "search", label: "搜索与研究" },
  { key: "dev", label: "编程与开发" },
  { key: "design", label: "图像与设计" },
  { key: "media", label: "视频与音频" },
  { key: "productivity", label: "办公与效率" },
  { key: "other", label: "其他" }
];

export const aiTools: ToolItem[] = [
  { name: "ChatGPT", summary: "多场景 AI 助手，适合写作、总结、代码解释与问答。", href: "https://chat.openai.com", category: "writing", tags: ["写作", "问答", "代码"] },
  { name: "Claude", summary: "长上下文与文档处理能力强，适合深度阅读与润色。", href: "https://claude.ai", category: "writing", tags: ["润色", "长文", "总结"] },
  { name: "Gemini", summary: "Google 的多模态模型，适合日常写作、检索与代码辅助。", href: "https://gemini.google.com", category: "writing", tags: ["多模态", "写作", "Google"] },
  { name: "Kimi", summary: "中文场景友好，支持长文阅读和联网问答。", href: "https://kimi.moonshot.cn", category: "writing", tags: ["中文", "长文本", "联网"] },
  { name: "Perplexity", summary: "面向检索的 AI 搜索引擎，给出引用来源，适合研究。", href: "https://www.perplexity.ai", category: "search", tags: ["搜索", "研究", "引用"] },
  { name: "Phind", summary: "偏开发者场景的智能搜索，适合技术问题排查。", href: "https://www.phind.com", category: "search", tags: ["开发", "搜索", "技术"] },
  { name: "GitHub Copilot", summary: "IDE 内代码补全与生成，提升日常开发效率。", href: "https://github.com/features/copilot", category: "dev", tags: ["编程", "IDE", "效率"] },
  { name: "Cursor", summary: "以 AI 为中心的代码编辑器，适合重构与项目级修改。", href: "https://www.cursor.com", category: "dev", tags: ["开发", "重构", "Agent"] },
  { name: "Codeium", summary: "免费代码补全工具，支持多编辑器和多语言。", href: "https://codeium.com", category: "dev", tags: ["补全", "IDE", "免费"] },
  { name: "Vercel v0", summary: "通过文本快速生成前端 UI 代码。", href: "https://v0.dev", category: "dev", tags: ["前端", "UI", "生成"] },
  { name: "Midjourney", summary: "高质量图像生成，适合概念图、封面图与设计探索。", href: "https://www.midjourney.com", category: "design", tags: ["图像", "创意", "封面"] },
  { name: "Canva AI", summary: "快速完成海报、演示文稿与社媒素材设计。", href: "https://www.canva.com", category: "design", tags: ["设计", "模板", "海报"] },
  { name: "Runway", summary: "视频生成与编辑工具，适合短视频和动态视觉内容。", href: "https://runwayml.com", category: "media", tags: ["视频", "生成", "剪辑"] },
  { name: "ElevenLabs", summary: "AI 配音与语音合成，适合播客、讲解与配音任务。", href: "https://elevenlabs.io", category: "media", tags: ["语音", "配音", "音频"] },
  { name: "Suno", summary: "文本生成音乐，适合短片配乐和灵感创作。", href: "https://suno.com", category: "media", tags: ["音乐", "生成", "创作"] },
  { name: "Notion AI", summary: "文档协作中的 AI 助手，适合会议纪要和知识管理。", href: "https://www.notion.so/product/ai", category: "productivity", tags: ["文档", "协作", "效率"] },
  { name: "Gamma", summary: "快速生成演示文稿和网页式提案。", href: "https://gamma.app", category: "productivity", tags: ["演示", "提案", "效率"] },
  { name: "Zapier AI", summary: "自动化流程平台，连接应用并减少重复工作。", href: "https://zapier.com/ai", category: "productivity", tags: ["自动化", "流程", "效率"] },
  { name: "Hugging Face", summary: "模型与数据集生态，适合探索开源模型能力。", href: "https://huggingface.co", category: "other", tags: ["模型", "开源", "社区"] },
  { name: "OpenRouter", summary: "统一接入多家模型 API 的网关服务。", href: "https://openrouter.ai", category: "other", tags: ["API", "网关", "模型"] }
];

