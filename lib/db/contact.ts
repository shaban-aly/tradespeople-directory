import { createSupabase } from "./client";
import {
  cleanText,
  validateMessage,
  validateName,
  validatePhone,
} from "../utils/validation";

export type ContactMessagePayload = {
  name: string;
  phone: string;
  message: string;
};

export async function submitContactMessage(
  payload: ContactMessagePayload,
): Promise<void> {
  const nameError = validateName(payload.name);
  if (nameError) throw new Error(nameError);
  const phoneError = validatePhone(payload.phone);
  if (phoneError) throw new Error(phoneError);
  const messageError = validateMessage(payload.message);
  if (messageError) throw new Error(messageError);

  const { error } = await createSupabase().from("contact_messages").insert({
    name: cleanText(payload.name),
    phone: cleanText(payload.phone),
    message: cleanText(payload.message),
  });

  if (error) {
    console.error("contact_messages insert error:", error);
    throw new Error("مقدرناش نستقبل رسالتك دلوقتي — جرّب تاني بعد شوية");
  }
}
