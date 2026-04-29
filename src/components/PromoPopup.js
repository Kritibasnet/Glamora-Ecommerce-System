import React, { Component } from 'react';
import styled, { keyframes, css } from 'styled-components';

const PROMOS = [
    {
        icon: '✨',
        headline: 'Free Shipping Today Only!',
        sub: 'On all orders above $25 — no code needed.',
        color: 'linear-gradient(135deg, #d4567d 0%, #a83d5e 100%)',
        accent: '#f8a5c2',
    },
    {
        icon: '💄',
        headline: 'Trending Picks Are Selling Fast',
        sub: 'Limited stock on our best-sellers this week.',
        color: 'linear-gradient(135deg, #8b1a4a 0%, #d4567d 100%)',
        accent: '#fde8ef',
    },
    {
        icon: '🌟',
        headline: 'Earn Loyalty Points on Every Buy',
        sub: 'Complete 3 orders and unlock exclusive discounts.',
        color: 'linear-gradient(135deg, #c9a84c 0%, #8b6914 100%)',
        accent: '#f7e7b4',
    },
    {
        icon: '💅',
        headline: 'New Arrivals Just Dropped!',
        sub: 'Fresh skincare & makeup collections are live.',
        color: 'linear-gradient(135deg, #a83d5e 0%, #2d2d44 100%)',
        accent: '#f8a5c2',
    },
    {
        icon: '🎁',
        headline: 'Gift Yourself Something Special',
        sub: 'Treat yourself — you deserve it.',
        color: 'linear-gradient(135deg, #764ba2 0%, #d4567d 100%)',
        accent: '#e8d5f7',
    },
];

export default class PromoPopup extends Component {
    state = {
        visible: false,
        exiting: false,
        promo: PROMOS[0],
        promoIndex: 0,
    };

    _timer = null;
    _autoClose = null;

    componentDidMount() {
        // Show first popup after 3 minutes, then repeat every 3 minutes
        this._timer = setInterval(() => {
            this.showNextPromo();
        }, 1 * 60 * 1000); // 3 minutes
    }

    componentWillUnmount() {
        clearInterval(this._timer);
        clearTimeout(this._autoClose);
    }

    showNextPromo = () => {
        const nextIndex = (this.state.promoIndex + 1) % PROMOS.length;
        this.setState({
            visible: true,
            exiting: false,
            promo: PROMOS[nextIndex],
            promoIndex: nextIndex,
        });

        // Auto-dismiss after 2.5 seconds
        this._autoClose = setTimeout(() => {
            this.handleClose();
        }, 2500);
    };

    handleClose = () => {
        clearTimeout(this._autoClose);
        this.setState({ exiting: true });
        setTimeout(() => {
            this.setState({ visible: false, exiting: false });
        }, 400);
    };

    render() {
        const { visible, exiting, promo } = this.state;
        if (!visible) return null;

        return (
            <Overlay>
                <PopupCard gradient={promo.color} exiting={exiting}>
                    <CloseBtn onClick={this.handleClose} aria-label="Close promotion">
                        ×
                    </CloseBtn>
                    <IconWrap accent={promo.accent}>{promo.icon}</IconWrap>
                    <PopupHeadline>{promo.headline}</PopupHeadline>
                    <PopupSub>{promo.sub}</PopupSub>
                    <DismissBar />
                </PopupCard>
            </Overlay>
        );
    }
}

/* ===== Animations ===== */
const slideUpIn = keyframes`
  from { opacity: 0; transform: translateY(60px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
`;

const slideDownOut = keyframes`
  from { opacity: 1; transform: translateY(0)    scale(1); }
  to   { opacity: 0; transform: translateY(60px) scale(0.92); }
`;

const shimmerAnim = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const shrink = keyframes`
  from { width: 100%; }
  to   { width: 0%; }
`;

/* ===== Styled Components ===== */
const Overlay = styled.div`
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 99999;
    pointer-events: none;

    @media (max-width: 576px) {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
    }
`;

const PopupCard = styled.div`
    pointer-events: all;
    width: 340px;
    background: ${props => props.gradient};
    border-radius: 20px;
    padding: 1.6rem 1.8rem 1.2rem;
    color: white;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.15) inset;
    overflow: hidden;

    /* Shimmer overlay */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.15) 50%,
            transparent 70%
        );
        background-size: 200% 100%;
        animation: ${shimmerAnim} 2.5s infinite linear;
        border-radius: inherit;
        pointer-events: none;
    }

    ${props => props.exiting
        ? css`animation: ${slideDownOut} 0.4s cubic-bezier(0.4,0,1,1) both;`
        : css`animation: ${slideUpIn}   0.5s cubic-bezier(0.16,1,0.3,1) both;`
    }

    @media (max-width: 576px) {
        width: 100%;
        border-radius: 16px;
    }
`;

const CloseBtn = styled.button`
    position: absolute;
    top: 0.7rem;
    right: 0.9rem;
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    z-index: 2;

    &:hover { background: rgba(255,255,255,0.4); }
`;

const IconWrap = styled.div`
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: ${props => props.accent ? `${props.accent}33` : 'rgba(255,255,255,0.2)'};
    border: 1px solid rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    margin-bottom: 0.9rem;
    backdrop-filter: blur(4px);
`;

const PopupHeadline = styled.h4`
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
    color: white;
    line-height: 1.3;
    text-shadow: 0 1px 3px rgba(0,0,0,0.2);
`;

const PopupSub = styled.p`
    font-size: 0.8rem;
    opacity: 0.88;
    margin-bottom: 1.1rem;
    line-height: 1.5;
    font-weight: 400;
`;

const DismissBar = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(255,255,255,0.6);
    border-radius: 0 0 0 20px;
    animation: ${shrink} 2.5s linear forwards;
`;
