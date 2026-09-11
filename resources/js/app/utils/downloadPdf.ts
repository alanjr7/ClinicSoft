/**
 * Descarga directa de archivos PDF sin abrir pestañas en blanco.
 * Realiza fetch en segundo plano, crea un Blob y dispara la descarga nativa.
 */
export async function downloadPdfDirect(url: string, defaultFilename: string = 'documento.pdf'): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`Error del servidor (${response.status}): ${response.statusText}`);
    }

    let filename = defaultFilename;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Liberar memoria
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);

    return true;
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    alert('No se pudo generar el documento PDF. Por favor verifique la conexión o intente nuevamente.');
    return false;
  }
}
