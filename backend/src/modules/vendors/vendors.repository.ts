import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface VendorRecord {
  id: string;
  name: string;
  status: string;
  kyc: string;
  revenue: number;
}

export interface VendorProfileRecord {
  id: string;
  name: string;
  status: string;
  kyc: string;
  phone: string | null;
  email: string | null;
  vendorType: string | null;
  fullName: string | null;
  businessName: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  statusReason: string | null;
  registrationTs: string;
  statusUpdatedAt: string;
}

export interface VendorDocumentRecord {
  id: string;
  vendorId: string;
  documentCategory: string;
  documentType: string;
  fileUrl: string;
  storagePath: string;
  verificationStatus: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class VendorsRepository {
  private readonly logger = new Logger(VendorsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<VendorRecord[]> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT v.id,
             v.name,
             v.status,
             v.kyc_status,
             COALESCE(SUM(s.amount), 0) AS revenue
      FROM vendors v
      LEFT JOIN sessions s ON s.vendor_id = v.id
      GROUP BY v.id
      ORDER BY v.created_at DESC
      `,
    );
    return result.rows.map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      status: String(row.status),
      kyc: String(row.kyc_status),
      revenue: Number(row.revenue ?? 0),
    }));
  }

  async getById(id: string): Promise<VendorRecord | null> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT v.id,
             v.name,
             v.status,
             v.kyc_status,
             COALESCE(SUM(s.amount), 0) AS revenue
      FROM vendors v
      LEFT JOIN sessions s ON s.vendor_id = v.id
      WHERE v.id = $1
      GROUP BY v.id
      LIMIT 1
      `,
      [id],
    );
    if ((result.rowCount ?? 0) === 0) {
      return null;
    }
    const row = result.rows[0] as any;
    return {
      id: String(row?.id),
      name: String(row?.name),
      status: String(row?.status),
      kyc: String(row?.kyc_status),
      revenue: Number(row?.revenue ?? 0),
    };
  }

  async getProfileById(id: string): Promise<VendorProfileRecord | null> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id,
             name,
             status,
             kyc_status,
             phone,
             email,
             vendor_type,
             full_name,
             business_name,
             address_line,
             city,
             state,
             country,
             pincode,
             status_reason,
             registration_ts,
             status_updated_at
      FROM vendors
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );
    if ((result.rowCount ?? 0) === 0) {
      return null;
    }
    const row = result.rows[0] as any;
    return {
      id: String(row.id),
      name: String(row.name),
      status: String(row.status),
      kyc: String(row.kyc_status),
      phone: row.phone ? String(row.phone) : null,
      email: row.email ? String(row.email) : null,
      vendorType: row.vendor_type ? String(row.vendor_type) : null,
      fullName: row.full_name ? String(row.full_name) : null,
      businessName: row.business_name ? String(row.business_name) : null,
      addressLine: row.address_line ? String(row.address_line) : null,
      city: row.city ? String(row.city) : null,
      state: row.state ? String(row.state) : null,
      country: row.country ? String(row.country) : null,
      pincode: row.pincode ? String(row.pincode) : null,
      statusReason: row.status_reason ? String(row.status_reason) : null,
      registrationTs: String(row.registration_ts),
      statusUpdatedAt: String(row.status_updated_at),
    };
  }

  async getByPhone(phone: string): Promise<VendorProfileRecord | null> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id FROM vendors WHERE phone = $1 LIMIT 1`,
      [phone],
    );
    if ((result.rowCount ?? 0) === 0) {
      return null;
    }
    return this.getProfileById(String(result.rows[0].id));
  }

  async getByEmail(email: string): Promise<VendorProfileRecord | null> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id FROM vendors WHERE email = $1 LIMIT 1`,
      [email],
    );
    if ((result.rowCount ?? 0) === 0) {
      return null;
    }
    return this.getProfileById(String(result.rows[0].id));
  }

  async updateStatus(id: string, status: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `UPDATE vendors SET status=$2, status_updated_at=NOW() WHERE id=$1`,
        [id, status],
      );
    } catch (error) {
      this.logger.error(`Failed to update vendor status: ${String(error)}`);
    }
  }

  async updateStatusReason(id: string, reason: string | null) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE vendors SET status_reason=$2 WHERE id=$1`, [id, reason]);
    } catch (error) {
      this.logger.error(`Failed to update vendor status reason: ${String(error)}`);
    }
  }

  async updateKyc(id: string, kycStatus: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE vendors SET kyc_status=$2 WHERE id=$1`, [id, kycStatus]);
    } catch (error) {
      this.logger.error(`Failed to update vendor kyc: ${String(error)}`);
    }
  }

  async createVendor(id: string, name: string, status: string, kyc: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO vendors (id, name, status, kyc_status)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, status, kyc],
      );
    } catch (error) {
      this.logger.error(`Failed to create vendor: ${String(error)}`);
    }
  }

  async createVendorOnboarding(params: {
    id: string;
    name: string;
    status: string;
    kyc: string;
    phone?: string | null;
    email?: string | null;
  }) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO vendors (id, name, status, kyc_status, phone, email)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO NOTHING`,
        [params.id, params.name, params.status, params.kyc, params.phone ?? null, params.email ?? null],
      );
    } catch (error) {
      this.logger.error(`Failed to create vendor onboarding: ${String(error)}`);
    }
  }

  async updateVendorProfile(vendorId: string, profile: {
    vendorType?: string | null;
    fullName?: string | null;
    businessName?: string | null;
    phone?: string | null;
    email?: string | null;
    addressLine?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
    name?: string | null;
  }) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `UPDATE vendors
         SET vendor_type = COALESCE($2, vendor_type),
             full_name = COALESCE($3, full_name),
             business_name = COALESCE($4, business_name),
             phone = COALESCE($5, phone),
             email = COALESCE($6, email),
             address_line = COALESCE($7, address_line),
             city = COALESCE($8, city),
             state = COALESCE($9, state),
             country = COALESCE($10, country),
             pincode = COALESCE($11, pincode),
             name = COALESCE($12, name)
         WHERE id = $1`,
        [
          vendorId,
          profile.vendorType ?? null,
          profile.fullName ?? null,
          profile.businessName ?? null,
          profile.phone ?? null,
          profile.email ?? null,
          profile.addressLine ?? null,
          profile.city ?? null,
          profile.state ?? null,
          profile.country ?? null,
          profile.pincode ?? null,
          profile.name ?? null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to update vendor profile: ${String(error)}`);
    }
  }

  async upsertVendorDocument(params: {
    id: string;
    vendorId: string;
    documentCategory: string;
    documentType: string;
    fileUrl: string;
    storagePath: string;
    verificationStatus: string;
    expiryDate?: string | null;
  }) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO vendor_documents
         (id, vendor_id, document_category, document_type, file_url, storage_path, verification_status, expiry_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (vendor_id, document_type)
         DO UPDATE SET
           document_category = EXCLUDED.document_category,
           file_url = EXCLUDED.file_url,
           storage_path = EXCLUDED.storage_path,
           verification_status = EXCLUDED.verification_status,
           expiry_date = EXCLUDED.expiry_date,
           updated_at = NOW()`,
        [
          params.id,
          params.vendorId,
          params.documentCategory,
          params.documentType,
          params.fileUrl,
          params.storagePath,
          params.verificationStatus,
          params.expiryDate ?? null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to upsert vendor document: ${String(error)}`);
    }
  }

  async listVendorDocuments(vendorId: string): Promise<VendorDocumentRecord[]> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id,
             vendor_id,
             document_category,
             document_type,
             file_url,
             storage_path,
             verification_status,
             verified_by,
             verified_at,
             expiry_date,
             created_at,
             updated_at
      FROM vendor_documents
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      `,
      [vendorId],
    );
    return result.rows.map((row: any) => ({
      id: String(row.id),
      vendorId: String(row.vendor_id),
      documentCategory: String(row.document_category),
      documentType: String(row.document_type),
      fileUrl: String(row.file_url),
      storagePath: String(row.storage_path),
      verificationStatus: String(row.verification_status),
      verifiedBy: row.verified_by ? String(row.verified_by) : null,
      verifiedAt: row.verified_at ? String(row.verified_at) : null,
      expiryDate: row.expiry_date ? String(row.expiry_date) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }

  async updateDocumentStatus(params: {
    documentId: string;
    status: string;
    verifiedBy?: string | null;
  }) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `UPDATE vendor_documents
         SET verification_status=$2,
             verified_by=$3,
             verified_at=NOW(),
             updated_at=NOW()
         WHERE id=$1`,
        [params.documentId, params.status, params.verifiedBy ?? null],
      );
    } catch (error) {
      this.logger.error(`Failed to update document status: ${String(error)}`);
    }
  }

  async getDocumentStatuses(vendorId: string, types: string[]) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT document_type, verification_status
      FROM vendor_documents
      WHERE vendor_id = $1 AND document_type = ANY($2::text[])
      `,
      [vendorId, types],
    );
    return result.rows.map((row: any) => ({
      documentType: String(row.document_type),
      verificationStatus: String(row.verification_status),
    }));
  }

  async insertStatusHistory(params: {
    id: string;
    vendorId: string;
    status: string;
    reason?: string | null;
    actorRole: string;
    actorId?: string | null;
  }) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO vendor_status_history (id, vendor_id, status, reason, actor_role, actor_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          params.id,
          params.vendorId,
          params.status,
          params.reason ?? null,
          params.actorRole,
          params.actorId ?? null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to insert vendor status history: ${String(error)}`);
    }
  }

  async insertAuditLog(params: {
    id: string;
    vendorId: string;
    action: string;
    actorRole: string;
    actorId?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO vendor_audit_logs (id, vendor_id, action, actor_role, actor_id, metadata)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          params.id,
          params.vendorId,
          params.action,
          params.actorRole,
          params.actorId ?? null,
          params.metadata ?? null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to insert vendor audit log: ${String(error)}`);
    }
  }

  async createRefreshToken(params: {
    id: string;
    vendorId: string;
    tokenHash: string;
    expiresAt: string;
  }) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO vendor_refresh_tokens (id, vendor_id, token_hash, expires_at)
         VALUES ($1,$2,$3,$4)`,
        [params.id, params.vendorId, params.tokenHash, params.expiresAt],
      );
    } catch (error) {
      this.logger.error(`Failed to create refresh token: ${String(error)}`);
    }
  }

  async getRefreshTokenByHash(tokenHash: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, vendor_id, expires_at, revoked_at FROM vendor_refresh_tokens WHERE token_hash=$1 LIMIT 1`,
      [tokenHash],
    );
    return result.rows[0] as
      | { id: string; vendor_id: string; expires_at: string; revoked_at: string | null }
      | undefined;
  }

  async revokeRefreshToken(id: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE vendor_refresh_tokens SET revoked_at=NOW() WHERE id=$1`, [id]);
    } catch (error) {
      this.logger.error(`Failed to revoke refresh token: ${String(error)}`);
    }
  }
}
