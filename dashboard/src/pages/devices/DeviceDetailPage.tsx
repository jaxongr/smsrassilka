import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Table,
  Space,
  Spin,
  Switch,
  InputNumber,
  message,
  Popconfirm,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { devicesApi } from '@/api/devices.api';
import { formatDate } from '@/utils/format';
import type { SimCard } from '@/types/device.types';

function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: () => devicesApi.getDevice(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => devicesApi.deleteDevice(id!),
    onSuccess: () => {
      message.success('Qurilma o\'chirildi');
      navigate('/devices');
    },
  });

  const simMutation = useMutation({
    mutationFn: ({
      slotIndex,
      data: simData,
    }: {
      slotIndex: number;
      data: { isActive?: boolean; dailyLimit?: number };
    }) => devicesApi.updateSim(id!, slotIndex, simData),
    onSuccess: () => {
      message.success('SIM yangilandi');
      queryClient.invalidateQueries({ queryKey: ['device', id] });
    },
  });

  const device = data?.data;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!device) {
    return <div>Qurilma topilmadi</div>;
  }

  const simColumns = [
    { title: 'Slot', dataIndex: 'slotIndex', key: 'slotIndex' },
    {
      title: 'Telefon raqam',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Operator',
      dataIndex: 'operator',
      key: 'operator',
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Faol',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean, record: SimCard) => (
        <Switch
          checked={v}
          onChange={(checked) =>
            simMutation.mutate({
              slotIndex: record.slotIndex,
              data: { isActive: checked },
            })
          }
        />
      ),
    },
    {
      title: 'Kunlik limit',
      dataIndex: 'dailyLimit',
      key: 'dailyLimit',
      render: (v: number, record: SimCard) => (
        <InputNumber
          value={v}
          min={0}
          max={10000}
          onBlur={(e) =>
            simMutation.mutate({
              slotIndex: record.slotIndex,
              data: { dailyLimit: Number(e.target.value) },
            })
          }
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: 'Yuborilgan',
      dataIndex: 'dailySentCount',
      key: 'dailySentCount',
    },
    {
      title: 'Signal',
      dataIndex: 'signalStrength',
      key: 'signalStrength',
      render: (v: number | null) => (v !== null ? `${v}%` : '-'),
    },
  ];

  return (
    <div>
      <PageHeader
        title={device.name}
        subtitle={`ID: ${device.deviceId}`}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/devices')}>
              Orqaga
            </Button>
            <Popconfirm
              title="Qurilmani o'chirmoqchimisiz?"
              onConfirm={() => deleteMutation.mutate()}
              okText="Ha"
              cancelText="Yo'q"
            >
              <Button danger icon={<DeleteOutlined />}>
                O'chirish
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="Holati">
            <Tag color={device.isOnline ? 'success' : 'default'}>
              {device.isOnline ? 'Onlayn' : 'Oflayn'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Model">{device.model || '-'}</Descriptions.Item>
          <Descriptions.Item label="OS versiyasi">{device.osVersion || '-'}</Descriptions.Item>
          <Descriptions.Item label="Ilova versiyasi">{device.appVersion || '-'}</Descriptions.Item>
          <Descriptions.Item label="Batareya">
            {device.batteryLevel !== null ? `${device.batteryLevel}%` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Signal">
            {device.signalStrength !== null ? `${device.signalStrength}%` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Oxirgi faollik">
            {device.lastSeen ? formatDate(device.lastSeen) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Qo'shilgan sana">{formatDate(device.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="API kalit (Token)" span={3}>
            <Space>
              <code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>
                {device.apiKey}
              </code>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(device.apiKey);
                  message.success('Token nusxalandi');
                }}
              >
                Nusxalash
              </Button>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="SIM kartalar" style={{ borderRadius: 12 }}>
        <Table
          dataSource={device.simCards || []}
          columns={simColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}

export default DeviceDetailPage;
