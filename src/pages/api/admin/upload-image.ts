import type { APIRoute } from 'astro';
import { v2 as cloudinary } from 'cloudinary';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

const CLOUDINARY_CLOUD_NAME = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || 'dhs8kzjoo';
const CLOUDINARY_API_KEY_VAL = import.meta.env.CLOUDINARY_API_KEY || '874527899459894';
const CLOUDINARY_API_SECRET_VAL = import.meta.env.CLOUDINARY_API_SECRET || 'Iz5f1YageAIWxKeik2LC5n7EMt4';

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY_VAL,
  api_secret: CLOUDINARY_API_SECRET_VAL,
});

console.log('[upload-image] Cloudinary config:', { cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY_VAL ? 'SET' : 'MISSING' });

interface UploadResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación admin
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No se envió archivo' }),
        { status: 400 }
      );
    }

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'El archivo debe ser una imagen' }),
        { status: 400 }
      );
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'by-arena/productos',
          resource_type: 'auto',
          quality: 'auto:good',
          fetch_format: 'auto',
          dpr: 'auto',
          transformation: [
            { width: 1000, height: 1000, crop: 'fill', gravity: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            resolve(
              new Response(
                JSON.stringify({ 
                  error: `Error al subir imagen: ${error.message}` 
                }),
                { status: 500 }
              )
            );
            return;
          }

          const response: UploadResponse = {
            success: true,
            url: result?.secure_url,
            publicId: result?.public_id,
          };

          resolve(
            new Response(JSON.stringify(response), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('[upload-image] Catch error:', error);
    return new Response(
      JSON.stringify({ error: `Error: ${error.message}`, stack: error.stack?.substring(0, 300) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
