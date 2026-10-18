"use client";

import Icon from "./icon";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
};

export default function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction}>
          {action} <Icon name="chevron" size={16} />
        </button>
      )}
    </div>
  );
}
