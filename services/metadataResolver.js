export function detectMetadata(question) {
    const lower = question.toLowerCase();
  
    const filters = {};
  
    if (lower.includes("hr")) {
      filters.department = "HR";
    }
  
    if (lower.includes("finance")) {
      filters.department = "Finance";
    }
  
    if (lower.includes("engineering")) {
      filters.department = "Engineering";
    }
  
    if (lower.includes("2025")) {
      filters.year = 2025;
    }
  
    if (lower.includes("2024")) {
      filters.year = 2024;
    }
  
    return filters;
  }