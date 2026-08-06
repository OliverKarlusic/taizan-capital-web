/**
 * Chart theme — palette validated against the dark chart surface (#0e1012)
 * with the dataviz six-checks validator (lightness band, chroma floor, CVD
 * ΔE, normal-vision floor, contrast): all-pairs PASS in both modes.
 *
 * The series hues are deliberately a shade deeper than the champagne brand
 * accent: brand gold (#c6a664) sits above the lightness band and fails CVD
 * separation against the market series, so data gets its own stepped gold.
 */
export const chart = {
  surface: "#0e1012",
  series1: "#b4902d", // gold — Taizan mandate
  series2: "#5183ce", // steel — benchmark / broad market
  series3: "#b54630", // terracotta — stress accents
  grid: "rgba(244, 243, 238, 0.07)",
  textPrimary: "#f4f3ee",
  textSecondary: "#a8b0b8",
  axis: { fontSize: 11, fill: "#a8b0b8" },
};

export interface LegendItem {
  label: string;
  color: string;
}
