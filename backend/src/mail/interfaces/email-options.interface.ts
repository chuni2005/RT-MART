export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface MailTemplateContext {
  [key: string]: any;
}
