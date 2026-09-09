import { describe, expect, it } from "vitest";

import { extractUploadedText } from "./extractUploadedText";

describe("extractUploadedText", () => {
  it("извлекает текст из загруженного текстового файла", async () => {
    await expect(
      extractUploadedText({
        data: Buffer.from("React\nTypeScript\nОпыт работы"),
        fileName: "resume.txt",
        mimeType: "text/plain",
      }),
    ).resolves.toBe("React\nTypeScript\nОпыт работы");
  });
});
