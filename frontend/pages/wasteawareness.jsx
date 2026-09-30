import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Apple,
  ArrowLeft,
  Battery,
  BookOpen,
  CheckCircle2,
  Droplets,
  HelpCircle,
  Leaf,
  Package,
  Recycle,
  Search,
  Sparkles,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";

// Categorized Waste Directory for instant search
const WASTE_ITEMS = [
  {
    name: "Vegetable & fruit peels",
    category: "wet",
    bin: "Green Bin",
    tip: "Great for compost. Do not pack in plastic bags.",
  },
  {
    name: "Leftover cooked food & tea bags",
    category: "wet",
    bin: "Green Bin",
    tip: "Drain excess liquids before disposing.",
  },
  {
    name: "Eggshells & bones",
    category: "wet",
    bin: "Green Bin",
    tip: "Biodegradable organic waste.",
  },
  {
    name: "Fallen leaves & garden waste",
    category: "wet",
    bin: "Green Bin",
    tip: "Keep separate from soil and stones.",
  },
  {
    name: "Plastic bottles & caps (PET)",
    category: "dry",
    bin: "Blue Bin",
    tip: "Rinse and crush to save space.",
  },
  {
    name: "Cardboard & paper boxes",
    category: "dry",
    bin: "Blue Bin",
    tip: "Flatten boxes before throwing into dry bin.",
  },
  {
    name: "Aluminium cans & foil",
    category: "dry",
    bin: "Blue Bin",
    tip: "Rinse food residue before recycling.",
  },
  {
    name: "Glass jars & bottles",
    category: "dry",
    bin: "Blue Bin",
    tip: "Ensure they are not shattered; rinse clean.",
  },
  {
    name: "Milk pouches & wrappers",
    category: "dry",
    bin: "Blue Bin",
    tip: "Cut pouch with corner attached so the small piece is not lost in nature.",
  },
  {
    name: "Batteries (AA, AAA, Li-ion)",
    category: "hazardous",
    bin: "Red / Black Bin",
    tip: "Never mix with regular trash; hazardous chemical risk.",
  },
  {
    name: "Pesticides & insecticide spray cans",
    category: "hazardous",
    bin: "Red / Black Bin",
    tip: "Keep in original containers and label clearly.",
  },
  {
    name: "Expired medicines & blister packs",
    category: "hazardous",
    bin: "Red / Black Bin",
    tip: "Do not flush down toilets or sinks.",
  },
  {
    name: "CFL bulbs & fluorescent tube lights",
    category: "hazardous",
    bin: "Red / Black Bin",
    tip: "Contains toxic mercury vapor. Handle gently.",
  },
  {
    name: "Diapers, pads & sanitary napkins",
    category: "sanitary",
    bin: "Yellow / Marked Bag",
    tip: "Wrap securely in newspaper with a red dot mark.",
  },
  {
    name: "Old smartphones & chargers",
    category: "ewaste",
    bin: "E-Waste Bin",
    tip: "Hand over to certified e-waste collection drives.",
  },
  {
    name: "Used syringes & medical cotton",
    category: "sanitary",
    bin: "Yellow / Medical Bag",
    tip: "Puncture-proof container required for needles.",
  },
];

const BIN_GUIDES = [
  {
    id: "wet",
    title: "Wet / Organic Waste",
    binName: "Green Bin",
    color: "bg-emerald-600 text-white",
    borderColor: "border-emerald-500",
    bgColor: "bg-emerald-50",
    badge: "100% Biodegradable",
    icon: Apple,
    description:
      "Organic leftovers that decompose naturally into nutrient-rich compost.",
    examples: [
      "Fruit and vegetable leftovers",
      "Cooked and raw food scraps",
      "Egg shells and nut shells",
      "Tea leaves and coffee grounds",
      "Garden leaves and floral waste",
    ],
    donts: "No plastics, carry bags, metals, or glass in the green bin.",
  },
  {
    id: "dry",
    title: "Dry / Recyclable Waste",
    binName: "Blue Bin",
    color: "bg-sky-600 text-white",
    borderColor: "border-sky-500",
    bgColor: "bg-sky-50",
    badge: "Recyclable",
    icon: Package,
    description:
      "Clean, non-biodegradable items that can be sorted and reprocessed in recycling plants.",
    examples: [
      "Newspapers, books, and carton boxes",
      "Plastic bottles, containers, and wrappers",
      "Metal beverage cans and tins",
      "Glass bottles and clean jars",
      "Tetra packs and dry paper cups",
    ],
    donts:
      "Rinse containers; food stains can ruin an entire batch of paper or plastic recycling.",
  },
  {
    id: "hazardous",
    title: "Domestic Hazardous Waste",
    binName: "Red / Black Bin",
    color: "bg-rose-600 text-white",
    borderColor: "border-rose-500",
    bgColor: "bg-rose-50",
    badge: "Toxic & Chemical",
    icon: AlertTriangle,
    description:
      "Substances that pose a health, fire, or environmental danger if discarded into open landfills.",
    examples: [
      "Button & alkaline batteries",
      "Paint cans, thinners, and solvents",
      "Cleaning chemicals and bleach",
      "Insecticides and weed killers",
      "Mercury thermometers and CFL bulbs",
    ],
    donts:
      "Never pour toxic liquids down household drains or mix with municipal trash.",
  },
  {
    id: "sanitary",
    title: "Sanitary & Biomedical Waste",
    binName: "Yellow / Marked Pouch",
    color: "bg-amber-600 text-white",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-50",
    badge: "Special Handling",
    icon: Droplets,
    description:
      "Items carrying biohazard risks, requiring careful wrapping to protect our sanitation staff.",
    examples: [
      "Diapers and adult hygiene pads",
      "Sanitary napkins and tampons",
      "Used bandages, gauze, and cotton swabs",
      "Discarded masks and safety gloves",
    ],
    donts:
      "Always wrap securely in newspaper or biodegradable pouches marked with a red 'X'.",
  },
];

const QUIZ_QUESTIONS = [
  {
    question: "Where should you discard a clean, empty plastic milk pouch?",
    options: ["Green Bin (Wet)", "Blue Bin (Dry)", "Red Bin (Hazardous)"],
    correct: 1,
    explanation: "Plastic milk pouches are recyclable dry waste once rinsed.",
  },
  {
    question: "How should expired medicines and batteries be disposed of?",
    options: [
      "Throw them in the compost pit",
      "Flush them down the bathroom drain",
      "Hand over in Domestic Hazardous (Red/Black) collection",
    ],
    correct: 2,
    explanation:
      "Medicines and batteries contain chemicals that contaminate groundwater if not treated properly.",
  },
  {
    question:
      "What is the best practice for leftover cooked meals and vegetable peels?",
    options: [
      "Pack them in plastic bags and throw in the street",
      "Put in the Green Bin without any plastic wrapping",
      "Mix them with cardboard boxes",
    ],
    correct: 1,
    explanation:
      "Organic waste must be free from plastic bags so it can decompose or be turned into compost.",
  },
];

export default function WasteAwareness() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("guide"); // 'guide' | 'search' | 'quiz'

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Search filter
  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return WASTE_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.bin.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [searchTerm]);

  const handleSelectQuizOption = (qIndex, optionIndex) => {
    if (showQuizResults) return;
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) score++;
    });
    return score;
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-900 text-lime-300">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <span className="text-lg font-bold tracking-tight text-emerald-950">
                  CleanCity
                </span>
                <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                  Awareness & Guide
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/home"
            className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-8 text-white shadow-xl sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime-300">
              <Sparkles className="h-3.5 w-3.5" />
              Clean Environment Mission
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Waste Segregation & Disposal Guidelines
            </h1>
            <p className="mt-3 text-base leading-relaxed text-emerald-100/90 sm:text-lg">
              Segregating waste at source is the most critical step to prevent
              overflowing landfills, protect sanitation workers, and build a
              greener neighborhood.
            </p>

            {/* Quick search input in hero */}
            <div className="relative mt-6 max-w-lg">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim()) setActiveTab("search");
                }}
                placeholder="Search item (e.g. battery, paper box, milk packet)..."
                className="w-full rounded-2xl border border-white/20 bg-white/95 py-3.5 pl-12 pr-4 text-sm text-stone-900 shadow-lg placeholder:text-stone-400 focus:border-lime-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-lime-400/30"
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "guide"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Segregation Bins (4-Color Guide)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "search"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <Search className="h-4 w-4" />
            Item Disposal Directory {searchTerm && `(${searchResults.length})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "quiz"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Quick Knowledge Quiz
          </button>
        </div>

        {/* ================= TAB 1: BIN GUIDELINES ================= */}
        {activeTab === "guide" && (
          <section className="mt-6 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {BIN_GUIDES.map((bin) => {
                const Icon = bin.icon;
                return (
                  <div
                    key={bin.id}
                    className={`flex flex-col rounded-3xl border ${bin.borderColor} ${bin.bgColor} p-6 shadow-sm transition hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bin.color} shadow-sm`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <div>
                          <h2 className="text-lg font-bold text-stone-900">
                            {bin.title}
                          </h2>
                          <span className="text-xs font-semibold text-stone-600">
                            {bin.binName}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-800 shadow-sm">
                        {bin.badge}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-stone-700">
                      {bin.description}
                    </p>

                    <div className="mt-4 flex-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        What goes here:
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-stone-800">
                        {bin.examples.map((ex, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200/80 bg-white/90 p-3.5 text-xs text-stone-600 shadow-sm">
                      <strong className="text-stone-800">
                        Important rule:{" "}
                      </strong>
                      {bin.donts}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dos & Don'ts Summary Card */}
            <div className="rounded-3xl border border-stone-200/80 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-stone-900">
                Essential Civic Waste Rules
              </h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    <span>Always Do (Best Practices)</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                    <li>
                      ✓ Keep at least two separate bins in your household (Wet &
                      Dry).
                    </li>
                    <li>
                      ✓ Rinse milk pouches and food boxes before putting them in
                      the dry bin.
                    </li>
                    <li>
                      ✓ Hand over sanitary items wrapped securely in newspaper
                      with a red dot.
                    </li>
                    <li>
                      ✓ Comply with municipal collection schedules and report
                      illegal dumping.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <XCircle className="h-5 w-5 text-rose-700" />
                    <span>Never Do (Common Mistakes)</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-rose-950">
                    <li>
                      ✗ Never throw garbage out onto empty open plots or drains.
                    </li>
                    <li>
                      ✗ Never burn plastic or dry leaf piles; it releases
                      carcinogenic toxic smoke.
                    </li>
                    <li>
                      ✗ Never dispose of batteries or e-waste together with wet
                      food scraps.
                    </li>
                    <li>
                      ✗ Never use single-use unrecyclable polybags for daily
                      household refuse.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 2: SEARCH DIRECTORY ================= */}
        {activeTab === "search" && (
          <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-900">
                  Item Disposal Directory
                </h2>
                <p className="text-sm text-stone-500">
                  Lookup any daily household item to discover the recommended
                  bin and disposal instruction.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter directory..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 pl-10 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-700/15"
                />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="pb-3 pr-4 font-semibold">Item Name</th>
                    <th className="pb-3 pr-4 font-semibold">Bin Category</th>
                    <th className="pb-3 pr-4 font-semibold">Recommended Bin</th>
                    <th className="pb-3 font-semibold">Handling Advice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(searchTerm.trim() ? searchResults : WASTE_ITEMS).map(
                    (item, idx) => (
                      <tr key={idx} className="transition hover:bg-stone-50">
                        <td className="py-3.5 pr-4 font-medium text-stone-900">
                          {item.name}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium capitalize text-stone-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              item.bin.includes("Green")
                                ? "bg-emerald-100 text-emerald-800"
                                : item.bin.includes("Blue")
                                  ? "bg-sky-100 text-sky-800"
                                  : item.bin.includes("Red")
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.bin}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-stone-600">
                          {item.tip}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>

              {searchTerm.trim() && searchResults.length === 0 && (
                <div className="py-12 text-center text-stone-500">
                  No specific items matched "
                  <span className="font-semibold">{searchTerm}</span>". Try
                  searching for "bottle", "food", "medicine", or "paper".
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================= TAB 3: QUIZ ================= */}
        {activeTab === "quiz" && (
          <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-stone-900">
                Test Your Segregation Knowledge
              </h2>
              <p className="text-sm text-stone-500">
                Answer these 3 quick questions to check if you are disposing of
                waste the right way!
              </p>
            </div>

            <div className="space-y-6">
              {QUIZ_QUESTIONS.map((q, qIndex) => {
                const selected = quizAnswers[qIndex];
                const isAnswered = selected !== undefined;
                const isCorrect = selected === q.correct;

                return (
                  <div
                    key={qIndex}
                    className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-5 transition"
                  >
                    <h3 className="font-semibold text-stone-900">
                      {qIndex + 1}. {q.question}
                    </h3>

                    <div className="mt-3 space-y-2">
                      {q.options.map((opt, optIndex) => {
                        let btnStyle =
                          "border-stone-200 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-800";

                        if (selected === optIndex) {
                          btnStyle =
                            "border-emerald-800 bg-emerald-800 text-white font-medium";
                        }

                        if (showQuizResults) {
                          if (optIndex === q.correct) {
                            btnStyle =
                              "border-emerald-600 bg-emerald-100 text-emerald-950 font-bold ring-2 ring-emerald-600";
                          } else if (selected === optIndex && !isCorrect) {
                            btnStyle =
                              "border-rose-600 bg-rose-100 text-rose-950 font-semibold ring-2 ring-rose-600";
                          }
                        }

                        return (
                          <button
                            key={optIndex}
                            type="button"
                            onClick={() =>
                              handleSelectQuizOption(qIndex, optIndex)
                            }
                            className={`w-full rounded-xl border p-3 text-left text-sm transition ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {showQuizResults && (
                      <p className="mt-3 rounded-xl bg-white p-3 text-xs text-stone-700 shadow-sm">
                        <strong className="text-emerald-900">
                          Explanation:{" "}
                        </strong>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {!showQuizResults ? (
                <button
                  type="button"
                  disabled={
                    Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length
                  }
                  onClick={() => setShowQuizResults(true)}
                  className="rounded-xl bg-emerald-800 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit & See Results
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-950">
                    Your Score: {calculateScore()} / {QUIZ_QUESTIONS.length}
                  </div>
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}