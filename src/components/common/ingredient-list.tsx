"use client";

import { useState } from "react";

import Icon from "@/components/ui/icon";

export default function IngredientList({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<number[]>([]);

  return (
    <div className="ingredient-list">
      {items.map((item, i) => (
        <label key={item} className={checked.includes(i) ? "checked" : ""}>
          <input
            type="checkbox"
            checked={checked.includes(i)}
            onChange={() =>
              setChecked((v) =>
                v.includes(i) ? v.filter((x) => x !== i) : [...v, i],
              )
            }
          />
          <span>
            <Icon name="check" size={14} />
          </span>
          {item}
        </label>
      ))}
    </div>
  );
}
