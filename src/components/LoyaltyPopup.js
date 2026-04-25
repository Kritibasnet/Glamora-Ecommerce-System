import React from 'react';
import styled from 'styled-components';

export default function LoyaltyPopup({ show, onClose, purchasedToday }) {
    if (!show) return null;

    const maxCircles = 5;
    const filledCircles = Math.min(purchasedToday, maxCircles);

    let message = "Buy 3 items today for 10% OFF, 5 items for 25% OFF!";
    let subMessage = "";
    
    if (purchasedToday >= 5) {
        message = "YOU'VE EARNED 25% OFF YOUR NEXT ORDER!";
        subMessage = "Use Code: GLAM25";
    } else if (purchasedToday >= 3) {
        message = "YOU'VE EARNED 10% OFF YOUR NEXT ORDER!";
        subMessage = "Buy " + (5 - purchasedToday) + " more items today to reach 25% OFF! (Code: GLAM10)";
    } else {
        subMessage = "You need " + (3 - purchasedToday) + " more item(s) today to earn a 10% discount!";
    }

    return (
        <ModalOverlay>
            <ModalContainer>
                <CloseButton onClick={onClose}>&times;</CloseButton>
                <Title>LOYALTY CARD</Title>
                <CirclesContainer>
                    {[...Array(maxCircles)].map((_, i) => (
                        <Circle key={i} filled={i < filledCircles}>
                            {i < filledCircles ? i + 1 : ''}
                        </Circle>
                    ))}
                </CirclesContainer>
                <Message>{message}</Message>
                {subMessage && <SubMessage>{subMessage}</SubMessage>}
            </ModalContainer>
        </ModalOverlay>
    );
}

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease-in-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const ModalContainer = styled.div`
    background: #C41E5A; /* Deep Pink matching the image */
    width: 90%;
    max-width: 400px;
    padding: 3rem 2rem;
    border-radius: 10px;
    position: relative;
    text-align: center;
    color: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.4s ease-out;

    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: 10px;
    right: 15px;
    background: transparent;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

const Title = styled.h2`
    font-family: 'Oswald', sans-serif;
    font-weight: 600;
    letter-spacing: 2px;
    font-size: 2rem;
    margin-bottom: 2.5rem;
    text-transform: uppercase;
`;

const CirclesContainer = styled.div`
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 2.5rem;
`;

const Circle = styled.div`
    width: 45px;
    height: 45px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: #C41E5A;
    background: ${props => props.filled ? 'white' : 'transparent'};
    border: 2px solid white;
    transition: all 0.3s ease;
`;

const Message = styled.p`
    font-family: 'Oswald', sans-serif;
    font-size: 1.2rem;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
`;

const SubMessage = styled.p`
    font-size: 0.9rem;
    opacity: 0.9;
    margin-bottom: 0;
`;
