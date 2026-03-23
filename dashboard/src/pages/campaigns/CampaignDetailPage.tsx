import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Table, Button, Space, Spin, Progress, Row, Col,
  Select, message, Modal, Form, Input, InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined, PlayCircleOutlined, PauseCircleOutlined,
  StopOutlined, EditOutlined, SendOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { campaignsApi } from '@/api/campaigns.api';
import { contactsApi } from '@/api/contacts.api';
import { devicesApi } from '@/api/devices.api';
import { formatDate, formatPhone, formatNumber } from '@/utils/format';
import { CampaignStatus, CampaignType, TaskStatus, SimStrategy } from '@/types/campaign.types';
import type { TaskLog } from '@/types/campaign.types';
import { colors } from '@/styles/theme';
import { SIM_STRATEGY_LABELS } from '@/utils/constants';

function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logPage, setLogPage] = useState(1);
  const [logStatus, setLogStatus] = useState<string | undefined>();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();

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

  const { data: groupsData } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: () => contactsApi.getGroups(),
    enabled: editOpen,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.getDevices(),
    enabled: editOpen,
  });

  const startMut = useMutation({ mutationFn: () => campaignsApi.startCampaign(id!), onSuccess: () => { message.success('Boshlandi'); queryClient.invalidateQueries({ queryKey: ['campaign', id] }); } });
  const pauseMut = useMutation({ mutationFn: () => campaignsApi.pauseCampaign(id!), onSuccess: () => { message.success("To'xtatildi"); queryClient.invalidateQueries({ queryKey: ['campaign', id] }); } });
  const resumeMut = useMutation({ mutationFn: () => campaignsApi.resumeCampaign(id!), onSuccess: () => { message.success('Davom ettirildi'); queryClient.invalidateQueries({ queryKey: ['campaign', id] }); } });
  const cancelMut = useMutation({ mutationFn: () => campaignsApi.cancelCampaign(id!), onSuccess: () => { message.success('Bekor qilindi'); queryClient.invalidateQueries({ queryKey: ['campaign', id] }); } });
  const updateMut = useMutation({
    mutationFn: (data: any) => campaignsApi.updateCampaign(id!, data),
    onSuccess: () => {
      message.success('Saqlandi');
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: () => message.error('Xatolik'),
  });

  const campaign = campaignData?.data;
  const logs = logsData?.data?.data || [];
  const logsMeta = logsData?.data?.meta || logsData?.data;
  const groups = groupsData?.data || [];
  const devices = devicesData?.data || [];

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!campaign) return <div>Kampaniya topilmadi</div>;

  const total = campaign.totalCount || campaign.totalTasks || 1;
  const done = (campaign.sentCount || 0) + (campaign.failedCount || 0);
  const pct = Math.round((done / total) * 100);

  const canEdit = campaign.status !== CampaignStatus.COMPLETED && campaign.status !== CampaignStatus.CANCELLED;

  const openEdit = () => {
    editForm.setFieldsValue({
      name: campaign.name,
      messageTemplate: campaign.messageTemplate,
      contactGroupId: campaign.contactGroupId,
      deviceIds: campaign.deviceIds,
      intervalMs: campaign.intervalMs,
      simStrategy: campaign.simStrategy,
    });
    setEditOpen(true);
  };

  const handleEdit = (values: any) => {
    updateMut.mutate({
      name: values.name,
      messageTemplate: values.messageTemplate,
      contactGroupId: values.contactGroupId,
      deviceIds: values.deviceIds,
      intervalMs: values.intervalMs,
      simStrategy: values.simStrategy,
    });
  };

  const logColumns = [
    { title: 'Telefon', dataIndex: 'phoneNumber', key: 'phone', render: (v: string) => formatPhone(v) },
    { title: 'Holati', dataIndex: 'status', key: 'status', render: (v: TaskStatus) => <StatusBadge status={v} /> },
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
            {canEdit && (
              <Button icon={<EditOutlined />} onClick={openEdit}>Tahrirlash</Button>
            )}
            {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.SCHEDULED) && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => startMut.mutate()} loading={startMut.isPending}>Boshlash</Button>
            )}
            {campaign.status === CampaignStatus.RUNNING && (
              <Button icon={<PauseCircleOutlined />} onClick={() => pauseMut.mutate()} loading={pauseMut.isPending}>Pauza</Button>
            )}
            {campaign.status === CampaignStatus.PAUSED && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => resumeMut.mutate()} loading={resumeMut.isPending}>Davom ettirish</Button>
            )}
            {(campaign.status === CampaignStatus.RUNNING || campaign.status === CampaignStatus.PAUSED) && (
              <Button danger icon={<StopOutlined />} onClick={() => cancelMut.mutate()} loading={cancelMut.isPending}>Bekor qilish</Button>
            )}
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<SendOutlined />} title="Jami" value={formatNumber(total)} color={colors.primary} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<CheckCircleOutlined />} title="Yuborildi" value={formatNumber(campaign.sentCount || 0)} color={colors.success} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<CloseCircleOutlined />} title="Xatolik" value={formatNumber(campaign.failedCount || 0)} color={colors.error} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard icon={<ClockCircleOutlined />} title="Kutilmoqda" value={formatNumber(Math.max(0, total - done))} color={colors.warning} />
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col flex="1">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Holati"><StatusBadge status={campaign.status} /></Descriptions.Item>
              <Descriptions.Item label="SIM strategiyasi">{SIM_STRATEGY_LABELS[campaign.simStrategy] || campaign.simStrategy}</Descriptions.Item>
              <Descriptions.Item label="Guruh">{campaign.contactGroup?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Interval">{(campaign.intervalMs || 1000) / 1000}s</Descriptions.Item>
              <Descriptions.Item label="Boshlangan">{campaign.startedAt ? formatDate(campaign.startedAt) : '-'}</Descriptions.Item>
              <Descriptions.Item label="Yakunlangan">{campaign.completedAt ? formatDate(campaign.completedAt) : '-'}</Descriptions.Item>
              {campaign.type === CampaignType.SMS && campaign.messageTemplate && (
                <Descriptions.Item label="Xabar matni" span={2}>
                  <div style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 8, borderRadius: 8, fontSize: 13 }}>
                    {campaign.messageTemplate}
                  </div>
                </Descriptions.Item>
              )}
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
            placeholder="Holati bo'yicha"
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
            showTotal: (t: number) => `Jami: ${t}`,
          }}
        />
      </Card>

      <Modal
        title="Kampaniyani tahrirlash"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        okText="Saqlash"
        cancelText="Bekor qilish"
        confirmLoading={updateMut.isPending}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="Nomi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {campaign.type === CampaignType.SMS && (
            <Form.Item name="messageTemplate" label="Xabar matni">
              <Input.TextArea rows={4} showCount maxLength={1600} />
            </Form.Item>
          )}
          <Form.Item name="contactGroupId" label="Kontakt guruhi">
            <Select
              options={(groups as any[]).map((g: any) => ({
                label: `${g.name} (${g.contactCount} ta)`,
                value: g.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="deviceIds" label="Qurilmalar">
            <Select
              mode="multiple"
              options={(devices as any[]).map((d: any) => ({
                label: `${d.name} ${d.isOnline ? '(Onlayn)' : '(Oflayn)'}`,
                value: d.id,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="intervalMs" label="Interval (ms)">
                <InputNumber min={500} max={60000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="simStrategy" label="SIM strategiyasi">
                <Select options={Object.entries(SIM_STRATEGY_LABELS).map(([k, v]) => ({ label: v, value: k }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default CampaignDetailPage;
