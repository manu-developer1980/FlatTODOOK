import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make an API request to the backend
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse> {
  try {
    // Get current session for authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authorization header if we have a session
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error("API request failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

/**
 * Upload a file to the backend
 */
export async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, additionalData[key]);
    });
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error("File upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Make a GET request
 */
export async function get(endpoint: string): Promise<ApiResponse> {
  return apiRequest(endpoint, { method: "GET" });
}

/**
 * Make a POST request
 */
export async function post(endpoint: string, data?: any): Promise<ApiResponse> {
  return apiRequest(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Make a PUT request
 */
export async function put(endpoint: string, data?: any): Promise<ApiResponse> {
  return apiRequest(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Make a DELETE request
 */
export async function del(endpoint: string): Promise<ApiResponse> {
  return apiRequest(endpoint, { method: "DELETE" });
}

export default {
  apiRequest,
  uploadFile,
  get,
  post,
  put,
  del,
};
