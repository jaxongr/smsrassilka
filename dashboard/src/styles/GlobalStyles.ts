import { createGlobalStyle } from 'styled-components';
import { colors } from './theme';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: ${colors.bgBody};
    color: ${colors.textPrimary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100vh;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${colors.cardBorder};
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${colors.textHint};
  }

  .ant-layout {
    min-height: 100vh;
  }

  .ant-table-wrapper {
    .ant-table {
      border-radius: 12px;
      overflow: hidden;
    }
  }

  .ant-card {
    border: 1px solid ${colors.cardBorder};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .ant-btn-primary {
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
  }
`;
