import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  SendOutlined,
  PhoneOutlined,
  ApiOutlined,
  MobileOutlined,
  CheckOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { colors } from '@/styles/theme';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${colors.bgWhite};
`;

const Nav = styled.nav`
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
    padding: 16px 20px;
  }
`;

const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: ${colors.textPrimary};

  span {
    color: ${colors.primary};
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeroSection = styled.section`
  text-align: center;
  padding: 80px 48px;
  background: linear-gradient(180deg, ${colors.primaryBg} 0%, ${colors.bgWhite} 100%);

  @media (max-width: 768px) {
    padding: 48px 20px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: 800;
  color: ${colors.textPrimary};
  margin: 0 0 16px;
  line-height: 1.2;

  span {
    color: ${colors.primary};
  }

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 20px;
  color: ${colors.textSecondary};
  margin: 0 0 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const HeroButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const FeaturesSection = styled.section`
  padding: 80px 48px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 48px 20px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: ${colors.textPrimary};
  text-align: center;
  margin: 0 0 12px;
`;

const SectionSubtitle = styled.p`
  font-size: 16px;
  color: ${colors.textSecondary};
  text-align: center;
  margin: 0 0 48px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
`;

const FeatureCard = styled.div`
  padding: 32px;
  border-radius: 16px;
  border: 1px solid ${colors.cardBorder};
  background: ${colors.bgWhite};
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.div<{ $bg: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${(p) => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 22px;
`;

const FeatureTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 8px;
`;

const FeatureDesc = styled.p`
  font-size: 14px;
  color: ${colors.textSecondary};
  margin: 0;
  line-height: 1.6;
`;

const PricingSection = styled.section`
  padding: 80px 48px;
  background: ${colors.bgBody};

  @media (max-width: 768px) {
    padding: 48px 20px;
  }
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
`;

const PlanCard = styled.div<{ $featured?: boolean }>`
  padding: 32px;
  border-radius: 16px;
  border: 2px solid ${(p) => (p.$featured ? colors.primary : colors.cardBorder)};
  background: ${colors.bgWhite};
  position: relative;
  display: flex;
  flex-direction: column;

  ${(p) =>
    p.$featured &&
    `
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.12);
    transform: scale(1.02);
  `}
`;

const PlanBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: ${colors.primary};
  color: #fff;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const PlanName = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 8px;
`;

const PlanPrice = styled.div`
  margin-bottom: 24px;
`;

const PriceAmount = styled.span`
  font-size: 36px;
  font-weight: 800;
  color: ${colors.textPrimary};
`;

const PricePeriod = styled.span`
  font-size: 14px;
  color: ${colors.textSecondary};
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  flex: 1;
`;

const PlanFeature = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  color: ${colors.textSecondary};
`;

const FooterSection = styled.footer`
  padding: 32px 48px;
  background: ${colors.siderBg};
  text-align: center;
  color: ${colors.siderText};
  font-size: 14px;

  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const features = [
  {
    icon: <SendOutlined style={{ color: colors.primary }} />,
    bg: colors.primaryBg,
    title: 'SMS rassilka',
    desc: "Telefoningiz orqali minglab SMS xabarlarni avtomatik jo'nating. Guruhli va individual jo'natish.",
  },
  {
    icon: <PhoneOutlined style={{ color: '#10B981' }} />,
    bg: '#ECFDF5',
    title: "Avtoqo'ng'iroq",
    desc: "Ovozli xabarlar yordamida avtomatik qo'ng'iroq qiling. Tayyor audio fayllarni yuklang.",
  },
  {
    icon: <ApiOutlined style={{ color: '#8B5CF6' }} />,
    bg: '#F5F3FF',
    title: 'API integratsiya',
    desc: "REST API orqali o'z tizimingizdan SMS jo'nating. Oddiy va tezkor integratsiya.",
  },
  {
    icon: <MobileOutlined style={{ color: '#F59E0B' }} />,
    bg: '#FFFBEB',
    title: "Ko'p qurilma",
    desc: "Bir nechta telefonlarni ulang va ularni markaziy boshqaruv panelidan nazorat qiling.",
  },
];

const plans = [
  {
    name: 'Bepul',
    price: 'Bepul',
    period: '',
    features: ['1 ta qurilma', "100 ta SMS/kun", 'API kirish', "Asosiy hisobotlar"],
    featured: false,
  },
  {
    name: 'Pro',
    price: "99,000 so'm",
    period: '/oy',
    features: ['10 ta qurilma', "10,000 ta SMS/kun", "API to'liq kirish", "Kengaytirilgan hisobotlar", "Ustuvor qo'llab-quvvatlash"],
    featured: true,
  },
  {
    name: 'Biznes',
    price: "299,000 so'm",
    period: '/oy',
    features: ['Cheksiz qurilma', "Cheksiz SMS", "API to'liq kirish", "Batafsil hisobotlar", "24/7 qo'llab-quvvatlash", "Maxsus integratsiya"],
    featured: false,
  },
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <Nav>
        <NavBrand>
          <SendOutlined style={{ color: colors.primary, fontSize: 24 }} />
          SMS <span>Gateway</span>
        </NavBrand>
        <NavActions>
          <Button type="text" onClick={() => navigate('/docs')}>
            API Dokumentatsiya
          </Button>
          <Button type="text" onClick={() => navigate('/login')}>
            Kirish
          </Button>
          <Button type="primary" onClick={() => navigate('/register')}>
            Bepul boshlash
          </Button>
        </NavActions>
      </Nav>

      <HeroSection>
        <HeroTitle>
          <span>SMS Gateway</span> — Xabar
          <br />
          jo'natish tizimi
        </HeroTitle>
        <HeroSubtitle>
          Telefoningizdan SMS va qo'ng'iroq rassilka tizimi. Minglab xabarlarni avtomatik jo'nating,
          natijalarni real vaqtda kuzating.
        </HeroSubtitle>
        <HeroButtons>
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate('/register')}
            style={{ height: 48, paddingInline: 32, fontWeight: 600, borderRadius: 10 }}
          >
            Bepul boshlash
          </Button>
          <Button
            size="large"
            onClick={() => navigate('/login')}
            style={{ height: 48, paddingInline: 32, fontWeight: 600, borderRadius: 10 }}
          >
            Kirish
          </Button>
        </HeroButtons>
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>Imkoniyatlar</SectionTitle>
        <SectionSubtitle>Sizning biznesingiz uchun barcha zarur vositalar</SectionSubtitle>
        <FeaturesGrid>
          {features.map((f) => (
            <FeatureCard key={f.title}>
              <FeatureIcon $bg={f.bg}>{f.icon}</FeatureIcon>
              <FeatureTitle>{f.title}</FeatureTitle>
              <FeatureDesc>{f.desc}</FeatureDesc>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </FeaturesSection>

      <PricingSection>
        <SectionTitle>Tariflar</SectionTitle>
        <SectionSubtitle>Har qanday hajmdagi biznes uchun moslashuvchan rejalar</SectionSubtitle>
        <PricingGrid>
          {plans.map((plan) => (
            <PlanCard key={plan.name} $featured={plan.featured}>
              {plan.featured && <PlanBadge>Mashhur</PlanBadge>}
              <PlanName>{plan.name}</PlanName>
              <PlanPrice>
                <PriceAmount>{plan.price}</PriceAmount>
                {plan.period && <PricePeriod>{plan.period}</PricePeriod>}
              </PlanPrice>
              <PlanFeatures>
                {plan.features.map((f) => (
                  <PlanFeature key={f}>
                    <CheckOutlined style={{ color: colors.success, fontSize: 14 }} />
                    {f}
                  </PlanFeature>
                ))}
              </PlanFeatures>
              <Button
                type={plan.featured ? 'primary' : 'default'}
                size="large"
                block
                onClick={() => navigate('/register')}
                style={{ borderRadius: 10, height: 44, fontWeight: 600 }}
              >
                {plan.price === 'Bepul' ? 'Bepul boshlash' : 'Tanlash'}
              </Button>
            </PlanCard>
          ))}
        </PricingGrid>
      </PricingSection>

      <FooterSection>
        &copy; {new Date().getFullYear()} SMS Gateway. Barcha huquqlar himoyalangan.
      </FooterSection>
    </PageWrapper>
  );
}

export default LandingPage;
