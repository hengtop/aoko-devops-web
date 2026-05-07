import { Tag } from "antd";
import type { PresetColorType, PresetStatusColorType } from "antd/es/_util/colors";

type StatusBadgeProps = {
  label: string;
  color?: PresetColorType | PresetStatusColorType | string;
};

export default function StatusBadge({ label, color = "default" }: StatusBadgeProps) {
  return <Tag color={color}>{label}</Tag>;
}
