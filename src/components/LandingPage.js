import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import logo from '../cosmetics.png';

const LandingPage = () => {
    return (
        <LandingWrapper className="fade-in">
            <div className="container">
                <div className="hero-section">
                    <div className="logo-container slide-in-left">
                        <img src={logo} alt="Glamora Logo" className="landing-logo" />
                    </div>
                    <div className="content-container slide-in-right">
                        <h1 className="text-title">Welcome to Glamora</h1>
                        <p className="description">
                            Experience the pinnacle of beauty with Glamora. We are dedicated to providing you
                            with the most premium, ethically sourced, and high-performance cosmetics in the industry.
                            Our curated collections are designed to empower your natural beauty and give you the
                            confidence you deserve.
                        </p>
                        <p className="description">
                            Explore our latest arrivals and timeless classics. From luxurious skincare to
                            vibrant makeup, Glamora is your partner in elegance.
                        </p>
                        <Link to="/home">
                            <button className="btn-shop">Shop Now</button>
                        </Link>
                    </div>
                </div>
            </div>
        </LandingWrapper>
    );
};

export default LandingPage;

const LandingWrapper = styled.div`
    min-height: calc(100vh - 80px);
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #ffffff 0%, #ffffff 95%, #ffe4e9 100%);
    padding: 2rem 0;

    .hero-section {
        display: flex;
        align-items: center;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 3rem;
    }

    .logo-container {
        flex: 1;
        min-width: 300px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .landing-logo {
        max-width: 400px;
        width: 100%;
        height: auto;
        filter: drop-shadow(0 10px 20px rgba(212, 86, 125, 0.2));
    }

    .content-container {
        flex: 1.2;
        min-width: 300px;
        padding: 1rem;
    }

    h1 {
        color: var(--mainPink);
        font-size: 3.5rem;
        margin-bottom: 2rem;
        position: relative;
        
        &::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 0;
            width: 100px;
            height: 4px;
            background: var(--mainPink);
            border-radius: 2px;
        }
    }

    .description {
        font-size: 1.1rem;
        color: var(--mainGrey);
        line-height: 1.8;
        margin-bottom: 1.5rem;
        max-width: 600px;
    }

    .btn-shop {
        padding: 1rem 3rem;
        font-size: 1.2rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(135deg, var(--mainPink) 0%, var(--darkPink) 100%);
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: var(--mainTransition);
        margin-top: 1rem;
        box-shadow: 0 4px 15px rgba(212, 86, 125, 0.3);

        &:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(212, 86, 125, 0.4);
        }

        &:active {
            transform: translateY(0);
        }
    }

    @media (max-width: 768px) {
        .hero-section {
            flex-direction: column;
            text-align: center;
            gap: 2rem;
        }

        h1 {
            font-size: 2.5rem;
            &::after {
                left: 50%;
                transform: translateX(-50%);
            }
        }

        .description {
            margin: 0 auto 1.5rem;
        }

        .landing-logo {
            max-width: 280px;
        }
    }
`;
