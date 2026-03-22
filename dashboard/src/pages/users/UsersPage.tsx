import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { colors } from '@/styles/theme';
import { formatDate } from '@/utils/format';
import { usersApi } from '@/api/users.api';
import type { User } from '@/types/user.types';
import { Role } from '@/types/user.types';

const RoleBadge = styled(Tag)`
  border-radius: 6px;
  font-weight: 500;
`;

function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.getUsers({ page, limit: 20 }),
  });

  const createMut = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      message.success('Foydalanuvchi yaratildi');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => message.error('Yaratishda xatolik'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data: userData }: { id: string; data: Parameters<typeof usersApi.updateUser>[1] }) =>
      usersApi.updateUser(id, userData),
    onSuccess: () => {
      message.success('Foydalanuvchi yangilandi');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => message.error('Yangilashda xatolik'),
  });

  const deleteMut = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      message.success("Foydalanuvchi o'chirildi");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => message.error("O'chirishda xatolik"),
  });

  const users: User[] = data?.data?.data || [];
  const meta = data?.data?.meta;

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setModalOpen(true);
  };

  const onFinish = (values: Record<string, unknown>) => {
    if (editingUser) {
      const updateData: Record<string, unknown> = {
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        isActive: values.isActive,
      };
      if (values.password) {
        updateData.password = values.password;
      }
      updateMut.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMut.mutate(values as unknown as Parameters<typeof usersApi.createUser>[0]);
    }
  };

  const columns = [
    { title: 'Ism', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => (
        <RoleBadge
          color={
            v === 'ADMIN' ? 'purple' : v === 'MANAGER' ? 'blue' : 'default'
          }
        >
          {v === 'ADMIN' ? 'Administrator' : v === 'MANAGER' ? 'Menejer' : 'Operator'}
        </RoleBadge>
      ),
    },
    {
      title: 'Holati',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'error'}>{v ? 'Faol' : 'Nofaol'}</Tag>
      ),
    },
    {
      title: "Ro'yxatdan o'tgan",
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v, 'DD.MM.YYYY'),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Foydalanuvchini o'chirmoqchimisiz?"
            onConfirm={() => deleteMut.mutate(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle="Tizim foydalanuvchilarini boshqarish"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Foydalanuvchi qo'shish
          </Button>
        }
      />

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={users}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 20,
            total: meta?.total || 0,
            onChange: setPage,
            showTotal: (t) => `Jami: ${t}`,
          }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Foydalanuvchini tahrirlash' : "Yangi foydalanuvchi"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingUser ? 'Saqlash' : "Yaratish"}
        cancelText="Bekor qilish"
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="fullName"
            label="Ism"
            rules={[{ required: true, message: 'Ismni kiriting' }]}
          >
            <Input placeholder="To'liq ism" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Emailni kiriting' },
              { type: 'email', message: 'Email formati noto\'g\'ri' },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? 'Yangi parol (ixtiyoriy)' : 'Parol'}
            rules={editingUser ? [] : [{ required: true, message: 'Parolni kiriting' }]}
          >
            <Input.Password placeholder="Parol" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: 'Rolni tanlang' }]}
            initialValue={Role.OPERATOR}
          >
            <Select
              options={[
                { label: 'Administrator', value: Role.ADMIN },
                { label: 'Menejer', value: Role.MANAGER },
                { label: 'Operator', value: Role.OPERATOR },
              ]}
            />
          </Form.Item>
          {editingUser && (
            <Form.Item name="isActive" label="Faol" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default UsersPage;
