import type { ThemeConfig } from 'antd';

export const colors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryBg: '#EFF6FF',
  accent: '#10B981',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textHint: '#9CA3AF',
  bgBody: '#F8FAFC',
  bgWhite: '#FFFFFF',
  cardBorder: '#E5E7EB',
  siderBg: '#0F172A',
  siderText: '#94A3B8',
  siderActive: '#2563EB',
  headerBg: '#FFFFFF',
  divider: '#E5E7EB',
};

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorError: colors.error,
    colorWarning: colors.warning,
    colorInfo: colors.info,
    colorBgBase: colors.bgWhite,
    colorBgLayout: colors.bgBody,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: 8,
    controlHeight: 40,
    fontSize: 14,
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 8,
      fontWeight: 500,
      primaryShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
    },
    Input: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      borderRadius: 12,
      headerBg: colors.primaryBg,
    },
    Menu: {
      darkItemBg: colors.siderBg,
      darkItemColor: colors.siderText,
      darkItemSelectedBg: colors.primary,
      darkItemSelectedColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(37, 99, 235, 0.15)',
    },
  },
};
