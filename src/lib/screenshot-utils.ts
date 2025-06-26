import html2canvas from 'html2canvas-pro';

export interface ScreenshotOptions {
  filename?: string;
  scale?: number;
  backgroundColor?: string | null;
  width?: number;
  height?: number;
}

export const takeElementScreenshot = async (
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<void> => {
  const {
    filename = `screenshot-${Date.now()}.png`,
    scale = 2,
    backgroundColor = null,
    width,
    height
  } = options;

  try {
    console.log('📸 Taking screenshot...', { filename, scale, width, height });
    
    const canvas = await html2canvas(element, {
      backgroundColor,
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
      ...(width && height && {
        width,
        height,
        windowWidth: width,
        windowHeight: height
      })
    });

    // Convert to blob and download
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('✅ Screenshot saved:', filename);
          resolve();
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    });
    
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
    throw new Error('Failed to take screenshot');
  }
};

export const useScreenshot = () => {
  const takeScreenshot = async (
    elementRef: React.RefObject<HTMLElement>,
    options: ScreenshotOptions = {}
  ) => {
    if (!elementRef.current) {
      throw new Error('Element reference is null');
    }
    
    return takeElementScreenshot(elementRef.current, options);
  };

  return { takeScreenshot };
}; 