"use client";

import "antd/dist/reset.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useTransition, type ReactNode } from "react";
import { FileTextOutlined, LockOutlined, LogoutOutlined, StarOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Layout, Menu, Space } from "antd";

const { Header, Sider, Content } = Layout;

const items: MenuProps["items"] = [
  { key: "/dashboard", icon: <StarOutlined />, label: <Link href="/dashboard">用户概览</Link> },
  { key: "/dashboard/profile", icon: <UserOutlined />, label: <Link href="/dashboard/profile">个人资料</Link> },
  { key: "/dashboard/interactions", icon: <FileTextOutlined />, label: <Link href="/dashboard/interactions">互动记录</Link> },
  { key: "/dashboard/security", icon: <LockOutlined />, label: <Link href="/dashboard/security">账号安全</Link> }
];

function resolveSelectedKey(pathname: string) {
  if (pathname.startsWith("/dashboard/profile")) return "/dashboard/profile";
  if (pathname.startsWith("/dashboard/interactions")) return "/dashboard/interactions";
  if (pathname.startsWith("/dashboard/security")) return "/dashboard/security";
  return "/dashboard";
}

export function UserShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const selectedKey = resolveSelectedKey(pathname);
  const { data } = useSession();
  const [isSigningOut, startSignOutTransition] = useTransition();

  useEffect(() => {
    const routes = ["/dashboard", "/dashboard/profile", "/dashboard/interactions", "/dashboard/security"];
    for (const route of routes) {
      if (route === pathname) continue;
      void router.prefetch(route);
    }
    void router.prefetch("/login");
  }, [pathname, router]);

  const handleSignOut = () => {
    startSignOutTransition(async () => {
      await signOut({ redirect: false });
      window.location.href = "/login";
    });
  };

  return (
    <>
      <style jsx global>{`
        .wanfeng-user-root {
          min-height: 100dvh;
          background: transparent;
        }
        .wanfeng-user-root,
        .wanfeng-user-root *:not(svg):not(path) {
          font-family:
            "SimHei",
            "Heiti SC",
            "Microsoft YaHei UI",
            "Microsoft YaHei",
            "PingFang SC",
            "Noto Sans CJK SC",
            "Source Han Sans SC",
            sans-serif !important;
        }
        .wanfeng-user-root .ant-layout-sider {
          background: linear-gradient(180deg, rgba(223, 241, 255, 0.92), rgba(210, 235, 252, 0.92)) !important;
          border-right: 1px solid rgba(125, 170, 210, 0.24);
        }
        .wanfeng-user-root .ant-menu {
          border-inline-end: 0 !important;
          background: transparent !important;
        }
        .wanfeng-user-root .ant-menu-item {
          border-radius: 10px !important;
          margin-inline: 10px !important;
          width: calc(100% - 20px) !important;
        }
        .wanfeng-user-root .ant-menu-item-selected {
          background: rgba(82, 196, 255, 0.22) !important;
          color: #0a4a75 !important;
        }
        .wanfeng-user-root .ant-layout-header {
          background: linear-gradient(180deg, rgba(191, 219, 254, 0.26), rgba(239, 246, 255, 0.2), rgba(191, 219, 254, 0.18)) !important;
          border-bottom: 1px solid rgba(125, 170, 210, 0.2);
          height: 64px !important;
          line-height: 64px !important;
          padding: 0 20px !important;
        }
        .wanfeng-user-root .ant-layout-content {
          padding: 18px 20px !important;
          min-height: calc(100dvh - 64px);
          background: transparent !important;
        }
        .wanfeng-user-panel {
          border: 1px solid rgba(125, 170, 210, 0.2) !important;
          box-shadow: 0 12px 28px rgba(49, 121, 180, 0.08);
          border-radius: 16px !important;
          background: rgba(245, 252, 255, 0.9) !important;
        }
      `}</style>

      <Layout className="wanfeng-user-root">
        <Sider width={250}>
          <div className="px-4 pb-3 pt-4">
            <div className="rounded-xl border border-cyan-200/60 bg-cyan-500 px-3 py-3 text-cyan-50 shadow-sm">
              <p className="mb-1 text-base font-semibold">用户中心</p>
              <p className="text-sm text-cyan-100">管理个人资料、互动记录和账号安全</p>
            </div>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={items}
          />
        </Sider>

        <Layout>
          <Header>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">用户仪表盘</span>
              <Space>
                <Space>
                  <Avatar icon={<UserOutlined />} src={data?.user?.image ?? undefined} />
                  <div className="leading-tight">
                    <p className="m-0 text-sm font-semibold text-slate-800">{data?.user?.name ?? "User"}</p>
                    <p className="m-0 text-xs text-slate-500">{data?.user?.email ?? "-"}</p>
                  </div>
                </Space>
                <Link href="/">
                  <Button type="default">返回首页</Button>
                </Link>
                <Button
                  danger
                  icon={<LogoutOutlined />}
                  loading={isSigningOut}
                  onClick={handleSignOut}
                >
                  退出登录
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
