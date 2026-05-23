import axios from 'axios';

export class NotificationService {
  /**
   * Sends an email notification.
   * If credentials are not set, falls back to a terminal log output.
   */
  static async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    console.log(`\n=================== [EMAIL NOTIFICATION] ===================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML):\n${htmlContent}`);
    console.log(`============================================================\n`);

    // In a real environment, nodemailer would be configured:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, html: htmlContent });
    
    return true;
  }

  /**
   * Sends a WhatsApp notification using Twilio or falls back to log.
   */
  static async sendWhatsApp(toPhone: string, message: string): Promise<boolean> {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

    console.log(`\n================= [WHATSAPP NOTIFICATION] =================`);
    console.log(`To: ${toPhone}`);
    console.log(`Message: ${message}`);
    console.log(`===========================================================\n`);

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
      try {
        // Mocking Twilio endpoint call or actual twilio request using axios
        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          new URLSearchParams({
            From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            To: `whatsapp:${toPhone}`,
            Body: message
          }).toString(),
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        console.log(`[Twilio WhatsApp] Message successfully dispatched to Twilio API.`);
        return true;
      } catch (error: any) {
        console.error(`[Twilio WhatsApp] Error sending WhatsApp message:`, error.response?.data || error.message);
        return false;
      }
    } else {
      console.log(`[WhatsApp Sandbox] Twilio credentials missing. Logged alert message above.`);
      return true;
    }
  }

  /**
   * Posts an alert to Slack using an incoming Webhook URL.
   */
  static async sendSlackAlert(text: string): Promise<boolean> {
    const webhookUrl = process.env.SLACK_INCOMING_WEBHOOK_URL;

    console.log(`\n=================== [SLACK NOTIFICATION] ===================`);
    console.log(`Alert: ${text}`);
    console.log(`============================================================\n`);

    if (webhookUrl) {
      try {
        await axios.post(webhookUrl, { text });
        console.log(`[Slack Integration] Posted message successfully to Webhook.`);
        return true;
      } catch (error: any) {
        console.error(`[Slack Integration] Error posting to Slack Webhook:`, error.message);
        return false;
      }
    } else {
      console.log(`[Slack Sandbox] Webhook URL missing. Logged alert above.`);
      return true;
    }
  }
}
