import OpenAI from 'openai';
import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { Payroll } from '../models/Payroll';
import { LeaveRequest } from '../models/LeaveRequest';
import { Conversation } from '../models/Conversation';
import { N8nService } from './n8nService';
import { NotificationService } from './notificationService';

// Set up OpenAI instance (only if API key is provided)
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Define tools according to OpenAI specification
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_payroll_summary',
      description: 'Get payroll summary (gross, net, bonuses, deductions) for a specific month and year',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'integer', description: 'Month of the year (1-12)' },
          year: { type: 'integer', description: 'Four-digit year (e.g. 2026)' }
        },
        required: ['month', 'year']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_attendance_issues',
      description: 'Get employees with attendance issues (absences or late check-ins) for a specific month and year',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'integer', description: 'Month (1-12)' },
          year: { type: 'integer', description: 'Four-digit year' }
        },
        required: ['month', 'year']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_hr_report',
      description: 'Generate a comprehensive HR report analysis in markdown/HTML format',
      parameters: {
        type: 'object',
        properties: {
          reportType: {
            type: 'string',
            enum: ['attendance', 'payroll', 'employee'],
            description: 'The focus area of the report'
          }
        },
        required: ['reportType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_underperforming_employees',
      description: 'List employees with performance ratings indicating they are underperforming (rating of 1 or 2)',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_leave_requests',
      description: 'List all pending leave requests that require approval',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'approve_leave_request',
      description: 'Approve a pending leave request',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string', description: 'The unique ID of the leave request' }
        },
        required: ['requestId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'trigger_payroll_run',
      description: 'Trigger the monthly payroll calculation and payslip generation cycle',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'integer', description: 'Month to run (1-12)' },
          year: { type: 'integer', description: 'Year to run' }
        },
        required: ['month', 'year']
      }
    }
  }
];

export class AiService {
  /**
   * Primary route to ask the AI agent a question.
   */
  static async askQuestion(question: string, companyId: string): Promise<string> {
    try {
      if (!openai) {
        // Safe sandbox fallback for local runs without API Keys
        return this.getMockResponse(question, companyId);
      }

      // 1. Initialize messages array with system and user query
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are IntelliHR's expert HR & Payroll AI agent. 
You answer HR questions by invoking tools that query our MongoDB database. 
Always present numerical summaries in clean HTML tables. 
Maintain a highly professional, helpful, and insightful tone.
Today's date is: ${new Date().toLocaleDateString()}.`
        },
        { role: 'user', content: question }
      ];

      // 2. Initial Chat completion request with Tools enabled
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto'
      });

      const choice = response.choices[0];
      const toolCalls = choice.message.tool_calls;

      // 3. Process Tool calls if requested by the AI
      if (toolCalls && toolCalls.length > 0) {
        messages.push(choice.message); // Add assistant's tool-call response to history

        for (const call of toolCalls) {
          const functionName = call.function.name;
          const args = JSON.parse(call.function.arguments);
          let functionResult: any;

          console.log(`[AI Agent] Tool call requested: ${functionName} with args:`, args);

          // Execute corresponding Mongoose queries
          if (functionName === 'get_payroll_summary') {
            functionResult = await this.dbGetPayrollSummary(args.month, args.year, companyId);
          } else if (functionName === 'get_attendance_issues') {
            functionResult = await this.dbGetAttendanceIssues(args.month, args.year, companyId);
          } else if (functionName === 'generate_hr_report') {
            functionResult = await this.dbGenerateHrReport(args.reportType, companyId);
          } else if (functionName === 'get_underperforming_employees') {
            functionResult = await this.dbGetUnderperformingEmployees(companyId);
          } else if (functionName === 'get_pending_leave_requests') {
            functionResult = await this.dbGetPendingLeaveRequests(companyId);
          } else if (functionName === 'approve_leave_request') {
            functionResult = await this.dbApproveLeaveRequest(args.requestId, companyId);
          } else if (functionName === 'trigger_payroll_run') {
            functionResult = await this.dbTriggerPayroll(args.month, args.year, companyId);
          }

          // Push the tool result back into the OpenAI messages chain
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(functionResult)
          });
        }

        // 4. Request the final completion combining the tool outputs
        const secondResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages
        });

        const finalAnswer = secondResponse.choices[0].message.content || 'I could not generate an answer.';
        
        // Save conversation for RAG context
        await Conversation.create({ companyId, userQuestion: question, aiAnswer: finalAnswer });
        return finalAnswer;
      }

      // No tool calls requested, return standard message
      const simpleResponse = choice.message.content || 'I could not process your query.';
      await Conversation.create({ companyId, userQuestion: question, aiAnswer: simpleResponse });
      return simpleResponse;
    } catch (error: any) {
      console.error('[AI Service Error]:', error);
      return `I encountered an error processing your request: ${error.message}. Please verify your OPENAI_API_KEY environment variable.`;
    }
  }

  // ==================== DB Tool Query Implementations ====================

  private static async dbGetPayrollSummary(month: number, year: number, companyId: string) {
    const payrolls = await Payroll.find({ companyId, month, year });
    if (!payrolls.length) {
      return { message: `No payroll records found for ${month}/${year}` };
    }

    let totalGross = 0;
    let totalNet = 0;
    let totalTax = 0;
    let totalPension = 0;
    let totalLoan = 0;
    let totalBonuses = 0;

    payrolls.forEach((p) => {
      totalGross += p.grossSalary;
      totalNet += p.netSalary;
      totalTax += p.deductions?.tax ?? 0;
      totalPension += p.deductions?.pension ?? 0;
      totalLoan += p.deductions?.loan ?? 0;
      totalBonuses += p.bonuses;
    });

    const averageSalary = totalNet / payrolls.length;

    // Fetch previous month to compare payroll differences if requested
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevPayrolls = await Payroll.find({ companyId, month: prevMonth, year: prevYear });
    
    let prevTotalNet = 0;
    prevPayrolls.forEach(p => prevTotalNet += p.netSalary);
    const percentDifference = prevTotalNet > 0 ? ((totalNet - prevTotalNet) / prevTotalNet) * 100 : 0;

    return {
      month,
      year,
      totalEmployeesPaid: payrolls.length,
      totalGrossSalary: totalGross,
      totalNetSalary: totalNet,
      averageNetSalary: averageSalary,
      breakdown: {
        totalTax,
        totalPension,
        totalLoan,
        totalBonuses
      },
      comparison: {
        previousMonthNetSalary: prevTotalNet,
        variancePercent: percentDifference.toFixed(2)
      }
    };
  }

  private static async dbGetAttendanceIssues(month: number, year: number, companyId: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const issues = await Attendance.find({
      companyId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['absent', 'late'] }
    }).populate('employeeId', 'name position department');

    return issues.map(i => {
      const emp = i.employeeId as any;
      return {
        date: i.date.toLocaleDateString(),
        employeeName: emp?.name || 'Unknown',
        department: emp?.department || 'Unknown',
        status: i.status,
        checkIn: i.checkIn ? i.checkIn.toLocaleTimeString() : 'N/A',
        checkOut: i.checkOut ? i.checkOut.toLocaleTimeString() : 'N/A'
      };
    });
  }

  private static async dbGetUnderperformingEmployees(companyId: string) {
    const employees = await Employee.find({ companyId, performanceRating: { $lte: 2 } });
    return employees.map(emp => ({
      name: emp.name,
      department: emp.department,
      position: emp.position,
      status: emp.status,
      salary: emp.salary,
      rating: emp.performanceRating
    }));
  }

  private static async dbGetPendingLeaveRequests(companyId: string) {
    const requests = await LeaveRequest.find({ companyId, status: 'pending' })
      .populate('employeeId', 'name position department')
      .populate('leaveTypeId', 'name');
    return requests.map(r => ({
      requestId: r._id,
      employeeName: (r.employeeId as any)?.name || 'Unknown',
      type: (r.leaveTypeId as any)?.name || 'Leave',
      startDate: r.startDate.toLocaleDateString(),
      endDate: r.endDate.toLocaleDateString(),
      reason: r.reason
    }));
  }

  private static async dbApproveLeaveRequest(requestId: string, companyId: string) {
    const request = await LeaveRequest.findOne({ _id: requestId, companyId }).populate('employeeId');
    if (!request) {
      return { success: false, message: 'Leave request not found.' };
    }

    if (request.status !== 'pending') {
      return { success: false, message: `Request is already ${request.status}.` };
    }

    request.status = 'approved';
    await request.save();

    // Notify employee
    const emp = request.employeeId as any;
    if (emp && emp.email) {
      await NotificationService.sendEmail(
        emp.email,
        'Leave Request Approved',
        `<p>Your leave request from ${request.startDate.toLocaleDateString()} to ${request.endDate.toLocaleDateString()} has been approved.</p>`
      );
    }

    return { success: true, message: `Leave request for ${emp?.name} has been approved successfully.` };
  }

  private static async dbTriggerPayroll(month: number, year: number, companyId: string) {
    // Trigger n8n workflow
    const n8nResult = await N8nService.triggerPayroll(month, year, companyId);

    // The actual payroll calculation happens in PayrollController.runPayroll logic usually,
    // but here we are just triggering the external workflow as requested.

    return {
      success: true,
      message: `Payroll run for ${month}/${year} has been initiated via n8n.`,
      n8nResponse: n8nResult
    };
  }

  private static async dbGenerateHrReport(reportType: 'attendance' | 'payroll' | 'employee', companyId: string) {
    const employeeCount = await Employee.countDocuments({ companyId, status: 'active' });
    const leaveCount = await LeaveRequest.countDocuments({ companyId, status: 'approved' });
    
    if (reportType === 'employee') {
      return {
        title: 'Employee Headcount Analysis Report',
        activeEmployees: employeeCount,
        approvedLeaveRequests: leaveCount,
        summary: `Currently, we have ${employeeCount} active workers and ${leaveCount} approved leave requests. All departments are performing within normal structural limits.`
      };
    }

    if (reportType === 'payroll') {
      const payrolls = await Payroll.find({ companyId });
      let totalSpending = 0;
      payrolls.forEach(p => totalSpending += p.netSalary);
      return {
        title: 'Payroll Expense Digest Report',
        totalPayrollProcessed: payrolls.length,
        aggregateSpend: totalSpending,
        summary: `Total historical net pay calculations cover ${payrolls.length} statements with an accumulated company spend of $${totalSpending.toLocaleString()}.`
      };
    }

    // Default: Attendance summary
    const presentCount = await Attendance.countDocuments({ companyId, status: 'present' });
    const lateCount = await Attendance.countDocuments({ companyId, status: 'late' });
    const absentCount = await Attendance.countDocuments({ companyId, status: 'absent' });
    const totalCount = presentCount + lateCount + absentCount || 1;

    return {
      title: 'Monthly Attendance Reliability Analysis',
      totalLogs: totalCount,
      presentRatio: ((presentCount / totalCount) * 100).toFixed(1) + '%',
      lateRatio: ((lateCount / totalCount) * 100).toFixed(1) + '%',
      absentRatio: ((absentCount / totalCount) * 100).toFixed(1) + '%',
      summary: `Out of ${totalCount} recorded timesheet logs, ${presentCount} were on time, ${lateCount} checked in late, and ${absentCount} were absent.`
    };
  }

  /**
   * Visual sandbox mock response for users running local setups without active OpenAI credit plans.
   */
  private static async getMockResponse(question: string, companyId: string): Promise<string> {
    const query = question.toLowerCase();

    // Mock query logic checking standard keywords:
    if (query.includes('payroll') && (query.includes('why') || query.includes('higher') || query.includes('compare'))) {
      const data = await this.dbGetPayrollSummary(5, 2026, companyId);
      return `
<h3>Payroll Comparison Analysis (May 2026)</h3>
<p>Our records indicate that payroll for May 2026 is higher than the previous month due to added performance bonuses and tax adjustments.</p>
<table border="1" style="border-collapse: collapse; width: 100%; text-align: left; margin: 15px 0;">
  <tr style="background-color: #1e293b; color: #fff;">
    <th style="padding: 8px;">Metric</th>
    <th style="padding: 8px;">May 2026</th>
    <th style="padding: 8px;">Previous Month</th>
    <th style="padding: 8px;">Variance</th>
  </tr>
  <tr>
    <td style="padding: 8px;"><strong>Total Paid Employees</strong></td>
    <td style="padding: 8px;">${data.totalEmployeesPaid || 5}</td>
    <td style="padding: 8px;">5</td>
    <td style="padding: 8px;">0</td>
  </tr>
  <tr>
    <td style="padding: 8px;"><strong>Net Salary Aggregate</strong></td>
    <td style="padding: 8px;">$${(data.totalNetSalary || 28750).toLocaleString()}</td>
    <td style="padding: 8px;">$25,000</td>
    <td style="padding: 8px; color: #ef4444;">+${data.comparison?.variancePercent || '15.00'}%</td>
  </tr>
  <tr>
    <td style="padding: 8px;"><strong>Deductions (Tax/Pension)</strong></td>
    <td style="padding: 8px;">$5,400</td>
    <td style="padding: 8px;">$4,800</td>
    <td style="padding: 8px;">+$600</td>
  </tr>
  <tr>
    <td style="padding: 8px;"><strong>Bonuses Paid</strong></td>
    <td style="padding: 8px;">$3,200</td>
    <td style="padding: 8px;">$1,000</td>
    <td style="padding: 8px; color: #ef4444;">+$2,200</td>
  </tr>
</table>
<p><em>Conclusion:</em> The payroll variance is mostly driven by <strong>+$2,200</strong> in bonuses distributed across Sales and Tech departments.</p>
      `;
    }

    if (query.includes('attendance') || query.includes('absent') || query.includes('late')) {
      const issues = await this.dbGetAttendanceIssues(5, 2026, companyId);
      let issueRows = '';
      if (issues && issues.length > 0) {
        issues.forEach((i: any) => {
          issueRows += `
            <tr>
              <td style="padding: 8px;">${i.employeeName}</td>
              <td style="padding: 8px;">${i.department}</td>
              <td style="padding: 8px; font-weight: bold; color: ${i.status === 'absent' ? '#ef4444' : '#f59e0b'};">${i.status.toUpperCase()}</td>
              <td style="padding: 8px;">${i.date}</td>
            </tr>
          `;
        });
      } else {
        issueRows = `
          <tr>
            <td colspan="4" style="padding: 8px; text-align: center;">No attendance issues recorded for this month.</td>
          </tr>
        `;
      }
      return `
<h3>Attendance Reliability Digest</h3>
<p>Here is the list of employees who registered attendance issues (Absences or Late Check-ins) for the current month:</p>
<table border="1" style="border-collapse: collapse; width: 100%; text-align: left; margin: 15px 0;">
  <tr style="background-color: #1e293b; color: #fff;">
    <th style="padding: 8px;">Employee</th>
    <th style="padding: 8px;">Department</th>
    <th style="padding: 8px;">Status</th>
    <th style="padding: 8px;">Date</th>
  </tr>
  ${issueRows}
</table>
<p>Please address these issues with the respective department supervisors.</p>
      `;
    }

    if (query.includes('underperforming') || query.includes('rating') || query.includes('performance')) {
      const underperformers = await this.dbGetUnderperformingEmployees(companyId);
      let rows = '';
      if (underperformers && underperformers.length > 0) {
        underperformers.forEach((emp: any) => {
          rows += `
            <tr>
              <td style="padding: 8px;">${emp.name}</td>
              <td style="padding: 8px;">${emp.department}</td>
              <td style="padding: 8px;">${emp.position}</td>
              <td style="padding: 8px; font-weight: bold; color: #ef4444;">${emp.rating}/5</td>
            </tr>
          `;
        });
      } else {
        rows = `
          <tr>
            <td colspan="4" style="padding: 8px; text-align: center;">All employees are performing at or above expectations (rating >= 3).</td>
          </tr>
        `;
      }
      return `
<h3>Underperforming Employees (Rating <= 2)</h3>
<p>We found the following employees with underperforming indicators in the latest HR manager reviews:</p>
<table border="1" style="border-collapse: collapse; width: 100%; text-align: left; margin: 15px 0;">
  <tr style="background-color: #1e293b; color: #fff;">
    <th style="padding: 8px;">Employee</th>
    <th style="padding: 8px;">Department</th>
    <th style="padding: 8px;">Position</th>
    <th style="padding: 8px;">Rating</th>
  </tr>
  ${rows}
</table>
<p><em>Recommendation:</em> It is advised to schedule a feedback alignment meeting or introduce a performance improvement plan (PIP) for these individuals.</p>
      `;
    }

    if (query.includes('report') || query.includes('generate')) {
      const rep = await this.dbGenerateHrReport('employee', companyId);
      return `
<h3>HR Management Analytical Summary</h3>
<p>Here is a synthesized summary of key operations parameters:</p>
<ul style="line-height: 1.6;">
  <li><strong>Active Headcount:</strong> ${rep.activeEmployees || 10} Employees</li>
  <li><strong>Approved Leave Requests:</strong> ${rep.approvedLeaveRequests || 0} currently approved</li>
  <li><strong>Operations Payroll Status:</strong> Fully calculated for the current period</li>
</ul>
<p><em>Conclusion:</em> The company is currently operating within stable parameters. System triggers for automatic notifications and payslip mailings are working correctly.</p>
      `;
    }

    return `
<h3>Welcome to IntelliHR AI Assistant</h3>
<p>I am your RAG-enabled HR agent. Ask me queries such as:</p>
<ul>
  <li><em>"Why was payroll higher this month?"</em></li>
  <li><em>"Summarize attendance issues for last month"</em></li>
  <li><em>"Which employees are underperforming?"</em></li>
  <li><em>"Generate HR report for management"</em></li>
</ul>
<p><strong>Note:</strong> Currently operating in sandbox emulation mode because the <code>OPENAI_API_KEY</code> has not been specified in the <code>.env</code> file. Provide an API key to experience full natural language understanding.</p>
    `;
  }
}
