import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Tag, Tabs, message, Button } from 'antd';
import {
  SendOutlined,
  CopyOutlined,
  CheckOutlined,
  LockOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  ApiOutlined,
  PhoneOutlined,
  SearchOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { colors } from '@/styles/theme';

const { Title, Text, Paragraph } = Typography;

/* ─── Layout ─── */

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${colors.bgWhite};
`;

const TopBar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 48px;
  background: ${colors.bgWhite};
  border-bottom: 1px solid ${colors.cardBorder};
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    padding: 12px 20px;
  }
`;

const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: ${colors.textPrimary};
  cursor: pointer;

  span {
    color: ${colors.primary};
  }
`;

const ContentLayout = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 960px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.aside`
  width: 260px;
  flex-shrink: 0;
  padding: 32px 0 32px 48px;
  position: sticky;
  top: 65px;
  height: calc(100vh - 65px);
  overflow-y: auto;

  @media (max-width: 960px) {
    display: none;
  }
`;

const SidebarTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${colors.textHint};
  margin-bottom: 12px;
  padding-left: 12px;
`;

const SidebarLink = styled.a<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  color: ${(p) => (p.$active ? colors.primary : colors.textSecondary)};
  background: ${(p) => (p.$active ? colors.primaryBg : 'transparent')};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;

  &:hover {
    color: ${colors.primary};
    background: ${colors.primaryBg};
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 40px 48px 80px 48px;
  min-width: 0;
  max-width: 900px;

  @media (max-width: 768px) {
    padding: 24px 20px 60px;
  }
`;

/* ─── Components ─── */

const BaseUrl = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${colors.siderBg};
  color: #e2e8f0;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  margin-top: 12px;
`;

const Section = styled.section`
  margin-bottom: 56px;
  scroll-margin-top: 80px;
`;

const SectionHeading = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionDesc = styled.p`
  font-size: 15px;
  color: ${colors.textSecondary};
  margin: 0 0 24px;
  line-height: 1.6;
`;

const CodeBlock = styled.div`
  position: relative;
  background: #1e293b;
  border-radius: 10px;
  overflow: hidden;
  margin: 16px 0;
`;

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const CodeLang = styled.span`
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
`;

const CopyBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 4px 10px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.05);
  }
`;

const CodePre = styled.pre`
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #e2e8f0;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
`;

const MethodBadge = styled.span<{ $method: 'GET' | 'POST' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #fff;
  background: ${(p) => (p.$method === 'GET' ? '#10b981' : colors.primary)};
  min-width: 50px;
`;

const EndpointCard = styled.div`
  border: 1px solid ${colors.cardBorder};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  background: ${colors.bgWhite};
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }
`;

const EndpointHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const EndpointUrl = styled.code`
  font-size: 14px;
  font-weight: 600;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: ${colors.textPrimary};
`;

const EndpointDesc = styled.p`
  font-size: 14px;
  color: ${colors.textSecondary};
  margin: 0 0 16px;
  line-height: 1.6;
`;

const FieldTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;

  th {
    text-align: left;
    padding: 8px 12px;
    background: ${colors.bgBody};
    color: ${colors.textSecondary};
    font-weight: 600;
    border-bottom: 1px solid ${colors.cardBorder};
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid ${colors.cardBorder};
    color: ${colors.textPrimary};
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const FieldName = styled.code`
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: ${colors.primary};
  background: ${colors.primaryBg};
  padding: 2px 6px;
  border-radius: 4px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid ${colors.cardBorder};

  &:last-child {
    border-bottom: none;
  }
`;

const StatusCode = styled.code<{ $color: string }>`
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 700;
  font-size: 14px;
  color: ${(p) => p.$color};
  min-width: 36px;
`;

const SubLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${colors.textHint};
  margin-bottom: 6px;
  display: block;
`;

const PermissionTag = styled(Tag)`
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
`;

const StepList = styled.ol`
  padding-left: 20px;
  margin: 16px 0;
  li {
    margin-bottom: 8px;
    font-size: 14px;
    color: ${colors.textSecondary};
    line-height: 1.6;
  }
`;

const InfoBox = styled.div<{ $type?: 'info' | 'warning' }>`
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  margin: 16px 0;
  background: ${(p) => (p.$type === 'warning' ? '#FEF3C7' : colors.primaryBg)};
  border: 1px solid ${(p) => (p.$type === 'warning' ? '#FDE68A' : '#BFDBFE')};
  font-size: 13px;
  color: ${colors.textPrimary};
  line-height: 1.6;
`;

/* ─── Helpers ─── */

const S = {
  kw: (t: string) => <span style={{ color: '#c084fc' }}>{t}</span>,
  str: (t: string) => <span style={{ color: '#34d399' }}>{t}</span>,
  num: (t: string) => <span style={{ color: '#fbbf24' }}>{t}</span>,
  cm: (t: string) => <span style={{ color: '#64748b' }}>{t}</span>,
  key: (t: string) => <span style={{ color: '#7dd3fc' }}>{t}</span>,
  fn: (t: string) => <span style={{ color: '#f472b6' }}>{t}</span>,
};

/* ─── Data ─── */

const sidebarSections = [
  { id: 'overview', label: 'Umumiy ma\'lumot' },
  { id: 'auth', label: 'Autentifikatsiya' },
  { id: 'send-sms', label: 'SMS yuborish' },
  { id: 'send-call', label: 'Qo\'ng\'iroq yuborish' },
  { id: 'check-status', label: 'Status tekshirish' },
  { id: 'balance', label: 'Balans va limitlar' },
  { id: 'examples', label: 'Kod misollari' },
  { id: 'rate-limits', label: 'So\'rovlar limiti' },
  { id: 'status-codes', label: 'Status kodlari' },
  { id: 'errors', label: 'Xatoliklar' },
];

/* ─── Code Example Strings (plain text for copy) ─── */

const curlExample = `curl -X POST http://185.207.251.184:3008/api/v1/sms/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "to": "+998901234567",
    "message": "Salom! Bu test xabar."
  }'`;

const jsExample = `import axios from 'axios';

const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'http://185.207.251.184:3008/api/v1';

const response = await axios.post(
  \`\${BASE_URL}/sms/send\`,
  {
    to: '+998901234567',
    message: 'Salom! Bu test xabar.',
  },
  {
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
  }
);

console.log(response.data);
// { taskId: "abc123", status: "QUEUED" }`;

const pythonExample = `import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "http://185.207.251.184:3008/api/v1"

response = requests.post(
    f"{BASE_URL}/sms/send",
    json={
        "to": "+998901234567",
        "message": "Salom! Bu test xabar."
    },
    headers={
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }
)

print(response.json())
# {"taskId": "abc123", "status": "QUEUED"}`;

const phpExample = `<?php

$apiKey = "YOUR_API_KEY";
$baseUrl = "http://185.207.251.184:3008/api/v1";

$ch = curl_init("$baseUrl/sms/send");

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "x-api-key: $apiKey",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "to" => "+998901234567",
        "message" => "Salom! Bu test xabar.",
    ]),
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
// {"taskId": "abc123", "status": "QUEUED"}`;

/* ─── Component ─── */

function CopyableCode({
  lang,
  code,
  children,
}: {
  lang: string;
  code: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      message.success('Nusxalandi!');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <CodeBlock>
      <CodeHeader>
        <CodeLang>{lang}</CodeLang>
        <CopyBtn onClick={handleCopy}>
          {copied ? <CheckOutlined /> : <CopyOutlined />}
          {copied ? 'Nusxalandi' : 'Nusxalash'}
        </CopyBtn>
      </CodeHeader>
      <CodePre>{children}</CodePre>
    </CodeBlock>
  );
}

function ApiDocsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarSections.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      }));

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i].el;
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PageWrapper>
      {/* Top navigation */}
      <TopBar>
        <NavBrand onClick={() => navigate('/welcome')}>
          <SendOutlined style={{ color: colors.primary, fontSize: 24 }} />
          SMS <span>Gateway</span>
        </NavBrand>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="text" onClick={() => navigate('/login')}>
            Kirish
          </Button>
          <Button type="primary" onClick={() => navigate('/register')}>
            Bepul boshlash
          </Button>
        </div>
      </TopBar>

      <ContentLayout>
        {/* Sidebar */}
        <Sidebar>
          <SidebarTitle>Mundarija</SidebarTitle>
          {sidebarSections.map((s) => (
            <SidebarLink
              key={s.id}
              $active={activeSection === s.id}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </SidebarLink>
          ))}
        </Sidebar>

        {/* Main Content */}
        <MainContent>
          {/* ── Overview ── */}
          <Section id="overview">
            <div style={{ marginBottom: 8 }}>
              <Tag color="blue" style={{ fontSize: 12, fontWeight: 600 }}>
                REST API
              </Tag>
              <Tag color="green" style={{ fontSize: 12, fontWeight: 600 }}>
                v1
              </Tag>
            </div>
            <Title level={1} style={{ margin: '0 0 8px', fontSize: 36 }}>
              API Dokumentatsiya
            </Title>
            <Paragraph
              style={{
                fontSize: 18,
                color: colors.textSecondary,
                margin: '0 0 24px',
                maxWidth: 600,
              }}
            >
              SMS Gateway API orqali boshqa loyihalardan SMS va qo'ng'iroq yuboring
            </Paragraph>

            <SubLabel>Base URL</SubLabel>
            <BaseUrl>
              <span style={{ color: '#34d399' }}>{'>'}</span>
              http://185.207.251.184:3008/api/v1
              <CopyBtn
                style={{ marginLeft: 8 }}
                onClick={() => {
                  navigator.clipboard.writeText('http://185.207.251.184:3008/api/v1');
                  message.success('Nusxalandi!');
                }}
              >
                <CopyOutlined />
              </CopyBtn>
            </BaseUrl>
          </Section>

          {/* ── Authentication ── */}
          <Section id="auth">
            <SectionHeading>
              <LockOutlined style={{ color: colors.primary }} />
              Autentifikatsiya
            </SectionHeading>
            <SectionDesc>
              Barcha API so'rovlari <code style={{ color: colors.primary }}>x-api-key</code> header
              orqali autentifikatsiya qilinadi. Token olish uchun quyidagi qadamlarni bajaring:
            </SectionDesc>

            <StepList>
              <li>
                Dashboard'ga kiring va <strong>Sozlamalar</strong> sahifasiga o'ting
              </li>
              <li>
                <strong>API Tokenlar</strong> bo'limini tanlang
              </li>
              <li>
                <strong>"Yangi token"</strong> tugmasini bosing va kerakli ruxsatlarni belgilang
              </li>
              <li>Yaratilgan tokenni xavfsiz joyga saqlang — u faqat bir marta ko'rsatiladi</li>
            </StepList>

            <CopyableCode
              lang="Header"
              code={`x-api-key: YOUR_API_KEY\nContent-Type: application/json`}
            >
              {S.key('x-api-key')}: {S.str('"YOUR_API_KEY"')}
              {'\n'}
              {S.key('Content-Type')}: {S.str('"application/json"')}
            </CopyableCode>

            <InfoBox $type="warning">
              <WarningOutlined style={{ color: '#D97706', fontSize: 18, marginTop: 2 }} />
              <div>
                <strong>Muhim:</strong> API tokeningizni hech kimga bermang va ommaviy
                repozitoriyalarga qo'shmang. Agar token chiqib ketgan bo'lsa, darhol o'chirib yangi
                token yarating.
              </div>
            </InfoBox>
          </Section>

          {/* ── POST /sms/send ── */}
          <Section id="send-sms">
            <SectionHeading>
              <SendOutlined style={{ color: colors.primary }} />
              Endpointlar
            </SectionHeading>

            <EndpointCard>
              <EndpointHeader>
                <MethodBadge $method="POST">POST</MethodBadge>
                <EndpointUrl>/api/v1/sms/send</EndpointUrl>
                <PermissionTag color="purple">send_sms</PermissionTag>
              </EndpointHeader>
              <EndpointDesc>
                Bitta telefon raqamga SMS xabar yuborish. Xabar navbatga qo'yiladi va qurilma
                orqali jo'natiladi.
              </EndpointDesc>

              <SubLabel>So'rov headerlari</SubLabel>
              <FieldTable>
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Qiymat</th>
                    <th>Tavsif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <FieldName>x-api-key</FieldName>
                    </td>
                    <td>string</td>
                    <td>API token</td>
                  </tr>
                  <tr>
                    <td>
                      <FieldName>Content-Type</FieldName>
                    </td>
                    <td>application/json</td>
                    <td>So'rov formati</td>
                  </tr>
                </tbody>
              </FieldTable>

              <SubLabel style={{ marginTop: 16 }}>So'rov tanasi (Body)</SubLabel>
              <FieldTable>
                <thead>
                  <tr>
                    <th>Maydon</th>
                    <th>Tur</th>
                    <th>Tavsif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <FieldName>to</FieldName>
                    </td>
                    <td>string</td>
                    <td>Telefon raqam (+998XXXXXXXXX formatida)</td>
                  </tr>
                  <tr>
                    <td>
                      <FieldName>message</FieldName>
                    </td>
                    <td>string</td>
                    <td>SMS xabar matni</td>
                  </tr>
                </tbody>
              </FieldTable>

              <SubLabel style={{ marginTop: 16 }}>So'rov namunasi</SubLabel>
              <CopyableCode
                lang="JSON"
                code={`{\n  "to": "+998901234567",\n  "message": "Xabar matni"\n}`}
              >
                {'{\n  '}
                {S.key('"to"')}: {S.str('"+998901234567"')},{'\n  '}
                {S.key('"message"')}: {S.str('"Xabar matni"')}
                {'\n}'}
              </CopyableCode>

              <SubLabel>Javob namunasi</SubLabel>
              <CopyableCode
                lang="JSON"
                code={`{\n  "taskId": "abc123-def456",\n  "status": "QUEUED"\n}`}
              >
                {'{\n  '}
                {S.key('"taskId"')}: {S.str('"abc123-def456"')},{'\n  '}
                {S.key('"status"')}: {S.str('"QUEUED"')}
                {'\n}'}
              </CopyableCode>
            </EndpointCard>

            {/* ── POST /call/send ── */}
            <EndpointCard id="send-call">
              <EndpointHeader>
                <MethodBadge $method="POST">POST</MethodBadge>
                <EndpointUrl>/api/v1/call/send</EndpointUrl>
                <PermissionTag color="purple">send_call</PermissionTag>
              </EndpointHeader>
              <EndpointDesc>
                Ovozli xabar bilan avtomatik qo'ng'iroq yuborish. Avval ovozli xabarni dashboard
                orqali yuklang.
              </EndpointDesc>

              <SubLabel>So'rov tanasi (Body)</SubLabel>
              <FieldTable>
                <thead>
                  <tr>
                    <th>Maydon</th>
                    <th>Tur</th>
                    <th>Tavsif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <FieldName>to</FieldName>
                    </td>
                    <td>string</td>
                    <td>Telefon raqam (+998XXXXXXXXX formatida)</td>
                  </tr>
                  <tr>
                    <td>
                      <FieldName>voiceMessageId</FieldName>
                    </td>
                    <td>string</td>
                    <td>Ovozli xabar ID raqami</td>
                  </tr>
                </tbody>
              </FieldTable>

              <SubLabel style={{ marginTop: 16 }}>So'rov namunasi</SubLabel>
              <CopyableCode
                lang="JSON"
                code={`{\n  "to": "+998901234567",\n  "voiceMessageId": "vm_abc123"\n}`}
              >
                {'{\n  '}
                {S.key('"to"')}: {S.str('"+998901234567"')},{'\n  '}
                {S.key('"voiceMessageId"')}: {S.str('"vm_abc123"')}
                {'\n}'}
              </CopyableCode>

              <SubLabel>Javob namunasi</SubLabel>
              <CopyableCode
                lang="JSON"
                code={`{\n  "taskId": "call_xyz789",\n  "status": "QUEUED"\n}`}
              >
                {'{\n  '}
                {S.key('"taskId"')}: {S.str('"call_xyz789"')},{'\n  '}
                {S.key('"status"')}: {S.str('"QUEUED"')}
                {'\n}'}
              </CopyableCode>
            </EndpointCard>

            {/* ── GET /sms/status/:taskId ── */}
            <EndpointCard id="check-status">
              <EndpointHeader>
                <MethodBadge $method="GET">GET</MethodBadge>
                <EndpointUrl>/api/v1/sms/status/:taskId</EndpointUrl>
                <PermissionTag color="purple">check_status</PermissionTag>
              </EndpointHeader>
              <EndpointDesc>
                Yuborilgan SMS yoki qo'ng'iroqning hozirgi holatini tekshirish.
              </EndpointDesc>

              <SubLabel>URL parametrlari</SubLabel>
              <FieldTable>
                <thead>
                  <tr>
                    <th>Parametr</th>
                    <th>Tur</th>
                    <th>Tavsif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <FieldName>taskId</FieldName>
                    </td>
                    <td>string</td>
                    <td>Yuborish jarayonining ID raqami</td>
                  </tr>
                </tbody>
              </FieldTable>

              <SubLabel style={{ marginTop: 16 }}>Javob namunasi</SubLabel>
              <CopyableCode
                lang="JSON"
                code={`{\n  "taskId": "abc123-def456",\n  "status": "DELIVERED",\n  "phoneNumber": "+998901234567",\n  "sentAt": "2026-03-23T10:30:00Z",\n  "deliveredAt": "2026-03-23T10:30:05Z",\n  "errorMessage": null\n}`}
              >
                {'{\n  '}
                {S.key('"taskId"')}: {S.str('"abc123-def456"')},{'\n  '}
                {S.key('"status"')}: {S.str('"DELIVERED"')},{'\n  '}
                {S.key('"phoneNumber"')}: {S.str('"+998901234567"')},{'\n  '}
                {S.key('"sentAt"')}: {S.str('"2026-03-23T10:30:00Z"')},{'\n  '}
                {S.key('"deliveredAt"')}: {S.str('"2026-03-23T10:30:05Z"')},{'\n  '}
                {S.key('"errorMessage"')}: {S.kw('null')}
                {'\n}'}
              </CopyableCode>
            </EndpointCard>

            {/* ── GET /balance ── */}
            <EndpointCard id="balance">
              <EndpointHeader>
                <MethodBadge $method="GET">GET</MethodBadge>
                <EndpointUrl>/api/v1/balance</EndpointUrl>
                <PermissionTag color="purple">check_balance</PermissionTag>
              </EndpointHeader>
              <EndpointDesc>
                Joriy balans, kunlik limitlar va qurilmalar sonini ko'rish.
              </EndpointDesc>

              <SubLabel>Javob namunasi</SubLabel>
              <CopyableCode
                lang="JSON"
                code={`{\n  "plan": "Pro",\n  "smsToday": 1250,\n  "smsLimit": 10000,\n  "callsToday": 45,\n  "callsLimit": 500,\n  "devicesCount": 3,\n  "devicesLimit": 10\n}`}
              >
                {'{\n  '}
                {S.key('"plan"')}: {S.str('"Pro"')},{'\n  '}
                {S.key('"smsToday"')}: {S.num('1250')},{'\n  '}
                {S.key('"smsLimit"')}: {S.num('10000')},{'\n  '}
                {S.key('"callsToday"')}: {S.num('45')},{'\n  '}
                {S.key('"callsLimit"')}: {S.num('500')},{'\n  '}
                {S.key('"devicesCount"')}: {S.num('3')},{'\n  '}
                {S.key('"devicesLimit"')}: {S.num('10')}
                {'\n}'}
              </CopyableCode>

              <SubLabel>Javob maydonlari</SubLabel>
              <FieldTable>
                <thead>
                  <tr>
                    <th>Maydon</th>
                    <th>Tur</th>
                    <th>Tavsif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><FieldName>plan</FieldName></td>
                    <td>string</td>
                    <td>Joriy obuna rejasi nomi</td>
                  </tr>
                  <tr>
                    <td><FieldName>smsToday</FieldName></td>
                    <td>number</td>
                    <td>Bugun yuborilgan SMS soni</td>
                  </tr>
                  <tr>
                    <td><FieldName>smsLimit</FieldName></td>
                    <td>number</td>
                    <td>Kunlik SMS limiti</td>
                  </tr>
                  <tr>
                    <td><FieldName>callsToday</FieldName></td>
                    <td>number</td>
                    <td>Bugun qilingan qo'ng'iroqlar soni</td>
                  </tr>
                  <tr>
                    <td><FieldName>callsLimit</FieldName></td>
                    <td>number</td>
                    <td>Kunlik qo'ng'iroq limiti</td>
                  </tr>
                  <tr>
                    <td><FieldName>devicesCount</FieldName></td>
                    <td>number</td>
                    <td>Ulangan qurilmalar soni</td>
                  </tr>
                  <tr>
                    <td><FieldName>devicesLimit</FieldName></td>
                    <td>number</td>
                    <td>Qurilmalar limiti</td>
                  </tr>
                </tbody>
              </FieldTable>
            </EndpointCard>
          </Section>

          {/* ── Code Examples ── */}
          <Section id="examples">
            <SectionHeading>
              <CodeOutlined style={{ color: colors.primary }} />
              Kod misollari
            </SectionHeading>
            <SectionDesc>
              Turli dasturlash tillarida SMS yuborish namunalari. API tokeningizni{' '}
              <code>YOUR_API_KEY</code> o'rniga qo'ying.
            </SectionDesc>

            <Tabs
              defaultActiveKey="curl"
              items={[
                {
                  key: 'curl',
                  label: 'cURL',
                  children: (
                    <CopyableCode lang="bash" code={curlExample}>
                      {S.fn('curl')} -X POST {S.str('"http://185.207.251.184:3008/api/v1/sms/send"')} \{'\n'}
                      {'  '}-H {S.str('"Content-Type: application/json"')} \{'\n'}
                      {'  '}-H {S.str('"x-api-key: YOUR_API_KEY"')} \{'\n'}
                      {'  '}-d {S.str("'{")}
                      {'\n    '}{S.key('"to"')}: {S.str('"+998901234567"')},
                      {'\n    '}{S.key('"message"')}: {S.str('"Salom! Bu test xabar."')}
                      {'\n  '}{S.str("}'")}{'\n'}
                    </CopyableCode>
                  ),
                },
                {
                  key: 'js',
                  label: 'JavaScript',
                  children: (
                    <CopyableCode lang="javascript" code={jsExample}>
                      {S.kw('import')} axios {S.kw('from')} {S.str("'axios'")};\n{'\n'}
                      {S.kw('const')} API_KEY = {S.str("'YOUR_API_KEY'")};\n
                      {S.kw('const')} BASE_URL = {S.str("'http://185.207.251.184:3008/api/v1'")};\n{'\n'}
                      {S.kw('const')} response = {S.kw('await')} axios.{S.fn('post')}(\n
                      {'  '}`${'{'}{S.str('BASE_URL')}{'}'}'/sms/send`,\n
                      {'  '}{'{\n'}
                      {'    '}to: {S.str("'+998901234567'")},\n
                      {'    '}message: {S.str("'Salom! Bu test xabar.'")},\n
                      {'  '}{'}\n'}
                      {'  '}{'{\n'}
                      {'    '}headers: {'{\n'}
                      {'      '}{S.str("'x-api-key'")}: API_KEY,\n
                      {'      '}{S.str("'Content-Type'")}: {S.str("'application/json'")},\n
                      {'    '}{'}\n'}
                      {'  '}{'}\n'}
                      );\n{'\n'}
                      console.{S.fn('log')}(response.data);
                    </CopyableCode>
                  ),
                },
                {
                  key: 'python',
                  label: 'Python',
                  children: (
                    <CopyableCode lang="python" code={pythonExample}>
                      {S.kw('import')} requests{'\n\n'}
                      API_KEY = {S.str('"YOUR_API_KEY"')}{'\n'}
                      BASE_URL = {S.str('"http://185.207.251.184:3008/api/v1"')}{'\n\n'}
                      response = requests.{S.fn('post')}({'\n'}
                      {'    '}f{S.str('"{BASE_URL}/sms/send"')},{'\n'}
                      {'    '}json={'{\n'}
                      {'        '}{S.str('"to"')}: {S.str('"+998901234567"')},{'\n'}
                      {'        '}{S.str('"message"')}: {S.str('"Salom! Bu test xabar."')}{'\n'}
                      {'    '}{'}'},{'\n'}
                      {'    '}headers={'{\n'}
                      {'        '}{S.str('"x-api-key"')}: API_KEY,{'\n'}
                      {'        '}{S.str('"Content-Type"')}: {S.str('"application/json"')}{'\n'}
                      {'    '}{'}'}{'\n'}
                      ){'\n\n'}
                      {S.fn('print')}(response.{S.fn('json')}())
                    </CopyableCode>
                  ),
                },
                {
                  key: 'php',
                  label: 'PHP',
                  children: (
                    <CopyableCode lang="php" code={phpExample}>
                      {S.kw('<?php')}{'\n\n'}
                      $apiKey = {S.str('"YOUR_API_KEY"')};{'\n'}
                      $baseUrl = {S.str('"http://185.207.251.184:3008/api/v1"')};{'\n\n'}
                      $ch = {S.fn('curl_init')}({S.str('"$baseUrl/sms/send"')});{'\n\n'}
                      {S.fn('curl_setopt_array')}($ch, [{'\n'}
                      {'    '}CURLOPT_RETURNTRANSFER {'=> '}{S.kw('true')},{'\n'}
                      {'    '}CURLOPT_POST {'=> '}{S.kw('true')},{'\n'}
                      {'    '}CURLOPT_HTTPHEADER {'=> '}[{'\n'}
                      {'        '}{S.str('"Content-Type: application/json"')},{'\n'}
                      {'        '}{S.str('"x-api-key: $apiKey"')},{'\n'}
                      {'    '}],{'\n'}
                      {'    '}CURLOPT_POSTFIELDS {'=> '}{S.fn('json_encode')}([{'\n'}
                      {'        '}{S.str('"to"')} {'=> '}{S.str('"+998901234567"')},{'\n'}
                      {'        '}{S.str('"message"')} {'=> '}{S.str('"Salom! Bu test xabar."')},{'\n'}
                      {'    '}]),{'\n'}
                      ]);{'\n\n'}
                      $response = {S.fn('curl_exec')}($ch);{'\n'}
                      {S.fn('curl_close')}($ch);{'\n\n'}
                      {S.kw('echo')} $response;
                    </CopyableCode>
                  ),
                },
              ]}
            />
          </Section>

          {/* ── Rate Limits ── */}
          <Section id="rate-limits">
            <SectionHeading>
              <ThunderboltOutlined style={{ color: colors.warning }} />
              So'rovlar limiti
            </SectionHeading>
            <SectionDesc>
              API haddan tashqari yuklanishining oldini olish uchun har bir token uchun so'rovlar
              soni cheklangan.
            </SectionDesc>

            <EndpointCard>
              <FieldTable>
                <thead>
                  <tr>
                    <th>Limit</th>
                    <th>Qiymat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Har bir token uchun</td>
                    <td>
                      <strong>60 so'rov / daqiqa</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>Limit oshganda</td>
                    <td>
                      <Tag color="orange">HTTP 429 Too Many Requests</Tag>
                    </td>
                  </tr>
                </tbody>
              </FieldTable>
            </EndpointCard>

            <InfoBox>
              <ThunderboltOutlined style={{ color: colors.primary, fontSize: 18, marginTop: 2 }} />
              <div>
                Limit oshganda <code>Retry-After</code> header'i qaytariladi. Shu vaqt o'tgandan
                keyin qayta so'rov yuborishingiz mumkin.
              </div>
            </InfoBox>
          </Section>

          {/* ── Status Codes ── */}
          <Section id="status-codes">
            <SectionHeading>Status kodlari</SectionHeading>
            <SectionDesc>API javoblarida ishlatiladigan HTTP status kodlari.</SectionDesc>

            <EndpointCard>
              <StatusRow>
                <StatusCode $color="#10b981">200</StatusCode>
                <Text strong>OK</Text>
                <Text type="secondary">— So'rov muvaffaqiyatli bajarildi</Text>
              </StatusRow>
              <StatusRow>
                <StatusCode $color="#10b981">201</StatusCode>
                <Text strong>Created</Text>
                <Text type="secondary">— Yangi resurs yaratildi</Text>
              </StatusRow>
              <StatusRow>
                <StatusCode $color="#f59e0b">400</StatusCode>
                <Text strong>Bad Request</Text>
                <Text type="secondary">— So'rov noto'g'ri (validatsiya xatosi)</Text>
              </StatusRow>
              <StatusRow>
                <StatusCode $color="#ef4444">401</StatusCode>
                <Text strong>Unauthorized</Text>
                <Text type="secondary">— Token noto'g'ri yoki ko'rsatilmagan</Text>
              </StatusRow>
              <StatusRow>
                <StatusCode $color="#ef4444">403</StatusCode>
                <Text strong>Forbidden</Text>
                <Text type="secondary">— Tokenga kerakli ruxsat berilmagan</Text>
              </StatusRow>
              <StatusRow>
                <StatusCode $color="#f59e0b">429</StatusCode>
                <Text strong>Too Many Requests</Text>
                <Text type="secondary">— So'rovlar limiti oshdi</Text>
              </StatusRow>
              <StatusRow>
                <StatusCode $color="#ef4444">500</StatusCode>
                <Text strong>Server Error</Text>
                <Text type="secondary">— Serverda ichki xatolik</Text>
              </StatusRow>
            </EndpointCard>
          </Section>

          {/* ── Errors ── */}
          <Section id="errors">
            <SectionHeading>Xatolik formati</SectionHeading>
            <SectionDesc>
              Xatolik yuz berganda API quyidagi formatda javob qaytaradi:
            </SectionDesc>

            <CopyableCode
              lang="JSON"
              code={`{\n  "statusCode": 400,\n  "message": "Telefon raqam noto'g'ri formatda",\n  "error": "Bad Request"\n}`}
            >
              {'{\n  '}
              {S.key('"statusCode"')}: {S.num('400')},{'\n  '}
              {S.key('"message"')}: {S.str('"Telefon raqam noto\'g\'ri formatda"')},{'\n  '}
              {S.key('"error"')}: {S.str('"Bad Request"')}
              {'\n}'}
            </CopyableCode>

            <FieldTable>
              <thead>
                <tr>
                  <th>Maydon</th>
                  <th>Tur</th>
                  <th>Tavsif</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <FieldName>statusCode</FieldName>
                  </td>
                  <td>number</td>
                  <td>HTTP status kodi</td>
                </tr>
                <tr>
                  <td>
                    <FieldName>message</FieldName>
                  </td>
                  <td>string</td>
                  <td>Xatolik haqida batafsil xabar</td>
                </tr>
                <tr>
                  <td>
                    <FieldName>error</FieldName>
                  </td>
                  <td>string</td>
                  <td>Xatolik turi nomi</td>
                </tr>
              </tbody>
            </FieldTable>
          </Section>
        </MainContent>
      </ContentLayout>
    </PageWrapper>
  );
}

export default ApiDocsPage;
