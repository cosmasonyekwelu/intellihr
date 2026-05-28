import axios from 'axios';

type WebhookPayload = Record<string, any>;

export class N8nWebhookService {
  private static getHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  private static getWebhookUrl(envKey: string, path: string) {
    const explicitUrl = process.env[envKey];
    if (explicitUrl) return explicitUrl;

    const baseUrl = process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook';
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  private static withSecret(payload: WebhookPayload) {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    return secret ? { secret, ...payload } : payload;
  }

  private static async postWebhook(envKey: string, path: string, payload: WebhookPayload, label: string) {
    const url = this.getWebhookUrl(envKey, path);
    console.log(`[n8n Webhook] Triggering ${label}: POST ${url}`);

    try {
      const response = await axios.post(url, this.withSecret(payload), { headers: this.getHeaders() });
      console.log(`[n8n Webhook] ${label} response code: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[n8n Webhook] ${label} failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  static async triggerPayroll(month: number, year: number, companyId: string, records: any[] = []): Promise<any> {
    return this.postWebhook(
      'N8N_PAYROLL_WEBHOOK_URL',
      'payroll-trigger',
      { month, year, companyId, records },
      'Payroll'
    );
  }

  static async triggerSlackNewEmployee(employeeData: any): Promise<any> {
    return this.postWebhook(
      'N8N_SLACK_WEBHOOK_URL',
      'slack-alerts',
      { employee: employeeData },
      'Slack New Employee Alert'
    );
  }

  static async triggerEmailDigest(payload: WebhookPayload = {}): Promise<any> {
    return this.postWebhook(
      'N8N_EMAIL_DIGEST_WEBHOOK_URL',
      'email-digest',
      payload,
      'Leave Email Digest'
    );
  }

  static async triggerPasswordReset(payload: { email: string; name?: string; resetToken: string; resetUrl: string }): Promise<any> {
    return this.postWebhook(
      'N8N_PASSWORD_RESET_WEBHOOK_URL',
      'password-reset',
      payload,
      'Password Reset Email'
    );
  }

  static async triggerEmployeeInvitation(payload: { email: string; name: string; company: string; inviteUrl: string }): Promise<any> {
    return this.postWebhook(
      'N8N_EMPLOYEE_INVITE_WEBHOOK_URL',
      'invite-employee',
      payload,
      'Employee Invitation Email'
    );
  }

  static async triggerAttendanceReminder(payload: WebhookPayload): Promise<any> {
    return this.postWebhook(
      'N8N_ATTENDANCE_REMINDER_WEBHOOK_URL',
      'attendance-reminder',
      payload,
      'Attendance Reminder'
    );
  }

  static async triggerLeaveNotification(payload: WebhookPayload): Promise<any> {
    return this.postWebhook(
      'N8N_LEAVE_NOTIFICATION_WEBHOOK_URL',
      'leave-notification',
      payload,
      'Leave Request Notification'
    );
  }
}

export const N8nService = N8nWebhookService;
