'use client';

import { useEffect, useState } from 'react';

export default function TextToSpeech({ text, enabled }) {
    const [speaking, setSpeaking] = useState(false);

    const speak = (text) => {
        if (!enabled || !text) return;

        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (enabled && text) {
            speak(text);
        }
        
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [text, enabled]);

    return null; // This is a utility component, no UI needed
}
