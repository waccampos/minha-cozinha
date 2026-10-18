"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ title, children, onClose }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();

    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
}
