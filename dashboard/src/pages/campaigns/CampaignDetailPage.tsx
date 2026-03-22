import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Spin,
  Progress,
  Row,
  Col,
  Select,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { campaignsApi } from '@/api/campaigns.api';
import { formatDate, formatPhone, formatNumber } from '@/utils/format';
import { CampaignStatus, TaskStatus } from '@/types/campaign.types';
import type { TaskLog } from '@/types/campaign.types';
import { colors } from '@/styles/theme';
import { SIM_STRATEGY_LABELS } from '@/utils/constants';
import { SendOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logPage, setLogPage] = useState(1);
  const [logStatus, setLogStatus] = useState<string | undefined>();

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getCampaign(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['campaign-logs', id, logPage, logStatus],
    queryFn: () => campaignsApi.getCampaignLogs(id!, { page: logPage, limit: 20, status: logStatus }),
    enabled: !!id,
  });

  const startMut = useMutation({ mutationFn: () => campaignsApi.startCampaign(id!), onSuccess: () => { message.success('Boshlandi'); queryClient.invalidateQueries({ queryKey: ['campaign', id] }); } });
  const pauseMut = useMutation({ mutationFn: () => campaignsApi.pauseCampaign(id!), onSuccess: () => { message.success('To\'xtatildi'); queryClient.invalidateQueries({ queryKey: ['campaign', id] }); } });
  const cancelMut = useMutation({ mutationFn: () => campaignsApi.cancelCampaign(id!), onSuccess: () => { message.success('Bekor qilindi'); queryClient.invalidateQueries({ queryKey: ['campaign', id] }); } });

  const campaign = campaignData?.data?.data;
  const logs = logsData?.data?.data || [];
  const logsMeta = logsData?.data?.meta;

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!campaign) return <div>Kampaniya topilmadi</div>;

  const total = campaign.totalTasks || 1;
  const done = campaign.sentCount + campaign.failedCount;
  const pct = Math.round((done / total) * 100);

  const logColumns = [
    { title: 'Telefon', dataIndex: 'phoneNumber', key: 'phone', render: (v: string) => formatPhone(v) },
    { title: 'Holati', dataIndex: 'status', key: 'status', render: (v: TaskStatus) => <StatusBadge status={v} type="task" /> },
    { title: 'Xatolik', dataIndex: 'errorMessage', key: 'error', render: (v: string | null) => v || '-' },
    { title: 'Yuborilgan', dataIndex: 'sentAt', key: 'sentAt', render: (v: string | null) => v ? formatDate(v) : '-' },
  ];

  return (
    <div>
      <PageHeader
        title={campaign.name}
        subtitle={`Turi: ${campaign.type}`}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/campaigns')}>Orqaga</Button>
            {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.SCHEDULED) && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => startMut.mutate()} loading={startMut.isPending}>Boshlash</Button>
            )}
            {campaign.status === CampaignStatus.RUNNING && (
              <Button icon={<PauseCircleOutlined />} onClick={() => pauseMut.mutate()} loading={pauseMut.isPending}>To'xtatish</Button>
            )}
            {campaign.status === CampaignStatus.PAUSED && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => startMut.mutate()} loading={startMut.isPending}>Davom ettirish</Button>
            )}
            {(campaign.status === CampaignStatus.RUNNING || campaign.status === CampaignStatus.PAUSED) && (
              <Button danger icon={<StopOutlined />} onClick={() => cancelMut.mutate()} loading={cancelMut.isPending}>Bekor qilish</Button>
            )}
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<SendOutlined />} title="Jami" value={formatNumber(campaign.totalTasks)} color={colors.primary} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<CheckCircleOutlined />} title="Yetkazildi" value={formatNumber(campaign.deliveredCount)} color={colors.success} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<CloseCircleOutlined />} title="Xatolik" value={formatNumber(campaign.failedCount)} color={colors.error} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<ClockCircleOutlined />} title="Kutilmoqda" value={formatNumber(campaign.totalTasks - done)} color={colors.warning} />
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col flex="1">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Holati"><StatusBadge status={campaign.status} /></Descriptions.Item>
              <Descriptions.Item label="SIM strategiyasi">{SIM_STRATEGY_LABELS[campaign.simStrategy] || campaign.simStrategy}</Descriptions.Item>
              <Descriptions.Item label="Guruh">{campaign.contactGroup?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Interval">{campaign.intervalMs / 1000}s</Descriptions.Item>
              <Descriptions.Item label="Boshlangan">{campaign.startedAt ? formatDate(campaign.startedAt) : '-'}</Descriptions.Item>
              <Descriptions.Item label="Yakunlangan">{campaign.completedAt ? formatDate(campaign.completedAt) : '-'}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col>
            <Progress type="circle" percent={pct} strokeColor={colors.primary} size={100} />
          </Col>
        </Row>
      </Card>

      <Card title="Yuborish jurnali" style={{ borderRadius: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="Holati bo'yicha filtrlash"
            value={logStatus}
            onChange={(v) => { setLogStatus(v); setLogPage(1); }}
            allowClear
            style={{ width: 200 }}
            options={Object.values(TaskStatus).map((s) => ({ label: s, value: s }))}
          />
        </div>
        <Table
          dataSource={logs}
          columns={logColumns}
          loading={logsLoading}
          rowKey="id"
          size="small"
          pagination={{
            current: logPage,
            pageSize: 20,
            total: logsMeta?.total || 0,
            onChange: setLogPage,
            showTotal: (t) => `Jami: ${t}`,
          }}
        />
      </Card>
    </div>
  );
}

export default CampaignDetailPage;
