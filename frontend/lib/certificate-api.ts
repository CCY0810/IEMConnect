import api from "./api";

/**
 * Download certificate for an event
 * This will trigger a PDF download in the browser
 */
export const downloadCertificate = async (eventId: number) => {
  try {
    const response = await api.get(
      `/certificates/events/${eventId}/certificate`,
      {
        responseType: "blob", // Important: tell axios to expect binary data
      }
    );

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = `certificate_${eventId}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error(
        "Certificate only available for participants who attended the event"
      );
    }
    if (error.response?.status === 404) {
      throw new Error("Event or registration not found");
    }
    throw new Error(
      error.response?.data?.error || "Failed to download certificate"
    );
  }
};

