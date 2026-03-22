import { Card, Form, Input, Button, Divider, Switch, InputNumber, message, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import styled from 'styled-components';
import { colors } from '@/styles/theme';

const SettingSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 16px;
`;

function SettingsPage() {
  const [form] = Form.useForm();

  const onFinish = () => {
    message.success('Sozlamalar saqlandi');
  };

  return (
    <div>
      <PageHeader title="Sozlamalar" subtitle="Tizim sozlamalarini boshqarish" />

      <Card style={{ borderRadius: 12, maxWidth: 800 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <SettingSection>
            <SectionTitle>Umumiy sozlamalar</SectionTitle>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="companyName" label="Kompaniya nomi">
                  <Input placeholder="Kompaniya nomi" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="timezone" label="Vaqt mintaqasi">
                  <Input placeholder="Asia/Tashkent" />
                </Form.Item>
              </Col>
            </Row>
          </SettingSection>

          <Divider />

          <SettingSection>
            <SectionTitle>SMS sozlamalari</SectionTitle>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="defaultInterval" label="Standart interval (soniya)">
                  <InputNumber min={1} max={3600} style={{ width: '100%' }} placeholder="5" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="globalDailyLimit" label="Kunlik umumiy limit">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="10000" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="autoRetry" label="Xatolikda qayta urinish" valuePropName="checked">
              <Switch />
            </Form.Item>
          </SettingSection>

          <Divider />

          <SettingSection>
            <SectionTitle>Bildirishnomalar</SectionTitle>
            <Form.Item name="emailNotifications" label="Email bildirishnomalar" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="campaignCompleteNotify" label="Kampaniya tugaganda xabardor qilish" valuePropName="checked">
              <Switch />
            </Form.Item>
          </SettingSection>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default SettingsPage;
