import React, { useEffect } from 'react';
import { usePin } from '../contexts/PinContext';
import PinVerification from '../components/PinVerification';
import { useLocation } from 'react-router-dom';

const withPinProtection = (WrappedComponent) => {
    const ProtectedComponent = (props) => {
        const { verifiedSections, resetSectionVerification } = usePin();
        const location = useLocation();
        const currentSection = location.pathname.slice(1); // Remove leading slash

        useEffect(() => {
            // Section verification effect
        }, [currentSection, verifiedSections]);

        useEffect(() => {
            return () => {
                resetSectionVerification(currentSection);
            };
        }, [currentSection, resetSectionVerification]);

        return (
            <>
                {/* Content area - only the content is protected */}
                <div style={{ position: 'relative' }}>
                    {/* Always render the component */}
                    <div style={{ 
                        opacity: verifiedSections[currentSection] ? 1 : 0.3,
                        pointerEvents: verifiedSections[currentSection] ? 'auto' : 'none'
                    }}>
                        <WrappedComponent {...props} />
                    </div>
                </div>

                {/* Floating PIN dialog */}
                {!verifiedSections[currentSection] && (
                    <PinVerification
                        open={true}
                        section={currentSection}
                        onClose={() => {}}
                    />
                )}
            </>
        );
    };

    return ProtectedComponent;
};

export default withPinProtection;
