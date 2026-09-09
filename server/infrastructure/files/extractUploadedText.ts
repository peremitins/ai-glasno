import { PDFParse } from "pdf-parse";
import { extractRawText } from "mammoth";
import { read, utils } from "xlsx";

import { apiError } from "../../utils/apiError.js";

type Upload = {
  data: Buffer;
  fileName?: string | null;
  mimeType?: string | null;
};

const textExtensions = new Set(["txt", "md", "csv"]);

export async function extractUploadedText(upload: Upload): Promise<string> {
  const extension = upload.fileName?.split(".").pop()?.toLocaleLowerCase();
  if (extension && textExtensions.has(extension)) {
    return upload.data.toString("utf8").trim();
  }
  if (extension === "pdf" || upload.mimeType === "application/pdf") {
    const parser = new PDFParse({ data: upload.data });
    try {
      return (await parser.getText()).text.trim();
    } finally {
      await parser.destroy();
    }
  }
  if (extension === "xlsx" || extension === "xls") {
    const workbook = read(upload.data, { type: "buffer" });
    return workbook.SheetNames.map((name) =>
      utils.sheet_to_csv(workbook.Sheets[name]!),
    )
      .join("\n")
      .trim();
  }
  if (extension === "docx") {
    return (await extractRawText({ buffer: upload.data })).value.trim();
  }
  throw apiError(
    "E_VALIDATION",
    "Поддерживаются PDF, DOCX, TXT, MD, CSV, XLS и XLSX файлы.",
  );
}
