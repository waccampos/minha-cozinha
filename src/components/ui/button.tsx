"use client";

import Icon from "./icon";

export default function Button({
  children,
  variant = "primary",
  onClick,
  icon,
}: {
  children: React.ReactNode;
  variant?: "primary" | "soft" | "ghost";
  onClick?: () => void;
  icon?: string;
}) {
  return (
    <button type="button" className={`btn btn-${variant}`} onClick={onClick}>
      {icon && <Icon name={icon} size={18} />} {children}
    </button>
  );
}
