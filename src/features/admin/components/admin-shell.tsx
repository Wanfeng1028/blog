"use client";

import "antd/dist/reset.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";
import type { MenuProps } from "antd";
import {
  AppstoreOutlined,
  BarsOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  LogoutOutlined,
  MessageOutlined,
  PictureOutlined,
  SafetyOutlined,
  SettingOutlined,
  TagsOutlined,
  CoffeeOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import { useDictionary } from "@/features/i18n/lang-context";

const { Header, Sider, Content } = Layout;

type AdminShellProps = {
  children: ReactNode;
};

const getMenuItems = (dict: ReturnType<typeof useDictionary>): MenuProps["items"] => [
  {
    key: "/admin",
    icon: <AppstoreOutlined />,
    label: <Link href="/admin">{dict.admin.systemHome}</Link>
  },
  {
    key: "/admin/posts",
    icon: <FileTextOutlined />,
    label: <Link href="/admin/posts">{dict.admin.postManage}</Link>
  },
  {
    key: "/admin/categories",
    icon: <BarsOutlined />,
    label: <Link href="/admin/categories">{dict.admin.categoryManage}</Link>
  },
  {
    key: "/admin/tags",
    icon: <TagsOutlined />,
    label: <Link href="/admin/tags">{dict.admin.tagManage}</Link>
  },
  {
    key: "/admin/assets",
    icon: <PictureOutlined />,
    label: <Link href="/admin/assets">{dict.admin.assetManage}</Link>
  },
  {
    key: "/admin/moments",
    icon: <CoffeeOutlined />,
    label: <Link href="/admin/moments">{dict.admin.momentManage ?? "碎碎念管理"}</Link>
  },
  {
    key: "settings-group",
    icon: <SettingOutlined />,
    label: dict.admin.siteSettings,
    children: [
      {
        key: "/admin/settings",
        icon: <CustomerServiceOutlined />,
        label: <Link href="/admin/settings">{dict.admin.siteConfig}</Link>
      },
      {
        key: "/admin/settings/projects",
        icon: <FundProjectionScreenOutlined />,
        label: <Link href="/admin/settings/projects">{dict.admin.projectManage}</Link>
      },
      {
        key: "/admin/settings/interactions",
        icon: <MessageOutlined />,
        label: <Link href="/admin/settings/interactions">{dict.admin.interactionManage}</Link>
      },
      {
        key: "/admin/settings/users",
        icon: <SafetyOutlined />,
        label: <Link href="/admin/settings/users">{dict.admin.userSecurity}</Link>
      }
    ]
  }
];

function resolveSelectedKey(pathname: string): string {
  if (pathname.startsWith("/admin/posts")) return "/admin/posts";
  if (pathname.startsWith("/admin/categories")) return "/admin/categories";
  if (pathname.startsWith("/admin/tags")) return "/admin/tags";
  if (pathname.startsWith("/admin/assets")) return "/admin/assets";
  if (pathname.startsWith("/admin/moments")) return "/admin/moments";
  if (pathname === "/admin/settings/projects") return "/admin/settings/projects";
  if (pathname === "/admin/settings/interactions") return "/admin/settings/interactions";
  if (pathname === "/admin/settings/users") return "/admin/settings/users";
  if (pathname.startsWith("/admin/settings")) return "/admin/settings";
  return "/admin";
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useSession();
  const selectedKey = resolveSelectedKey(pathname);
  const dict = useDictionary();

  useEffect(() => {
    const routes = ["/admin", "/admin/posts", "/admin/categories", "/admin/tags", "/admin/assets", "/admin/settings", "/admin/settings/projects", "/admin/settings/interactions", "/admin/settings/users"];
    for (const route of routes) {
      if (route === pathname) continue;
      void router.prefetch(route);
    }
  }, [pathname, router]);

  return (
    <>
      <style jsx global>{`
        .wanfeng-admin-root {
          min-height: 100dvh;
          background:
            linear-gradient(180deg, rgba(191, 219, 254, 0.26) 0%, rgba(239, 246, 255, 0.2) 52%, rgba(191, 219, 254, 0.24) 100%),
            url("/images/home.jpg");
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          background-attachment: fixed;
        }

        .wanfeng-admin-root .ant-layout-sider {
          background: linear-gradient(180deg, rgba(223, 241, 255, 0.95), rgba(210, 235, 252, 0.95)) !important;
          border-right: 1px solid rgba(125, 170, 210, 0.24);
        }

        .wanfeng-admin-root .ant-menu {
          border-inline-end: 0 !important;
          background: transparent !important;
        }

        .wanfeng-admin-root .ant-menu-item {
          border-radius: 10px !important;
          margin-inline: 10px !important;
          width: calc(100% - 20px) !important;
        }

        .wanfeng-admin-root .ant-menu-item-selected {
          background: rgba(82, 196, 255, 0.22) !important;
          color: #0a4a75 !important;
        }

        .wanfeng-admin-root .ant-layout-header {
          background: linear-gradient(180deg, rgba(191, 219, 254, 0.28), rgba(239, 246, 255, 0.22), rgba(191, 219, 254, 0.2)) !important;
          border-bottom: 1px solid rgba(125, 170, 210, 0.2);
          height: 64px !important;
          line-height: 64px !important;
          padding: 0 20px !important;
        }

        .wanfeng-admin-root .ant-layout-content {
          padding: 18px 20px !important;
          min-height: calc(100dvh - 64px);
          background: transparent !important;
        }

        .wanfeng-admin-panel {
          border: 1px solid rgba(125, 170, 210, 0.2) !important;
          box-shadow: 0 12px 28px rgba(49, 121, 180, 0.08);
          border-radius: 16px !important;
          background: rgba(245, 252, 255, 0.92) !important;
        }
      `}</style>

      <Layout className="wanfeng-admin-root">
        <Sider width={250}>
          <div className="px-4 pb-3 pt-4">
            <div className="rounded-xl border border-cyan-200/60 bg-cyan-500 px-3 py-3 text-cyan-50 shadow-sm">
              <Typography.Title level={5} className="!mb-1 !text-cyan-50">
                {dict.admin.platformTitle}
              </Typography.Title>
              <Typography.Text className="!text-cyan-100">{dict.admin.platformDesc}</Typography.Text>
            </div>
          </div>
          <Menu mode="inline" selectedKeys={[selectedKey]} defaultOpenKeys={["settings-group"]} items={getMenuItems(dict)} />
        </Sider>

        <Layout>
          <Header>
            <div className="flex items-center justify-between">
              <Typography.Text className="!text-slate-600">{dict.admin.backendSystem}</Typography.Text>
              <Space>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <div className="leading-tight">
                    <p className="m-0 text-sm font-semibold text-slate-800">{data?.user?.name ?? "Admin"}</p>
                    <p className="m-0 text-xs text-slate-500">{data?.user?.email ?? "-"}</p>
                  </div>
                </Space>
                <Link href="/">
                  <Button type="default">{dict.admin.backToFront}</Button>
                </Link>
                <Button
                  danger
                  icon={<LogoutOutlined />}
                  onClick={async () => {
                    await signOut({ callbackUrl: "/login" });
                  }}
                >
                  {dict.admin.logout}
                </Button>
              </Space>
            </div>
          </Header>

          <Content>{children}</Content>
        </Layout>
      </Layout>
    </>
  );
}
