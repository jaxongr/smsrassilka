export interface TemplateVariables {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  [key: string]: string | undefined;
}

/**
 * Renders a message template by replacing placeholder variables.
 * Supports {firstName}, {lastName}, {phoneNumber}, and custom variables.
 *
 * @param template - Message template with {variable} placeholders
 * @param variables - Object containing variable values
 * @returns Rendered message string
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined ? value : match;
  });
}
