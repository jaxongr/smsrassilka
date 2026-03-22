import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, SendOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { colors } from '@/styles/theme';
import { useAuthStore } from '@/store/auth.store';

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
`;

const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -20%;
    right: -10%;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -15%;
    left: -5%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const BrandIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

const BrandName = styled.h1`
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  position: relative;
  z-index: 1;
`;

const BrandTagline = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin: 8px 0 0;
  position: relative;
  z-index: 1;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: ${colors.bgWhite};

  @media (max-width: 768px) {
    min-height: 100vh;
  }
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 400px;
`;

const FormTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 4px;
`;

const FormSubtitle = styled.p`
  font-size: 14px;
  color: ${colors.textSecondary};
  margin: 0 0 32px;
`;

const SubmitButton = styled(Button)`
  width: 100%;
  height: 44px;
  font-weight: 600;
  font-size: 15px;
  border-radius: 10px;
  margin-top: 8px;
`;

const Footer = styled.p`
  text-align: center;
  margin-top: 32px;
  font-size: 13px;
  color: ${colors.textHint};
`;

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Tizimga muvaffaqiyatli kirdingiz');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error?.response?.data?.message || 'Login xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <LeftPanel>
        <BrandIcon>
          <SendOutlined style={{ fontSize: 32, color: '#fff' }} />
        </BrandIcon>
        <BrandName>SMS Gateway</BrandName>
        <BrandTagline>Xabarlarni tez va oson boshqaring</BrandTagline>
      </LeftPanel>

      <RightPanel>
        <LoginCard>
          <FormTitle>Tizimga kirish</FormTitle>
          <FormSubtitle>Boshqaruv paneliga kirish uchun ma'lumotlaringizni kiriting</FormSubtitle>

          <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
            <Form.Item
              name="email"
              label="Elektron pochta"
              rules={[
                { required: true, message: 'Email kiriting' },
                { type: 'email', message: 'Email noto\'g\'ri' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="email@example.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Parol"
              rules={[{ required: true, message: 'Parol kiriting' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Parolingiz" />
            </Form.Item>

            <Form.Item>
              <SubmitButton type="primary" htmlType="submit" loading={loading}>
                Kirish
              </SubmitButton>
            </Form.Item>
          </Form>

          <Footer>SMS Gateway v1.0</Footer>
        </LoginCard>
      </RightPanel>
    </Wrapper>
  );
}

export default LoginPage;
