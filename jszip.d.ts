declare module 'jszip' {
  interface JSZipFileOptions {
    base64?: boolean;
    binary?: boolean;
  }
  interface JSZipGenerateOptions {
    type: "blob" | "base64" | "binarystring" | "uint8array" | "arraybuffer" | "nodebuffer";
    compression?: "STORE" | "DEFLATE";
    compressionOptions?: {
      level: number;
    };
  }
  class JSZip {
    constructor();
    file(name: string, data: Blob | ArrayBuffer | Uint8Array | string, options?: JSZipFileOptions): JSZip;
    folder(name: string): JSZip;
    generateAsync(options?: JSZipGenerateOptions): Promise<Blob>;
  }
  export default JSZip;
}