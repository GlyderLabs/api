import crypto from "crypto";
import dotenv from "dotenv"

// Encrypt function
export const encrypt = (data: string): string => {
  const cipher = crypto.createCipheriv(
    "aes-256-ctr",
    process.env.ADDRESS_ENCRYPTION_KEY as string,
    process.env.ADDRESS_ENCRYPTION_IV as string
  );
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  return encrypted.toString("hex");
};

// Decrypt function
export const decrypt = (encryptedData: string): string => {
  const decipher = crypto.createDecipheriv(
    "aes-256-ctr",
    process.env.ADDRESS_ENCRYPTION_KEY as string,
    process.env.ADDRESS_ENCRYPTION_IV as string
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};
