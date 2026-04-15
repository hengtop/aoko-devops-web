import { Outlet } from "react-router-dom";
import AppTopBar from "@components/AppTopBar";

export default function ConsoleLayout() {
  return (
    <>
      <AppTopBar />
      <Outlet />
    </>
  );
}
