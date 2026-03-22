import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Input, Select, Tag, Progress, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { campaignsApi } from '@/api/campaigns.api';
import { formatDate, formatNumber } from '@/utils/format';
import { CampaignStatus, CampaignType } from '@/types/campaign.types';
import type { Campaign } from '@/types/campaign.types';
import { colors } from '@/styles/theme';

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

function CampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page, search, statusFilter],
    queryFn: () =>
      campaignsApi.getCampaigns({ page, limit: 20, search, status: statusFilter }),
  });

  const startMut = useMutation({
    mutationFn: (id: string) => campaignsApi.startCampaign(id),
    onSuccess: () => { message.success('Kampaniya boshlandi'); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); },
  });
  const pauseMut = useMutation({
    mutationFn: (id: string) => campaignsApi.pauseCampaign(id),
    onSuccess: () => { message.success('To\'xtatildi'); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); },
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => campaignsApi.cancelCampaign(id),
    onSuccess: () => { message.success('Bekor qilindi'); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => campaignsApi.deleteCampaign(id),
    onSuccess: () => { message.success('O\'chirildi'); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); },
  });

  const campaigns = data?.data?.data || [];
  const meta = data?.data?.meta;

  const columns = [
    {
      title: 'Nomi',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: Campaign) => (
        <a onClick={() => navigate(`/campaigns/${r.id}`)}>{v}</a>
      ),
    },
    {
      title: 'Turi',
      dataIndex: 'type',
      key: 'type',
      render: (v: CampaignType) => (
        <Tag color={v === CampaignType.SMS ? 'blue' : 'purple'}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Holati',
      dataIndex: 'status',
      key: 'status',
      render: (v: CampaignStatus) => <StatusBadge status={v} />,
    },
    {
      title: 'Jarayon',
      key: 'progress',
      render: (_: unknown, r: Campaign) => {
        const total = r.totalTasks || 1;
        const done = r.sentCount + r.failedCount;
        const pct = Math.round((done / total) * 100);
        return (
          <Progress
            percent={pct}
            size="small"
            strokeColor={colors.primary}
            format={() => `${done}/${total}`}
          />
        );
      },
    },
    {
      title: 'Yetkazildi',
      key: 'delivered',
      render: (_: unknown, r: Campaign) => (
        <span style={{ color: colors.success }}>{formatNumber(r.deliveredCount)}</span>
      ),
    },
    {
      title: 'Xatolik',
      key: 'failed',
      render: (_: unknown, r: Campaign) => (
        <span style={{ color: colors.error }}>{formatNumber(r.failedCount)}</span>
      ),
    },
    {
      title: 'Yaratilgan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 180,
      render: (_: unknown, r: Campaign) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/campaigns/${r.id}`)} />
          {(r.status === CampaignStatus.DRAFT || r.status === CampaignStatus.SCHEDULED) && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => startMut.mutate(r.id)} />
          )}
          {r.status === CampaignStatus.RUNNING && (
            <Button size="small" icon={<PauseCircleOutlined />} onClick={() => pauseMut.mutate(r.id)} />
          )}
          {r.status === CampaignStatus.PAUSED && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => startMut.mutate(r.id)} />
          )}
          {(r.status === CampaignStatus.RUNNING || r.status === CampaignStatus.PAUSED) && (
            <Popconfirm title="Bekor qilmoqchimisiz?" onConfirm={() => cancelMut.mutate(r.id)} okText="Ha" cancelText="Yo'q">
              <Button size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
          {r.status === CampaignStatus.DRAFT && (
            <Popconfirm title="O'chirmoqchimisiz?" onConfirm={() => deleteMut.mutate(r.id)} okText="Ha" cancelText="Yo'q">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Kampaniyalar"
        subtitle="SMS va ovozli kampaniyalarni boshqarish"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/campaigns/create')}>
            Yangi kampaniya
          </Button>
        }
      />
      <Toolbar>
        <Input
          placeholder="Qidirish..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder="Holati"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          allowClear
          style={{ width: 180 }}
          options={Object.values(CampaignStatus).map((s) => ({ label: s, value: s }))}
        />
      </Toolbar>
      <Table
        dataSource={campaigns}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: meta?.total || 0,
          onChange: setPage,
          showTotal: (total) => `Jami: ${total}`,
        }}
      />
    </div>
  );
}

export default CampaignsPage;
