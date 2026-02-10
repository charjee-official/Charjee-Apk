export const VENDOR_STATUSES = [
  'CREATED',
  'DOCUMENTS_SUBMITTED',
  'PENDING_VERIFICATION',
  'APPROVED',
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED',
] as const;

export const DOCUMENT_STATUSES = [
  'UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'RESUBMISSION_REQUIRED',
] as const;

export const DOCUMENT_CATEGORIES = [
  'identity',
  'business',
  'property',
  'finance',
  'branding',
  'legal',
] as const;

export const DOCUMENT_TYPES = [
  'aadhaar_front',
  'aadhaar_back',
  'pan_card',
  'vendor_photo',
  'signature',
  'gst_certificate',
  'business_registration',
  'trade_license',
  'electricity_bill',
  'commercial_power_approval',
  'rental_agreement',
  'owner_noc',
  'cancelled_cheque',
  'bank_passbook',
  'bank_account_proof',
  'upi_id',
  'profile_logo',
  'banner',
  'vendor_agreement',
  'declaration_form',
  'authorization_letter',
] as const;

export type VendorStatus = (typeof VENDOR_STATUSES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_DEFINITIONS: Record<DocumentType, { category: DocumentCategory; path: string }>
  = {
    aadhaar_front: { category: 'identity', path: 'identity/aadhaar' },
    aadhaar_back: { category: 'identity', path: 'identity/aadhaar' },
    pan_card: { category: 'identity', path: 'identity/pan' },
    vendor_photo: { category: 'identity', path: 'identity/photo' },
    signature: { category: 'identity', path: 'identity/signature' },
    gst_certificate: { category: 'business', path: 'business' },
    business_registration: { category: 'business', path: 'business' },
    trade_license: { category: 'business', path: 'business' },
    electricity_bill: { category: 'property', path: 'property/electricity' },
    commercial_power_approval: { category: 'property', path: 'property/commercial_approval' },
    rental_agreement: { category: 'property', path: 'property' },
    owner_noc: { category: 'property', path: 'property' },
    cancelled_cheque: { category: 'finance', path: 'finance' },
    bank_passbook: { category: 'finance', path: 'finance' },
    bank_account_proof: { category: 'finance', path: 'finance' },
    upi_id: { category: 'finance', path: 'finance' },
    profile_logo: { category: 'branding', path: 'branding/logo' },
    banner: { category: 'branding', path: 'branding/banner' },
    vendor_agreement: { category: 'legal', path: 'legal' },
    declaration_form: { category: 'legal', path: 'legal' },
    authorization_letter: { category: 'legal', path: 'legal' },
  };

export const REQUIRED_IDENTITY_DOCS: DocumentType[] = [
  'aadhaar_front',
  'aadhaar_back',
  'pan_card',
  'vendor_photo',
  'signature',
];

export const REQUIRED_PROPERTY_DOCS: DocumentType[] = [
  'electricity_bill',
  'commercial_power_approval',
];

export const REQUIRED_BUSINESS_DOCS: DocumentType[] = [
  'gst_certificate',
  'business_registration',
  'trade_license',
];

export const REQUIRED_FINANCE_DOCS: DocumentType[] = [
  'bank_account_proof',
];

export const FINANCE_ONE_OF_DOCS: DocumentType[] = [
  'cancelled_cheque',
  'bank_passbook',
];

export const REQUIRED_LEGAL_DOCS: DocumentType[] = [
  'vendor_agreement',
  'declaration_form',
];
