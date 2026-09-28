// =========================================================================
// 🌐 إعدادات المنصة ورابط موقع السوشيال ميديا المجمع (PLATFORM & SOCIAL CONFIG)
// =========================================================================

/**
 * ضع هنا رابط موقعك الخارجي الجديد المجمع لكل روابط السوشيال ميديا.
 * تم ترك الرابط فارغاً كما طلبت، وعندما تجهز موقعك يمكنك وضع الرابط هنا مباشرة:
 * مثال: export const SOCIAL_HUB_URL: string = "https://your-social-hub.com";
 */
export const SOCIAL_HUB_URL: string = "";

/**
 * دالة مساعدة لجلب رابط موقع السوشيال ميديا المجمع (سواء من ملف الإعدادات أو المحفوظ محلياً)
 */
export const getSocialHubUrl = (): string => {
  if (SOCIAL_HUB_URL && SOCIAL_HUB_URL.trim().length > 0) {
    return SOCIAL_HUB_URL.trim();
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('custom_social_hub_url');
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  }
  return "";
};

export const setCustomSocialHubUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_social_hub_url', url.trim());
  }
};
