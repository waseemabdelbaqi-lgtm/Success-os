/**
 * SUCCESS OS — Global Integration Platform (GIP) catalog.
 * All external connectors are registered here. Business modules never call vendors directly.
 */

export const GIP_DEFAULT_CONFIG = Object.freeze({
  requireHubRouting: true,
  defaultTimeoutMs: 15000,
  maxRetries: 3,
  retryBackoffMs: 400,
  globalRateLimitPerMinute: 1200,
  connectorRateLimitPerMinute: 120,
  webhookSignatureRequired: true,
  secretRotationDays: 90,
  healthCheckIntervalMinutes: 15,
  logRetentionDays: 30,
  version: '1.0.0',
  updatedAt: null,
});

export const GIP_PROTOCOLS = Object.freeze([
  'rest',
  'graphql',
  'webhook',
  'sdk',
  'oauth2',
  'jwt',
  'api_key',
]);

export const GIP_AUTH_METHODS = Object.freeze([
  'api_key',
  'oauth2',
  'jwt',
  'basic',
  'hmac',
  'none',
]);

export const GIP_CATEGORIES = Object.freeze([
  { key: 'payments', label: 'Payment Gateways', labelAr: 'بوابات الدفع' },
  { key: 'communication', label: 'Communication Services', labelAr: 'خدمات التواصل' },
  { key: 'video', label: 'Video & Live Learning', labelAr: 'الفيديو والتعلم المباشر' },
  { key: 'ai', label: 'AI Providers', labelAr: 'مزودو الذكاء الاصطناعي' },
  { key: 'storage', label: 'Cloud Storage', labelAr: 'التخزين السحابي' },
  { key: 'auth', label: 'Authentication', labelAr: 'المصادقة' },
  { key: 'calendar', label: 'Calendar & Productivity', labelAr: 'التقويم والإنتاجية' },
  { key: 'maps', label: 'Maps & Location', labelAr: 'الخرائط والموقع' },
  { key: 'analytics', label: 'Analytics', labelAr: 'التحليلات' },
  { key: 'documents', label: 'Document Services', labelAr: 'خدمات المستندات' },
]);

function connector(def) {
  return Object.freeze({
    status: 'available',
    protocol: 'rest',
    authMethod: 'api_key',
    version: '1.0.0',
    installable: true,
    replaceable: true,
    ...def,
  });
}

/** Marketplace catalog — install/enable/disable without architecture changes. */
export const GIP_CONNECTOR_CATALOG = Object.freeze([
  // Payments
  connector({ key: 'stripe', category: 'payments', label: 'Stripe', labelAr: 'سترايب', envHints: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'], capabilities: ['charge', 'refund', 'payout', 'webhook'] }),
  connector({ key: 'paypal', category: 'payments', label: 'PayPal', labelAr: 'باي بال', envHints: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'], capabilities: ['charge', 'refund', 'payout'], authMethod: 'oauth2' }),
  connector({ key: 'hyperpay', category: 'payments', label: 'HyperPay', labelAr: 'هايبر باي', envHints: ['HYPERPAY_ENTITY_ID', 'HYPERPAY_ACCESS_TOKEN'], capabilities: ['charge', 'refund'] }),
  connector({ key: 'myfatoorah', category: 'payments', label: 'MyFatoorah', labelAr: 'ماي فاتورة', envHints: ['MYFATOORAH_API_KEY'], capabilities: ['charge', 'refund', 'invoice'] }),
  connector({ key: 'tap', category: 'payments', label: 'Tap Payments', labelAr: 'تاب', envHints: ['TAP_SECRET_KEY'], capabilities: ['charge', 'refund'] }),
  connector({ key: 'paytabs', category: 'payments', label: 'PayTabs', labelAr: 'باي تابس', envHints: ['PAYTABS_PROFILE_ID', 'PAYTABS_SERVER_KEY'], capabilities: ['charge', 'refund'] }),
  connector({ key: 'amazon_payment_services', category: 'payments', label: 'Amazon Payment Services', labelAr: 'خدمات أمازون للدفع', envHints: ['APS_ACCESS_CODE', 'APS_MERCHANT_IDENTIFIER'], capabilities: ['charge', 'refund'] }),
  connector({ key: 'network_international', category: 'payments', label: 'Network International', labelAr: 'نتورك إنترناشونال', envHints: ['NI_API_KEY'], capabilities: ['charge', 'refund'] }),
  connector({ key: 'visa', category: 'payments', label: 'Visa', labelAr: 'فيزا', envHints: ['VISA_API_KEY'], capabilities: ['charge'], protocol: 'sdk' }),
  connector({ key: 'mastercard', category: 'payments', label: 'Mastercard', labelAr: 'ماستركارد', envHints: ['MASTERCARD_API_KEY'], capabilities: ['charge'], protocol: 'sdk' }),
  connector({ key: 'apple_pay', category: 'payments', label: 'Apple Pay', labelAr: 'آبل باي', envHints: ['APPLE_PAY_MERCHANT_ID'], capabilities: ['charge'], protocol: 'sdk' }),
  connector({ key: 'google_pay', category: 'payments', label: 'Google Pay', labelAr: 'جوجل باي', envHints: ['GOOGLE_PAY_MERCHANT_ID'], capabilities: ['charge'], protocol: 'sdk' }),
  connector({ key: 'bank_transfer', category: 'payments', label: 'Bank Transfer', labelAr: 'تحويل بنكي', envHints: [], capabilities: ['payout', 'manual'], authMethod: 'none' }),
  connector({ key: 'future_payment', category: 'payments', label: 'Future Payment Providers', labelAr: 'مزودو دفع مستقبليون', envHints: [], capabilities: ['extensible'], status: 'placeholder', installable: true }),

  // Communication
  connector({ key: 'sendgrid', category: 'communication', label: 'SendGrid Email', labelAr: 'سندغريد', envHints: ['SENDGRID_API_KEY'], capabilities: ['email'] }),
  connector({ key: 'ses', category: 'communication', label: 'Amazon SES', labelAr: 'أمازون SES', envHints: ['AWS_SES_ACCESS_KEY', 'AWS_SES_SECRET_KEY'], capabilities: ['email'] }),
  connector({ key: 'twilio_sms', category: 'communication', label: 'Twilio SMS', labelAr: 'تويليو SMS', envHints: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], capabilities: ['sms'] }),
  connector({ key: 'whatsapp_business', category: 'communication', label: 'WhatsApp Business', labelAr: 'واتساب للأعمال', envHints: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID'], capabilities: ['whatsapp', 'webhook'], authMethod: 'oauth2' }),
  connector({ key: 'telegram_bot', category: 'communication', label: 'Telegram', labelAr: 'تيليجرام', envHints: ['TELEGRAM_BOT_TOKEN'], capabilities: ['telegram', 'webhook'] }),
  connector({ key: 'fcm', category: 'communication', label: 'Firebase Push', labelAr: 'إشعارات فورية', envHints: ['FCM_SERVER_KEY'], capabilities: ['push'] }),
  connector({ key: 'twilio_voice', category: 'communication', label: 'Twilio Voice', labelAr: 'مكالمات صوتية', envHints: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], capabilities: ['voice'] }),
  connector({ key: 'agora', category: 'communication', label: 'Agora Video Calls', labelAr: 'مكالمات فيديو', envHints: ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'], capabilities: ['video_call'] }),

  // Video & live learning
  connector({ key: 'zoom', category: 'video', label: 'Zoom', labelAr: 'زووم', envHints: ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'], capabilities: ['meeting', 'recording'], authMethod: 'oauth2' }),
  connector({ key: 'google_meet', category: 'video', label: 'Google Meet', labelAr: 'جوجل ميت', envHints: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], capabilities: ['meeting'], authMethod: 'oauth2' }),
  connector({ key: 'ms_teams', category: 'video', label: 'Microsoft Teams', labelAr: 'مايكروسوفت تيمز', envHints: ['MS_CLIENT_ID', 'MS_CLIENT_SECRET'], capabilities: ['meeting'], authMethod: 'oauth2' }),
  connector({ key: 'youtube', category: 'video', label: 'YouTube', labelAr: 'يوتيوب', envHints: ['YOUTUBE_API_KEY'], capabilities: ['publish', 'stream'] }),
  connector({ key: 'vimeo', category: 'video', label: 'Vimeo', labelAr: 'فيميو', envHints: ['VIMEO_ACCESS_TOKEN'], capabilities: ['publish', 'stream'] }),
  connector({ key: 'cloud_video_storage', category: 'video', label: 'Cloud Video Storage', labelAr: 'تخزين فيديو سحابي', envHints: ['VIDEO_STORAGE_BUCKET'], capabilities: ['store', 'cdn'] }),
  connector({ key: 'recording_services', category: 'video', label: 'Recording Services', labelAr: 'خدمات التسجيل', envHints: ['RECORDING_API_KEY'], capabilities: ['record', 'transcode'] }),

  // AI (aligned with existing provider registry ids)
  connector({ key: 'openai', category: 'ai', label: 'OpenAI', labelAr: 'أوبن إي آي', envHints: ['OPENAI_API_KEY', 'OPENAI_CONTENT_API_KEY'], capabilities: ['reasoning', 'lesson-writing', 'question-generation', 'translation', 'quality'] }),
  connector({ key: 'gemini', category: 'ai', label: 'Google Gemini', labelAr: 'جيميني', envHints: ['GEMINI_API_KEY'], capabilities: ['reasoning', 'lesson-writing', 'question-generation', 'translation', 'quality'] }),
  connector({ key: 'mistral-ocr', category: 'ai', label: 'Mistral Document AI', labelAr: 'ميسترال OCR', envHints: ['MISTRAL_API_KEY'], capabilities: ['ocr'] }),
  connector({ key: 'heygen', category: 'ai', label: 'HeyGen', labelAr: 'هاي جين', envHints: ['HEYGEN_API_KEY'], capabilities: ['avatar-video'] }),
  connector({ key: 'synthesia', category: 'ai', label: 'Synthesia', labelAr: 'سينثيسيا', envHints: ['SYNTHESIA_API_KEY'], capabilities: ['avatar-video'] }),
  connector({ key: 'elevenlabs', category: 'ai', label: 'ElevenLabs', labelAr: 'إليفن لابس', envHints: ['ELEVENLABS_API_KEY'], capabilities: ['voice'] }),
  connector({ key: 'deepl', category: 'ai', label: 'DeepL', labelAr: 'ديبل', envHints: ['DEEPL_API_KEY'], capabilities: ['translation'] }),

  // Storage
  connector({ key: 'aws_s3', category: 'storage', label: 'AWS S3', labelAr: 'أمازون S3', envHints: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'], capabilities: ['put', 'get', 'delete', 'signed_url'] }),
  connector({ key: 'gcs', category: 'storage', label: 'Google Cloud Storage', labelAr: 'جوجل كلاود', envHints: ['GCS_PROJECT_ID', 'GCS_BUCKET'], capabilities: ['put', 'get', 'delete'] }),
  connector({ key: 'azure_blob', category: 'storage', label: 'Azure Storage', labelAr: 'أزور', envHints: ['AZURE_STORAGE_CONNECTION_STRING'], capabilities: ['put', 'get', 'delete'] }),
  connector({ key: 'cloudflare_r2', category: 'storage', label: 'Cloudflare R2', labelAr: 'كلاودفلير R2', envHints: ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'], capabilities: ['put', 'get', 'delete'] }),
  connector({ key: 'local_storage', category: 'storage', label: 'Local Storage', labelAr: 'تخزين محلي', envHints: [], capabilities: ['put', 'get', 'delete'], authMethod: 'none' }),
  connector({ key: 'hybrid_storage', category: 'storage', label: 'Hybrid Storage', labelAr: 'تخزين هجين', envHints: [], capabilities: ['put', 'get', 'replicate'], authMethod: 'none' }),

  // Auth
  connector({ key: 'email_login', category: 'auth', label: 'Email Login', labelAr: 'دخول بالبريد', envHints: [], capabilities: ['login'], authMethod: 'none' }),
  connector({ key: 'phone_login', category: 'auth', label: 'Phone Login', labelAr: 'دخول بالهاتف', envHints: ['SMS_OTP_PROVIDER'], capabilities: ['login', 'otp'] }),
  connector({ key: 'google_oauth', category: 'auth', label: 'Google', labelAr: 'جوجل', envHints: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], capabilities: ['oauth', 'sso'], authMethod: 'oauth2' }),
  connector({ key: 'apple_oauth', category: 'auth', label: 'Apple', labelAr: 'آبل', envHints: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID'], capabilities: ['oauth', 'sso'], authMethod: 'oauth2' }),
  connector({ key: 'microsoft_oauth', category: 'auth', label: 'Microsoft', labelAr: 'مايكروسوفت', envHints: ['MS_CLIENT_ID', 'MS_CLIENT_SECRET'], capabilities: ['oauth', 'sso'], authMethod: 'oauth2' }),
  connector({ key: 'facebook_oauth', category: 'auth', label: 'Facebook', labelAr: 'فيسبوك', envHints: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'], capabilities: ['oauth'], authMethod: 'oauth2' }),
  connector({ key: 'linkedin_oauth', category: 'auth', label: 'LinkedIn', labelAr: 'لينكدإن', envHints: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'], capabilities: ['oauth'], authMethod: 'oauth2' }),
  connector({ key: 'sso', category: 'auth', label: 'Single Sign-On (SSO)', labelAr: 'تسجيل دخول موحد', envHints: ['SSO_ENTITY_ID', 'SSO_CERT'], capabilities: ['sso', 'saml'], authMethod: 'jwt' }),
  connector({ key: 'mfa', category: 'auth', label: 'Multi-Factor Authentication', labelAr: 'مصادقة متعددة العوامل', envHints: [], capabilities: ['mfa', 'totp'], authMethod: 'none' }),

  // Calendar
  connector({ key: 'google_calendar', category: 'calendar', label: 'Google Calendar', labelAr: 'تقويم جوجل', envHints: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], capabilities: ['events', 'sync'], authMethod: 'oauth2' }),
  connector({ key: 'outlook_calendar', category: 'calendar', label: 'Microsoft Outlook', labelAr: 'أوتلوك', envHints: ['MS_CLIENT_ID', 'MS_CLIENT_SECRET'], capabilities: ['events', 'sync'], authMethod: 'oauth2' }),
  connector({ key: 'ics_export', category: 'calendar', label: 'ICS Export', labelAr: 'تصدير ICS', envHints: [], capabilities: ['export'], authMethod: 'none' }),
  connector({ key: 'meeting_scheduling', category: 'calendar', label: 'Meeting Scheduling', labelAr: 'جدولة الاجتماعات', envHints: [], capabilities: ['schedule'], authMethod: 'none' }),
  connector({ key: 'task_sync', category: 'calendar', label: 'Task Synchronization', labelAr: 'مزامنة المهام', envHints: [], capabilities: ['tasks', 'sync'], authMethod: 'none' }),

  // Maps
  connector({ key: 'google_maps', category: 'maps', label: 'Google Maps', labelAr: 'خرائط جوجل', envHints: ['GOOGLE_MAPS_API_KEY'], capabilities: ['geocode', 'distance', 'search'] }),
  connector({ key: 'mapbox', category: 'maps', label: 'Mapbox', labelAr: 'ماب بوكس', envHints: ['MAPBOX_ACCESS_TOKEN'], capabilities: ['geocode', 'distance', 'search'] }),
  connector({ key: 'openstreetmap', category: 'maps', label: 'OpenStreetMap', labelAr: 'أوبن ستريت ماب', envHints: [], capabilities: ['geocode', 'search'], authMethod: 'none' }),

  // Analytics
  connector({ key: 'google_analytics', category: 'analytics', label: 'Google Analytics', labelAr: 'تحليلات جوجل', envHints: ['GA_MEASUREMENT_ID'], capabilities: ['events', 'conversion'] }),
  connector({ key: 'meta_pixel', category: 'analytics', label: 'Meta Pixel', labelAr: 'ميتا بيكسل', envHints: ['META_PIXEL_ID'], capabilities: ['events', 'conversion'] }),
  connector({ key: 'linkedin_insight', category: 'analytics', label: 'LinkedIn Insight', labelAr: 'لينكدإن إنسايت', envHints: ['LINKEDIN_PARTNER_ID'], capabilities: ['events', 'conversion'] }),
  connector({ key: 'custom_analytics', category: 'analytics', label: 'Custom Analytics', labelAr: 'تحليلات مخصصة', envHints: [], capabilities: ['events', 'conversion'], authMethod: 'none' }),

  // Documents
  connector({ key: 'pdf_generation', category: 'documents', label: 'PDF Generation', labelAr: 'توليد PDF', envHints: [], capabilities: ['pdf'], authMethod: 'none' }),
  connector({ key: 'digital_signatures', category: 'documents', label: 'Digital Signatures', labelAr: 'توقيع رقمي', envHints: ['ESIGN_API_KEY'], capabilities: ['sign', 'verify'] }),
  connector({ key: 'document_verification', category: 'documents', label: 'Document Verification', labelAr: 'التحقق من المستندات', envHints: ['DOC_VERIFY_API_KEY'], capabilities: ['verify'] }),
  connector({ key: 'ocr_service', category: 'documents', label: 'OCR', labelAr: 'التعرف الضوئي', envHints: ['MISTRAL_API_KEY'], capabilities: ['ocr'] }),
  connector({ key: 'file_conversion', category: 'documents', label: 'File Conversion', labelAr: 'تحويل الملفات', envHints: [], capabilities: ['convert'], authMethod: 'none' }),
]);

export function findGipConnector(key) {
  return GIP_CONNECTOR_CATALOG.find((c) => c.key === key) || null;
}

export function gipConnectorsByCategory(category) {
  return GIP_CONNECTOR_CATALOG.filter((c) => c.category === category);
}
