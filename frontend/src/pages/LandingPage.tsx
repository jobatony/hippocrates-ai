import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { FileText, Sparkles, BrainCircuit, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  // Step 1: Upload (0 -> 0.33)
  const opacity1 = useTransform(scrollYProgress, [0, 0.15, 0.3], [1, 1, 0]);
  const scale1 = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const y1 = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  // Step 2: Generate (0.3 -> 0.66)
  const opacity2 = useTransform(scrollYProgress, [0.25, 0.45, 0.55, 0.65], [0, 1, 1, 0]);
  const scale2 = useTransform(scrollYProgress, [0.3, 0.45, 0.65], [0.8, 1, 0.8]);
  const y2 = useTransform(scrollYProgress, [0.3, 0.45, 0.65], [50, 0, -50]);

  // Step 3: Master (0.65 -> 1.0)
  const opacity3 = useTransform(scrollYProgress, [0.6, 0.8, 1], [0, 1, 1]);
  const scale3 = useTransform(scrollYProgress, [0.65, 0.8], [0.8, 1]);
  const y3 = useTransform(scrollYProgress, [0.65, 0.8], [50, 0]);

  return (
    <div className="bg-surface min-h-screen text-on-surface overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-spacing-xl z-50 flex justify-between items-center bg-surface/80 backdrop-blur-md">
        <div className="font-title-lg font-bold text-primary">Hippocrates AI</div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-full font-title-sm hover:bg-surface-container transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-6 py-2 rounded-full bg-primary text-on-primary font-title-sm hover:brightness-110 transition-colors shadow-md"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ y: [0, -30, 0], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-1/4 left-[10%] w-32 h-40 bg-surface-container rounded-xl shadow-lg border border-surface-container-highest opacity-40 backdrop-blur-sm"
          />
          <motion.div 
            animate={{ y: [0, 40, 0], rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-[15%] w-40 h-24 bg-primary-container/20 rounded-xl shadow-lg border border-primary/20 backdrop-blur-sm"
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-1/3 right-[25%] w-64 h-64 bg-primary/10 rounded-full blur-[80px]"
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-spacing-xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary font-label-md uppercase tracking-widest mb-6 border border-surface-container-highest">
              The Clinical Study Pipeline
            </span>
            <h1 className="text-6xl md:text-8xl font-display-lg tracking-tight mb-8 text-on-surface">
              Read Once,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary-container">
                Recall Always
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant font-body-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Hippocrates AI uses advanced generative models and spaced repetition to turn your clinical documents into long-term memory.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="group flex items-center gap-3 px-8 py-4 mx-auto rounded-2xl bg-primary text-on-primary font-title-md hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              Start Learning for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Scroll Walkthrough Section */}
      <section ref={targetRef} className="h-[300vh] relative bg-surface-container-lowest">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-6xl px-spacing-xl grid grid-cols-1 lg:grid-cols-2 gap-spacing-3xl items-center">
            
            {/* Text Content */}
            <div className="relative h-[400px] flex items-center">
              {/* Step 1 */}
              <motion.div 
                style={{ opacity: opacity1, scale: scale1, y: y1 }}
                className="absolute inset-0 flex flex-col justify-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8 text-on-surface" />
                </div>
                <h2 className="text-4xl md:text-5xl font-display-sm mb-4">1. Upload your material</h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  Simply upload your lecture notes, guidelines, or clinical documents. We organize your library automatically.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div 
                style={{ opacity: opacity2, scale: scale2, y: y2 }}
                className="absolute inset-0 flex flex-col justify-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-on-primary-fixed" />
                </div>
                <h2 className="text-4xl md:text-5xl font-display-sm mb-4">2. Generate Smart Cards</h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  Our clinical AI scans your text and extracts high-yield facts, generating comprehensive flashcards instantly.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                style={{ opacity: opacity3, scale: scale3, y: y3 }}
                className="absolute inset-0 flex flex-col justify-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center mb-6 text-on-primary">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h2 className="text-4xl md:text-5xl font-display-sm mb-4">3. Master with SRS</h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  Review cards using our custom Spaced Repetition System. Build a learning streak and cement knowledge permanently.
                </p>
              </motion.div>
            </div>

            {/* Visual Content */}
            <div className="relative h-[400px] w-full bg-surface-container rounded-3xl overflow-hidden border border-surface-container-highest shadow-2xl flex items-center justify-center">
              {/* Step 1 Visual */}
              <motion.div style={{ opacity: opacity1 }} className="absolute inset-0 flex items-center justify-center bg-surface-container p-12">
                <div className="w-full h-full max-w-sm bg-surface rounded-xl border border-outline/20 p-6 shadow-sm flex flex-col gap-4">
                  <div className="h-4 w-3/4 bg-surface-container-highest rounded-full"></div>
                  <div className="h-3 w-full bg-surface-container-highest rounded-full"></div>
                  <div className="h-3 w-5/6 bg-surface-container-highest rounded-full"></div>
                  <div className="h-3 w-full bg-surface-container-highest rounded-full"></div>
                  <div className="h-3 w-4/5 bg-surface-container-highest rounded-full"></div>
                </div>
              </motion.div>

              {/* Step 2 Visual */}
              <motion.div style={{ opacity: opacity2 }} className="absolute inset-0 flex items-center justify-center bg-primary/5 p-12">
                <div className="relative w-full max-w-sm h-64 bg-surface-bright rounded-2xl shadow-xl border border-primary/20 flex flex-col items-center justify-center p-6 text-center">
                  <Sparkles className="w-10 h-10 text-primary mb-4 animate-pulse" />
                  <div className="h-4 w-1/2 bg-primary/20 rounded-full mb-4"></div>
                  <div className="h-3 w-3/4 bg-surface-variant rounded-full mb-2"></div>
                  <div className="h-3 w-2/3 bg-surface-variant rounded-full"></div>
                </div>
              </motion.div>

              {/* Step 3 Visual */}
              <motion.div style={{ opacity: opacity3 }} className="absolute inset-0 flex flex-col items-center justify-center bg-tertiary-container/5 p-12 gap-6">
                <div className="w-full max-w-sm flex gap-2">
                  <div className="h-12 flex-1 bg-surface-container-high rounded-xl border-b-4 border-surface-variant"></div>
                  <div className="h-12 flex-1 bg-surface-container-high rounded-xl border-b-4 border-surface-variant"></div>
                  <div className="h-12 flex-1 bg-primary rounded-xl border-b-4 border-primary-container text-on-primary flex items-center justify-center font-bold">120</div>
                  <div className="h-12 flex-1 bg-surface-container-high rounded-xl border-b-4 border-surface-variant"></div>
                </div>
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${i < 3 ? 'bg-tertiary-container' : 'bg-surface-variant'}`}></div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-spacing-3xl px-spacing-xl bg-surface border-t border-surface-container-high text-center">
        <h2 className="text-4xl font-display-md mb-6 text-on-surface">Ready to master medicine?</h2>
        <p className="text-xl text-on-surface-variant mb-10">Join Hippocrates AI and build your ultimate clinical memory bank.</p>
        <button 
          onClick={() => navigate('/register')}
          className="px-8 py-4 rounded-2xl bg-primary text-on-primary font-title-md hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          Create Free Account
        </button>
      </section>
    </div>
  );
};
