export type Environment = 'test' | 'stg' | 'prod';

export interface EnvConfig {
  baseUrl:  string;
  apiUrl?:  string;
  apiKey?:  string;
  username: string;
  password: string;
}
