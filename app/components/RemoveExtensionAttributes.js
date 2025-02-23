'use client';
import { useEffect } from 'react';

export default function RemoveExtensionAttributes() {
  useEffect(() => {
    const removeAttributes = () => {
      const body = document.body;
      body.removeAttribute('data-new-gr-c-s-check-loaded');
      body.removeAttribute('data-gr-ext-installed');
      body.removeAttribute('cz-shortcut-listen');
    };

    // Remove on mount
    removeAttributes();

    // Remove on any dynamic changes
    const observer = new MutationObserver(removeAttributes);
    observer.observe(document.body, {
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
