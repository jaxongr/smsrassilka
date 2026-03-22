import { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { FileUpload } from '@/components/common/FileUpload';
import { blacklistApi, type BlacklistEntry } from '@/api/blacklist.api';
import { formatDate, formatPhone } from '@/utils/format';

function BlacklistPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['blacklist', page, search],
    queryFn: () => blacklistApi.getBlacklist({ page, limit: 20, search }),
  });

  const addMutation = useMutation({
    mutationFn: (v: { phoneNumber: string; reason?: string }) =>
      blacklistApi.addToBlacklist(v.phoneNumber, v.reason),
    onSuccess: () => {
      message.success('Qo\'shildi');
      setAddOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
    onError: () => message.error('Xatolik'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => blacklistApi.removeFromBlacklist(id),
    onSuccess: () => {
      message.success('O\'chirildi');
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => blacklistApi.importBlacklist(file),
    onSuccess: (res) => {
      message.success(`${res.data.data.imported} ta import qilindi`);
      setImportOpen(false);
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
    onError: () => message.error('Import xatosi'),
  });

  const entries: BlacklistEntry[] = data?.data?.data || [];
  const meta = data?.data?.meta;

  const columns = [
    {
      title: 'Telefon raqam',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (v: string) => formatPhone(v),
    },
    {
      title: 'Sabab',
      dataIndex: 'reason',
      key: 'reason',
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Qo\'shilgan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, r: BlacklistEntry) => (
        <Popconfirm
          title="O'chirmoqchimisiz?"
          onConfirm={() => removeMutation.mutate(r.id)}
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
      <PageHeader
        title="Qora ro'yxat"
        subtitle="Bloklangan telefon raqamlar"
        actions={
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
              Qo'shish
            </Button>
          </Space>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Telefon raqam bo'yicha qidirish..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 400 }}
          allowClear
        />
      </div>

      <Table
        dataSource={entries}
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

      <Modal
        title="Qora ro'yxatga qo'shish"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => form.submit()}
        okText="Qo'shish"
        cancelText="Bekor qilish"
        confirmLoading={addMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => addMutation.mutate(v)}>
          <Form.Item name="phoneNumber" label="Telefon raqam" rules={[{ required: true, message: 'Kiriting' }]}>
            <Input placeholder="+998901234567" />
          </Form.Item>
          <Form.Item name="reason" label="Sabab">
            <Input placeholder="Bloklash sababi" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Import" open={importOpen} onCancel={() => setImportOpen(false)} footer={null}>
        <FileUpload
          accept=".csv,.xlsx,.xls,.txt"
          hint="CSV yoki TXT fayl (har bir qatorda bitta telefon raqam)"
          onFile={(file) => importMutation.mutate(file)}
        />
      </Modal>
    </div>
  );
}

export default BlacklistPage;
