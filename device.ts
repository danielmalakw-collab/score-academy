/**
 * Device Management for Student Single-Device Policy
 * المعرف الفريد للجهاز - يقيد حساب الطالب بجهاز واحد فقط
 * بينما يسمح للمدرس والمدير بالدخول من أي عدد من الأجهزة
 */

export const getClientDeviceId = (): string => {
  try {
    let devId = localStorage.getItem('platform_device_id');
    if (!devId) {
      const randomPart = Math.random().toString(36).substring(2, 12);
      const timePart = Date.now().toString(36);
      devId = `dev_${timePart}_${randomPart}`;
      localStorage.setItem('platform_device_id', devId);
    }
    return devId;
  } catch {
    return 'dev_browser';
  }
};
