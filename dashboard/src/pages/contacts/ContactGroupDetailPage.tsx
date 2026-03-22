import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Input,
  Spin,
  Modal,
  Form,
  message,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { FileUpload } from '@/components/common/FileUpload';
import { contactsApi } from '@/api/contacts.api';
import { formatDate, formatPhone } from '@/utils/format';
import type { Contact } from '@/types/contact.types';

function ContactGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: groupData } = useQuery({
    queryKey: ['contact-group', id],
    queryFn: () => contactsApi.getGroup(id!),
    enabled: !!id,
  });

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['group-contacts', id, page, search],
    queryFn: () =>
      contactsApi.getGroupContacts(id!, { page, limit: 20, search }),
    enabled: !!id,
  });

  const addMutation = useMutation({
    mutationFn: (values: { phoneNumber: string; firstName?: string; lastName?: string }) =>
      contactsApi.addContact(id!, values),
    onSuccess: () => {
      message.success('Kontakt qo\'shildi');
      setAddOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['group-contacts', id] });
    },
    onError: () => message.error('Xatolik yuz berdi'),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => contactsApi.importContacts(id!, file),
    onSuccess: (res) => {
      const d = res.data;
      message.success(`${d.imported} ta import qilindi, ${d.total - d.imported} ta dublikat`);
      setImportOpen(false);
      queryClient.invalidateQueries({ queryKey: ['group-contacts', id] });
    },
    onError: () => message.error('Import xatosi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => contactsApi.deleteContact(contactId),
    onSuccess: () => {
      message.success('Kontakt o\'chirildi');
      queryClient.invalidateQueries({ queryKey: ['group-contacts', id] });
    },
  });

  const group = groupData?.data;
  const contacts = contactsData?.data?.data || [];
  const meta = contactsData?.data;

  const columns = [
    {
      title: 'Telefon raqam',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (v: string) => formatPhone(v),
    },
    { title: 'Ism', dataIndex: 'firstName', key: 'firstName', render: (v: string) => v || '-' },
    { title: 'Familiya', dataIndex: 'lastName', key: 'lastName', render: (v: string) => v || '-' },
    {
      title: 'Qo\'shilgan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v, 'DD.MM.YYYY'),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: Contact) => (
        <Popconfirm
          title="O'chirmoqchimisiz?"
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
      <PageHeader
        title={group?.name || 'Guruh'}
        subtitle={group?.description || undefined}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contacts')}>
              Orqaga
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
              Kontakt qo'shish
            </Button>
          </Space>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Telefon raqam yoki ism bo'yicha qidirish..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 400 }}
          allowClear
        />
      </div>

      <Table
        dataSource={contacts}
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

      <Modal
        title="Kontakt qo'shish"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => form.submit()}
        okText="Qo'shish"
        cancelText="Bekor qilish"
        confirmLoading={addMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => addMutation.mutate(v)}>
          <Form.Item name="phoneNumber" label="Telefon raqam" rules={[{ required: true, message: 'Raqamni kiriting' }]}>
            <Input placeholder="+998901234567" />
          </Form.Item>
          <Form.Item name="firstName" label="Ism">
            <Input placeholder="Ism" />
          </Form.Item>
          <Form.Item name="lastName" label="Familiya">
            <Input placeholder="Familiya" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kontaktlarni import qilish"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        footer={null}
      >
        <FileUpload
          accept=".csv,.xlsx,.xls,.txt"
          hint="CSV, Excel yoki TXT fayl (TXT: har qatorda bitta telefon raqam, CSV/Excel: phoneNumber, firstName, lastName ustunlari)"
          onFile={(file) => importMutation.mutate(file)}
        />
        {importMutation.isPending && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin /> Import qilinmoqda...
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ContactGroupDetailPage;
