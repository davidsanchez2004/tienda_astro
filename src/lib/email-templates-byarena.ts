/**
 * Plantillas de Email Personalizadas BY ARENA
 * 
 * Colores de marca:
 * - Principal: #D4C5B9 (arena/beige)
 * - Secundario: #8B7355 (marrón cálido)
 * - Fondo: #FAF8F5 (crema suave)
 * - Texto: #333333
 * - Acento: #C4A35A (dorado)
 */

const BRAND_COLORS = {
  primary: '#D4C5B9',
  secondary: '#8B7355',
  background: '#FAF8F5',
  text: '#333333',
  accent: '#C4A35A',
  white: '#FFFFFF',
  lightGray: '#F5F1ED',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#E53935',
};

// URL del logo de BY ARENA (Cloudinary)
const LOGO_URL = 'https://res.cloudinary.com/dhs8kzjoo/image/upload/v1700000000/byarena/logo-byarena.png';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://byarena.com';
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || 'davidsanchezacosta0@gmail.com';
const SUPPORT_EMAIL = 'hola@byarena.com';
const WHATSAPP_NUMBER = import.meta.env.WHATSAPP_NUMBER || '34612345678';

/**
 * Base HTML template con el branding de BY ARENA
 */
function getBaseTemplate(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>BY ARENA</title>
  ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${BRAND_COLORS.background};
      color: ${BRAND_COLORS.text};
      line-height: 1.6;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${BRAND_COLORS.white};
    }
    
    .header {
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
      padding: 30px 20px;
      text-align: center;
    }
    
    .logo {
      max-width: 180px;
      height: auto;
    }
    
    .logo-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 600;
      color: ${BRAND_COLORS.white};
      letter-spacing: 4px;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .tagline {
      font-size: 12px;
      color: rgba(255,255,255,0.9);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 8px;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      color: ${BRAND_COLORS.secondary};
      margin-bottom: 20px;
    }
    
    .highlight-box {
      background: ${BRAND_COLORS.lightGray};
      border-left: 4px solid ${BRAND_COLORS.accent};
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .order-number {
      font-size: 28px;
      font-weight: 600;
      color: ${BRAND_COLORS.secondary};
      font-family: 'Playfair Display', Georgia, serif;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .status-paid { background: #E8F5E9; color: #2E7D32; }
    .status-shipped { background: #E3F2FD; color: #1565C0; }
    .status-delivered { background: ${BRAND_COLORS.accent}; color: ${BRAND_COLORS.white}; }
    .status-pending { background: #FFF3E0; color: #EF6C00; }
    .status-return { background: #FCE4EC; color: #C2185B; }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .items-table th {
      background: ${BRAND_COLORS.secondary};
      color: ${BRAND_COLORS.white};
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .items-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #eee;
    }
    
    .items-table tr:last-child td {
      border-bottom: none;
    }
    
    .total-row {
      background: ${BRAND_COLORS.lightGray};
      font-weight: 600;
    }
    
    .total-amount {
      font-size: 22px;
      color: ${BRAND_COLORS.secondary};
      font-family: 'Playfair Display', Georgia, serif;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
      color: ${BRAND_COLORS.white} !important;
      padding: 14px 35px;
      text-decoration: none;
      border-radius: 30px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(139, 115, 85, 0.3);
    }
    
    .secondary-button {
      display: inline-block;
      background: transparent;
      color: ${BRAND_COLORS.secondary} !important;
      padding: 12px 30px;
      text-decoration: none;
      border: 2px solid ${BRAND_COLORS.secondary};
      border-radius: 30px;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 10px 5px;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, ${BRAND_COLORS.primary}, transparent);
      margin: 30px 0;
    }
    
    .info-grid {
      display: table;
      width: 100%;
      margin: 20px 0;
    }
    
    .info-item {
      display: table-row;
    }
    
    .info-label {
      display: table-cell;
      padding: 8px 0;
      color: #666;
      font-size: 14px;
      width: 40%;
    }
    
    .info-value {
      display: table-cell;
      padding: 8px 0;
      font-weight: 500;
      color: ${BRAND_COLORS.text};
    }
    
    .discount-code-box {
      background: linear-gradient(135deg, ${BRAND_COLORS.accent} 0%, #D4AF37 100%);
      color: ${BRAND_COLORS.white};
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      margin: 25px 0;
    }
    
    .discount-code {
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 3px;
      background: ${BRAND_COLORS.white};
      color: ${BRAND_COLORS.secondary};
      padding: 15px 25px;
      border-radius: 8px;
      display: inline-block;
      margin: 15px 0;
    }
    
    .discount-value {
      font-size: 48px;
      font-weight: 700;
      font-family: 'Playfair Display', Georgia, serif;
    }
    
    .footer {
      background: ${BRAND_COLORS.lightGray};
      padding: 30px;
      text-align: center;
    }
    
    .footer-logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      color: ${BRAND_COLORS.secondary};
      letter-spacing: 3px;
      margin-bottom: 15px;
    }
    
    .social-links {
      margin: 20px 0;
    }
    
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: ${BRAND_COLORS.secondary};
      text-decoration: none;
      font-size: 14px;
    }
    
    .footer-text {
      font-size: 12px;
      color: #888;
      margin: 5px 0;
    }
    
    .footer-links a {
      color: ${BRAND_COLORS.secondary};
      text-decoration: none;
      margin: 0 10px;
      font-size: 12px;
    }
    
    .whatsapp-box {
      background: #25D366;
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      margin: 20px 0;
      display: inline-block;
    }
    
    .whatsapp-box a {
      color: white;
      text-decoration: none;
      font-weight: 600;
    }
    
    @media only screen and (max-width: 600px) {
      .content { padding: 25px 20px; }
      .greeting { font-size: 20px; }
      .order-number { font-size: 22px; }
      .discount-code { font-size: 24px; padding: 12px 18px; }
      .discount-value { font-size: 36px; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `;
}

/**
 * Header del email
 */
function getHeader(): string {
  return `
    <div class="header">
      <h1 class="logo-text">BY ARENA</h1>
      <p class="tagline">Bisutería & Complementos Premium</p>
    </div>
  `;
}

/**
 * Footer del email
 */
function getFooter(): string {
  return `
    <div class="footer">
      <div class="footer-logo">BY ARENA</div>
      
      <div class="social-links">
        <a href="https://instagram.com/byarena" class="social-link">Instagram</a>
        <a href="https://tiktok.com/@byarena" class="social-link">TikTok</a>
      </div>
      
      <div class="footer-links">
        <a href="${SITE_URL}">Tienda</a>
        <a href="${SITE_URL}/contacto">Contacto</a>
        <a href="${SITE_URL}/faq">FAQ</a>
        <a href="${SITE_URL}/devoluciones">Devoluciones</a>
      </div>
      
      <p class="footer-text" style="margin-top: 20px;">
        ¿Necesitas ayuda? Escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLORS.secondary};">${SUPPORT_EMAIL}</a>
      </p>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} BY ARENA - Todos los derechos reservados
      </p>
      
      <p class="footer-text" style="font-size: 10px; color: #aaa;">
        Este email fue enviado porque realizaste una acción en nuestra tienda.<br>
        Si no reconoces esta actividad, contacta con nosotros inmediatamente.
      </p>
    </div>
  `;
}

// =====================================================
// PLANTILLAS DE EMAIL
// =====================================================

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  discountCode?: string;
  total: number;
  shippingAddress: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    type?: string;
  };
  shippingMethod: 'home' | 'pickup';
  paymentMethod?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

/**
 * Email de confirmación de pedido - Cliente
 */
export function generateOrderConfirmationCustomer(data: OrderEmailData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 15px 12px; border-bottom: 1px solid #eee;">
        <strong style="color: ${BRAND_COLORS.secondary};">${item.name}</strong>
      </td>
      <td style="padding: 15px 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 15px 12px; border-bottom: 1px solid #eee; text-align: right;">
        €${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const shippingAddressHTML = data.shippingMethod === 'pickup' 
    ? `<p><strong>Recogida en tienda:</strong> Punto de recogida BY ARENA</p>`
    : `
      <p>${data.shippingAddress.street || ''}</p>
      <p>${data.shippingAddress.postalCode || ''} ${data.shippingAddress.city || ''}</p>
      <p>${data.shippingAddress.country || 'España'}</p>
    `;

  const content = `
    ${getHeader()}
    
    <div class="content">
      <h2 class="greeting">Gracias por tu pedido, ${data.customerName}!</h2>
      
      <p>Tu pedido ha sido confirmado y estamos preparándolo con mucho cariño.</p>
      
      <div class="highlight-box">
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Número de pedido</p>
        <p class="order-number">#${data.orderNumber}</p>
        <span class="status-badge status-paid">Pago confirmado</span>
      </div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif; margin-top: 30px;">
        Articulos de tu pedido
      </h3>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr style="background: ${BRAND_COLORS.lightGray};">
            <td colspan="2" style="padding: 12px; text-align: right;">Subtotal:</td>
            <td style="padding: 12px; text-align: right;">€${data.subtotal.toFixed(2)}</td>
          </tr>
          ${data.discount ? `
          <tr style="background: #FFF8E1;">
            <td colspan="2" style="padding: 12px; text-align: right; color: ${BRAND_COLORS.accent};">
              Descuento ${data.discountCode ? `(${data.discountCode})` : ''}:
            </td>
            <td style="padding: 12px; text-align: right; color: ${BRAND_COLORS.accent};">-€${data.discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right;">Envío:</td>
            <td style="padding: 12px; text-align: right;">${data.shippingCost === 0 ? 'Gratis' : `€${data.shippingCost.toFixed(2)}`}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2" style="padding: 15px 12px; text-align: right; font-size: 16px;">Total:</td>
            <td style="padding: 15px 12px; text-align: right;">
              <span class="total-amount">€${data.total.toFixed(2)}</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif;">
        Direccion de envio
      </h3>
      
      <div style="background: ${BRAND_COLORS.lightGray}; padding: 20px; border-radius: 8px;">
        ${shippingAddressHTML}
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif;">
        ¿Qué sigue?
      </h3>
      
      <div style="background: #E8F5E9; border-radius: 8px; padding: 20px; margin: 15px 0;">
        <p style="margin: 0;">
          <strong>1.</strong> Estamos preparando tu pedido<br>
          <strong>2.</strong> Recibirás un email cuando sea enviado<br>
          <strong>3.</strong> Podrás rastrear tu paquete en todo momento
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/mis-pedidos" class="cta-button">Ver mi pedido</a>
      </div>
      
      <div style="text-align: center; margin-top: 15px;">
        <a href="${SITE_URL}/api/invoice/${data.orderId}" style="display: inline-block; background: #555; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          📄 Descargar Factura
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <div class="whatsapp-box">
          Dudas? <a href="https://wa.me/${WHATSAPP_NUMBER}">Escribenos por WhatsApp</a>
        </div>
      </div>
    </div>
    
    ${getFooter()}
  `;

  return getBaseTemplate(content, `Tu pedido #${data.orderNumber} ha sido confirmado!`);
}

/**
 * Email de nuevo pedido - Admin
 */
export function generateOrderNotificationAdmin(data: OrderEmailData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const shippingAddressHTML = data.shippingMethod === 'pickup' 
    ? `<strong>RECOGIDA EN TIENDA</strong>`
    : `${data.shippingAddress.street || ''}, ${data.shippingAddress.postalCode || ''} ${data.shippingAddress.city || ''}`;

  const content = `
    ${getHeader()}
    
    <div class="content">
      <h2 class="greeting">Nuevo Pedido Recibido</h2>
      
      <div class="highlight-box" style="background: #E3F2FD; border-left-color: #1976D2;">
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">PEDIDO</p>
        <p class="order-number" style="color: #1976D2;">#${data.orderNumber}</p>
        <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">€${data.total.toFixed(2)}</p>
      </div>
      
      <h3 style="color: ${BRAND_COLORS.secondary};">Datos del Cliente</h3>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Nombre:</span>
          <span class="info-value">${data.customerName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span class="info-value">${data.customerEmail}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Envío:</span>
          <span class="info-value">${data.shippingMethod === 'pickup' ? 'Recogida en tienda' : 'A domicilio'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Dirección:</span>
          <span class="info-value">${shippingAddressHTML}</span>
        </div>
      </div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; margin-top: 30px;">Productos</h3>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          ${data.discount ? `
          <tr style="background: #FFF8E1;">
            <td colspan="2" style="padding: 12px;">Descuento ${data.discountCode || ''}</td>
            <td style="padding: 12px; text-align: right;">-€${data.discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="2" style="padding: 15px 12px;">
              <strong>TOTAL</strong>
            </td>
            <td style="padding: 15px 12px; text-align: right;">
              <span style="font-size: 20px; font-weight: bold;">€${data.total.toFixed(2)}</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/admin/dashboard" class="cta-button" style="background: #1976D2;">
          Gestionar Pedido
        </a>
      </div>
    </div>
    
    <div class="footer" style="background: #E3F2FD;">
      <p class="footer-text">
        Este es un email de notificación automática para administradores.
      </p>
    </div>
  `;

  return getBaseTemplate(content, `[Nuevo Pedido] #${data.orderNumber} - ${data.total.toFixed(2)}€`);
}

/**
 * Email de pedido enviado - Cliente
 */
export function generateShippingNotificationCustomer(data: OrderEmailData): string {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <h2 class="greeting">Tu pedido esta en camino!</h2>
      
      <p>Hola ${data.customerName},</p>
      <p>¡Buenas noticias! Tu pedido ha sido enviado y pronto estará contigo.</p>
      
      <div class="highlight-box">
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">Número de pedido</p>
        <p class="order-number">#${data.orderNumber}</p>
        <span class="status-badge status-shipped">Enviado</span>
      </div>
      
      ${data.trackingNumber ? `
      <div style="background: #E3F2FD; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; color: #1565C0; font-weight: 600;">NÚMERO DE SEGUIMIENTO</p>
        <p style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #1976D2; background: white; padding: 12px 20px; border-radius: 8px; display: inline-block;">
          ${data.trackingNumber}
        </p>
        ${data.carrier ? `<p style="margin: 15px 0 0 0; color: #666;">Transportista: <strong>${data.carrier}</strong></p>` : ''}
        ${data.estimatedDelivery ? `<p style="margin: 10px 0 0 0; color: #666;">Entrega estimada: <strong>${data.estimatedDelivery}</strong></p>` : ''}
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/rastreo?tracking=${data.trackingNumber || ''}" class="cta-button">
          Rastrear mi pedido
        </a>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif;">
        Direccion de entrega
      </h3>
      
      <div style="background: ${BRAND_COLORS.lightGray}; padding: 20px; border-radius: 8px;">
        ${data.shippingMethod === 'pickup' 
          ? `<p><strong>Recogida en tienda:</strong> Punto de recogida BY ARENA</p>`
          : `
            <p>${data.shippingAddress.street || ''}</p>
            <p>${data.shippingAddress.postalCode || ''} ${data.shippingAddress.city || ''}</p>
          `
        }
      </div>
      
      <div style="background: #FFF8E1; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0;">
          <strong>Consejo:</strong> Asegurate de tener a alguien disponible para recibir el paquete. 
          Si no hay nadie, el repartidor dejará un aviso.
        </p>
      </div>
    </div>
    
    ${getFooter()}
  `;

  return getBaseTemplate(content, `Tu pedido #${data.orderNumber} ha sido enviado`);
}

/**
 * Email de pedido entregado - Cliente
 */
export function generateDeliveryConfirmationCustomer(data: OrderEmailData): string {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="text-align: center; padding: 20px 0;">
        <h2 class="greeting" style="margin-top: 15px;">Tu pedido ha llegado!</h2>
      </div>
      
      <p>Hola ${data.customerName},</p>
      <p>Tu pedido <strong>#${data.orderNumber}</strong> ha sido entregado con éxito.</p>
      
      <div class="highlight-box" style="background: linear-gradient(135deg, ${BRAND_COLORS.accent}20, ${BRAND_COLORS.primary}30); border-left-color: ${BRAND_COLORS.accent};">
        <span class="status-badge status-delivered">Entregado</span>
        <p style="margin-top: 15px;">¡Esperamos que disfrutes de tus nuevos artículos!</p>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif; text-align: center;">
        ¿Te ha gustado tu compra?
      </h3>
      
      <p style="text-align: center;">
        Tu opinión es muy importante para nosotros. Nos encantaría saber qué te han parecido tus productos.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${SITE_URL}/contacto" class="cta-button">
          Déjanos tu opinión
        </a>
      </div>
      
      <div style="background: ${BRAND_COLORS.lightGray}; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
        <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">
          Si tienes cualquier problema con tu pedido, estamos aquí para ayudarte:
        </p>
        <a href="${SITE_URL}/devoluciones" class="secondary-button">Solicitar devolución</a>
        <a href="${SITE_URL}/contacto" class="secondary-button">Contactar soporte</a>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: ${BRAND_COLORS.secondary}; font-weight: 600;">Gracias por confiar en BY ARENA!</p>
      </div>
    </div>
    
    ${getFooter()}
  `;

  return getBaseTemplate(content, `Tu pedido #${data.orderNumber} ha sido entregado`);
}

/**
 * Email de pedido entregado - Admin (notificación)
 */
export function generateDeliveryNotificationAdmin(data: OrderEmailData): string {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <h2 class="greeting">[Completado] Pedido Entregado</h2>
      
      <div class="highlight-box" style="background: #E8F5E9; border-left-color: #4CAF50;">
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">PEDIDO COMPLETADO</p>
        <p class="order-number" style="color: #2E7D32;">#${data.orderNumber}</p>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Cliente:</span>
          <span class="info-value">${data.customerName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span class="info-value">${data.customerEmail}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Total:</span>
          <span class="info-value">€${data.total.toFixed(2)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Estado:</span>
          <span class="info-value" style="color: #2E7D32;">Entregado</span>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/admin/dashboard" class="cta-button" style="background: #4CAF50;">
          Ver Dashboard
        </a>
      </div>
    </div>
    
    <div class="footer" style="background: #E8F5E9;">
      <p class="footer-text">Notificación automática de pedido completado.</p>
    </div>
  `;

  return getBaseTemplate(content, `[Entregado] Pedido #${data.orderNumber}`);
}

// =====================================================
// PLANTILLAS DE DEVOLUCIONES
// =====================================================

export interface ReturnEmailData {
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  description?: string;
  itemsCount: number;
  refundAmount: number;
  status?: string;
}

/**
 * Email de solicitud de devolución - Admin
 */
export function generateReturnRequestAdmin(data: ReturnEmailData): string {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <h2 class="greeting" style="color: #C2185B;">Nueva Solicitud de Devolucion</h2>
      
      <div class="highlight-box" style="background: #FCE4EC; border-left-color: #C2185B;">
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">DEVOLUCION</p>
        <p class="order-number" style="color: #C2185B;">#${data.returnNumber}</p>
        <span class="status-badge status-return">Pendiente de revision</span>
      </div>
      
      <h3 style="color: ${BRAND_COLORS.secondary};">Detalles de la Solicitud</h3>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Pedido original:</span>
          <span class="info-value">#${data.orderNumber}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Cliente:</span>
          <span class="info-value">${data.customerName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span class="info-value">${data.customerEmail}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Artículos:</span>
          <span class="info-value">${data.itemsCount} producto(s)</span>
        </div>
        <div class="info-item">
          <span class="info-label">Importe a reembolsar:</span>
          <span class="info-value" style="font-size: 18px; color: #C2185B;">€${data.refundAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: ${BRAND_COLORS.secondary};">Motivo de la Devolucion</h3>
      
      <div style="background: #FFF3E0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
        <p style="margin: 0; font-weight: 600; color: #E65100;">${data.reason}</p>
        ${data.description ? `<p style="margin: 15px 0 0 0; color: #666;">${data.description}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/admin/dashboard" class="cta-button" style="background: #C2185B;">
          Gestionar Devolución
        </a>
      </div>
      
      <div style="background: #FFEBEE; border-radius: 8px; padding: 15px; margin-top: 25px;">
        <p style="margin: 0; font-size: 13px; color: #C62828;">
          <strong>Accion requerida:</strong> Por favor, revisa esta solicitud y responde al cliente lo antes posible.
        </p>
      </div>
    </div>
    
    <div class="footer" style="background: #FCE4EC;">
      <p class="footer-text">Notificación automática de devolución.</p>
    </div>
  `;

  return getBaseTemplate(content, `Nueva devolución #${data.returnNumber} - ${data.refundAmount.toFixed(2)}€`);
}

/**
 * Email de confirmación de devolución - Cliente
 */
export function generateReturnConfirmationCustomer(data: ReturnEmailData): string {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <h2 class="greeting">Solicitud de Devolucion Recibida</h2>
      
      <p>Hola ${data.customerName},</p>
      <p>Hemos recibido tu solicitud de devolución y la estamos revisando.</p>
      
      <div class="highlight-box">
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">Número de devolución</p>
        <p class="order-number">#${data.returnNumber}</p>
        <span class="status-badge status-pending">En revision</span>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Pedido original:</span>
          <span class="info-value">#${data.orderNumber}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Motivo:</span>
          <span class="info-value">${data.reason}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Importe:</span>
          <span class="info-value">€${data.refundAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif;">
        ¿Qué pasa ahora?
      </h3>
      
      <div style="background: ${BRAND_COLORS.lightGray}; padding: 20px; border-radius: 8px;">
        <p style="margin: 0;">
          <strong>1.</strong> Revisaremos tu solicitud en 24-48 horas<br>
          <strong>2.</strong> Te enviaremos las instrucciones de devolución<br>
          <strong>3.</strong> Una vez recibido el producto, procesaremos el reembolso
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/mis-pedidos" class="cta-button">
          Ver mis pedidos
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <div class="whatsapp-box">
          Dudas? <a href="https://wa.me/${WHATSAPP_NUMBER}">Escribenos por WhatsApp</a>
        </div>
      </div>
    </div>
    
    ${getFooter()}
  `;

  return getBaseTemplate(content, `Devolucion #${data.returnNumber} recibida`);
}

// =====================================================
// PLANTILLAS DE CÓDIGOS DE DESCUENTO
// =====================================================

export interface DiscountCodeEmailData {
  customerName: string;
  customerEmail: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  expirationDate?: string;
  personalMessage?: string;
}

/**
 * Email de código de descuento - Cliente
 */
export function generateDiscountCodeEmail(data: DiscountCodeEmailData): string {
  const discountDisplay = data.discountType === 'percentage' 
    ? `${data.discountValue}%` 
    : `€${data.discountValue.toFixed(2)}`;

  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="text-align: center;">
        <h2 class="greeting" style="margin-top: 15px;">Tienes un regalo especial!</h2>
      </div>
      
      <p style="text-align: center;">Hola ${data.customerName},</p>
      
      ${data.personalMessage ? `
        <p style="text-align: center; font-style: italic; color: #666; margin: 20px 40px;">
          "${data.personalMessage}"
        </p>
      ` : `
        <p style="text-align: center;">
          Queremos agradecerte por ser parte de BY ARENA con un descuento exclusivo para ti.
        </p>
      `}
      
      <div class="discount-code-box">
        <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
          Tu código de descuento
        </p>
        <div class="discount-code">${data.code}</div>
        <p class="discount-value">${discountDisplay} OFF</p>
        ${data.minPurchase ? `
          <p style="margin: 10px 0 0 0; font-size: 13px; opacity: 0.9;">
            *En compras superiores a €${data.minPurchase.toFixed(2)}
          </p>
        ` : ''}
      </div>
      
      ${data.expirationDate ? `
        <div style="text-align: center; background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #E65100;">
            <strong>Valido hasta:</strong> ${data.expirationDate}
          </p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/catalogo" class="cta-button">
          Usar mi código ahora
        </a>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif; text-align: center;">
        ¿Cómo usar tu código?
      </h3>
      
      <div style="background: ${BRAND_COLORS.lightGray}; padding: 20px; border-radius: 8px;">
        <p style="margin: 0;">
          <strong>1.</strong> Anade tus productos favoritos al carrito<br>
          <strong>2.</strong> En el checkout, introduce tu codigo <strong>${data.code}</strong><br>
          <strong>3.</strong> Disfruta de tu descuento!
        </p>
      </div>
    </div>
    
    ${getFooter()}
  `;

  return getBaseTemplate(content, `${discountDisplay} de descuento para ti`);
}

/**
 * Email de bienvenida al Newsletter
 */
export function generateNewsletterWelcome(data: { confirmUrl: string }): { subject: string; html: string } {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${BRAND_COLORS.accent} 0%, ${BRAND_COLORS.secondary} 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        </div>
      </div>
      
      <h1 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; text-align: center; margin: 0 0 20px 0;">
        ¡Casi estás dentro!
      </h1>
      
      <p style="text-align: center; font-size: 16px; color: ${BRAND_COLORS.text};">
        Solo falta un paso para unirte a nuestra comunidad y recibir:
      </p>
      
      <div style="background: ${BRAND_COLORS.lightGray}; padding: 25px; border-radius: 12px; margin: 25px 0;">
        <ul style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.text};">
          <li style="margin-bottom: 12px;">
            <strong>10% de descuento</strong> en tu primera compra
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Acceso anticipado</strong> a nuevas colecciones
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Ofertas exclusivas</strong> solo para suscriptores
          </li>
          <li style="margin-bottom: 0;">
            <strong>Consejos de estilo</strong> y tendencias
          </li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.confirmUrl}" class="cta-button" style="font-size: 18px; padding: 18px 40px;">
          Confirmar mi suscripcion
        </a>
      </div>
      
      <p style="text-align: center; font-size: 13px; color: #888; margin-top: 30px;">
        Si no solicitaste esta suscripción, puedes ignorar este email.
      </p>
    </div>
    
    ${getFooter()}
  `;

  return {
    subject: 'Confirma tu suscripcion a BY ARENA',
    html: getBaseTemplate(content, '¡Confirma tu suscripción y obtén un 10% de descuento!')
  };
}

/**
 * Email de confirmación exitosa de newsletter con código de descuento
 */
export function generateNewsletterConfirmed(data: { discountCode: string }): { subject: string; html: string } {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${BRAND_COLORS.accent} 0%, ${BRAND_COLORS.secondary} 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        </div>
      </div>
      
      <h1 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; text-align: center; margin: 0 0 20px 0;">
        Bienvenido/a a BY ARENA!
      </h1>
      
      <p style="text-align: center; font-size: 16px; color: ${BRAND_COLORS.text};">
        Tu suscripción ha sido confirmada. Ya formas parte de nuestra comunidad exclusiva.
      </p>
      
      <div style="background: linear-gradient(135deg, ${BRAND_COLORS.accent}20 0%, ${BRAND_COLORS.primary}40 100%); padding: 30px; border-radius: 16px; margin: 30px 0; text-align: center; border: 2px dashed ${BRAND_COLORS.secondary};">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: ${BRAND_COLORS.secondary}; text-transform: uppercase; letter-spacing: 2px;">
          Tu código de descuento
        </p>
        <p style="margin: 0; font-size: 36px; font-weight: bold; color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 4px;">
          ${data.discountCode}
        </p>
        <p style="margin: 15px 0 0 0; font-size: 18px; color: ${BRAND_COLORS.text};">
          <strong>10% de descuento</strong> en tu primera compra
        </p>
      </div>
      
      <div style="background: ${BRAND_COLORS.lightGray}; padding: 20px; border-radius: 12px; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: ${BRAND_COLORS.secondary}; font-weight: bold;">
          ¿Cómo usar tu código?
        </p>
        <ol style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.text}; font-size: 14px;">
          <li style="margin-bottom: 8px;">Añade tus productos favoritos al carrito</li>
          <li style="margin-bottom: 8px;">En el checkout, introduce el código <strong>${data.discountCode}</strong></li>
          <li style="margin-bottom: 0;">¡Disfruta de tu 10% de descuento!</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://byarena.com/catalogo" class="cta-button" style="font-size: 18px; padding: 18px 40px;">
          Explorar Catálogo
        </a>
      </div>
      
      <p style="text-align: center; font-size: 13px; color: #888; margin-top: 30px;">
        Este código es válido para una única compra y no es acumulable con otras ofertas.
      </p>
    </div>
    
    ${getFooter()}
  `;

  return {
    subject: 'Tu 10% de descuento esta listo - BY ARENA',
    html: getBaseTemplate(content, '¡Gracias por suscribirte! Aquí tienes tu descuento.')
  };
}

/**
 * Email de bienvenida al registrarse
 */
export function generateWelcomeEmail(data: { name: string }): { subject: string; html: string } {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${BRAND_COLORS.accent} 0%, ${BRAND_COLORS.secondary} 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        </div>
      </div>
      
      <h1 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; text-align: center; margin: 0 0 20px 0;">
        Bienvenida a BY ARENA, ${data.name}!
      </h1>
      
      <p style="text-align: center; font-size: 16px; color: ${BRAND_COLORS.text};">
        Nos alegra mucho tenerte en nuestra comunidad. Tu cuenta ya está lista para empezar a disfrutar de todo lo que BY ARENA tiene para ti.
      </p>
      
      <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary}20 0%, ${BRAND_COLORS.accent}20 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid ${BRAND_COLORS.primary};">
        <h3 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', serif; margin: 0 0 15px 0; text-align: center;">
          Con tu cuenta puedes:
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.text};">
          <li style="margin-bottom: 10px;">Acceder a descuentos y ofertas exclusivas</li>
          <li style="margin-bottom: 10px;">Ver el historial de tus pedidos</li>
          <li style="margin-bottom: 10px;">Gestionar tus direcciones de envio</li>
          <li style="margin-bottom: 0;">Disfrutar de ofertas exclusivas</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${SITE_URL}/catalogo" class="cta-button">
          Explorar colección
        </a>
      </div>
      
      <div class="divider"></div>
      
      <p style="text-align: center; font-size: 14px; color: ${BRAND_COLORS.text};">
        ¿Tienes alguna duda? Estamos aquí para ayudarte.<br>
        <a href="${SITE_URL}/contacto" style="color: ${BRAND_COLORS.accent};">Contáctanos</a> o escríbenos por 
        <a href="https://wa.me/${WHATSAPP_NUMBER}" style="color: ${BRAND_COLORS.accent};">WhatsApp</a>
      </p>
    </div>
    
    ${getFooter()}
  `;

  return {
    subject: `Bienvenida a BY ARENA, ${data.name}!`,
    html: getBaseTemplate(content, `¡Tu cuenta en BY ARENA está lista!`)
  };
}

/**
 * Email de recuperación de contraseña
 */
export function generatePasswordResetEmail(data: { name: string; resetUrl: string }): { subject: string; html: string } {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${BRAND_COLORS.warning} 0%, ${BRAND_COLORS.secondary} 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        </div>
      </div>
      
      <h1 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; text-align: center; margin: 0 0 20px 0;">
        Recupera tu contraseña
      </h1>
      
      <p style="text-align: center; font-size: 16px; color: ${BRAND_COLORS.text};">
        Hola ${data.name},<br><br>
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en BY ARENA.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="cta-button" style="background: ${BRAND_COLORS.warning};">
          Restablecer contraseña
        </a>
      </div>
      
      <div style="background: #FFF3E0; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #E65100;">
          <strong>Importante:</strong> Este enlace expirara en 1 hora por seguridad.
        </p>
      </div>
      
      <p style="text-align: center; font-size: 14px; color: #888;">
        Si no solicitaste restablecer tu contraseña, puedes ignorar este email. Tu cuenta sigue segura.
      </p>
    </div>
    
    ${getFooter()}
  `;

  return {
    subject: 'Restablece tu contrasena - BY ARENA',
    html: getBaseTemplate(content, 'Restablecer contraseña de tu cuenta BY ARENA')
  };
}

/**
 * Email de notificación de contacto al admin
 */
export function generateContactNotificationAdmin(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): { subject: string; html: string } {
  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
        <strong style="color: #1565C0;">Nuevo mensaje de contacto</strong>
      </div>
      
      <h2 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', Georgia, serif; font-size: 22px;">
        Datos del contacto
      </h2>
      
      <table width="100%" cellpadding="12" cellspacing="0" style="background: ${BRAND_COLORS.lightGray}; border-radius: 8px; margin-bottom: 20px;">
        <tr>
          <td width="30%" style="font-weight: 600; color: ${BRAND_COLORS.secondary};">Nombre:</td>
          <td>${data.name}</td>
        </tr>
        <tr style="background: ${BRAND_COLORS.white};">
          <td style="font-weight: 600; color: ${BRAND_COLORS.secondary};">Email:</td>
          <td><a href="mailto:${data.email}" style="color: ${BRAND_COLORS.accent};">${data.email}</a></td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: ${BRAND_COLORS.secondary};">Asunto:</td>
          <td>${data.subject}</td>
        </tr>
      </table>
      
      <h2 style="color: ${BRAND_COLORS.secondary}; font-family: 'Playfair Display', Georgia, serif; font-size: 22px;">
        Mensaje
      </h2>
      
      <div style="background: ${BRAND_COLORS.white}; border: 1px solid ${BRAND_COLORS.primary}; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
      </div>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="cta-button">
          Responder al cliente
        </a>
      </div>
    </div>
    
    ${getFooter()}
  `;

  return {
    subject: `Nuevo contacto: ${data.subject}`,
    html: getBaseTemplate(content, `Mensaje de ${data.name}`)
  };
}

// =====================================================
// PLANTILLAS DE ACTUALIZACIÓN DE DEVOLUCIÓN
// =====================================================

export interface ReturnStatusUpdateData {
  customerName: string;
  returnNumber: string;
  returnId?: string;
  status: string;
  statusMessage: string;
  refundAmount: number;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; title: string }> = {
  approved: { 
    color: '#4CAF50', 
    icon: '✓', 
    title: 'Devolución Aprobada' 
  },
  rejected: { 
    color: '#E53935', 
    icon: '✕', 
    title: 'Devolución No Aprobada' 
  },
  received: { 
    color: '#2196F3', 
    icon: '📦', 
    title: 'Paquete Recibido' 
  },
  completed: { 
    color: '#4CAF50', 
    icon: '💰', 
    title: '¡Reembolso Procesado!' 
  },
};

/**
 * Email de actualización de estado de devolución - Cliente
 */
export function generateReturnStatusUpdateEmail(data: ReturnStatusUpdateData): string {
  const config = STATUS_CONFIG[data.status] || { 
    color: BRAND_COLORS.secondary, 
    icon: '📋', 
    title: 'Actualización de Devolución' 
  };

  const content = `
    ${getHeader()}
    
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; width: 70px; height: 70px; border-radius: 50%; background: ${config.color}15; line-height: 70px; font-size: 32px;">
          ${config.icon}
        </div>
        <h2 class="greeting" style="margin-top: 15px; color: ${config.color};">${config.title}</h2>
      </div>
      
      <p>Hola ${data.customerName},</p>
      <p>${data.statusMessage}</p>
      
      <div class="highlight-box" style="border-left-color: ${config.color};">
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">Número de devolución</p>
        <p class="order-number">#${data.returnNumber}</p>
      </div>
      
      ${data.status === 'approved' ? `
        <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E7D32; margin: 0 0 10px 0;">📋 Próximos pasos:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #2E7D32;">
            <li>Empaca el producto en su embalaje original</li>
            <li>Imprime o muestra en tu móvil la etiqueta de devolución</li>
            <li>Entrega el paquete en el punto de recogida más cercano</li>
          </ol>
        </div>
      ` : ''}
      
      ${data.status === 'completed' ? `
        <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #2E7D32;">
            <strong>Importe reembolsado:</strong><br>
            <span style="font-size: 28px; font-weight: bold;">€${data.refundAmount.toFixed(2)}</span>
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            El reembolso puede tardar 3-5 días hábiles en reflejarse en tu cuenta.
          </p>
        </div>
        ${data.returnId ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${SITE_URL}/api/invoice/${data.returnId}?type=return" style="display: inline-block; background: #E53935; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
            📄 Descargar Factura de Devolución
          </a>
        </div>
        ` : ''}
      ` : ''}
      
      ${data.status === 'rejected' ? `
        <div style="background: #FFEBEE; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #C62828;">
            Si tienes dudas sobre esta decisión, no dudes en contactarnos. 
            Estaremos encantados de ayudarte.
          </p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${SITE_URL}/mis-pedidos" class="cta-button">
          Ver mis pedidos
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <div class="whatsapp-box">
          ¿Dudas? <a href="https://wa.me/${WHATSAPP_NUMBER}">Escríbenos por WhatsApp</a>
        </div>
      </div>
    </div>
    
    ${getFooter()}
  `;

  return getBaseTemplate(content, `Devolución #${data.returnNumber} - ${config.title}`);
}

// Exportar todas las funciones
export {
  BRAND_COLORS,
  SITE_URL,
  ADMIN_EMAIL,
  SUPPORT_EMAIL,
  getBaseTemplate,
  getHeader,
  getFooter,
};
