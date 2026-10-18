"use client";

import Icon from "@/components/ui/icon";
import { categories } from "@/constants/category-artwork";

type CategoryCardProps = {
  item: (typeof categories)[number];
  onClick: () => void;
};

export default function CategoryCard({ item, onClick }: CategoryCardProps) {
  return (
    <button className="category-card" onClick={onClick}>
      <img
        src={item.image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.dataset.fallback) {
            e.currentTarget.style.visibility = "hidden";

            return;
          }

          e.currentTarget.dataset.fallback = "true";
          e.currentTarget.src =
            categories.find((c) => c.name === item.name)?.image ??
            "/images/recipe-placeholder.svg";
        }}
      />
      <span className="category-number">{item.icon}</span>
      <strong>{item.name}</strong>
      <span>
        Explorar <Icon name="chevron" size={14} />
      </span>
    </button>
  );
}
