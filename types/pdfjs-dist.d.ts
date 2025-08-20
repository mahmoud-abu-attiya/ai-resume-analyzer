// Declarations for pdfjs-dist imports used in the project
declare module 'pdfjs-dist/build/pdf.mjs' {
  const pdfjs: any;
  export = pdfjs;
}

// When importing the worker with ?url in bundlers like Vite, the module's default export is the URL string
declare module 'pdfjs-dist/build/pdf.worker.min.js?url' {
  const src: string;
  export default src;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const src: string;
  export default src;
}

// Fallback: plain worker import (without ?url) may be used in some environments
declare module 'pdfjs-dist/build/pdf.worker.min.js' {
  const worker: any;
  export = worker;
}
