import path from "node:path";

export const imageDirectory = () =>
  path.resolve(process.env.IMAGE_STORAGE_DIR || "./storage/images");

