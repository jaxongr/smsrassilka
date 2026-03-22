import { Tag } from 'antd';
import { CampaignStatus, TaskStatus } from '@/types/campaign.types';
import {
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from '@/utils/constants';

interface StatusBadgeProps {
  status: CampaignStatus | TaskStatus;
  type?: 'campaign' | 'task';
}

export function StatusBadge({ status, type = 'campaign' }: StatusBadgeProps) {
  const colorMap = type === 'campaign' ? CAMPAIGN_STATUS_COLORS : TASK_STATUS_COLORS;
  const labelMap = type === 'campaign' ? CAMPAIGN_STATUS_LABELS : TASK_STATUS_LABELS;

  const color = colorMap[status as keyof typeof colorMap] || '#9CA3AF';
  const label = labelMap[status as keyof typeof labelMap] || status;

  return (
    <Tag
      color={color}
      style={{
        borderRadius: 6,
        fontWeight: 500,
        fontSize: 12,
        padding: '2px 8px',
        border: 'none',
      }}
    >
      {label}
    </Tag>
  );
}
