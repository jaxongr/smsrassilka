import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  InputNumber,
  Space,
  message,
  Switch,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { campaignsApi } from '@/api/campaigns.api';
import { contactsApi } from '@/api/contacts.api';
import { devicesApi } from '@/api/devices.api';
import { voiceMessagesApi } from '@/api/voice-messages.api';
import { CampaignType, SimStrategy } from '@/types/campaign.types';
import { SIM_STRATEGY_LABELS } from '@/utils/constants';

function CampaignCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const campaignType = Form.useWatch('type', form);
  const isScheduled = Form.useWatch('isScheduled', form);

  const { data: groupsData } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: () => contactsApi.getGroups(),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.getDevices(),
  });

  const { data: voiceData } = useQuery({
    queryKey: ['voice-messages'],
    queryFn: () => voiceMessagesApi.getVoiceMessages(),
    enabled: campaignType === CampaignType.CALL,
  });

  const createMutation = useMutation({
    mutationFn: campaignsApi.createCampaign,
    onSuccess: (res) => {
      message.success('Kampaniya yaratildi');
      navigate(`/campaigns/${res.data.id}`);
    },
    onError: () => message.error('Xatolik yuz berdi'),
  });

  const groups = groupsData?.data || [];
  const devices = devicesData?.data || [];
  const voiceMessages = voiceData?.data || [];

  const onFinish = (values: Record<string, unknown>) => {
    const payload = {
      name: values.name as string,
      type: values.type as string,
      messageTemplate: values.message as string | undefined,
      voiceMessageId: values.voiceMessageId as string | undefined,
      contactGroupId: values.contactGroupId as string,
      deviceIds: values.deviceIds as string[],
      simStrategy: values.simStrategy as string,
      intervalMs: ((values.intervalSeconds as number) || 1) * 1000,
      scheduledAt: values.isScheduled && values.scheduledAt
        ? (values.scheduledAt as { toISOString: () => string }).toISOString()
        : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Yangi kampaniya"
        subtitle="SMS yoki ovozli kampaniya yaratish"
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/campaigns')}>
            Orqaga
          </Button>
        }
      />

      <Card style={{ borderRadius: 12, maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            type: CampaignType.SMS,
            simStrategy: SimStrategy.ROUND_ROBIN,
            intervalSeconds: 1,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item name="name" label="Kampaniya nomi" rules={[{ required: true, message: 'Nomini kiriting' }]}>
                <Input placeholder="Masalan: Yangi yil tabrigi" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="type" label="Turi" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'SMS', value: CampaignType.SMS },
                    { label: 'Ovozli qo\'ng\'iroq', value: CampaignType.CALL },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          {campaignType === CampaignType.SMS && (
            <Form.Item name="message" label="Xabar matni" rules={[{ required: true, message: 'Xabar kiriting' }]}>
              <Input.TextArea
                rows={4}
                placeholder="Salom {firstName}, sizga maxsus taklif..."
                showCount
                maxLength={1600}
              />
            </Form.Item>
          )}

          {campaignType === CampaignType.CALL && (
            <Form.Item name="voiceMessageId" label="Ovozli xabar" rules={[{ required: true, message: 'Tanlang' }]}>
              <Select
                placeholder="Ovozli xabarni tanlang"
                options={voiceMessages.map((v) => ({ label: v.name, value: v.id }))}
              />
            </Form.Item>
          )}

          <Form.Item name="contactGroupId" label="Kontakt guruhi" rules={[{ required: true, message: 'Tanlang' }]}>
            <Select
              placeholder="Guruhni tanlang"
              options={groups.map((g) => ({
                label: `${g.name} (${g.contactCount} ta)`,
                value: g.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="deviceIds" label="Qurilmalar" rules={[{ required: true, message: 'Tanlang' }]}>
            <Select
              mode="multiple"
              placeholder="Qurilmalarni tanlang"
              options={devices.map((d) => ({
                label: `${d.name} ${d.isOnline ? '(Onlayn)' : '(Oflayn)'}`,
                value: d.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="simStrategy" label="SIM strategiyasi">
                <Select
                  options={Object.entries(SIM_STRATEGY_LABELS).map(([k, v]) => ({
                    label: v,
                    value: k,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="intervalSeconds" label="SMS orasidagi interval (soniya)">
                <InputNumber min={1} max={3600} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="dailyLimit" label="Kunlik limit">
                <InputNumber min={0} max={100000} placeholder="Cheksiz" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isScheduled" label="Rejalashtirilgan yuborish" valuePropName="checked">
            <Switch />
          </Form.Item>

          {isScheduled && (
            <Form.Item name="scheduledAt" label="Boshlanish vaqti" rules={[{ required: true, message: 'Vaqtni tanlang' }]}>
              <DatePicker showTime format="DD.MM.YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={createMutation.isPending} size="large">
                Kampaniyani yaratish
              </Button>
              <Button onClick={() => navigate('/campaigns')}>Bekor qilish</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CampaignCreatePage;
