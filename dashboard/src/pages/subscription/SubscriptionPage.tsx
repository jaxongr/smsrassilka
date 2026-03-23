import { Card, Progress, Tag, Button, Row, Col, Typography, Spin, message } from 'antd';
import { CrownOutlined, CheckOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/api/subscriptions.api';
import { PageHeader } from '@/components/common/PageHeader';
import styled from 'styled-components';
import { colors } from '@/styles/theme';
import type { PlanInfo } from '@/types/subscription.types';

const CurrentPlanCard = styled(Card)`
  border-radius: 12px;
  margin-bottom: 32px;
  border: 2px solid ${colors.primary};
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
`;

const PlanCard = styled(Card)<{ $active?: boolean; $featured?: boolean }>`
  border-radius: 12px;
  border: 2px solid ${(p) => (p.$active ? colors.success : p.$featured ? colors.primary : colors.cardBorder)};
  text-align: center;
  position: relative;

  ${(p) =>
    p.$featured &&
    `
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.1);
  `}
`;

const PlanName = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 4px;
`;

const PlanPrice = styled.div`
  margin: 16px 0 24px;
`;

const PriceAmount = styled.span`
  font-size: 32px;
  font-weight: 800;
  color: ${colors.textPrimary};
`;

const PricePeriod = styled.span`
  font-size: 14px;
  color: ${colors.textSecondary};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  text-align: left;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
  color: ${colors.textSecondary};
`;

const DEFAULT_PLANS: PlanInfo[] = [
  {
    name: 'Bepul',
    plan: 'FREE',
    maxDevices: 1,
    maxSmsPerDay: 100,
    maxCallsPerDay: 10,
    price: 0,
    features: ['1 ta qurilma', '100 ta SMS/kun', '10 ta qo\'ng\'iroq/kun', 'Asosiy hisobotlar'],
  },
  {
    name: 'Pro',
    plan: 'PRO',
    maxDevices: 10,
    maxSmsPerDay: 10000,
    maxCallsPerDay: 1000,
    price: 99000,
    features: ['10 ta qurilma', '10,000 ta SMS/kun', '1,000 ta qo\'ng\'iroq/kun', 'API to\'liq kirish', 'Kengaytirilgan hisobotlar'],
  },
  {
    name: 'Biznes',
    plan: 'BUSINESS',
    maxDevices: -1,
    maxSmsPerDay: -1,
    maxCallsPerDay: -1,
    price: 299000,
    features: ['Cheksiz qurilma', 'Cheksiz SMS', 'Cheksiz qo\'ng\'iroq', 'API to\'liq kirish', '24/7 qo\'llab-quvvatlash', 'Maxsus integratsiya'],
  },
];

function formatPrice(price: number): string {
  if (price === 0) return 'Bepul';
  return price.toLocaleString('uz-UZ') + " so'm";
}

function SubscriptionPage() {
  const queryClient = useQueryClient();

  const { data: currentData, isLoading: loadingCurrent } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: () => subscriptionsApi.getCurrentPlan(),
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans(),
  });

  const upgradeMutation = useMutation({
    mutationFn: (plan: string) => subscriptionsApi.upgradePlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
      message.info("To'lov tez kunda qo'shiladi");
    },
    onError: () => {
      message.error('Xatolik yuz berdi');
    },
  });

  const current = currentData?.data?.data ?? currentData?.data ?? null;
  const plans: PlanInfo[] = plansData?.data?.data ?? plansData?.data ?? DEFAULT_PLANS;

  if (loadingCurrent) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentPlan = current?.plan || 'FREE';
  const smsUsed = 0; // Will come from usage API
  const maxSms = current?.maxSmsPerDay || 100;
  const devicesUsed = 0;
  const maxDevices = current?.maxDevices || 1;

  return (
    <div>
      <PageHeader title="Obuna rejasi" subtitle="Obuna rejangizni boshqaring" />

      <CurrentPlanCard>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CrownOutlined style={{ fontSize: 28, color: colors.primary }} />
              <div>
                <Typography.Text type="secondary">Hozirgi reja</Typography.Text>
                <div>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {plans.find((p) => p.plan === currentPlan)?.name || currentPlan}
                  </Typography.Title>
                </div>
              </div>
              <Tag color={currentPlan === 'FREE' ? 'default' : 'blue'} style={{ marginLeft: 8 }}>
                {current?.status || 'ACTIVE'}
              </Tag>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text type="secondary">SMS (bugun)</Typography.Text>
            <Progress
              percent={maxSms > 0 ? Math.round((smsUsed / maxSms) * 100) : 0}
              format={() => `${smsUsed} / ${maxSms < 0 ? 'Cheksiz' : maxSms}`}
              strokeColor={colors.primary}
            />
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text type="secondary">Qurilmalar</Typography.Text>
            <Progress
              percent={maxDevices > 0 ? Math.round((devicesUsed / maxDevices) * 100) : 0}
              format={() => `${devicesUsed} / ${maxDevices < 0 ? 'Cheksiz' : maxDevices}`}
              strokeColor={colors.accent}
            />
          </Col>
        </Row>
      </CurrentPlanCard>

      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        Barcha rejalar
      </Typography.Title>

      <PlanGrid>
        {plans.map((plan) => {
          const isActive = plan.plan === currentPlan;
          const isFeatured = plan.plan === 'PRO';

          return (
            <PlanCard key={plan.plan} $active={isActive} $featured={isFeatured}>
              {isActive && (
                <Tag
                  color="success"
                  style={{ position: 'absolute', top: 16, right: 16 }}
                >
                  Hozirgi
                </Tag>
              )}
              {isFeatured && !isActive && (
                <Tag
                  color="blue"
                  style={{ position: 'absolute', top: 16, right: 16 }}
                >
                  Mashhur
                </Tag>
              )}
              <PlanName>{plan.name}</PlanName>
              <PlanPrice>
                <PriceAmount>{formatPrice(plan.price)}</PriceAmount>
                {plan.price > 0 && <PricePeriod>/oy</PricePeriod>}
              </PlanPrice>
              <FeatureList>
                {plan.features.map((f) => (
                  <FeatureItem key={f}>
                    <CheckOutlined style={{ color: colors.success, fontSize: 13 }} />
                    {f}
                  </FeatureItem>
                ))}
              </FeatureList>
              {isActive ? (
                <Button disabled block size="large" style={{ borderRadius: 10 }}>
                  Hozirgi reja
                </Button>
              ) : (
                <Button
                  type={isFeatured ? 'primary' : 'default'}
                  block
                  size="large"
                  style={{ borderRadius: 10, fontWeight: 600 }}
                  loading={upgradeMutation.isPending}
                  onClick={() => upgradeMutation.mutate(plan.plan)}
                >
                  Tanlash
                </Button>
              )}
            </PlanCard>
          );
        })}
      </PlanGrid>
    </div>
  );
}

export default SubscriptionPage;
