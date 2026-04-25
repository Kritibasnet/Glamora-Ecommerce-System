import React, { Component } from 'react';
import styled from 'styled-components';

class AboutUs extends Component {
    componentDidMount() {
        document.title = 'About Us - Glamora';
    }

    render() {
        return (
            <AboutWrapper className="fade-in">
                <div className="about-hero">
                    <div className="container">
                        <h1 className="text-title">About Glamora</h1>
                        <p className="hero-subtitle">Your Premium Destination for Beauty & Elegance</p>
                    </div>
                </div>

                <div className="container">
                    <section className="about-section">
                        <div className="about-content">
                            <h2>Our Story</h2>
                            <p>
                                Welcome to <strong>Glamora</strong>, where beauty meets luxury. Founded with a passion for
                                empowering individuals to look and feel their best, we curate the finest selection of
                                cosmetics, skincare, and beauty accessories from around the world.
                            </p>
                            <p>
                                At Glamora, we believe that beauty is not just about appearance—it's about confidence,
                                self-expression, and celebrating your unique style. Our carefully selected products combine
                                quality, innovation, and elegance to help you shine every day.
                            </p>
                        </div>
                    </section>

                    <section className="mission-section">
                        <div className="mission-grid">
                            <div className="mission-card">
                                <div className="icon">✨</div>
                                <h3>Our Mission</h3>
                                <p>
                                    To provide premium beauty products that inspire confidence and celebrate individuality.
                                </p>
                            </div>
                            <div className="mission-card">
                                <div className="icon">💎</div>
                                <h3>Quality First</h3>
                                <p>
                                    Every product is carefully selected to meet our high standards of quality and excellence.
                                </p>
                            </div>
                            <div className="mission-card">
                                <div className="icon">🌸</div>
                                <h3>Customer Care</h3>
                                <p>
                                    Your satisfaction is our priority. We're here to help you find your perfect beauty match.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="location-section">
                        <h2 className="text-center">Visit Our Store</h2>
                        <p className="text-center location-text">
                            <strong>📍 Dilli Bazaar, Kathmandu 44600</strong>
                        </p>
                        <div className="map-container">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.2!2d85.32!3d27.70!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDQyJzAwLjAiTiA4NcKwMTknMTIuMCJF!5e0!3m2!1sen!2snp!4v1234567890"
                                width="100%"
                                height="450"
                                style={{ border: 0, borderRadius: 'var(--borderRadius)' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Glamora Store Location"
                            ></iframe>
                        </div>
                        <div className="contact-info">
                            <div className="contact-card">
                                <h4>📧 Email</h4>
                                <p>info@glamora.com</p>
                            </div>
                            <div className="contact-card">
                                <h4>📞 Phone</h4>
                                <p>+977-1-4123456</p>
                            </div>
                            <div className="contact-card">
                                <h4>🕒 Hours</h4>
                                <p>Mon-Sat: 10 AM - 8 PM<br />Sunday: 11 AM - 6 PM</p>
                            </div>
                        </div>
                    </section>

                    <section className="values-section">
                        <h2 className="text-center">Why Choose Glamora?</h2>
                        <div className="values-grid">
                            <div className="value-item">
                                <span className="value-number">01</span>
                                <h4>Authentic Products</h4>
                                <p>100% genuine products from trusted brands worldwide</p>
                            </div>
                            <div className="value-item">
                                <span className="value-number">02</span>
                                <h4>Expert Guidance</h4>
                                <p>Professional beauty consultants to help you choose</p>
                            </div>
                            <div className="value-item">
                                <span className="value-number">03</span>
                                <h4>Fast Delivery</h4>
                                <p>Quick and secure delivery to your doorstep</p>
                            </div>
                            <div className="value-item">
                                <span className="value-number">04</span>
                                <h4>Best Prices</h4>
                                <p>Competitive pricing with regular special offers</p>
                            </div>
                        </div>
                    </section>
                </div>
            </AboutWrapper>
        );
    }
}

export default AboutUs;

const AboutWrapper = styled.div`
  .about-hero {
    background: linear-gradient(135deg, var(--mainPink) 0%, var(--darkPink) 100%);
    color: white;
    padding: 4rem 0;
    text-align: center;
    margin-bottom: 3rem;

    h1 {
      color: white;
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      opacity: 0.95;
      margin-bottom: 0;
    }
  }

  .about-section {
    margin-bottom: 4rem;

    .about-content {
      max-width: 800px;
      margin: 0 auto;

      h2 {
        color: var(--mainPink);
        text-align: center;
        margin-bottom: 2rem;
      }

      p {
        font-size: 1.1rem;
        line-height: 1.8;
        color: var(--mainBlack);
        margin-bottom: 1.5rem;
      }
    }
  }

  .mission-section {
    margin-bottom: 4rem;
    padding: 3rem 0;
    background: rgba(255, 255, 255, 0.6);
    border-radius: var(--borderRadius);

    .mission-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      padding: 2rem;
    }

    .mission-card {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: var(--borderRadius);
      box-shadow: var(--lightShadow);
      transition: var(--mainTransition);

      &:hover {
        transform: translateY(-5px);
        box-shadow: var(--darkShadow);
      }

      .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h3 {
        color: var(--mainPink);
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }

      p {
        color: var(--mainGrey);
        font-size: 1rem;
        margin-bottom: 0;
      }
    }
  }

  .location-section {
    margin-bottom: 4rem;

    h2 {
      color: var(--mainPink);
      margin-bottom: 1rem;
    }

    .location-text {
      font-size: 1.2rem;
      color: var(--mainBlack);
      margin-bottom: 2rem;
    }

    .map-container {
      margin-bottom: 2rem;
      box-shadow: var(--darkShadow);
      border-radius: var(--borderRadius);
      overflow: hidden;
    }

    .contact-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .contact-card {
      background: white;
      padding: 2rem;
      border-radius: var(--borderRadius);
      box-shadow: var(--lightShadow);
      text-align: center;

      h4 {
        color: var(--mainPink);
        font-size: 1.25rem;
        margin-bottom: 0.75rem;
      }

      p {
        color: var(--mainBlack);
        margin-bottom: 0;
        font-size: 1rem;
      }
    }
  }

  .values-section {
    margin-bottom: 4rem;
    padding: 3rem 0;

    h2 {
      color: var(--mainPink);
      margin-bottom: 3rem;
    }

    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .value-item {
      background: white;
      padding: 2rem;
      border-radius: var(--borderRadius);
      box-shadow: var(--lightShadow);
      border-left: 4px solid var(--mainPink);
      transition: var(--mainTransition);

      &:hover {
        transform: translateX(5px);
        box-shadow: var(--darkShadow);
      }

      .value-number {
        display: inline-block;
        background: linear-gradient(135deg, var(--mainPink), var(--darkPink));
        color: white;
        width: 40px;
        height: 40px;
        line-height: 40px;
        text-align: center;
        border-radius: 50%;
        font-weight: 700;
        margin-bottom: 1rem;
      }

      h4 {
        color: var(--mainBlack);
        font-size: 1.25rem;
        margin-bottom: 0.75rem;
      }

      p {
        color: var(--mainGrey);
        margin-bottom: 0;
      }
    }
  }

  @media screen and (max-width: 768px) {
    .about-hero h1 {
      font-size: 2rem;
    }

    .mission-grid,
    .values-grid {
      grid-template-columns: 1fr;
    }
  }
`;
