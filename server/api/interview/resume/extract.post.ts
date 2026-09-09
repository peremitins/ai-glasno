import { readMultipartFormData } from "h3";

import { extractUploadedText } from "../../../infrastructure/files/extractUploadedText";
import { apiError } from "../../../utils/apiError";
import { defineApiRoute } from "../../../utils/defineApiRoute";

export default defineApiRoute(async (event) => {
  const file = (await readMultipartFormData(event))?.find(
    (part) => part.name === "file" && part.data,
  );
  if (!file?.data) throw apiError("E_VALIDATION", "Прикрепите файл резюме.");
  return {
    fileName: file.filename ?? null,
    text: await extractUploadedText({
      data: Buffer.from(file.data),
      fileName: file.filename,
      mimeType: file.type,
    }),
  };
});
