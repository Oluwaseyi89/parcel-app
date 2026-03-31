import AsyncStorage from '@react-native-async-storage/async-storage'


// Types
export interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  statusText: string;
}

// For storing authentication token
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Using AsyncStorage for token persistence
    const token = await AsyncStorage.getItem('auth_token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Main fetch function with FormData support
export const UseFetch = async (
  url: string, 
  method: string = 'GET', 
  body?: any, 
  options: FetchOptions = {}
): Promise<ApiResponse> => {
  
  // Default headers
  const defaultHeaders: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  };

  // Get auth token if available
  const authToken = await getAuthToken();
  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  // Check if body is FormData
  const isFormData = body instanceof FormData;
  
  // For FormData, don't set Content-Type (let browser set it with boundary)
  if (!isFormData && body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Merge custom headers with defaults
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  // Prepare body
  let requestBody = body;
  if (body && !isFormData && headers['Content-Type'] === 'application/json') {
    requestBody = JSON.stringify(body);
  }

  // Add timeout support
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json();

    return {
      data,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
};

// JSON-specific fetch function
export const UseFetchJSON = async <T = any>(
  url: string, 
  method: string = 'GET', 
  body?: any,
  options: FetchOptions = {}
): Promise<T> => {
  
  const authToken = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await UseFetch(url, method, body, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  return response.data as T;
};

// Helper function for common HTTP methods
export const apiClient = {
  get: <T = any>(url: string, options?: FetchOptions) => 
    UseFetchJSON<T>(url, 'GET', undefined, options),
  
  post: <T = any>(url: string, data?: any, options?: FetchOptions) => 
    UseFetchJSON<T>(url, 'POST', data, options),
  
  put: <T = any>(url: string, data?: any, options?: FetchOptions) => 
    UseFetchJSON<T>(url, 'PUT', data, options),
  
  patch: <T = any>(url: string, data?: any, options?: FetchOptions) => 
    UseFetchJSON<T>(url, 'PATCH', data, options),
  
  delete: <T = any>(url: string, options?: FetchOptions) => 
    UseFetchJSON<T>(url, 'DELETE', undefined, options),
  
  // For file uploads with FormData
  upload: (url: string, formData: FormData, options?: FetchOptions) => 
    UseFetch(url, 'POST', formData, options),
};
