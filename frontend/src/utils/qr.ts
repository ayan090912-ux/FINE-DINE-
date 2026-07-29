import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#09090b', // Rich dark zinc
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Failed to generate QR Data URL', err);
    return '';
  }
}

export async function generateQrSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Failed to generate QR SVG', err);
    return '';
  }
}

export function printQrCard(
  restaurantName: string,
  logoUrl: string,
  tableNumber: string,
  tableName: string,
  qrDataUrl: string
) {
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print QR Card - Table ${tableNumber}</title>
        <style>
          @page {
            size: A6 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #09090b;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            -webkit-print-color-adjust: exact;
          }
          .qr-card {
            width: 100mm;
            height: 140mm;
            padding: 12mm 8mm;
            box-sizing: border-box;
            border: 2px solid #18181b;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
            background: #ffffff;
          }
          .header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
          .logo {
            width: 52px;
            height: 52px;
            object-fit: contain;
            border-radius: 8px;
          }
          .restaurant-name {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #09090b;
            margin: 0;
            text-transform: uppercase;
          }
          .table-pill {
            margin-top: 4px;
            background: #09090b;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            padding: 4px 16px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
          }
          .qr-wrapper {
            margin: 10px 0;
            padding: 12px;
            background: #ffffff;
            border: 2px dashed #e4e4e7;
            border-radius: 16px;
            display: inline-block;
          }
          .qr-image {
            width: 170px;
            height: 170px;
            display: block;
          }
          .footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }
          .scan-instruction {
            font-size: 16px;
            font-weight: 800;
            color: #09090b;
            margin: 0;
            letter-spacing: -0.2px;
          }
          .subtext {
            font-size: 11px;
            color: #71717a;
            margin: 0;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ''}
            <h1 class="restaurant-name">${restaurantName}</h1>
            <div class="table-pill">TABLE ${tableNumber} (${tableName})</div>
          </div>
          
          <div class="qr-wrapper">
            <img src="${qrDataUrl}" class="qr-image" alt="QR Code" />
          </div>

          <div class="footer">
            <p class="scan-instruction">📱 Scan to View Menu & Order</p>
            <p class="subtext">No App Download Required • Fast Contactless Service</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
