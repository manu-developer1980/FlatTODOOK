import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

interface BrevoEmailData {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class EmailService {
  private brevoApiKey: string;
  private defaultFrom: string;
  private defaultFromName: string;

  constructor() {
    this.brevoApiKey = process.env.BREVO_API_KEY!;
    this.defaultFrom = process.env.EMAIL_FROM!;
    this.defaultFromName = process.env.EMAIL_FROM_NAME!;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const emailData: BrevoEmailData = {
        sender: {
          name: options.fromName || this.defaultFromName,
          email: options.from || this.defaultFrom,
        },
        to: recipients.map((email) => ({ email })),
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text || this.htmlToText(options.html),
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.brevoApiKey,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Brevo API error:", error);
        return false;
      }

      console.log("Email sent successfully via Brevo");
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendMedicationReminder(
    userId: string,
    medicationName: string,
    dosage: string,
    time: string
  ): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (error || !user) {
        console.error("User not found:", error);
        return false;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Recordatorio de Medicación - MediTrack</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">Recordatorio de Medicación</h2>
            <p>Hola ${user.full_name || ""},</p>
            <p>Este es un recordatorio amigable de que es hora de tomar tu medicación:</p>
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #10B981;">${medicationName}</h3>
              <p><strong>Dosis:</strong> ${dosage}</p>
              <p><strong>Hora:</strong> ${time}</p>
            </div>
            <p>Por favor, confirma que has tomado tu medicación en la aplicación.</p>
            <p>Si tienes alguna pregunta, no dudes en contactar a tu médico.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="font-size: 12px; color: #6B7280;">
              Este es un mensaje automático de MediTrack. Por favor, no respondas a este correo.
            </p>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail({
        to: user.email,
        subject: `Recordatorio: ${medicationName}`,
        html,
      });
    } catch (error) {
      console.error("Error sending medication reminder:", error);
      return false;
    }
  }

  async sendAppointmentReminder(
    userId: string,
    appointmentDetails: {
      title: string;
      date: string;
      time: string;
      doctor?: string;
      location?: string;
    }
  ): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (error || !user) {
        console.error("User not found:", error);
        return false;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Recordatorio de Cita - MediTrack</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Recordatorio de Cita</h2>
            <p>Hola ${user.full_name || ""},</p>
            <p>Este es un recordatorio de tu próxima cita:</p>
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #3B82F6;">${
                appointmentDetails.title
              }</h3>
              <p><strong>Fecha:</strong> ${appointmentDetails.date}</p>
              <p><strong>Hora:</strong> ${appointmentDetails.time}</p>
              ${
                appointmentDetails.doctor
                  ? `<p><strong>Doctor:</strong> ${appointmentDetails.doctor}</p>`
                  : ""
              }
              ${
                appointmentDetails.location
                  ? `<p><strong>Ubicación:</strong> ${appointmentDetails.location}</p>`
                  : ""
              }
            </div>
            <p>Por favor, llega 15 minutos antes de tu cita.</p>
            <p>Si necesitas cancelar o reprogramar, por favor contacta a tu médico.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="font-size: 12px; color: #6B7280;">
              Este es un mensaje automático de MediTrack. Por favor, no respondas a este correo.
            </p>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail({
        to: user.email,
        subject: `Recordatorio: ${appointmentDetails.title}`,
        html,
      });
    } catch (error) {
      console.error("Error sending appointment reminder:", error);
      return false;
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim();
  }
}
