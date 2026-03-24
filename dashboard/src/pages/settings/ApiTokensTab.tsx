import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
  Tag,
  Switch,
  Popconfirm,
  Alert,
  Space,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiTokensApi } from '@/api/api-tokens.api';
import { colors } from '@/styles/theme';
import type { ApiToken } from '@/types/api-token.types';
import dayjs from 'dayjs';

const PERMISSION_OPTIONS = [
  { label: 'SMS jo\'natish', value: 'send_sms' },
  { label: 'Qo\'ng\'iroq qilish', value: 'send_call' },
  { label: 'Status tekshirish', value: 'check_status' },
  { label: 'Balans tekshirish', value: 'check_balance' },
];

const PERMISSION_COLORS: Record<string, string> = {
  send_sms: 'blue',
  send_call: 'green',
  check_status: 'orange',
  check_balance: 'purple',
};

function ApiTokensTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: () => apiTokensApi.getTokens(),
  });

  const tokens: ApiToken[] = data?.data?.data ?? data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: apiTokensApi.createToken,
    onSuccess: (res) => {
      const result = res.data?.data ?? res.data ?? res;
      setCreatedToken(result.token || result.fullToken || JSON.stringify(result));
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      form.resetFields();
      message.success('Token yaratildi');
    },
    onError: () => {
      message.error('Token yaratishda xatolik');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive: boolean } }) =>
      apiTokensApi.updateToken(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiTokensApi.deleteToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      message.success("Token o'chirildi");
    },
  });

  const handleCreate = (values: { name: string; permissions: string[] }) => {
    createMutation.mutate(values);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCreatedToken(null);
    form.resetFields();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Nusxalandi');
  };

  const columns = [
    {
      title: 'Nomi',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      render: (token: string) => (
        <Typography.Text code copyable style={{ fontSize: 11 }}>
          {token}
        </Typography.Text>
      ),
    },
    {
      title: 'Ruxsatlar',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms: string[]) => (
        <Space size={4} wrap>
          {perms?.map((p) => (
            <Tag key={p} color={PERMISSION_COLORS[p] || 'default'}>
              {p}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Oxirgi ishlatilgan',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date: string | null) =>
        date ? dayjs(date).format('DD.MM.YYYY HH:mm') : 'Hech qachon',
    },
    {
      title: 'Holat',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean, record: ApiToken) => (
        <Switch
          checked={active}
          size="small"
          onChange={(checked) =>
            updateMutation.mutate({ id: record.id, data: { isActive: checked } })
          }
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: ApiToken) => (
        <Popconfirm
          title="Tokenni o'chirmoqchimisiz?"
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText="Ha"
          cancelText="Yo'q"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Yangi token yaratish
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tokens}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        style={{ borderRadius: 12 }}
      />

      <Modal
        title={createdToken ? 'Token yaratildi' : 'Yangi API token'}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={
          createdToken
            ? [
                <Button key="close" type="primary" onClick={handleCloseModal}>
                  Yopish
                </Button>,
              ]
            : undefined
        }
        onOk={createdToken ? undefined : () => form.submit()}
        okText="Yaratish"
        cancelText="Bekor qilish"
        confirmLoading={createMutation.isPending}
      >
        {createdToken ? (
          <div>
            <Alert
              type="warning"
              showIcon
              message="Bu tokenni saqlang, qayta ko'rsatilmaydi!"
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Input
                value={createdToken}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(createdToken).then(() => {
                    message.success('Token nusxalandi!');
                  }).catch(() => {
                    // Fallback for older browsers
                    const el = document.createElement('textarea');
                    el.value = createdToken;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    message.success('Token nusxalandi!');
                  });
                }}
              >
                Nusxalash
              </Button>
            </div>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="name"
              label="Token nomi"
              rules={[{ required: true, message: 'Nomini kiriting' }]}
            >
              <Input placeholder="Masalan: CRM integratsiya" />
            </Form.Item>
            <Form.Item
              name="permissions"
              label="Ruxsatlar"
              rules={[{ required: true, message: 'Kamida bitta ruxsat tanlang' }]}
            >
              <Checkbox.Group options={PERMISSION_OPTIONS} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}

export default ApiTokensTab;
