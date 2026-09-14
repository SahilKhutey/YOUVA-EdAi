export interface PromptDefinition {
  key: string;
  version: string;
  purpose: string;
  systemTemplate: string;
  userTemplate: string;
  outputSchemaDescription?: string;
  active: boolean;
}
