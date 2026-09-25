import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
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

        <div className="relative z-10 text-center max-w-4xl px-spacing-xl flex flex-col items-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary font-label-md tracking-widest mb-6 border border-surface-container-highest uppercase">
              YOUR AI STUDY BUDDY
            </span>
            <h1 className="text-6xl md:text-8xl font-display-lg tracking-tight mb-8 text-on-surface">
              Read Once,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary-container">
                Recall Always
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant font-body-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Hippocrates AI uses Artificial Intelligence to help you learn 10 X faster and strengthen recall using proven mastery learning technique
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

      {/* How it Works Section */}
      <section className="py-24 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-6xl mx-auto px-spacing-xl">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-4xl md:text-5xl font-display-sm text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary-container mb-4 inline-block pb-1"
            >
              How it works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="text-xl text-on-surface-variant"
            >
              Three simple steps to build your ultimate knowledge bank.
            </motion.p>
          </div>

          <div className="flex flex-col gap-32">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col lg:flex-row items-center gap-12"
            >
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
                  <FileText className="w-8 h-8 text-on-surface" />
                </div>
                <h3 className="text-3xl md:text-4xl font-display-sm text-primary">1. Upload your material</h3>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  Simply upload your lecture notes, documents, or study materials. We organize your library automatically so you can focus on learning.
                </p>
              </div>
              <div className="flex-1 w-full relative">
                <div className="w-full aspect-video bg-surface-container rounded-3xl overflow-hidden border border-surface-container-highest shadow-2xl flex items-center justify-center p-8">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-full max-w-sm bg-surface rounded-xl border border-outline/20 p-6 shadow-sm flex flex-col gap-4"
                  >
                    <div className="h-4 w-3/4 bg-surface-container-highest rounded-full"></div>
                    <div className="h-3 w-full bg-surface-container-highest rounded-full"></div>
                    <div className="h-3 w-5/6 bg-surface-container-highest rounded-full"></div>
                    <div className="h-3 w-full bg-surface-container-highest rounded-full"></div>
                    <div className="h-3 w-4/5 bg-surface-container-highest rounded-full"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col lg:flex-row-reverse items-center gap-12"
            >
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-on-primary-fixed" />
                </div>
                <h3 className="text-3xl md:text-4xl font-display-sm text-primary">2. Generate Smart Cards</h3>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  Our AI helps you to extract high-end facts and generate comprehensive, well-structured quizzes and flashcards instantly.
                </p>
              </div>
              <div className="flex-1 w-full relative">
                <div className="w-full aspect-video bg-primary/5 rounded-3xl overflow-hidden border border-primary/10 shadow-2xl flex items-center justify-center p-8">
                  <motion.div 
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="w-full max-w-sm bg-surface-bright rounded-2xl shadow-xl border border-primary/20 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <Sparkles className="w-12 h-12 text-primary mb-6 animate-pulse" />
                    <div className="h-4 w-1/2 bg-primary/20 rounded-full mb-6"></div>
                    <div className="h-3 w-3/4 bg-surface-variant rounded-full mb-3"></div>
                    <div className="h-3 w-2/3 bg-surface-variant rounded-full"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col lg:flex-row items-center gap-12"
            >
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center text-on-primary">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h3 className="text-3xl md:text-4xl font-display-sm text-primary">3. Mastery Learning</h3>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  Using modern mastery methods cement your knowledge permanently in your brain and maintain a learning streak.
                </p>
              </div>
              <div className="flex-1 w-full relative">
                <div className="w-full aspect-video bg-tertiary-container/5 rounded-3xl overflow-hidden border border-tertiary-container/10 shadow-2xl flex flex-col items-center justify-center p-8 gap-8">
                  <div className="w-full max-w-sm flex gap-3">
                    <motion.div 
                      animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                      className="h-16 flex-1 bg-surface-container-high rounded-xl border-b-4 border-surface-variant"
                    ></motion.div>
                    <motion.div 
                      animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      className="h-16 flex-1 bg-surface-container-high rounded-xl border-b-4 border-surface-variant"
                    ></motion.div>
                    <motion.div 
                      animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                      className="h-16 flex-1 bg-primary rounded-xl border-b-4 border-primary-container text-on-primary flex items-center justify-center font-bold text-xl"
                    >
                      120
                    </motion.div>
                    <motion.div 
                      animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
                      className="h-16 flex-1 bg-surface-container-high rounded-xl border-b-4 border-surface-variant"
                    ></motion.div>
                  </div>
                  <div className="flex gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full ${i < 3 ? 'bg-tertiary-container' : 'bg-surface-variant'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-surface border-t border-surface-container-high py-32 px-spacing-xl relative overflow-hidden">
        {/* Background blob for CTA */}
        <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
           <div className="w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center bg-surface-container-lowest p-12 md:p-16 rounded-[3rem] border border-surface-container-highest shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-display-lg mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary-container">
            Ready to learn faster and better?
          </h2>
          <p className="text-xl md:text-2xl text-on-surface-variant mb-10">
            Join Hippocrates AI.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="px-10 py-5 rounded-full bg-primary text-on-primary font-title-lg hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* Real Footer */}
      <footer className="border-t border-surface-container-high py-12 px-spacing-xl bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-bold">H</div>
            <span className="font-title-md font-bold text-on-surface">Hippocrates AI</span>
          </div>
          <div className="text-on-surface-variant font-body-sm flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span>&copy; {new Date().getFullYear()} Joba Osagie Solutions. All rights reserved.</span>
            <a href="mailto:jobatony23@gmail.com" className="hover:text-primary transition-colors flex items-center gap-2">
              Contact: jobatony23@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
