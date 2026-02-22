// app/utils/shareUrl.ts

export const getShareBaseUrl = (): string => {
    return 'https://booknookp2-8cn4xvvo0-emmaks-projects.vercel.app';


};

export const generateShareUrl = (path: string): string => {
  const baseUrl = getShareBaseUrl();
  return `${baseUrl}${path}`;
};