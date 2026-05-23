import { N8nService } from './n8nService';

interface InviteEmailPayload {
  email: string;
  name: string;
  company: string;
  inviteUrl: string;
}

interface ResetEmailPayload {
  email: string;
  name?: string;
  resetToken: string;
  resetUrl: string;
}

export class EmailService {
  static async sendEmployeeInvitation(payload: InviteEmailPayload) {
    return N8nService.triggerEmployeeInvitation(payload);
  }

  static async sendPasswordReset(payload: ResetEmailPayload) {
    return N8nService.triggerPasswordReset(payload);
  }
}
