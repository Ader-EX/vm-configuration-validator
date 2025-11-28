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

export interface PrereqCheckResult {
  serverId: number;
  serverName: string;
  timestamp: Date;
  validations: ValidationResult[];
  overallStatus: "pass" | "partial" | "fail";
}

export interface SetupResult {
  userGroup: any;
  ulimit: any;
  sysctl: any;
}

class SshService {
  private baseUrl = `${API_BASE_URL}/ssh`;
  private prereqUrl = `${API_BASE_URL}/vm-prereq`; // Adjust based on your backend route

  async getAllData(): Promise<Server[]> {
    try {
      const response = await axios.get(`${this.baseUrl}`);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw new Error("Failed to fetch servers: " + error.message);
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
      const error = err as AxiosError;
      console.error("Connection test error:", error);
      throw new Error(
        error?.response?.data?.message || "Connection test failed"
      );
    }
  }

  // Validate all prerequisites
  async validateAllPrerequisites(
    serverId: number,
    options?: {
      username?: string;
      group?: string;
      configPath?: string;
    }
  ): Promise<PrereqCheckResult> {
    try {
      const response = await axios.get(
        `${this.prereqUrl}/validate/${serverId}`,
        options || {}
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(
        error?.response?.data?.message || "Failed to validate prerequisites"
      );
    }
  }

  // Validate individual prerequisite
  async validatePrerequisite(
    serverId: number,
    checkKey: string,
    options?: any
  ): Promise<ValidationResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/validate/${serverId}/${checkKey}`,
        options || {}
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(
        error?.response?.data?.message || `Failed to validate ${checkKey}`
      );
    }
  }

  // Setup user and group
  async setupUserGroup(
    serverId: number,
    username: string = "oracle",
    group: string = "dba"
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/${serverId}/user-group`,
        { username, group }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(
        error?.response?.data?.message || "Failed to setup user and group"
      );
    }
  }

  // Setup ulimit
  async setupUlimit(
    serverId: number,
    username: string = "oracle"
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/${serverId}/ulimit`,
        { username }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(
        error?.response?.data?.message || "Failed to setup ulimit"
      );
    }
  }

  // Setup sysctl
  async setupSysctl(serverId: number): Promise<string> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/${serverId}/sysctl`
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(
        error?.response?.data?.message || "Failed to setup sysctl"
      );
    }
  }

  async setupAll(
    serverId: number,
    options?: {
      username?: string;
      group?: string;
    }
  ): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/${serverId}/all`,
        options || {}
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(
        error?.response?.data?.message || "Failed to setup prerequisites"
      );
    }
  }
}

export const sshService = new SshService();
