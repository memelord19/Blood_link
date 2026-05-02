import React, { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Heart, Shield, Clock, Users, ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BloodLinkLogo } from "@/components/BloodLinkLogo";
import { useGetBloodStats } from "@workspace/api-client-react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const BT_COLORS: Record<string, string> = {
  "A+": "#C0392B", "A-": "#E74C3C", "B+": "#2980B9", "B-": "#3498DB",
  "AB+": "#8E44AD", "AB-": "#9B59B6", "O+": "#27AE60", "O-": "#2ECC71",
};

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function Landing() {
  const { data: stats } = useGetBloodStats();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BloodLinkLogo className="w-8 h-8" />
            <span className="text-xl font-bold text-white">BloodLink</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm hidden sm:block">Plateforme nationale — Tunisie</span>
            <Link href="/login" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Connexion
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center bg-sidebar pt-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/10"
              style={{ width: 100 + i * 80, height: 100 + i * 80, left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4 fill-primary" />
                Plateforme nationale tunisienne
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
                Donner du sang,<br />
                <span className="text-primary">sauver des vies</span>
              </h1>
              <p className="text-white/70 text-lg mb-10 leading-relaxed max-w-lg">
                BloodLink connecte donneurs, centres de transfusion et établissements de santé en temps réel pour garantir un approvisionnement sûr et efficace en sang.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-primary/30 cursor-pointer">
                    <Heart className="w-5 h-5" />
                    Je suis un donneur
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </Link>
                <Link href="/login">
                  <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-semibold text-base transition-colors border border-white/20 cursor-pointer">
                    <Shield className="w-5 h-5" />
                    Établissement de santé
                  </motion.span>
                </Link>
                <Link href="/login">
                  <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-semibold text-base transition-colors border border-white/20 cursor-pointer">
                    <Users className="w-5 h-5" />
                    Centre de sang
                  </motion.span>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:grid grid-cols-4 gap-3">
              {BLOOD_TYPES.map((bt, i) => (
                <motion.div key={bt} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="aspect-square rounded-2xl flex flex-col items-center justify-center"
                  style={{ background: `${BT_COLORS[bt]}22`, border: `1px solid ${BT_COLORS[bt]}44` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm mb-2" style={{ background: BT_COLORS[bt] }}>{bt}</div>
                  <div className="text-white/60 text-xs">
                    {stats?.stats?.find(s => s.bloodType === bt)?.donorCount || "—"} donneurs
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Donneurs enregistrés", value: stats?.totalDonors || 1247, suffix: "+" },
              { label: "Dons effectués", value: stats?.totalDonations || 3891, suffix: "+" },
              { label: "Centres partenaires", value: stats?.totalCenters || 4, suffix: "" },
              { label: "Vies sauvées", value: 11673, suffix: "+" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <div className="text-4xl font-black text-primary mb-1">
                  <AnimatedCounter target={stat.value} />{stat.suffix}
                </div>
                <div className="text-muted-foreground text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blood type counters */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Répartition des groupes sanguins</h2>
            <p className="text-muted-foreground">Distribution des donneurs par groupe sanguin en Tunisie</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BLOOD_TYPES.map((bt, i) => {
              const stat = stats?.stats?.find(s => s.bloodType === bt);
              return (
                <motion.div key={bt} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white font-black text-lg mb-4"
                    style={{ background: BT_COLORS[bt] }}>
                    {bt}
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    <AnimatedCounter target={stat?.donorCount || 0} />
                  </div>
                  <div className="text-muted-foreground text-xs">donneurs</div>
                  <div className="mt-2 text-xs font-medium" style={{ color: BT_COLORS[bt] }}>
                    {stat?.percentage || 0}% du total
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-sidebar text-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Comment ça marche</h2>
            <p className="text-white/60">Un processus simplifié pour sauver des vies</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "S'inscrire", desc: "Créez votre compte donneur en quelques minutes avec vos informations personnelles et médicales." },
              { icon: ClipboardList, title: "Vérification médicale", desc: "Remplissez le formulaire de pré-don pour évaluer votre éligibilité automatiquement." },
              { icon: Calendar, title: "Prendre rendez-vous", desc: "Choisissez un créneau disponible dans un centre près de chez vous." },
              { icon: Heart, title: "Donner du sang", desc: "Rendez-vous au centre à l'heure choisie et sauvez jusqu'à 3 vies avec votre don." },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/30">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-4xl font-black text-primary/30 mb-2">0{i + 1}</div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-black text-white mb-4">Prêt à sauver des vies ?</h2>
            <p className="text-white/80 text-lg mb-8">Rejoignez des milliers de donneurs tunisiens et faites la différence aujourd'hui.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors inline-block">
                Devenir donneur
              </Link>
              <Link href="/login" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors inline-block">
                Se connecter
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <BloodLinkLogo className="w-7 h-7" />
              <span className="text-white font-bold">BloodLink</span>
              <span className="text-white/40 text-sm">— Plateforme nationale de gestion des banques de sang</span>
            </div>
            <p className="text-white/40 text-sm">© 2025 BloodLink. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Needed for import in Layout
function ClipboardList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}
function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
