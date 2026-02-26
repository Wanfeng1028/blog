import type { ComponentType } from "react";
import { FileText, FolderKanban, Home, MessageSquare, UserRound, UsersRound } from "lucide-react";

type NavItemDef = {
  href: string;
  labelZh: string;
  labelEn: string;
  icon: ComponentType<{ className?: string }>;
  children?: {
    label: string;
    children?: { href: string; label: string }[];
  }[];
};

export const navItemDefs: NavItemDef[] = [
  { href: "/", labelZh: "首页", labelEn: "Home", icon: Home },
  {
    href: "/projects",
    labelZh: "项目",
    labelEn: "Projects",
    icon: FolderKanban,
    children: [
      {
        label: "AI Tools",
        children: [
          { href: "/projects?group=ai-tools&cat=writing", label: "写作与润色" },
          { href: "/projects?group=ai-tools&cat=search", label: "搜索与研究" },
          { href: "/projects?group=ai-tools&cat=dev", label: "编程与开发" },
          { href: "/projects?group=ai-tools&cat=design", label: "图像与设计" },
          { href: "/projects?group=ai-tools&cat=media", label: "视频与音频" },
          { href: "/projects?group=ai-tools&cat=productivity", label: "办公与效率" },
          { href: "/projects?group=ai-tools&cat=other", label: "其他" }
        ]
      },
      {
        label: "我的项目",
        children: [
          { href: "/projects?group=my-projects", label: "项目列表" },
          { href: "/projects?group=my-projects&view=detail", label: "项目详情" }
        ]
      }
    ]
  },
  {
    href: "/blog",
    labelZh: "文章",
    labelEn: "Blog",
    icon: FileText,
    children: [
      {
        label: "全部文章",
        children: [
          { href: "/blog", label: "全部文章" }
        ]
      },
      {
        label: "文章分类",
        children: []
      }
    ]
  },
  {
    href: "/friends",
    labelZh: "友链",
    labelEn: "Friends",
    icon: UsersRound,
    children: [
      {
        label: "友链",
        children: [
          { href: "/friends", label: "朋友的网站链接" },
          { href: "/friends/apply", label: "友链申请" },
          { href: "/friends/donate", label: "打赏 / 支持我" }
        ]
      }
    ]
  },
  { href: "/about", labelZh: "关于我", labelEn: "About", icon: UserRound },
  {
    href: "/message",
    labelZh: "留言",
    labelEn: "Message",
    icon: MessageSquare,
    children: [
      {
        label: "留言",
        children: [
          { href: "/message#message-list", label: "留言列表" },
          { href: "/message#message", label: "发表留言" }
        ]
      }
    ]
  }
];

export type { NavItemDef };
