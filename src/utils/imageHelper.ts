export const getImageUrl = (imagePath: string | undefined): string | null => {
  if (!imagePath) return null;
  // Convert file path to URL
  return `${process.env.BASE_URL}/${imagePath}`;
}; 