const methodPalette = {
  "Baseline": "#A8B4C5",
  "DiCache": "#5B93C9",
  "FasterCache": "#F59E0B",
  "EasyCache": "#8B5CF6",
  "TeaCache (Fast)": "#FB923C",
  "TeaCache (Slow)": "#FACC15",
  "WorldCache": "#14B8A6"
};

const fullPaiColumns = [
  { key: "method", label: "Method", type: "text" },
  { key: "cs", label: "CS", digits: 3 },
  { key: "av", label: "AV", digits: 3 },
  { key: "ro", label: "RO", digits: 3 },
  { key: "in", label: "IN", digits: 3 },
  { key: "hu", label: "HU", digits: 3 },
  { key: "ph", label: "PH", digits: 3 },
  { key: "mi", label: "MI", digits: 3 },
  { key: "domain", label: "Domain Avg", digits: 3 },
  { key: "sc", label: "SC", digits: 3 },
  { key: "bc", label: "BC", digits: 3 },
  { key: "ms", label: "MS", digits: 3 },
  { key: "aq", label: "AQ", digits: 3 },
  { key: "iq", label: "IQ", digits: 3 },
  { key: "oc", label: "OC", digits: 3 },
  { key: "is", label: "IS", digits: 3 },
  { key: "ib", label: "IB", digits: 3 },
  { key: "quality", label: "Quality Avg", digits: 3 },
  { key: "overall", label: "Overall", digits: 3 },
  { key: "latency", label: "Latency (s)", type: "latency" },
  { key: "speedup", label: "Speedup", type: "speedup" }
];

const avgColumns4 = [
  { key: "method", label: "Method", type: "text" },
  { key: "domain", label: "Domain Avg", digits: 4 },
  { key: "quality", label: "Quality Avg", digits: 4 },
  { key: "overall", label: "Overall", digits: 4 },
  { key: "latency", label: "Latency (s)", type: "latency" },
  { key: "speedup", label: "Speedup", type: "speedup" }
];

const avgColumns3 = [
  { key: "method", label: "Method", type: "text" },
  { key: "domain", label: "Domain Avg", digits: 3 },
  { key: "quality", label: "Quality Avg", digits: 3 },
  { key: "overall", label: "Overall", digits: 3 },
  { key: "latency", label: "Latency (s)", type: "latency" },
  { key: "speedup", label: "Speedup", type: "speedup" }
];

const egoDexColumns = [
  { key: "method", label: "Method", type: "text" },
  { key: "psnr", label: "PSNR", digits: 2 },
  { key: "ssim", label: "SSIM", digits: 3 },
  { key: "lpips", label: "LPIPS", digits: 3 },
  { key: "latency", label: "Latency (s)", type: "latency" },
  { key: "speedup", label: "Speedup", type: "speedup" }
];

const summaryColumns = [
  { key: "benchmark", label: "Benchmark", type: "text" },
  { key: "setting", label: "Setting", type: "text" },
  { key: "metric", label: "Key Metric", type: "text" },
  { key: "metricPair", label: "Baseline → WorldCache", type: "text" },
  { key: "latencyPair", label: "Latency (s)", type: "text" },
  { key: "speedupText", label: "Speedup", type: "text" },
  { key: "retentionText", label: "Retention", type: "text" }
];

const moduleData = [
  {
    id: "cfc",
    label: "CFC",
    title: "Causal Feature Caching",
    plain: "First ask: how much is the scene moving? If motion is strong, be more conservative about reusing cached computation.",
    formula: "tau_CFC(v_t) = tau_0 / (1 + alpha · v_t)",
    why: "This lowers the chance of a bad cache hit when fast motion would make stale features drift away from the current scene.",
    tech: "The paper anchors motion to t-2 because t-1 may already be an approximated cache hit, which makes the velocity estimate more reliable."
  },
  {
    id: "swd",
    label: "SWD",
    title: "Saliency-Weighted Drift",
    plain: "Not every pixel matters equally. SWD focuses the skip decision on regions where errors are most visible, like edges, hands, agents, and manipulated objects.",
    formula: "skip iff delta_SWD < tau_CFC(v_t)",
    why: "Static background drift should not hide important foreground motion. SWD makes the probe care about the parts people notice most.",
    tech: "The saliency map is built from channel variance in probe features, then used to reweight drift so information-rich regions contribute more."
  },
  {
    id: "ofa",
    label: "OFA",
    title: "Optimal Feature Approximation",
    plain: "If the model decides to skip deep blocks, it should not just copy old features. OFA predicts a better approximation from recent residual history and optional motion alignment.",
    formula: "gamma* = <Delta_tgt, Delta_src> / (||Delta_src||^2 + eps)",
    why: "This reduces the directional error that appears when motion curves or changes direction, which is where simple scalar reuse often breaks.",
    tech: "OFA combines optimal state interpolation with optional latent-space motion warping before applying the residual update."
  },
  {
    id: "ats",
    label: "ATS",
    title: "Adaptive Threshold Scheduling",
    plain: "Early denoising builds the scene, late denoising mostly refines it. ATS stays strict early and relaxes later, where extra cache hits are safer and more rewarding.",
    formula: "tau_ATS(t) = tau_CFC(v_t) · (1 + beta_d · t / T)",
    why: "The biggest speedups come late in denoising, after layout and motion are already stable enough that approximation is less risky.",
    tech: "The paper uses tau_0 = 0.08, alpha = 2.0, beta_s = 0.12, and beta_d = 4.0 as default settings across models and tasks."
  }
];

const datasets = {
  cosmos_i2w_2b: {
    family: "cosmos",
    label: "I2W · 2B",
    title: "Cosmos-Predict2.5 · Image2World · 2B",
    description: "WorldCache reaches 2.3× speedup in the main Cosmos-2B Image2World benchmark while keeping the overall score near the baseline.",
    headline: "Headline result · 2.3× speedup",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: fullPaiColumns,
    tableTitle: "Table 2 · PAI-Bench I2W results across two scales",
    tableNote: "Fine-grained table with per-category Domain and Quality metrics.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "Higher overall score and higher speedup is better.",
    rows: [
      { method: "Baseline", cs: 0.919, av: 0.694, ro: 0.811, in: 0.877, hu: 0.840, ph: 0.909, mi: 0.886, domain: 0.845, sc: 0.896, bc: 0.929, ms: 0.982, aq: 0.505, iq: 0.674, oc: 0.212, is: 0.936, ib: 0.952, quality: 0.761, overall: 0.803, latency: 57.04, speedup: 1.00 },
      { method: "DiCache", cs: 0.899, av: 0.697, ro: 0.791, in: 0.876, hu: 0.828, ph: 0.887, mi: 0.909, domain: 0.835, sc: 0.885, bc: 0.923, ms: 0.980, aq: 0.492, iq: 0.660, oc: 0.212, is: 0.927, ib: 0.940, quality: 0.752, overall: 0.794, latency: 39.68, speedup: 1.46 },
      { method: "FasterCache", cs: 0.855, av: 0.676, ro: 0.697, in: 0.829, hu: 0.739, ph: 0.851, mi: 0.847, domain: 0.772, sc: 0.800, bc: 0.872, ms: 0.974, aq: 0.432, iq: 0.577, oc: 0.197, is: 0.888, ib: 0.919, quality: 0.708, overall: 0.740, latency: 32.75, speedup: 1.78 },
      { method: "WorldCache", cs: 0.912, av: 0.708, ro: 0.796, in: 0.876, hu: 0.833, ph: 0.893, mi: 0.890, domain: 0.840, sc: 0.892, bc: 0.926, ms: 0.982, aq: 0.496, iq: 0.661, oc: 0.212, is: 0.931, ib: 0.948, quality: 0.756, overall: 0.798, latency: 25.96, speedup: 2.30 }
    ]
  },
  cosmos_i2w_14b: {
    family: "cosmos",
    label: "I2W · 14B",
    title: "Cosmos-Predict2.5 · Image2World · 14B",
    description: "At 14B scale, WorldCache reduces latency from 210.07 s to 112.24 s while staying almost indistinguishable from the baseline in overall score.",
    headline: "1.87× speedup · near-baseline quality",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: fullPaiColumns,
    tableTitle: "Table 2 · PAI-Bench I2W results across two scales",
    tableNote: "Fine-grained table with per-category metrics.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "WorldCache stays close to baseline quality while moving to a faster point.",
    rows: [
      { method: "Baseline", cs: 0.920, av: 0.716, ro: 0.826, in: 0.905, hu: 0.849, ph: 0.922, mi: 0.924, domain: 0.860, sc: 0.912, bc: 0.935, ms: 0.988, aq: 0.510, iq: 0.665, oc: 0.213, is: 0.958, ib: 0.966, quality: 0.769, overall: 0.814, latency: 210.07, speedup: 1.00 },
      { method: "DiCache", cs: 0.913, av: 0.716, ro: 0.826, in: 0.886, hu: 0.844, ph: 0.920, mi: 0.921, domain: 0.855, sc: 0.911, bc: 0.935, ms: 0.988, aq: 0.509, iq: 0.658, oc: 0.212, is: 0.956, ib: 0.965, quality: 0.767, overall: 0.811, latency: 146.04, speedup: 1.44 },
      { method: "FasterCache", cs: 0.856, av: 0.688, ro: 0.715, in: 0.842, hu: 0.743, ph: 0.869, mi: 0.862, domain: 0.782, sc: 0.813, bc: 0.873, ms: 0.975, aq: 0.437, iq: 0.567, oc: 0.195, is: 0.906, ib: 0.930, quality: 0.712, overall: 0.747, latency: 123.75, speedup: 1.70 },
      { method: "WorldCache", cs: 0.923, av: 0.727, ro: 0.824, in: 0.901, hu: 0.845, ph: 0.925, mi: 0.909, domain: 0.859, sc: 0.912, bc: 0.935, ms: 0.988, aq: 0.509, iq: 0.664, oc: 0.213, is: 0.957, ib: 0.966, quality: 0.768, overall: 0.813, latency: 112.24, speedup: 1.87 }
    ]
  },
  cosmos_t2w_2b: {
    family: "cosmos",
    label: "T2W · 2B",
    title: "Cosmos-Predict2.5 · Text2World · 2B",
    description: "WorldCache reduces latency from 58.34 s to 26.78 s while keeping the overall score at 0.745 versus 0.748 for the baseline.",
    headline: "2.18× speedup · 99.6% score retention",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: fullPaiColumns,
    tableTitle: "Table 1 · PAI-Bench T2W results across two scales",
    tableNote: "Fine-grained table with per-category Domain and Quality metrics.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "WorldCache is the strongest frontier point in the 2B Text2World setting.",
    rows: [
      { method: "Baseline", cs: 0.759, av: 0.643, ro: 0.724, in: 0.820, hu: 0.769, ph: 0.859, mi: 0.846, domain: 0.767, sc: 0.909, bc: 0.929, ms: 0.979, aq: 0.501, iq: 0.712, oc: 0.199, is: 0.788, ib: 0.808, quality: 0.728, overall: 0.748, latency: 58.34, speedup: 1.00 },
      { method: "DiCache", cs: 0.756, av: 0.631, ro: 0.707, in: 0.799, hu: 0.773, ph: 0.849, mi: 0.833, domain: 0.759, sc: 0.902, bc: 0.925, ms: 0.978, aq: 0.493, iq: 0.705, oc: 0.197, is: 0.780, ib: 0.838, quality: 0.727, overall: 0.743, latency: 40.82, speedup: 1.43 },
      { method: "FasterCache", cs: 0.675, av: 0.553, ro: 0.549, in: 0.691, hu: 0.652, ph: 0.719, mi: 0.745, domain: 0.629, sc: 0.849, bc: 0.909, ms: 0.970, aq: 0.405, iq: 0.594, oc: 0.176, is: 0.709, ib: 0.796, quality: 0.676, overall: 0.652, latency: 34.51, speedup: 1.69 },
      { method: "WorldCache", cs: 0.759, av: 0.639, ro: 0.735, in: 0.810, hu: 0.760, ph: 0.845, mi: 0.839, domain: 0.763, sc: 0.903, bc: 0.927, ms: 0.979, aq: 0.492, iq: 0.703, oc: 0.196, is: 0.782, ib: 0.826, quality: 0.727, overall: 0.745, latency: 26.78, speedup: 2.18 }
    ]
  },
  cosmos_t2w_14b: {
    family: "cosmos",
    label: "T2W · 14B",
    title: "Cosmos-Predict2.5 · Text2World · 14B",
    description: "At 14B scale, WorldCache reaches 114.76 s latency and slightly improves the overall score relative to the baseline.",
    headline: "1.90× speedup · slight score gain",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: fullPaiColumns,
    tableTitle: "Table 1 · PAI-Bench T2W results across two scales",
    tableNote: "Fine-grained table with per-category metrics.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "WorldCache moves up and to the right on the speed-quality plot.",
    rows: [
      { method: "Baseline", cs: 0.782, av: 0.643, ro: 0.762, in: 0.828, hu: 0.794, ph: 0.900, mi: 0.880, domain: 0.792, sc: 0.940, bc: 0.948, ms: 0.988, aq: 0.518, iq: 0.719, oc: 0.202, is: 0.806, ib: 0.846, quality: 0.746, overall: 0.769, latency: 216.25, speedup: 1.00 },
      { method: "DiCache", cs: 0.795, av: 0.645, ro: 0.757, in: 0.819, hu: 0.790, ph: 0.906, mi: 0.880, domain: 0.792, sc: 0.939, bc: 0.949, ms: 0.988, aq: 0.518, iq: 0.714, oc: 0.201, is: 0.806, ib: 0.845, quality: 0.745, overall: 0.768, latency: 148.36, speedup: 1.45 },
      { method: "FasterCache", cs: 0.707, av: 0.564, ro: 0.584, in: 0.710, hu: 0.677, ph: 0.773, mi: 0.785, domain: 0.659, sc: 0.884, bc: 0.930, ms: 0.979, aq: 0.427, iq: 0.604, oc: 0.180, is: 0.731, ib: 0.821, quality: 0.694, overall: 0.676, latency: 126.60, speedup: 1.70 },
      { method: "WorldCache", cs: 0.792, av: 0.659, ro: 0.751, in: 0.838, hu: 0.794, ph: 0.908, mi: 0.879, domain: 0.795, sc: 0.940, bc: 0.948, ms: 0.987, aq: 0.517, iq: 0.718, oc: 0.201, is: 0.804, ib: 0.856, quality: 0.746, overall: 0.771, latency: 114.76, speedup: 1.90 }
    ]
  },
  wan_t2w_13b: {
    family: "wan",
    label: "T2W · 1.3B",
    title: "WAN2.1 · Text2World · 1.3B",
    description: "WorldCache transfers cleanly to WAN2.1 and improves both speed and score over DiCache in the 1.3B Text2World setting.",
    headline: "2.36× speedup on WAN2.1",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: avgColumns4,
    tableTitle: "Table 3 · WAN2.1 transfer results",
    tableNote: "Domain Avg, Quality Avg, Overall, latency, and speedup for the transfer benchmark.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "WorldCache keeps the WAN2.1 transfer story simple: faster and slightly better than DiCache.",
    rows: [
      { method: "Baseline", domain: 0.7862, quality: 0.7592, overall: 0.7727, latency: 120.04, speedup: 1.00 },
      { method: "DiCache", domain: 0.7841, quality: 0.7564, overall: 0.7703, latency: 61.57, speedup: 1.96 },
      { method: "WorldCache", domain: 0.7853, quality: 0.7589, overall: 0.7721, latency: 50.84, speedup: 2.36 }
    ]
  },
  wan_i2w_14b: {
    family: "wan",
    label: "I2W · 14B",
    title: "WAN2.1 · Image2World · 14B",
    description: "At 14B Image2World, WorldCache recovers the overall score to 0.7388 while reducing latency from 475.60 s to 206.73 s.",
    headline: "2.31× speedup with recovered score",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: avgColumns4,
    tableTitle: "Table 3 · WAN2.1 transfer results",
    tableNote: "Simplified transfer table for WAN2.1.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "WorldCache reaches the strongest WAN2.1 frontier point in the 14B Image2World setting.",
    rows: [
      { method: "Baseline", domain: 0.7065, quality: 0.7703, overall: 0.7384, latency: 475.60, speedup: 1.00 },
      { method: "DiCache", domain: 0.6949, quality: 0.7672, overall: 0.7311, latency: 291.91, speedup: 1.53 },
      { method: "WorldCache", domain: 0.7069, quality: 0.7707, overall: 0.7388, latency: 206.73, speedup: 2.31 }
    ]
  },
  egodex_wan14b: {
    family: "egodex",
    label: "WAN2.1-14B",
    title: "EgoDex-Eval · WAN2.1-14B",
    description: "Under ground-truth-conditioned robotics video evaluation, WorldCache beats DiCache while keeping PSNR, SSIM, and LPIPS close to the baseline.",
    headline: "2.30× speedup in robotics evaluation",
    metricKey: "psnr",
    metricLabel: "PSNR",
    columns: egoDexColumns,
    tableTitle: "Table 6 · EgoDex-Eval results",
    tableNote: "Frame-level PSNR, SSIM, LPIPS, latency, and speedup against ground-truth videos.",
    frontierTitle: "PSNR vs. speedup",
    frontierDescription: "Higher PSNR and higher speedup are better for this robotics evaluation view.",
    rows: [
      { method: "Baseline", psnr: 13.30, ssim: 0.503, lpips: 0.459, latency: 391.90, speedup: 1.00 },
      { method: "DiCache", psnr: 12.95, ssim: 0.491, lpips: 0.461, latency: 208.60, speedup: 1.88 },
      { method: "WorldCache", psnr: 13.19, ssim: 0.498, lpips: 0.460, latency: 171.60, speedup: 2.30 }
    ]
  },
  egodex_cosmos2b: {
    family: "egodex",
    label: "Cosmos-2.5-2B",
    title: "EgoDex-Eval · Cosmos-Predict-2.5-2B",
    description: "WorldCache reaches 1.62× speedup while preserving PSNR and matching the best LPIPS, with SSIM slightly above the baseline.",
    headline: "1.62× speedup · matched LPIPS",
    metricKey: "psnr",
    metricLabel: "PSNR",
    columns: egoDexColumns,
    tableTitle: "Table 6 · EgoDex-Eval results",
    tableNote: "Frame-level fidelity metrics from the robotics evaluation table.",
    frontierTitle: "PSNR vs. speedup",
    frontierDescription: "WorldCache improves the speed-fidelity point over DiCache for Cosmos on EgoDex-Eval.",
    rows: [
      { method: "Baseline", psnr: 12.87, ssim: 0.455, lpips: 0.518, latency: 70.01, speedup: 1.00 },
      { method: "DiCache", psnr: 12.63, ssim: 0.445, lpips: 0.531, latency: 51.97, speedup: 1.34 },
      { method: "WorldCache", psnr: 12.82, ssim: 0.466, lpips: 0.518, latency: 43.24, speedup: 1.62 }
    ]
  },
  egodex_dreamdojo2b: {
    family: "egodex",
    label: "DreamDojo-2B",
    title: "EgoDex-Eval · DreamDojo-2B",
    description: "WorldCache reaches 1.90× speedup on DreamDojo-2B while preserving PSNR very closely to the baseline.",
    headline: "1.90× speedup on DreamDojo",
    metricKey: "psnr",
    metricLabel: "PSNR",
    columns: egoDexColumns,
    tableTitle: "Table 6 · EgoDex-Eval results",
    tableNote: "Frame-level fidelity metrics from the robotics evaluation table.",
    frontierTitle: "PSNR vs. speedup",
    frontierDescription: "WorldCache remains much closer to the baseline than DiCache on DreamDojo.",
    rows: [
      { method: "Baseline", psnr: 23.63, ssim: 0.775, lpips: 0.226, latency: 19.73, speedup: 1.00 },
      { method: "DiCache", psnr: 20.41, ssim: 0.734, lpips: 0.252, latency: 12.46, speedup: 1.58 },
      { method: "WorldCache", psnr: 23.69, ssim: 0.737, lpips: 0.251, latency: 10.36, speedup: 1.90 }
    ]
  },
  supp_t2w_cosmos2b: {
    family: "supplementary",
    label: "Cosmos-2B · T2W",
    title: "Supplementary · Cosmos-Predict2.5-2B · Text2World",
    description: "The extended comparison adds EasyCache and TeaCache, and WorldCache still pushes well past 2× speedup while staying in the same quality band.",
    headline: "Extended comparison with EasyCache and TeaCache",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: avgColumns4,
    tableTitle: "Table 5 · Supplementary extended comparison",
    tableNote: "Supplementary rows including EasyCache and TeaCache.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "The supplementary table makes the speed gap easy to see.",
    rows: [
      { method: "Baseline", domain: 0.7670, quality: 0.7280, overall: 0.7475, latency: 58.34, speedup: 1.00 },
      { method: "EasyCache", domain: 0.7641, quality: 0.7262, overall: 0.7451, latency: 41.41, speedup: 1.40 },
      { method: "DiCache", domain: 0.7590, quality: 0.7272, overall: 0.7431, latency: 40.82, speedup: 1.43 },
      { method: "TeaCache (Fast)", domain: 0.7616, quality: 0.7266, overall: 0.7448, latency: 41.07, speedup: 1.42 },
      { method: "TeaCache (Slow)", domain: 0.7634, quality: 0.7274, overall: 0.7454, latency: 49.40, speedup: 1.18 },
      { method: "WorldCache", domain: 0.7630, quality: 0.7270, overall: 0.7450, latency: 26.78, speedup: 2.18 }
    ]
  },
  supp_i2w_cosmos2b: {
    family: "supplementary",
    label: "Cosmos-2B · I2W",
    title: "Supplementary · Cosmos-Predict2.5-2B · Image2World",
    description: "The extended Image2World comparison shows the same pattern: WorldCache is much faster than the other training-free baselines while remaining in the same score range.",
    headline: "Extended I2W comparison",
    metricKey: "overall",
    metricLabel: "Overall",
    columns: avgColumns4,
    tableTitle: "Table 5 · Supplementary extended comparison",
    tableNote: "Supplementary rows including EasyCache and TeaCache.",
    frontierTitle: "Overall score vs. speedup",
    frontierDescription: "WorldCache separates from the cluster of ~1.4× methods while staying competitive on overall score.",
    rows: [
      { method: "Baseline", domain: 0.8450, quality: 0.7610, overall: 0.8030, latency: 57.04, speedup: 1.00 },
      { method: "EasyCache", domain: 0.8399, quality: 0.7552, overall: 0.7975, latency: 40.25, speedup: 1.42 },
      { method: "DiCache", domain: 0.8352, quality: 0.7522, overall: 0.7941, latency: 39.68, speedup: 1.46 },
      { method: "TeaCache (Fast)", domain: 0.8381, quality: 0.7549, overall: 0.7965, latency: 41.00, speedup: 1.39 },
      { method: "TeaCache (Slow)", domain: 0.8396, quality: 0.7562, overall: 0.7979, latency: 49.59, speedup: 1.15 },
      { method: "WorldCache", domain: 0.8395, quality: 0.7559, overall: 0.7977, latency: 25.06, speedup: 2.30 }
    ]
  }
};

const families = [
  { id: "cosmos", label: "Cosmos", datasets: ["cosmos_i2w_2b", "cosmos_i2w_14b", "cosmos_t2w_2b", "cosmos_t2w_14b"] },
  { id: "wan", label: "WAN2.1", datasets: ["wan_t2w_13b", "wan_i2w_14b"] },
  { id: "egodex", label: "EgoDex", datasets: ["egodex_wan14b", "egodex_cosmos2b", "egodex_dreamdojo2b"] },
  { id: "supplementary", label: "Supplementary", datasets: ["supp_t2w_cosmos2b", "supp_i2w_cosmos2b"] },
  { id: "all", label: "All results", datasets: [] }
];

const budgetData = [
  { steps: 35, worldcacheLatency: 25.0, worldcacheSpeedup: 2.3, dicacheSpeedup: 1.5, baselineLatency: 57.0 },
  { steps: 70, worldcacheLatency: 34.2, worldcacheSpeedup: 2.9, dicacheSpeedup: 1.6 },
  { steps: 100, worldcacheLatency: 45.5, worldcacheSpeedup: 3.1, dicacheSpeedup: 1.7 },
  { steps: 140, worldcacheLatency: 66.0, worldcacheSpeedup: 3.0, dicacheSpeedup: 2.3, baselineLatency: 199.1 }
].map((item, index, array) => {
  const baselineLatency = item.baselineLatency ?? roundTo(item.worldcacheLatency * item.worldcacheSpeedup, 1);
  const dicacheLatency = roundTo(baselineLatency / item.dicacheSpeedup, 1);
  return { ...item, baselineLatency, dicacheLatency };
});

Object.values(datasets).forEach((dataset) => {
  dataset.rows = dataset.rows.map((row) => ({
    ...row,
    color: methodPalette[row.method] || "#94A3B8",
    highlight: row.method === "WorldCache"
  }));
});

let currentFamily = "cosmos";
let currentDataset = "cosmos_i2w_2b";
let currentModule = "cfc";
let currentBudgetIndex = 2;

function roundTo(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatSpeedup(value) {
  return `${Number(value).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}×`;
}

function formatMetric(value, digits = 3) {
  return Number(value).toFixed(digits);
}

function formatLatency(value) {
  return Number(value).toFixed(2);
}

function formatCellValue(column, value) {
  if (column.type === "text") return value;
  if (column.type === "latency") return formatLatency(value);
  if (column.type === "speedup") return formatSpeedup(value);
  return Number(value).toFixed(column.digits ?? 3);
}

function getDataset(id) {
  return datasets[id];
}

function getFamily(id) {
  return families.find((item) => item.id === id);
}

function getRow(dataset, method) {
  return dataset.rows.find((row) => row.method === method);
}

function retentionPercent(dataset) {
  const baseline = getRow(dataset, "Baseline");
  const wc = getRow(dataset, "WorldCache");
  if (!baseline || !wc) return null;
  return (wc[dataset.metricKey] / baseline[dataset.metricKey]) * 100;
}

function latencyReductionPercent(dataset) {
  const baseline = getRow(dataset, "Baseline");
  const wc = getRow(dataset, "WorldCache");
  if (!baseline || !wc) return null;
  return (1 - wc.latency / baseline.latency) * 100;
}

function diffVsDiCache(dataset, key) {
  const wc = getRow(dataset, "WorldCache");
  const dc = getRow(dataset, "DiCache");
  if (!wc || !dc || typeof wc[key] === "undefined" || typeof dc[key] === "undefined") return null;
  return wc[key] - dc[key];
}

function buildModuleTabs() {
  const tabs = document.getElementById("moduleTabs");
  tabs.innerHTML = "";
  moduleData.forEach((item) => {
    const button = document.createElement("button");
    button.className = `module-tab${item.id === currentModule ? " active" : ""}`;
    button.textContent = item.label;
    button.addEventListener("click", () => {
      currentModule = item.id;
      buildModuleTabs();
      renderModuleDetail();
    });
    tabs.appendChild(button);
  });
}

function renderModuleDetail() {
  const item = moduleData.find((entry) => entry.id === currentModule) || moduleData[0];
  document.getElementById("moduleBadge").textContent = item.label;
  document.getElementById("moduleTitle").textContent = item.title;
  document.getElementById("modulePlain").textContent = item.plain;
  document.getElementById("moduleFormula").textContent = item.formula;
  document.getElementById("moduleWhy").textContent = item.why;
  document.getElementById("moduleTech").textContent = item.tech;
}

function buildResultsTabs() {
  const familyTabs = document.getElementById("familyTabs");
  const datasetTabs = document.getElementById("datasetTabs");
  familyTabs.innerHTML = "";
  families.forEach((family) => {
    const button = document.createElement("button");
    button.className = family.id === currentFamily ? "active" : "";
    button.textContent = family.label;
    button.addEventListener("click", () => {
      currentFamily = family.id;
      currentDataset = family.datasets[0] || currentDataset;
      buildResultsTabs();
      renderResults();
    });
    familyTabs.appendChild(button);
  });

  datasetTabs.innerHTML = "";
  if (currentFamily === "all") {
    datasetTabs.classList.add("hidden");
    return;
  }

  datasetTabs.classList.remove("hidden");
  const family = getFamily(currentFamily);
  family.datasets.forEach((datasetId) => {
    const dataset = getDataset(datasetId);
    const button = document.createElement("button");
    button.className = datasetId === currentDataset ? "active" : "";
    button.textContent = dataset.label;
    button.addEventListener("click", () => {
      currentDataset = datasetId;
      buildResultsTabs();
      renderResults();
    });
    datasetTabs.appendChild(button);
  });
}

function renderResultsStats(dataset) {
  const container = document.getElementById("resultsStats");
  const baseline = getRow(dataset, "Baseline");
  const wc = getRow(dataset, "WorldCache");
  const metricDelta = diffVsDiCache(dataset, dataset.metricKey);
  const speedupDelta = diffVsDiCache(dataset, "speedup");
  const reduction = latencyReductionPercent(dataset);

  const metricDigits = dataset.metricKey === "psnr" ? 2 : 3;
  const metricLabel = dataset.metricLabel;
  const deltaText = metricDelta === null ? "n/a" : `${metricDelta >= 0 ? "+" : ""}${metricDelta.toFixed(metricDigits)}`;

  const stats = [
    {
      label: "WorldCache latency",
      value: `${formatLatency(wc.latency)} s`,
      note: `Baseline ${formatLatency(baseline.latency)} s`
    },
    {
      label: "WorldCache speedup",
      value: formatSpeedup(wc.speedup),
      note: `${reduction.toFixed(1)}% latency reduction`
    },
    {
      label: metricLabel,
      value: formatMetric(wc[dataset.metricKey], metricDigits),
      note: `Baseline ${formatMetric(baseline[dataset.metricKey], metricDigits)}`
    },
    {
      label: "vs. DiCache",
      value: speedupDelta === null ? "n/a" : `${speedupDelta >= 0 ? "+" : ""}${speedupDelta.toFixed(2)}×`,
      note: `${metricLabel} ${deltaText}`
    }
  ];

  container.innerHTML = "";
  stats.forEach((item) => {
    const article = document.createElement("article");
    article.className = "metric-card";
    article.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong><small>${item.note}</small>`;
    container.appendChild(article);
  });
}

function renderLatencyBars(rows) {
  const container = document.getElementById("latencyBars");
  container.innerHTML = "";
  const maxLatency = Math.max(...rows.map((row) => row.latency));
  rows.forEach((row) => {
    const barRow = document.createElement("div");
    barRow.className = "bar-row";
    const width = `${(row.latency / maxLatency) * 100}%`;
    barRow.innerHTML = `
      <div class="bar-label">${row.method}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${width};background:${row.color};opacity:${row.method === "WorldCache" ? 1 : 0.78};"></div></div>
      <div class="bar-meta"><strong>${formatLatency(row.latency)} s</strong><br>${formatSpeedup(row.speedup)}</div>
    `;
    container.appendChild(barRow);
  });
}

function renderLegend(rows) {
  const legend = document.getElementById("frontierLegend");
  legend.innerHTML = "";
  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-swatch" style="background:${row.color};"></span>${row.method}`;
    legend.appendChild(item);
  });
}

function renderFrontierChart(dataset) {
  const svg = document.getElementById("frontierChart");
  const width = 620;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 54, left: 72 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const xValues = dataset.rows.map((row) => row[dataset.metricKey]);
  const yValues = dataset.rows.map((row) => row.speedup);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const xPad = (xMax - xMin || 1) * 0.18;
  const yPad = (yMax - yMin || 1) * 0.2;
  const xDomainMin = xMin - xPad;
  const xDomainMax = xMax + xPad;
  const yDomainMin = Math.max(0, yMin - yPad);
  const yDomainMax = yMax + yPad;

  const scaleX = (value) => margin.left + ((value - xDomainMin) / (xDomainMax - xDomainMin)) * innerWidth;
  const scaleY = (value) => margin.top + innerHeight - ((value - yDomainMin) / (yDomainMax - yDomainMin)) * innerHeight;

  let content = "";

  for (let i = 0; i <= 4; i += 1) {
    const xValue = xDomainMin + (i / 4) * (xDomainMax - xDomainMin);
    const x = scaleX(xValue);
    content += `<line class="chart-grid" x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + innerHeight}"></line>`;
    content += `<text class="chart-label" x="${x}" y="${margin.top + innerHeight + 24}" text-anchor="middle">${xValue.toFixed(dataset.metricKey === "psnr" ? 2 : 3)}</text>`;
  }

  for (let i = 0; i <= 4; i += 1) {
    const yValue = yDomainMin + (i / 4) * (yDomainMax - yDomainMin);
    const y = scaleY(yValue);
    content += `<line class="chart-grid" x1="${margin.left}" y1="${y}" x2="${margin.left + innerWidth}" y2="${y}"></line>`;
    content += `<text class="chart-label" x="${margin.left - 12}" y="${y + 4}" text-anchor="end">${yValue.toFixed(2)}</text>`;
  }

  content += `<line class="chart-axis" x1="${margin.left}" y1="${margin.top + innerHeight}" x2="${margin.left + innerWidth}" y2="${margin.top + innerHeight}"></line>`;
  content += `<line class="chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + innerHeight}"></line>`;
  content += `<text class="chart-axis-title" x="${margin.left + innerWidth / 2}" y="${height - 14}" text-anchor="middle">${dataset.metricLabel}</text>`;
  content += `<text class="chart-axis-title" transform="translate(18 ${margin.top + innerHeight / 2}) rotate(-90)" text-anchor="middle">Speedup</text>`;

  dataset.rows.forEach((row, index) => {
    const x = scaleX(row[dataset.metricKey]);
    const y = scaleY(row.speedup);
    const radius = row.highlight ? 8 : 6;
    const dx = row.highlight ? 10 : 12;
    const dy = index % 2 === 0 ? -10 : 16;
    content += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${row.color}" stroke="#ffffff" stroke-width="3"></circle>`;
    content += `<text class="chart-point-label" x="${x + dx}" y="${y + dy}" fill="${row.color}">${row.method}</text>`;
  });

  svg.innerHTML = content;
}

function renderTable(tableEl, columns, rows, options = {}) {
  const { groupLabel = null } = options;
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  thead.innerHTML = `<tr>${columns.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;

  if (groupLabel) {
    const groupRow = document.createElement("tr");
    groupRow.className = "group-row";
    groupRow.innerHTML = `<td colspan="${columns.length}">${groupLabel}</td>`;
    tbody.appendChild(groupRow);
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    if (row.highlight) tr.classList.add("highlight");
    tr.innerHTML = columns.map((column) => {
      const value = formatCellValue(column, row[column.key]);
      return column.key === "method"
        ? `<td><strong>${value}</strong></td>`
        : `<td>${value}</td>`;
    }).join("");
    tbody.appendChild(tr);
  });

  tableEl.innerHTML = "";
  tableEl.appendChild(thead);
  tableEl.appendChild(tbody);
}

function renderResultsTable(dataset) {
  document.getElementById("tableTitle").textContent = dataset.tableTitle;
  document.getElementById("tableNote").textContent = dataset.tableNote;
  renderTable(document.getElementById("resultsTable"), dataset.columns, dataset.rows);
}

function renderStandardResults(dataset) {
  document.getElementById("resultsStandardView").classList.remove("hidden");
  document.getElementById("resultsAllView").classList.add("hidden");
  document.getElementById("resultsTitle").textContent = dataset.title;
  document.getElementById("resultsDescription").textContent = dataset.description;
  document.getElementById("resultsHeadline").textContent = dataset.headline;
  document.getElementById("frontierTitle").textContent = dataset.frontierTitle;
  document.getElementById("frontierDescription").textContent = dataset.frontierDescription;
  renderResultsStats(dataset);
  renderLegend(dataset.rows);
  renderFrontierChart(dataset);
  renderLatencyBars(dataset.rows);
  renderResultsTable(dataset);
}

function groupedGenerationData() {
  const order = ["cosmos_i2w_2b", "cosmos_i2w_14b", "cosmos_t2w_2b", "cosmos_t2w_14b", "wan_t2w_13b", "wan_i2w_14b", "supp_t2w_cosmos2b", "supp_i2w_cosmos2b"];
  return order.map((id) => {
    const dataset = getDataset(id);
    return {
      label: dataset.title,
      rows: dataset.rows.map((row) => ({
        method: row.method,
        domain: row.domain,
        quality: row.quality,
        overall: row.overall,
        latency: row.latency,
        speedup: row.speedup,
        highlight: row.highlight
      }))
    };
  });
}

function groupedRoboticsData() {
  const order = ["egodex_wan14b", "egodex_cosmos2b", "egodex_dreamdojo2b"];
  return order.map((id) => {
    const dataset = getDataset(id);
    return {
      label: dataset.title,
      rows: dataset.rows.map((row) => ({
        method: row.method,
        psnr: row.psnr,
        ssim: row.ssim,
        lpips: row.lpips,
        latency: row.latency,
        speedup: row.speedup,
        highlight: row.highlight
      }))
    };
  });
}

function groupedSummaryData() {
  const order = [
    "cosmos_i2w_2b",
    "cosmos_i2w_14b",
    "cosmos_t2w_2b",
    "cosmos_t2w_14b",
    "wan_t2w_13b",
    "wan_i2w_14b",
    "egodex_wan14b",
    "egodex_cosmos2b",
    "egodex_dreamdojo2b",
    "supp_t2w_cosmos2b",
    "supp_i2w_cosmos2b"
  ];

  const familyNames = {
    cosmos: "Cosmos",
    wan: "WAN2.1",
    egodex: "EgoDex",
    supplementary: "Supplementary"
  };

  return order.map((id) => {
    const dataset = getDataset(id);
    const baseline = getRow(dataset, "Baseline");
    const wc = getRow(dataset, "WorldCache");
    const metricDigits = dataset.metricKey === "psnr" ? 2 : (dataset.columns === avgColumns4 ? 4 : 3);
    return {
      benchmark: familyNames[dataset.family] || dataset.family,
      setting: dataset.title.replace(/^Supplementary · /, ""),
      metric: dataset.metricLabel,
      metricPair: `${formatMetric(baseline[dataset.metricKey], metricDigits)} → ${formatMetric(wc[dataset.metricKey], metricDigits)}`,
      latencyPair: `${formatLatency(baseline.latency)} → ${formatLatency(wc.latency)}`,
      speedupText: formatSpeedup(wc.speedup),
      retentionText: `${retentionPercent(dataset).toFixed(1)}%`
    };
  });
}

function renderGroupedTables() {
  const summaryTable = document.getElementById("allSummaryTable");
  const generationTable = document.getElementById("allGenerationTable");
  const roboticsTable = document.getElementById("allRoboticsTable");

  summaryTable.innerHTML = "";
  const summaryHead = document.createElement("thead");
  summaryHead.innerHTML = `<tr>${summaryColumns.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;
  const summaryBody = document.createElement("tbody");
  groupedSummaryData().forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = summaryColumns.map((column) => `<td>${row[column.key]}</td>`).join("");
    summaryBody.appendChild(tr);
  });
  summaryTable.appendChild(summaryHead);
  summaryTable.appendChild(summaryBody);

  generationTable.innerHTML = "";
  const genHead = document.createElement("thead");
  genHead.innerHTML = `<tr>${avgColumns4.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;
  const genBody = document.createElement("tbody");
  groupedGenerationData().forEach((group) => {
    const groupRow = document.createElement("tr");
    groupRow.className = "group-row";
    groupRow.innerHTML = `<td colspan="${avgColumns4.length}">${group.label}</td>`;
    genBody.appendChild(groupRow);
    group.rows.forEach((row) => {
      const tr = document.createElement("tr");
      if (row.highlight) tr.classList.add("highlight");
      tr.innerHTML = avgColumns4.map((column) => {
        const value = formatCellValue(column, row[column.key]);
        return column.key === "method" ? `<td><strong>${value}</strong></td>` : `<td>${value}</td>`;
      }).join("");
      genBody.appendChild(tr);
    });
  });
  generationTable.appendChild(genHead);
  generationTable.appendChild(genBody);

  roboticsTable.innerHTML = "";
  const roboHead = document.createElement("thead");
  roboHead.innerHTML = `<tr>${egoDexColumns.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;
  const roboBody = document.createElement("tbody");
  groupedRoboticsData().forEach((group) => {
    const groupRow = document.createElement("tr");
    groupRow.className = "group-row";
    groupRow.innerHTML = `<td colspan="${egoDexColumns.length}">${group.label}</td>`;
    roboBody.appendChild(groupRow);
    group.rows.forEach((row) => {
      const tr = document.createElement("tr");
      if (row.highlight) tr.classList.add("highlight");
      tr.innerHTML = egoDexColumns.map((column) => {
        const value = formatCellValue(column, row[column.key]);
        return column.key === "method" ? `<td><strong>${value}</strong></td>` : `<td>${value}</td>`;
      }).join("");
      roboBody.appendChild(tr);
    });
  });
  roboticsTable.appendChild(roboHead);
  roboticsTable.appendChild(roboBody);
}

function renderAllResults() {
  document.getElementById("resultsStandardView").classList.add("hidden");
  document.getElementById("resultsAllView").classList.remove("hidden");
  renderGroupedTables();
}

function renderResults() {
  if (currentFamily === "all") {
    renderAllResults();
    return;
  }
  renderStandardResults(getDataset(currentDataset));
}

function buildBudgetStepPills() {
  const container = document.getElementById("budgetStepPills");
  container.innerHTML = "";
  budgetData.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = index === currentBudgetIndex ? "active" : "";
    button.textContent = `${item.steps} steps`;
    button.addEventListener("click", () => {
      currentBudgetIndex = index;
      buildBudgetStepPills();
      renderBudget();
    });
    container.appendChild(button);
  });
}

function renderBudgetStats(item) {
  const container = document.getElementById("budgetStats");
  const cards = [
    { label: "Denoising steps", value: `${item.steps}`, note: "Step budget" },
    { label: "Baseline latency", value: `${item.baselineLatency.toFixed(1)} s`, note: "Reference runtime" },
    { label: "DiCache", value: formatSpeedup(item.dicacheSpeedup), note: `${item.dicacheLatency.toFixed(1)} s` },
    { label: "WorldCache", value: formatSpeedup(item.worldcacheSpeedup), note: `${item.worldcacheLatency.toFixed(1)} s` }
  ];
  container.innerHTML = "";
  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "metric-card";
    article.innerHTML = `<span>${card.label}</span><strong>${card.value}</strong><small>${card.note}</small>`;
    container.appendChild(article);
  });
}

function renderBudgetChart() {
  const svg = document.getElementById("budgetChart");
  const width = 620;
  const height = 340;
  const margin = { top: 24, right: 66, bottom: 54, left: 66 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const latencyMax = Math.max(...budgetData.map((item) => item.baselineLatency));
  const speedupMax = 3.5;
  const groupWidth = innerWidth / budgetData.length;
  const barWidth = Math.min(24, groupWidth / 5);

  const scaleYLatency = (value) => margin.top + innerHeight - (value / (latencyMax * 1.12)) * innerHeight;
  const scaleYSpeedup = (value) => margin.top + innerHeight - (value / speedupMax) * innerHeight;

  let content = "";

  for (let i = 0; i <= 4; i += 1) {
    const latencyValue = (i / 4) * latencyMax;
    const y = scaleYLatency(latencyValue);
    content += `<line class="chart-grid" x1="${margin.left}" y1="${y}" x2="${margin.left + innerWidth}" y2="${y}"></line>`;
    content += `<text class="chart-label" x="${margin.left - 12}" y="${y + 4}" text-anchor="end">${latencyValue.toFixed(0)}</text>`;
  }

  for (let i = 0; i <= 4; i += 1) {
    const speedValue = (i / 4) * speedupMax;
    const y = scaleYSpeedup(speedValue);
    content += `<text class="chart-label" x="${margin.left + innerWidth + 12}" y="${y + 4}" fill="#f97316">${speedValue.toFixed(1)}</text>`;
  }

  content += `<line class="chart-axis" x1="${margin.left}" y1="${margin.top + innerHeight}" x2="${margin.left + innerWidth}" y2="${margin.top + innerHeight}"></line>`;
  content += `<line class="chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + innerHeight}"></line>`;
  content += `<line class="chart-axis" x1="${margin.left + innerWidth}" y1="${margin.top}" x2="${margin.left + innerWidth}" y2="${margin.top + innerHeight}"></line>`;
  content += `<text class="chart-axis-title" transform="translate(18 ${margin.top + innerHeight / 2}) rotate(-90)" text-anchor="middle">Latency (s)</text>`;
  content += `<text class="chart-axis-title" transform="translate(${width - 16} ${margin.top + innerHeight / 2}) rotate(-90)" text-anchor="middle" fill="#f97316">Speedup (×)</text>`;
  content += `<text class="chart-axis-title" x="${margin.left + innerWidth / 2}" y="${height - 12}" text-anchor="middle">Number of denoising steps</text>`;

  const diCachePoints = [];
  const worldCachePoints = [];

  budgetData.forEach((item, index) => {
    const groupX = margin.left + index * groupWidth + groupWidth / 2;
    const x0 = groupX - barWidth * 1.5;
    const x1 = groupX - barWidth * 0.2;
    const x2 = groupX + barWidth * 1.1;

    if (index === currentBudgetIndex) {
      content += `<rect x="${groupX - groupWidth / 2 + 8}" y="${margin.top + 4}" width="${groupWidth - 16}" height="${innerHeight - 8}" rx="16" fill="rgba(37,99,235,0.06)" stroke="rgba(37,99,235,0.16)"/>`;
    }

    const yBase = scaleYLatency(item.baselineLatency);
    const yDi = scaleYLatency(item.dicacheLatency);
    const yWc = scaleYLatency(item.worldcacheLatency);
    const barBottom = margin.top + innerHeight;

    content += `<rect x="${x0}" y="${yBase}" width="${barWidth}" height="${barBottom - yBase}" rx="10" fill="#A8B4C5"></rect>`;
    content += `<rect x="${x1}" y="${yDi}" width="${barWidth}" height="${barBottom - yDi}" rx="10" fill="#5B93C9"></rect>`;
    content += `<rect x="${x2}" y="${yWc}" width="${barWidth}" height="${barBottom - yWc}" rx="10" fill="#14B8A6"></rect>`;
    content += `<text class="chart-label" x="${groupX}" y="${barBottom + 24}" text-anchor="middle">${item.steps}</text>`;

    diCachePoints.push({ x: groupX, y: scaleYSpeedup(item.dicacheSpeedup), label: formatSpeedup(item.dicacheSpeedup) });
    worldCachePoints.push({ x: groupX, y: scaleYSpeedup(item.worldcacheSpeedup), label: formatSpeedup(item.worldcacheSpeedup) });
  });

  const diPath = diCachePoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const wcPath = worldCachePoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");

  content += `<path d="${diPath}" fill="none" stroke="#5B93C9" stroke-width="3" stroke-dasharray="6 6"></path>`;
  content += `<path d="${wcPath}" fill="none" stroke="#F97316" stroke-width="3" stroke-dasharray="8 6"></path>`;

  diCachePoints.forEach((point, index) => {
    const isActive = index === currentBudgetIndex;
    content += `<rect x="${point.x - 4}" y="${point.y - 4}" width="8" height="8" fill="#5B93C9" stroke="#ffffff" stroke-width="2"></rect>`;
    content += `<text class="chart-note" x="${point.x}" y="${point.y - 12}" text-anchor="middle" fill="#5B93C9">${point.label}</text>`;
    if (isActive) {
      content += `<circle cx="${point.x}" cy="${point.y}" r="12" fill="none" stroke="rgba(91,147,201,0.25)" stroke-width="8"></circle>`;
    }
  });

  worldCachePoints.forEach((point, index) => {
    const isActive = index === currentBudgetIndex;
    content += `<circle cx="${point.x}" cy="${point.y}" r="6" fill="#F97316" stroke="#ffffff" stroke-width="2"></circle>`;
    content += `<text class="chart-note" x="${point.x}" y="${point.y - 14}" text-anchor="middle" fill="#F97316">${point.label}</text>`;
    if (isActive) {
      content += `<circle cx="${point.x}" cy="${point.y}" r="14" fill="none" stroke="rgba(249,115,22,0.20)" stroke-width="8"></circle>`;
    }
  });

  svg.innerHTML = content;
}

function renderBudget() {
  const item = budgetData[currentBudgetIndex];
  renderBudgetStats(item);
  renderBudgetChart();
}

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeButton = document.getElementById("lightboxClose");

  document.querySelectorAll(".zoomable").forEach((button) => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.image;
      lightboxCaption.textContent = button.dataset.caption || "";
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.14 });

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function initNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        // Handle buttons with a child <span> (cite-copy-btn) vs plain text buttons
        const labelEl = button.querySelector("span");
        if (labelEl) {
          const original = labelEl.textContent;
          labelEl.textContent = "Copied!";
          button.classList.add("copied");
          setTimeout(() => {
            labelEl.textContent = original;
            button.classList.remove("copied");
          }, 1500);
        } else {
          const original = button.textContent;
          button.textContent = "Copied";
          setTimeout(() => {
            button.textContent = original;
          }, 1200);
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
}

function init() {
  buildModuleTabs();
  renderModuleDetail();
  buildResultsTabs();
  renderResults();
  buildBudgetStepPills();
  renderBudget();
  initLightbox();
  initReveal();
  initNav();
  initCopyButtons();
}

document.addEventListener("DOMContentLoaded", init);
