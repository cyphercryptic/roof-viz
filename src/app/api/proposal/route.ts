import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PRO_PLANS = ['pro', 'business', 'business_pro'];

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Plan gate - Pro+ only
    const adminSupabase = createAdminClient();
    const { data: subscription } = await adminSupabase
      .from('subscriptions')
      .select('plan, status')
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!subscription || !PRO_PLANS.includes(subscription.plan)) {
      return NextResponse.json(
        { error: 'PDF proposals require a Pro plan or higher. Please upgrade to access this feature.', code: 'PLAN_REQUIRED' },
        { status: 403 }
      );
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json(
        { error: 'Your subscription is not active. Please update your billing.', code: 'SUBSCRIPTION_INACTIVE' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { visualization_id } = body;

    if (!visualization_id) {
      return NextResponse.json({ error: 'Missing required field: visualization_id' }, { status: 400 });
    }

    // 4. Fetch visualization with product data
    const { data: visualization, error: vizError } = await adminSupabase
      .from('visualizations')
      .select('*, product:products(*)')
      .eq('id', visualization_id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (vizError || !visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    if (visualization.status !== 'completed' || !visualization.result_image_path) {
      return NextResponse.json({ error: 'Visualization is not completed yet' }, { status: 400 });
    }

    // 5. Fetch tenant info
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('name, logo_url')
      .eq('id', profile.tenant_id)
      .single();

    // 6. Download images from Supabase storage
    const [originalResult, resultResult] = await Promise.all([
      adminSupabase.storage.from('house-photos').download(visualization.original_image_path),
      adminSupabase.storage.from('visualizations').download(visualization.result_image_path),
    ]);

    if (originalResult.error || !originalResult.data) {
      return NextResponse.json({ error: 'Failed to download original image' }, { status: 500 });
    }
    if (resultResult.error || !resultResult.data) {
      return NextResponse.json({ error: 'Failed to download result image' }, { status: 500 });
    }

    const originalImageBytes = new Uint8Array(await originalResult.data.arrayBuffer());
    const resultImageBytes = new Uint8Array(await resultResult.data.arrayBuffer());

    // Optionally download company logo
    let logoBytes: Uint8Array | null = null;
    if (tenant?.logo_url) {
      try {
        const logoResponse = await fetch(tenant.logo_url);
        if (logoResponse.ok) {
          logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
        }
      } catch {
        // Logo fetch failed — continue without it
      }
    }

    // 7. Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    let yPos = height - margin;

    // --- Company logo/name ---
    if (logoBytes) {
      try {
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const logoScale = Math.min(120 / logoImage.width, 40 / logoImage.height);
        const logoDims = logoImage.scale(logoScale);
        page.drawImage(logoImage, {
          x: margin,
          y: yPos - logoDims.height,
          width: logoDims.width,
          height: logoDims.height,
        });
        yPos -= logoDims.height + 10;
      } catch {
        // If PNG embed fails (e.g. JPEG logo), just show name
      }
    }

    if (tenant?.name) {
      page.drawText(tenant.name, {
        x: margin,
        y: yPos - 20,
        size: 18,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      yPos -= 35;
    }

    // --- Divider line ---
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPos -= 25;

    // --- Title ---
    page.drawText('Roof Visualization Proposal', {
      x: margin,
      y: yPos - 20,
      size: 22,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    yPos -= 45;

    // --- Customer info and date ---
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    page.drawText(`Date: ${dateStr}`, {
      x: margin,
      y: yPos,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPos -= 16;

    if (visualization.customer_name) {
      page.drawText(`Customer: ${visualization.customer_name}`, {
        x: margin,
        y: yPos,
        size: 10,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 16;
    }

    if (visualization.customer_address) {
      page.drawText(`Address: ${visualization.customer_address}`, {
        x: margin,
        y: yPos,
        size: 10,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 16;
    }

    yPos -= 15;

    // --- Before / After images side by side ---
    const imageAreaWidth = width - margin * 2;
    const imageWidth = (imageAreaWidth - 20) / 2; // 20px gap between images
    const imageHeight = 180;

    // Labels
    page.drawText('Before', {
      x: margin,
      y: yPos,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText('After', {
      x: margin + imageWidth + 20,
      y: yPos,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 8;

    // Embed images as PNG
    let originalImage;
    let resultImage;
    try {
      originalImage = await pdfDoc.embedPng(originalImageBytes);
    } catch {
      // Fall back to JPEG if PNG embed fails
      originalImage = await pdfDoc.embedJpg(originalImageBytes);
    }
    try {
      resultImage = await pdfDoc.embedPng(resultImageBytes);
    } catch {
      resultImage = await pdfDoc.embedJpg(resultImageBytes);
    }

    // Draw original (before) image
    page.drawImage(originalImage, {
      x: margin,
      y: yPos - imageHeight,
      width: imageWidth,
      height: imageHeight,
    });

    // Draw result (after) image
    page.drawImage(resultImage, {
      x: margin + imageWidth + 20,
      y: yPos - imageHeight,
      width: imageWidth,
      height: imageHeight,
    });

    yPos -= imageHeight + 25;

    // --- Product Details ---
    const product = visualization.product;
    if (product) {
      page.drawText('Product Details', {
        x: margin,
        y: yPos,
        size: 14,
        font: fontBold,
        color: rgb(0.15, 0.15, 0.15),
      });
      yPos -= 22;

      const details: [string, string][] = [
        ['Name', product.name],
        ['Brand', product.brand],
        ['Color', product.color],
      ];
      if (product.style) {
        details.push(['Style', product.style]);
      }

      for (const [label, value] of details) {
        page.drawText(`${label}:`, {
          x: margin,
          y: yPos,
          size: 10,
          font: fontBold,
          color: rgb(0.3, 0.3, 0.3),
        });
        page.drawText(value, {
          x: margin + 60,
          y: yPos,
          size: 10,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 16;
      }

      // Product description
      if (product.description) {
        yPos -= 8;
        page.drawText('Description:', {
          x: margin,
          y: yPos,
          size: 10,
          font: fontBold,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 16;

        // Wrap description text at ~80 chars per line
        const maxLineWidth = width - margin * 2;
        const words = product.description.split(' ');
        let line = '';
        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;
          const testWidth = fontRegular.widthOfTextAtSize(testLine, 10);
          if (testWidth > maxLineWidth) {
            page.drawText(line, {
              x: margin,
              y: yPos,
              size: 10,
              font: fontRegular,
              color: rgb(0.3, 0.3, 0.3),
            });
            yPos -= 14;
            line = word;
          } else {
            line = testLine;
          }
        }
        if (line) {
          page.drawText(line, {
            x: margin,
            y: yPos,
            size: 10,
            font: fontRegular,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPos -= 14;
        }
      }
    }

    // --- Footer ---
    page.drawLine({
      start: { x: margin, y: 50 },
      end: { x: width - margin, y: 50 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText('Generated with RoofViz', {
      x: margin,
      y: 35,
      size: 8,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.6),
    });

    // 8. Serialize and return PDF
    const pdfBytes = await pdfDoc.save();

    const filename = `proposal-${visualization_id}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('Proposal generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate proposal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
