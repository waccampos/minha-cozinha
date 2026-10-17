"use client";

import { useId, useRef, useState } from "react";

import Icon from "./icon";

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();

  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const read = async (file?: File) => {
    if (!file || uploading) return;

    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Escolha JPG ou PNG de até 5 MB.");

      return;
    }

    setUploading(true);
    setError("");

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "Não foi possível enviar a imagem.");

      onChange(result.path);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);

      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => read(e.target.files?.[0])}
      />
      <button
        type="button"
        className="uploader"
        disabled={uploading}
        aria-busy={uploading}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          read(e.dataTransfer.files[0]);
        }}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {value ? (
          <img
            src={value}
            alt="Fotografia selecionada"
            className="upload-preview"
          />
        ) : (
          <span>
            <Icon name="upload" />
          </span>
        )}
        <strong>
          {uploading
            ? "Enviando fotografia…"
            : value
              ? "Trocar fotografia"
              : "Adicione suas fotos"}
        </strong>
        <small>Arraste ou clique para escolher · JPG ou PNG · até 5 MB</small>
      </button>
      {value && (
        <button
          type="button"
          className="text-action"
          onClick={() => onChange("")}
          disabled={uploading}
        >
          Remover fotografia
        </button>
      )}
      {error && (
        <small id={`${id}-error`} className="field-error" role="alert">
          {error}
        </small>
      )}
    </>
  );
}
