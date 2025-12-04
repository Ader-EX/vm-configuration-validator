import axios, { AxiosError } from "axios";
import type { Server } from "@/app/page";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ValidationResult {
  key: string;
  label: string;
  status: "pass" | "fail" | "error";
  message: string;
  details?: any;
}

// Response for single validation endpoint
export interface SingleValidationResponse {
  success: boolean;
  serverId: number;
  serverName: string;
  timestamp: string;
  validation: ValidationResult;
}

// Response for validate all endpoint
export interface AllValidationsResponse {
  success: boolean;
  serverId: number;
  serverName: string;
  timestamp: string;
  overallStatus: "pass" | "partial" | "fail";
  validations: ValidationResult[]; // Array
}

export interface SetupResult {
  success: boolean;
  message: string;
  output?: any;
}

class SshService {
  private baseUrl = `${API_BASE_URL}/ssh`;
  private prereqUrl = `${API_BASE_URL}/vm-prereq`;

  async createServer(formData: FormData) {
    try {
      const response = await axios.post(`${this.baseUrl}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to create server"
      );
    }
  }

  async deleteServer(id: number) {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to delete server"
      );
    }
  }

  async getAllData(): Promise<Server[]> {
    try {
      const response = await axios.get(`${this.baseUrl}`);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to fetch servers"
      );
    }
  }

  async testConnection(id: number) {
    try {
      const response = await axios.get(`${this.baseUrl}/uptime/${id}`);
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: "Connection successful",
          data: response.data,
        };
      }
      return {
        success: false,
        message: response.data.message || "Connection failed",
        data: null,
      };
    } catch (err: any) {
      const error = err as AxiosError<any>;
      console.error("Connection test error:", error);
      throw new Error(
        error?.response?.data?.message || "Connection test failed"
      );
    }
  }

  // Validate all prerequisites - returns array of validations
  async validateAllPrerequisites(
    serverId: number,
    options?: {
      username?: string;
      group?: string;
      configPath?: string;
    }
  ): Promise<AllValidationsResponse> {
    try {
      const response = await axios.get(
        `${this.prereqUrl}/validate/${serverId}`,
        {
          params: options,
        }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to validate prerequisites"
      );
    }
  }

  // Validate individual prerequisite - returns single validation
  async validatePrerequisite(
    serverId: number,
    checkKey: string,
    options?: {
      username?: string;
      group?: string;
    }
  ): Promise<SingleValidationResponse> {
    try {
      const response = await axios.get(
        `${this.prereqUrl}/validate/${serverId}/${checkKey}`,
        {
          params: options,
        }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || `Failed to validate ${checkKey}`
      );
    }
  }

  // Setup user and group
  async setupUserGroup(
    serverId: number,
    username: string = "wmuser",
    group: string = "wmuser",
    password: string = "wmuser123"
  ): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/${serverId}/user-group`,
        { username, group, password }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to setup user and group"
      );
    }
  }

  // Setup ulimit
  async setupUlimit(
    serverId: number,
    username: string = "wmuser"
  ): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/ulimit/${serverId}`,
        { username }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to setup ulimit"
      );
    }
  }

  // Setup sysctl
  async setupSysctl(serverId: number): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/sysctl/${serverId}`
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to setup sysctl"
      );
    }
  }

  // Setup JVM
  async setupJvm(
    serverId: number,
    options?: {
      version?: number;
      osType?: "rhel" | "debian";
    }
  ): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/${serverId}/jvm`,
        options || {}
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(error?.response?.data?.message || "Failed to setup JVM");
    }
  }

  // Setup all prerequisites
  async setupAll(
    serverId: number,
    options?: {
      username?: string;
      group?: string;
    }
  ): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/all/${serverId}`,
        options || {}
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      throw new Error(
        error?.response?.data?.message || "Failed to setup prerequisites"
      );
    }
  }
}

export const sshService = new SshService();
