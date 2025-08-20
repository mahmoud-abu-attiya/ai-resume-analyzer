export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // @ts-ignore - pdfjs-dist/build/pdf.mjs is not a module
    loadPromise = (async () => {
        const lib = await import("pdfjs-dist/build/pdf.mjs");

        // Try to load the matching worker file from the installed package.
        // When using Vite, importing with `?url` returns the final URL string
        // for the asset, which guarantees the worker and the library are the same version.
        let workerSrc = "/pdf.worker.min.mjs"; // fallback to public file if anything fails
        try {
            // dynamic import with ?url returns a module whose default export is the URL string
            // @ts-ignore - Some bundlers/types may not like the ?url import here
            const workerModule = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
            workerSrc = (workerModule && (workerModule as any).default) || workerSrc;
        } catch (e) {
            // ignore and keep fallback
        }

        // @ts-ignore - GlobalWorkerOptions exists at runtime
        lib.GlobalWorkerOptions.workerSrc = workerSrc;
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    })();

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        await page.render({ canvasContext: context!, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}