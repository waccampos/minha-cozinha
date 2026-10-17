import type { ImgHTMLAttributes } from "react";

export default function RecipeImage({
  src,
  loading = "lazy",
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const local = typeof src === "string" && src.startsWith("/api/images/");

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      srcSet={
        local
          ? `${src}?w=320 320w, ${src}?w=640 640w, ${src}?w=960 960w, ${src}?w=1600 1600w`
          : undefined
      }
      sizes={
        props.sizes ??
        "(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 400px"
      }
    />
  );
}
