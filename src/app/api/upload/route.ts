import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { ImageValidationError, normalizeImageBuffer } from '@/lib/image-normalization';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit by user
  const adminSupabase = createAdminClient();
  const rateCheck = await checkRateLimit(adminSupabase, user.id, '/api/upload', RATE_LIMITS.upload);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck);

  // Get the user's tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid photo upload. Please choose the photo again.' }, { status: 400 });
  }
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file size
  if (!file.size || file.size > MAX_FILE_SIZE) {
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

    const optimized = await normalizeImageBuffer(buffer, { maxBytes: MAX_FILE_SIZE, maxDimension: 1024 });

    // Generate unique path
    const path = `${profile.tenant_id}/${crypto.randomUUID()}/original.png`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('house-photos')
      .upload(path, optimized, {
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Unable to save your photo. Please try again.' }, { status: 500 });
    }

    // The bucket is private — return a signed URL for the client-side preview.
    // Created with the user's own client so tenant RLS still applies.
    const { data: urlData, error: signError } = await supabase.storage
      .from('house-photos')
      .createSignedUrl(path, 60 * 60);

    if (signError || !urlData) {
      console.error('Signed URL error:', signError);
      return NextResponse.json({ error: 'Failed to prepare image preview' }, { status: 500 });
    }

    return NextResponse.json({
      path,
      url: urlData.signedUrl,
    });
  } catch (err) {
    if (err instanceof ImageValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Photo upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
