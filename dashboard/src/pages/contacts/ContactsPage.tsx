import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Modal, Form, Input, Empty, Spin, Popconfirm, message } from 'antd';
import { PlusOutlined, TeamOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { PageHeader } from '@/components/common/PageHeader';
import { contactsApi } from '@/api/contacts.api';
import { colors } from '@/styles/theme';
import { formatDate, formatNumber } from '@/utils/format';
import type { ContactGroup } from '@/types/contact.types';

const GroupCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.cardBorder};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${colors.primary};
    box-shadow: 0 4px 12px rgba(107, 70, 193, 0.1);
  }
`;

const GroupIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${colors.primaryBg};
  color: ${colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 12px;
`;

const GroupName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const GroupMeta = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
`;

const GroupActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

function ContactsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<ContactGroup | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: () => contactsApi.getGroups(),
  });

  const createMutation = useMutation({
    mutationFn: (values: { name: string; description?: string }) =>
      editGroup
        ? contactsApi.updateGroup(editGroup.id, values)
        : contactsApi.createGroup(values),
    onSuccess: () => {
      message.success(editGroup ? 'Guruh yangilandi' : 'Guruh yaratildi');
      setModalOpen(false);
      setEditGroup(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
    },
    onError: () => message.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.deleteGroup(id),
    onSuccess: () => {
      message.success('Guruh o\'chirildi');
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
    },
  });

  const groups: ContactGroup[] = data?.data || [];

  const openEdit = (group: ContactGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditGroup(group);
    form.setFieldsValue({ name: group.name, description: group.description });
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Kontaktlar"
        subtitle="Kontakt guruhlarini boshqarish"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditGroup(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Guruh yaratish
          </Button>
        }
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : groups.length === 0 ? (
        <Empty description="Kontakt guruhlari topilmadi" />
      ) : (
        <Row gutter={[16, 16]}>
          {groups.map((group) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={group.id}>
              <GroupCard onClick={() => navigate(`/contacts/${group.id}`)}>
                <GroupIcon><TeamOutlined /></GroupIcon>
                <GroupName>{group.name}</GroupName>
                <GroupMeta>{formatNumber(group.contactCount)} ta kontakt</GroupMeta>
                <GroupMeta>{formatDate(group.createdAt, 'DD.MM.YYYY')}</GroupMeta>
                <GroupActions>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => openEdit(group, e)}
                  >
                    Tahrirlash
                  </Button>
                  <Popconfirm
                    title="Guruhni o'chirmoqchimisiz?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      deleteMutation.mutate(group.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Ha"
                    cancelText="Yo'q"
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      O'chirish
                    </Button>
                  </Popconfirm>
                </GroupActions>
              </GroupCard>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editGroup ? 'Guruhni tahrirlash' : 'Yangi guruh yaratish'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditGroup(null); }}
        onOk={() => form.submit()}
        okText={editGroup ? 'Saqlash' : 'Yaratish'}
        cancelText="Bekor qilish"
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="name" label="Guruh nomi" rules={[{ required: true, message: 'Nomini kiriting' }]}>
            <Input placeholder="Masalan: Mijozlar" />
          </Form.Item>
          <Form.Item name="description" label="Tavsif">
            <Input.TextArea rows={3} placeholder="Guruh haqida qisqacha..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ContactsPage;
