import { ConfigProvider, theme } from "antd";
import { AppRouter } from "./router/index";

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#2d7bff",
          colorInfo: "#61e7ff",
          colorBgBase: "#0b1220",
          colorBgContainer: "#0f172a",
          colorText: "#e7eefb",
          colorTextSecondary: "rgba(231, 238, 251, 0.7)",
          borderRadius: 12,
        },
        components: {
          Button: {
            borderRadius: 10,
          },
          Card: {
            borderRadiusLG: 16,
          },
          Tabs: {
            titleFontSize: 13,
            itemHoverColor: "#e7f8ff",
            itemSelectedColor: "#e7f8ff",
            inkBarColor: "#61e7ff",
          },
        },
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
}

export default App;
