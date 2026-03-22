import { PageHeader } from '@/components/common/PageHeader';
import { Card, Table, Tag, Button, Space } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { colors } from '@/styles/theme';
import { formatDate } from '@/utils/format';

const RoleBadge = styled(Tag)<{ $role: string }>`
  border-radius: 6px;
  font-weight: 500;
`;

function UsersPage() {
  const columns = [
    { title: 'Ism', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => (
        <RoleBadge
          $role={v}
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
      title: 'Ro\'yxatdan o\'tgan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v, 'DD.MM.YYYY'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle="Tizim foydalanuvchilarini boshqarish"
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            Foydalanuvchi qo'shish
          </Button>
        }
      />

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={[]}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'Foydalanuvchilar API ulanmagan' }}
        />
      </Card>
    </div>
  );
}

export default UsersPage;
