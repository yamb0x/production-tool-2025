import { toast } from '@/hooks/use-toast';

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
  method?: string;
  correlationId?: string;
}

export class ApiErrorHandler {
  static handle(error: unknown, context?: string): ApiError | null {
    // Handle fetch errors
    if (error instanceof Response) {
      return this.handleResponseError(error, context);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      this.showNetworkError(context);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Handle API error responses
    if (this.isApiError(error)) {
      this.showApiError(error, context);
      return error;
    }

    // Handle generic errors
    if (error instanceof Error) {
      this.showGenericError(error, context);
      return {
        success: false,
        error: {
          code: 'GENERIC_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Unknown error
    this.showUnknownError(context);
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
      timestamp: new Date().toISOString(),
    };
  }

  private static async handleResponseError(response: Response, context?: string): Promise<ApiError> {
    let errorData: ApiError;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: response.statusText || 'HTTP Error',
        },
        timestamp: new Date().toISOString(),
      };
    }

    this.showApiError(errorData, context);
    return errorData;
  }

  private static isApiError(error: any): error is ApiError {
    return (
      error &&
      typeof error === 'object' &&
      error.success === false &&
      error.error &&
      typeof error.error.code === 'string' &&
      typeof error.error.message === 'string'
    );
  }

  private static showNetworkError(context?: string) {
    toast({
      title: 'Connection Error',
      description: `Unable to connect to the server${context ? ` while ${context}` : ''}. Please check your internet connection.`,
      variant: 'destructive',
    });
  }

  private static showApiError(error: ApiError, context?: string) {
    const title = this.getErrorTitle(error.error.code);
    const description = this.getErrorDescription(error.error, context);

    toast({
      title,
      description,
      variant: 'destructive',
    });

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
  }

  private static showGenericError(error: Error, context?: string) {
    toast({
      title: 'Error',
      description: `${error.message}${context ? ` while ${context}` : ''}`,
      variant: 'destructive',
    });
  }

  private static showUnknownError(context?: string) {
    toast({
      title: 'Unknown Error',
      description: `An unexpected error occurred${context ? ` while ${context}` : ''}. Please try again.`,
      variant: 'destructive',
    });
  }

  private static getErrorTitle(code: string): string {
    const titleMap: Record<string, string> = {
      VALIDATION_ERROR: 'Validation Error',
      UNAUTHORIZED: 'Authentication Required',
      FORBIDDEN: 'Access Denied',
      NOT_FOUND: 'Not Found',
      CONFLICT: 'Conflict',
      TOO_MANY_REQUESTS: 'Rate Limit Exceeded',
      DATABASE_ERROR: 'Database Error',
      NETWORK_ERROR: 'Network Error',
      INTERNAL_SERVER_ERROR: 'Server Error',
      BAD_GATEWAY: 'Service Unavailable',
      SERVICE_UNAVAILABLE: 'Service Unavailable',
    };

    return titleMap[code] || 'Error';
  }

  private static getErrorDescription(error: ApiError['error'], context?: string): string {
    const contextSuffix = context ? ` while ${context}` : '';

    // Handle validation errors with field details
    if (error.code === 'VALIDATION_ERROR' && error.details) {
      if (Array.isArray(error.details)) {
        const fieldErrors = error.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(', ');
        return `${error.message}: ${fieldErrors}${contextSuffix}`;
      }
    }

    // Handle specific error messages
    const messageMap: Record<string, string> = {
      UNAUTHORIZED: 'Please log in to continue',
      FORBIDDEN: 'You don\'t have permission to perform this action',
      NOT_FOUND: 'The requested resource was not found',
      CONFLICT: 'This action conflicts with existing data',
      TOO_MANY_REQUESTS: 'Please wait before trying again',
      DATABASE_ERROR: 'A database error occurred. Please try again later',
      NETWORK_ERROR: 'Unable to connect to the server',
      INTERNAL_SERVER_ERROR: 'An internal server error occurred',
      BAD_GATEWAY: 'The service is temporarily unavailable',
      SERVICE_UNAVAILABLE: 'The service is temporarily unavailable',
    };

    const defaultMessage = messageMap[error.code] || error.message;
    return `${defaultMessage}${contextSuffix}`;
  }

  // Utility method for handling API responses
  static async handleResponse<T>(response: Response, context?: string): Promise<T> {
    if (!response.ok) {
      const error = await this.handleResponseError(response, context);
      throw error;
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error('Invalid response format');
    }
  }

  // Utility method for making API calls with error handling
  static async apiCall<T>(
    url: string,
    options: RequestInit = {},
    context?: string
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      return await this.handleResponse<T>(response, context);
    } catch (error) {
      const apiError = this.handle(error, context);
      throw apiError;
    }
  }
}