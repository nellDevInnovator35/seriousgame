// Fiches metier : explication du vrai role de chaque poste chez Premier Tech,
// reliee a ce que le poste represente dans le jeu.

export const FICHES = {
  usine: {
    icon: "🏭",
    titre: "Usine — Production",
    dansLeJeu: "L'usine fabrique les produits ANC (Ecoflo & Eparco) selon le plan de production hebdomadaire que tu fixes. Stock limité à 100 unités.",
    metierPT: "Les équipes de production transforment la matière en systèmes d'assainissement conformes. Elles pilotent la cadence, la qualité et le stock pour servir la demande sans surproduire.",
    missions: [
      "Planifier la production selon les commandes réelles",
      "Garantir la qualité et la conformité des produits",
      "Éviter les ruptures comme les surstocks (qui coûtent cher)",
    ],
    cle: "Surproduire un produit invendu sature le stock, bloque l'autre ligne et pèse sur l'EBITDA : produire au plus près de la demande est essentiel.",
  },
  pointService: {
    icon: "🏪",
    titre: "Point Service — Vente directe (Eparco)",
    dansLeJeu: "Le Point Service vend, livre et installe l'Eparco directement au client (2000 €), avec un délai de devis de 2 semaines et 1 pose/jour. Maintenance incluse.",
    metierPT: "Le Point Service est le visage local de Premier Tech : conseil, devis, pose et suivi du client de bout en bout. C'est le circuit à plus forte valeur ajoutée et marge.",
    missions: [
      "Conseiller le client et établir le devis adapté",
      "Réaliser la pose et la mise en service",
      "Assurer le contrat de maintenance et la relation durable",
    ],
    cle: "Plus de marge mais plus lent : à privilégier quand on a la capacité de poser dans les délais (sinon avis négatif).",
  },
  distributeur: {
    icon: "📦",
    titre: "Distributeur — Vente indirecte (Ecoflo)",
    dansLeJeu: "Le distributeur revend l'Ecoflo (1000 €) dans sa zone d'influence. Rapide, sans délai de devis, mais marge plus faible. Si ses ventes PT chutent sous 20 %, il bascule au concurrent.",
    metierPT: "Les distributeurs sont des partenaires qui démultiplient la présence de Premier Tech sur le territoire. Les animer et les approvisionner les garde fidèles face à la concurrence.",
    missions: [
      "Approvisionner et animer le réseau de distribution",
      "Maintenir la part des ventes Premier Tech chez le partenaire",
      "Réagir vite à la pression concurrentielle locale",
    ],
    cle: "Indispensable pour le volume et la couverture, mais un distributeur négligé part au concurrent et capte tout son secteur.",
  },
  installateur: {
    icon: "🔧",
    titre: "Installateur — Pose (circuit distributeur)",
    dansLeJeu: "Dans le circuit distributeur, c'est l'installateur qui pose l'Ecoflo chez le client après l'achat. La maintenance reste assurée car c'est notre marque.",
    metierPT: "Les installateurs agréés garantissent une pose conforme aux règles de l'art. La qualité de pose conditionne la satisfaction et la durée de vie de l'installation.",
    missions: [
      "Installer le système selon les normes (SPANC)",
      "Former et accompagner le client à l'usage",
      "Remonter les besoins de maintenance",
    ],
    cle: "Une pose de qualité, c'est moins de fuites et un client satisfait qui ne parle pas en mal autour de lui.",
  },
  logistique: {
    icon: "🚛",
    titre: "Logistique — Expédition & transport",
    dansLeJeu: "Chaque expédition fait partir un camion de l'usine (trajet = 1 jour) et coûte un montant fixe. Au-delà de 20 jours entre la demande et l'installation, le client donne un avis négatif.",
    metierPT: "La logistique relie production et client : préparer, expédier et livrer au bon moment, au meilleur coût. C'est le nerf des délais et de la satisfaction.",
    missions: [
      "Organiser les tournées et optimiser les trajets",
      "Tenir les délais de livraison promis",
      "Maîtriser le coût du transport (impact direct sur l'EBITDA)",
    ],
    cle: "Anticiper la production et grouper les expéditions limite les coûts et évite les avis négatifs liés aux retards.",
  },
};

// Ordre d'affichage dans le menu des fiches
export const FICHE_ORDER = ["usine", "pointService", "distributeur", "installateur", "logistique"];
