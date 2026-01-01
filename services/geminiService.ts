import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const refineNoteText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Fix grammar, improve clarity, and make the following note more concise suitable for a video annotation. Keep the tone neutral and professional. Only return the refined text. Note: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    throw error;
  }
};

export const analyzeFrame = async (base64Image: string): Promise<string> => {
  try {
    // Strip the data:image/png;base64, prefix if present for the API call if needed, 
    // but the @google/genai SDK often handles inlineData well. 
    // We will extract the raw base64 data.
    const base64Data = base64Image.split(',')[1]; 

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Good balance of speed and vision capability
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: "Describe exactly what is happening in this video frame in one short sentence. Focus on key actions or visual elements.",
          },
        ],
      },
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};
