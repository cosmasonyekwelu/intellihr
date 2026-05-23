import axios from 'axios';

export class N8nService {
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.N8N_API_KEY || 'intellihr_static_n8n_api_key_secure_123'
    };
  }

  /**
   * Calls n8n monthly payroll webhook
   */
  static async triggerPayroll(month: number, year: number): Promise<any> {
    const url = process.env.N8N_PAYROLL_WEBHOOK_URL || 'http://localhost:5678/webhook/payroll';
    console.log(`[n8n Service] Triggering Payroll workflow: POST ${url} with month=${month}, year=${year}`);
    
    try {
      const response = await axios.post(url, { month, year }, { headers: this.getHeaders() });
      console.log(`[n8n Service] Webhook response code: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[n8n Service] Error calling payroll webhook:`, error.message);
      // We will handle errors by returning a fallback response to keep the backend resilient
      return { success: false, error: error.message };
    }
  }

  /**
   * Calls n8n Slack webhook alert when a new employee is hired
   */
  static async triggerSlackNewEmployee(employeeData: any): Promise<any> {
    const url = process.env.N8N_SLACK_WEBHOOK_URL || 'http://localhost:5678/webhook/slack-alerts';
    console.log(`[n8n Service] Triggering Slack Alert workflow: POST ${url}`);
    
    try {
      const response = await axios.post(url, { employee: employeeData }, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      console.error(`[n8n Service] Error calling slack webhook:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger the daily HR leave email digest manually or in cron
   */
  static async triggerEmailDigest(): Promise<any> {
    const url = process.env.N8N_EMAIL_DIGEST_WEBHOOK_URL || 'http://localhost:5678/webhook/email-digest';
    console.log(`[n8n Service] Triggering Leave Email Digest workflow: POST ${url}`);

    try {
      const response = await axios.post(url, {}, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      console.error(`[n8n Service] Error calling leave email digest webhook:`, error.message);
      return { success: false, error: error.message };
    }
  }
}
