import type { APIRoute } from 'astro';
import axios from 'axios';
import pkg from 'sadaslk-dlcore';
import '../../lib/ensure-deps';
const { ytmp3 } = pkg;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData().catch(() => null);
  const url = (formData?.get('url') as string | null)?.trim() ?? '';

  if (!url) return jsonError('URL requerida', 400);

  let result: any;
  try {
    result = await ytmp3(url);
  } catch (err: any) {
    console.error('[ytmp3] error:', err?.message ?? err);
    return jsonError('No se pudo procesar el video', 502);
  }

  const downloadUrl: string | undefined =
    result?.url || result?.link || result?.download ||
    result?.audio || result?.mp3 || result?.downloadUrl || result?.audioUrl;

  if (!downloadUrl) {
    console.error('[ytmp3] unexpected result shape:', JSON.stringify(result));
    return jsonError('No se encontró URL de descarga en la respuesta', 502);
  }

  const rawTitle: string = result?.filename?.replace(/\.mp3$/i, '') ||
    result?.title || result?.name || result?.videoTitle || 'audio';
  const title = rawTitle.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'audio';

  let upstream: { data: ArrayBuffer; status: number };
  try {
    upstream = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.youtube.com/',
      },
    });
  } catch (err: any) {
    console.error('[proxy] axios error:', err?.message ?? err);
    return jsonError(`Error al obtener el audio (${err?.response?.status ?? 'sin respuesta'})`, 502);
  }

  const buffer: ArrayBuffer = upstream.data;

  if (!buffer.byteLength) {
    console.error('[proxy] upstream returned empty body');
    return jsonError('El audio descargado está vacío', 502);
  }

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(title + '.mp3')}`,
      'Cache-Control': 'no-store',
      'Content-Length': String(buffer.byteLength),
    },
  });
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
