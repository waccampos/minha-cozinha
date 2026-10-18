"use client";

import Icon from "./icon";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "soft" | "ghost";
  onClick?: () => void;
  icon?: string;
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  icon,
}: ButtonProps) {
  return (
    <button type="button" className={`btn btn-${variant}`} onClick={onClick}>
      {icon && <Icon name={icon} size={18} />} {children}
    </button>
  );
}
