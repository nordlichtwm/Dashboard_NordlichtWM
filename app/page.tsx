"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement
);

export default function Page() {
  // === Strategien ===
  const strategies = {
    Zinsertrag: { baskets: [100, 0, 0], return: 0.02, volatility: 0.01 },
    Conservative: { baskets: [70, 30, 0], return: 0.04, volatility: 0.03 },
    Balanced: { baskets: [50, 40, 10], return: 0.06, volatility: 0.05 },
    Growth: { baskets: [20, 70, 10], return: 0.08, volatility: 0.08 },
    Aggressive: { baskets: [0, 70, 30], return: 0.12, volatility: 0.12 },
    "Individuelle Strategie": { baskets: [50, 40, 10] }, // dynamisch überschrieben
  };

  // === States ===
  const [investment, setInvestment] = useState(100000);
  const [horizon, setHorizon] = useState(20);
  const [strategy, setStrategy] = useState("Balanced");
  const [crisisMode, setCrisisMode] = useState(false);
  const [recurring, setRecurring] = useState(5000);
  const [recurringType, setRecurringType] = useState("monatlich");
  const [customFixed, setCustomFixed] = useState(50);
  const [customEquity, setCustomEquity] = useState(40);
  const [customDigital, setCustomDigital] = useState(10);

  const [quizStages, setQuizStages] = useState({
    fähigkeit: 0,
    bereitschaft: 0,
    ke: 0,
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState("");

  // === Konstanten ===
  const fixedBaseReturn = 0.044;
  const equityBaseReturn = 0.087;
  const digitalBaseReturn = 0.3;
  const fixedBaseVol = 0.035;
  const equityBaseVol = 0.1;
  const digitalBaseVol = 0.5;
  const crisisCycle = 10;

  // === Gewichte ===
  const wFixed =
    strategy === "Individuelle Strategie"
      ? customFixed / 100
      : strategies[strategy].baskets[0] / 100;
  const wEquity =
    strategy === "Individuelle Strategie"
      ? customEquity / 100
      : strategies[strategy].baskets[1] / 100;
  const wDigital =
    strategy === "Individuelle Strategie"
      ? customDigital / 100
      : strategies[strategy].baskets[2] / 100;

  // === Risikoparameter ===
  let r, v;
  if (strategy === "Individuelle Strategie") {
    r =
      wFixed * fixedBaseReturn +
      wEquity * equityBaseReturn +
      wDigital * digitalBaseReturn;
    v =
      wFixed * fixedBaseVol +
      wEquity * equityBaseVol +
      wDigital * digitalBaseVol;
  } else {
    r = strategies[strategy].return;
    v = strategies[strategy].volatility;
  }
  if (crisisMode) {
    r *= 0.5;
    v *= 2;
  }

  const baskets =
    strategy === "Individuelle Strategie"
      ? [customFixed, customEquity, customDigital]
      : strategies[strategy].baskets;

  const riskScore = (baskets[0] * 2 + baskets[1] * 5 + baskets[2] * 6) / 100;

  // === Forecast ===
  const expected = [{ year: 0, value: investment }];
  const worst = [{ year: 0, value: investment }];
  const best = [{ year: 0, value: investment }];
  let e = investment;
  let w = investment;
  let b = investment;
  const annualContribution =
    recurringType === "monatlich" ? recurring * 12 : recurring;

  for (let i = 1; i <= horizon; i++) {
    const isCrisis = crisisMode && i % crisisCycle === 0;

    // Fixer Teil immer stabil
    const rFixed = fixedBaseReturn;

    // Risikoteil passt sich an
    const rEquity = isCrisis ? -0.4 : equityBaseReturn;
    const rDigital = isCrisis ? -0.6 : digitalBaseReturn;

    // Erwartete Gesamtrendite: stabiler Fix + volatiler Teil
    const riskPart = wEquity * rEquity + wDigital * rDigital;
    const rExpected = wFixed * rFixed + riskPart;

    // Volatilität nur für Risiko-Teil
    const riskVol = wEquity * equityBaseVol + wDigital * digitalBaseVol;

    // Worst & Best: fixer Teil + Risiko angepasst
    const rWorst = isCrisis
      ? wFixed * rFixed + (riskPart - 0.2)
      : wFixed * rFixed + (riskPart - riskVol);
    const rBest = isCrisis
      ? Math.max(wFixed * rFixed + riskPart, 0)
      : wFixed * rFixed + riskPart + riskVol;

    // Forecast weiter berechnen
    e = e * (1 + rExpected) + annualContribution;
    w = w * (1 + rWorst) + annualContribution;
    b = b * (1 + rBest) + annualContribution;

    expected.push({ year: i, value: Math.round(e) });
    worst.push({ year: i, value: Math.round(w) });
    best.push({ year: i, value: Math.round(b) });
  }

  // === Charts ===
  const chartData = {
    labels: expected.map((e) => e.year),
    datasets: [
      {
        label: "Erwartet",
        data: expected.map((e) => e.value),
        borderColor: "#3B82F6",
        tension: 0.3,
      },
      {
        label: "Schlecht",
        data: worst.map((w) => w.value),
        borderColor: "#EF4444",
        tension: 0.3,
      },
      {
        label: "Gut",
        data: best.map((b) => b.value),
        borderColor: "#10B981",
        tension: 0.3,
      },
    ],
  };

  const pieDataAssets = {
    labels: ["Fixed Income", "Equity+", "Digital Assets"],
    datasets: [
      { data: baskets, backgroundColor: ["#22C55E", "#3B82F6", "#EF4444"] },
    ],
  };

  const pieDataCurrency = {
    labels: ["CHF", "USD", "Digital"],
    datasets: [
      {
        data: [baskets[0], baskets[1] * 0.7, baskets[1] * 0.3 + baskets[2]],
        backgroundColor: ["#22C55E", "#3B82F6", "#EF4444"],
      },
    ],
  };

  const detailedAssets = {
    Cash: 2,
    GrundpfandbesicherteDarlehen: baskets[0] * 0.79,
    AlternativeDarlehen: baskets[0] * 0.21,
    Aktien: baskets[1] * 0.72,
    Anleihen: baskets[1] * 0.07,
    Gold: baskets[1] * 0.11,
    HedgeFonds: baskets[1] * 0.1,
    Bitcoin: baskets[2] * 0.65,
    Altcoins: baskets[2] * 0.35,
  };

  const pieDataDetailedAssets = {
    labels: Object.keys(detailedAssets),
    datasets: [
      {
        data: Object.values(detailedAssets),
        backgroundColor: [
          "#22C55E",
          "#3B82F6",
          "#0EA5E9",
          "#EF4444",
          "#F97316",
          "#EAB308",
          "#06B6D4",
          "#8B5CF6",
          "#10B981",
        ],
      },
    ],
  };

  const strategyDescriptions = {
    Zinsertrag:
      "Zinsertrag: Sehr defensiv, 100% Fixed Income – ideal für risikoscheue Anleger mit Fokus auf stabile Zinsen.",
    Conservative:
      "Konservativ: Kapitalerhalt steht im Vordergrund, geringes Risiko, moderate Rendite.",
    Balanced:
      "Ausgewogen: Gute Balance aus Sicherheit und Wachstum, für Anleger mit mittlerem Risikoappetit.",
    Growth:
      "Wachstum: Stärkere Aktiengewichtung für mehr Renditechancen, aber auch mehr Schwankung.",
    Aggressive:
      "Aggressiv: Für renditeorientierte Anleger mit hoher Risikobereitschaft.",
  };

  const quizQuestions = [
    "Welches Anlageziel steht für Sie im Vordergrund?",
    "Müssen Sie regelmässig oder im Notfall auf das investierte Kapital zugreifen?",
    "Über welchen Zeitraum kann das Kapital angelegt werden?",
    "Wie hoch ist Ihr gesamtes Vermögen (CHF)?",
    "Wie hoch sind Ihre bankmässig verwahrten Vermögenswerte (CHF)?",
    "Wie hoch ist Ihr jährliches Gesamtnettoeinkommen (CHF)?",
    "Sind Sie nebst Ihrem Einkommen auf zusätzliches Einkommen aus dem Vermögen angewiesen?",
    "Wie ist Ihre Risikoeinstellung?",
    "Innerhalb welcher Bandbreite sollten sich Rendite und Schwankungen bewegen?",
    "Wie reagieren Sie bei einem Verlust von 15%?",
    "Kenntnisse über Finanzprodukte und Risiken?",
    "Erfahrung mit Kreditfinanzierungen?",
    "Überwachen Sie die Wertentwicklung Ihrer Anlagen?",
  ];

  const quizOptions = [
    [
      { label: "Laufendes Einkommen", score: 0 },
      { label: "Langfristiger Kapitalerhalt", score: 3 },
      { label: "Vermögenszuwachs", score: 6 },
      { label: "Spekulation", score: 9 },
    ],
    [
      { label: "Ja", score: 0 },
      { label: "Unter Umständen", score: 3 },
      { label: "Kaum", score: 6 },
    ],
    [
      { label: "0–5 Jahre", score: 0 },
      { label: "5–10 Jahre", score: 3 },
      { label: ">10 Jahre", score: 6 },
    ],
    [
      { label: "0–3 Mio.", score: 0 },
      { label: "3–10 Mio.", score: 2 },
      { label: "10–25 Mio.", score: 4 },
      { label: ">25 Mio.", score: 6 },
    ],
    [
      { label: "0–2 Mio.", score: 0 },
      { label: "2–10 Mio.", score: 3 },
      { label: ">10 Mio.", score: 6 },
    ],
    [
      { label: "0–250'000", score: 0 },
      { label: "250'000–1 Mio.", score: 3 },
      { label: ">1 Mio.", score: 6 },
    ],
    [
      { label: "Ja", score: 0 },
      { label: "Nein", score: 4 },
    ],
    [
      { label: "Risikoavers", score: 2 },
      { label: "Risikobereit", score: 4 },
      { label: "Risikofreudig", score: 6 },
    ],
    [
      { label: "-5% bis +10%", score: 2 },
      { label: "-10% bis +20%", score: 4 },
      { label: "-20% bis +35%", score: 6 },
    ],
    [
      { label: "Verkaufen", score: 2 },
      { label: "Abwarten", score: 4 },
      { label: "Erhöhen", score: 6 },
    ],
    [
      { label: "Kenntnisse vorhanden", score: 2 },
      { label: "Gut informiert", score: 4 },
    ],
    [
      { label: "Keine", score: 0 },
      { label: "Wenig", score: 3 },
      { label: "Grosse", score: 6 },
    ],
    [
      { label: "Praktisch nie", score: 0 },
      { label: "1x pro Quartal", score: 2 },
      { label: "Monatlich", score: 4 },
      { label: "Täglich", score: 6 },
    ],
  ];

  const QuizButtons = ({ options }) => (
    <div className="space-y-2">
      {options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => {
            const allAnswers = [...quizAnswers, opt.score];
            setQuizAnswers(allAnswers);

            if (quizStep < quizQuestions.length - 1) {
              setQuizStep(quizStep + 1);
            } else {
              const rf = allAnswers.slice(0, 7).reduce((a, b) => a + b, 0);
              const rb = allAnswers.slice(7, 10).reduce((a, b) => a + b, 0);
              const ke = allAnswers.slice(10).reduce((a, b) => a + b, 0);

              const rfStage =
                rf < 9 ? 1 : rf < 18 ? 2 : rf < 27 ? 3 : rf < 36 ? 4 : 5;
              const rbStage =
                rb < 9 ? 1 : rb < 12 ? 2 : rb < 16 ? 3 : rb < 18 ? 4 : 5;
              const keStage =
                ke < 5 ? 1 : ke < 10 ? 2 : ke < 13 ? 3 : ke < 16 ? 4 : 5;

              const minStage = Math.min(rfStage, rbStage, keStage);

              let chosen = "Zinsertrag";
              if (minStage === 2) chosen = "Conservative";
              else if (minStage === 3) chosen = "Balanced";
              else if (minStage === 4) chosen = "Growth";
              else if (minStage === 5) chosen = "Aggressive";

              setQuizStages({
                fähigkeit: rfStage,
                bereitschaft: rbStage,
                ke: keStage,
              });
              setQuizResult(chosen);
            }
          }}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100 p-10 flex flex-col space-y-8">
      {/* Sidebar + Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="font-bold text-lg">Ihre Anlagedetails</h2>
          <div>
            <label className="text-sm">Startbetrag (CHF)</label>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm">Anlagehorizont (Jahre)</label>
            <input
              type="range"
              min="1"
              max="60"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-right">{horizon} Jahre</div>
          </div>
          <div>
            <label className="text-sm">Wiederkehrender Sparbeitrag</label>
            <input
              type="number"
              value={recurring}
              onChange={(e) => setRecurring(Number(e.target.value))}
              className="w-full border rounded p-2 mt-1"
            />
            <select
              value={recurringType}
              onChange={(e) => setRecurringType(e.target.value)}
              className="w-full border rounded p-2 mt-1"
            >
              <option value="monatlich">Monatlich</option>
              <option value="jährlich">Jährlich</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Anlagestrategie</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full border rounded p-2 mt-1"
            >
              {Object.keys(strategies).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setShowQuiz(true);
                setQuizStep(0);
                setQuizAnswers([]);
                setQuizResult("");
              }}
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Anlagestrategie jetzt bestimmen
            </button>
          </div>

          {strategy === "Individuelle Strategie" && (
            <div className="bg-gray-100 p-4 rounded-lg mt-4 space-y-6">
              <h3 className="font-bold text-md">⚙️ Individuelle Gewichtung</h3>
              <div>
                <label className="block mb-1 text-sm text-green-700">
                  Fixed Income
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customFixed}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const rem = 100 - v;
                    const t = customEquity + customDigital;
                    if (t > 0) {
                      setCustomEquity(Math.round((customEquity / t) * rem));
                      setCustomDigital(Math.round((customDigital / t) * rem));
                    } else {
                      setCustomEquity(rem);
                      setCustomDigital(0);
                    }
                    setCustomFixed(v);
                  }}
                  className="w-full accent-green-600"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-blue-700">
                  Equity+
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customEquity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const rem = 100 - v;
                    const t = customFixed + customDigital;
                    if (t > 0) {
                      setCustomFixed(Math.round((customFixed / t) * rem));
                      setCustomDigital(Math.round((customDigital / t) * rem));
                    } else {
                      setCustomFixed(rem);
                      setCustomDigital(0);
                    }
                    setCustomEquity(v);
                  }}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-red-700">
                  Digital Assets
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customDigital}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const rem = 100 - v;
                    const t = customFixed + customEquity;
                    if (t > 0) {
                      setCustomFixed(Math.round((customFixed / t) * rem));
                      setCustomEquity(Math.round((customEquity / t) * rem));
                    } else {
                      setCustomFixed(rem);
                      setCustomEquity(0);
                    }
                    setCustomDigital(v);
                  }}
                  className="w-full accent-red-600"
                />
              </div>
              <p className="text-sm font-semibold">
                Summe:{" "}
                <span
                  className={
                    customFixed + customEquity + customDigital === 100
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {customFixed + customEquity + customDigital} %
                </span>
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Risikoprofil</h3>
            <div className="flex items-center justify-between">
              <div>
                <p>Volatilität: {(v * 100).toFixed(1)}%</p>
                <p>Rendite: {(r * 100).toFixed(1)}%</p>
                <p>Risiko-Score: {riskScore.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h2 className="font-bold text-lg">Vermögensentwicklung</h2>
            <button
              onClick={() => setCrisisMode(!crisisMode)}
              className={`px-4 py-2 rounded font-semibold transition ${
                crisisMode ? "bg-red-600 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {crisisMode ? "🔴 Krisenmodus AKTIV" : "🟢 Krisenmodus INAKTIV"}
            </button>
          </div>
          <Line data={chartData} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold mb-2">Basket-Allokation</h2>
          <Pie data={pieDataAssets} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold mb-2">Währungs-Allokation</h2>
          <Pie data={pieDataCurrency} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold mb-2">Detaillierte Vermögensklassen</h2>
          <Pie data={pieDataDetailedAssets} />
        </div>
      </div>

      {showQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow max-w-lg w-full space-y-6">
            {!quizResult && (
              <>
                <h2 className="font-bold text-lg">
                  Frage {quizStep + 1} von {quizQuestions.length}
                </h2>
                <p>{quizQuestions[quizStep]}</p>
                <QuizButtons options={quizOptions[quizStep]} />
              </>
            )}

            {quizResult && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg">Ihre Auswertung</h2>

                <div className="space-y-2">
                  <p>Risikofähigkeit:</p>
                  <div className="w-full bg-gray-200 rounded h-4">
                    <div
                      className="bg-blue-600 h-4 rounded"
                      style={{ width: `${(quizStages.fähigkeit / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm">{quizStages.fähigkeit} von 5</p>

                  <p>Risikobereitschaft:</p>
                  <div className="w-full bg-gray-200 rounded h-4">
                    <div
                      className="bg-green-600 h-4 rounded"
                      style={{
                        width: `${(quizStages.bereitschaft / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm">{quizStages.bereitschaft} von 5</p>

                  <p>Kenntnisse & Erfahrungen:</p>
                  <div className="w-full bg-gray-200 rounded h-4">
                    <div
                      className="bg-purple-600 h-4 rounded"
                      style={{ width: `${(quizStages.ke / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm">{quizStages.ke} von 5</p>
                </div>

                <h3 className="font-bold text-lg">Empfohlene Strategie:</h3>
                <p className="text-blue-600 text-xl">{quizResult}</p>
                <p>{strategyDescriptions[quizResult]}</p>

                <button
                  onClick={() => {
                    setStrategy(quizResult);
                    setShowQuiz(false);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Übernehmen & Schließen
                </button>
              </div>
            )}

            <button
              onClick={() => setShowQuiz(false)}
              className="text-red-600 underline"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
