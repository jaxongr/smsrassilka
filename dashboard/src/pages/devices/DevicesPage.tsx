import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MobileOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { PageHeader } from '@/components/common/PageHeader';
import AppDownloadCard from './AppDownloadCard';
import { devicesApi } from '@/api/devices.api';
import { colors } from '@/styles/theme';
import { formatDate } from '@/utils/format';
import type { Device } from '@/types/device.types';

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
`;

function DevicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.getDevices(),
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => devicesApi.registerDevice(name),
    onSuccess: () => {
      message.success('Qurilma qo\'shildi');
      setAddOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: () => message.error('Xatolik yuz berdi'),
  });

  const devices = (data?.data?.data || []).filter(
    (d: Device) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.deviceId.toLowerCase().includes(search.toLowerCase()),
  );

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
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (v: string) => v || '-',
    },
    {
      title: 'SIM kartalar',
      dataIndex: 'simCards',
      key: 'simCards',
      render: (sims: Device['simCards']) =>
        sims?.length ? `${sims.length} ta` : '-',
    },
    {
      title: 'Batareya',
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      render: (v: number | null) =>
        v !== null ? (
          <Tag color={v > 20 ? 'green' : 'red'}>{v}%</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Oxirgi faollik',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
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
    </div>
  );
}

export default DevicesPage;
