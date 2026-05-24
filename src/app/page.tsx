'use client';

import Link from 'next/link';
import { FlaskConical, Atom, Bug, FileText, Sparkles, Brain, Shield, BarChart3, ArrowRight, Zap } from 'lucide-react';

const features = [
  {
    icon: <Atom size={24} />,
    title: 'Active Ingredient Intake',
    description: 'Capture all physico-chemical properties — molecular weight, solubility, log P, vapor pressure, and more — in a structured, validated form.',
    color: '#6366f1',
  },
  {
    icon: <Brain size={24} />,
    title: 'AI Formulation Recommendation',
    description: 'Our AI analyzes your ingredient properties and recommends optimal formulation types (SC, EC, WDG, etc.) with confidence scores and scientific rationale.',
    color: '#10b981',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Surfactant & Additive Strategy',
    description: 'Get tailored surfactant recommendations with specific trade names, HLB ranges, and loading levels for your chosen formulation type.',
    color: '#f59e0b',
  },
  {
    icon: <Shield size={24} />,
    title: 'Stability & Risk Engine',
    description: 'Identify potential stability risks — sedimentation, crystal growth, phase separation — before you run a single lab trial.',
    color: '#ef4444',
  },
  {
    icon: <FlaskConical size={24} />,
    title: 'Recipe Generation',
    description: 'Generate complete development recipes with ingredients, quantities, processing notes, and expected properties — ready for the lab bench.',
    color: '#3b82f6',
  },
  {
    icon: <Bug size={24} />,
    title: 'Troubleshooting Playbook',
    description: 'Describe your formulation problem and get AI-powered root cause analysis, ranked remedies, and preventive measures.',
    color: '#ec4899',
  },
  {
    icon: <FileText size={24} />,
    title: 'Reports & Export',
    description: 'Generate professional PDF reports with branded headers, complete recipes, stability data, and regulatory-ready documentation.',
    color: '#8b5cf6',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Learning & Improvement',
    description: 'Track lab outcomes, build your organization\'s formulation knowledge base, and continuously improve AI recommendations.',
    color: '#06b6d4',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="sidebar-logo-icon">F</div>
          Formu<span style={{ color: 'var(--color-brand)' }}>Lab</span>
        </div>
        <div className="landing-nav-links">
          <Link href="/login" className="btn btn-ghost">Log In</Link>
          <Link href="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-badge">
          <Zap size={14} />
          AI-Powered Agrochemical R&D
        </div>
        <h1 className="landing-title">
          From Active Ingredient to{' '}
          <span className="highlight">Production Recipe</span>{' '}
          in Hours, Not Weeks
        </h1>
        <p className="landing-description">
          FormuLab is the AI copilot that helps formulation scientists recommend formulation types,
          optimize surfactant strategies, predict stability risks, and generate lab-ready recipes —
          all from a single active ingredient input.
        </p>
        <div className="landing-cta">
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start Free Trial <ArrowRight size={18} />
          </Link>
          <Link href="#features" className="btn btn-secondary btn-lg">
            See How It Works
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-features" id="features">
        <h2 className="landing-section-title">
          Everything You Need to Formulate Smarter
        </h2>
        <p className="landing-section-subtitle">
          Eight integrated modules that cover the entire formulation development lifecycle —
          from technical intake to regulatory-ready reports.
        </p>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="feature-card-icon"
                style={{ background: `${feature.color}20`, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <h2 className="landing-section-title">How FormuLab Works</h2>
        <p className="landing-section-subtitle">
          Three simple steps to transform your formulation workflow
        </p>
        <div className="how-it-works-grid">
          <div className="how-step">
            <div className="how-step-number">1</div>
            <h3 className="how-step-title">Input Your Active Ingredient</h3>
            <p className="how-step-description">
              Enter the physico-chemical properties of your active ingredient — or select from your
              organization&apos;s library. Our structured forms ensure nothing is missed.
            </p>
          </div>
          <div className="how-step">
            <div className="how-step-number">2</div>
            <h3 className="how-step-title">Let AI Do the Heavy Lifting</h3>
            <p className="how-step-description">
              Our AI engine analyzes your data, recommends formulation types, suggests surfactants,
              flags risks, and generates a complete development recipe.
            </p>
          </div>
          <div className="how-step">
            <div className="how-step-number">3</div>
            <h3 className="how-step-title">Review, Refine & Export</h3>
            <p className="how-step-description">
              Review AI suggestions, override as needed, save your formulation, and generate
              professional reports for your lab team or regulatory submissions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="relative z-10">
          <h2 className="landing-section-title">
            Ready to Accelerate Your Formulation R&D?
          </h2>
          <p className="landing-section-subtitle">
            Join formulation teams worldwide who are using FormuLab to cut development time,
            reduce trial costs, and build smarter formulations.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Get Started for Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p className="landing-footer-text">
          © {new Date().getFullYear()} FormuLab. Built for agrochemical innovators.
        </p>
      </footer>
    </div>
  );
}
