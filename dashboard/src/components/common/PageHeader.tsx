import styled from 'styled-components';
import { colors } from '@/styles/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const TextBlock = styled.div``;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0;
  line-height: 1.3;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${colors.textSecondary};
  margin: 4px 0 0 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Wrapper>
      <TextBlock>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </TextBlock>
      {actions && <Actions>{actions}</Actions>}
    </Wrapper>
  );
}
