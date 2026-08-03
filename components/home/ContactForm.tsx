import { useContactForm } from "@/hooks/forms/useContactForm";
import { IconCheck } from "@/components/shared/icons";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import { TextArea } from "@/components/shared/form/TextArea";
import { FIELD_LIMITS } from "@/lib/utils/validation";

export function ContactForm() {
  const {
    form,
    handleChange,
    handleBlur,
    getError,
    handleSubmit,
    submitting,
    submitError,
    submitted,
  } = useContactForm();

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-action/10 text-action">
          <IconCheck className="h-8 w-8" />
        </div>
        <h3 className="font-heading text-xl font-bold">وصلتنا رسالتك</h3>
        <p className="mt-2 text-base text-muted">
          شكراً ليك، هنرد عليك في أقرب وقت.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-4 rounded-2xl border border-border bg-background p-5 sm:p-6"
    >
      <Field
        label="الاسم"
        htmlFor="contact-name"
        required
        error={getError("name")}
      >
        <TextField
          id="contact-name"
          type="text"
          required
          autoComplete="name"
          minLength={FIELD_LIMITS.nameMin}
          maxLength={FIELD_LIMITS.nameMax}
          value={form.name}
          invalid={Boolean(getError("name"))}
          aria-describedby={getError("name") ? fieldErrorId("contact-name") : undefined}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="اسمك"
        />
      </Field>

      <Field
        label="رقم الهاتف أو الواتساب"
        htmlFor="contact-phone"
        required
        error={getError("phone")}
      >
        <TextField
          id="contact-phone"
          type="tel"
          required
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          maxLength={FIELD_LIMITS.phoneMax}
          value={form.phone}
          invalid={Boolean(getError("phone"))}
          aria-describedby={getError("phone") ? fieldErrorId("contact-phone") : undefined}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          placeholder="+20 100 000 0000"
          className="text-left"
        />
      </Field>

      <Field
        label="الرسالة"
        htmlFor="contact-message"
        required
        error={getError("message")}
      >
        <TextArea
          id="contact-message"
          rows={3}
          required
          minLength={FIELD_LIMITS.messageMin}
          maxLength={FIELD_LIMITS.messageMax}
          value={form.message}
          invalid={Boolean(getError("message"))}
          aria-describedby={getError("message") ? fieldErrorId("contact-message") : undefined}
          onChange={(e) => handleChange("message", e.target.value)}
          onBlur={() => handleBlur("message")}
          placeholder="اكتب رسالتك..."
        />
      </Field>

      {submitError && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-base font-bold text-danger">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-12 rounded-xl bg-action px-4 text-lg font-bold text-on-action transition-colors hover:bg-action/90 disabled:opacity-60"
      >
        {submitting ? "جاري الإرسال..." : "أرسل الرسالة"}
      </button>
    </form>
  );
}
