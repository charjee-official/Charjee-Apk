import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AuthService } from '../../auth/auth.service';
import { SupabaseService } from '../../database/supabase.service';
import {
  DOCUMENT_DEFINITIONS,
  FINANCE_ONE_OF_DOCS,
  REQUIRED_FINANCE_DOCS,
  REQUIRED_BUSINESS_DOCS,
  REQUIRED_IDENTITY_DOCS,
  REQUIRED_LEGAL_DOCS,
  REQUIRED_PROPERTY_DOCS,
  VENDOR_STATUSES,
} from './vendor.constants';
import { VendorsRepository } from './vendors.repository';

@Injectable()
export class VendorsService {
  constructor(
    private readonly repository: VendorsRepository,
    private readonly authService: AuthService,
    private readonly supabaseService: SupabaseService,
  ) {}

  listAll() {
    return this.repository.listAll();
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  getProfile(id: string) {
    return this.repository.getProfileById(id);
  }

  async approveVendor(id: string) {
    const missing = await this.getMissingRequiredApprovals(id);
    if (missing.length > 0) {
      throw new BadRequestException(`Missing approved documents: ${missing.join(', ')}`);
    }

    await this.repository.updateKyc(id, 'Approved');
    await this.setVendorStatus(id, 'APPROVED', 'admin', null, 'Documents approved');
    await this.setVendorStatus(id, 'ACTIVE', 'admin', null, 'Vendor activated');
    return this.getProfile(id);
  }

  async rejectVendor(id: string) {
    await this.repository.updateKyc(id, 'Rejected');
    await this.setVendorStatus(id, 'SUSPENDED', 'admin', null, 'Vendor rejected');
    return this.getProfile(id);
  }

  async suspendVendor(id: string) {
    await this.setVendorStatus(id, 'SUSPENDED', 'admin', null, 'Vendor suspended');
    return this.getProfile(id);
  }

  async createVendor(input: { name: string; status?: string; kyc?: string }) {
    const id = randomUUID();
    await this.repository.createVendor(
      id,
      input.name,
      input.status ?? 'Active',
      input.kyc ?? 'Pending',
    );
    return this.getProfile(id);
  }

  async requestVendorOtp(phone: string) {
    await this.authService.requestOtp(phone);
    return { sent: true };
  }

  async requestVendorPhoneVerification(vendorId: string, phone: string) {
    const vendor = await this.repository.getProfileById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.authService.requestOtp(phone);
    return { sent: true };
  }

  async verifyVendorPhoneVerification(vendorId: string, phone: string, otp: string) {
    const ok = await this.authService.verifyOtpOnly(phone, otp);
    if (!ok) {
      throw new UnauthorizedException();
    }

    await this.repository.updateVendorContactVerification({
      vendorId,
      phone,
      phoneVerified: true,
    });
    return { verified: true };
  }

  async requestVendorEmailVerification(vendorId: string, email: string) {
    const vendor = await this.repository.getProfileById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.authService.requestEmailOtp(email);
    return { sent: true };
  }

  async verifyVendorEmailVerification(vendorId: string, email: string, otp: string) {
    const ok = await this.authService.verifyEmailOtp(email, otp);
    if (!ok) {
      throw new UnauthorizedException();
    }

    await this.repository.updateVendorContactVerification({
      vendorId,
      email,
      emailVerified: true,
    });
    return { verified: true };
  }

  async verifyVendorOtp(phone: string, otp: string) {
    const ok = await this.authService.verifyOtpOnly(phone, otp);
    if (!ok) {
      throw new UnauthorizedException();
    }

    let vendor = await this.repository.getByPhone(phone);
    if (!vendor) {
      const id = randomUUID();
      await this.repository.createVendorOnboarding({
        id,
        name: phone,
        status: 'CREATED',
        kyc: 'Pending',
        phone,
      });
      await this.setVendorStatus(id, 'CREATED', 'vendor', id, 'Vendor registered by phone');
      vendor = await this.repository.getProfileById(id);
    }

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const tokens = await this.issueVendorTokens(vendor.id);
    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId: vendor.id,
      action: 'vendor.login.otp',
      actorRole: 'vendor',
      actorId: vendor.id,
    });

    return { vendorId: vendor.id, status: vendor.status, ...tokens };
  }

  async registerVendorEmail(email: string, password: string, phone?: string) {
    let vendor = await this.repository.getByEmail(email);
    if (!vendor) {
      const id = randomUUID();
      await this.repository.createVendorOnboarding({
        id,
        name: email,
        status: 'CREATED',
        kyc: 'Pending',
        email,
        phone: phone ?? null,
      });
      await this.setVendorStatus(id, 'CREATED', 'vendor', id, 'Vendor registered by email');
      vendor = await this.repository.getProfileById(id);
    }

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.authService.registerPassword(email, password, 'vendor', vendor.id);
    const tokens = await this.issueVendorTokens(vendor.id);
    return { vendorId: vendor.id, status: vendor.status, ...tokens };
  }

  async loginVendorEmail(email: string, password: string) {
    const credential = await this.authService.verifyPassword(email, password);
    if (!credential || credential.role !== 'vendor') {
      throw new UnauthorizedException();
    }

    const tokens = await this.issueVendorTokens(credential.subjectId);
    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId: credential.subjectId,
      action: 'vendor.login.password',
      actorRole: 'vendor',
      actorId: credential.subjectId,
    });
    return { vendorId: credential.subjectId, ...tokens };
  }

  async requestVendorPasswordReset(email: string) {
    const credential = await this.authService.getCredentialByUsername(email);
    if (!credential || credential.role !== 'vendor') {
      return { sent: true };
    }

    await this.authService.requestEmailOtp(email);
    return { sent: true };
  }

  async confirmVendorPasswordReset(email: string, otp: string, newPassword: string) {
    const credential = await this.authService.getCredentialByUsername(email);
    if (!credential || credential.role !== 'vendor') {
      throw new UnauthorizedException();
    }

    const ok = await this.authService.verifyEmailOtp(email, otp);
    if (!ok) {
      throw new UnauthorizedException();
    }

    await this.authService.updatePassword(email, newPassword);
    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId: credential.subject_id,
      action: 'vendor.password.reset',
      actorRole: 'vendor',
      actorId: credential.subject_id,
    });
    return { ok: true };
  }

  async exchangeVendorOauth(
    provider: string,
    input: { code: string; codeVerifier?: string; redirectUri: string },
  ) {
    const profile = await this.fetchOauthProfile(provider, input);
    if (!profile.providerUserId) {
      throw new BadRequestException('OAuth profile missing user id');
    }

    const vendorId = await this.resolveVendorFromOauth(provider, profile);
    const tokens = await this.issueVendorTokens(vendorId);
    return { vendorId, provider, ...tokens };
  }

  async refreshVendorToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.repository.getRefreshTokenByHash(tokenHash);
    if (!record) {
      throw new UnauthorizedException();
    }

    if (record.revoked_at) {
      throw new UnauthorizedException();
    }

    const expiresAt = new Date(record.expires_at).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      throw new UnauthorizedException();
    }

    await this.repository.revokeRefreshToken(record.id);
    const tokens = await this.issueVendorTokens(record.vendor_id);
    return { vendorId: record.vendor_id, ...tokens };
  }

  async updateVendorProfile(vendorId: string, input: {
    vendorType?: string;
    fullName?: string;
    businessName?: string;
    phone?: string;
    email?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) {
    const vendor = await this.repository.getProfileById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const name = input.businessName ?? input.fullName ?? vendor.name;
    await this.repository.updateVendorProfile(vendorId, {
      vendorType: input.vendorType ?? null,
      fullName: input.fullName ?? null,
      businessName: input.businessName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      addressLine: input.addressLine ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      pincode: input.pincode ?? null,
      name: name ?? null,
    });

    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId,
      action: 'vendor.profile.update',
      actorRole: 'vendor',
      actorId: vendorId,
    });

    return this.getProfile(vendorId);
  }

  async uploadVendorDocument(vendorId: string, input: {
    documentCategory: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    expiryDate?: string;
  }) {
    const vendor = await this.repository.getProfileById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const def = DOCUMENT_DEFINITIONS[input.documentType as keyof typeof DOCUMENT_DEFINITIONS];
    if (!def) {
      throw new BadRequestException('Unsupported document type');
    }
    if (def.category !== input.documentCategory) {
      throw new BadRequestException('Document category mismatch');
    }

    const storagePath = this.buildStoragePath(vendorId, input.documentType, input.fileName);
    await this.repository.upsertVendorDocument({
      id: randomUUID(),
      vendorId,
      documentCategory: input.documentCategory,
      documentType: input.documentType,
      fileUrl: input.fileUrl,
      storagePath,
      verificationStatus: 'UPLOADED',
      expiryDate: input.expiryDate ?? null,
    });

    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId,
      action: 'vendor.document.upload',
      actorRole: 'vendor',
      actorId: vendorId,
      metadata: {
        documentType: input.documentType,
        documentCategory: input.documentCategory,
      },
    });

    if (vendor.status === 'CREATED') {
      await this.setVendorStatus(vendorId, 'DOCUMENTS_SUBMITTED', 'vendor', vendorId, null);
    }

    return this.repository.listVendorDocuments(vendorId);
  }

  async uploadVendorDocumentFile(
    vendorId: string,
    input: {
      documentCategory: string;
      documentType: string;
      expiryDate?: string;
    },
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const vendor = await this.repository.getProfileById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const def = DOCUMENT_DEFINITIONS[input.documentType as keyof typeof DOCUMENT_DEFINITIONS];
    if (!def) {
      throw new BadRequestException('Unsupported document type');
    }
    if (def.category !== input.documentCategory) {
      throw new BadRequestException('Document category mismatch');
    }

    const safeName = (file.originalname || `document-${Date.now()}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = this.buildStoragePath(vendorId, input.documentType, safeName);
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'vendor-docs';
    const upload = await this.supabaseService.uploadPublicFile({
      bucket,
      path: storagePath.replace(/^\//, ''),
      data: file.buffer,
      contentType: file.mimetype,
    });

    await this.repository.upsertVendorDocument({
      id: randomUUID(),
      vendorId,
      documentCategory: input.documentCategory,
      documentType: input.documentType,
      fileUrl: upload.publicUrl,
      storagePath,
      verificationStatus: 'UPLOADED',
      expiryDate: input.expiryDate ?? null,
    });

    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId,
      action: 'vendor.document.upload',
      actorRole: 'vendor',
      actorId: vendorId,
      metadata: {
        documentType: input.documentType,
        documentCategory: input.documentCategory,
      },
    });

    if (vendor.status === 'CREATED') {
      await this.setVendorStatus(vendorId, 'DOCUMENTS_SUBMITTED', 'vendor', vendorId, null);
    }

    return this.repository.listVendorDocuments(vendorId);
  }

  async listVendorDocuments(vendorId: string) {
    return this.repository.listVendorDocuments(vendorId);
  }

  async submitForVerification(vendorId: string) {
    const missing = await this.getMissingRequiredUploads(vendorId);
    if (missing.length > 0) {
      throw new BadRequestException(`Missing mandatory documents: ${missing.join(', ')}`);
    }

    const vendor = await this.repository.getProfileById(vendorId);
    if (vendor?.vendorType === 'Business' && !vendor.businessName) {
      throw new BadRequestException('Business name is required for business vendors');
    }

    await this.setVendorStatus(
      vendorId,
      'PENDING_VERIFICATION',
      'vendor',
      vendorId,
      'Submitted for admin verification',
    );

    return this.getProfile(vendorId);
  }

  async reviewVendorDocument(params: {
    vendorId: string;
    documentId: string;
    status: string;
    adminId?: string | null;
    reason?: string | null;
  }) {
    await this.repository.updateDocumentStatus({
      documentId: params.documentId,
      status: params.status,
      verifiedBy: params.adminId ?? null,
    });

    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId: params.vendorId,
      action: 'vendor.document.review',
      actorRole: 'admin',
      actorId: params.adminId ?? null,
      metadata: {
        documentId: params.documentId,
        status: params.status,
        reason: params.reason ?? null,
      },
    });

    return this.repository.listVendorDocuments(params.vendorId);
  }

  async getOnboardingStatus(vendorId: string) {
    const profile = await this.repository.getProfileById(vendorId);
    if (!profile) {
      throw new NotFoundException('Vendor not found');
    }

    const docs = await this.repository.listVendorDocuments(vendorId);
    return { profile, documents: docs };
  }

  private async issueVendorTokens(vendorId: string) {
    const accessToken = this.authService.signToken({
      sub: vendorId,
      role: 'vendor',
      vendorId,
    }).accessToken;
    const refreshToken = await this.createRefreshToken(vendorId);
    return { accessToken, refreshToken };
  }

  private async createRefreshToken(vendorId: string) {
    const token = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlDays = Number(process.env.VENDOR_REFRESH_TTL_DAYS ?? 30);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
    await this.repository.createRefreshToken({
      id: randomUUID(),
      vendorId,
      tokenHash,
      expiresAt,
    });
    return token;
  }

  private async resolveVendorFromOauth(
    provider: string,
    profile: { providerUserId: string; email?: string | null; name?: string | null },
  ) {
    const existingIdentity = await this.authService.getOauthIdentity(
      provider,
      profile.providerUserId,
    );
    if (existingIdentity) {
      return String(existingIdentity.subject_id);
    }

    let vendor = profile.email ? await this.repository.getByEmail(profile.email) : null;
    if (!vendor) {
      const id = randomUUID();
      await this.repository.createVendorOnboarding({
        id,
        name: profile.name || profile.email || `${provider}:${profile.providerUserId}`,
        status: 'CREATED',
        kyc: 'Pending',
        email: profile.email ?? null,
      });
      await this.setVendorStatus(id, 'CREATED', 'vendor', id, `Vendor registered via ${provider}`);
      vendor = await this.repository.getProfileById(id);
    }

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (profile.email) {
      await this.repository.updateVendorEmailIfMissing(vendor.id, profile.email);
    }

    await this.authService.createOauthIdentity({
      id: randomUUID(),
      role: 'vendor',
      subjectId: vendor.id,
      provider,
      providerUserId: profile.providerUserId,
      email: profile.email ?? null,
      displayName: profile.name ?? null,
    });

    await this.repository.insertAuditLog({
      id: randomUUID(),
      vendorId: vendor.id,
      action: 'vendor.login.oauth',
      actorRole: 'vendor',
      actorId: vendor.id,
      metadata: { provider },
    });

    return vendor.id;
  }

  private async fetchOauthProfile(
    provider: string,
    input: { code: string; codeVerifier?: string; redirectUri: string },
  ) {
    if (provider === 'google') {
      return this.exchangeGoogle(input);
    }
    if (provider === 'facebook') {
      return this.exchangeFacebook(input);
    }
    if (provider === 'x') {
      return this.exchangeX(input);
    }

    throw new BadRequestException('Unsupported OAuth provider');
  }

  private async exchangeGoogle(input: { code: string; codeVerifier?: string; redirectUri: string }) {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth not configured');
    }

    const params = new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
    });
    if (input.codeVerifier) {
      params.set('code_verifier', input.codeVerifier);
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw new BadRequestException(`Google token exchange failed: ${text}`);
    }

    const token = (await tokenResponse.json()) as { access_token: string };
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!profileResponse.ok) {
      const text = await profileResponse.text();
      throw new BadRequestException(`Google profile fetch failed: ${text}`);
    }

    const profile = (await profileResponse.json()) as {
      sub?: string;
      id?: string;
      email?: string;
      name?: string;
    };

    return {
      providerUserId: profile.sub || profile.id || '',
      email: profile.email ?? null,
      name: profile.name ?? null,
    };
  }

  private async exchangeFacebook(input: { code: string; codeVerifier?: string; redirectUri: string }) {
    const clientId = process.env.FACEBOOK_OAUTH_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Facebook OAuth not configured');
    }

    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', input.redirectUri);
    tokenUrl.searchParams.set('code', input.code);

    const tokenResponse = await fetch(tokenUrl.toString());
    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw new BadRequestException(`Facebook token exchange failed: ${text}`);
    }

    const token = (await tokenResponse.json()) as { access_token: string };
    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set('fields', 'id,name,email');
    profileUrl.searchParams.set('access_token', token.access_token);
    const profileResponse = await fetch(profileUrl.toString());
    if (!profileResponse.ok) {
      const text = await profileResponse.text();
      throw new BadRequestException(`Facebook profile fetch failed: ${text}`);
    }

    const profile = (await profileResponse.json()) as {
      id?: string;
      email?: string;
      name?: string;
    };

    return {
      providerUserId: profile.id || '',
      email: profile.email ?? null,
      name: profile.name ?? null,
    };
  }

  private async exchangeX(input: { code: string; codeVerifier?: string; redirectUri: string }) {
    const clientId = process.env.X_OAUTH_CLIENT_ID;
    const clientSecret = process.env.X_OAUTH_CLIENT_SECRET;
    if (!clientId || !input.codeVerifier) {
      throw new BadRequestException('X OAuth not configured');
    }

    const params = new URLSearchParams({
      code: input.code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (clientSecret) {
      headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    }

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: params,
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw new BadRequestException(`X token exchange failed: ${text}`);
    }

    const token = (await tokenResponse.json()) as { access_token: string };
    const profileResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!profileResponse.ok) {
      const text = await profileResponse.text();
      throw new BadRequestException(`X profile fetch failed: ${text}`);
    }

    const profile = (await profileResponse.json()) as { data?: { id?: string; name?: string } };
    return {
      providerUserId: profile.data?.id ?? '',
      email: null,
      name: profile.data?.name ?? null,
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildStoragePath(vendorId: string, documentType: string, fileName: string) {
    const def = DOCUMENT_DEFINITIONS[documentType as keyof typeof DOCUMENT_DEFINITIONS];
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `/vendor-docs/${def.path}/${vendorId}/${safeName}`;
  }

  private async setVendorStatus(
    vendorId: string,
    status: (typeof VENDOR_STATUSES)[number],
    actorRole: string,
    actorId: string | null,
    reason: string | null,
  ) {
    await this.repository.updateStatus(vendorId, status);
    await this.repository.updateStatusReason(vendorId, reason);
    await this.repository.insertStatusHistory({
      id: randomUUID(),
      vendorId,
      status,
      reason,
      actorRole,
      actorId,
    });
  }

  private async getMissingRequiredUploads(vendorId: string) {
    const vendor = await this.repository.getProfileById(vendorId);
    const required = [
      ...REQUIRED_IDENTITY_DOCS,
      ...REQUIRED_PROPERTY_DOCS,
      ...REQUIRED_FINANCE_DOCS,
      ...REQUIRED_LEGAL_DOCS,
      ...(vendor?.vendorType === 'Business' ? REQUIRED_BUSINESS_DOCS : []),
      ...FINANCE_ONE_OF_DOCS,
    ];
    const statuses = await this.repository.getDocumentStatuses(vendorId, required);
    const statusMap = new Map(statuses.map((row) => [row.documentType, row.verificationStatus]));

    const missing = required.filter((type) => {
      const status = statusMap.get(type);
      return !status || status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED';
    });

    const hasFinanceOneOf = FINANCE_ONE_OF_DOCS.some((type) => {
      const status = statusMap.get(type);
      return status && status !== 'REJECTED' && status !== 'RESUBMISSION_REQUIRED';
    });

    const filtered: string[] = missing.filter(
      (type) => !FINANCE_ONE_OF_DOCS.includes(type),
    );
    if (!hasFinanceOneOf) {
      filtered.push('cancelled_cheque_or_bank_passbook');
    }

    return filtered;
  }

  private async getMissingRequiredApprovals(vendorId: string) {
    const vendor = await this.repository.getProfileById(vendorId);
    const required = [
      ...REQUIRED_IDENTITY_DOCS,
      ...REQUIRED_PROPERTY_DOCS,
      ...REQUIRED_FINANCE_DOCS,
      ...REQUIRED_LEGAL_DOCS,
      ...(vendor?.vendorType === 'Business' ? REQUIRED_BUSINESS_DOCS : []),
      ...FINANCE_ONE_OF_DOCS,
    ];
    const statuses = await this.repository.getDocumentStatuses(vendorId, required);
    const statusMap = new Map(statuses.map((row) => [row.documentType, row.verificationStatus]));

    const missing = required.filter((type) => statusMap.get(type) !== 'APPROVED');
    const hasFinanceOneOf = FINANCE_ONE_OF_DOCS.some((type) => statusMap.get(type) === 'APPROVED');

    const filtered: string[] = missing.filter(
      (type) => !FINANCE_ONE_OF_DOCS.includes(type),
    );
    if (!hasFinanceOneOf) {
      filtered.push('cancelled_cheque_or_bank_passbook');
    }

    return filtered;
  }
}
