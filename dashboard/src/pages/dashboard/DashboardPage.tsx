import { Row, Col, Card, Spin } from 'antd';
import {
  MobileOutlined,
  TeamOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import styled from 'styled-components';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { analyticsApi } from '@/api/analytics.api';
import { colors } from '@/styles/theme';
import { formatNumber } from '@/utils/format';

const ChartCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.cardBorder};

  .ant-card-head {
    border-bottom: 1px solid ${colors.cardBorder};
  }

  .ant-card-head-title {
    font-weight: 600;
  }
`;

function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsApi.getDashboardStats(),
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['daily-usage'],
    queryFn: () => analyticsApi.getDailyUsage(14),
  });

  const stats = statsData?.data;
  const dailyUsage = usageData?.data || [];

  if (statsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Boshqaruv paneli"
        subtitle="SMS Gateway tizimi holati"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<MobileOutlined />}
            title="Qurilmalar"
            value={`${stats?.onlineDevices ?? 0} / ${stats?.totalDevices ?? 0}`}
            color={colors.primary}
            changeLabel="Onlayn / Jami"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<SendOutlined />}
            title="Yuborilgan SMS"
            value={formatNumber(stats?.totalSmsSent ?? 0)}
            color={colors.info}
            changeLabel={`Bugun: ${formatNumber(stats?.smsSentToday ?? 0)}`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<CheckCircleOutlined />}
            title="Yetkazilish darajasi"
            value={`${stats?.deliveryRate?.toFixed(1) ?? 0}%`}
            color={colors.success}
            changeLabel={`${formatNumber(stats?.totalSmsDelivered ?? 0)} yetkazildi`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<MailOutlined />}
            title="Kiruvchi SMS"
            value={formatNumber(stats?.unreadInbox ?? 0)}
            color={colors.warning}
            changeLabel="O'qilmagan xabarlar"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<TeamOutlined />}
            title="Kontaktlar"
            value={formatNumber(stats?.totalContacts ?? 0)}
            color="#8B5CF6"
            changeLabel="Jami kontaktlar"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<SendOutlined />}
            title="Kampaniyalar"
            value={`${stats?.activeCampaigns ?? 0} / ${stats?.totalCampaigns ?? 0}`}
            color="#3B82F6"
            changeLabel="Faol / Jami"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<CloseCircleOutlined />}
            title="Xatoliklar"
            value={formatNumber(stats?.totalSmsFailed ?? 0)}
            color={colors.error}
            changeLabel="Yuborilmagan SMS"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<MobileOutlined />}
            title="Qora ro'yxat"
            value={formatNumber(stats?.blacklistCount ?? 0)}
            color="#6B7280"
            changeLabel="Bloklangan raqamlar"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <ChartCard title="Kunlik SMS statistikasi (14 kun)">
            {usageLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={dailyUsage}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.success} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.error} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={colors.error} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                  <XAxis dataKey="date" stroke={colors.textHint} fontSize={12} />
                  <YAxis stroke={colors.textHint} fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sms"
                    name="SMS"
                    stroke={colors.primary}
                    fill="url(#colorSent)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    name="Qo'ng'iroqlar"
                    stroke={colors.success}
                    fill="url(#colorDelivered)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    name="Xatolik"
                    stroke={colors.error}
                    fill="url(#colorFailed)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
