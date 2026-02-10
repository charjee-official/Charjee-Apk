import { BadRequestException, Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient | null = null;

  private getClient() {
    if (this.client) {
      return this.client;
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new BadRequestException('Supabase storage is not configured');
    }

    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    return this.client;
  }

  async uploadPublicFile(params: {
    bucket: string;
    path: string;
    data: Buffer;
    contentType?: string;
  }) {
    const client = this.getClient();
    const { data, error } = await client.storage.from(params.bucket).upload(params.path, params.data, {
      contentType: params.contentType ?? 'application/octet-stream',
      upsert: true,
    });

    if (error || !data) {
      throw new BadRequestException(`Upload failed: ${error?.message ?? 'unknown'}`);
    }

    const publicUrl = client.storage.from(params.bucket).getPublicUrl(data.path).data.publicUrl;
    return { path: data.path, publicUrl };
  }
}
