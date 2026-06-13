export async function retryAsync(
    operation,
    maxRetries = 3,
    initialDelay = 1000
  ) {
    let lastError;
    let delay = initialDelay;
  
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
  
        console.log(
          `Attempt ${attempt} failed: ${err.message}`
        );
  
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
  
    throw lastError;
  }