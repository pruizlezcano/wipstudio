"use client";

import type { CSSProperties } from "react";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_PROJECT_ARTWORK_FILE_SIZE = 50 * 1024 * 1024;
const INITIAL_MAX_ARTWORK_DIMENSION = 960;
const MIN_ARTWORK_DIMENSION = 320;
const INITIAL_OUTPUT_QUALITY = 0.82;
const MIN_OUTPUT_QUALITY = 0.45;
export const MAX_STORED_ARTWORK_LENGTH = 1_900_000;

export function validateProjectArtworkFile(file: File) {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    throw new Error("Artwork must be a JPG, PNG, WebP, or AVIF image.");
  }

  if (file.size > MAX_PROJECT_ARTWORK_FILE_SIZE) {
    throw new Error("Artwork must be 8 MB or smaller.");
  }
}

function loadImage(file: File) {
  const objectUrl = URL.createObjectURL(file);

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read artwork image."));
    };
    image.src = objectUrl;
  });
}

function componentToHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function getScaledDimensions(width: number, height: number) {
  if (
    width <= INITIAL_MAX_ARTWORK_DIMENSION &&
    height <= INITIAL_MAX_ARTWORK_DIMENSION
  ) {
    return { width, height };
  }

  const ratio = Math.min(
    INITIAL_MAX_ARTWORK_DIMENSION / width,
    INITIAL_MAX_ARTWORK_DIMENSION / height
  );

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function renderArtworkDataUrl(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Failed to prepare artwork.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return {
    artwork: canvas.toDataURL("image/webp", quality),
    imageData: context.getImageData(0, 0, width, height).data,
  };
}

export async function prepareProjectArtwork(file: File) {
  validateProjectArtworkFile(file);

  const image = await loadImage(file);
  const { width, height } = getScaledDimensions(
    image.naturalWidth,
    image.naturalHeight
  );
  const { imageData } = renderArtworkDataUrl(
    image,
    width,
    height,
    INITIAL_OUTPUT_QUALITY
  );
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;

  for (let index = 0; index < imageData.length; index += 16) {
    const alpha = imageData[index + 3];
    if (alpha < 128) {
      continue;
    }

    red += imageData[index];
    green += imageData[index + 1];
    blue += imageData[index + 2];
    samples += 1;
  }

  const dominantColor =
    samples > 0
      ? `#${componentToHex(Math.round(red / samples))}${componentToHex(
          Math.round(green / samples)
        )}${componentToHex(Math.round(blue / samples))}`
      : "#808080";

  let outputWidth = width;
  let outputHeight = height;
  let quality = INITIAL_OUTPUT_QUALITY;
  let artwork = "";

  while (true) {
    const result = renderArtworkDataUrl(
      image,
      outputWidth,
      outputHeight,
      quality
    );
    artwork = result.artwork;

    if (artwork.length <= MAX_STORED_ARTWORK_LENGTH) {
      break;
    }

    if (quality > MIN_OUTPUT_QUALITY) {
      quality = Math.max(MIN_OUTPUT_QUALITY, quality - 0.08);
      continue;
    }

    if (
      outputWidth <= MIN_ARTWORK_DIMENSION &&
      outputHeight <= MIN_ARTWORK_DIMENSION
    ) {
      throw new Error(
        "This image is still too large after compression. Try a simpler or smaller artwork file."
      );
    }

    outputWidth = Math.max(
      MIN_ARTWORK_DIMENSION,
      Math.round(outputWidth * 0.85)
    );
    outputHeight = Math.max(
      MIN_ARTWORK_DIMENSION,
      Math.round(outputHeight * 0.85)
    );
    quality = INITIAL_OUTPUT_QUALITY;
  }

  return {
    artwork,
    artworkDominantColor: dominantColor,
  };
}

export function createProjectTint(
  color: string | null | undefined,
  intensity = 1
): CSSProperties | undefined {
  if (!color) {
    return undefined;
  }

  const normalized = color.replace("#", "");
  if (normalized.length !== 6) {
    return undefined;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some(Number.isNaN)) {
    return undefined;
  }

  return {
    backgroundImage: `linear-gradient(135deg, rgba(${red}, ${green}, ${blue}, ${0.2 * intensity}) 0%, rgba(${red}, ${green}, ${blue}, ${0.08 * intensity}) 48%, transparent 100%)`,
  };
}

export function createProjectAccent(
  color: string | null | undefined,
  alpha = 0.18
): CSSProperties | undefined {
  if (!color) {
    return undefined;
  }

  const normalized = color.replace("#", "");
  if (normalized.length !== 6) {
    return undefined;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some(Number.isNaN)) {
    return undefined;
  }

  return {
    backgroundColor: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
    borderColor: `rgba(${red}, ${green}, ${blue}, ${Math.min(alpha + 0.22, 0.6)})`,
  };
}
