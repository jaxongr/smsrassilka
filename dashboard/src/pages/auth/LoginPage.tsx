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
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #1a1a2e 100%);
  padding: 24px;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 36px;
`;

const LogoIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 20px rgba(107, 70, 193, 0.35);
`;

const BrandTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0;

  span {
    color: ${colors.primary};
  }
`;

const BrandSubtitle = styled.p`
  font-size: 14px;
  color: ${colors.textSecondary};
  margin: 6px 0 0;
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
  margin-top: 24px;
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
      <LoginCard>
        <LogoSection>
          <LogoIcon>
            <SendOutlined style={{ fontSize: 28, color: '#fff' }} />
          </LogoIcon>
          <BrandTitle>
            SMS <span>Gateway</span>
          </BrandTitle>
          <BrandSubtitle>Boshqaruv paneliga kirish</BrandSubtitle>
        </LogoSection>

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

        <Footer>SMS Gateway v1.0 — Barcha huquqlar himoyalangan</Footer>
      </LoginCard>
    </Wrapper>
  );
}

export default LoginPage;
