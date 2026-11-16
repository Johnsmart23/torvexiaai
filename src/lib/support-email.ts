export interface SupportEmailDetails {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const buildSupportMailto = ({ name, email, subject, message }: SupportEmailDetails) => {
  const body = `From: ${name}\nEmail: ${email}\n\n${message}`;
  return `mailto:torvexiaai@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
