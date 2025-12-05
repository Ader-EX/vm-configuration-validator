import axios, { AxiosError } from "axios";
import type { Server } from "@/app/page";
import useLogStore from "@/store/log-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ValidationResult {
  key: string;
  label: string;
  status: "pass" | "fail" | "error";
  message: string;
  details?: any;
}

export interface SingleValidationResponse {
  success: boolean;
  serverId: number;
  serverName: string;
  timestamp: string;
  validation: ValidationResult;
}

export interface AllValidationsResponse {
  success: boolean;
  serverId: number;
  serverName: string;
  timestamp: string;
  overallStatus: "pass" | "partial" | "fail";
  validations: ValidationResult[];
}

export interface SetupResult {
  success: boolean;
  message: string;
  output?: any;
}

class SshService {
  private baseUrl = `${API_BASE_URL}/ssh`;
  private prereqUrl = `${API_BASE_URL}/vm-prereq`;

  private logResponse(method: string, endpoint: string, data: any) {
    const { setLogData } = useLogStore.getState();
    const logEntry = {
      endpoint,
      response: data,
    };
    setLogData(JSON.stringify(logEntry, null, 2) + "\n\n");
  }

  async createServer(formData: FormData) {
    try {
      const response = await axios.post(`${this.baseUrl}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      this.logResponse("POST", "/ssh", response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("POST", "/ssh", { error: error?.response?.data });
      throw new Error(
        error?.response?.data?.message || "Failed to create server"
      );
    }
  }

  async deleteServer(id: number) {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      this.logResponse("DELETE", `/ssh/${id}`, response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("DELETE", `/ssh/${id}`, {
        error: error?.response?.data,
      });
      throw new Error(
        error?.response?.data?.message || "Failed to delete server"
      );
    }
  }

  async getAllData(): Promise<Server[]> {
    try {
      const response = await axios.get(`${this.baseUrl}`);
      this.logResponse("GET", "/ssh", response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("GET", "/ssh", { error: error?.response?.data });
      throw new Error(
        error?.response?.data?.message || "Failed to fetch servers"
      );
    }
  }

  async testConnection(id: number) {
    try {
      const response = await axios.get(`${this.baseUrl}/uptime/${id}`);
      this.logResponse("GET", `/ssh/uptime/${id}`, response.data);
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
      this.logResponse("GET", `/ssh/uptime/${id}`, {
        error: error?.response?.data,
      });
      console.error("Connection test error:", error);
      throw new Error(
        error?.response?.data?.message || "Connection test failed"
      );
    }
  }

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
        { params: options }
      );
      this.logResponse("GET", `/vm-prereq/validate/${serverId}`, response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("GET", `/vm-prereq/validate/${serverId}`, {
        error: error?.response?.data,
      });
      throw new Error(
        error?.response?.data?.message || "Failed to validate prerequisites"
      );
    }
  }

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
        { params: options }
      );
      this.logResponse(
        "GET",
        `/vm-prereq/validate/${serverId}/${checkKey}`,
        response.data
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("GET", `/vm-prereq/validate/${serverId}/${checkKey}`, {
        error: error?.response?.data,
      });
      throw new Error(
        error?.response?.data?.message || `Failed to validate ${checkKey}`
      );
    }
  }

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
      this.logResponse(
        "POST",
        `/vm-prereq/setup/${serverId}/user-group`,
        response.data
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("POST", `/vm-prereq/setup/${serverId}/user-group`, {
        error: error?.response?.data,
      });
      throw new Error(
        error?.response?.data?.message || "Failed to setup user and group"
      );
    }
  }

  async setupUlimit(
    serverId: number,
    username: string = "wmuser"
  ): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/ulimit/${serverId}`,
        { username }
      );
      this.logResponse(
        "POST",
        `/vm-prereq/setup/ulimit/${serverId}`,
        response.data
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("POST", `/vm-prereq/setup/ulimit/${serverId}`, {
        error: error?.response?.data,
      });
      throw new Error(
        error?.response?.data?.message || "Failed to setup ulimit"
      );
    }
  }

  async setupSysctl(serverId: number): Promise<SetupResult> {
    try {
      const response = await axios.post(
        `${this.prereqUrl}/setup/sysctl/${serverId}`
      );
      this.logResponse(
        "POST",
        `/vm-prereq/setup/sysctl/${serverId}`,
        response.data
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("POST", `/vm-prereq/setup/sysctl/${serverId}`, {
        error: error?.response?.data,
      });
      throw new Error(
        error?.response?.data?.message || "Failed to setup sysctl"
      );
    }
  }

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
      this.logResponse(
        "POST",
        `/vm-prereq/setup/${serverId}/jvm`,
        response.data
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("POST", `/vm-prereq/setup/${serverId}/jvm`, {
        error: error?.response?.data,
      });
      throw new Error(error?.response?.data?.message || "Failed to setup JVM");
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
        `${this.prereqUrl}/setup/all/${serverId}`,
        options || {}
      );
      this.logResponse(
        "POST",
        `/vm-prereq/setup/all/${serverId}`,
        response.data
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logResponse("POST", `/vm-prereq/setup/all/${serverId}`, {
        error: error?.response?.data,
      });
      throw new Error(
        error?.response?.data?.message || "Failed to setup prerequisites"
      );
    }
  }
}

export const sshService = new SshService();
