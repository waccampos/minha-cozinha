"use client";

import { useId, useRef, useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import Modal from "@/components/ui/modal";
import { recipePrompt } from "@/constants/recipe-prompt";

export default function RecipePromptDialog() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const selectText = () => {
    textRef.current?.focus();
    textRef.current?.select();
    setStatus("manual");
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        selectText();

        return;
      }

      await navigator.clipboard.writeText(recipePrompt);
      setStatus("copied");
    } catch {
      selectText();
    }
  };

  return (
    <>
      <button
        type="button"
        className="footer-prompt-button"
        aria-haspopup="dialog"
        onClick={() => {
          setStatus("idle");
          setOpen(true);
        }}
      >
        <Icon name="copy" size={17} />
        Prompt para pedir receitas
      </button>
      {open && (
        <Modal title="Peça uma receita à sua IA" onClose={() => setOpen(false)}>
          <div className="recipe-prompt-content">
            <p id={`${id}-instructions`}>
              Copie o prompt, cole na IA de sua preferência e substitua os
              trechos entre colchetes pelo seu pedido. Depois, transfira a
              resposta para o formulário de nova receita.
            </p>
            <p>
              Escolha uma categoria cadastrada no site ou cadastre a sugerida
              antes de salvar. A foto é adicionada separadamente.
            </p>
            <label htmlFor={id}>Prompt completo</label>
            <textarea
              ref={textRef}
              id={id}
              className="recipe-prompt-text"
              value={recipePrompt}
              readOnly
              rows={12}
              spellCheck={false}
              aria-describedby={`${id}-instructions`}
            />
            <p
              className="recipe-prompt-status"
              role="status"
              aria-live="polite"
            >
              {status === "copied"
                ? "Prompt copiado! Cole na IA e personalize seu pedido."
                : status === "manual"
                  ? "Texto selecionado. Use a opção Copiar do dispositivo ou Ctrl+C / ⌘C."
                  : "O prompt fica disponível aqui sempre que precisar."}
            </p>
            <div className="recipe-prompt-actions">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>
              <Button variant="soft" onClick={selectText}>
                Selecionar texto
              </Button>
              <Button
                onClick={() => void copy()}
                icon={status === "copied" ? "check" : "copy"}
              >
                {status === "copied" ? "Copiado!" : "Copiar prompt"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
