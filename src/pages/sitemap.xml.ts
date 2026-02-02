import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../lib/supabase';

const SITE_URL = 'https://byarena.com';

interface SitemapPage {
  url: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

export const GET: APIRoute = async () => {
  // Obtener productos activos (usando admin client para evitar RLS)
  const { data: products } = await supabaseAdminClient
    .from('products')
    .select('id, updated_at')
    .eq('active', true);

  // Obtener categorías
  const { data: categories } = await supabaseAdminClient
    .from('categories')
    .select('slug, updated_at');

  const staticPages: SitemapPage[] = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/catalogo', priority: '0.9', changefreq: 'daily' },
    { url: '/ofertas', priority: '0.8', changefreq: 'daily' },
    { url: '/sobre-nosotros', priority: '0.5', changefreq: 'monthly' },
    { url: '/contacto', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacidad', priority: '0.3', changefreq: 'yearly' },
    { url: '/terminos', priority: '0.3', changefreq: 'yearly' },
    { url: '/devoluciones', priority: '0.4', changefreq: 'monthly' },
  ];

  const productPages: SitemapPage[] = products?.map((p) => ({
    url: `/producto/${p.id}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: p.updated_at,
  })) || [];

  const categoryPages: SitemapPage[] = categories?.map((c) => ({
    url: `/catalogo?categoria=${c.slug}`,
    priority: '0.7',
    changefreq: 'weekly',
    lastmod: c.updated_at,
  })) || [];

  const allPages: SitemapPage[] = [...staticPages, ...productPages, ...categoryPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
