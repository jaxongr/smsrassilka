import { Card } from 'antd';
import styled from 'styled-components';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { colors } from '@/styles/theme';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color?: string;
}

const StyledCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.cardBorder};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(107, 70, 193, 0.08);
  }

  .ant-card-body {
    padding: 20px;
  }
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const IconBox = styled.div<{ $color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${(p) => p.$color}14;
  color: ${(p) => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const Change = styled.div<{ $positive: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${(p) => (p.$positive ? colors.success : colors.error)};
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Value = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${colors.textPrimary};
  line-height: 1.2;
`;

const Label = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-top: 4px;
`;

export function StatsCard({
  icon,
  title,
  value,
  change,
  changeLabel,
  color = colors.primary,
}: StatsCardProps) {
  return (
    <StyledCard>
      <Top>
        <IconBox $color={color}>{icon}</IconBox>
        {change !== undefined && (
          <Change $positive={change >= 0}>
            {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(change)}%
          </Change>
        )}
      </Top>
      <Value>{value}</Value>
      <Label>{changeLabel || title}</Label>
    </StyledCard>
  );
}
