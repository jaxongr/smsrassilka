import type { ThemeConfig } from 'antd';

export const colors = {
  primary: '#6B46C1',
  primaryLight: '#8B6DD4',
  primaryDark: '#553AA0',
  primaryBg: '#F3EEFB',
  accent: '#2DD4A8',
  success: '#16A34A',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textHint: '#9CA3AF',
  bgBody: '#FAF9FE',
  bgWhite: '#FFFFFF',
  cardBorder: '#F0EEF5',
  siderBg: '#1A1A2E',
  siderText: '#A0A0B8',
  siderActive: '#6B46C1',
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
      darkItemHoverBg: 'rgba(107, 70, 193, 0.2)',
    },
  },
};
