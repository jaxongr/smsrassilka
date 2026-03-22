import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Input, Tag, Select, message } from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { inboxApi } from '@/api/inbox.api';
import { formatDate, formatPhone } from '@/utils/format';
import { colors } from '@/styles/theme';
import type { InboxMessage } from '@/types/inbox.types';

function InboxPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<boolean | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['inbox', page, search, readFilter],
    queryFn: () => inboxApi.getInbox({ page, limit: 20, search, isRead: readFilter }),
  });

  const markAllMut = useMutation({
    mutationFn: () => inboxApi.markAllAsRead(),
    onSuccess: () => {
      message.success('Barchasi o\'qildi deb belgilandi');
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-unread'] });
    },
  });

  const messages: InboxMessage[] = data?.data?.data || [];
  const meta = data?.data?.meta;

  const columns = [
    {
      title: '',
      key: 'read',
      width: 40,
      render: (_: unknown, r: InboxMessage) =>
        !r.isRead ? (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.primary,
            }}
          />
        ) : null,
    },
    {
      title: 'Raqam',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (v: string) => (
        <a onClick={() => navigate(`/inbox/conversation/${encodeURIComponent(v)}`)}>
          {formatPhone(v)}
        </a>
      ),
    },
    {
      title: 'Xabar',
      dataIndex: 'body',
      key: 'body',
      ellipsis: true,
      render: (v: string, r: InboxMessage) => (
        <span style={{ fontWeight: r.isRead ? 400 : 600 }}>{v}</span>
      ),
    },
    {
      title: 'Qurilma',
      dataIndex: 'deviceName',
      key: 'deviceName',
      render: (v: string, r: InboxMessage) => (
        <Tag>{v} (SIM {r.simSlot})</Tag>
      ),
    },
    {
      title: 'Qabul qilingan',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      render: (v: string) => formatDate(v),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Kiruvchi SMS"
        subtitle="Qurilmalarga kelgan xabarlar"
        actions={
          <Button
            icon={<CheckOutlined />}
            onClick={() => markAllMut.mutate()}
            loading={markAllMut.isPending}
          >
            Barchasini o'qildi deb belgilash
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Qidirish..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Holati"
          value={readFilter}
          onChange={(v) => { setReadFilter(v); setPage(1); }}
          allowClear
          style={{ width: 160 }}
          options={[
            { label: 'O\'qilmagan', value: false },
            { label: 'O\'qilgan', value: true },
          ]}
        />
      </Space>

      <Table
        dataSource={messages}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        onRow={(record) => ({
          onClick: () =>
            navigate(`/inbox/conversation/${encodeURIComponent(record.phoneNumber)}`),
          style: {
            cursor: 'pointer',
            background: record.isRead ? undefined : colors.primaryBg,
          },
        })}
        pagination={{
          current: page,
          pageSize: 20,
          total: meta?.total || 0,
          onChange: setPage,
          showTotal: (t) => `Jami: ${t}`,
        }}
      />
    </div>
  );
}

export default InboxPage;
