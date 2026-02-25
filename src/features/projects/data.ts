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
  { key: "all",          label: "全部" },
  { key: "chat",         label: "AI 聊天助手" },
  { key: "writing",      label: "写作与润色" },
  { key: "search",       label: "搜索与研究" },
  { key: "dev",          label: "编程与开发" },
  { key: "agent",        label: "AI 智能体" },
  { key: "design",       label: "图像与设计" },
  { key: "media",        label: "视频与音频" },
  { key: "productivity", label: "办公与效率" },
  { key: "other",        label: "其他" }
];

export const aiTools: ToolItem[] = [
  // ── AI 聊天助手 ──────────────────────────────────────────────
  { name: "ChatGPT",      summary: "OpenAI 推出的 AI 聊天机器人，多场景助手，适合写作、总结、代码解释与问答。",              href: "https://chat.openai.com",           category: "chat",         tags: ["写作", "问答", "代码"] },
  { name: "Claude",       summary: "Anthropic 推出的对话式 AI，长上下文与文档处理能力强，适合深度阅读与润色。",               href: "https://claude.ai",                 category: "chat",         tags: ["润色", "长文", "对话"] },
  { name: "Gemini",       summary: "Google 推出的多模态 AI，适合日常写作、检索与代码辅助。",                                  href: "https://gemini.google.com",         category: "chat",         tags: ["多模态", "写作", "Google"] },
  { name: "豆包",          summary: "字节跳动推出的智能对话助手，办公创作全能，支持多种大模型。",                               href: "https://www.doubao.com",            category: "chat",         tags: ["中文", "对话", "创作"] },
  { name: "Kimi",         summary: "月之暗面推出的 AI，中文场景友好，支持长文阅读和联网问答。",                                href: "https://kimi.moonshot.cn",          category: "chat",         tags: ["中文", "长文本", "联网"] },
  { name: "讯飞星火",      summary: "科大讯飞推出的 AI 智能助手，支持免费 PPT 生成与深度研究。",                               href: "https://xinghuo.xfyun.cn",          category: "chat",         tags: ["中文", "PPT", "研究"] },
  { name: "腾讯元宝",      summary: "腾讯推出的免费 AI 智能助手，基于混元大模型，支持多轮对话与内容创作。",                    href: "https://yuanbao.tencent.com",       category: "chat",         tags: ["中文", "免费", "创作"] },
  { name: "文心一言",      summary: "百度推出的知识增强大语言模型，适合中文创作、问答和代码生成。",                             href: "https://yiyan.baidu.com",           category: "chat",         tags: ["中文", "百度", "写作"] },
  { name: "通义千问",      summary: "阿里推出的 AI 助手，支持多轮对话、文档理解和代码生成。",                                  href: "https://qianwen.aliyun.com",        category: "chat",         tags: ["中文", "阿里", "代码"] },
  { name: "DeepSeek",     summary: "深度求索推出的高性能大模型，数学与代码能力突出，支持免费使用。",                           href: "https://chat.deepseek.com",         category: "chat",         tags: ["推理", "代码", "免费"] },
  { name: "Grok",         summary: "xAI 推出的 AI 助手，实时联网，内置幽默风格，适合探索与问答。",                            href: "https://grok.x.ai",                 category: "chat",         tags: ["实时", "问答", "xAI"] },

  // ── 写作与润色 ──────────────────────────────────────────────
  { name: "Notion AI",    summary: "文档协作中的 AI 助手，适合会议纪要、文章润色和知识管理。",                                 href: "https://www.notion.so/product/ai",  category: "writing",      tags: ["文档", "协作", "效率"] },
  { name: "笔灵AI写作",   summary: "600+ 写作模板，AI 一键生成论文/小说，支持论文降重降 AI。",                                href: "https://ibiling.cn",                category: "writing",      tags: ["论文", "小说", "模板"] },
  { name: "蛙蛙写作",     summary: "AI 小说和内容创作工具，适合长篇小说快速推进情节。",                                        href: "https://www.wawawriter.com",        category: "writing",      tags: ["小说", "创作", "长文"] },
  { name: "讯飞绘文",     summary: "免费 AI 写作工具，5 分钟生成一篇原创稿，适合内容运营。",                                  href: "https://huiwen.xfyun.cn",           category: "writing",      tags: ["免费", "运营", "原创"] },
  { name: "新华妙笔",     summary: "新华社推出的体制内办公学习平台，适合公文与报告撰写。",                                     href: "https://miaobi.xinhuaskl.com",      category: "writing",      tags: ["公文", "报告", "体制"] },
  { name: "Copy.ai",      summary: "营销文案生成工具，适合广告语、邮件和社媒内容批量产出。",                                   href: "https://www.copy.ai",               category: "writing",      tags: ["营销", "文案", "广告"] },
  { name: "Jasper",       summary: "企业级 AI 内容平台，支持多语言博客、落地页和邮件撰写。",                                   href: "https://www.jasper.ai",             category: "writing",      tags: ["企业", "博客", "多语言"] },

  // ── 搜索与研究 ──────────────────────────────────────────────
  { name: "Perplexity",   summary: "面向检索的 AI 搜索引擎，给出引用来源，适合学术研究与事实核查。",                           href: "https://www.perplexity.ai",         category: "search",       tags: ["搜索", "研究", "引用"] },
  { name: "秘塔AI搜索",   summary: "最好用的 AI 搜索工具之一，没有广告，直达结果，支持深度研究。",                             href: "https://metaso.cn",                 category: "search",       tags: ["搜索", "无广告", "研究"] },
  { name: "夸克AI",       summary: "集 AI 搜索、网盘、文档、创作等功能于一体的综合应用。",                                     href: "https://quark.sm.cn",               category: "search",       tags: ["搜索", "网盘", "综合"] },
  { name: "SearchGPT",    summary: "OpenAI 最新推出的 AI 搜索引擎，实时联网并给出结构化答案。",                               href: "https://chatgpt.com",               category: "search",       tags: ["搜索", "实时", "OpenAI"] },
  { name: "Phind",        summary: "偏开发者场景的智能搜索，适合技术问题排查与代码示例检索。",                                 href: "https://www.phind.com",             category: "search",       tags: ["开发", "搜索", "技术"] },
  { name: "玻尔",          summary: "新一代科研知识库与 AI 学术搜索平台，适合文献检索与知识图谱。",                             href: "https://bohrium.dp.tech",           category: "search",       tags: ["科研", "学术", "文献"] },
  { name: "Consensus",    summary: "基于科学论文的 AI 问答工具，直接从研究文献中提取答案。",                                   href: "https://consensus.app",             category: "search",       tags: ["论文", "学术", "问答"] },

  // ── 编程与开发 ──────────────────────────────────────────────
  { name: "GitHub Copilot", summary: "IDE 内代码补全与生成，提升日常开发效率，支持多语言。",                                  href: "https://github.com/features/copilot", category: "dev",        tags: ["编程", "IDE", "效率"] },
  { name: "Cursor",       summary: "以 AI 为中心的代码编辑器，适合重构与项目级修改，内置多模型支持。",                         href: "https://www.cursor.com",            category: "dev",          tags: ["开发", "重构", "Agent"] },
  { name: "Codeium",      summary: "免费代码补全工具，支持多编辑器和多语言，速度快。",                                         href: "https://codeium.com",               category: "dev",          tags: ["补全", "IDE", "免费"] },
  { name: "Vercel v0",    summary: "通过自然语言快速生成前端 UI 组件代码，基于 Tailwind + shadcn。",                           href: "https://v0.dev",                    category: "dev",          tags: ["前端", "UI", "生成"] },
  { name: "TRAE",         summary: "字节跳动推出的 AI IDE 编程工具，免费使用，内置多种大模型。",                               href: "https://www.trae.ai",               category: "dev",          tags: ["IDE", "免费", "字节"] },
  { name: "文心快码",      summary: "百度推出的 AI 编程助手，基于文心大模型，支持代码补全与生成。",                             href: "https://comate.baidu.com",          category: "dev",          tags: ["编程", "百度", "补全"] },
  { name: "代码小浣熊",   summary: "商汤科技推出的免费 AI 编程助手，支持多语言代码生成与调试。",                               href: "https://raccoon.sensetime.com",      category: "dev",          tags: ["编程", "免费", "调试"] },
  { name: "Bolt.new",     summary: "浏览器内全栈 AI 开发环境，一键生成并部署完整应用。",                                       href: "https://bolt.new",                  category: "dev",          tags: ["全栈", "部署", "浏览器"] },
  { name: "Replit Agent", summary: "Replit 推出的 AI 编程 Agent，可自动编写、运行和修复代码。",                               href: "https://replit.com",                category: "dev",          tags: ["Agent", "云端", "运行"] },

  // ── AI 智能体 ──────────────────────────────────────────────
  { name: "扣子",          summary: "字节跳动推出的免费全能 AI 办公智能体平台，支持工作流与插件生态。",                         href: "https://www.coze.cn",               category: "agent",        tags: ["智能体", "工作流", "免费"] },
  { name: "Coze",         summary: "扣子的国际版，海量 AI 智能体免费用，支持一键构建和发布 Bot。",                             href: "https://www.coze.com",              category: "agent",        tags: ["智能体", "Bot", "国际"] },
  { name: "Manus",        summary: "自主规划执行复杂任务的 AI 智能体，适合自动化工作流与研究任务。",                           href: "https://manus.im",                  category: "agent",        tags: ["自主", "任务", "自动化"] },
  { name: "爱派AiPy",     summary: "本地化 Manus，国内可用，开源免费，支持内网部署智能体。",                                   href: "https://aipy.ai",                   category: "agent",        tags: ["本地", "开源", "免费"] },
  { name: "Dify",         summary: "开源 LLM 应用开发平台，快速构建和部署 AI 工作流与智能体。",                               href: "https://dify.ai",                   category: "agent",        tags: ["开源", "工作流", "部署"] },
  { name: "AutoGPT",      summary: "开源自主 AI 智能体，自动分解目标并执行多步任务。",                                         href: "https://agpt.co",                   category: "agent",        tags: ["开源", "自主", "自动化"] },

  // ── 图像与设计 ──────────────────────────────────────────────
  { name: "Midjourney",   summary: "高质量图像生成，适合概念图、封面图与设计探索，风格多样。",                                  href: "https://www.midjourney.com",        category: "design",       tags: ["图像", "创意", "封面"] },
  { name: "Canva AI",     summary: "快速完成海报、演示文稿与社媒素材设计，内置 AI 生成功能。",                                 href: "https://www.canva.com",             category: "design",       tags: ["设计", "模板", "海报"] },
  { name: "即梦",          summary: "字节跳动推出的 AI 图像与视频生成工具，支持文生图和图生视频。",                             href: "https://jimeng.jianying.com",       category: "design",       tags: ["图像", "视频", "字节"] },
  { name: "Stable Diffusion", summary: "开源图像生成模型，支持本地部署与精细化控制，生态丰富。",                               href: "https://stability.ai",              category: "design",       tags: ["开源", "本地", "图像"] },
  { name: "DALL·E 3",     summary: "OpenAI 推出的文生图模型，与 ChatGPT 深度集成，理解自然语言描述。",                        href: "https://openai.com/dall-e-3",       category: "design",       tags: ["文生图", "OpenAI", "创意"] },
  { name: "Adobe Firefly", summary: "Adobe 推出的生成式 AI 设计工具，与 Photoshop/Illustrator 深度集成。",                   href: "https://firefly.adobe.com",         category: "design",       tags: ["设计", "Adobe", "专业"] },
  { name: "LiblibAI",     summary: "国内领先的 AI 图像创作平台和模型分享社区，哩布哩布。",                                     href: "https://www.liblib.art",            category: "design",       tags: ["图像", "社区", "模型"] },
  { name: "稿定AI",       summary: "一站式 AI 创作和设计平台，适合电商图、海报与内容快速出图。",                               href: "https://www.gaoding.com",           category: "design",       tags: ["设计", "电商", "效率"] },
  { name: "Figma AI",     summary: "Figma 推出的原生 AI 设计工具，支持智能布局与原型生成。",                                   href: "https://www.figma.com",             category: "design",       tags: ["设计", "原型", "协作"] },
  { name: "绘蛙",          summary: "AI 电商营销工具，免费生成商品图与营销文案，适合电商运营。",                                href: "https://www.huiwa.com",             category: "design",       tags: ["电商", "营销", "免费"] },

  // ── 视频与音频 ──────────────────────────────────────────────
  { name: "Runway",       summary: "视频生成与编辑工具，适合短视频和动态视觉内容，支持图生视频。",                              href: "https://runwayml.com",              category: "media",        tags: ["视频", "生成", "剪辑"] },
  { name: "ElevenLabs",   summary: "AI 配音与语音合成，音色逼真，适合播客、讲解与配音任务。",                                  href: "https://elevenlabs.io",             category: "media",        tags: ["语音", "配音", "音频"] },
  { name: "Suno",         summary: "高质量的 AI 音乐创作平台，文本生成音乐，适合短片配乐和灵感创作。",                         href: "https://suno.com",                  category: "media",        tags: ["音乐", "生成", "创作"] },
  { name: "HeyGen",       summary: "专业的 AI 数字人视频创作平台，适合营销视频与多语言口播。",                                 href: "https://www.heygen.com",            category: "media",        tags: ["数字人", "营销", "视频"] },
  { name: "Vidu",         summary: "生数科技推出的 AI 视频生成大模型，支持高质量文生视频和图生视频。",                         href: "https://www.vidu.studio",           category: "media",        tags: ["视频", "文生视频", "国产"] },
  { name: "可灵AI",       summary: "快手推出的 AI 视频生成工具，支持高清视频生成与创意特效。",                                 href: "https://klingai.kuaishou.com",      category: "media",        tags: ["视频", "快手", "特效"] },
  { name: "Sora",         summary: "OpenAI 推出的 AI 视频生成模型，生成质量高，适合创意短片。",                               href: "https://sora.com",                  category: "media",        tags: ["视频", "OpenAI", "创意"] },
  { name: "魔音工坊",      summary: "AI 配音工具，轻松配出媲美真人的声音，支持多种音色与情感。",                               href: "https://www.moyin.com",             category: "media",        tags: ["配音", "语音", "情感"] },
  { name: "讯飞智作",      summary: "科大讯飞推出的 AI 转语音和配音工具，支持多场景内容生产。",                               href: "https://peiyin.xunfei.cn",          category: "media",        tags: ["语音", "讯飞", "配音"] },
  { name: "海绵音乐",      summary: "字节跳动推出的免费 AI 音乐创作工具，适合短视频背景音乐创作。",                           href: "https://www.haimian.com",           category: "media",        tags: ["音乐", "免费", "字节"] },
  { name: "剪映AI",       summary: "字节跳动推出的 AI 视频剪辑工具，一键自动剪辑、字幕、配音。",                              href: "https://www.capcut.cn",             category: "media",        tags: ["剪辑", "自动化", "字节"] },

  // ── 办公与效率 ──────────────────────────────────────────────
  { name: "Gamma",        summary: "快速生成演示文稿和网页式提案，美观实用，适合汇报与提案。",                                 href: "https://gamma.app",                 category: "productivity", tags: ["演示", "提案", "效率"] },
  { name: "AiPPT",        summary: "AI 快速生成高质量 PPT，内置多种模板，一键导出，适合快速汇报。",                           href: "https://www.aippt.cn",              category: "productivity", tags: ["PPT", "模板", "效率"] },
  { name: "扣子PPT",      summary: "字节跳动旗下免费一键生成精美 PPT 的工具，速度快、样式多。",                               href: "https://www.coze.cn",               category: "productivity", tags: ["PPT", "免费", "字节"] },
  { name: "Zapier AI",    summary: "自动化流程平台，连接应用并减少重复工作，支持 AI 触发器。",                                href: "https://zapier.com/ai",             category: "productivity", tags: ["自动化", "流程", "效率"] },
  { name: "通义听悟",      summary: "阿里推出的 AI 会议转录与总结工具，实时转写、关键信息提取。",                              href: "https://tingwu.aliyun.com",         category: "productivity", tags: ["会议", "转录", "总结"] },
  { name: "飞书AI",       summary: "飞书内置的 AI 功能套件，涵盖文档写作、会议纪要与知识管理。",                              href: "https://www.feishu.cn",             category: "productivity", tags: ["文档", "协作", "会议"] },
  { name: "腾讯文档AI",   summary: "腾讯文档内置 AI 助手，支持一键生成文档、表格分析与智能问答。",                            href: "https://docs.qq.com",               category: "productivity", tags: ["文档", "表格", "腾讯"] },
  { name: "WPS AI",       summary: "WPS 内置 AI 助手，支持文档写作、表格公式与 PPT 一键生成。",                              href: "https://ai.wps.cn",                 category: "productivity", tags: ["WPS", "文档", "表格"] },
  { name: "Otter.ai",     summary: "实时会议转录与摘要工具，支持 Zoom/Meet 集成，英文场景优秀。",                             href: "https://otter.ai",                  category: "productivity", tags: ["会议", "转录", "英文"] },

  // ── 其他 ──────────────────────────────────────────────────
  { name: "Hugging Face", summary: "模型与数据集生态平台，适合探索开源模型能力，开发者必备。",                                 href: "https://huggingface.co",            category: "other",        tags: ["模型", "开源", "社区"] },
  { name: "OpenRouter",   summary: "统一接入多家模型 API 的网关服务，按需切换，成本可控。",                                    href: "https://openrouter.ai",             category: "other",        tags: ["API", "网关", "模型"] },
  { name: "Ollama",       summary: "本地运行 Llama、Gemma 等大语言模型，隐私友好，支持多平台。",                              href: "https://ollama.com",                category: "other",        tags: ["本地", "开源", "隐私"] },
  { name: "GPTZero",      summary: "超过百万人使用的免费 AI 内容检测工具，适合学术与内容审核。",                              href: "https://gptzero.me",                category: "other",        tags: ["检测", "学术", "免费"] },
  { name: "Poe",          summary: "Quora 推出的多模型 AI 聊天平台，一个入口使用 GPT/Claude/Gemini 等。",                    href: "https://poe.com",                   category: "other",        tags: ["多模型", "聊天", "平台"] },
  { name: "PromptPerfect", summary: "专业的提示词优化工具，一键将粗糙 Prompt 优化为高质量指令。",                             href: "https://promptperfect.jina.ai",     category: "other",        tags: ["提示词", "优化", "工具"] },
  { name: "Lobe Chat",    summary: "开源的现代 AI 聊天框架，支持多模型自部署，插件生态丰富。",                               href: "https://chat-preview.lobehub.com",  category: "other",        tags: ["开源", "自部署", "插件"] },
  { name: "AnythingLLM",  summary: "开源全栈 AI 客户端，支持本地文档问答与多模型 API 集成。",                                href: "https://anythingllm.com",           category: "other",        tags: ["开源", "本地", "文档"] },
];
