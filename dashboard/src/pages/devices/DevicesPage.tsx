import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Input, Modal, Form, message, Typography, Divider } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MobileOutlined,
  ReloadOutlined,
  QrcodeOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { PageHeader } from '@/components/common/PageHeader';
import AppDownloadCard from './AppDownloadCard';
import { devicesApi } from '@/api/devices.api';
import { colors } from '@/styles/theme';
import { formatDate } from '@/utils/format';
import type { Device } from '@/types/device.types';

const { Text, Title } = Typography;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
`;

const QrContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 16px;
`;

const QrBox = styled.div`
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  border: 2px solid ${colors.primary};
  display: inline-block;
`;

const TokenBox = styled.div`
  background: #f1f5f9;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  width: 100%;
  text-align: center;
  color: #334155;
`;

const StepList = styled.ol`
  text-align: left;
  font-size: 14px;
  color: #555;
  line-height: 2;
  padding-left: 20px;
  margin-top: 8px;
`;

function DevicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [newDevice, setNewDevice] = useState<{ id: string; name: string; deviceToken: string } | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.getDevices(),
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => devicesApi.registerDevice(name),
    onSuccess: (res: any) => {
      const device = res.data;
      setNewDevice(device);
      setAddOpen(false);
      setQrOpen(true);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: () => message.error('Xatolik yuz berdi'),
  });

  const devices = (data?.data || []).filter(
    (d: Device) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()),
  );

  const serverUrl = window.location.origin;
  const qrData = newDevice
    ? JSON.stringify({
        server: serverUrl,
        token: newDevice.deviceToken,
        name: newDevice.name,
      })
    : '';

  const copyToken = () => {
    if (newDevice?.deviceToken) {
      navigator.clipboard.writeText(newDevice.deviceToken);
      message.success('Token nusxalandi');
    }
  };

  const columns = [
    {
      title: 'Nomi',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Device) => (
        <Space>
          <MobileOutlined style={{ color: colors.primary }} />
          <a onClick={() => navigate(`/devices/${record.id}`)}>{name}</a>
        </Space>
      ),
    },
    {
      title: 'Holati',
      dataIndex: 'isOnline',
      key: 'isOnline',
      render: (online: boolean) => (
        <Tag color={online ? 'success' : 'default'}>
          {online ? 'Onlayn' : 'Oflayn'}
        </Tag>
      ),
    },
    {
      title: 'SIM kartalar',
      dataIndex: 'simCards',
      key: 'simCards',
      render: (sims: any) =>
        sims?.length ? `${sims.length} ta` : '-',
    },
    {
      title: 'Batareya',
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      render: (v: number | null) =>
        v !== null && v !== undefined ? (
          <Tag color={v > 20 ? 'green' : 'red'}>{v}%</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Oxirgi faollik',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      render: (v: string) => (v ? formatDate(v) : '-'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Qurilmalar"
        subtitle="Ulangan Android qurilmalarni boshqarish"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddOpen(true)}
          >
            Qurilma qo'shish
          </Button>
        }
      />

      <AppDownloadCard />

      <Toolbar>
        <Input
          placeholder="Qidirish..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Yangilash
        </Button>
      </Toolbar>

      <Table
        dataSource={devices}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({
          onClick: () => navigate(`/devices/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Qurilma qo'shish modali */}
      <Modal
        title="Yangi qurilma qo'shish"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => form.submit()}
        okText="Qo'shish"
        cancelText="Bekor qilish"
        confirmLoading={addMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => addMutation.mutate(v.name)}
        >
          <Form.Item
            name="name"
            label="Qurilma nomi"
            rules={[{ required: true, message: 'Nomini kiriting' }]}
          >
            <Input placeholder="Masalan: Samsung Galaxy A54" />
          </Form.Item>
        </Form>
      </Modal>

      {/* QR kod modali - qurilma qo'shilgandan keyin */}
      <Modal
        title={null}
        open={qrOpen}
        onCancel={() => { setQrOpen(false); setNewDevice(null); }}
        footer={[
          <Button key="close" type="primary" size="large" block onClick={() => { setQrOpen(false); setNewDevice(null); }}>
            Tayyor
          </Button>,
        ]}
        width={440}
      >
        <QrContainer>
          <QrcodeOutlined style={{ fontSize: 32, color: colors.primary }} />
          <Title level={4} style={{ margin: 0 }}>
            {newDevice?.name}
          </Title>
          <Text type="secondary">
            Telefonda ilovani oching va QR kodni skanerlang
          </Text>

          <QrBox>
            <QRCodeSVG
              value={qrData}
              size={220}
              level="M"
              includeMargin={false}
              fgColor="#111827"
            />
          </QrBox>

          <StepList>
            <li>Telefonga SMS Gateway ilovasini o'rnating</li>
            <li>Ilovani oching</li>
            <li>QR kodni skanerlang - avtomatik ulanadi</li>
          </StepList>

          <Divider style={{ margin: '8px 0' }}>yoki token bilan ulaning</Divider>

          <TokenBox>{newDevice?.deviceToken}</TokenBox>
          <Button
            icon={<CopyOutlined />}
            onClick={copyToken}
            size="small"
          >
            Token nusxalash
          </Button>
        </QrContainer>
      </Modal>
    </div>
  );
}

export default DevicesPage;
