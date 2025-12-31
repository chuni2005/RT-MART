// Form validation types
export type ValidationError = string | null;

export interface PasswordStrength {
  level: "weak" | "medium" | "strong";
  score: number;
}

// Form input types
export interface FormInputProps {
  label: string;
  type?: string;
  id: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  maxLength?: number;
}
