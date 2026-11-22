import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";

type NoticeTone = "info" | "success" | "warning" | "error";
const icons: Record<NoticeTone, string> = {
  info: "info", success: "check_circle", warning: "warning", error: "error_outline",
};

export function InlineNotice({ title, children, tone = "info", icon, style, className = "", role }: {
  title?: string;
  children?: ReactNode;
  tone?: NoticeTone;
  icon?: string;
  style?: CSSProperties;
  className?: string;
  role?: "note" | "status" | "alert";
}) {
  return (
    <div className={`inline-notice ${tone} ${className}`} role={role ?? (tone === "error" ? "alert" : "note")} style={style}>
      <Icon name={icon ?? icons[tone]} />
      <div className="inline-notice-content">
        {title && <strong className="inline-notice-title">{title}</strong>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
