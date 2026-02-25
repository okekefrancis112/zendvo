"use client";

import Image from "next/image";
import { ChangeEvent, useState, HTMLAttributes } from "react";
import clsx from "clsx";

const ImageUpload = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const [preview, setPreview] = useState<string | null>(null);
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large! Maximum allowed size is 10MB.");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  };

  const removeImage = () => {
    setPreview(null);
  };

  const containerClasses = clsx(
    "relative rounded-3xl border-2 border-dashed border-[#E1E1E5] bg-[#F7F7FC] shadow-sm overflow-hidden",
    "aspect-[4/3]",
  );

  if (preview) {
    return (
      <div className={clsx("mx-auto w-full", className)} {...props}>
        <div className={containerClasses}>
          <Image src={preview} alt="Preview" fill className="object-cover" />
          <div className="absolute top-0 right-0 px-6 py-5 flex flex-col items-center gap-2">
            <button
              onClick={removeImage}
              className={`
              h-[34px] w-[34px]     
              flex items-center justify-center
              rounded-full
              bg-[#E4EFFD]/80 hover:bg-[#E4EFFD]
              border-2 border-[#5A42DE]/30 border-dotted
              text-[#5A42DE] text-lg font-medium
              transition-colors
              cursor-pointer
            `}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("mx-auto w-full", className)} {...props}>
      <label className="block cursor-pointer h-full w-full">
        <div className="flex flex-col justify-center items-center h-full rounded-3xl border-2 border-dashed border-[#E1E1E5] bg-[#F7F7FC] px-6 py-12 text-center transition-colors hover:border-[#5A42DE] hover:bg-blue-50/50 focus-within:border-[[#5A42DE]] focus-within:bg-blue-50/50">
          <div className="mx-auto mb-5 flex h-8 w-8 rounded-full border border-dashed bg-[#E4EFFD]  items-center justify-center border-[#5A42DE] text-4xl font-bold text-white shadow-sm">
            <p className="text-[#5A42DE] font-br-firma text-2xl font-light">
              +
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="font-br-firma font-semibold text-base leading-6 text-center text-[#1F2937]">
              Tap to upload
            </p>
            <p className="font-br-firma font-medium text-[12px] leading-3 text-center text-[#1F2937]">
              Max image size 10MB
            </p>
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default ImageUpload;
