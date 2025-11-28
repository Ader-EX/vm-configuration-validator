export interface ValidationDetails {
  [key: string]: any;
}

export interface ValidationItem {
  key: string;
  label: string;
  status: "pass" | "fail" | "error" | string;
  message: string;
  details?: ValidationDetails;
}

export interface ServerValidationResponse {
  serverId: number;
  serverName: string;
  timestamp: string;
  validations: ValidationItem[];
  overallStatus: string;
}

export class ServerValidationModel implements ServerValidationResponse {
  serverId: number;
  serverName: string;
  timestamp: string;
  validations: ValidationItem[];
  overallStatus: string;

  constructor(data: ServerValidationResponse) {
    this.serverId = data.serverId;
    this.serverName = data.serverName;
    this.timestamp = data.timestamp;
    this.validations = data.validations;
    this.overallStatus = data.overallStatus;
  }

  getFailed(): ValidationItem[] {
    return this.validations.filter((v) => v.status === "fail");
  }

  getPassed(): ValidationItem[] {
    return this.validations.filter((v) => v.status === "pass");
  }

  getErrors(): ValidationItem[] {
    return this.validations.filter((v) => v.status === "error");
  }

  getByKey(key: string): ValidationItem | undefined {
    return this.validations.find((v) => v.key === key);
  }
}
