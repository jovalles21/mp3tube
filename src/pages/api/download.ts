import type { APIRoute } from 'astro';
import ytdl from '@distube/ytdl-core';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData().catch(() => null);
  const url = (formData?.get('url') as string | null)?.trim() ?? '';

  if (!url) return jsonError('URL requerida', 400);
  if (!ytdl.validateURL(url)) return jsonError('URL de YouTube inválida', 400);

  let info: ytdl.videoInfo;
  try {
    info = await ytdl.getInfo(url);
  } catch (err: any) {
    console.error('[ytdl] getInfo error:', err?.message ?? err);
    return jsonError('No se pudo procesar el video', 502);
  }

  const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

  if (!format?.url) {
    console.error('[ytdl] no audio format found');
    return jsonError('No se encontró formato de audio', 502);
  }

  const title = info.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'audio';

  // Determine extension from the format container
  const isWebm = format.container === 'webm';
  const ext = isWebm ? 'webm' : 'm4a';
  const contentType = isWebm ? 'audio/webm' : 'audio/mp4';

  const upstream = await fetch(format.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.youtube.com/',
    },
  }).catch((err: any) => {
    console.error('[proxy] fetch error:', err?.message ?? err);
    return null;
  });

  if (!upstream?.ok) {
    console.error('[proxy] upstream status:', upstream?.status);
    return jsonError(`Error al obtener el audio (${upstream?.status ?? 'sin respuesta'})`, 502);
  }

  const buffer = await upstream.arrayBuffer();

  if (!buffer.byteLength) {
    console.error('[proxy] upstream returned empty body');
    return jsonError('El audio descargado está vacío', 502);
  }

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`${title}.${ext}`)}`,
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
