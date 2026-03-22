import { useState } from 'react';
import { Card, DatePicker, Row, Col, Spin, Table, Tag } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { PageHeader } from '@/components/common/PageHeader';
import { analyticsApi } from '@/api/analytics.api';
import { campaignsApi } from '@/api/campaigns.api';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatNumber, formatDate } from '@/utils/format';
import { colors } from '@/styles/theme';
import type { Campaign } from '@/types/campaign.types';

const { RangePicker } = DatePicker;

const ChartCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.cardBorder};
`;

const PIE_COLORS = [colors.success, colors.error, colors.warning, colors.primary, colors.info];

function ReportsPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['campaign-analytics', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: () =>
      analyticsApi.getCampaignAnalytics(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
      ),
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns-report'],
    queryFn: () => campaignsApi.getCampaigns({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const dailyUsage = usageData?.data?.data || [];
  const campaigns: Campaign[] = campaignsData?.data?.data || [];

  const totalSent = dailyUsage.reduce((sum, d) => sum + d.sent, 0);
  const totalDelivered = dailyUsage.reduce((sum, d) => sum + d.delivered, 0);
  const totalFailed = dailyUsage.reduce((sum, d) => sum + d.failed, 0);

  const pieData = [
    { name: 'Yetkazildi', value: totalDelivered },
    { name: 'Xatolik', value: totalFailed },
    { name: 'Kutilmoqda', value: Math.max(0, totalSent - totalDelivered - totalFailed) },
  ];

  const campaignColumns = [
    { title: 'Nomi', dataIndex: 'name', key: 'name' },
    { title: 'Holati', dataIndex: 'status', key: 'status', render: (v: Campaign['status']) => <StatusBadge status={v} /> },
    { title: 'Jami', dataIndex: 'totalTasks', key: 'total', render: (v: number) => formatNumber(v) },
    { title: 'Yetkazildi', dataIndex: 'deliveredCount', key: 'delivered', render: (v: number) => <span style={{ color: colors.success }}>{formatNumber(v)}</span> },
    { title: 'Xatolik', dataIndex: 'failedCount', key: 'failed', render: (v: number) => <span style={{ color: colors.error }}>{formatNumber(v)}</span> },
    { title: 'Sana', dataIndex: 'createdAt', key: 'date', render: (v: string) => formatDate(v, 'DD.MM.YYYY') },
  ];

  return (
    <div>
      <PageHeader
        title="Hisobotlar"
        subtitle="SMS yuborish statistikasi va tahlili"
        actions={
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            format="DD.MM.YYYY"
          />
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <ChartCard title="Kunlik statistika">
            {usageLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="sent" name="Yuborildi" fill={colors.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delivered" name="Yetkazildi" fill={colors.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Xatolik" fill={colors.error} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
        <Col xs={24} lg={8}>
          <ChartCard title="Umumiy taqsimot">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>

      <Card title="Oxirgi kampaniyalar" style={{ borderRadius: 12, marginTop: 24 }}>
        <Table
          dataSource={campaigns}
          columns={campaignColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}

export default ReportsPage;
