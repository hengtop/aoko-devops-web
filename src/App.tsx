import { ConfigProvider } from "antd";
import { AppRouter } from "./router/index";
import { AppThemeProvider, getAntdThemeConfig, useAppTheme } from "./theme";

function ThemedApp() {
  const { mode } = useAppTheme();

  return (
    <ConfigProvider theme={getAntdThemeConfig(mode)}>
      <AppRouter />
    </ConfigProvider>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <ThemedApp />
    </AppThemeProvider>
  );
}

export default App;
