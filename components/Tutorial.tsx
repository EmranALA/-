
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export interface TutorialStep {
    title: string;
    content: string;
    elementId?: string;
}

interface TutorialProps {
    steps: TutorialStep[];
    onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ steps, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

    const step = steps[currentStep];

    useEffect(() => {
        const calculateHighlight = () => {
            if (step.elementId) {
                const element = document.getElementById(step.elementId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    setHighlightStyle({
                        position: 'fixed',
                        top: `${rect.top - 8}px`,
                        left: `${rect.left - 8}px`,
                        width: `${rect.width + 16}px`,
                        height: `${rect.height + 16}px`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                        border: '3px solid #0ea5e9',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease-in-out',
                        zIndex: 9998,
                    });
                } else {
                     setHighlightStyle({ display: 'none' });
                }
            } else {
                setHighlightStyle({ display: 'none' });
            }
        };

        const timer = setTimeout(calculateHighlight, 100);
        window.addEventListener('resize', calculateHighlight);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateHighlight);
        }

    }, [currentStep, step.elementId]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const tutorialContent = (
        <>
            <div style={highlightStyle}></div>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4 font-['Cairo']">
                <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm relative text-center">
                    <button onClick={onClose} className="absolute top-2 left-2 text-slate-400 hover:text-slate-600" aria-label="تخطي الجولة">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <h3 className="text-xl font-bold text-sky-800 mb-3">{step.title}</h3>
                    <p className="text-slate-600 mb-6">{step.content}</p>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            خطوة {currentStep + 1} من {steps.length}
                        </span>
                        <div className="flex gap-2">
                             {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300"
                                >
                                    السابق
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800"
                            >
                                {currentStep === steps.length - 1 ? 'إنهاء' : 'التالي'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return ReactDOM.createPortal(tutorialContent, document.body);
};

export default Tutorial;
