import type { APIRoute } from 'astro';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

interface UploadResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación admin
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== import.meta.env.ADMIN_SECRET_KEY) {
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
    return new Response(
      JSON.stringify({ error: `Error: ${error.message}` }),
      { status: 500 }
    );
  }
};
