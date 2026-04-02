import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit by user
  const adminSupabase = createAdminClient();
  const rateCheck = await checkRateLimit(adminSupabase, user.id, '/api/upload', RATE_LIMITS.upload);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  // Get the user's tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
      { status: 400 }
    );
  }

  // Validate file type
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a JPEG, PNG, or WebP image.' },
      { status: 400 }
    );
  }

  try {
    // Convert to buffer and resize/optimize
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use sharp to convert any format (including HEIC/HEIF from iPhones) to PNG
    // If sharp can't handle the format, fall back to using the raw buffer
    let optimized: Buffer;
    try {
      optimized = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch (sharpError) {
      // If sharp fails (e.g., HEIC without libheif), try converting via JPEG first
      // or just pass through as-is for formats sharp can't handle
      console.error('Sharp processing error:', sharpError);
      try {
        optimized = await sharp(buffer, { failOn: 'none' })
          .rotate()
          .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();
      } catch {
        return NextResponse.json(
          { error: 'Unsupported image format. Please use JPEG or PNG instead of HEIC.' },
          { status: 400 }
        );
      }
    }

    // Generate unique path
    const timestamp = Date.now();
    const path = `${profile.tenant_id}/${timestamp}/original.png`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('house-photos')
      .upload(path, optimized, {
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('house-photos')
      .getPublicUrl(path);

    return NextResponse.json({
      path,
      url: urlData.publicUrl,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
