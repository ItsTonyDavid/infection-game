import { crc32, deflateSync, inflateSync } from 'node:zlib';

export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  /** RGBA, 4 bytes per pixel, row-major. */
  readonly data: Uint8Array;
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const COLOR_TYPE_RGB = 2;
const COLOR_TYPE_RGBA = 6;

/** Decodes 8-bit, non-interlaced RGB or RGBA PNGs. Other formats throw. */
export function decodePng(file: Uint8Array): RgbaImage {
  const buf = Buffer.from(file);
  if (!buf.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('Not a PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idat: Buffer[] = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const body = buf.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const bitDepth = body[8];
      colorType = body[9] ?? -1;
      const interlace = body[12];
      if (bitDepth !== 8 || interlace !== 0) {
        throw new Error(`Unsupported PNG: bitDepth=${bitDepth} interlace=${interlace}`);
      }
      if (colorType !== COLOR_TYPE_RGB && colorType !== COLOR_TYPE_RGBA) {
        throw new Error(`Unsupported PNG color type ${colorType}`);
      }
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
  }

  const channels = colorType === COLOR_TYPE_RGBA ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = new Uint8Array(stride * height);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[src + x] ?? 0;
      const left = x >= channels ? (pixels[dst + x - channels] ?? 0) : 0;
      const up = y > 0 ? (pixels[dst - stride + x] ?? 0) : 0;
      const upLeft = y > 0 && x >= channels ? (pixels[dst - stride + x - channels] ?? 0) : 0;
      pixels[dst + x] = (value + predict(filter ?? 0, left, up, upLeft)) & 0xff;
    }
  }

  if (channels === 4) {
    return { width, height, data: pixels };
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
    rgba[j] = pixels[i] ?? 0;
    rgba[j + 1] = pixels[i + 1] ?? 0;
    rgba[j + 2] = pixels[i + 2] ?? 0;
    rgba[j + 3] = 255;
  }
  return { width, height, data: rgba };
}

function predict(filter: number, left: number, up: number, upLeft: number): number {
  switch (filter) {
    case 0:
      return 0;
    case 1:
      return left;
    case 2:
      return up;
    case 3:
      return Math.floor((left + up) / 2);
    case 4: {
      const p = left + up - upLeft;
      const pa = Math.abs(p - left);
      const pb = Math.abs(p - up);
      const pc = Math.abs(p - upLeft);
      if (pa <= pb && pa <= pc) return left;
      return pb <= pc ? up : upLeft;
    }
    default:
      throw new Error(`Invalid PNG filter type ${filter}`);
  }
}

export function encodePng(image: RgbaImage): Buffer {
  const stride = image.width * 4;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let y = 0; y < image.height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(image.data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = COLOR_TYPE_RGBA;

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, body: Buffer): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length, 0);
  header.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), body])), 0);
  return Buffer.concat([header, body, crc]);
}

export function getPixel(image: RgbaImage, x: number, y: number): [number, number, number, number] {
  const i = (y * image.width + x) * 4;
  const d = image.data;
  return [d[i] ?? 0, d[i + 1] ?? 0, d[i + 2] ?? 0, d[i + 3] ?? 0];
}
