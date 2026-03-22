import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #FAF9FE;
    color: #1A1A2E;
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
    background: #D1D5DB;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
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
    border: 1px solid #F0EEF5;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .ant-btn-primary {
    box-shadow: 0 2px 4px rgba(107, 70, 193, 0.3);
  }
`;
