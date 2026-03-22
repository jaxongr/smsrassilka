import { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Tooltip,
  Row,
  Col,
} from 'antd';
import {
  AndroidOutlined,
  DownloadOutlined,
  UploadOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { appDownloadApi, type AppInfo } from '@/api/app-download.api';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/styles/theme';

const { Title, Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border: 1px solid ${colors.cardBorder};
  border-radius: 12px;

  .ant-card-body {
    padding: 24px;
  }
`;

const AppIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  flex-shrink: 0;
`;

const InfoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`;

const QrSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px dashed ${colors.cardBorder};
  border-radius: 12px;
  background: ${colors.bgBody};
  min-width: 140px;
`;

const QrPlaceholder = styled.div`
  width: 100px;
  height: 100px;
  border: 2px solid ${colors.primary};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: ${colors.primary};
  }

  /* Simple QR-like pattern */
  &::before {
    width: 28px;
    height: 28px;
    top: 10px;
    left: 10px;
    border: 4px solid ${colors.primary};
    background: transparent;
  }

  &::after {
    width: 28px;
    height: 28px;
    bottom: 10px;
    right: 10px;
    border: 4px solid ${colors.primary};
    background: transparent;
  }
`;

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function AppDownloadCard() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['app-info'],
    queryFn: () => appDownloadApi.getAppInfo(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, version }: { file: File; version: string }) =>
      appDownloadApi.uploadApp(file, version),
    onSuccess: () => {
      message.success('APK muvaffaqiyatli yuklandi');
      setUploadOpen(false);
      form.resetFields();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['app-info'] });
    },
    onError: () => message.error('APK yuklashda xatolik yuz berdi'),
  });

  const appInfo: AppInfo | undefined = data?.data?.data;
  const hasApk = appInfo && appInfo.fileSize > 0;

  const handleDownload = () => {
    window.open(appDownloadApi.getDownloadUrl(), '_blank');
  };

  const handleUpload = () => {
    form.validateFields().then((values) => {
      if (!selectedFile) {
        message.warning('APK faylni tanlang');
        return;
      }
      uploadMutation.mutate({ file: selectedFile, version: values.version });
    });
  };

  return (
    <>
      <StyledCard loading={isLoading}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={14}>
            <InfoSection>
              <AppIcon>
                <AndroidOutlined />
              </AppIcon>
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  SMS Gateway Mobile
                </Title>
                <Space size={8} style={{ marginTop: 4 }}>
                  {hasApk ? (
                    <>
                      <Tag color="purple">v{appInfo.version}</Tag>
                      <Text type="secondary">
                        {formatFileSize(appInfo.fileSize)}
                      </Text>
                      {appInfo.updatedAt && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(appInfo.updatedAt).toLocaleDateString(
                            'uz-UZ',
                          )}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text type="secondary">APK hali yuklanmagan</Text>
                  )}
                </Space>
                <div style={{ marginTop: 12 }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      disabled={!hasApk}
                      onClick={handleDownload}
                    >
                      Yuklab olish
                    </Button>
                    {isAdmin && (
                      <Button
                        icon={<UploadOutlined />}
                        onClick={() => setUploadOpen(true)}
                      >
                        APK yuklash
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            </InfoSection>
          </Col>
          <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Telefoningiz bilan skanerlang">
              <QrSection>
                <QrPlaceholder>
                  <QrcodeOutlined
                    style={{ fontSize: 24, color: colors.primary, zIndex: 1 }}
                  />
                </QrPlaceholder>
                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                  QR kod orqali yuklab oling
                </Text>
              </QrSection>
            </Tooltip>
          </Col>
        </Row>
      </StyledCard>

      <Modal
        title="APK yuklash"
        open={uploadOpen}
        onCancel={() => {
          setUploadOpen(false);
          form.resetFields();
          setSelectedFile(null);
        }}
        onOk={handleUpload}
        okText="Yuklash"
        cancelText="Bekor qilish"
        confirmLoading={uploadMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="version"
            label="Versiya"
            rules={[{ required: true, message: 'Versiyani kiriting' }]}
          >
            <Input placeholder="Masalan: 1.2.0" />
          </Form.Item>
          <Form.Item label="APK fayl" required>
            <Upload
              beforeUpload={(file) => {
                setSelectedFile(file);
                return false;
              }}
              onRemove={() => setSelectedFile(null)}
              maxCount={1}
              accept=".apk"
              fileList={
                selectedFile
                  ? [
                      {
                        uid: '-1',
                        name: selectedFile.name,
                        status: 'done',
                        size: selectedFile.size,
                      },
                    ]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>APK faylni tanlang</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default AppDownloadCard;
