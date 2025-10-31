import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// A simple loader component to display while the AI is working.
const Loader: React.FC = () => (
    <div className="flex flex-col items-center gap-4 text-slate-400 p-4 text-center">
        <svg className="animate-spin h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-semibold">Creating your masterpiece...</p>
        <p className="text-sm text-slate-500">The AI is working its magic. This can take a few seconds.</p>
    </div>
);

interface EditorProps {
    image: string;
    onReset: () => void;
}

const Editor: React.FC<EditorProps> = ({ image, onReset }) => {
    const [cartoonifiedImage, setCartoonifiedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!image) return;

        const generateCartoon = async () => {
            setIsGenerating(true);
            setError(null);
            setCartoonifiedImage(null);

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

                const imageParts = image.split(';base64,');
                if (imageParts.length < 2) {
                    throw new Error("Invalid image data URL format. Please upload a valid image.");
                }
                const mimeType = imageParts[0].split(':')[1];
                const base64ImageData = imageParts[1];

                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: {
                    parts: [
                      {
                        inlineData: {
                          data: base64ImageData,
                          mimeType: mimeType,
                        },
                      },
                      {
                        text: 'Transform this photo into a cartoon-style portrait, mimicking the look of a modern 3D animated movie. The style should be vibrant, artistic, and polished with smooth features.',
                      },
                    ],
                  },
                  config: {
                      responseModalities: [Modality.IMAGE],
                  },
                });

                let foundImage = false;
                if (response.candidates && response.candidates.length > 0) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            const base64ImageBytes: string = part.inlineData.data;
                            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                            setCartoonifiedImage(imageUrl);
                            foundImage = true;
                            break;
                        }
                    }
                }
                
                if (!foundImage) {
                    throw new Error("The AI couldn't generate a cartoon for this image. It might be an unsupported format or content. Please try a different photo.");
                }

            } catch (e: any) {
                console.error(e);
                setError(e.message || "An unexpected error occurred. Please try again.");
            } finally {
                setIsGenerating(false);
            }
        };

        generateCartoon();
    }, [image]);

    const handleDownload = useCallback(() => {
        if (!cartoonifiedImage) return;
        
        const link = document.createElement('a');
        link.download = 'cartoonified-image.png';
        link.href = cartoonifiedImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [cartoonifiedImage]);

    return (
        <div className="w-full flex flex-col items-center animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
                {/* Original Image */}
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-slate-300 mb-4">Original</h2>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-800 shadow-lg ring-1 ring-white/10">
                        <img src={image} alt="Original" className="w-full h-full object-contain" />
                    </div>
                </div>

                {/* Cartoonified Image */}
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-slate-300 mb-4">Cartoonified</h2>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-800 shadow-lg ring-1 ring-white/10 flex items-center justify-center">
                        {isGenerating ? (
                            <Loader />
                        ) : error ? (
                            <div className="p-4 text-center text-red-400">
                                <p className="font-semibold">Oh no! Something went wrong.</p>
                                <p className="text-sm mt-2">{error}</p>
                            </div>
                        ) : cartoonifiedImage ? (
                            <img src={cartoonifiedImage} alt="Cartoonified" className="w-full h-full object-contain" />
                        ) : (
                            <div className="p-4 text-center text-slate-400">
                                <p>Your cartoon will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                 <button
                    onClick={onReset}
                    className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                >
                    Choose Another Photo
                </button>
                <button
                    onClick={handleDownload}
                    disabled={isGenerating || !cartoonifiedImage}
                    className="cartoon-button px-6 py-3 bg-yellow-400 text-slate-900 font-bold rounded-lg border-2 border-slate-900 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Download Cartoon
                </button>
            </div>
        </div>
    );
};

export default Editor;