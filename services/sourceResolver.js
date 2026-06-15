
export function detectSource(question) {
    const q = question.toLowerCase();
  
    if (
      q.includes("employee") ||
      q.includes("leave") ||
      q.includes("work from home")
    ) {
      return "employee_handbook";
    }
  
    if (
      q.includes("finance") ||
      q.includes("reimbursement")
    ) {
      return "finance_policy";
    }
  
    return null;
  }