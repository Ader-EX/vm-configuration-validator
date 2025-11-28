export class CreateSshListDto {
  name: string;
  address: string;
  port: string;
  username: string;
  passphrase?: string = '';
  userGroup?: number = 0;
  ulimit?: number = 0;
  securityLimits?: number = 0;
  sysctl?: number = 0;
  jvm?: number = 0;
  threadPool?: number = 0;
  garbageCollector?: number = 0;
}
// {
//   "name": "Production Server",
//   "address": "43.157.250.132",
//   "port": "22",
//   "username": "ubuntu"
// }
