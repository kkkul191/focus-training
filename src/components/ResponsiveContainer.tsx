import type { ReactElement } from "react";
import { ResponsiveContainer as RechartsResponsiveContainer } from "recharts";

export function ResponsiveContainer({ children, width, height }: { children: ReactElement; width: number | `${number}%`; height: number | `${number}%` }) {
  return <RechartsResponsiveContainer width={width} height={height} initialDimension={{ width: 500, height: 180 }}>{children}</RechartsResponsiveContainer>;
}
