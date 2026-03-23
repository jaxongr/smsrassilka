import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge, Dropdown, Avatar, Typography } from 'antd';
import {
  DashboardOutlined,
  MobileOutlined,
  TeamOutlined,
  SendOutlined,
  AudioOutlined,
  MailOutlined,
  StopOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CrownOutlined,
  ApiOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { colors } from '@/styles/theme';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '@/api/inbox.api';
import type { MenuProps } from 'antd';

const { Sider, Header, Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledSider = styled(Sider)`
  background: ${colors.siderBg} !important;
  border-right: none;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }

  .ant-menu {
    background: transparent;
    border: none;
  }
`;

const LogoArea = styled.div`
  padding: 20px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const LogoTitle = styled.h2<{ $collapsed: boolean }>`
  color: #fff;
  font-size: ${(p) => (p.$collapsed ? '14px' : '18px')};
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;

  span {
    color: ${colors.primaryLight};
  }
`;

const LogoSubtitle = styled.p<{ $collapsed: boolean }>`
  color: ${colors.siderText};
  font-size: 11px;
  margin: 4px 0 0 0;
  display: ${(p) => (p.$collapsed ? 'none' : 'block')};
`;

const OnlineBadge = styled.div<{ $collapsed: boolean }>`
  margin: 8px 16px;
  padding: 8px 12px;
  background: rgba(37, 99, 235, 0.12);
  border-radius: 8px;
  display: ${(p) => (p.$collapsed ? 'none' : 'flex')};
  align-items: center;
  gap: 8px;
`;

const OnlineDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${colors.success};
  box-shadow: 0 0 6px ${colors.success};
`;

const StyledHeader = styled(Header)`
  background: ${colors.headerBg};
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${colors.cardBorder};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  height: 64px;
  line-height: 64px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const CollapseBtn = styled.div`
  cursor: pointer;
  font-size: 18px;
  color: ${colors.textSecondary};
  transition: color 0.2s;

  &:hover {
    color: ${colors.primary};
  }
`;

const NotifBtn = styled.div`
  cursor: pointer;
  font-size: 18px;
  color: ${colors.textSecondary};
  transition: color 0.2s;

  &:hover {
    color: ${colors.primary};
  }
`;

const StyledContent = styled(Content)`
  margin: 0;
  padding: 24px;
  background: ${colors.bgBody};
  min-height: calc(100vh - 64px);
`;

const UserBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: ${colors.primaryBg};
  }
`;

const MenuFooter = styled.div`
  margin-top: auto;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const { data: unreadData } = useQuery({
    queryKey: ['inbox-unread'],
    queryFn: () => inboxApi.getUnreadCount(),
    refetchInterval: 30_000,
  });

  const unreadCount = unreadData?.data?.unreadCount ?? 0;

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Boshqaruv paneli',
    },
    {
      key: '/devices',
      icon: <MobileOutlined />,
      label: 'Qurilmalar',
    },
    {
      key: '/contacts',
      icon: <TeamOutlined />,
      label: 'Kontaktlar',
    },
    {
      key: '/campaigns',
      icon: <SendOutlined />,
      label: 'Kampaniyalar',
    },
    {
      key: '/voice-messages',
      icon: <AudioOutlined />,
      label: 'Ovozli xabarlar',
    },
    {
      key: '/inbox',
      icon: <MailOutlined />,
      label: (
        <span>
          Kiruvchi SMS{' '}
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              size="small"
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
    },
    {
      key: '/blacklist',
      icon: <StopOutlined />,
      label: 'Qora ro\'yxat',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Hisobotlar',
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: '/users',
            icon: <UserOutlined />,
            label: 'Foydalanuvchilar',
          },
        ]
      : []),
    {
      key: '/subscription',
      icon: <CrownOutlined />,
      label: 'Obuna',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Sozlamalar',
    },
    {
      key: '/settings?tab=api',
      icon: <ApiOutlined />,
      label: 'API',
    },
    {
      key: '/docs',
      icon: <FileTextOutlined />,
      label: 'API Docs',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Sozlamalar',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Chiqish',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const selectedKeys = [
    menuItems
      ?.filter((item): item is { key: string } => !!item && 'key' in item)
      .find((item) => {
        if (item.key === '/') return location.pathname === '/';
        return location.pathname.startsWith(item.key);
      })?.key || '/',
  ];

  return (
    <StyledLayout>
      <StyledSider
        width={260}
        collapsedWidth={80}
        collapsible
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        <LogoArea>
          <LogoTitle $collapsed={collapsed}>
            {collapsed ? 'SG' : <>SMS <span>Gateway</span></>}
          </LogoTitle>
          <LogoSubtitle $collapsed={collapsed}>Boshqaruv paneli</LogoSubtitle>
        </LogoArea>

        <OnlineBadge $collapsed={collapsed}>
          <OnlineDot />
          <Typography.Text style={{ color: '#fff', fontSize: 12 }}>
            Qurilmalar onlayn
          </Typography.Text>
        </OnlineBadge>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, marginTop: 8 }}
        />
      </StyledSider>

      <Layout>
        <StyledHeader>
          <HeaderLeft>
            <CollapseBtn onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </CollapseBtn>
          </HeaderLeft>

          <HeaderRight>
            <NotifBtn onClick={() => navigate('/inbox')}>
              <Badge count={unreadCount} size="small" offset={[2, -2]}>
                <BellOutlined style={{ fontSize: 20, color: colors.textSecondary }} />
              </Badge>
            </NotifBtn>

            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <UserBlock>
                <Avatar
                  style={{
                    backgroundColor: colors.primary,
                    fontWeight: 600,
                  }}
                  size={36}
                >
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                {!collapsed && (
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: colors.textPrimary,
                        lineHeight: 1.3,
                      }}
                    >
                      {user?.fullName || 'Foydalanuvchi'}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>
                      {user?.role || 'ADMIN'}
                    </div>
                  </div>
                )}
              </UserBlock>
            </Dropdown>
          </HeaderRight>
        </StyledHeader>

        <StyledContent>
          <Outlet />
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
}
