import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = resolve(process.cwd(), "config");
  const env = loadEnv(mode, envDir, "");
  const proxyTarget = env.VITE_PROXY_TARGET;

  return {
    envDir,
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: {
      proxy: {
        "/aoko-devops": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
